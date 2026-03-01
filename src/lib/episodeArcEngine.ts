/**
 * episodeArcEngine.ts — Auto Episode Arc Builder (3-Act Structure Engine)
 *
 * Automatically structures any user story into a Hollywood 3-act format:
 *   ACT I   — Setup (25%)
 *   ACT II  — Conflict / Rising Action (50%)
 *   ACT III — Resolution (25%)
 *
 * Calculates optimal scene count, distributes time proportionally,
 * generates a structured scene map with emotional escalation,
 * midpoint twist, climactic beat, and moral/lesson for kids mode.
 *
 * Zero AI calls — purely algorithmic narrative intelligence.
 */

import type { AgeRange } from "@/types/characterProfile";
import type { VideoDuration, PacingMode } from "@/lib/studio/video/videoJobTypes";
import { DURATION_SEC } from "@/lib/studio/video/videoJobTypes";

/* ── Types ── */

export type ActNumber = 1 | 2 | 3;

export type EmotionalTone =
  | "wonder"
  | "curiosity"
  | "excitement"
  | "tension"
  | "fear"
  | "hope"
  | "triumph"
  | "joy"
  | "warmth"
  | "calm"
  | "playful";

export interface ArcScene {
  sceneId: string;
  act: ActNumber;
  sceneIndex: number;
  summary: string;
  emotionalTone: EmotionalTone;
  tensionLevel: number; // 0–1
  estimatedDuration: number; // seconds
  narrativeRole: NarrativeRole;
  isMidpointTwist: boolean;
  isClimax: boolean;
  hasMoral: boolean;
  moralLesson?: string;
}

export type NarrativeRole =
  | "introduction"
  | "world-building"
  | "inciting-incident"
  | "rising-action"
  | "midpoint-twist"
  | "complication"
  | "climax"
  | "falling-action"
  | "resolution"
  | "epilogue";

export interface EpisodeArc {
  episodeId: string;
  title: string;
  ageGroup: AgeRange;
  targetDuration: number; // seconds
  totalScenes: number;
  acts: {
    act1: { sceneCount: number; duration: number };
    act2: { sceneCount: number; duration: number };
    act3: { sceneCount: number; duration: number };
  };
  scenes: ArcScene[];
  emotionalCurve: number[]; // tension 0–1 per scene
  pacingMode: PacingMode;
}

export interface ArcBuilderInput {
  storyPrompt: string;
  title: string;
  targetDuration: VideoDuration;
  ageGroup: AgeRange;
  tone?: string;
  pacingMode?: PacingMode;
}

/* ── Constants ── */

/** Optimal scene counts by target duration in seconds */
const SCENE_COUNT_RANGES: Array<{ maxSec: number; min: number; max: number }> = [
  { maxSec: 30,  min: 2,  max: 3 },
  { maxSec: 120, min: 4,  max: 6 },
  { maxSec: 180, min: 6,  max: 8 },
  { maxSec: 300, min: 8,  max: 12 },
  { maxSec: 600, min: 12, max: 18 },
  { maxSec: 900, min: 14, max: 20 },
];

/** Act proportions — Hollywood standard */
const ACT_PROPORTIONS = { act1: 0.25, act2: 0.50, act3: 0.25 } as const;

/** Tension curve templates by pacing mode */
const TENSION_CURVES: Record<PacingMode, (pos: number) => number> = {
  story: (pos) => {
    // Classic story arc — gentle rise, peak at 75%, gentle descent
    if (pos < 0.25) return 0.15 + pos * 1.0;
    if (pos < 0.5) return 0.40 + (pos - 0.25) * 1.4;
    if (pos < 0.75) return 0.75 + (pos - 0.5) * 1.0;
    return 1.0 - (pos - 0.75) * 3.0;
  },
  action: (pos) => {
    // Action — starts high, peaks early, stays elevated
    if (pos < 0.15) return 0.4 + pos * 2.0;
    if (pos < 0.5) return 0.7 + (pos - 0.15) * 0.6;
    if (pos < 0.8) return 0.9 + (pos - 0.5) * 0.33;
    return 1.0 - (pos - 0.8) * 4.0;
  },
  documentary: (pos) => {
    // Documentary — slow build, moderate peak, long resolution
    if (pos < 0.4) return 0.1 + pos * 0.75;
    if (pos < 0.7) return 0.4 + (pos - 0.4) * 1.33;
    return 0.8 - (pos - 0.7) * 2.0;
  },
  kids: (pos) => {
    // Kids — bouncy, peaks at ~65%, clear happy ending
    if (pos < 0.2) return 0.3 + pos * 1.0;
    if (pos < 0.45) return 0.5 + (pos - 0.2) * 0.8;
    if (pos < 0.65) return 0.7 + (pos - 0.45) * 1.5;
    if (pos < 0.85) return 1.0 - (pos - 0.65) * 2.5;
    return 0.5 - (pos - 0.85) * 2.0;
  },
};

