/**
 * shotComposer.ts — Hollywood Shot Composition Logic
 *
 * Generates shot breakdowns and transition plans for video scenes:
 *   - Establishing shots (2–3s)
 *   - Dialogue shots (matched to narration length)
 *   - Reaction shots (0.8–1.2s)
 *   - Dramatic pauses (1s fade)
 *   - Transition types based on mood (crossfade / hard cut / dip-to-black)
 *   - Camera movement enhancement for Runway prompts
 *
 * Outputs structured shot lists and camera instructions that feed
 * both the client renderer and the Runway prompt enhancer.
 */

import type { PacingMode } from "./timelineOrchestrator";
import type { NarrationTimingResult, SceneEmotion } from "./narrationTiming";

/* ── Types ── */

export type ShotType = "establishing" | "dialogue" | "reaction" | "dramatic-pause" | "closeup" | "wide";
export type TransitionType = "crossfade" | "hard-cut" | "dip-to-black" | "dissolve" | "wipe";
export type CameraMotion = "static" | "slow-pan" | "dolly-in" | "dolly-out" | "zoom-in" | "zoom-out" | "tracking" | "crane-up";

export interface ShotDefinition {
  /** Shot identifier */
  id: string;
  /** Shot type */
  type: ShotType;
  /** Duration in seconds */
  durationSec: number;
  /** Camera motion instruction */
  cameraMotion: CameraMotion;
  /** Camera motion intensity 0–1 */
  motionIntensity: number;
  /** Description for rendering / prompt */
  description: string;
  /** Start offset within scene (seconds) */
  startOffsetSec: number;
}

export interface TransitionDefinition {
  /** Transition type */
  type: TransitionType;
  /** Duration in seconds */
  durationSec: number;
  /** Description */
  description: string;
}

export interface SceneShotPlan {
  sceneId: string;
  /** Ordered shots within the scene */
  shots: ShotDefinition[];
  /** Transition INTO this scene (from previous) */
  transitionIn: TransitionDefinition;
  /** Transition OUT of this scene (to next) */
  transitionOut: TransitionDefinition;
  /** Total scene duration including transitions */
  totalDurationSec: number;
  /** Enhanced camera prompt for Runway */
  cameraInstructions: string;
}

/* ── Constants ── */

/** Shot duration ranges by type (seconds) */
const SHOT_DURATIONS: Record<ShotType, { min: number; max: number }> = {
  establishing:    { min: 2.0, max: 3.0 },
  dialogue:        { min: 2.0, max: 30.0 },  // matched to narration
  reaction:        { min: 0.8, max: 1.2 },
  "dramatic-pause": { min: 0.8, max: 1.5 },
  closeup:         { min: 1.5, max: 3.0 },
  wide:            { min: 2.0, max: 4.0 },
};

/** Transition types by emotion/mood */
const TRANSITION_MAP: Record<SceneEmotion, TransitionType> = {
  calm:       "crossfade",
  playful:    "crossfade",
  magical:    "dissolve",
  tense:      "hard-cut",
  dramatic:   "hard-cut",
  action:     "hard-cut",
  emotional:  "crossfade",
  triumphant: "dip-to-black",
};

/** Transition durations */
const TRANSITION_DURATIONS: Record<TransitionType, number> = {
  crossfade:      0.8,
  "hard-cut":     0.1,
  "dip-to-black": 1.2,
  dissolve:       1.0,
  wipe:           0.6,
};

/** Camera motions per emotion */
const CAMERA_MOTIONS: Record<SceneEmotion, CameraMotion[]> = {
  calm:       ["static", "slow-pan"],
  playful:    ["slow-pan", "tracking"],
  magical:    ["dolly-in", "crane-up"],
  tense:      ["zoom-in", "static"],
  dramatic:   ["dolly-in", "zoom-in"],
  action:     ["tracking", "dolly-out", "zoom-out"],
  emotional:  ["dolly-in", "slow-pan"],
  triumphant: ["crane-up", "dolly-out"],
};

/** Motion intensity per pacing mode (0–1) */
const MODE_INTENSITY: Record<PacingMode, number> = {
  story:       0.5,
  action:      0.8,
  documentary: 0.3,
  kids:        0.6,
};

