/**
 * lipSyncEngine.ts — Character Lip Sync Engine
 *
 * Extracts phoneme timing from TTS audio metadata and maps phonemes
 * to mouth shapes for character animation lip synchronization.
 *
 * Features:
 *   - Phoneme timing extraction from TTS provider metadata
 *   - Phoneme → mouth shape mapping (18 phonemes → 7 visemes)
 *   - Timeline alignment with animation frames
 *   - 40–80ms smoothing correction window
 *   - Graceful fallback (minimal mouth animation if sync fails)
 *   - No robotic mouth snapping — exponential easing between shapes
 *
 * This engine outputs a LipSyncTimeline that the video renderer
 * consumes to drive mouth shape changes on character sprites.
 */

/* ── Types ── */

/**
 * 7 basic viseme (mouth shape) categories:
 *   - closed:     M, B, P — lips together
 *   - open-wide:  A, AH — mouth wide open
 *   - open-mid:   E, EH — moderately open
 *   - narrow:     I, EE — narrow horizontal opening
 *   - round:      O, OO, U, W — rounded lips
 *   - teeth-lip:  F, V — upper teeth on lower lip
 *   - tongue-up:  L, T, D, N — tongue touches palate
 */
export type VisemeShape =
  | "closed"
  | "open-wide"
  | "open-mid"
  | "narrow"
  | "round"
  | "teeth-lip"
  | "tongue-up";

export interface PhonemeEvent {
  /** IPA or ARPABET phoneme symbol */
  phoneme: string;
  /** Start time in milliseconds from scene start */
  startMs: number;
  /** End time in milliseconds */
  endMs: number;
}

export interface VisemeEvent {
  shape: VisemeShape;
  /** Start time in milliseconds */
  startMs: number;
  /** End time in milliseconds */
  endMs: number;
  /** Easing intensity 0–1 (how smoothly to blend into this shape) */
  easeIn: number;
  /** Easing intensity 0–1 (how smoothly to blend out) */
  easeOut: number;
}

export interface LipSyncTimeline {
  characterId: string;
  /** Total duration in milliseconds */
  totalDurationMs: number;
  /** Ordered viseme events */
  visemes: VisemeEvent[];
  /** Was this estimated (true) or extracted from real phoneme data (false)? */
  isEstimated: boolean;
  /** Smoothing window applied in ms */
  smoothingWindowMs: number;
  /** Frame rate for animation sampling */
  targetFps: number;
}

export interface LipSyncConfig {
  /** Smoothing correction window in ms (default: 60ms — midpoint of 40–80ms) */
  smoothingWindowMs: number;
  /** Minimum viseme duration in ms before merging */
  minVisemeDurationMs: number;
  /** Target animation FPS */
  targetFps: number;
  /** Whether to apply crossfade easing between visemes */
  enableCrossfade: boolean;
}

/* ── Constants ── */

const DEFAULT_CONFIG: LipSyncConfig = {
  smoothingWindowMs: 60,      // 40–80ms correction window, 60ms center
  minVisemeDurationMs: 50,    // Minimum viseme hold time
  targetFps: 24,
  enableCrossfade: true,
};

/**
 * Phoneme → Viseme mapping.
 * Covers ARPABET and common IPA symbols.
 */
const PHONEME_TO_VISEME: Record<string, VisemeShape> = {
  // Closed (lips together)
  m: "closed", b: "closed", p: "closed",
  M: "closed", B: "closed", P: "closed",

  // Open wide
  a: "open-wide", aa: "open-wide", ah: "open-wide",
  A: "open-wide", AA: "open-wide", AH: "open-wide",
  ae: "open-wide", AE: "open-wide",
  aw: "open-wide", AW: "open-wide",

  // Open mid
  e: "open-mid", eh: "open-mid", er: "open-mid",
  E: "open-mid", EH: "open-mid", ER: "open-mid",
  ax: "open-mid", AX: "open-mid",

  // Narrow
  i: "narrow", iy: "narrow", ih: "narrow",
  I: "narrow", IY: "narrow", IH: "narrow",
  s: "narrow", z: "narrow", sh: "narrow", zh: "narrow",
  S: "narrow", Z: "narrow", SH: "narrow", ZH: "narrow",
  ch: "narrow", jh: "narrow",
  CH: "narrow", JH: "narrow",

  // Round
  o: "round", ow: "round", oo: "round",
  O: "round", OW: "round", OO: "round",
  u: "round", uw: "round", uh: "round",
  U: "round", UW: "round", UH: "round",
  w: "round", W: "round",

  // Teeth-lip
  f: "teeth-lip", v: "teeth-lip",
  F: "teeth-lip", V: "teeth-lip",

  // Tongue-up
  l: "tongue-up", t: "tongue-up", d: "tongue-up", n: "tongue-up",
  L: "tongue-up", T: "tongue-up", D: "tongue-up", N: "tongue-up",
  th: "tongue-up", TH: "tongue-up",
  r: "tongue-up", R: "tongue-up",
  k: "open-mid", g: "open-mid",
  K: "open-mid", G: "open-mid",
  ng: "open-mid", NG: "open-mid",
  h: "open-wide", hh: "open-wide",
  H: "open-wide", HH: "open-wide",
  y: "narrow", Y: "narrow",
};

