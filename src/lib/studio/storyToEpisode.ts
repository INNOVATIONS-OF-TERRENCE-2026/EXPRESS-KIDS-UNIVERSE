/**
 * storyToEpisode.ts — Converts story output into a structured Episode
 *
 * Takes the existing StoryResult from the story generation pipeline and
 * transforms it into a full Episode schema suitable for 15-minute episodes.
 *
 * Chunking logic:
 *   - Splits story text into 10–18 scenes by paragraph/beat
 *   - Budgets time proportionally across scenes
 *   - Generates placeholder shots and dialogue
 */

import type { StoryResult, ChildProfile } from "@/lib/jobStore";
import type {
  Episode,
  Scene,
  Shot,
  Dialogue,
  EpisodeCharacter,
  Timing,
  CameraMove,
} from "./episodeSchema";
import { MIN_SCENES, MAX_SCENES, TARGET_DURATION_SEC } from "./episodeSchema";

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Split story text into paragraph beats */
function splitIntoBeats(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Create a default camera move */
function defaultCamera(duration: number): CameraMove {
  return {
    type: "static",
    easing: "easeInOut",
    durationSec: duration,
  };
}

/** Create timing for sequential elements */
function sequentialTiming(startSec: number, durationSec: number): Timing {
  return { startSec, durationSec };
}

/** Build characters from profile */
function buildCharacters(profile: ChildProfile): EpisodeCharacter[] {
  const chars: EpisodeCharacter[] = [
    {
      id: "protagonist",
      name: profile.childName,
      role: "protagonist",
      description: `${profile.childName} — the hero of this adventure`,
    },
    {
      id: "narrator",
      name: "Narrator",
      role: "supporting",
      description: "The story narrator",
    },
  ];

  profile.familyFriends.forEach((ff, i) => {
    chars.push({
      id: `friend_${i}`,
      name: ff.name,
      role: "sidekick",
      description: `${ff.name} — ${ff.role}`,
    });
  });

  return chars;
}

/** Convert a story beat into a Scene */
function beatToScene(
  beat: string,
  index: number,
  total: number,
  budget: number,
  characters: EpisodeCharacter[],
  childName: string,
): Scene {
  const duration = budget;
  const shotDuration = duration / 2;

  const narrationDialogue: Dialogue = {
    id: generateId("dlg"),
    characterId: "narrator",
    text: beat,
    emotion: "neutral",
    timing: sequentialTiming(0, shotDuration * 0.8),
  };

  const charDialogue: Dialogue = {
    id: generateId("dlg"),
    characterId: "protagonist",
    text: index === 0 ? `I'm ready for this adventure!` : `This is incredible!`,
    emotion: index === 0 ? "excited" : "happy",
    timing: sequentialTiming(shotDuration, shotDuration * 0.6),
  };

  const shot1: Shot = {
    id: generateId("shot"),
    description: `Scene ${index + 1} — establishing`,
    characterIds: characters.map((c) => c.id),
    camera: defaultCamera(shotDuration),
    dialogue: [narrationDialogue],
    timing: sequentialTiming(0, shotDuration),
  };

  const shot2: Shot = {
    id: generateId("shot"),
    description: `Scene ${index + 1} — reaction`,
    characterIds: ["protagonist"],
    camera: { type: "zoom", easing: "easeInOut", durationSec: shotDuration },
    dialogue: [charDialogue],
    timing: sequentialTiming(shotDuration, shotDuration),
  };

  // Determine mood based on position in story
  const moods: Scene["mood"][] = [
    "adventurous", "magical", "playful", "adventurous",
    "tense", "magical", "playful", "emotional",
    "triumphant", "calm",
  ];

  return {
    id: generateId("scene"),
    number: index + 1,
    summary: beat.slice(0, 120),
    setting: `Scene ${index + 1} environment`,
    characterIds: characters.map((c) => c.id),
    goal: index === 0 ? "Introduce the adventure" : index === total - 1 ? "Resolve and conclude" : "Advance the story",
    conflict: index > 1 && index < total - 1 ? "Challenge encountered" : undefined,
    resolution: index === total - 1 ? `${childName} returns home with wisdom` : undefined,
    shots: [shot1, shot2],
    mood: moods[index % moods.length],
    timing: sequentialTiming(0, duration), // will be recomputed in assembly
  };
}

/**
 * Convert a StoryResult + ChildProfile into a full Episode schema.
 */
export function storyToEpisode(
  story: StoryResult,
  profile: ChildProfile,
  targetDuration: number = TARGET_DURATION_SEC,
): Episode {
  const beats = splitIntoBeats(story.storyText);

  // Clamp scene count to MIN_SCENES–MAX_SCENES
  // If fewer beats than MIN_SCENES, duplicate/expand; if more than MAX_SCENES, merge
  let sceneBudgets: string[] = [...beats];

  while (sceneBudgets.length < MIN_SCENES) {
    // Expand by splitting the longest beat
    const longestIdx = sceneBudgets.reduce(
      (maxI, b, i, arr) => (b.length > arr[maxI].length ? i : maxI),
      0,
    );
    const longest = sceneBudgets[longestIdx];
    const mid = Math.floor(longest.length / 2);
    const splitPoint = longest.indexOf(" ", mid);
    if (splitPoint > 0) {
      sceneBudgets.splice(longestIdx, 1, longest.slice(0, splitPoint), longest.slice(splitPoint + 1));
    } else {
      sceneBudgets.push(longest); // duplicate if can't split
    }
  }

  while (sceneBudgets.length > MAX_SCENES) {
    // Merge the two shortest adjacent beats
    let minSum = Infinity;
    let mergeIdx = 0;
    for (let i = 0; i < sceneBudgets.length - 1; i++) {
      const sum = sceneBudgets[i].length + sceneBudgets[i + 1].length;
      if (sum < minSum) {
        minSum = sum;
        mergeIdx = i;
      }
    }
    sceneBudgets.splice(mergeIdx, 2, sceneBudgets[mergeIdx] + " " + sceneBudgets[mergeIdx + 1]);
  }

  const sceneCount = sceneBudgets.length;
  const perScene = targetDuration / sceneCount;
  const characters = buildCharacters(profile);

  // Build scenes
  let runningTime = 0;
  const scenes: Scene[] = sceneBudgets.map((beat, i) => {
    const scene = beatToScene(beat, i, sceneCount, perScene, characters, profile.childName);
    scene.timing = sequentialTiming(runningTime, perScene);
    // Fix shot absolute timing
    scene.shots.forEach((shot, si) => {
      shot.timing.startSec = runningTime + si * (perScene / scene.shots.length);
    });
    runningTime += perScene;
    return scene;
  });

  return {
    id: generateId("ep"),
    title: story.storyTitle,
    synopsis: story.storyText.slice(0, 200),
    targetDurationSec: targetDuration,
    actualDurationSec: runningTime,
    childProfileId: profile.childName, // profile.id if using CharacterProfile
    characters,
    scenes,
    theme: story.meta.theme,
    createdAt: Date.now(),
    schemaVersion: 1,
  };
}
