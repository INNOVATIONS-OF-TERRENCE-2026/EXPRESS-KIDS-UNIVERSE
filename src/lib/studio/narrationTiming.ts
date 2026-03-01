/**
 * narrationTiming.ts — Narration Timing Engine
 *
 * Calculates scene durations from REAL audio data (not text estimates).
 * When TTS audio is available, measures actual decoded duration.
 * Falls back to WPM estimation only when TTS fails.
 *
 * Outputs per-scene timing metadata:
 *   - narrationDuration (actual audio length)
 *   - wordsPerMinute (measured)
 *   - emotionalIntensity (derived from mood)
 *   - pacingMultiplier (from pacing mode)
 *   - pauseBuffer (scene-type-dependent)
 *   - sceneDuration (narration + pauseBuffer)
 */

import type { PacingMode } from "./timelineOrchestrator";

/* ── Types ── */

export type SceneEmotion = "calm" | "dramatic" | "action" | "playful" | "magical" | "tense" | "triumphant" | "emotional";

export interface NarrationTimingInput {
  sceneId: string;
  narrationText: string;
  emotion: SceneEmotion;
  /** Actual decoded audio duration in seconds (null if TTS failed) */
  audioDurationSec: number | null;
  /** Audio URL for reference */
  audioUrl: string;
}

export interface NarrationTimingResult {
  sceneId: string;
  /** Real narration audio duration in seconds */
  narrationDuration: number;
  /** Measured or estimated WPM */
  wordsPerMinute: number;
  /** 0–1 intensity scale derived from emotion */
  emotionalIntensity: number;
  /** Global pacing multiplier from mode */
  pacingMultiplier: number;
  /** Pause buffer in seconds added after narration */
  pauseBuffer: number;
  /** Total scene duration = narrationDuration + pauseBuffer */
  sceneDuration: number;
  /** Whether timing used real audio or fallback estimation */
  isEstimated: boolean;
}

/* ── Constants ── */

/** Fallback words-per-minute for text-based estimation */
const DEFAULT_WPM = 150;

/** Pause buffer rules by emotion (seconds) */
const PAUSE_BUFFERS: Record<SceneEmotion, number> = {
  calm:       0.4,
  dramatic:   0.8,
  action:     0.2,
  playful:    0.3,
  magical:    0.5,
  tense:      0.6,
  triumphant: 0.7,
  emotional:  0.8,
};

/** Emotional intensity map (0–1 scale) */
const INTENSITY_MAP: Record<SceneEmotion, number> = {
  calm:       0.2,
  playful:    0.4,
  magical:    0.5,
  tense:      0.7,
  dramatic:   0.8,
  action:     0.9,
  emotional:  0.75,
  triumphant: 0.85,
};

/** Pacing mode multipliers — adjusts pause buffer */
const PACING_MULTIPLIERS: Record<PacingMode, number> = {
  story:       1.0,
  action:      0.7,
  documentary: 1.3,
  kids:        1.1,
};

/* ── Core Functions ── */

/** Count words in a text string */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Estimate audio duration from text using WPM.
 * Only used when actual audio is unavailable.
 */
function estimateDurationFromText(text: string): number {
  const words = countWords(text);
  if (words === 0) return 2; // minimum scene length
  return Math.max(2, (words / DEFAULT_WPM) * 60);
}

/**
 * Compute narration timing for a single scene.
 *
 * If `audioDurationSec` is provided (from decoded audio), uses that.
 * Otherwise falls back to WPM estimation.
 */
export function computeSceneTiming(
  input: NarrationTimingInput,
  pacingMode: PacingMode = "story",
): NarrationTimingResult {
  const words = countWords(input.narrationText);
  const isEstimated = input.audioDurationSec === null || input.audioDurationSec <= 0;

  // Narration duration: prefer real audio, fallback to estimate
  const narrationDuration = isEstimated
    ? estimateDurationFromText(input.narrationText)
    : input.audioDurationSec!;

  // Measured WPM
  const wordsPerMinute = narrationDuration > 0
    ? Math.round((words / narrationDuration) * 60)
    : DEFAULT_WPM;

  // Emotional intensity
  const emotionalIntensity = INTENSITY_MAP[input.emotion] ?? 0.5;

  // Pacing multiplier from mode
  const pacingMultiplier = PACING_MULTIPLIERS[pacingMode] ?? 1.0;

  // Pause buffer = base buffer × pacing multiplier × intensity boost
  const basePause = PAUSE_BUFFERS[input.emotion] ?? 0.4;
  const pauseBuffer = Math.round(
    basePause * pacingMultiplier * (1 + emotionalIntensity * 0.2) * 100
  ) / 100;

  // Total scene duration
  const sceneDuration = Math.round((narrationDuration + pauseBuffer) * 100) / 100;

  return {
    sceneId: input.sceneId,
    narrationDuration: Math.round(narrationDuration * 100) / 100,
    wordsPerMinute,
    emotionalIntensity,
    pacingMultiplier,
    pauseBuffer,
    sceneDuration,
    isEstimated,
  };
}

/**
 * Compute timing for all scenes in an episode.
 * Returns ordered array matching input order.
 */
export function computeEpisodeTiming(
  scenes: NarrationTimingInput[],
  pacingMode: PacingMode = "story",
): NarrationTimingResult[] {
  return scenes.map((s) => computeSceneTiming(s, pacingMode));
}

/**
 * Map a mood string (from episodeSchema) to a SceneEmotion.
 * Handles both exact matches and fuzzy mapping.
 */
export function moodToEmotion(mood: string): SceneEmotion {
  const map: Record<string, SceneEmotion> = {
    adventurous: "action",
    calm:        "calm",
    tense:       "tense",
    magical:     "magical",
    playful:     "playful",
    emotional:   "emotional",
    triumphant:  "triumphant",
  };
  return map[mood] ?? "calm";
}
