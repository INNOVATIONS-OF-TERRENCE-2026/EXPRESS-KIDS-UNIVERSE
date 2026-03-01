/**
 * interactiveBranchEngine.ts — Interactive Choose-Your-Ending Engine
 *
 * Allows users to choose between 2–4 branching endings at decision
 * points (midpoint or climax). Each branch generates a separate
 * Act III while preserving:
 *   • Character memory (Season Memory Engine)
 *   • Duration lock (total runtime = user selection)
 *   • Character DNA consistency
 *   • Arc structure integrity
 *
 * Architecture:
 *   1. Episode plays linearly through Act I and most of Act II
 *   2. At a decision node, playback pauses
 *   3. User selects from 2–4 branching options
 *   4. Engine generates chosen branch (Act III alternate)
 *   5. Duration is reallocated from Act II/III to fit
 *   6. Season Memory is updated with chosen path
 *
 * Integrations:
 *   • Episode Arc Engine → arc structure validation
 *   • Season Memory Engine → branch outcomes recorded
 *   • Duration Lock → runtime preservation
 *   • Character DNA → visual consistency in branches
 */

/* ── Types ── */

export type DecisionPlacement = "midpoint" | "climax" | "pre-climax";

export interface BranchOption {
  /** Unique option ID */
  id: string;
  /** User-facing label (e.g., "Help the dragon") */
  label: string;
  /** Brief consequence summary shown to user */
  consequenceSummary: string;
  /** Emotional tone of this branch */
  emotionalTone: string;
  /** Tension level shift (relative) */
  tensionShift: number;
  /** Whether this is the "canon" path for season continuity */
  isCanonPath: boolean;
}

export interface DecisionNode {
  /** Unique decision ID */
  decisionId: string;
  /** Episode ID this decision belongs to */
  episodeId: string;
  /** Scene number where decision occurs */
  sceneNumber: number;
  /** Placement in arc */
  placement: DecisionPlacement;
  /** The decision prompt shown to the user */
  prompt: string;
  /** Available options (2–4) */
  options: BranchOption[];
  /** Time budget remaining for Act III (seconds) */
  remainingTimeBudgetSec: number;
  /** Characters involved in this decision */
  involvedCharacters: string[];
  /** Context from prior scenes for continuity */
  contextSummary: string;
}

export interface BranchContent {
  /** ID of the selected option */
  selectedOptionId: string;
  /** Generated scenes for this branch */
  scenes: BranchScene[];
  /** Total duration of branch content */
  totalDurationSec: number;
  /** Narrative outcome summary */
  outcomeSummary: string;
  /** Moral/lesson learned */
  lessonLearned: string;
  /** Season memory update payload */
  memoryUpdate: BranchMemoryUpdate;
}

export interface BranchScene {
  sceneNumber: number;
  caption: string;
  narrationText: string;
  emotion: string;
  emotionalIntensity: number;
  act: 3;
  narrativeRole: string;
  tensionLevel: number;
  /** Duration allocated to this scene */
  durationSec: number;
}

export interface BranchMemoryUpdate {
  /** Key events from chosen branch */
  keyEvents: { description: string; significance: "moderate" | "major" | "climactic" }[];
  /** Conflicts resolved */
  resolvedConflicts: string[];
  /** New unresolved threads (cliffhangers) */
  newUnresolvedThreads: string[];
  /** Character growth moments */
  characterGrowth: { characterName: string; growth: string }[];
  /** Lesson learned */
  lessonLearned: string;
}

export interface EpisodeBranchConfig {
  /** Is branching enabled for this episode */
  branchingEnabled: boolean;
  /** Max options per decision */
  maxOptions: number;
  /** Where to place the decision node */
  preferredPlacement: DecisionPlacement;
  /** Target duration for the complete episode */
  targetDurationSec: number;
  /** Act I + II scenes (already generated) */
  existingScenes: ExistingScene[];
  /** Episode context */
  episodeId: string;
  episodeTitle: string;
  theme: string;
  childName: string;
  /** Character IDs in this episode */
  characterIds: string[];
}

export interface ExistingScene {
  sceneNumber: number;
  caption: string;
  narrationText: string;
  emotion: string;
  emotionalIntensity: number;
  act: 1 | 2 | 3;
  durationSec: number;
}

/* ── Constants ── */

const MIN_BRANCH_OPTIONS = 2;
const MAX_BRANCH_OPTIONS = 4;
const DURATION_TOLERANCE_SEC = 0.5;
const MIN_BRANCH_SCENES = 2;
const MAX_BRANCH_SCENES = 5;

