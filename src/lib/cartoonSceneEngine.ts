/**
 * cartoonSceneEngine.ts — Scene-to-Scene Master Cartoon Generation Pipeline
 *
 * Orchestrates the full generation pipeline for each story scene:
 *   1. Character animation (Runway gen3a_turbo)
 *   2. Background environment video
 *   3. Narration audio (ElevenLabs TTS)
 *   4. Character dialogue audio
 *   5. Phoneme timing extraction → lip sync alignment
 *   6. Scene composition with camera + transitions
 *   7. Handoff to master episode compositor
 *
 * This engine produces a CartoonSceneManifest per scene that the
 * Hollywood composer stitches into the final episode.
 */

import type { PacingMode } from "@/lib/studio/video/videoJobTypes";
import type { SceneEmotion } from "@/lib/studio/narrationTiming";
import type { SfxCue } from "@/lib/studio/sfxSyncEngine";
import type { DuckingPoint } from "@/lib/studio/audioDuckingEngine";
import { enhanceWithLighting } from "@/lib/lightingDirector";
import { enhancePromptWithDNA, type CharacterDNA } from "@/lib/characterDNAEngine";

/* ── Types ── */

export interface CharacterAnimation {
  characterId: string;
  animationUrl: string | null;
  /** Duration of animation clip in seconds */
  durationSec: number;
  /** Camera movement applied to character */
  cameraMotion: string;
  /** Whether lip sync is applied */
  hasLipSync: boolean;
}

export interface BackgroundLayer {
  type: "static-image" | "animated-video" | "gradient-fallback";
  url: string | null;
  durationSec: number;
  /** Parallax depth factor: 0 = foreground, 1 = far background */
  depthFactor: number;
}

export interface AudioLayer {
  type: "narration" | "dialogue" | "bgm" | "sfx";
  url: string | null;
  startSec: number;
  durationSec: number;
  volume: number;
  characterId?: string;
}

export interface LipSyncData {
  characterId: string;
  phonemes: Array<{
    phoneme: string;
    startMs: number;
    endMs: number;
    mouthShape: string;
  }>;
  isEstimated: boolean;
}

export interface CartoonSceneManifest {
  sceneId: string;
  sceneNumber: number;
  act: 1 | 2 | 3;
  /** Total scene duration including transitions */
  durationSec: number;
  /** Character animation layers */
  characters: CharacterAnimation[];
  /** Background environment layers */
  backgrounds: BackgroundLayer[];
  /** All audio layers for this scene */
  audioLayers: AudioLayer[];
  /** Lip sync data per character */
  lipSyncLayers: LipSyncData[];
  /** SFX cues aligned to narration */
  sfxCues: SfxCue[];
  /** BGM ducking envelope */
  duckingEnvelope: DuckingPoint[];
  /** Camera instructions string */
  cameraInstructions: string;
  /** Transition into this scene */
  transitionIn: { type: string; durationSec: number };
  /** Transition out of this scene */
  transitionOut: { type: string; durationSec: number };
  /** Emotion classification */
  emotion: SceneEmotion;
  /** Enhanced Runway prompt */
  enhancedPrompt: string;
  /** Pixar lighting directive applied to this scene */
  lightingDirective: string;
  /** Character DNA identity fragments (for consistency validation) */
  characterDNAFragments: string[];
  /** Quality profile */
  quality: QualityProfile;
}

export interface QualityProfile {
  resolution: "720p" | "1080p" | "4k";
  colorSaturation: number; // 0–2, 1 = normal
  lightingProfile: "soft" | "dramatic" | "natural" | "studio";
  outlineStrength: number; // 0–1 for cartoon outlines
  motionSmoothing: boolean;
  frameInterpolation: boolean;
  antiFlicker: boolean;
}

