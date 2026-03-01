/**
 * audioExpansion.ts — Extended audio capabilities.
 *
 * Feature Set 5: Provides music generation stubs, SFX catalog,
 * and audio visualization data for the waveform display.
 *
 * Music and SFX generation would call cloud functions in production;
 * this module provides the interfaces and local placeholder data.
 */

import { supabase } from "@/integrations/supabase/client";

/** Music mood categories */
export type MusicMood =
  | "magical"
  | "adventurous"
  | "calm"
  | "playful"
  | "mysterious"
  | "heroic"
  | "emotional"
  | "triumphant";

/** A music track reference */
export interface MusicTrack {
  id: string;
  name: string;
  mood: MusicMood;
  durationSec: number;
  /** URL to audio file (when generated) */
  audioUrl?: string;
  /** Waveform amplitude data for visualization (0-1 array) */
  waveform?: number[];
}

/** Sound effect categories */
export type SfxCategory =
  | "whoosh"
  | "sparkle"
  | "pop"
  | "laugh"
  | "cheer"
  | "nature"
  | "tech"
  | "impact";

/** A sound effect reference */
export interface SoundEffect {
  id: string;
  name: string;
  category: SfxCategory;
  durationSec: number;
  audioUrl?: string;
}

/** Built-in SFX catalog */
export const SFX_CATALOG: SoundEffect[] = [
  { id: "sfx_whoosh_1", name: "Whoosh", category: "whoosh", durationSec: 0.5 },
  { id: "sfx_sparkle_1", name: "Sparkle", category: "sparkle", durationSec: 0.8 },
  { id: "sfx_pop_1", name: "Pop", category: "pop", durationSec: 0.3 },
  { id: "sfx_laugh_1", name: "Kid Laugh", category: "laugh", durationSec: 1.2 },
  { id: "sfx_cheer_1", name: "Cheer", category: "cheer", durationSec: 1.5 },
  { id: "sfx_nature_wind", name: "Wind", category: "nature", durationSec: 3.0 },
  { id: "sfx_nature_birds", name: "Birds", category: "nature", durationSec: 2.5 },
  { id: "sfx_tech_beep", name: "Beep", category: "tech", durationSec: 0.2 },
  { id: "sfx_impact_soft", name: "Soft Impact", category: "impact", durationSec: 0.4 },
];

/**
 * Request music generation from cloud function.
 * Falls back gracefully if the function is unavailable.
 */
export async function generateMusic(
  mood: MusicMood,
  durationSec: number,
): Promise<MusicTrack | null> {
  try {
    const { data, error } = await supabase.functions.invoke("generate-music", {
      body: { mood, durationSec },
    });
    if (error || !data?.audioUrl) return null;
    return {
      id: `music_${Date.now()}`,
      name: `${mood} track`,
      mood,
      durationSec: data.durationSec || durationSec,
      audioUrl: data.audioUrl,
      waveform: data.waveform,
    };
  } catch {
    return null;
  }
}

/**
 * Request SFX generation from cloud function.
 */
export async function generateSfx(
  description: string,
  durationSec: number = 1,
): Promise<SoundEffect | null> {
  try {
    const { data, error } = await supabase.functions.invoke("generate-sfx", {
      body: { description, durationSec },
    });
    if (error || !data?.audioUrl) return null;
    return {
      id: `sfx_gen_${Date.now()}`,
      name: description,
      category: "sparkle",
      durationSec: data.durationSec || durationSec,
      audioUrl: data.audioUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Generate mock waveform data for visualization.
 *
 * In production, this would come from actual audio analysis.
 * Used when real waveform data isn't available yet.
 */
export function generateMockWaveform(sampleCount: number = 64): number[] {
  const waveform: number[] = [];
  let value = 0.3;
  for (let i = 0; i < sampleCount; i++) {
    value += (Math.random() - 0.5) * 0.15;
    value = Math.max(0.05, Math.min(1, value));
    waveform.push(value);
  }
  return waveform;
}

/**
 * Analyze an AudioBuffer and extract waveform amplitude data.
 */
export function extractWaveform(buffer: AudioBuffer, sampleCount: number = 64): number[] {
  const data = buffer.getChannelData(0);
  const blockSize = Math.floor(data.length / sampleCount);
  const waveform: number[] = [];

  for (let i = 0; i < sampleCount; i++) {
    let sum = 0;
    const start = i * blockSize;
    for (let j = start; j < start + blockSize && j < data.length; j++) {
      sum += Math.abs(data[j]);
    }
    waveform.push(sum / blockSize);
  }

  // Normalize to 0-1
  const max = Math.max(...waveform, 0.001);
  return waveform.map((v) => v / max);
}
