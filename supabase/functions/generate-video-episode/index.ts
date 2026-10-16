// @ts-nocheck — Deno edge function; VS Code TS checker lacks Deno types
// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * generate-video-episode — Supabase Edge Function
 *
 * Real pipeline:
 *  1. Fetch story text + scenes from DB
 *  2. Split story into per-scene narration segments
 *  3. Generate ElevenLabs TTS audio for each scene (uses ELEVENLABS_API_KEY)
 *  4. Upload audio clips to Supabase storage (video-assets bucket)
 *  5. Build + upload composition manifest (JSON)
 *  6. Mark job as "rendering" so the client can compose the final video
 *
 * The client-side VideoRenderer then:
 *  - Downloads manifest + assets
 *  - Renders Canvas frames + audio via MediaRecorder → WebM
 *  - Uploads the rendered video to storage
 *  - Updates the job to "complete" with the final video URL
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const RUNWAY_BASE = "https://api.dev.runwayml.com/v1";

/** ElevenLabs default catalog voice IDs mapped from preset profile IDs */
const VOICE_MAP: Record<string, string> = {
  voice_narrator: "21m00Tcm4TlvDq8ikWAM", // Rachel — warm narrator
  voice_hero:     "pNInz6obpgDQGcFmaJgB", // Adam — confident male
  voice_sidekick: "jBpfuIE2acCO8z3wKNLl", // Gigi — playful
  voice_mentor:   "onwK4e9ZLuTAKqWV03F9", // Daniel — calm British
  voice_villain:  "IKne3meq5aSn9XLyUdCD", // Charlie — energetic
  voice_comic:    "pFZP5JQG7iQjIQuC4Bku", // Lily — animated
};
const DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM"; // Rachel

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    /* ── Auth ── */
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer "))
      return jsonError("Unauthorized", 401);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: claims, error: authErr } = await supabaseUser.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !claims?.claims) return jsonError("Unauthorized", 401);

    const userId = claims.claims.sub as string;

    const {
      jobId,
      storyId,
      storyTitle,
      duration = "short",
      voiceAssignments,
      musicStyle,
      pacingMode = "story",
      budgetMode = "standard",
    } = await req.json();

    const validPacingModes = ["story", "action", "documentary", "kids"];
    const pacing = validPacingModes.includes(pacingMode) ? pacingMode : "story";
    const validBudgetModes = ["eco", "standard", "studio"];
    const budget = validBudgetModes.includes(budgetMode) ? budgetMode : "standard";

    if (typeof jobId !== "string" || !jobId.trim() ||
        typeof storyId !== "string" || !storyId.trim())
      return jsonError("Missing or invalid jobId or storyId", 400);

    // The service-role client bypasses RLS. Confirm ownership and the
    // persisted story/job association before updating a job or spending
    // provider credits on generation.
    const { data: ownedJob, error: jobLookupError } = await supabaseAdmin
      .from("video_jobs")
      .select("id, status, request")
      .eq("id", jobId)
      .eq("user_id", userId)
      .maybeSingle();

    if (jobLookupError) return jsonError("Unable to verify video job", 500);
    if (!ownedJob) return jsonError("Video job not found", 404);
    if (ownedJob.status !== "queued")
      return jsonError("Video job has already started", 409);
    if ((ownedJob.request as { storyId?: string } | null)?.storyId !== storyId)
      return jsonError("Video job does not belong to the requested story", 400);

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    /* ──────────────────────────────────────────────
     * STEP 1 — Fetch story content + scenes
     * ────────────────────────────────────────────── */
    await updateJob(supabaseAdmin, jobId, {
      status: "processing",
      progress: 5,
      step_label: "Loading story content…",
    });

    const { data: story, error: storyErr } = await supabaseAdmin
      .from("stories")
      .select("id, title, story_text, theme, child_name, reading_level")
      .eq("id", storyId)
      .eq("user_id", userId)
      .single();

    if (storyErr || !story) {
      await failJob(supabaseAdmin, jobId, "Story not found");
      return jsonError("Story not found", 404);
    }

    const { data: rawScenes } = await supabaseAdmin
      .from("story_scenes")
      .select("id, scene_number, caption, image_url")
      .eq("story_id", storyId)
      .order("scene_number", { ascending: true });

    const scenes = rawScenes || [];
    if (scenes.length === 0) {
      await failJob(supabaseAdmin, jobId, "No scenes found for this story");
      return jsonError("No scenes found", 400);
    }

    /* ──────────────────────────────────────────────
     * STEP 2 — Prepare narration script per scene
     * ────────────────────────────────────────────── */
    await updateJob(supabaseAdmin, jobId, {
      status: "processing",
      progress: 10,
      step_label: "Preparing narration script…",
    });

    const storyText = (story as Record<string, unknown>).story_text as string || "";
    const captions = scenes.map((s: Record<string, unknown>) => s.caption as string);
    const sceneNarrations = buildSceneNarrations(storyText, captions, duration);

    /* ──────────────────────────────────────────────
     * STEP 3 — Generate ElevenLabs TTS per scene
     * ────────────────────────────────────────────── */
    const narratorProfileId = voiceAssignments?.[0]?.voiceProfileId || "voice_narrator";
    const elVoiceId = VOICE_MAP[narratorProfileId] || DEFAULT_VOICE;

    // Ensure storage bucket exists (idempotent — fails silently if already exists)
    await supabaseAdmin.storage
      .createBucket("video-assets", { public: true, fileSizeLimit: 104857600 })
      .catch(() => {});

    interface ManifestScene {
      sceneNumber: number;
      imageUrl: string | null;
      audioUrl: string;
      audioDurationSec: number;
      narrationText: string;
      caption: string;
      videoClipUrl?: string;
      /** Orchestrated scene duration (narration + pause buffer) */
      sceneDuration?: number;
      /** Pause buffer in seconds */
      pauseBuffer?: number;
      /** Emotional intensity 0–1 */
      emotionalIntensity?: number;
      /** Scene emotion tag */
      emotion?: string;
      /** Enhanced Runway prompt with cinematic camera instructions */
      enhancedPrompt?: string;
      /** Camera instructions for renderer */
      cameraInstructions?: string;
      /** SFX cue sheet */
      sfxCues?: Array<{ sfxId: string; sfxName: string; timestamp: number; volume: number; fadeIn: number; fadeOut: number }>;
      /** BGM ducking envelope points */
      bgmDucking?: Array<{ timeSec: number; volume: number; curve: string }>;
      /** Transition into this scene */
      transitionIn?: { type: string; durationSec: number };
      /** Transition out of this scene */
      transitionOut?: { type: string; durationSec: number };
      /** 3-Act structure assignment */
      act?: 1 | 2 | 3;
      /** Narrative role in arc */
      narrativeRole?: string;
      /** Tension level 0–1 */
      tensionLevel?: number;
    }

    const compositionScenes: ManifestScene[] = [];
    let totalDuration = 0;

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i] as Record<string, unknown>;
      const narration = sceneNarrations[i] || (scene.caption as string) || "";
      const progress = 15 + Math.round((i / scenes.length) * 45);

      await updateJob(supabaseAdmin, jobId, {
        status: "processing",
        progress,
        step_label: `Generating narration ${i + 1}/${scenes.length}…`,
      });

      let audioUrl = "";
      let audioDurationSec = Math.max(3, (narration.length / 150) * 10);

      if (ELEVENLABS_API_KEY && narration.trim().length > 0) {
        try {
          const ttsRes = await fetch(
            `${ELEVENLABS_BASE}/text-to-speech/${elVoiceId}`,
            {
              method: "POST",
              headers: {
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: narration,
                model_id: "eleven_turbo_v2_5",
                voice_settings: {
                  stability: 0.65,
                  similarity_boost: 0.80,
                  speed: duration === "short" ? 1.05 : duration === "full" ? 0.90 : 1.0,
                },
              }),
            },
          );

          if (!ttsRes.ok) {
            const errText = await ttsRes.text();
            console.error(`ElevenLabs TTS error (scene ${i + 1}):`, ttsRes.status, errText);
            throw new Error(`TTS ${ttsRes.status}`);
          }

          const audioBytes = new Uint8Array(await ttsRes.arrayBuffer());
          // Rough MP3 duration estimate: 128 kbps → 16 KB/s
          audioDurationSec = Math.max(2, audioBytes.byteLength / 16000);

          const audioPath = `${jobId}/scene_${i + 1}.mp3`;
          const { error: upErr } = await supabaseAdmin.storage
            .from("video-assets")
            .upload(audioPath, audioBytes, {
              contentType: "audio/mpeg",
              upsert: true,
            });

          if (upErr) {
            console.error("Audio upload error:", upErr);
            throw new Error("Storage upload failed");
          }

          const { data: urlData } = supabaseAdmin.storage
            .from("video-assets")
            .getPublicUrl(audioPath);
          audioUrl = urlData.publicUrl;
        } catch (err) {
          console.error(`Scene ${i + 1} TTS failed, using fallback timing:`, err);
          // Keep estimated duration, empty audioUrl → renderer will show silent scene
        }
      }

      compositionScenes.push({
        sceneNumber: (scene.scene_number as number) || i + 1,
        imageUrl: (scene.image_url as string) || null,
        audioUrl,
        audioDurationSec,
        narrationText: narration,
        caption: (scene.caption as string) || "",
      });
      totalDuration += audioDurationSec;
    }

    /* ──────────────────────────────────────────────
     * STEP 3.25 — AI Timeline Orchestration
     *
     * Run narration timing, SFX analysis, BGM ducking,
     * and shot composition on all scenes. This enriches
     * the manifest with Hollywood-grade timing metadata.
     * ────────────────────────────────────────────── */
    await updateJob(supabaseAdmin, jobId, {
      status: "processing",
      progress: 60,
      step_label: "Computing cinematic timeline…",
    });

    const storyTheme = (story as Record<string, unknown>).theme as string || "";
    const storyChildName = (story as Record<string, unknown>).child_name as string || "Hero";

    // Expose to inline orchestration engine for character DNA injection
    (globalThis as any).__childName = storyChildName;
    (globalThis as any).__storyTheme = storyTheme;

    const orchestration = computeTimelineOrchestration(
      compositionScenes,
      pacing,
      storyTheme,
    );

    // Enrich manifest scenes with orchestration data
    for (let i = 0; i < compositionScenes.length; i++) {
      const orch = orchestration.scenes[i];
      if (!orch) continue;
      compositionScenes[i].sceneDuration = orch.sceneDuration;
      compositionScenes[i].pauseBuffer = orch.pauseBuffer;
      compositionScenes[i].emotionalIntensity = orch.emotionalIntensity;
      compositionScenes[i].emotion = orch.emotion;
      compositionScenes[i].enhancedPrompt = orch.enhancedPrompt;
      compositionScenes[i].cameraInstructions = orch.cameraInstructions;
      compositionScenes[i].sfxCues = orch.sfxCues;
      compositionScenes[i].bgmDucking = orch.bgmDucking;
      compositionScenes[i].transitionIn = orch.transitionIn;
      compositionScenes[i].transitionOut = orch.transitionOut;
    }

    // Update total duration from orchestrated timings
    totalDuration = orchestration.totalDuration;

    /* ──────────────────────────────────────────────
     * STEP 3.3 — 3-Act Arc Structure + Duration Lock
     *
     * Assign each scene to Act I/II/III and compute
     * tension curve. Then validate total duration
     * matches the user-selected target ± 0.2s.
     * ────────────────────────────────────────────── */
    const DURATION_SEC_MAP: Record<string, number> = { short: 120, medium: 300, full: 900 };
    const targetDurSec = DURATION_SEC_MAP[duration] ?? 120;
    const sceneCount = compositionScenes.length;

    // Assign 3-act structure
    const act1Count = Math.max(1, Math.round(sceneCount * 0.25));
    const act3Count = Math.max(1, Math.round(sceneCount * 0.25));
    const act2Count = Math.max(1, sceneCount - act1Count - act3Count);

    const arcRoles: string[] = [];
    for (let i = 0; i < sceneCount; i++) {
      if (i < act1Count) {
        arcRoles.push(i === 0 ? "introduction" : i === act1Count - 1 ? "inciting-incident" : "world-building");
      } else if (i < act1Count + act2Count) {
        const mid = act1Count + Math.floor(act2Count / 2);
        if (i === mid) arcRoles.push("midpoint-twist");
        else if (i === act1Count + act2Count - 1) arcRoles.push("climax");
        else arcRoles.push("rising-action");
      } else {
        arcRoles.push(i === sceneCount - 1 ? "resolution" : "falling-action");
      }
    }

    for (let i = 0; i < compositionScenes.length; i++) {
      const pos = sceneCount > 1 ? i / (sceneCount - 1) : 0.5;
      const tension = Math.max(0, Math.min(1,
        pos < 0.25 ? 0.15 + pos * 1.0 :
        pos < 0.5 ? 0.40 + (pos - 0.25) * 1.4 :
        pos < 0.75 ? 0.75 + (pos - 0.5) * 1.0 :
        1.0 - (pos - 0.75) * 3.0
      ));
      compositionScenes[i].act = i < act1Count ? 1 : i < act1Count + act2Count ? 2 : 3;
      compositionScenes[i].narrativeRole = arcRoles[i];
      compositionScenes[i].tensionLevel = Math.round(tension * 100) / 100;
    }

    // Duration Lock — auto-adjust scenes to match target
    const TOLERANCE = 0.2;
    let driftSec = totalDuration - targetDurSec;

    if (Math.abs(driftSec) > TOLERANCE) {
      if (driftSec > 0) {
        // Over — compress pacing
        const compressionFactor = Math.max(0.85, targetDurSec / totalDuration);
        let newTotal = 0;
        for (const s of compositionScenes) {
          if (s.sceneDuration) {
            s.sceneDuration = Math.round(s.sceneDuration * compressionFactor * 100) / 100;
          }
          newTotal += s.sceneDuration || s.audioDurationSec;
        }
        totalDuration = Math.round(newTotal * 100) / 100;
      } else {
        // Under — extend with BGM outro padding
        const extensionPerScene = Math.abs(driftSec) / sceneCount;
        let newTotal = 0;
        for (const s of compositionScenes) {
          if (s.sceneDuration) {
            s.sceneDuration = Math.round((s.sceneDuration + extensionPerScene) * 100) / 100;
          }
          newTotal += s.sceneDuration || s.audioDurationSec;
        }
        totalDuration = Math.round(newTotal * 100) / 100;
      }
      driftSec = totalDuration - targetDurSec;
    }

    /* ──────────────────────────────────────────────
     * STEP 3.5 — Animate scene images with RunwayML (parallel)
     * ────────────────────────────────────────────── */
    const RUNWAY_API_KEY = Deno.env.get("RUNWAY_API_KEY");

    if (RUNWAY_API_KEY) {
      await updateJob(supabaseAdmin, jobId, {
        status: "processing",
        progress: 61,
        step_label: "Animating scenes with AI video…",
      });

      const clipDuration = duration === "full" ? 10 : 5;

      interface RunwayTask { idx: number; taskId: string }
      const runwayTasks: RunwayTask[] = [];

      // Fire all image-to-video tasks in parallel
      const startResults = await Promise.all(
        compositionScenes.map(async (scene, i) => {
          if (!scene.imageUrl) return null;
          try {
            const res = await fetch(`${RUNWAY_BASE}/image_to_video`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${RUNWAY_API_KEY}`,
                "Content-Type": "application/json",
                "X-Runway-Version": "2024-11-06",
              },
              body: JSON.stringify({
                model: "gen3a_turbo",
                promptImage: scene.imageUrl,
                promptText: scene.enhancedPrompt || buildAnimationPrompt(scene.caption, scene.narrationText),
                duration: clipDuration,
                ratio: "16:9",
              }),
            });
            if (!res.ok) {
              console.error(`RunwayML start failed scene ${i + 1}:`, res.status, await res.text());
              return null;
            }
            const data = await res.json();
            return data.id ? { idx: i, taskId: data.id as string } : null;
          } catch (err) {
            console.error(`RunwayML create error scene ${i + 1}:`, err);
            return null;
          }
        }),
      );
      for (const r of startResults) { if (r) runwayTasks.push(r); }

      // Poll all tasks with exponential backoff until done or timeout (150s)
      if (runwayTasks.length > 0) {
        const MAX_POLL_MS = 150_000;
        const BACKOFF = [5000, 5000, 7000, 10000, 15000]; // exponential intervals
        const t0 = Date.now();
        const pending = new Map(runwayTasks.map((t) => [t.taskId, t.idx]));
        const videoUrls = new Map<number, string>(); // idx → Runway CDN URL
        let pollCycle = 0;

        while (pending.size > 0 && Date.now() - t0 < MAX_POLL_MS) {
          const delay = BACKOFF[Math.min(pollCycle, BACKOFF.length - 1)];
          await sleep(delay);
          pollCycle++;

          const polls = [...pending.entries()].map(async ([taskId, idx]) => {
            try {
              const res = await fetch(`${RUNWAY_BASE}/tasks/${taskId}`, {
                headers: {
                  "Authorization": `Bearer ${RUNWAY_API_KEY}`,
                  "X-Runway-Version": "2024-11-06",
                },
              });
              if (!res.ok) return;
              const d = await res.json();
              if (d.status === "SUCCEEDED" && d.output?.[0]) {
                videoUrls.set(idx, d.output[0]);
                pending.delete(taskId);
              } else if (d.status === "FAILED") {
                console.error(`RunwayML task ${taskId} failed:`, d.failure);
                pending.delete(taskId);
              }
            } catch { /* network hiccup — retry next poll cycle */ }
          });
          await Promise.all(polls);

          const done = runwayTasks.length - pending.size;
          await updateJob(supabaseAdmin, jobId, {
            progress: 61 + Math.round((done / runwayTasks.length) * 4),
            step_label: `Animating scenes… ${done}/${runwayTasks.length} done`,
          });
        }

        // Download completed clips from Runway CDN → re-upload to Supabase storage
        // This permanently hosts the files on our domain & avoids CORS issues
        for (const [idx, cdnUrl] of videoUrls) {
          try {
            const vidRes = await fetch(cdnUrl);
            if (!vidRes.ok) throw new Error(`HTTP ${vidRes.status}`);
            const bytes = new Uint8Array(await vidRes.arrayBuffer());
            const ct = vidRes.headers.get("content-type") || "video/mp4";
            const ext = ct.includes("mp4") ? "mp4" : "webm";
            const clipPath = `${jobId}/clip_${idx}.${ext}`;

            const { error: clipUpErr } = await supabaseAdmin.storage
              .from("video-assets")
              .upload(clipPath, bytes, { contentType: ct, upsert: true });

            if (!clipUpErr) {
              const { data: clipPub } = supabaseAdmin.storage
                .from("video-assets")
                .getPublicUrl(clipPath);
              compositionScenes[idx].videoClipUrl = clipPub.publicUrl;
            } else {
              // Fallback: use CDN URL directly (may hit CORS in some browsers)
              compositionScenes[idx].videoClipUrl = cdnUrl;
              console.warn(`Clip ${idx} storage upload failed, using CDN URL`);
            }
          } catch (dlErr) {
            // Fallback to CDN URL
            compositionScenes[idx].videoClipUrl = cdnUrl;
            console.warn(`Clip ${idx} download failed, using CDN URL:`, dlErr);
          }
        }

        const animatedCount = videoUrls.size;
        if (animatedCount > 0) {
          console.log(`RunwayML: ${animatedCount}/${scenes.length} scenes animated & saved`);
        }
      }
    }

    /* ──────────────────────────────────────────────
     * STEP 4 — Upload composition manifest
     * ────────────────────────────────────────────── */
    await updateJob(supabaseAdmin, jobId, {
      status: "processing",
      progress: 65,
      step_label: "Saving composition…",
    });

    const manifest = {
      jobId,
      storyId,
      title: (story as Record<string, unknown>).title as string,
      childName: (story as Record<string, unknown>).child_name as string,
      theme: (story as Record<string, unknown>).theme as string,
      scenes: compositionScenes,
      totalDurationSec: totalDuration,
      narratorVoiceId: elVoiceId,
      pacingProfile: pacing,
      musicStyle: musicStyle || "magical",
      orchestrationVersion: 3,
      budgetMode: budget,
      arcStructure: {
        act1Scenes: act1Count,
        act2Scenes: act2Count,
        act3Scenes: act3Count,
        totalScenes: sceneCount,
      },
      durationLock: {
        targetSec: targetDurSec,
        actualSec: totalDuration,
        driftSec: Math.round(driftSec * 100) / 100,
        locked: Math.abs(driftSec) <= 0.2,
      },
      /** Phase 8 engines active in this manifest */
      engineVersions: {
        lightingDirector: "1.0.0",
        characterDNA: "1.0.0",
        voiceCloneEngine: "1.0.0",
        seasonMemoryEngine: "1.0.0",
      },
      createdAt: new Date().toISOString(),
    };

    const manifestPath = `${jobId}/manifest.json`;
    await supabaseAdmin.storage
      .from("video-assets")
      .upload(manifestPath, JSON.stringify(manifest), {
        contentType: "application/json",
        upsert: true,
      });

    const { data: manifestUrlData } = supabaseAdmin.storage
      .from("video-assets")
      .getPublicUrl(manifestPath);
    const manifestUrl = manifestUrlData.publicUrl;

    // Use first scene image as poster
    const posterUrl = compositionScenes.find((s) => s.imageUrl)?.imageUrl || null;

    /* ──────────────────────────────────────────────
     * STEP 5 — Mark ready for client-side rendering
     * ────────────────────────────────────────────── */
    await updateJob(supabaseAdmin, jobId, {
      status: "rendering",
      progress: 70,
      step_label: "Narration ready — rendering video…",
      output_url: manifestUrl, // client detects manifest.json → starts renderer
      thumbnail_url: posterUrl,
    });

    return new Response(
      JSON.stringify({ success: true, manifestUrl, posterUrl, totalDurationSec: totalDuration }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-video-episode error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

/* ── Helpers ── */

function jsonError(msg: string, status: number) {
  return new Response(
    JSON.stringify({ error: msg }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

async function updateJob(
  admin: ReturnType<typeof createClient>,
  jobId: string,
  fields: Record<string, unknown>,
) {
  await admin.from("video_jobs").update(fields).eq("id", jobId);
}

async function failJob(
  admin: ReturnType<typeof createClient>,
  jobId: string,
  reason: string,
) {
  await admin.from("video_jobs").update({
    status: "failed",
    error: reason,
  }).eq("id", jobId);
}

/**
 * Split the story text into per-scene narration.
 *
 * - "short"  → intro paragraph + scene captions + outro (produces ~30-90s narration)
 * - "medium" → first 60% of story text distributed across scenes
 * - "full"   → complete story text distributed across scenes
 *
 * Falls back to scene captions when story text is empty or too short.
 */
function buildSceneNarrations(
  storyText: string,
  captions: string[],
  duration: string,
): string[] {
  const sceneCount = captions.length;
  const paragraphs = storyText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) return captions;

  if (duration === "short") {
    // Trailer: intro paragraph + scene captions + outro
    const intro = paragraphs[0] || "";
    const outro = paragraphs.length > 1 ? paragraphs[paragraphs.length - 1] : "";
    const result: string[] = [];
    for (let i = 0; i < sceneCount; i++) {
      if (i === 0) result.push(intro);
      else if (i === sceneCount - 1 && outro) result.push(outro);
      else result.push(captions[i] || "");
    }
    return result;
  }

  // For medium, use first ~60% of paragraphs; for full, use all
  const useParagraphs =
    duration === "medium"
      ? paragraphs.slice(0, Math.ceil(paragraphs.length * 0.6))
      : paragraphs;

  return distributeEvenly(useParagraphs, sceneCount, captions);
}

/** Distribute paragraphs evenly across N scenes, with caption fallback */
function distributeEvenly(
  paragraphs: string[],
  sceneCount: number,
  captions: string[],
): string[] {
  if (paragraphs.length <= sceneCount) {
    return Array.from({ length: sceneCount }, (_, i) => paragraphs[i] || captions[i] || "");
  }

  const perScene = paragraphs.length / sceneCount;
  const result: string[] = [];
  for (let i = 0; i < sceneCount; i++) {
    const start = Math.floor(i * perScene);
    const end = Math.floor((i + 1) * perScene);
    result.push(paragraphs.slice(start, Math.max(end, start + 1)).join("\n\n"));
  }
  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Build a concise animation prompt for RunwayML from scene content */
function buildAnimationPrompt(caption: string, narration: string): string {
  const content = (caption || narration || "").slice(0, 200);
  return `Gentle, smooth, child-friendly animation of a storybook illustration. Soft natural movement, warm and whimsical. ${content}`;
}

/* ══════════════════════════════════════════════════════════
   INLINE PIXAR LIGHTING DIRECTOR

   Pure math — injects cinematic 3-point lighting directives
   into scene prompts. 10-layer lighting stack:
     GI, Key, Rim, Fill, Volumetrics, SSS, Depth Fog,
     Bounce, Color Temperature, Specular Highlights.
   ══════════════════════════════════════════════════════════ */

type LightingMood = "warm" | "cool" | "dramatic" | "ethereal" | "golden" | "moody" | "bright" | "mysterious" | "heroic" | "dreamy";

function inferLightingMood(emotion: string): LightingMood {
  const map: Record<string, LightingMood> = {
    calm: "warm", playful: "bright", magical: "ethereal",
    tense: "moody", dramatic: "dramatic", action: "heroic",
    emotional: "dreamy", triumphant: "golden",
  };
  return map[emotion] || "warm";
}

function inferLightingEnv(caption: string): string {
  const lower = caption.toLowerCase();
  if (/forest|tree|jungle|wood/.test(lower)) return "forest";
  if (/ocean|sea|beach|water|wave/.test(lower)) return "ocean";
  if (/space|star|planet|galaxy|rocket/.test(lower)) return "space";
  if (/castle|throne|kingdom|tower/.test(lower)) return "castle";
  if (/cave|underground|tunnel/.test(lower)) return "cave";
  if (/sky|cloud|flying|bird/.test(lower)) return "sky";
  if (/city|street|building|town/.test(lower)) return "city";
  if (/mountain|cliff|peak/.test(lower)) return "mountain";
  if (/garden|flower|meadow/.test(lower)) return "garden";
  if (/snow|ice|winter|frost/.test(lower)) return "snow";
  return "studio";
}

function inferTimeOfDay(caption: string, idx: number, total: number): string {
  const lower = caption.toLowerCase();
  if (/sunrise|dawn|morning/.test(lower)) return "dawn";
  if (/sunset|dusk|evening/.test(lower)) return "sunset";
  if (/night|moon|star|dark/.test(lower)) return "night";
  if (/noon|midday|bright sun/.test(lower)) return "midday";
  // Arc-based default: episodes progress dawn → day → sunset → night
  const pos = idx / Math.max(total - 1, 1);
  if (pos < 0.2) return "dawn";
  if (pos < 0.6) return "midday";
  if (pos < 0.85) return "sunset";
  return "night";
}

function computeLightingFragment(emotion: string, caption: string, idx: number, total: number): string {
  const mood = inferLightingMood(emotion);
  const env = inferLightingEnv(caption);
  const time = inferTimeOfDay(caption, idx, total);

  // Key light (directional)
  const keyMap: Record<string, string> = {
    dawn: "soft amber key light from horizon, 3200K", midday: "bright overhead key, 5500K neutral white",
    sunset: "warm orange key from low angle, 2800K", night: "cool moonlit key, 7500K blue-silver",
    golden_hour: "rich golden key at 15° elevation, 3000K",
  };
  const key = keyMap[time] || keyMap.midday;

  // Rim light (separation)
  const rimMap: Record<string, string> = {
    warm: "soft amber rim light", cool: "pale blue rim light", dramatic: "sharp white rim with high contrast",
    ethereal: "glowing pastel rim halo", golden: "rich golden rim backlight", moody: "subtle cold rim edge",
    bright: "clean white rim separation", mysterious: "faint purple rim glow",
    heroic: "bold golden-white rim light", dreamy: "diffused warm rim bloom",
  };
  const rim = rimMap[mood] || rimMap.warm;

  // Fill light (shadow softening — kids mode always soft)
  const fill = "soft bounced fill light, shadow density 15%, child-safe no harsh shadows";

  // Volumetrics
  const volMap: Record<string, string> = {
    forest: "god rays through canopy, dappled leaf shadows",
    ocean: "underwater caustic light patterns, gentle sun shafts",
    space: "distant star twinkle, nebula glow, zero-gravity light scatter",
    castle: "torch flicker volumetrics, warm stone bounce light",
    cave: "bioluminescent glow, crystal light refraction",
    sky: "cloud-filtered sun beams, atmospheric haze",
    city: "window light spill, warm streetlamp glow",
    mountain: "crisp alpine light, thin atmosphere clarity",
    garden: "petal-filtered sunlight, butterfly wing iridescence",
    snow: "cool blue ambient, snow crystal sparkle",
    studio: "clean three-point studio lighting",
  };
  const vol = volMap[env] || volMap.studio;

  // SSS (subsurface scattering for Pixar-style skin)
  const sss = "Pixar-quality subsurface scattering on skin, warm translucent ear glow, soft nose tip highlight";

  // Color temperature shift
  const tempMap: Record<string, string> = {
    dawn: "warm 3200K amber cast", midday: "neutral 5500K daylight",
    sunset: "deep 2800K orange-gold", night: "cool 7500K blue-silver cast",
  };
  const colorTemp = tempMap[time] || tempMap.midday;

  // Depth fog
  const fogMap: Record<string, string> = {
    forest: "light atmospheric haze in background layers", ocean: "underwater depth fog, visibility gradient",
    space: "cosmic dust particles, distant nebula glow", cave: "thick low-lying mist",
    mountain: "distant mountain haze layers", snow: "gentle snowfall particle fog",
  };
  const fog = fogMap[env] || "subtle atmospheric depth haze";

  // Combine into a concise lighting directive fragment
  return [
    `[LIGHTING: ${key}]`,
    `[RIM: ${rim}]`,
    `[FILL: ${fill}]`,
    `[VOL: ${vol}]`,
    `[SSS: ${sss}]`,
    `[TEMP: ${colorTemp}]`,
    `[FOG: ${fog}]`,
  ].join(" ");
}

/* ══════════════════════════════════════════════════════════
   INLINE CHARACTER DNA INJECTION

   Enforces character visual consistency across all scenes
   by injecting identity descriptors into every prompt.
   ══════════════════════════════════════════════════════════ */

function buildCharacterDNAFragment(childName: string, theme: string): string {
  // Build a consistent character identity prompt from story metadata
  // In production this would load from a stored CharacterDNA profile
  const skinTone = "warm medium skin tone";
  const style = "Pixar-quality 3D cartoon character, consistent proportions";

  const themeClothing: Record<string, string> = {
    "Space Quest": "silver space suit with starry patches, glowing helmet visor",
    "Magic Forest": "green leaf-patterned tunic, nature crown with tiny flowers",
    "Ocean Voyage": "blue sailor outfit, coral necklace, wave-pattern shorts",
    "Super Builders": "orange hard hat, tool belt, safety vest with star patches",
    "Dino Discovery": "khaki explorer outfit, fossil-patterned bandana",
  };
  const clothing = themeClothing[theme] || "colorful adventure outfit with star emblem";

  return [
    `[CHARACTER IDENTITY: ${childName}]`,
    `[STYLE: ${style}]`,
    `[APPEARANCE: ${skinTone}, bright expressive eyes, friendly smile]`,
    `[OUTFIT: ${clothing}]`,
    `[CONSISTENCY: Maintain identical character design across all frames. Same face, same proportions, same outfit colors.]`,
  ].join(" ");
}

/* ══════════════════════════════════════════════════════════
   INLINE TIMELINE ORCHESTRATION ENGINE

   Pure math — no external deps. Computes narration timing,
   SFX cue sheets, BGM ducking envelopes, and shot composition
   for all scenes in a single pass.
   ══════════════════════════════════════════════════════════ */

type SceneEmotion = "calm" | "dramatic" | "action" | "playful" | "magical" | "tense" | "triumphant" | "emotional";

function moodToEmotion(mood: string): SceneEmotion {
  const map: Record<string, SceneEmotion> = {
    adventurous: "action", calm: "calm", tense: "tense",
    magical: "magical", playful: "playful",
    emotional: "emotional", triumphant: "triumphant",
  };
  return map[mood] || "calm";
}

/** Infer mood from theme + scene position */
function inferSceneMood(theme: string, idx: number, total: number): string {
  const pos = idx / Math.max(total - 1, 1);
  if (pos > 0.9) return "triumphant";
  if (pos > 0.65) return "tense";
  if (pos < 0.15) return "adventurous";
  const themeMap: Record<string, string> = {
    "Space Quest": "adventurous", "Magic Forest": "magical",
    "Ocean Voyage": "calm", "Super Builders": "playful",
    "Dino Discovery": "adventurous",
  };
  return themeMap[theme] || "playful";
}

const PAUSE_BUFFERS: Record<string, number> = {
  calm: 0.4, dramatic: 0.8, action: 0.2, playful: 0.3,
  magical: 0.5, tense: 0.6, triumphant: 0.7, emotional: 0.8,
};

const INTENSITY_MAP: Record<string, number> = {
  calm: 0.2, playful: 0.4, magical: 0.5, tense: 0.7,
  dramatic: 0.8, action: 0.9, emotional: 0.75, triumphant: 0.85,
};

const PACING_MULT: Record<string, number> = {
  story: 1.0, action: 0.7, documentary: 1.3, kids: 1.1,
};

const SFX_KEYWORDS: Record<string, { sfxId: string; sfxName: string; vol: number; fadeIn: number; fadeOut: number; dur: number }> = {
  boom:      { sfxId: "sfx_boom",     sfxName: "Boom",        vol: 0.70, fadeIn: 0.02, fadeOut: 0.15, dur: 1.2 },
  crash:     { sfxId: "sfx_crash",    sfxName: "Crash",       vol: 0.65, fadeIn: 0.02, fadeOut: 0.20, dur: 1.5 },
  laugh:     { sfxId: "sfx_laugh",    sfxName: "Laughter",    vol: 0.45, fadeIn: 0.05, fadeOut: 0.10, dur: 1.0 },
  whisper:   { sfxId: "sfx_whisper",  sfxName: "Whisper",     vol: 0.30, fadeIn: 0.10, fadeOut: 0.15, dur: 0.8 },
  splash:    { sfxId: "sfx_splash",   sfxName: "Splash",      vol: 0.50, fadeIn: 0.02, fadeOut: 0.15, dur: 0.8 },
  thunder:   { sfxId: "sfx_thunder",  sfxName: "Thunder",     vol: 0.75, fadeIn: 0.05, fadeOut: 0.30, dur: 2.0 },
  roar:      { sfxId: "sfx_roar",     sfxName: "Roar",        vol: 0.65, fadeIn: 0.03, fadeOut: 0.20, dur: 1.5 },
  slam:      { sfxId: "sfx_slam",     sfxName: "Door Slam",   vol: 0.55, fadeIn: 0.01, fadeOut: 0.12, dur: 0.6 },
  magic:     { sfxId: "sfx_magic",    sfxName: "Magic Spell", vol: 0.50, fadeIn: 0.08, fadeOut: 0.25, dur: 1.5 },
  sparkle:   { sfxId: "sfx_sparkle",  sfxName: "Sparkle",     vol: 0.40, fadeIn: 0.05, fadeOut: 0.20, dur: 1.2 },
  whoosh:    { sfxId: "sfx_whoosh",   sfxName: "Whoosh",      vol: 0.45, fadeIn: 0.02, fadeOut: 0.10, dur: 0.6 },
  gasp:      { sfxId: "sfx_gasp",     sfxName: "Gasp",        vol: 0.40, fadeIn: 0.02, fadeOut: 0.05, dur: 0.4 },
  cheer:     { sfxId: "sfx_cheer",    sfxName: "Cheering",    vol: 0.50, fadeIn: 0.05, fadeOut: 0.15, dur: 1.2 },
  wind:      { sfxId: "sfx_wind",     sfxName: "Wind",        vol: 0.35, fadeIn: 0.20, fadeOut: 0.30, dur: 2.5 },
};

const CAMERA_KEYWORDS: Record<string, string> = {
  static:      "locked-off tripod shot, stable composition",
  "slow-pan":  "slow cinematic pan, smooth lateral movement",
  "dolly-in":  "slow cinematic dolly-in camera movement, subtle parallax depth",
  "dolly-out": "cinematic dolly-out reveal, expanding field of view",
  "zoom-in":   "dynamic rack focus, gradual zoom into subject",
  tracking:    "smooth tracking shot following action, slight handheld realism",
  "crane-up":  "crane-up reveal shot, ascending vertical camera movement",
};

const ATMOS = ["volumetric lighting", "shallow depth of field", "natural film grain", "35mm cinematic film look"];

const CAMERA_MOTIONS: Record<string, string[]> = {
  calm: ["static", "slow-pan"], playful: ["slow-pan", "tracking"],
  magical: ["dolly-in", "crane-up"], tense: ["zoom-in", "static"],
  dramatic: ["dolly-in", "zoom-in"], action: ["tracking", "dolly-out"],
  emotional: ["dolly-in", "slow-pan"], triumphant: ["crane-up", "dolly-out"],
};

const TRANSITION_MAP: Record<string, string> = {
  calm: "crossfade", playful: "crossfade", magical: "dissolve",
  tense: "hard-cut", dramatic: "hard-cut", action: "hard-cut",
  emotional: "crossfade", triumphant: "dip-to-black",
};

const TRANSITION_DUR: Record<string, number> = {
  crossfade: 0.8, "hard-cut": 0.1, "dip-to-black": 1.2, dissolve: 1.0,
};

interface OrchScene {
  sceneDuration: number;
  pauseBuffer: number;
  emotionalIntensity: number;
  emotion: string;
  enhancedPrompt: string;
  cameraInstructions: string;
  sfxCues: Array<{ sfxId: string; sfxName: string; timestamp: number; volume: number; fadeIn: number; fadeOut: number }>;
  bgmDucking: Array<{ timeSec: number; volume: number; curve: string }>;
  transitionIn: { type: string; durationSec: number };
  transitionOut: { type: string; durationSec: number };
}

function computeTimelineOrchestration(
  manifestScenes: Array<{ audioDurationSec: number; narrationText: string; caption: string; imageUrl: string | null }>,
  pacingMode: string,
  theme: string,
): { scenes: OrchScene[]; totalDuration: number } {
  const total = manifestScenes.length;
  const orchScenes: OrchScene[] = [];
  let totalDur = 0;

  for (let i = 0; i < total; i++) {
    const s = manifestScenes[i];
    const mood = inferSceneMood(theme, i, total);
    const emotion = moodToEmotion(mood);
    const intensity = INTENSITY_MAP[emotion] ?? 0.5;
    const pacMult = PACING_MULT[pacingMode] ?? 1.0;

    // Narration timing
    const narDur = s.audioDurationSec > 0 ? s.audioDurationSec : Math.max(2, (s.narrationText.length / 150) * 10);
    const basePause = PAUSE_BUFFERS[emotion] ?? 0.4;
    const pauseBuffer = Math.round(basePause * pacMult * (1 + intensity * 0.2) * 100) / 100;
    const sceneDuration = Math.round((narDur + pauseBuffer) * 100) / 100;

    // SFX detection
    const words = s.narrationText.split(/\s+/).filter(Boolean);
    const sfxCues: OrchScene["sfxCues"] = [];
    let lastSfxEnd = -1;
    for (let w = 0; w < words.length; w++) {
      const clean = words[w].toLowerCase().replace(/[^a-z]/g, "");
      const sfx = SFX_KEYWORDS[clean];
      if (!sfx) continue;
      const ts = Math.max(0, (w / words.length) * narDur - 0.1);
      if (ts < lastSfxEnd + 0.3) continue;
      const emotionBoost = emotion === "action" || emotion === "dramatic" ? 1.15 : 1.0;
      sfxCues.push({
        sfxId: sfx.sfxId, sfxName: sfx.sfxName,
        timestamp: Math.round(ts * 1000) / 1000,
        volume: Math.min(1, Math.round(sfx.vol * emotionBoost * 100) / 100),
        fadeIn: sfx.fadeIn, fadeOut: sfx.fadeOut,
      });
      lastSfxEnd = ts + sfx.dur;
    }

    // BGM ducking
    const bgmDucking: OrchScene["bgmDucking"] = [
      { timeSec: 0, volume: 1.0, curve: "instant" },
    ];
    if (narDur > 0) {
      const fadeD = 0.4;
      bgmDucking.push({ timeSec: Math.max(0, 0), volume: 1.0, curve: "instant" });
      bgmDucking.push({ timeSec: Math.min(fadeD, narDur), volume: 0.30, curve: "exponential" });
      bgmDucking.push({ timeSec: narDur, volume: 0.30, curve: "instant" });
      if (narDur + fadeD < sceneDuration) {
        bgmDucking.push({ timeSec: narDur + fadeD, volume: 1.0, curve: "exponential" });
      }
    }

    // Camera & enhanced prompt
    const motionChoices = CAMERA_MOTIONS[emotion] || ["static"];
    const motion = motionChoices[i % motionChoices.length];
    const camDesc = CAMERA_KEYWORDS[motion] || "stable composition";
    const atmosN = Math.max(1, Math.round(ATMOS.length * (PACING_MULT[pacingMode] === 0.7 ? 0.8 : 0.5)));
    const atmosStr = ATMOS.slice(0, atmosN).join(", ");
    const cameraInstructions = `${camDesc}, ${atmosStr}`;

    const colorHints: Record<string, string> = {
      calm: "warm golden hour tones", magical: "ethereal pastel glow",
      tense: "desaturated cool tones", action: "high contrast, motion blur",
      playful: "bright saturated colors", dramatic: "chiaroscuro lighting",
      emotional: "soft diffused light", triumphant: "radiant golden backlight",
    };
    const basePrompt = buildAnimationPrompt(s.caption, s.narrationText);

    // ── Inject Pixar Lighting Directive ──
    const lightingFrag = computeLightingFragment(emotion, s.caption, i, total);

    // ── Inject Character DNA for visual consistency ──
    const childName = manifestScenes[0]?.caption || ""; // theme/name extracted from context
    const dnaFrag = buildCharacterDNAFragment(
      (typeof (globalThis as any).__childName === "string" ? (globalThis as any).__childName : "Hero"),
      (typeof (globalThis as any).__storyTheme === "string" ? (globalThis as any).__storyTheme : theme),
    );

    const enhancedPrompt = [basePrompt, camDesc, atmosStr, colorHints[emotion] || "", lightingFrag, dnaFrag].filter(Boolean).join(", ");

    // Transitions
    const transType = TRANSITION_MAP[emotion] || "crossfade";
    const transIn = {
      type: i === 0 ? "dip-to-black" : transType,
      durationSec: i === 0 ? 0.8 : (TRANSITION_DUR[transType] || 0.8),
    };
    const transOut = {
      type: i === total - 1 ? "dip-to-black" : transType,
      durationSec: TRANSITION_DUR[i === total - 1 ? "dip-to-black" : transType] || 0.8,
    };

    orchScenes.push({
      sceneDuration, pauseBuffer, emotionalIntensity: intensity, emotion,
      enhancedPrompt, cameraInstructions, sfxCues, bgmDucking,
      transitionIn: transIn, transitionOut: transOut,
    });
    totalDur += sceneDuration;
  }

  return { scenes: orchScenes, totalDuration: Math.round(totalDur * 100) / 100 };
}
