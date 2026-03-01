/**
 * hollywoodComposer.ts — Hollywood Master Composition Pipeline
 *
 * Stitches all cartoon scenes into a seamless episode with:
 *   - Cinematic transitions (crossfade, hard-cut, dip-to-black, dissolve)
 *   - Color grading consistency via LUT-style presets
 *   - Kids-mode soft palette + clean outlines
 *   - Dynamic audio ducking integrated into final mix
 *   - Frame-boundary audio sync
 *   - Duration lock validation before final output
 *
 * This is the final composition stage — takes CartoonSceneManifests
 * and produces a MasterEpisodeComposition ready for rendering.
 */

import type { PacingMode, VideoDuration } from "@/lib/studio/video/videoJobTypes";
import type { CartoonSceneManifest, QualityProfile } from "@/lib/cartoonSceneEngine";
import type { DuckingPoint } from "@/lib/studio/audioDuckingEngine";
import type { SfxCue } from "@/lib/studio/sfxSyncEngine";
import { validateDuration, lockDuration, type DurationLockResult } from "@/lib/durationLockEngine";

/* ── Types ── */

export type TransitionPreset = "crossfade" | "hard-cut" | "dip-to-black" | "dissolve" | "wipe";

export type ColorGradePreset =
  | "kids-bright"
  | "kids-pastel"
  | "warm-golden"
  | "cool-blue"
  | "cinematic-teal"
  | "neutral";

export interface TransitionSegment {
  fromSceneId: string;
  toSceneId: string;
  type: TransitionPreset;
  durationSec: number;
  /** CSS-like easing function */
  easing: string;
}

export interface ColorGradeConfig {
  preset: ColorGradePreset;
  saturation: number;   // 0–2
  contrast: number;     // 0–2
  brightness: number;   // 0–2
  warmth: number;       // -1 to 1
  vignetteStrength: number; // 0–1
}

export interface AudioMixSegment {
  type: "narration" | "bgm" | "sfx";
  sceneId: string;
  startSec: number;
  endSec: number;
  volume: number;
  duckingPoints?: DuckingPoint[];
  sfxCues?: SfxCue[];
}

export interface MasterEpisodeComposition {
  episodeId: string;
  title: string;
  /** Ordered scene sequence */
  scenes: CartoonSceneManifest[];
  /** Transitions between scenes */
  transitions: TransitionSegment[];
  /** Global color grade */
  colorGrade: ColorGradeConfig;
  /** Full audio mix timeline */
  audioMix: AudioMixSegment[];
  /** Quality profile for rendering */
  quality: QualityProfile;
  /** Duration lock result */
  durationLock: DurationLockResult;
  /** Total episode duration */
  totalDurationSec: number;
  /** Pacing mode */
  pacingMode: PacingMode;
  /** Created timestamp */
  createdAt: string;
}

/* ── Color Grade Presets ── */

const COLOR_PRESETS: Record<ColorGradePreset, ColorGradeConfig> = {
  "kids-bright": {
    preset: "kids-bright",
    saturation: 1.4,
    contrast: 0.95,
    brightness: 1.1,
    warmth: 0.2,
    vignetteStrength: 0.05,
  },
  "kids-pastel": {
    preset: "kids-pastel",
    saturation: 1.2,
    contrast: 0.85,
    brightness: 1.15,
    warmth: 0.15,
    vignetteStrength: 0.0,
  },
  "warm-golden": {
    preset: "warm-golden",
    saturation: 1.15,
    contrast: 1.05,
    brightness: 1.0,
    warmth: 0.35,
    vignetteStrength: 0.15,
  },
  "cool-blue": {
    preset: "cool-blue",
    saturation: 0.9,
    contrast: 1.1,
    brightness: 0.95,
    warmth: -0.2,
    vignetteStrength: 0.2,
  },
  "cinematic-teal": {
    preset: "cinematic-teal",
    saturation: 0.85,
    contrast: 1.2,
    brightness: 0.9,
    warmth: -0.1,
    vignetteStrength: 0.3,
  },
  neutral: {
    preset: "neutral",
    saturation: 1.0,
    contrast: 1.0,
    brightness: 1.0,
    warmth: 0.0,
    vignetteStrength: 0.0,
  },
};

