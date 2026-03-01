/**
 * timelineOrchestrator.ts — AI Timeline Orchestrator (Master Engine)
 *
 * Coordinates all sub-engines into a unified cinematic composition:
 *   1. narrationTiming    → scene durations from real audio
 *   2. audioDuckingEngine → BGM volume envelopes
 *   3. sfxSyncEngine      → keyword-triggered SFX cue sheets
 *   4. shotComposer       → shot breakdowns + camera instructions
 *
 * Accepts a structured episode script + audio metadata,
 * runs all engines, and outputs a MasterComposition JSON
 * that the video renderer and edge function consume.
 *
 * All timing math runs either server-side (edge function) or
 * client-side (before render). Zero heavy processing — pure math.
 */

import {
  computeEpisodeTiming,
  moodToEmotion,
  type NarrationTimingInput,
  type NarrationTimingResult,
  type SceneEmotion,
} from "./narrationTiming";

import {
  generateEpisodeDucking,
  type SceneDuckingEnvelope,
  type NarrationSegment,
} from "./audioDuckingEngine";

import {
  analyzeEpisodeSfx,
  type SfxAnalysisInput,
  type SceneSfxSheet,
  type SfxCue,
} from "./sfxSyncEngine";

import {
  composeEpisodeShots,
  enhanceRunwayPrompt,
  type SceneShotPlan,
  type TransitionDefinition,
  type CameraMotion,
} from "./shotComposer";

/* ── Types ── */

/**
 * Cinematic pacing mode. Controls pause buffers, camera intensity,
 * SFX density, and transition speed across the entire episode.
 */
export type PacingMode = "story" | "action" | "documentary" | "kids";

/** Human-readable pacing mode labels */
export const PACING_MODE_LABELS: Record<PacingMode, string> = {
  story:       "Story Mode",
  action:      "Action Mode",
  documentary: "Documentary Mode",
  kids:        "Kids Mode",
};

/** Pacing mode descriptions for UI */
export const PACING_MODE_DESCRIPTIONS: Record<PacingMode, string> = {
  story:       "Smooth pacing with natural breathing room",
  action:      "Tight cuts, high energy, more SFX",
  documentary: "Slow zooms, calm narration, minimal effects",
  kids:        "Bright, playful pacing with fun surprises",
};

/** Input scene data for the orchestrator */
export interface OrchestratorSceneInput {
  sceneId: string;
  narrationText: string;
  /** Scene mood (from episodeSchema) */
  mood: string;
  /** Actual decoded audio duration (null if TTS failed) */
  audioDurationSec: number | null;
  /** Audio URL */
  audioUrl: string;
  /** Original scene caption */
  caption: string;
  /** Scene image URL (for Runway prompt enhancement) */
  imageUrl: string | null;
}

/** Full orchestrator input */
export interface OrchestratorInput {
  /** Episode / job identifier */
  episodeId: string;
  /** Episode title */
  title: string;
  /** Ordered scenes */
  scenes: OrchestratorSceneInput[];
  /** Desired pacing mode */
  pacingMode: PacingMode;
  /** BGM music style hint */
  musicStyle?: string;
}

/** A single scene in the master composition */
export interface ComposedScene {
  id: string;
  /** Computed total duration (narration + pauses + transitions) */
  duration: number;
  /** Narration audio URL */
  narrationUrl: string;
  /** Narration text */
  narrationText: string;
  /** Scene image URL */
  imageUrl: string | null;
  /** SFX cue layers */
  sfxLayers: SfxCue[];
  /** BGM ducking envelope */
  bgmSegment: SceneDuckingEnvelope;
  /** Transition in/out definitions */
  transitions: {
    in: TransitionDefinition;
    out: TransitionDefinition;
  };
  /** Camera instructions for Runway prompt */
  cameraInstructions: string;
  /** Enhanced Runway prompt (original caption + cinematic augmentation) */
  enhancedPrompt: string;
  /** Shot breakdown */
  shotPlan: SceneShotPlan;
  /** Narration timing metadata */
  timing: NarrationTimingResult;
  /** Emotion classification */
  emotion: SceneEmotion;
}

/** Master composition output — the final orchestrated package */
export interface MasterComposition {
  /** Episode / job identifier */
  episodeId: string;
  /** Episode title */
  title: string;
  /** All composed scenes in order */
  scenes: ComposedScene[];
  /** Total computed duration */
  totalDuration: number;
  /** Active pacing profile name */
  pacingProfile: PacingMode;
  /** Music style hint */
  musicStyle: string;
  /** Creation timestamp */
  createdAt: string;
  /** Schema version */
  version: 1;
  /** Provider-specific payload (for edge function consumption) */
  providerPayload: {
    /** Enhanced prompts per scene (for Runway) */
    runwayPrompts: Array<{ sceneId: string; prompt: string; cameraMotion: CameraMotion }>;
    /** Total narration seconds (for billing estimation) */
    totalNarrationSec: number;
    /** Total SFX cue count */
    totalSfxCues: number;
  };
}

/* ── Core Orchestration ── */

/**
 * Run the full timeline orchestration pipeline.
 *
 * This is the MAIN entry point. Runs all four sub-engines
 * and produces a MasterComposition ready for the renderer.
 *
 * Pure function — no side effects, no network calls.
 * All timing math, zero heavy processing.
 */