export interface CartoonSceneInput {
  sceneId: string;
  sceneNumber: number;
  act: 1 | 2 | 3;
  narrationText: string;
  caption: string;
  imageUrl: string | null;
  audioUrl: string | null;
  audioDurationSec: number;
  videoClipUrl: string | null;
  emotion: SceneEmotion;
  enhancedPrompt: string;
  cameraInstructions: string;
  sfxCues: SfxCue[];
  duckingEnvelope: DuckingPoint[];
  transitionIn: { type: string; durationSec: number };
  transitionOut: { type: string; durationSec: number };
  sceneDuration: number;
  characterIds: string[];
  /** Optional character DNA profiles for identity consistency */
  characterDNAs?: CharacterDNA[];
}

/* ── Quality Profiles ── */

const QUALITY_PROFILES: Record<string, QualityProfile> = {
  kids: {
    resolution: "1080p",
    colorSaturation: 1.4,     // High saturation for kids
    lightingProfile: "soft",
    outlineStrength: 0.7,     // Clean cartoon outlines
    motionSmoothing: true,
    frameInterpolation: true,
    antiFlicker: true,
  },
  standard: {
    resolution: "1080p",
    colorSaturation: 1.1,
    lightingProfile: "natural",
    outlineStrength: 0.3,
    motionSmoothing: true,
    frameInterpolation: false,
    antiFlicker: true,
  },
  cinematic: {
    resolution: "1080p",
    colorSaturation: 1.0,
    lightingProfile: "dramatic",
    outlineStrength: 0.0,
    motionSmoothing: false,
    frameInterpolation: true,
    antiFlicker: true,
  },
};

/* ── Core Functions ── */

/**
 * Compose a full cartoon scene manifest from input data.
 * This runs client-side after the edge function provides base assets.
 */
export function composeCartoonScene(
  input: CartoonSceneInput,
  pacingMode: PacingMode = "kids",
): CartoonSceneManifest {
  const quality = getQualityProfile(pacingMode);

  // ── Pixar Lighting Enhancement ──
  const lightingDirective = enhanceWithLighting(
    input.enhancedPrompt,
    input.emotion as string,
    { isKidsMode: pacingMode === "kids", act: input.act },
  );

  // ── Character DNA Enhancement ──
  let finalPrompt = lightingDirective;
  const dnaFragments: string[] = [];
  if (input.characterDNAs && input.characterDNAs.length > 0) {
    finalPrompt = enhancePromptWithDNA(lightingDirective, input.characterDNAs);
    dnaFragments.push(...input.characterDNAs.map(d => d.characterId));
  }

  // Build character animation layers
  const characters: CharacterAnimation[] = input.characterIds.map((charId) => ({
    characterId: charId,
    animationUrl: input.videoClipUrl,
    durationSec: input.sceneDuration,
    cameraMotion: input.cameraInstructions,
    hasLipSync: charId === "narrator" && !!input.audioUrl,
  }));

  // Build background layers
  const backgrounds: BackgroundLayer[] = [];
  if (input.videoClipUrl) {
    backgrounds.push({
      type: "animated-video",
      url: input.videoClipUrl,
      durationSec: input.sceneDuration,
      depthFactor: 1.0,
    });
  } else if (input.imageUrl) {
    backgrounds.push({
      type: "static-image",
      url: input.imageUrl,
      durationSec: input.sceneDuration,
      depthFactor: 1.0,
    });
  } else {
    backgrounds.push({
      type: "gradient-fallback",
      url: null,
      durationSec: input.sceneDuration,
      depthFactor: 1.0,
    });
  }

  // Build audio layers
  const audioLayers: AudioLayer[] = [];

  // Narration
  if (input.audioUrl) {
    audioLayers.push({
      type: "narration",
      url: input.audioUrl,
      startSec: 0,
      durationSec: input.audioDurationSec,
      volume: 1.0,
      characterId: "narrator",
    });
  }

  // SFX as audio layers
  for (const sfx of input.sfxCues) {
    audioLayers.push({
      type: "sfx",
      url: null, // SFX are resolved by renderer from sfxId
      startSec: sfx.timestamp,
      durationSec: 1.0,
      volume: sfx.volume,
    });
  }

  // Lip sync — estimated from narration text
  const lipSyncLayers: LipSyncData[] = [];
  if (input.audioUrl && input.narrationText) {
    lipSyncLayers.push(
      estimatePhonemeTimings(
        "narrator",
        input.narrationText,
        input.audioDurationSec,
      ),
    );
  }

  return {
    sceneId: input.sceneId,
    sceneNumber: input.sceneNumber,
    act: input.act,
    durationSec: input.sceneDuration,
    characters,
    backgrounds,
    audioLayers,
    lipSyncLayers,
    sfxCues: input.sfxCues,
    duckingEnvelope: input.duckingEnvelope,
    cameraInstructions: input.cameraInstructions,
    transitionIn: input.transitionIn,
    transitionOut: input.transitionOut,
    emotion: input.emotion,
    enhancedPrompt: finalPrompt,
    lightingDirective,
    characterDNAFragments: dnaFragments,
    quality,
  };
}