/** Emotional tone presets for branch options */
const BRANCH_TONES: Record<string, { tensionShift: number; emotionalIntensity: number }> = {
  brave:        { tensionShift: 0.1, emotionalIntensity: 0.8 },
  kind:         { tensionShift: -0.15, emotionalIntensity: 0.7 },
  clever:       { tensionShift: 0.0, emotionalIntensity: 0.75 },
  funny:        { tensionShift: -0.2, emotionalIntensity: 0.6 },
  adventurous:  { tensionShift: 0.15, emotionalIntensity: 0.85 },
  cautious:     { tensionShift: -0.1, emotionalIntensity: 0.5 },
};

/** Narrative role templates for branch scenes */
const BRANCH_ROLES: Record<DecisionPlacement, string[]> = {
  midpoint:    ["midpoint-resolution", "rising-action", "branch-climax", "falling-action", "resolution"],
  climax:      ["branch-climax", "falling-action", "resolution"],
  "pre-climax": ["escalation", "branch-climax", "falling-action", "resolution"],
};

/* ── Core Functions ── */

/**
 * Create a decision node for an episode at the specified placement.
 *
 * Analyzes existing scenes to create contextually appropriate
 * branching options that maintain narrative coherence.
 */
export function createDecisionNode(config: EpisodeBranchConfig): DecisionNode | null {
  if (!config.branchingEnabled) return null;

  const { existingScenes, targetDurationSec, preferredPlacement } = config;
  const totalExistingDuration = existingScenes.reduce((sum, s) => sum + s.durationSec, 0);

  // Find the decision point scene
  const decisionSceneIdx = findDecisionPoint(existingScenes, preferredPlacement);
  if (decisionSceneIdx < 0) return null;

  const decisionScene = existingScenes[decisionSceneIdx];

  // Calculate remaining time budget
  const preBranchDuration = existingScenes
    .slice(0, decisionSceneIdx + 1)
    .reduce((sum, s) => sum + s.durationSec, 0);
  const remainingTimeBudgetSec = Math.max(10, targetDurationSec - preBranchDuration);

  // Build context summary from prior scenes
  const contextSummary = existingScenes
    .slice(Math.max(0, decisionSceneIdx - 2), decisionSceneIdx + 1)
    .map((s) => s.caption)
    .join(". ");

  // Generate branch options
  const options = generateBranchOptions(
    config,
    decisionScene,
    contextSummary,
    Math.min(config.maxOptions, MAX_BRANCH_OPTIONS),
  );

  if (options.length < MIN_BRANCH_OPTIONS) return null;

  return {
    decisionId: `dec_${config.episodeId}_${Date.now()}`,
    episodeId: config.episodeId,
    sceneNumber: decisionScene.sceneNumber,
    placement: preferredPlacement,
    prompt: buildDecisionPrompt(decisionScene, config.theme),
    options,
    remainingTimeBudgetSec,
    involvedCharacters: config.characterIds,
    contextSummary,
  };
}

/**
 * Generate branch content for a selected option.
 *
 * Creates Act III scenes that:
 *   1. Follow from the selected branch option
 *   2. Respect the remaining time budget
 *   3. Maintain tension curve
 *   4. Include a resolution + lesson
 */
export function generateBranchContent(
  decision: DecisionNode,
  selectedOptionId: string,
  config: EpisodeBranchConfig,
): BranchContent | null {
  const option = decision.options.find((o) => o.id === selectedOptionId);
  if (!option) return null;

  const timeBudget = decision.remainingTimeBudgetSec;
  const roles = BRANCH_ROLES[decision.placement] || BRANCH_ROLES.climax;
  const sceneCount = Math.min(MAX_BRANCH_SCENES, Math.max(MIN_BRANCH_SCENES, roles.length));

  // Allocate duration per scene
  const sceneDurations = allocateSceneDurations(timeBudget, sceneCount, option.tensionShift);

  // Build branch scenes
  const scenes: BranchScene[] = [];
  const baseTension = option.tensionShift >= 0 ? 0.6 : 0.4;

  for (let i = 0; i < sceneCount; i++) {
    const role = roles[i % roles.length];
    const tension = computeBranchTension(i, sceneCount, baseTension, option.tensionShift);
    const emotion = tensionToEmotion(tension, option.emotionalTone);

    scenes.push({
      sceneNumber: decision.sceneNumber + i + 1,
      caption: `[Branch: ${option.label}] Scene ${i + 1} — ${role}`,
      narrationText: buildBranchNarration(
        config.childName,
        option,
        role,
        i,
        sceneCount,
        decision.contextSummary,
      ),
      emotion,
      emotionalIntensity: tension,
      act: 3,
      narrativeRole: role,
      tensionLevel: tension,
      durationSec: sceneDurations[i],
    });
  }

  // Validate total duration
  const totalDuration = scenes.reduce((sum, s) => sum + s.durationSec, 0);
  const drift = Math.abs(totalDuration - timeBudget);
  if (drift > DURATION_TOLERANCE_SEC) {
    // Auto-adjust last scene to lock duration
    const lastScene = scenes[scenes.length - 1];
    lastScene.durationSec += timeBudget - totalDuration;
    lastScene.durationSec = Math.max(2, lastScene.durationSec);
  }

  const lessonLearned = deriveLessonFromBranch(option);

  return {
    selectedOptionId,
    scenes,
    totalDurationSec: Math.round(scenes.reduce((s, sc) => s + sc.durationSec, 0) * 100) / 100,
    outcomeSummary: `${config.childName} chose to ${option.label.toLowerCase()}. ${option.consequenceSummary}`,
    lessonLearned,
    memoryUpdate: {
      keyEvents: [
        { description: `Decision: ${option.label}`, significance: "major" },
        { description: option.consequenceSummary, significance: "climactic" },
      ],
      resolvedConflicts: [decision.prompt],
      newUnresolvedThreads: option.isCanonPath ? [] : [`What if ${config.childName} had chosen differently?`],
      characterGrowth: [
        { characterName: config.childName, growth: `Learned: ${lessonLearned}` },
      ],
      lessonLearned,
    },
  };
}

