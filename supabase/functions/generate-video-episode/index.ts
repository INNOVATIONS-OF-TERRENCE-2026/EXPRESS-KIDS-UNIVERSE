import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * generate-video-episode — Supabase Edge Function
 *
 * Receives a video job request, updates status through the pipeline,
 * and auto-saves to gallery_items on completion.
 *
 * In production, this would call Runway / Pika / internal renderer.
 * Currently returns a demo video for the simulated pipeline.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEMO_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const DEMO_POSTER_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg";

const DURATION_SEC: Record<string, number> = {
  short: 120,
  medium: 300,
  full: 900,
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer "))
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );

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
    if (authErr || !claims?.claims)
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );

    const userId = claims.claims.sub as string;
    const { jobId, storyId, storyTitle, duration, provider, voiceAssignments, musicStyle } =
      await req.json();

    if (!jobId || !storyId) {
      return new Response(
        JSON.stringify({ error: "Missing jobId or storyId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Step 1: Mark processing ──
    await supabaseAdmin.from("video_jobs").update({
      status: "processing",
      progress: 10,
      step_label: "Analyzing story scenes…",
    }).eq("id", jobId);

    // Simulate pipeline delay (in production, call external video API)
    await sleep(2000);

    await supabaseAdmin.from("video_jobs").update({
      status: "processing",
      progress: 25,
      step_label: "Generating voice narration…",
    }).eq("id", jobId);

    await sleep(2000);

    await supabaseAdmin.from("video_jobs").update({
      status: "rendering",
      progress: 50,
      step_label: "Rendering scenes…",
    }).eq("id", jobId);

    await sleep(3000);

    await supabaseAdmin.from("video_jobs").update({
      status: "encoding",
      progress: 85,
      step_label: "Encoding final video…",
    }).eq("id", jobId);

    await sleep(2000);

    // ── Step 2: Determine output URL ──
    // In production, we'd upload a rendered .mp4 to storage here.
    // For now, use the demo video URL.
    const outputUrl = DEMO_VIDEO_URL;
    const posterUrl = DEMO_POSTER_URL;
    const durationSec = DURATION_SEC[duration] || 120;

    // ── Step 3: Mark complete ──
    await supabaseAdmin.from("video_jobs").update({
      status: "complete",
      progress: 100,
      step_label: "Ready to watch!",
      output_url: outputUrl,
      thumbnail_url: posterUrl,
    }).eq("id", jobId);

    // ── Step 4: Auto-save to gallery (backend guarantee) ──
    const { data: existing } = await supabaseAdmin
      .from("gallery_items")
      .select("id")
      .eq("job_id", jobId)
      .maybeSingle();

    if (!existing) {
      await supabaseAdmin.from("gallery_items").insert({
        user_id: userId,
        type: "video",
        source: "video_studio",
        job_id: jobId,
        adventure_id: storyId,
        title: storyTitle || "Untitled Video",
        output_url: outputUrl,
        poster_url: posterUrl,
        duration_seconds: durationSec,
        status: "ready",
        metadata: { provider, musicStyle, voiceAssignments },
      });
    }

    return new Response(
      JSON.stringify({ success: true, outputUrl, posterUrl }),
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