/* ── Runway Prompt Enhancement ── */

/** Cinematic enhancement keywords for Runway prompt augmentation */
const CINEMATIC_KEYWORDS: Record<CameraMotion, string> = {
  static:     "locked-off tripod shot, stable composition",
  "slow-pan": "slow cinematic pan, smooth lateral movement",
  "dolly-in": "slow cinematic dolly-in camera movement, subtle parallax depth",
  "dolly-out": "cinematic dolly-out reveal, expanding field of view",
  "zoom-in":  "dynamic rack focus, gradual zoom into subject",
  "zoom-out": "zoom-out establishing shot, widening perspective",
  tracking:   "smooth tracking shot following action, slight handheld realism",
  "crane-up": "crane-up reveal shot, ascending vertical camera movement",
};

/** Additional cinematic atmosphere keywords */
const ATMOSPHERE_KEYWORDS = [
  "volumetric lighting",
  "shallow depth of field",
  "natural film grain",
  "35mm cinematic film look",
] as const;

/* ── Core Functions ── */

/**
 * Generate a shot plan for a single scene.
 *
 * Uses narration timing to determine shot breakdown:
 *   - Short narration → tighter cuts, more reaction shots
 *   - Long narration → wider cinematic shots, let scenes breathe
 */
export function composeSceneShots(
  sceneId: string,
  timing: NarrationTimingResult,
  emotion: SceneEmotion,
  sceneIndex: number,
  totalScenes: number,
  pacingMode: PacingMode = "story",
): SceneShotPlan {
  const { narrationDuration, sceneDuration, pauseBuffer } = timing;
  const intensity = MODE_INTENSITY[pacingMode] ?? 0.5;

  const shots: ShotDefinition[] = [];
  let offset = 0;

  // First scene gets establishing shot
  if (sceneIndex === 0) {
    const estDuration = lerp(SHOT_DURATIONS.establishing.min, SHOT_DURATIONS.establishing.max, 1 - intensity);
    shots.push({
      id: `${sceneId}_shot_est`,
      type: "establishing",
      durationSec: round2(estDuration),
      cameraMotion: "dolly-out",
      motionIntensity: intensity * 0.7,
      description: "Establishing shot — scene introduction",
      startOffsetSec: 0,
    });
    offset += estDuration;
  }

  // Main dialogue/narration shot — covers narration duration
  const mainDuration = Math.max(2, narrationDuration - offset);
  const motionChoices = CAMERA_MOTIONS[emotion] ?? ["static"];
  const chosenMotion = motionChoices[sceneIndex % motionChoices.length];

  shots.push({
    id: `${sceneId}_shot_main`,
    type: "dialogue",
    durationSec: round2(mainDuration),
    cameraMotion: chosenMotion,
    motionIntensity: intensity,
    description: `Main narration shot — ${emotion} mood`,
    startOffsetSec: round2(offset),
  });
  offset += mainDuration;

  // Short narration → add reaction shot
  if (narrationDuration < 8 && pauseBuffer > 0.3) {
    const reactDuration = lerp(SHOT_DURATIONS.reaction.min, SHOT_DURATIONS.reaction.max, intensity);
    shots.push({
      id: `${sceneId}_shot_react`,
      type: "reaction",
      durationSec: round2(reactDuration),
      cameraMotion: "zoom-in",
      motionIntensity: intensity * 0.5,
      description: "Reaction shot — character response",
      startOffsetSec: round2(offset),
    });
    offset += reactDuration;
  }

  // Dramatic or emotional scenes → add dramatic pause
  if ((emotion === "dramatic" || emotion === "emotional" || emotion === "triumphant") && pauseBuffer > 0.5) {
    const pauseDur = lerp(
      SHOT_DURATIONS["dramatic-pause"].min,
      SHOT_DURATIONS["dramatic-pause"].max,
      timing.emotionalIntensity,
    );
    shots.push({
      id: `${sceneId}_shot_pause`,
      type: "dramatic-pause",
      durationSec: round2(pauseDur),
      cameraMotion: "static",
      motionIntensity: 0.1,
      description: "Dramatic pause — emotional beat",
      startOffsetSec: round2(offset),
    });
    offset += pauseDur;
  }

  // Last scene → add final wide shot before dip-to-black
  if (sceneIndex === totalScenes - 1) {
    const wideDur = lerp(SHOT_DURATIONS.wide.min, SHOT_DURATIONS.wide.max, 0.5);
    shots.push({
      id: `${sceneId}_shot_final`,
      type: "wide",
      durationSec: round2(wideDur),
      cameraMotion: "crane-up",
      motionIntensity: 0.6,
      description: "Final wide shot — episode conclusion",
      startOffsetSec: round2(offset),
    });
    offset += wideDur;
  }

  // Transitions
  const transType = TRANSITION_MAP[emotion] ?? "crossfade";
  const transOutType = sceneIndex === totalScenes - 1 ? "dip-to-black" : transType;

  const transitionIn: TransitionDefinition = {
    type: sceneIndex === 0 ? "dip-to-black" : transType,
    durationSec: sceneIndex === 0 ? 0.8 : TRANSITION_DURATIONS[transType],
    description: sceneIndex === 0 ? "Episode opening fade-in" : `${transType} from previous scene`,
  };

  const transitionOut: TransitionDefinition = {
    type: transOutType,
    durationSec: TRANSITION_DURATIONS[transOutType],
    description: sceneIndex === totalScenes - 1 ? "Episode ending dip-to-black" : `${transOutType} to next scene`,
  };

  // Camera instructions for Runway
  const cameraInstructions = buildCameraInstructions(chosenMotion, emotion, intensity);

  return {
    sceneId,
    shots,
    transitionIn,
    transitionOut,
    totalDurationSec: round2(Math.max(sceneDuration, offset)),
    cameraInstructions,
  };
}