/* ── Core Functions ── */

/**
 * Build a lip sync timeline from phoneme events.
 * Applies smoothing, minimum duration enforcement, and crossfade easing.
 */
export function buildLipSyncTimeline(
  characterId: string,
  phonemes: PhonemeEvent[],
  totalDurationMs: number,
  config: Partial<LipSyncConfig> = {},
): LipSyncTimeline {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (phonemes.length === 0) {
    return createFallbackTimeline(characterId, totalDurationMs, cfg);
  }

  // Step 1: Map phonemes → visemes
  let visemes: VisemeEvent[] = phonemes.map((p) => ({
    shape: PHONEME_TO_VISEME[p.phoneme] ?? "closed",
    startMs: p.startMs,
    endMs: p.endMs,
    easeIn: 0,
    easeOut: 0,
  }));

  // Step 2: Apply smoothing window — shift each event by smoothingWindowMs
  visemes = applySmoothingWindow(visemes, cfg.smoothingWindowMs);

  // Step 3: Merge consecutive same-shape visemes
  visemes = mergeSameShapeVisemes(visemes);

  // Step 4: Enforce minimum viseme duration
  visemes = enforceMinDuration(visemes, cfg.minVisemeDurationMs);

  // Step 5: Apply crossfade easing
  if (cfg.enableCrossfade) {
    visemes = applyCrossfadeEasing(visemes);
  }

  // Step 6: Fill gaps with "closed" viseme
  visemes = fillGaps(visemes, totalDurationMs);

  return {
    characterId,
    totalDurationMs,
    visemes,
    isEstimated: false,
    smoothingWindowMs: cfg.smoothingWindowMs,
    targetFps: cfg.targetFps,
  };
}

/**
 * Estimate a lip sync timeline from text when phoneme data is unavailable.
 * Uses word timing estimation based on duration and word count.
 */
export function estimateLipSyncFromText(
  characterId: string,
  text: string,
  totalDurationMs: number,
  config: Partial<LipSyncConfig> = {},
): LipSyncTimeline {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0 || totalDurationMs <= 0) {
    return createFallbackTimeline(characterId, totalDurationMs, cfg);
  }

  // Estimate phoneme events from text
  const msPerWord = totalDurationMs / words.length;
  const phonemes: PhonemeEvent[] = [];
  let cursor = 0;

  for (const word of words) {
    const chars = word.toLowerCase().replace(/[^a-z]/g, "");
    if (chars.length === 0) {
      cursor += msPerWord;
      continue;
    }

    const msPerChar = msPerWord / chars.length;
    for (let c = 0; c < chars.length; c++) {
      phonemes.push({
        phoneme: chars[c],
        startMs: Math.round(cursor),
        endMs: Math.round(cursor + msPerChar),
      });
      cursor += msPerChar;
    }
  }

  const timeline = buildLipSyncTimeline(characterId, phonemes, totalDurationMs, config);
  timeline.isEstimated = true;
  return timeline;
}

/**
 * Sample the viseme at a specific time for rendering.
 * Returns the active viseme shape and blend factor (0–1) for smooth transitions.
 */
export function sampleVisemeAtTime(
  timeline: LipSyncTimeline,
  timeMs: number,
): { shape: VisemeShape; blend: number } {
  if (timeline.visemes.length === 0) return { shape: "closed", blend: 1 };

  for (const v of timeline.visemes) {
    if (timeMs >= v.startMs && timeMs < v.endMs) {
      const progress = (timeMs - v.startMs) / Math.max(1, v.endMs - v.startMs);
      // Compute blend factor for smooth transition
      let blend = 1.0;
      if (v.easeIn > 0 && progress < 0.3) {
        blend = easeInQuad(progress / 0.3) * v.easeIn + (1 - v.easeIn);
      } else if (v.easeOut > 0 && progress > 0.7) {
        blend = easeOutQuad((1 - progress) / 0.3) * v.easeOut + (1 - v.easeOut);
      }
      return { shape: v.shape, blend: Math.max(0, Math.min(1, blend)) };
    }
  }

  return { shape: "closed", blend: 1 };
}

