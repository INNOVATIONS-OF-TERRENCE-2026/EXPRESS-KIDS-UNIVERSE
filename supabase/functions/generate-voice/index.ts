import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * generate-voice — ElevenLabs TTS edge function.
 *
 * Actions:
 *   "health"       — Check if ElevenLabs API key is configured
 *   "list-voices"  — Fetch available ElevenLabs voices
 *   "generate"     — Generate speech audio from text
 *
 * SECURITY: ELEVENLABS_API_KEY is stored server-side only.
 *           Never exposed to the browser.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const body = await req.json();
    const { action } = body;

    /* ── Health check ── */
    if (action === "health") {
      return new Response(
        JSON.stringify({ healthy: !!ELEVENLABS_API_KEY }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    /* ── List voices ── */
    if (action === "list-voices") {
      const res = await fetch(`${ELEVENLABS_BASE}/voices`, {
        headers: { "xi-api-key": ELEVENLABS_API_KEY },
      });
      if (!res.ok) throw new Error(`ElevenLabs API error: ${res.status}`);
      const data = await res.json();
      return new Response(
        JSON.stringify({ voices: data.voices ?? [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    /* ── Generate speech ── */
    if (action === "generate") {
      const { text, voiceId, stability = 0.5, similarityBoost = 0.75, speed = 1 } = body;
      if (!text || !voiceId) {
        return new Response(
          JSON.stringify({ error: "Missing text or voiceId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const res = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
            speed,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`ElevenLabs TTS error: ${res.status} - ${errText}`);
      }

      // Convert audio to base64 data URL
      const audioBuffer = await res.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
      const audioUrl = `data:audio/mpeg;base64,${base64}`;

      // Estimate duration (rough: ~150 chars per 10 seconds)
      const durationSec = Math.max(1, (text.length / 150) * 10);

      return new Response(
        JSON.stringify({ audioUrl, durationSec }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("generate-voice error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
