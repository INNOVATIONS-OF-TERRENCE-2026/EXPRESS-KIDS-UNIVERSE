/**
 * episodeComposer.ts — Converts story data + scenes into a full Episode schema.
 *
 * Takes a story (from Supabase) and its scenes, then produces a complete
 * Episode object that can be fed into the media orchestrator pipeline.
 */

import type { Episode, Scene, Shot, Dialogue, EpisodeCharacter } from "@/lib/studio/episodeSchema";
import { TARGET_DURATION_SEC } from "@/lib/studio/episodeSchema";

interface StoryInput {
  id: string;
  title: string;
  story_text: string;
  theme: string;
  child_name: string;
  reading_level: string;
}

interface SceneInput {
  id: string;
  caption: string;
  scene_number: number;
  image_url: string | null;
}

/**
 * Compose an Episode from raw story and scene data.
 *
 * Heuristics:
 *  - Each scene gets a proportional time budget
 *  - Each scene produces 1-3 shots
 *  - Dialogue is generated from the scene caption
 *  - Characters are inferred from the story's child name
 */
export function composeEpisode(
  story: StoryInput,
  scenes: SceneInput[],
  targetDuration: number = TARGET_DURATION_SEC,
): Episode {
  const sceneCount = scenes.length || 1;
  const sceneDuration = targetDuration / sceneCount;

  // Build characters
  const characters: EpisodeCharacter[] = [
    {
      id: "narrator",
      name: "Narrator",
      role: "supporting",
      description: "The story narrator",
    },
    {
      id: "protagonist",
      name: story.child_name,
      role: "protagonist",
      description: `The hero of the story: ${story.child_name}`,
    },
  ];

  // Build scenes
  let elapsedSec = 0;
  const episodeScenes: Scene[] = scenes.map((sceneInput, idx) => {
    const startSec = elapsedSec;

    // Each scene gets 1-2 shots
    const shots: Shot[] = [
      {
        id: `shot_${sceneInput.id}_1`,
        description: sceneInput.caption,
        characterIds: ["narrator", "protagonist"],
        camera: {
          type: "static",
          easing: "easeInOut",
          durationSec: sceneDuration * 0.4,
        },
        dialogue: [
          {
            id: `dlg_${sceneInput.id}_1`,
            characterId: "narrator",
            text: sceneInput.caption,
            emotion: "neutral",
            timing: { startSec: 0, durationSec: sceneDuration * 0.35 },
          },
        ],
        backgroundRef: sceneInput.image_url || undefined,
        timing: { startSec: 0, durationSec: sceneDuration * 0.5 },
      },
      {
        id: `shot_${sceneInput.id}_2`,
        description: `${story.child_name} reacts`,
        characterIds: ["protagonist"],
        camera: {
          type: "zoom",
          easing: "easeOut",
          durationSec: sceneDuration * 0.3,
          from: { x: 0.5, y: 0.5, z: 1 },
          to: { x: 0.5, y: 0.4, z: 1.2 },
        },
        dialogue: [],
        timing: { startSec: sceneDuration * 0.5, durationSec: sceneDuration * 0.5 },
      },
    ];

    elapsedSec += sceneDuration;

    const scene: Scene = {
      id: sceneInput.id,
      number: idx + 1,
      summary: sceneInput.caption,
      setting: `${story.theme} world`,
      characterIds: ["narrator", "protagonist"],
      goal: "Advance the story",
      shots,
      mood: inferMood(story.theme, idx, sceneCount),
      timing: { startSec, durationSec: sceneDuration },
    };
    return scene;
  });

  const episode: Episode = {
    id: `ep_${story.id}`,
    title: story.title,
    synopsis: `An animated episode of "${story.title}" starring ${story.child_name}.`,
    targetDurationSec: targetDuration,
    actualDurationSec: elapsedSec,
    childProfileId: story.child_name,
    characters,
    scenes: episodeScenes,
    theme: story.theme,
    createdAt: Date.now(),
    schemaVersion: 1,
  };

  return episode;
}

/** Infer scene mood from theme and position */
function inferMood(
  theme: string,
  idx: number,
  total: number,
): Scene["mood"] {
  // Climax near 70-80% of story
  const position = idx / Math.max(total - 1, 1);
  if (position > 0.9) return "triumphant";
  if (position > 0.65) return "tense";
  if (position < 0.15) return "adventurous";

  const themeMap: Record<string, Scene["mood"]> = {
    "Space Quest": "adventurous",
    "Magic Forest": "magical",
    "Ocean Voyage": "calm",
    "Super Builders": "playful",
    "Dino Discovery": "adventurous",
  };
  return themeMap[theme] || "playful";
}
