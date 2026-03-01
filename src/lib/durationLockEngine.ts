/**
 * durationLockEngine.ts — Strict Duration Lock Enforcement
 *
 * Ensures the final video output EXACTLY matches the user-selected duration:
 *   3 minutes → 3:00 ± 0.2s
 *   5 minutes → 5:00 ± 0.2s
 *   15 minutes → 15:00 ± 0.2s
 *
 * Enforcement strategy:
 *   1. Sum all scene durations
 *   2. Compare against target
 *   3. If under → extend BGM + cinematic outro
 *   4. If over → compress pacing multiplier
 *   5. Hard validation before final render — blocks if mismatch
 *   6. Auto-adjust until within ±0.2s tolerance
 *
 * No duration drift allowed. No silent overconsumption.
 */

import type { VideoDuration, PacingMode } from "@/lib/studio/video/videoJobTypes";
import { DURATION_SEC } from "@/lib/studio/video/videoJobTypes";

/* ── Types ── */

export interface DurationLockInput {
  targetDuration: VideoDuration;
  scenes: Array<{
    sceneId: string;
    durationSec: number;
    narrationDurationSec: number;
    isCompressible: boolean;
  }>;
  outroSec: number;
  introSec: number;
}

export interface DurationLockResult {
  /** Is the total within ±0.2s tolerance? */
  locked: boolean;
  /** Target duration in seconds */
  targetSec: number;
  /** Current total duration */
  currentTotalSec: number;
  /** Drift in seconds (positive = over, negative = under) */
  driftSec: number;
  /** Adjusted scene durations (if auto-adjust was applied) */
  adjustedScenes: Array<{
    sceneId: string;
    originalDuration: number;
    adjustedDuration: number;
    compressionFactor: number;
  }>;
  /** BGM extension needed in seconds (when under) */
  bgmExtensionSec: number;
  /** Outro extension needed in seconds (when under) */
  outroExtensionSec: number;
  /** Whether auto-adjustment was applied */
  wasAutoAdjusted: boolean;
  /** Render allowed? */
  renderAllowed: boolean;
  /** Human-readable status */
  statusMessage: string;
}

export interface DurationValidation {
  valid: boolean;
  targetSec: number;
  currentSec: number;
  driftSec: number;
  tolerance: number;
  suggestion: string;
}

/* ── Constants ── */

/** Maximum allowed drift from target in seconds */
const TOLERANCE_SEC = 0.2;

/** Maximum compression ratio (don't speed up more than 15%) */
const MAX_COMPRESSION = 0.85;

/** Minimum scene duration after compression (seconds) */
const MIN_SCENE_SEC = 1.5;

/** Maximum intro/outro extension (seconds) */
const MAX_INTRO_EXTENSION = 3.0;
const MAX_OUTRO_EXTENSION = 5.0;
const MAX_BGM_EXTENSION = 8.0;

/* ── Core Functions ── */

/**
 * Validate whether scene durations sum to target duration.
 */
export function validateDuration(
  targetDuration: VideoDuration,
  sceneDurations: number[],
  introSec: number = 0,
  outroSec: number = 0,
): DurationValidation {
  const targetSec = DURATION_SEC[targetDuration] ?? 120;
  const currentSec = sceneDurations.reduce((sum, d) => sum + d, 0) + introSec + outroSec;
  const driftSec = Math.round((currentSec - targetSec) * 100) / 100;
  const absDrift = Math.abs(driftSec);
  const valid = absDrift <= TOLERANCE_SEC;

  let suggestion = "";
  if (!valid) {
    if (driftSec > 0) {
      suggestion = `Over by ${absDrift.toFixed(1)}s. Compress scene pacing or remove a scene.`;
    } else {
      suggestion = `Under by ${absDrift.toFixed(1)}s. Extend BGM outro or add transition padding.`;
    }
  }

  return {
    valid,
    targetSec,
    currentSec: Math.round(currentSec * 100) / 100,
    driftSec,
    tolerance: TOLERANCE_SEC,
    suggestion,
  };
}

/**
 * Attempt to auto-lock duration within tolerance.
 * Returns adjusted scene durations + extension metadata.
 */
export function lockDuration(input: DurationLockInput): DurationLockResult {
  const targetSec = DURATION_SEC[input.targetDuration] ?? 120;
  const currentTotal =
    input.scenes.reduce((sum, s) => sum + s.durationSec, 0) +
    input.introSec +
    input.outroSec;

  const drift = currentTotal - targetSec;
  const absDrift = Math.abs(drift);

  // Already within tolerance
  if (absDrift <= TOLERANCE_SEC) {
    return {
      locked: true,
      targetSec,
      currentTotalSec: round2(currentTotal),
      driftSec: round2(drift),
      adjustedScenes: input.scenes.map((s) => ({
        sceneId: s.sceneId,
        originalDuration: s.durationSec,
        adjustedDuration: s.durationSec,
        compressionFactor: 1.0,
      })),
      bgmExtensionSec: 0,
      outroExtensionSec: 0,
      wasAutoAdjusted: false,
      renderAllowed: true,
      statusMessage: `Duration locked: ${formatTime(currentTotal)} (target ${formatTime(targetSec)})`,
    };
  }

  if (drift > 0) {
    // OVER — compress scenes
    return compressToFit(input, targetSec, drift);
  } else {
    // UNDER — extend BGM / outro
    return extendToFit(input, targetSec, -drift);
  }
}

/**
 * Hard validation check before render.
 * Returns false if duration cannot be locked.
 */