/** Emotional tone mapping by tension level and act */
const TONE_BY_ACT_AND_TENSION: Record<ActNumber, (tension: number, ageGroup: AgeRange) => EmotionalTone> = {
  1: (t, age) => {
    if (t < 0.3) return age === "3-5" ? "warmth" : "wonder";
    if (t < 0.6) return "curiosity";
    return "excitement";
  },
  2: (t, age) => {
    if (t < 0.4) return "excitement";
    if (t < 0.7) return age === "3-5" ? "excitement" : "tension";
    if (t < 0.9) return age === "3-5" ? "hope" : "fear";
    return "hope";
  },
  3: (t, _age) => {
    if (t > 0.6) return "triumph";
    if (t > 0.3) return "joy";
    return "warmth";
  },
};

/** Narrative roles distributed across scenes */
const ACT_ROLES: Record<ActNumber, NarrativeRole[]> = {
  1: ["introduction", "world-building", "inciting-incident"],
  2: ["rising-action", "midpoint-twist", "complication", "climax"],
  3: ["falling-action", "resolution", "epilogue"],
};

/** Story-parsing keywords for sentence splitting */
const SENTENCE_SPLIT = /(?<=[.!?])\s+(?=[A-Z])/;

/** Moral lesson templates for kids mode */
const MORAL_TEMPLATES: string[] = [
  "True friends always help each other.",
  "Being brave means doing what's right, even when it's scary.",
  "Everyone is special in their own way.",
  "Kindness makes the world brighter.",
  "Working together makes impossible things possible.",
  "It's okay to make mistakes — that's how we learn.",
  "Believing in yourself is the first step to adventure.",
  "Sharing makes everything more fun.",
  "The best treasure is the friends we make along the way.",
  "Being different is what makes you amazing.",
];

/* ── Core Builder ── */

/**
 * Build a complete 3-act episode arc from a story prompt.
 */
export function buildEpisodeArc(input: ArcBuilderInput): EpisodeArc {
  const {
    storyPrompt,
    title,
    targetDuration,
    ageGroup,
    tone,
    pacingMode = "kids",
  } = input;

  const durationSec = DURATION_SEC[targetDuration] ?? 120;
  const totalScenes = calculateSceneCount(durationSec, pacingMode);

  // Distribute scenes across acts
  const act1Scenes = Math.max(1, Math.round(totalScenes * ACT_PROPORTIONS.act1));
  const act3Scenes = Math.max(1, Math.round(totalScenes * ACT_PROPORTIONS.act3));
  const act2Scenes = Math.max(2, totalScenes - act1Scenes - act3Scenes);

  // Distribute time
  const act1Duration = Math.round(durationSec * ACT_PROPORTIONS.act1 * 100) / 100;
  const act2Duration = Math.round(durationSec * ACT_PROPORTIONS.act2 * 100) / 100;
  const act3Duration = Math.round(durationSec - act1Duration - act2Duration * 100) / 100 > 0
    ? Math.round((durationSec - act1Duration - act2Duration) * 100) / 100
    : Math.round(durationSec * ACT_PROPORTIONS.act3 * 100) / 100;

  // Generate tension curve
  const tensionFn = TENSION_CURVES[pacingMode];
  const emotionalCurve: number[] = [];
  for (let i = 0; i < totalScenes; i++) {
    const pos = totalScenes > 1 ? i / (totalScenes - 1) : 0.5;
    emotionalCurve.push(clamp(tensionFn(pos), 0, 1));
  }

  // Parse story into sentences for scene summaries
  const sentences = parseStoryIntoSegments(storyPrompt, totalScenes);

  // Build scene map
  const scenes: ArcScene[] = [];
  const midpointIdx = act1Scenes + Math.floor(act2Scenes / 2);
  const climaxIdx = act1Scenes + act2Scenes - 1;
  const lastIdx = totalScenes - 1;

  let sceneOffset = 0;
  const buildActScenes = (act: ActNumber, count: number, actDuration: number) => {
    const perSceneDuration = actDuration / count;
    const roles = ACT_ROLES[act];

    for (let j = 0; j < count; j++) {
      const globalIdx = sceneOffset + j;
      const tension = emotionalCurve[globalIdx] ?? 0.5;
      const roleIdx = Math.min(j, roles.length - 1);
      let role = roles[roleIdx];
      const isMidpoint = globalIdx === midpointIdx;
      const isClimax = globalIdx === climaxIdx;

      if (isMidpoint) role = "midpoint-twist";
      if (isClimax) role = "climax";

      const emotionalTone = TONE_BY_ACT_AND_TENSION[act](tension, ageGroup);
      const isLastScene = globalIdx === lastIdx;
      const hasMoral = isLastScene && (ageGroup === "3-5" || ageGroup === "6-8");

      scenes.push({
        sceneId: `arc_s${globalIdx + 1}`,
        act,
        sceneIndex: globalIdx,
        summary: sentences[globalIdx] || generateFallbackSummary(role, act, tension),
        emotionalTone,
        tensionLevel: Math.round(tension * 100) / 100,
        estimatedDuration: Math.round(perSceneDuration * 100) / 100,
        narrativeRole: role,
        isMidpointTwist: isMidpoint,
        isClimax,
        hasMoral,
        moralLesson: hasMoral
          ? MORAL_TEMPLATES[globalIdx % MORAL_TEMPLATES.length]
          : undefined,
      });
    }
    sceneOffset += count;
  };

  buildActScenes(1, act1Scenes, act1Duration);
  buildActScenes(2, act2Scenes, act2Duration);
  buildActScenes(3, act3Scenes, act3Duration);

  return {
    episodeId: `arc_${Date.now()}`,
    title,
    ageGroup,
    targetDuration: durationSec,
    totalScenes,
    acts: {
      act1: { sceneCount: act1Scenes, duration: act1Duration },
      act2: { sceneCount: act2Scenes, duration: act2Duration },
      act3: { sceneCount: act3Scenes, duration: act3Duration },
    },
    scenes,
    emotionalCurve,
    pacingMode,
  };
}

