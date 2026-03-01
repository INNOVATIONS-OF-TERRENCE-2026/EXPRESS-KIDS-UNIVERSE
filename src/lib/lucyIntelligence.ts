/**
 * lucyIntelligence.ts — Credit-Based Cinematic Budgeting AI "Lucy Intelligence"
 *
 * AI-driven cost governance + cinematic optimization engine.
 * Before any generation, Lucy calculates:
 *   - Estimated provider cost per component
 *   - Audio / animation / SFX breakdowns
 *   - Total credit burn estimate
 *   - Recommended duration & quality level
 *   - Budget risk assessment
 *
 * Budget Modes:
 *   - Eco Mode (low cost) → fewer scenes, lower resolution, less animation
 *   - Standard Mode → balanced quality/cost
 *   - Studio Mode → maximum cinematic fidelity
 *
 * Hard Protection:
 *   - If estimated cost > user credits → block with confirmation modal
 *   - Offer duration/quality reduction suggestions
 *   - No silent overconsumption
 */

import type { VideoDuration, PacingMode } from "@/lib/studio/video/videoJobTypes";
import { DURATION_SEC } from "@/lib/studio/video/videoJobTypes";
import type { PlanId } from "@/lib/billing/plans";

/* ── Types ── */

export type BudgetMode = "eco" | "standard" | "studio";

export type BudgetRiskLevel = "low" | "medium" | "high" | "critical";

export interface CostBreakdown {
  /** ElevenLabs TTS cost (credits) */
  audioCost: number;
  /** RunwayML animation cost (credits) */
  animationCost: number;
  /** Scene image generation cost (credits) */
  imageCost: number;
  /** SFX processing cost (credits) */
  sfxCost: number;
  /** BGM licensing/generation cost (credits) */
  bgmCost: number;
  /** Storage cost (credits) */
  storageCost: number;
  /** Processing overhead (credits) */
  overheadCost: number;
}

export interface LucyEstimate {
  /** Total estimated credit cost */
  estimatedCost: number;
  /** Detailed cost breakdown */
  breakdown: CostBreakdown;
  /** Current user credits */
  userCredits: number;
  /** Credits remaining after generation */
  creditsRemaining: number;
  /** Can the user afford this? */
  canAfford: boolean;
  /** Risk level assessment */
  budgetRiskLevel: BudgetRiskLevel;
  /** Recommended duration if budget is tight */
  recommendedDuration: VideoDuration;
  /** Recommended quality level */
  recommendedQualityLevel: BudgetMode;
  /** Human-readable summary */
  summary: string;
  /** Suggestions for cost reduction */
  suggestions: string[];
  /** Budget mode used for this estimate */
  budgetMode: BudgetMode;
  /** Scene count in estimate */
  sceneCount: number;
  /** Duration in seconds */
  durationSec: number;
}

export interface LucyInput {
  targetDuration: VideoDuration;
  sceneCount: number;
  pacingMode: PacingMode;
  budgetMode: BudgetMode;
  userCredits: number;
  planId: PlanId;
  hasRunwayKey: boolean;
  hasElevenLabsKey: boolean;
}

export interface BudgetModeConfig {
  /** Scene density multiplier (0.5–1.5) */
  sceneDensity: number;
  /** Camera complexity level (0–1) */
  cameraComplexity: number;
  /** Animation resolution multiplier */
  animationQuality: number;
  /** SFX density multiplier */
  sfxDensity: number;
  /** BGM layers count */
  bgmLayers: number;
  /** Whether to use AI animation (Runway) */
  useAiAnimation: boolean;
  /** Whether to use premium TTS */
  usePremiumTts: boolean;
}

/* ── Constants ── */

export const BUDGET_MODE_LABELS: Record<BudgetMode, string> = {
  eco: "Eco Mode",
  standard: "Standard",
  studio: "Studio Pro",
};

export const BUDGET_MODE_DESCRIPTIONS: Record<BudgetMode, string> = {
  eco: "Lower cost — fewer effects, faster generation",
  standard: "Balanced quality and cost",
  studio: "Maximum cinematic quality — higher credit usage",
};