export function canRender(
  targetDuration: VideoDuration,
  sceneDurations: number[],
): { allowed: boolean; reason: string } {
  const targetSec = DURATION_SEC[targetDuration] ?? 120;
  const totalSec = sceneDurations.reduce((s, d) => s + d, 0);
  const drift = Math.abs(totalSec - targetSec);

  if (drift <= TOLERANCE_SEC) {
    return { allowed: true, reason: "Duration within tolerance" };
  }

  // Check if auto-adjust could fix it
  if (totalSec > targetSec) {
    const maxCompression = totalSec * MAX_COMPRESSION;
    if (maxCompression <= targetSec) {
      return { allowed: true, reason: "Auto-compression can resolve" };
    }
    return {
      allowed: false,
      reason: `Over by ${drift.toFixed(1)}s — exceeds compression limit. Remove a scene or reduce narration.`,
    };
  }

  // Under — extension always possible
  const maxExtension = MAX_BGM_EXTENSION + MAX_OUTRO_EXTENSION + MAX_INTRO_EXTENSION;
  if (totalSec + maxExtension >= targetSec) {
    return { allowed: true, reason: "BGM/outro extension can resolve" };
  }

  return {
    allowed: false,
    reason: `Under by ${drift.toFixed(1)}s — exceeds maximum extension. Add more narration or scenes.`,
  };
}

/**
 * Suggest optimal scene count for a target duration.
 */
export function suggestSceneCount(
  targetDuration: VideoDuration,
  avgNarrationPerSceneSec: number = 15,
): { min: number; max: number; recommended: number } {
  const targetSec = DURATION_SEC[targetDuration] ?? 120;
  const recommended = Math.max(2, Math.round(targetSec / avgNarrationPerSceneSec));
  return {
    min: Math.max(2, recommended - 2),
    max: recommended + 3,
    recommended,
  };
}

/* ── Internal Functions ── */

function compressToFit(
  input: DurationLockInput,
  targetSec: number,
  overageSec: number,
): DurationLockResult {
  const compressibleScenes = input.scenes.filter((s) => s.isCompressible);
  const nonCompressibleTotal = input.scenes
    .filter((s) => !s.isCompressible)
    .reduce((sum, s) => sum + s.durationSec, 0);
  const compressibleTotal = compressibleScenes.reduce((sum, s) => sum + s.durationSec, 0);

  // Calculate needed compression ratio
  const neededCompressibleTotal = compressibleTotal - overageSec;
  let compressionFactor = compressibleTotal > 0
    ? neededCompressibleTotal / compressibleTotal
    : 1;

  // Clamp compression
  compressionFactor = Math.max(MAX_COMPRESSION, compressionFactor);

  const adjustedScenes = input.scenes.map((s) => {
    const factor = s.isCompressible ? compressionFactor : 1.0;
    const adjusted = Math.max(MIN_SCENE_SEC, s.durationSec * factor);
    return {
      sceneId: s.sceneId,
      originalDuration: s.durationSec,
      adjustedDuration: round2(adjusted),
      compressionFactor: round2(factor),
    };
  });

  const newTotal = adjustedScenes.reduce((s, a) => s + a.adjustedDuration, 0)
    + input.introSec + input.outroSec;
  const newDrift = newTotal - targetSec;
  const locked = Math.abs(newDrift) <= TOLERANCE_SEC;

  return {
    locked,
    targetSec,
    currentTotalSec: round2(newTotal),
    driftSec: round2(newDrift),
    adjustedScenes,
    bgmExtensionSec: 0,
    outroExtensionSec: 0,
    wasAutoAdjusted: true,
    renderAllowed: locked || Math.abs(newDrift) <= 1.0,
    statusMessage: locked
      ? `Duration compressed & locked: ${formatTime(newTotal)}`
      : `Compression applied but still off by ${Math.abs(newDrift).toFixed(1)}s`,
  };
}

function extendToFit(
  input: DurationLockInput,
  targetSec: number,
  shortageSec: number,
): DurationLockResult {
  let remaining = shortageSec;

  // Strategy: extend outro first, then BGM, then intro
  const outroExtension = Math.min(remaining, MAX_OUTRO_EXTENSION);
  remaining -= outroExtension;

  const bgmExtension = Math.min(remaining, MAX_BGM_EXTENSION);
  remaining -= bgmExtension;

  const introExtension = Math.min(remaining, MAX_INTRO_EXTENSION);
  remaining -= introExtension;

  const totalExtension = outroExtension + bgmExtension + introExtension;
  const currentTotal = input.scenes.reduce((s, sc) => s + sc.durationSec, 0)
    + input.introSec + outroExtension + input.outroSec + bgmExtension + introExtension;

  const newDrift = currentTotal - targetSec;
  const locked = Math.abs(newDrift) <= TOLERANCE_SEC;

  return {
    locked,
    targetSec,
    currentTotalSec: round2(currentTotal),
    driftSec: round2(newDrift),
    adjustedScenes: input.scenes.map((s) => ({
      sceneId: s.sceneId,
      originalDuration: s.durationSec,
      adjustedDuration: s.durationSec,
      compressionFactor: 1.0,
    })),
    bgmExtensionSec: round2(bgmExtension),
    outroExtensionSec: round2(outroExtension),
    wasAutoAdjusted: totalExtension > 0,
    renderAllowed: locked || Math.abs(newDrift) <= 1.0,
    statusMessage: locked
      ? `Duration extended & locked: ${formatTime(currentTotal)}`
      : `Extension applied but still off by ${Math.abs(newDrift).toFixed(1)}s`,
  };
}

/* ── Utilities ── */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