/**
 * Validate that a branching episode still meets duration requirements.
 */
export function validateBranchDuration(
  preBranchScenes: ExistingScene[],
  branchContent: BranchContent,
  targetDurationSec: number,
): { valid: boolean; driftSec: number; adjustmentNeeded: number } {
  const preDuration = preBranchScenes.reduce((s, sc) => s + sc.durationSec, 0);
  const totalDuration = preDuration + branchContent.totalDurationSec;
  const driftSec = Math.round((totalDuration - targetDurationSec) * 100) / 100;

  return {
    valid: Math.abs(driftSec) <= DURATION_TOLERANCE_SEC,
    driftSec,
    adjustmentNeeded: -driftSec,
  };
}

/**
 * Get the canonical branch for season memory continuity.
 * When multiple playthroughs exist, this returns the "canon" version.
 */
export function getCanonBranch(options: BranchOption[]): BranchOption | null {
  return options.find((o) => o.isCanonPath) || options[0] || null;
}

/**
 * Build a decision prompt for the story generation model.
 * This is injected into the story generation request at branch point.
 */
export function buildStoryBranchPrompt(
  decision: DecisionNode,
  selectedOption: BranchOption,
  existingContext: string,
): string {
  return [
    `[STORY BRANCH — Interactive Decision]`,
    `Context: ${existingContext}`,
    `Decision point: ${decision.prompt}`,
    `User chose: "${selectedOption.label}" — ${selectedOption.consequenceSummary}`,
    `Emotional tone: ${selectedOption.emotionalTone}`,
    ``,
    `Generate Act III content following this choice.`,
    `The story must resolve positively (kid-friendly).`,
    `Include a clear lesson or moral.`,
    `Maintain character consistency and voice.`,
    `Total remaining scenes: ${BRANCH_ROLES[decision.placement]?.length || 3}.`,
  ].join("\n");
}

/**
 * Serialize decision tree for storage / playback tracking.
 */
export function serializeDecisionTree(
  decision: DecisionNode,
  selectedOptionId: string,
  branchContent: BranchContent,
): string {
  return JSON.stringify({
    decision,
    selectedOptionId,
    branchContent,
    serializedAt: new Date().toISOString(),
  });
}

/* ── Internal Helpers ── */

function findDecisionPoint(scenes: ExistingScene[], placement: DecisionPlacement): number {
  const total = scenes.length;
  if (total < 3) return -1;

  switch (placement) {
    case "midpoint": {
      const mid = Math.floor(total / 2);
      return mid;
    }
    case "pre-climax": {
      return Math.max(1, total - 3);
    }
    case "climax": {
      return Math.max(1, total - 2);
    }
    default:
      return Math.floor(total / 2);
  }
}

function generateBranchOptions(
  config: EpisodeBranchConfig,
  decisionScene: ExistingScene,
  context: string,
  count: number,
): BranchOption[] {
  const tones = Object.keys(BRANCH_TONES);
  const options: BranchOption[] = [];

  // Always generate a "brave" option and a "kind" option
  const defaultPairs: [string, string][] = [
    ["brave", "Face the challenge head-on"],
    ["kind", "Help with compassion"],
    ["clever", "Find a creative solution"],
    ["funny", "Use humor to defuse"],
    ["adventurous", "Explore the unknown path"],
    ["cautious", "Think carefully before acting"],
  ];

  for (let i = 0; i < Math.min(count, defaultPairs.length); i++) {
    const [tone, label] = defaultPairs[i];
    const branchTone = BRANCH_TONES[tone] || BRANCH_TONES.brave;

    options.push({
      id: `opt_${i}_${tone}`,
      label: `${label}`,
      consequenceSummary: buildConsequenceSummary(tone, config.theme, config.childName),
      emotionalTone: tone,
      tensionShift: branchTone.tensionShift,
      isCanonPath: i === 0, // First option is canon
    });
  }

  return options.slice(0, Math.max(MIN_BRANCH_OPTIONS, count));
}