/** Credits cost per unit */
const COST_PER_UNIT = {
  /** Cost per scene for ElevenLabs TTS (credits) */
  ttsPerScene: 2,
  /** Cost per scene for AI animation (Runway) (credits) */
  animationPerScene: 5,
  /** Cost per scene for image generation (credits) */
  imagePerScene: 1,
  /** Cost per SFX cue (credits) */
  sfxPerCue: 0.1,
  /** Base BGM cost (credits) */
  bgmBase: 1,
  /** Storage per minute (credits) */
  storagePerMinute: 0.5,
  /** Fixed overhead per job (credits) */
  overhead: 1,
} as const;

/** Budget mode configurations */
const BUDGET_CONFIGS: Record<BudgetMode, BudgetModeConfig> = {
  eco: {
    sceneDensity: 0.6,
    cameraComplexity: 0.3,
    animationQuality: 0.5,
    sfxDensity: 0.4,
    bgmLayers: 1,
    useAiAnimation: false,
    usePremiumTts: false,
  },
  standard: {
    sceneDensity: 1.0,
    cameraComplexity: 0.6,
    animationQuality: 0.8,
    sfxDensity: 1.0,
    bgmLayers: 2,
    useAiAnimation: true,
    usePremiumTts: true,
  },
  studio: {
    sceneDensity: 1.3,
    cameraComplexity: 1.0,
    animationQuality: 1.0,
    sfxDensity: 1.3,
    bgmLayers: 3,
    useAiAnimation: true,
    usePremiumTts: true,
  },
};

/** Plan credit allocations */
const PLAN_CREDITS: Record<PlanId, number> = {
  free: 50,
  plus: 500,
  studio: 5000,
};

/* ── Core Functions ── */

/**
 * Lucy's main estimation function.
 * Returns a complete cost estimate before any generation starts.
 */
export function lucyEstimate(input: LucyInput): LucyEstimate {
  const {
    targetDuration,
    sceneCount,
    pacingMode,
    budgetMode,
    userCredits,
    planId,
    hasRunwayKey,
    hasElevenLabsKey,
  } = input;

  const durationSec = DURATION_SEC[targetDuration] ?? 120;
  const config = BUDGET_CONFIGS[budgetMode];

  // Adjust scene count by budget mode density
  const effectiveScenes = Math.max(2, Math.round(sceneCount * config.sceneDensity));

  // Calculate costs
  const audioCost = hasElevenLabsKey && config.usePremiumTts
    ? effectiveScenes * COST_PER_UNIT.ttsPerScene
    : 0;

  const animationCost = hasRunwayKey && config.useAiAnimation
    ? effectiveScenes * COST_PER_UNIT.animationPerScene * config.animationQuality
    : 0;

  const imageCost = effectiveScenes * COST_PER_UNIT.imagePerScene;

  const avgSfxPerScene = 2 * config.sfxDensity;
  const sfxCost = effectiveScenes * avgSfxPerScene * COST_PER_UNIT.sfxPerCue;

  const durationMin = durationSec / 60;
  const bgmCost = COST_PER_UNIT.bgmBase * config.bgmLayers;

  const storageCost = durationMin * COST_PER_UNIT.storagePerMinute;

  const overheadCost = COST_PER_UNIT.overhead;

  const breakdown: CostBreakdown = {
    audioCost: round2(audioCost),
    animationCost: round2(animationCost),
    imageCost: round2(imageCost),
    sfxCost: round2(sfxCost),
    bgmCost: round2(bgmCost),
    storageCost: round2(storageCost),
    overheadCost: round2(overheadCost),
  };

  const estimatedCost = round2(
    audioCost + animationCost + imageCost + sfxCost + bgmCost + storageCost + overheadCost,
  );

  const creditsRemaining = round2(userCredits - estimatedCost);
  const canAfford = creditsRemaining >= 0;

  // Risk assessment
  const budgetRatio = estimatedCost / Math.max(1, userCredits);
  let budgetRiskLevel: BudgetRiskLevel = "low";
  if (budgetRatio > 1.0) budgetRiskLevel = "critical";
  else if (budgetRatio > 0.75) budgetRiskLevel = "high";
  else if (budgetRatio > 0.5) budgetRiskLevel = "medium";

  // Recommendations
  const recommendedDuration = getRecommendedDuration(estimatedCost, userCredits, targetDuration);
  const recommendedQualityLevel = getRecommendedQuality(estimatedCost, userCredits, budgetMode);

  // Suggestions
  const suggestions = generateSuggestions(
    estimatedCost,
    userCredits,
    budgetMode,
    targetDuration,
    hasRunwayKey,
    sceneCount,
  );

  // Summary
  const summary = canAfford
    ? `Estimated ${estimatedCost} credits for ${effectiveScenes} scenes (${formatDuration(durationSec)}). ${creditsRemaining} credits remaining.`
    : `⚠️ Insufficient credits. Need ${estimatedCost} but only ${userCredits} available. ${suggestions[0] || ""}`;

  return {
    estimatedCost,
    breakdown,
    userCredits,
    creditsRemaining,
    canAfford,
    budgetRiskLevel,
    recommendedDuration,
    recommendedQualityLevel,
    summary,
    suggestions,
    budgetMode,
    sceneCount: effectiveScenes,
    durationSec,
  };
}