/**
 * Get the viseme shapes dictionary for rendering.
 */
export function getVisemeShapes(): VisemeShape[] {
  return ["closed", "open-wide", "open-mid", "narrow", "round", "teeth-lip", "tongue-up"];
}

/* ── Internal Helpers ── */

function createFallbackTimeline(
  characterId: string,
  totalDurationMs: number,
  cfg: LipSyncConfig,
): LipSyncTimeline {
  // Minimal mouth animation — gentle open/close cycle
  const cycleDuration = 800; // ms per open-close cycle
  const visemes: VisemeEvent[] = [];
  let t = 0;

  while (t < totalDurationMs) {
    const half = cycleDuration / 2;
    visemes.push({
      shape: "open-mid",
      startMs: t,
      endMs: Math.min(t + half, totalDurationMs),
      easeIn: 0.5,
      easeOut: 0.5,
    });
    t += half;
    if (t < totalDurationMs) {
      visemes.push({
        shape: "closed",
        startMs: t,
        endMs: Math.min(t + half, totalDurationMs),
        easeIn: 0.5,
        easeOut: 0.5,
      });
      t += half;
    }
  }

  return {
    characterId,
    totalDurationMs,
    visemes,
    isEstimated: true,
    smoothingWindowMs: cfg.smoothingWindowMs,
    targetFps: cfg.targetFps,
  };
}

function applySmoothingWindow(
  visemes: VisemeEvent[],
  windowMs: number,
): VisemeEvent[] {
  // Shift start times backward by half the window to anticipate mouth movement
  const halfWindow = windowMs / 2;
  return visemes.map((v) => ({
    ...v,
    startMs: Math.max(0, v.startMs - halfWindow),
    endMs: Math.max(v.startMs, v.endMs - halfWindow / 2),
  }));
}

function mergeSameShapeVisemes(visemes: VisemeEvent[]): VisemeEvent[] {
  if (visemes.length <= 1) return visemes;

  const merged: VisemeEvent[] = [{ ...visemes[0] }];
  for (let i = 1; i < visemes.length; i++) {
    const prev = merged[merged.length - 1];
    if (visemes[i].shape === prev.shape && visemes[i].startMs - prev.endMs < 30) {
      prev.endMs = visemes[i].endMs;
    } else {
      merged.push({ ...visemes[i] });
    }
  }
  return merged;
}

function enforceMinDuration(
  visemes: VisemeEvent[],
  minMs: number,
): VisemeEvent[] {
  return visemes
    .map((v) => {
      if (v.endMs - v.startMs < minMs) {
        return { ...v, endMs: v.startMs + minMs };
      }
      return v;
    })
    .filter((v, i, arr) => {
      if (i === 0) return true;
      return v.startMs >= arr[i - 1].endMs - 10;
    });
}

function applyCrossfadeEasing(visemes: VisemeEvent[]): VisemeEvent[] {
  return visemes.map((v, i) => ({
    ...v,
    easeIn: i > 0 ? 0.6 : 0,
    easeOut: i < visemes.length - 1 ? 0.6 : 0,
  }));
}

function fillGaps(visemes: VisemeEvent[], totalMs: number): VisemeEvent[] {
  if (visemes.length === 0) {
    return [{ shape: "closed", startMs: 0, endMs: totalMs, easeIn: 0, easeOut: 0 }];
  }

  const filled: VisemeEvent[] = [];

  // Gap before first viseme
  if (visemes[0].startMs > 20) {
    filled.push({
      shape: "closed",
      startMs: 0,
      endMs: visemes[0].startMs,
      easeIn: 0,
      easeOut: 0.3,
    });
  }

  for (let i = 0; i < visemes.length; i++) {
    filled.push(visemes[i]);

    // Fill gap between this viseme and next
    if (i < visemes.length - 1) {
      const gapStart = visemes[i].endMs;
      const gapEnd = visemes[i + 1].startMs;
      if (gapEnd - gapStart > 30) {
        filled.push({
          shape: "closed",
          startMs: gapStart,
          endMs: gapEnd,
          easeIn: 0.3,
          easeOut: 0.3,
        });
      }
    }
  }

  // Gap after last viseme
  const lastEnd = visemes[visemes.length - 1].endMs;
  if (totalMs - lastEnd > 20) {
    filled.push({
      shape: "closed",
      startMs: lastEnd,
      endMs: totalMs,
      easeIn: 0.3,
      easeOut: 0,
    });
  }

  return filled;
}

function easeInQuad(t: number): number {
  return t * t;
}

function easeOutQuad(t: number): number {
  return t * (2 - t);
}
