// @ts-nocheck — Deno edge function; VS Code TS checker lacks Deno types
// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * runway-generate-video — Standalone Runway ML Edge Function
 *
 * Production-grade async pipeline:
 *  1. Accept prompt (text or image URL) + config
 *  2. Submit generation task to Runway Gen-3 Alpha Turbo
 *  3. Poll with exponential backoff until SUCCEEDED / FAILED / timeout
 *  4. Download rendered video from Runway CDN
 *  5. Re-upload to Supabase storage (avoids CORS, permanent hosting)
 *  6. Save to gallery_items table
 *  7. Return the playable Supabase-hosted URL
 *
 * Headers required by Runway:
 *   Authorization: Bearer ${RUNWAY_API_KEY}
 *   X-Runway-Version: 2024-11-06
 *   Content-Type: application/json
 *
 * Environment variables (Lovable Cloud Secrets):
 *   RUNWAY_API_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_ANON_KEY
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RUNWAY_BASE = "https://api.dev.runwayml.com/v1";
const RUNWAY_VERSION = "2024-11-06";
const MAX_POLL_MS = 600_000; // 10 minutes absolute max

/** Exponential backoff intervals: 5s, 5s, 7s, 10s, 15s, then 15s repeating */
const BACKOFF_MS = [5000, 5000, 7000, 10000, 15000];

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    /* ── Validate Runway API key ── */
    const RUNWAY_API_KEY = Deno.env.get("RUNWAY_API_KEY");
    if (!RUNWAY_API_KEY) {
      return jsonResp(
        { error: "Video engine not connected", code: "NO_RUNWAY_KEY" },
        503,
      );
    }

    /* ── Auth ── */
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer "))
      return jsonResp({ error: "Unauthorized" }, 401);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: tokenData, error: authErr } =
      await supabaseUser.auth.getUser();
    if (authErr || !tokenData?.user)
      return jsonResp({ error: "Unauthorized" }, 401);

    const userId = tokenData.user.id;

    /* ── Parse request body ── */
    const body = await req.json();
    const {
      promptText,
      promptImage, // optional — image URL for image-to-video
      ratio = "16:9",
      duration = 5,
      model = "gen3a_turbo",
      title = "Runway Video",
      storyId,
      jobId, // optional — if updating an existing video_jobs row
    } = body;

    if (!promptText && !promptImage) {
      return jsonResp({ error: "Missing promptText or promptImage" }, 400);
    }

    if (jobId !== undefined && (typeof jobId !== "string" || !jobId.trim())) {
      return jsonResp({ error: "Invalid jobId" }, 400);
    }

    // A supplied job ID is untrusted. The admin client bypasses RLS, so
    // refuse unrelated jobs before spending video-generation credits.
    if (jobId) {
      const { data: ownedJob, error: lookupError } = await supabaseAdmin
        .from("video_jobs")
        .select("id")
        .eq("id", jobId)
        .eq("user_id", userId)
        .maybeSingle();

      if (lookupError) return jsonResp({ error: "Unable to verify video job" }, 500);
      if (!ownedJob) return jsonResp({ error: "Video job not found" }, 404);
    }

    /* ── Ensure storage bucket ── */
    await supabaseAdmin.storage
      .createBucket("video-assets", { public: true, fileSizeLimit: 104857600 })
      .catch(() => {});

    /* ═══════════════════════════════════════════
     * STEP 1 — Submit Runway generation task
     * ═══════════════════════════════════════════ */
    const runwayHeaders = {
      Authorization: `Bearer ${RUNWAY_API_KEY}`,
      "Content-Type": "application/json",
      "X-Runway-Version": RUNWAY_VERSION,
    };

    // Decide endpoint: image_to_video if promptImage provided, else text-only prompt
    const endpoint = promptImage
      ? `${RUNWAY_BASE}/image_to_video`
      : `${RUNWAY_BASE}/image_to_video`; // Runway Gen-3 always uses image_to_video

    const taskBody: Record<string, unknown> = {
      model,
      duration,
      ratio,
    };

    if (promptImage) {
      taskBody.promptImage = promptImage;
      if (promptText) taskBody.promptText = promptText;
    } else {
      // For text-only, we still need promptText
      taskBody.promptText = promptText;
    }

    if (jobId) {
      await updateJob(supabaseAdmin, jobId, {
        status: "processing",
        progress: 5,
        step_label: "Submitting to Runway AI…",
      });
    }

    const createRes = await fetch(endpoint, {
      method: "POST",
      headers: runwayHeaders,
      body: JSON.stringify(taskBody),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("Runway create failed:", createRes.status, errText);

      if (createRes.status === 401 || createRes.status === 403) {
        return jsonResp({ error: "Runway API key invalid or expired" }, 401);
      }
      if (createRes.status === 429) {
        return jsonResp({ error: "Runway rate limit — try again shortly" }, 429);
      }

      if (jobId) await failJob(supabaseAdmin, jobId, `Runway error: ${createRes.status}`);
      return jsonResp({ error: `Runway API error: ${createRes.status}` }, 502);
    }

    const createData = await createRes.json();
    const taskId = createData.id;

    if (!taskId) {
      if (jobId) await failJob(supabaseAdmin, jobId, "No task ID returned from Runway");
      return jsonResp({ error: "No task ID from Runway" }, 502);
    }

    if (jobId) {
      await updateJob(supabaseAdmin, jobId, {
        progress: 10,
        step_label: "AI generating video…",
      });
    }

    /* ═══════════════════════════════════════════
     * STEP 2 — Poll with exponential backoff
     * ═══════════════════════════════════════════ */
    const pollStart = Date.now();
    let pollIdx = 0;
    let taskStatus = "PENDING";
    let outputUrl: string | null = null;
    let failureReason: string | null = null;

    while (Date.now() - pollStart < MAX_POLL_MS) {
      const delay = BACKOFF_MS[Math.min(pollIdx, BACKOFF_MS.length - 1)];
      await sleep(delay);
      pollIdx++;

      try {
        const pollRes = await fetch(`${RUNWAY_BASE}/tasks/${taskId}`, {
          headers: {
            Authorization: `Bearer ${RUNWAY_API_KEY}`,
            "X-Runway-Version": RUNWAY_VERSION,
          },
        });

        if (!pollRes.ok) {
          console.warn(`Runway poll HTTP ${pollRes.status}, retrying…`);
          continue;
        }

        const pollData = await pollRes.json();
        taskStatus = pollData.status;

        // Update progress in DB
        if (jobId) {
          const elapsed = Date.now() - pollStart;
          const progressPct = Math.min(10 + Math.round((elapsed / MAX_POLL_MS) * 75), 85);
          await updateJob(supabaseAdmin, jobId, {
            progress: progressPct,
            step_label: `AI generating video… ${taskStatus}`,
          });
        }

        if (taskStatus === "SUCCEEDED") {
          outputUrl = pollData.output?.[0] || null;
          break;
        }

        if (taskStatus === "FAILED") {
          failureReason =
            pollData.failure || pollData.failureCode || "Runway generation failed";
          break;
        }

        // THROTTLED — just wait and retry
        if (taskStatus === "THROTTLED") {
          console.log("Runway task throttled, waiting…");
        }
      } catch (err) {
        console.warn("Runway poll network error, retrying:", err);
        // Continue polling on network errors
      }
    }

    /* ── Handle timeout ── */
    if (taskStatus !== "SUCCEEDED" && taskStatus !== "FAILED") {
      if (jobId) await failJob(supabaseAdmin, jobId, "Video generation timed out (10 min)");
      return jsonResp(
        { error: "Video generation timed out. Please try again.", taskId },
        504,
      );
    }

    /* ── Handle failure ── */
    if (taskStatus === "FAILED") {
      if (jobId) await failJob(supabaseAdmin, jobId, failureReason || "Runway generation failed");
      return jsonResp(
        { error: failureReason || "Video generation failed", taskId },
        502,
      );
    }

    if (!outputUrl) {
      if (jobId) await failJob(supabaseAdmin, jobId, "No output URL from Runway");
      return jsonResp({ error: "No video output from Runway" }, 502);
    }

    /* ═══════════════════════════════════════════
     * STEP 3 — Download video & re-upload to storage
     * ═══════════════════════════════════════════ */
    if (jobId) {
      await updateJob(supabaseAdmin, jobId, {
        progress: 88,
        step_label: "Saving video to cloud…",
      });
    }

    let finalVideoUrl = outputUrl; // fallback to Runway CDN URL

    try {
      const videoRes = await fetch(outputUrl);
      if (videoRes.ok) {
        const videoBytes = new Uint8Array(await videoRes.arrayBuffer());
        const contentType =
          videoRes.headers.get("content-type") || "video/mp4";
        const ext = contentType.includes("mp4") ? "mp4" : "webm";

        const storagePath = `runway/${userId}/${taskId}.${ext}`;

        const { error: uploadErr } = await supabaseAdmin.storage
          .from("video-assets")
          .upload(storagePath, videoBytes, {
            contentType,
            upsert: true,
          });

        if (!uploadErr) {
          const { data: pubUrl } = supabaseAdmin.storage
            .from("video-assets")
            .getPublicUrl(storagePath);
          finalVideoUrl = pubUrl.publicUrl;
        } else {
          console.error("Storage upload failed, using Runway CDN URL:", uploadErr);
        }
      }
    } catch (dlErr) {
      console.error("Video download/reupload failed, using Runway CDN URL:", dlErr);
    }

    /* ═══════════════════════════════════════════
     * STEP 4 — Save to gallery + update job
     * ═══════════════════════════════════════════ */
    // Save to gallery_items
    await supabaseAdmin
      .from("gallery_items")
      .upsert(
        {
          user_id: userId,
          type: "video",
          source: "runway",
          job_id: jobId || taskId,
          adventure_id: storyId || null,
          title,
          output_url: finalVideoUrl,
          duration_seconds: duration,
          status: "ready",
          metadata: {
            provider: "runway",
            model,
            taskId,
            ratio,
            promptText: (promptText || "").slice(0, 500),
          },
        },
        { onConflict: "job_id" },
      )
      .catch((err) => console.error("Gallery save error:", err));

    // Update video_jobs if we have a jobId
    if (jobId) {
      await updateJob(supabaseAdmin, jobId, {
        status: "complete",
        progress: 100,
        step_label: "Ready to watch!",
        output_url: finalVideoUrl,
      });
    }

    return jsonResp({
      success: true,
      videoUrl: finalVideoUrl,
      taskId,
      duration,
    });
  } catch (e) {
    console.error("runway-generate-video error:", e);
    return jsonResp(
      { error: e instanceof Error ? e.message : "Unknown error" },
      500,
    );
  }
});

/* ── Helpers ── */

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function updateJob(
  admin: ReturnType<typeof createClient>,
  jobId: string,
  fields: Record<string, unknown>,
) {
  await admin
    .from("video_jobs")
    .update(fields)
    .eq("id", jobId)
    .catch(() => {});
}

async function failJob(
  admin: ReturnType<typeof createClient>,
  jobId: string,
  reason: string,
) {
  await admin
    .from("video_jobs")
    .update({ status: "failed", error: reason })
    .eq("id", jobId)
    .catch(() => {});
}