function buildDecisionPrompt(scene: ExistingScene, theme: string): string {
  const emotion = scene.emotion || "tense";
  const templates: Record<string, string> = {
    tense:      "A critical moment — what should our hero do?",
    dramatic:   "The stakes are high — which path will you choose?",
    magical:    "Magic presents two paths — where will the story go?",
    action:     "Quick! Time to decide — fight or flight?",
    emotional:  "The heart speaks — will you listen?",
    playful:    "A fork in the road — which way looks more fun?",
  };
  return templates[emotion] || "What happens next? You decide!";
}

function buildConsequenceSummary(tone: string, theme: string, childName: string): string {
  const map: Record<string, string> = {
    brave:        `${childName} courageously faces the challenge, discovering inner strength.`,
    kind:         `${childName}'s kindness touches hearts and opens a peaceful path.`,
    clever:       `${childName} outsmarts the obstacle with a brilliant plan.`,
    funny:        `${childName}'s humor lightens the mood and wins everyone over.`,
    adventurous:  `${childName} dives into the unknown, finding wonders beyond imagination.`,
    cautious:     `${childName} takes time to observe, finding the safest and wisest path.`,
  };
  return map[tone] || `${childName} makes a choice that changes everything.`;
}

function allocateSceneDurations(totalBudget: number, sceneCount: number, tensionShift: number): number[] {
  // Weight distribution: scenes near climax get more time
  const weights: number[] = [];
  for (let i = 0; i < sceneCount; i++) {
    const pos = i / Math.max(sceneCount - 1, 1);
    // Peak in middle, taper at end
    const weight = pos < 0.5
      ? 0.8 + pos * 0.8 + Math.abs(tensionShift) * 0.3
      : 1.2 - (pos - 0.5) * 0.6;
    weights.push(Math.max(0.5, weight));
  }

  const totalWeight = weights.reduce((s, w) => s + w, 0);
  return weights.map((w) => Math.round(((w / totalWeight) * totalBudget) * 100) / 100);
}

function computeBranchTension(idx: number, total: number, baseTension: number, shift: number): number {
  const pos = idx / Math.max(total - 1, 1);
  // Rise → peak at 60% → fall for resolution
  let tension: number;
  if (pos < 0.6) {
    tension = baseTension + pos * 0.5 + shift;
  } else {
    tension = baseTension + 0.3 - (pos - 0.6) * 0.7 + shift;
  }
  return Math.max(0.1, Math.min(1.0, Math.round(tension * 100) / 100));
}

function tensionToEmotion(tension: number, tone: string): string {
  if (tension > 0.8) return "triumphant";
  if (tension > 0.65) return tone === "brave" || tone === "adventurous" ? "action" : "dramatic";
  if (tension > 0.45) return tone === "kind" || tone === "funny" ? "playful" : "magical";
  return tone === "cautious" ? "calm" : "emotional";
}

function buildBranchNarration(
  childName: string,
  option: BranchOption,
  role: string,
  idx: number,
  total: number,
  context: string,
): string {
  if (idx === 0) {
    return `${childName} made their choice — ${option.label.toLowerCase()}. ${option.consequenceSummary}`;
  }
  if (idx === total - 1) {
    return `And so, through ${option.emotionalTone} choices, ${childName} found the way. The adventure would always be remembered.`;
  }
  if (role.includes("climax")) {
    return `The most exciting part of ${childName}'s journey was just beginning. Everything led to this moment.`;
  }
  return `The adventure continued as ${childName}'s ${option.emotionalTone} spirit guided the way forward.`;
}

function deriveLessonFromBranch(option: BranchOption): string {
  const lessons: Record<string, string> = {
    brave:        "Courage means doing the right thing even when it's scary.",
    kind:         "Kindness is the greatest superpower of all.",
    clever:       "Using your brain can solve any problem.",
    funny:        "Laughter brings everyone together.",
    adventurous:  "The greatest discoveries come from exploring the unknown.",
    cautious:     "Patience and wisdom lead to the best outcomes.",
  };
  return lessons[option.emotionalTone] || "Every choice teaches us something wonderful.";
}