export function orchestrateTimeline(input: OrchestratorInput): MasterComposition {
  const { episodeId, title, scenes, pacingMode, musicStyle = "magical" } = input;

  if (scenes.length === 0) {
    return emptyComposition(episodeId, title, pacingMode, musicStyle);
  }

  /* ── Step 1: Narration Timing ── */
  const timingInputs: NarrationTimingInput[] = scenes.map((s) => ({
    sceneId: s.sceneId,
    narrationText: s.narrationText,
    emotion: moodToEmotion(s.mood),
    audioDurationSec: s.audioDurationSec,
    audioUrl: s.audioUrl,
  }));

  const timings = computeEpisodeTiming(timingInputs, pacingMode);

  /* ── Step 2: Emotion classification ── */
  const emotions: SceneEmotion[] = scenes.map((s) => moodToEmotion(s.mood));

  /* ── Step 3: Shot composition ── */
  const shotPlans = composeEpisodeShots(timings, emotions, pacingMode);

  /* ── Step 4: SFX analysis ── */
  const sfxInputs: SfxAnalysisInput[] = scenes.map((s, i) => ({
    sceneId: s.sceneId,
    narrationText: s.narrationText,
    narrationDuration: timings[i].narrationDuration,
    emotion: emotions[i],
  }));

  const sfxSheets = analyzeEpisodeSfx(sfxInputs, pacingMode);

  /* ── Step 5: BGM ducking ── */
  const duckingInputs = scenes.map((s, i) => {
    const narrationSeg: NarrationSegment = {
      startSec: 0,
      durationSec: timings[i].narrationDuration,
    };
    return {
      sceneId: s.sceneId,
      durationSec: timings[i].sceneDuration,
      narrationSegments: [narrationSeg],
    };
  });

  const duckingEnvelopes = generateEpisodeDucking(duckingInputs);

  /* ── Step 6: Compose final scenes ── */
  const composedScenes: ComposedScene[] = scenes.map((s, i) => {
    const timing = timings[i];
    const shotPlan = shotPlans[i];
    const sfxSheet = sfxSheets[i];
    const ducking = duckingEnvelopes[i];
    const emotion = emotions[i];

    // Build enhanced Runway prompt
    const primaryMotion = shotPlan.shots[0]?.cameraMotion ?? "static";
    const enhancedPrompt = enhanceRunwayPrompt(
      buildAnimationPrompt(s.caption, s.narrationText),
      primaryMotion as CameraMotion,
      emotion,
      timing.emotionalIntensity,
    );

    return {
      id: s.sceneId,
      duration: shotPlan.totalDurationSec,
      narrationUrl: s.audioUrl,
      narrationText: s.narrationText,
      imageUrl: s.imageUrl,
      sfxLayers: sfxSheet.cues,
      bgmSegment: ducking,
      transitions: {
        in: shotPlan.transitionIn,
        out: shotPlan.transitionOut,
      },
      cameraInstructions: shotPlan.cameraInstructions,
      enhancedPrompt,
      shotPlan,
      timing,
      emotion,
    };
  });

  /* ── Step 7: Compute totals ── */
  const totalDuration = composedScenes.reduce((sum, s) => sum + s.duration, 0);
  const totalNarrationSec = timings.reduce((sum, t) => sum + t.narrationDuration, 0);
  const totalSfxCues = sfxSheets.reduce((sum, s) => sum + s.cues.length, 0);

  /* ── Step 8: Build provider payload ── */
  const runwayPrompts = composedScenes.map((s) => ({
    sceneId: s.id,
    prompt: s.enhancedPrompt,
    cameraMotion: s.shotPlan.shots[0]?.cameraMotion ?? ("static" as CameraMotion),
  }));

  return {
    episodeId,
    title,
    scenes: composedScenes,
    totalDuration: Math.round(totalDuration * 100) / 100,
    pacingProfile: pacingMode,
    musicStyle,
    createdAt: new Date().toISOString(),
    version: 1,
    providerPayload: {
      runwayPrompts,
      totalNarrationSec: Math.round(totalNarrationSec * 100) / 100,
      totalSfxCues,
    },
  };
}

/**
 * Re-orchestrate with a different pacing mode.
 * Useful for UI "try different pacing" feature.
 */
export function reorchestrateWithMode(
  input: OrchestratorInput,
  newMode: PacingMode,
): MasterComposition {
  return orchestrateTimeline({ ...input, pacingMode: newMode });
}

/**
 * Extract the enhanced Runway prompts from a composition.
 * Convenience function for the edge function.
 */
export function getRunwayPrompts(
  composition: MasterComposition,
): Array<{ sceneId: string; prompt: string; cameraMotion: CameraMotion }> {
  return composition.providerPayload.runwayPrompts;
}

/* ── Helpers ── */

function emptyComposition(
  episodeId: string,
  title: string,
  pacingMode: PacingMode,
  musicStyle: string,
): MasterComposition {
  return {
    episodeId,
    title,
    scenes: [],
    totalDuration: 0,
    pacingProfile: pacingMode,
    musicStyle,
    createdAt: new Date().toISOString(),
    version: 1,
    providerPayload: {
      runwayPrompts: [],
      totalNarrationSec: 0,
      totalSfxCues: 0,
    },
  };
}

/** Build a concise animation prompt from scene content (max ~200 chars base) */
function buildAnimationPrompt(caption: string, narration: string): string {
  const content = (caption || narration || "").slice(0, 200);
  return `Gentle, smooth, child-friendly animation of a storybook illustration. Soft natural movement, warm and whimsical. ${content}`;
}
