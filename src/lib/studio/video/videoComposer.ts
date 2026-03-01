/**
 * videoComposer.ts — Video composition intelligence layer.
 *
 * Feature Set 6: Provides scene-to-video composition logic:
 *  - Scene ordering and transition planning
 *  - Duration budgeting per scene
 *  - Transition type selection (fade, cut, dissolve, wipe)
 *  - Ken Burns effect parameters for still images
 *  - Title card and credit sequence generation
 */

import type { Scene, Episode } from "@/lib/studio/episodeSchema";

export type TransitionType = "cut" | "fade" | "dissolve" | "wipe-left" | "wipe-right" | "zoom" | "iris";

export interface VideoTransition {
  type: TransitionType;
  durationSec: number;
}

/** Ken Burns motion applied to a still image */
export interface KenBurnsEffect {
  /** Start crop position (normalized 0-1) */
  startCrop: { x: number; y: number; zoom: number };
  /** End crop position */
  endCrop: { x: number; y: number; zoom: number };
  /** Easing function */
  easing: "linear" | "easeIn" | "easeOut" | "easeInOut";
}

/** A composed video segment */
export interface VideoSegment {
  sceneId: string;
  sceneNumber: number;
  /** Duration of scene content in seconds */
  contentDurationSec: number;
  /** Transition into this segment */
  transitionIn: VideoTransition;
  /** Ken Burns effect for the scene image */
  kenBurns: KenBurnsEffect;
  /** Whether this segment has generated narration audio */
  hasVoice: boolean;
  /** Whether this segment has a background music track */
  hasMusic: boolean;
}

/** Title card segment */
export interface TitleCard {
  type: "title" | "credits";
  text: string;
  subText?: string;
  durationSec: number;
}

/** The full video composition plan */
export interface VideoComposition {
  episodeId: string;
  title: string;
  /** Opening title card */
  titleCard: TitleCard;
  /** Scene segments in order */
  segments: VideoSegment[];
  /** Closing credits */
  credits: TitleCard;
  /** Total computed duration */
  totalDurationSec: number;
  /** Target resolution */
  resolution: { width: number; height: number };
  /** Frames per second */
  fps: number;
}

/** Transition preferences by scene mood */
const MOOD_TRANSITIONS: Record<string, TransitionType[]> = {
  adventurous: ["wipe-left", "cut", "zoom"],
  calm: ["fade", "dissolve"],
  tense: ["cut", "zoom", "iris"],
  magical: ["dissolve", "iris", "fade"],
  playful: ["wipe-right", "wipe-left", "cut"],
  emotional: ["fade", "dissolve"],
  triumphant: ["zoom", "iris", "wipe-left"],
};

/**
 * Compose a video plan from an episode.
 *
 * Allocates time budgets, selects transitions based on scene mood,
 * and generates Ken Burns parameters for still images.
 */
export function composeVideo(episode: Episode): VideoComposition {
  const sceneCount = episode.scenes.length || 1;
  const titleDuration = 4;
  const creditsDuration = 6;
  const availableDuration = episode.targetDurationSec - titleDuration - creditsDuration;
  const perScene = availableDuration / sceneCount;

  const segments: VideoSegment[] = episode.scenes.map((scene, idx) => {
    const transitions = MOOD_TRANSITIONS[scene.mood] || ["fade", "cut"];
    const transitionType = transitions[idx % transitions.length];

    return {
      sceneId: scene.id,
      sceneNumber: scene.number,
      contentDurationSec: perScene,
      transitionIn: {
        type: idx === 0 ? "fade" : transitionType,
        durationSec: idx === 0 ? 1.5 : 0.8,
      },
      kenBurns: generateKenBurns(idx, sceneCount),
      hasVoice: scene.shots.some((s) => s.dialogue.length > 0),
      hasMusic: !!scene.musicRef,
    };
  });

  return {
    episodeId: episode.id,
    title: episode.title,
    titleCard: {
      type: "title",
      text: episode.title,
      subText: `Starring ${episode.characters.find((c) => c.role === "protagonist")?.name || "our hero"}`,
      durationSec: titleDuration,
    },
    segments,
    credits: {
      type: "credits",
      text: "Created with Express Kids Universe",
      subText: `An adventure for ${episode.childProfileId}`,
      durationSec: creditsDuration,
    },
    totalDurationSec: titleDuration + segments.reduce((s, seg) => s + seg.contentDurationSec, 0) + creditsDuration,
    resolution: { width: 1920, height: 1080 },
    fps: 30,
  };
}

/** Generate Ken Burns effect parameters for visual variety */
function generateKenBurns(sceneIndex: number, total: number): KenBurnsEffect {
  const patterns: KenBurnsEffect[] = [
    { startCrop: { x: 0.4, y: 0.4, zoom: 1.0 }, endCrop: { x: 0.5, y: 0.5, zoom: 1.15 }, easing: "easeInOut" },
    { startCrop: { x: 0.6, y: 0.5, zoom: 1.1 }, endCrop: { x: 0.4, y: 0.5, zoom: 1.0 }, easing: "easeOut" },
    { startCrop: { x: 0.5, y: 0.3, zoom: 1.2 }, endCrop: { x: 0.5, y: 0.6, zoom: 1.0 }, easing: "easeIn" },
    { startCrop: { x: 0.3, y: 0.5, zoom: 1.0 }, endCrop: { x: 0.7, y: 0.5, zoom: 1.1 }, easing: "linear" },
  ];
  return patterns[sceneIndex % patterns.length];
}
