/**
 * lipSyncMarkers.ts — Approximate phoneme/viseme marker generation
 *
 * Generates timing markers from text for future lip-sync animation.
 * Uses text-based approximation (not actual audio analysis) to produce
 * viseme sequences that can drive mouth animation in the WebGL renderer.
 *
 * Viseme set (simplified from Oculus/MPEG-4):
 *   aa, ee, ih, oh, oo, ch, dd, ff, kk, nn, pp, rr, ss, th, sil
 */

export type Viseme =
  | "sil" // silence / closed mouth
  | "aa"  // open vowel (a, ah)
  | "ee"  // smile vowel (e, ee)
  | "ih"  // neutral vowel (i, uh)
  | "oh"  // round vowel (o)
  | "oo"  // tight round (u, oo)
  | "ch"  // chin up (ch, j, sh)
  | "dd"  // tongue tip (d, t, n)
  | "ff"  // lower lip (f, v)
  | "kk"  // back tongue (k, g)
  | "nn"  // nasal (m, n)
  | "pp"  // lips closed (p, b, m)
  | "rr"  // r sound
  | "ss"  // teeth (s, z)
  | "th"; // tongue out (th)

export interface LipSyncMarker {
  /** Time offset in seconds from utterance start */
  timeSec: number;
  /** Duration of this viseme in seconds */
  durationSec: number;
  /** Viseme type */
  viseme: Viseme;
  /** Intensity / open-ness (0–1) */
  intensity: number;
}

export interface LipSyncTrack {
  /** Dialogue ID this track belongs to */
  dialogueId: string;
  /** Character ID */
  characterId: string;
  /** The source text */
  text: string;
  /** Total estimated duration in seconds */
  totalDurationSec: number;
  /** Ordered list of viseme markers */
  markers: LipSyncMarker[];
}

/** Approximate character → viseme mapping */
const CHAR_VISEME_MAP: Record<string, Viseme> = {
  a: "aa", b: "pp", c: "kk", d: "dd", e: "ee", f: "ff",
  g: "kk", h: "ih", i: "ih", j: "ch", k: "kk", l: "dd",
  m: "nn", n: "nn", o: "oh", p: "pp", q: "kk", r: "rr",
  s: "ss", t: "dd", u: "oo", v: "ff", w: "oo", x: "ss",
  y: "ee", z: "ss",
};

/** Digraph overrides */
const DIGRAPH_MAP: Record<string, Viseme> = {
  th: "th", ch: "ch", sh: "ch", oo: "oo", ee: "ee",
  ou: "oh", ow: "oh", ai: "aa", ay: "aa", ng: "nn",
};

/** Average speaking rate: characters per second (including spaces) */
const CHARS_PER_SEC = 14;

/**
 * Generate approximate lip-sync markers from text.
 *
 * @param text The spoken text
 * @param dialogueId ID of the source dialogue
 * @param characterId ID of the speaking character
 * @param durationSec Optional override for total duration; otherwise estimated from text length
 */
export function generateLipSyncMarkers(
  text: string,
  dialogueId: string,
  characterId: string,
  durationSec?: number,
): LipSyncTrack {
  const cleanText = text.toLowerCase().replace(/[^a-z\s]/g, "");
  const totalDuration = durationSec ?? cleanText.length / CHARS_PER_SEC;
  const markers: LipSyncMarker[] = [];

  // Pre-scan pauses (spaces, punctuation)
  const charDuration = totalDuration / Math.max(1, cleanText.length);
  let time = 0;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];

    if (char === " ") {
      // Brief silence at word boundaries
      markers.push({
        timeSec: time,
        durationSec: charDuration * 1.5,
        viseme: "sil",
        intensity: 0,
      });
      time += charDuration * 1.5;
      continue;
    }

    // Check for digraphs
    const digraph = i < cleanText.length - 1 ? cleanText[i] + cleanText[i + 1] : "";
    const digraphViseme = DIGRAPH_MAP[digraph];

    if (digraphViseme) {
      markers.push({
        timeSec: time,
        durationSec: charDuration * 2,
        viseme: digraphViseme,
        intensity: isVowel(char) ? 0.8 : 0.6,
      });
      time += charDuration * 2;
      i++; // skip next char
      continue;
    }

    // Single character
    const viseme = CHAR_VISEME_MAP[char] ?? "ih";
    markers.push({
      timeSec: time,
      durationSec: charDuration,
      viseme,
      intensity: isVowel(char) ? 0.8 : 0.5,
    });
    time += charDuration;
  }

  // Ensure track ends with silence
  if (markers.length === 0 || markers[markers.length - 1].viseme !== "sil") {
    markers.push({
      timeSec: time,
      durationSec: Math.max(0, totalDuration - time),
      viseme: "sil",
      intensity: 0,
    });
  }

  return {
    dialogueId,
    characterId,
    text,
    totalDurationSec: totalDuration,
    markers,
  };
}

function isVowel(char: string): boolean {
  return "aeiou".includes(char);
}

/**
 * Batch-generate lip sync for all dialogue in an episode.
 */
export function generateEpisodeLipSync(
  dialogues: Array<{ id: string; characterId: string; text: string; durationSec?: number }>,
): LipSyncTrack[] {
  return dialogues.map((d) =>
    generateLipSyncMarkers(d.text, d.id, d.characterId, d.durationSec),
  );
}
