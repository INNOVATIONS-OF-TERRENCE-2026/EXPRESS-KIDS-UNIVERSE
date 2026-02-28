/**
 * episodeSchema.ts — Data model for 15-minute animated episodes
 *
 * JSON-serializable schema covering the full episode structure:
 *   Episode → Scene[] → Shot[] → Dialogue[]
 *
 * The scene duration budgeting targets 15 minutes (900 seconds) total,
 * split across 10–18 scenes depending on pacing.
 */

/** Timing metadata for any timed element */
export interface Timing {
  /** Start time in seconds from episode beginning */
  startSec: number;
  /** Duration in seconds */
  durationSec: number;
}

/** Camera / virtual camera instructions for a shot */
export interface CameraMove {
  type: "static" | "pan" | "zoom" | "dolly" | "shake" | "tilt";
  from?: { x: number; y: number; z: number };
  to?: { x: number; y: number; z: number };
  easing: "linear" | "easeIn" | "easeOut" | "easeInOut";
  durationSec: number;
}

/** A single line of dialogue or narration */
export interface Dialogue {
  id: string;
  /** Character ID, or "narrator" for narration */
  characterId: string;
  /** The spoken text */
  text: string;
  /** Emotion tag for voice / animation */
  emotion: "neutral" | "happy" | "sad" | "excited" | "scared" | "angry" | "curious" | "surprised";
  /** Timing within the parent shot */
  timing: Timing;
}

/** A single shot within a scene (typically 3–15 seconds) */
export interface Shot {
  id: string;
  /** Brief description for rendering guidance */
  description: string;
  /** Characters on screen */
  characterIds: string[];
  /** Camera instructions */
  camera: CameraMove;
  /** Dialogue lines in this shot */
  dialogue: Dialogue[];
  /** Background asset reference */
  backgroundRef?: string;
  /** Parallax layer refs for depth */
  parallaxLayers?: string[];
  /** Animation cue identifiers */
  animationCues?: string[];
  /** Timing within the parent scene */
  timing: Timing;
}

/** A scene within the episode (typically 30–90 seconds) */
export interface Scene {
  id: string;
  /** Scene number (1-indexed) */
  number: number;
  /** Summary of what happens */
  summary: string;
  /** Setting / environment description */
  setting: string;
  /** Character IDs present in this scene */
  characterIds: string[];
  /** Narrative goal */
  goal: string;
  /** Conflict or challenge in this scene */
  conflict?: string;
  /** Resolution or outcome */
  resolution?: string;
  /** Shots composing this scene */
  shots: Shot[];
  /** Mood tag for ambient audio / color grading */
  mood: "adventurous" | "calm" | "tense" | "magical" | "playful" | "emotional" | "triumphant";
  /** Music track reference */
  musicRef?: string;
  /** Timing within the episode */
  timing: Timing;
}

/** Character definition within an episode */
export interface EpisodeCharacter {
  id: string;
  name: string;
  role: "protagonist" | "sidekick" | "antagonist" | "mentor" | "supporting";
  /** Voice profile ID for TTS */
  voiceProfileId?: string;
  /** Visual asset reference */
  spriteRef?: string;
  /** Brief description for rendering */
  description: string;
}

/** The top-level episode container */
export interface Episode {
  id: string;
  /** Episode title */
  title: string;
  /** Brief synopsis */
  synopsis: string;
  /** Target duration in seconds (default: 900 for 15 minutes) */
  targetDurationSec: number;
  /** Computed actual duration */
  actualDurationSec: number;
  /** Child profile ID this episode was created for */
  childProfileId: string;
  /** Characters in this episode */
  characters: EpisodeCharacter[];
  /** Ordered list of scenes */
  scenes: Scene[];
  /** Theme tag */
  theme: string;
  /** Creation timestamp */
  createdAt: number;
  /** Episode format version for future migration */
  schemaVersion: 1;
}

/** Minimum scene count for a 15-minute episode */
export const MIN_SCENES = 10;
/** Maximum scene count for a 15-minute episode */
export const MAX_SCENES = 18;
/** Default target duration */
export const TARGET_DURATION_SEC = 900;