/**
 * Generate shot plans for all scenes in an episode.
 */
export function composeEpisodeShots(
  timings: NarrationTimingResult[],
  emotions: SceneEmotion[],
  pacingMode: PacingMode = "story",
): SceneShotPlan[] {
  const total = timings.length;
  return timings.map((t, i) =>
    composeSceneShots(t.sceneId, t, emotions[i] ?? "calm", i, total, pacingMode),
  );
}

/**
 * Enhance a Runway promptText with cinematic camera instructions.
 *
 * Takes the original scene description and appends Hollywood-quality
 * camera and atmosphere keywords for superior Runway output.
 */
export function enhanceRunwayPrompt(
  originalPrompt: string,
  cameraMotion: CameraMotion,
  emotion: SceneEmotion,
  intensity: number = 0.5,
): string {
  const base = originalPrompt.trim();
  const cameraDesc = CINEMATIC_KEYWORDS[cameraMotion] ?? CINEMATIC_KEYWORDS.static;

  // Pick atmosphere keywords (more for higher intensity)
  const atmosCount = Math.max(1, Math.round(ATMOSPHERE_KEYWORDS.length * intensity));
  const atmosKeywords = ATMOSPHERE_KEYWORDS.slice(0, atmosCount).join(", ");

  // Emotion-specific color grading hint
  const colorHints: Record<string, string> = {
    calm:       "warm golden hour tones",
    magical:    "ethereal pastel glow",
    tense:      "desaturated cool tones, dramatic shadows",
    action:     "high contrast, dynamic motion blur",
    playful:    "bright saturated colors, cheerful lighting",
    dramatic:   "chiaroscuro lighting, deep shadows",
    emotional:  "soft diffused light, intimate warmth",
    triumphant: "radiant golden backlight, hero lighting",
  };
  const colorHint = colorHints[emotion] ?? "";

  return [
    base,
    cameraDesc,
    atmosKeywords,
    colorHint,
  ].filter(Boolean).join(", ");
}

/* ── Helpers ── */

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * Math.max(0, Math.min(1, t));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildCameraInstructions(
  motion: CameraMotion,
  emotion: SceneEmotion,
  intensity: number,
): string {
  const cameraDesc = CINEMATIC_KEYWORDS[motion] ?? "static composition";
  const atmosCount = Math.max(1, Math.round(ATMOSPHERE_KEYWORDS.length * intensity));
  const atmos = ATMOSPHERE_KEYWORDS.slice(0, atmosCount).join(", ");
  return `${cameraDesc}, ${atmos}`;
}