/**
 * Quick check: can the user afford this generation?
 */
export function canAffordGeneration(
  targetDuration: VideoDuration,
  sceneCount: number,
  budgetMode: BudgetMode,
  userCredits: number,
): boolean {
  const estimate = lucyEstimate({
    targetDuration,
    sceneCount,
    pacingMode: "kids",
    budgetMode,
    userCredits,
    planId: "free",
    hasRunwayKey: budgetMode === "studio",
    hasElevenLabsKey: budgetMode !== "eco",
  });
  return estimate.canAfford;
}

/**
 * Get the budget mode config for adjusting other engines.
 */
export function getBudgetConfig(mode: BudgetMode): BudgetModeConfig {
  return { ...BUDGET_CONFIGS[mode] };
}

/**
 * Get user's available credits based on plan.
 */
export function getPlanCredits(planId: PlanId): number {
  return PLAN_CREDITS[planId] ?? PLAN_CREDITS.free;
}

/**
 * Format a cost estimate for display.
 */
export function formatCreditCost(credits: number): string {
  if (credits === 0) return "Free";
  if (credits < 1) return `${Math.round(credits * 100) / 100} credit`;
  return `${Math.round(credits)} credits`;
}

/**
 * Get color class for risk level display.
 */
export function getRiskColor(risk: BudgetRiskLevel): string {
  switch (risk) {
    case "low": return "text-green-500";
    case "medium": return "text-yellow-500";
    case "high": return "text-orange-500";
    case "critical": return "text-red-500";
  }
}

/* ── Internal Helpers ── */

function getRecommendedDuration(
  cost: number,
  credits: number,
  current: VideoDuration,
): VideoDuration {
  if (cost <= credits) return current;

  // Try shorter durations
  const durations: VideoDuration[] = ["short", "medium", "full"];
  const currentIdx = durations.indexOf(current);

  for (let i = currentIdx - 1; i >= 0; i--) {
    return durations[i];
  }

  return "short";
}

function getRecommendedQuality(
  cost: number,
  credits: number,
  current: BudgetMode,
): BudgetMode {
  if (cost <= credits) return current;

  // Recommend lower quality
  const modes: BudgetMode[] = ["eco", "standard", "studio"];
  const currentIdx = modes.indexOf(current);

  for (let i = currentIdx - 1; i >= 0; i--) {
    return modes[i];
  }

  return "eco";
}

function generateSuggestions(
  cost: number,
  credits: number,
  mode: BudgetMode,
  duration: VideoDuration,
  hasRunway: boolean,
  sceneCount: number,
): string[] {
  const suggestions: string[] = [];

  if (cost > credits) {
    if (mode === "studio") {
      suggestions.push("Switch to Standard mode to reduce cost by ~40%.");
    }
    if (mode === "standard") {
      suggestions.push("Switch to Eco mode for the lowest cost.");
    }
    if (duration === "full") {
      suggestions.push("Try a 5-minute clip instead of a full episode.");
    }
    if (duration === "medium") {
      suggestions.push("Try a 2-minute trailer to save credits.");
    }
    if (hasRunway && sceneCount > 4) {
      suggestions.push("Reduce scene count to lower animation costs.");
    }
    suggestions.push("Upgrade your plan for more credits.");
  } else if (cost > credits * 0.75) {
    suggestions.push("This will use most of your remaining credits.");
    if (mode === "studio") {
      suggestions.push("Consider Standard mode to preserve credits.");
    }
  }

  return suggestions;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m === 0) return `${s}s`;
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