/**
 * Validate that an arc's scenes sum to the target duration.
 */
export function validateArcDuration(arc: EpisodeArc): {
  valid: boolean;
  totalSceneDuration: number;
  drift: number;
} {
  const totalSceneDuration = arc.scenes.reduce((s, sc) => s + sc.estimatedDuration, 0);
  const drift = Math.abs(totalSceneDuration - arc.targetDuration);
  return {
    valid: drift <= 0.5, // ±0.5s tolerance
    totalSceneDuration: Math.round(totalSceneDuration * 100) / 100,
    drift: Math.round(drift * 100) / 100,
  };
}

/**
 * Get the emotional escalation quality score (0–1).
 * Checks that tension generally rises through Act 2 and falls in Act 3.
 */
export function getEscalationScore(arc: EpisodeArc): number {
  const act2Scenes = arc.scenes.filter((s) => s.act === 2);
  if (act2Scenes.length < 2) return 1;

  let escalations = 0;
  for (let i = 1; i < act2Scenes.length; i++) {
    if (act2Scenes[i].tensionLevel >= act2Scenes[i - 1].tensionLevel - 0.05) {
      escalations++;
    }
  }
  return escalations / (act2Scenes.length - 1);
}

/* ── Helpers ── */

function calculateSceneCount(durationSec: number, pacingMode: PacingMode): number {
  let min = 2, max = 3;
  for (const range of SCENE_COUNT_RANGES) {
    if (durationSec <= range.maxSec) {
      min = range.min;
      max = range.max;
      break;
    }
    min = range.min;
    max = range.max;
  }

  // Pacing adjustment: action = more scenes (tighter cuts), documentary = fewer
  const pacingAdj: Record<PacingMode, number> = {
    story: 0,
    action: 2,
    documentary: -1,
    kids: 1,
  };
  const adj = pacingAdj[pacingMode] ?? 0;
  return clamp(Math.round((min + max) / 2) + adj, min, max);
}

function parseStoryIntoSegments(storyText: string, targetCount: number): string[] {
  if (!storyText || storyText.trim().length === 0) return [];

  const sentences = storyText
    .split(SENTENCE_SPLIT)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  if (sentences.length === 0) return [];
  if (sentences.length <= targetCount) {
    // Pad with empty strings — caller uses fallback summary
    return [
      ...sentences,
      ...Array(targetCount - sentences.length).fill(""),
    ];
  }

  // Distribute evenly
  const perScene = sentences.length / targetCount;
  const segments: string[] = [];
  for (let i = 0; i < targetCount; i++) {
    const start = Math.floor(i * perScene);
    const end = Math.floor((i + 1) * perScene);
    segments.push(
      sentences.slice(start, Math.max(end, start + 1)).join(" "),
    );
  }
  return segments;
}

function generateFallbackSummary(
  role: NarrativeRole,
  _act: ActNumber,
  tension: number,
): string {
  const summaries: Record<NarrativeRole, string> = {
    introduction: "Our story begins as the main character discovers something unusual.",
    "world-building": "We explore the magical world our hero calls home.",
    "inciting-incident": "An unexpected event sets the adventure in motion.",
    "rising-action": "The challenges grow as our hero pushes forward.",
    "midpoint-twist": "Everything changes with a surprising twist!",
    complication: "A new obstacle threatens to stop our hero.",
    climax: "The biggest challenge yet — the moment of truth!",
    "falling-action": "After the excitement, things begin to settle.",
    resolution: "Our hero finds the answer and saves the day!",
    epilogue: "And so the adventure ends, but the memories remain forever.",
  };
  return summaries[role] || `Scene progresses with tension level ${Math.round(tension * 100)}%.`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
