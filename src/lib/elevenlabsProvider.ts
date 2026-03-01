/**
 * elevenlabsProvider.ts — ElevenLabs TTS provider with failsafe protocol.
 *
 * NEVER exposes the API key to the browser. All calls route through
 * Supabase Edge Functions. If the function returns 401/403 or the
 * endpoint is unavailable, the provider falls back gracefully and
 * marks itself as degraded.
 *
 * API key is stored server-side only (Supabase secret / env var).
 */

import type { VoiceProfile, VoiceResult } from "@/lib/studio/voice/voiceTypes";
import { supabase } from "@/integrations/supabase/client";

export type ElevenLabsStatus = "ready" | "degraded" | "unavailable";

let cachedStatus: ElevenLabsStatus = "ready";

/** Cached ElevenLabs voice catalog */
let voiceCatalog: ElevenLabsVoice[] | null = null;

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  preview_url?: string;
}

/**
 * Check ElevenLabs availability through the edge function health endpoint.
 * Sets the cached status and returns it.
 */
export async function checkElevenLabsHealth(): Promise<ElevenLabsStatus> {
  try {
    const { data, error } = await supabase.functions.invoke("generate-voice", {
      body: { action: "health" },
    });
    if (error || !data?.healthy) {
      cachedStatus = "degraded";
    } else {
      cachedStatus = "ready";
    }
  } catch {
    cachedStatus = "unavailable";
  }
  return cachedStatus;
}

/** Get the current cached status without making a network call */
export function getElevenLabsStatus(): ElevenLabsStatus {
  return cachedStatus;
}

/**
 * Fetch the ElevenLabs voice catalog through the edge function.
 * Returns cached result after first successful call.
 */
export async function fetchVoiceCatalog(): Promise<ElevenLabsVoice[]> {
  if (voiceCatalog) return voiceCatalog;
  try {
    const { data, error } = await supabase.functions.invoke("generate-voice", {
      body: { action: "list-voices" },
    });
    if (error || !data?.voices) {
      cachedStatus = "degraded";
      return [];
    }
    voiceCatalog = data.voices as ElevenLabsVoice[];
    return voiceCatalog;
  } catch {
    cachedStatus = "unavailable";
    return [];
  }
}

/**
 * Generate speech audio through ElevenLabs via edge function.
 *
 * Falls back to null (caller should use Web Speech API fallback)
 * if the service is unavailable.
 */
export async function generateSpeech(
  text: string,
  voiceId: string,
  profile: VoiceProfile,
): Promise<VoiceResult | null> {
  if (cachedStatus === "unavailable") return null;

  try {
    const { data, error } = await supabase.functions.invoke("generate-voice", {
      body: {
        action: "generate",
        text,
        voiceId,
        stability: 0.5,
        similarityBoost: 0.75,
        speed: profile.rate,
      },
    });

    if (error) {
      cachedStatus = "degraded";
      return null;
    }

    if (data?.audioUrl) {
      return {
        durationSec: data.durationSec ?? text.length * 0.06,
        audioRef: data.audioUrl,
        markers: data.markers,
      };
    }
    return null;
  } catch {
    cachedStatus = "degraded";
    return null;
  }
}

/**
 * Stream speech audio through ElevenLabs via edge function.
 * Returns an AudioContext-compatible stream URL or null.
 */
export async function streamSpeech(
  text: string,
  voiceId: string,
): Promise<string | null> {
  if (cachedStatus === "unavailable") return null;

  try {
    const { data, error } = await supabase.functions.invoke("stream-voice", {
      body: { text, voiceId },
    });
    if (error || !data?.streamUrl) {
      cachedStatus = "degraded";
      return null;
    }
    return data.streamUrl;
  } catch {
    cachedStatus = "degraded";
    return null;
  }
}