/** Emotion → transition type mapping */
const EMOTION_TRANSITION: Record<string, TransitionPreset> = {
  calm: "crossfade",
  playful: "crossfade",
  magical: "dissolve",
  tense: "hard-cut",
  dramatic: "hard-cut",
  action: "hard-cut",
  emotional: "crossfade",
  triumphant: "dip-to-black",
  wonder: "dissolve",
  curiosity: "crossfade",
  excitement: "hard-cut",
  fear: "hard-cut",
  hope: "dissolve",
  triumph: "dip-to-black",
  joy: "crossfade",
  warmth: "dissolve",
};

/** Transition durations */
const TRANSITION_DURATIONS: Record<TransitionPreset, number> = {
  crossfade: 0.8,
  "hard-cut": 0.1,
  "dip-to-black": 1.2,
  dissolve: 1.0,
  wipe: 0.6,
};

/* ── Core Functions ── */

/**
 * Compose a full Hollywood-grade episode from cartoon scene manifests.
 */
export function composeHollywoodEpisode(
  episodeId: string,
  title: string,
  scenes: CartoonSceneManifest[],
  targetDuration: VideoDuration,
  pacingMode: PacingMode = "kids",
): MasterEpisodeComposition {
  if (scenes.length === 0) {
    throw new Error("Cannot compose episode with zero scenes");
  }

  // Step 1: Build transitions between scenes
  const transitions = buildTransitions(scenes, pacingMode);

  // Step 2: Select color grade
  const colorGrade = selectColorGrade(pacingMode, scenes);

  // Step 3: Build audio mix timeline
  const audioMix = buildAudioMix(scenes);

  // Step 4: Duration lock validation
  const sceneDurations = scenes.map((s) => s.durationSec);
  const introSec = scenes[0]?.transitionIn?.durationSec ?? 0.8;
  const outroSec = scenes[scenes.length - 1]?.transitionOut?.durationSec ?? 1.2;

  const durationLock = lockDuration({
    targetDuration,
    scenes: scenes.map((s) => ({
      sceneId: s.sceneId,
      durationSec: s.durationSec,
      narrationDurationSec: s.audioLayers
        .filter((a) => a.type === "narration")
        .reduce((sum, a) => sum + a.durationSec, 0),
      isCompressible: true,
    })),
    introSec,
    outroSec,
  });

  // Step 5: Apply duration adjustments if needed
  if (durationLock.wasAutoAdjusted) {
    for (const adj of durationLock.adjustedScenes) {
      const scene = scenes.find((s) => s.sceneId === adj.sceneId);
      if (scene) {
        scene.durationSec = adj.adjustedDuration;
      }
    }
  }

  const totalDurationSec = durationLock.currentTotalSec;

  return {
    episodeId,
    title,
    scenes,
    transitions,
    colorGrade,
    audioMix,
    quality: scenes[0].quality,
    durationLock,
    totalDurationSec,
    pacingMode,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Validate a composition before rendering.
 */
export function validateComposition(
  composition: MasterEpisodeComposition,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check duration lock
  if (!composition.durationLock.renderAllowed) {
    errors.push(`Duration lock failed: ${composition.durationLock.statusMessage}`);
  }

  // Check scene count
  if (composition.scenes.length === 0) {
    errors.push("No scenes in composition");
  }

  // Check all scenes have at least one background
  for (const scene of composition.scenes) {
    if (scene.backgrounds.length === 0) {
      errors.push(`Scene ${scene.sceneId} missing background`);
    }
    if (scene.durationSec <= 0) {
      errors.push(`Scene ${scene.sceneId} has invalid duration: ${scene.durationSec}`);
    }
  }

  // Check transitions count matches
  if (composition.transitions.length !== Math.max(0, composition.scenes.length - 1)) {
    errors.push(
      `Expected ${composition.scenes.length - 1} transitions, found ${composition.transitions.length}`,
    );
  }

  // Check total duration is reasonable
  if (composition.totalDurationSec <= 0) {
    errors.push("Total duration must be positive");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get the CSS filter string for applying a color grade to a canvas.
 */
export function getColorGradeFilter(config: ColorGradeConfig): string {
  const parts: string[] = [];
  if (config.saturation !== 1.0) parts.push(`saturate(${config.saturation})`);
  if (config.contrast !== 1.0) parts.push(`contrast(${config.contrast})`);
  if (config.brightness !== 1.0) parts.push(`brightness(${config.brightness})`);
  if (config.warmth > 0) parts.push(`sepia(${config.warmth * 0.3})`);
  if (config.warmth < 0) parts.push(`hue-rotate(${config.warmth * 15}deg)`);
  return parts.length > 0 ? parts.join(" ") : "none";
}

/**
 * Get available color presets for UI.
 */
export function getColorPresets(): Array<{ id: ColorGradePreset; label: string }> {
  return [
    { id: "kids-bright", label: "Bright Kids" },
    { id: "kids-pastel", label: "Soft Pastel" },
    { id: "warm-golden", label: "Golden Hour" },
    { id: "cool-blue", label: "Cool Blue" },
    { id: "cinematic-teal", label: "Cinematic" },
    { id: "neutral", label: "Natural" },
  ];
}

/* ── Internal Functions ── */

function buildTransitions(
  scenes: CartoonSceneManifest[],
  pacingMode: PacingMode,
): TransitionSegment[] {
  const transitions: TransitionSegment[] = [];

  for (let i = 0; i < scenes.length - 1; i++) {
    const from = scenes[i];
    const to = scenes[i + 1];

    // Use emotion-based transition type
    const emotionKey = to.emotion || "calm";
    let transType = EMOTION_TRANSITION[emotionKey] ?? "crossfade";

    // Pacing mode overrides
    if (pacingMode === "action" && transType === "crossfade") {
      transType = "hard-cut";
    }
    if (pacingMode === "documentary" && transType === "hard-cut") {
      transType = "dissolve";
    }

    // Climax detection: if tension is high, use quick cuts
    const isClimax = from.emotion === "action" || from.emotion === "dramatic";
    if (isClimax && pacingMode !== "documentary") {
      transType = "hard-cut";
    }

    // Last scene → always dip-to-black
    if (i === scenes.length - 2) {
      transType = "dip-to-black";
    }

    transitions.push({
      fromSceneId: from.sceneId,
      toSceneId: to.sceneId,
      type: transType,
      durationSec: TRANSITION_DURATIONS[transType],
      easing: transType === "hard-cut" ? "linear" : "ease-in-out",
    });
  }

  return transitions;
}

function selectColorGrade(
  pacingMode: PacingMode,
  scenes: CartoonSceneManifest[],
): ColorGradeConfig {
  // Kids mode → always bright kids palette
  if (pacingMode === "kids") return { ...COLOR_PRESETS["kids-bright"] };
  if (pacingMode === "documentary") return { ...COLOR_PRESETS.neutral };

  // Determine dominant emotion
  const emotionCounts: Record<string, number> = {};
  for (const s of scenes) {
    const e = s.emotion || "calm";
    emotionCounts[e] = (emotionCounts[e] || 0) + 1;
  }

  const dominant = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "calm";

  // Map emotion to color preset
  const emotionToPreset: Record<string, ColorGradePreset> = {
    calm: "warm-golden",
    playful: "kids-pastel",
    magical: "kids-pastel",
    tense: "cool-blue",
    dramatic: "cinematic-teal",
    action: "cinematic-teal",
    emotional: "warm-golden",
    triumphant: "warm-golden",
  };

  const preset = emotionToPreset[dominant] ?? "neutral";
  return { ...COLOR_PRESETS[preset] };
}

function buildAudioMix(scenes: CartoonSceneManifest[]): AudioMixSegment[] {
  const mix: AudioMixSegment[] = [];
  let globalOffset = 0;

  for (const scene of scenes) {
    // Narration segments
    for (const audio of scene.audioLayers) {
      if (audio.type === "narration") {
        mix.push({
          type: "narration",
          sceneId: scene.sceneId,
          startSec: globalOffset + audio.startSec,
          endSec: globalOffset + audio.startSec + audio.durationSec,
          volume: audio.volume,
        });
      }
    }

    // BGM with ducking
    mix.push({
      type: "bgm",
      sceneId: scene.sceneId,
      startSec: globalOffset,
      endSec: globalOffset + scene.durationSec,
      volume: 1.0,
      duckingPoints: scene.duckingEnvelope,
    });

    // SFX cues
    if (scene.sfxCues.length > 0) {
      mix.push({
        type: "sfx",
        sceneId: scene.sceneId,
        startSec: globalOffset,
        endSec: globalOffset + scene.durationSec,
        volume: 1.0,
        sfxCues: scene.sfxCues,
      });
    }

    globalOffset += scene.durationSec;
  }

  return mix;
}
