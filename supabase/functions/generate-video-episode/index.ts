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
    } = await req.json();

    if (!jobId || !storyId) return jsonError("Missing jobId or storyId", 400);

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