/**
 * Compose a full episode of cartoon scenes.
 */
export function composeCartoonEpisode(
  scenes: CartoonSceneInput[],
  pacingMode: PacingMode = "kids",
): CartoonSceneManifest[] {
  return scenes.map((s) => composeCartoonScene(s, pacingMode));
}

/**
 * Get quality profile based on pacing mode.
 */
export function getQualityProfile(pacingMode: PacingMode): QualityProfile {
  if (pacingMode === "kids") return { ...QUALITY_PROFILES.kids };
  if (pacingMode === "action") return { ...QUALITY_PROFILES.cinematic };
  return { ...QUALITY_PROFILES.standard };
}

/**
 * Estimate phoneme timings from narration text + duration.
 * This is a lightweight client-side estimation — not real phoneme extraction.
 * Real phoneme extraction happens server-side via TTS provider metadata.
 */
function estimatePhonemeTimings(
  characterId: string,
  narrationText: string,
  durationSec: number,
): LipSyncData {
  const words = narrationText.split(/\s+/).filter(Boolean);
  if (words.length === 0 || durationSec <= 0) {
    return { characterId, phonemes: [], isEstimated: true };
  }

  const msPerWord = (durationSec * 1000) / words.length;
  const phonemes: LipSyncData["phonemes"] = [];
  let currentMs = 0;

  for (const word of words) {
    // Map word to approximate mouth shapes
    const shapes = wordToMouthShapes(word);
    const msPerShape = msPerWord / shapes.length;

    for (const shape of shapes) {
      phonemes.push({
        phoneme: shape.phoneme,
        startMs: Math.round(currentMs),
        endMs: Math.round(currentMs + msPerShape),
        mouthShape: shape.shape,
      });
      currentMs += msPerShape;
    }
  }

  return { characterId, phonemes, isEstimated: true };
}

/**
 * Map a word to approximate mouth shapes for lip sync.
 * Simplified — maps vowels/consonants to 6 basic mouth positions.
 */
function wordToMouthShapes(
  word: string,
): Array<{ phoneme: string; shape: string }> {
  const shapes: Array<{ phoneme: string; shape: string }> = [];
  const lower = word.toLowerCase().replace(/[^a-z]/g, "");

  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i];
    const shape = CHAR_TO_MOUTH[ch] || "closed";
    // Avoid duplicate consecutive shapes
    if (shapes.length === 0 || shapes[shapes.length - 1].shape !== shape) {
      shapes.push({ phoneme: ch, shape });
    }
  }

  if (shapes.length === 0) {
    shapes.push({ phoneme: "x", shape: "closed" });
  }

  return shapes;
}

/** Basic character-to-mouth-shape mapping */
const CHAR_TO_MOUTH: Record<string, string> = {
  a: "open-wide",
  e: "open-mid",
  i: "narrow",
  o: "round",
  u: "round",
  b: "closed",
  m: "closed",
  p: "closed",
  f: "teeth-lip",
  v: "teeth-lip",
  l: "tongue-up",
  t: "tongue-up",
  d: "tongue-up",
  n: "tongue-up",
  s: "narrow",
  z: "narrow",
  r: "open-mid",
  w: "round",
  y: "narrow",
  k: "open-mid",
  g: "open-mid",
  h: "open-wide",
  j: "narrow",
  c: "open-mid",
  q: "round",
  x: "narrow",
};
