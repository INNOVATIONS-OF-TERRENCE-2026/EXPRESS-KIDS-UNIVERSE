/**
 * monetizationEngine.ts — Usage tracking and entitlement enforcement.
 *
 * Tracks per-user resource consumption (stories, episodes, voice minutes,
 * video exports) against plan limits. Provides check functions that
 * components call before initiating expensive operations.
 *
 * Data is stored locally (localStorage) for guests, and synced to
 * Supabase for authenticated users.
 */

import { getPlan, type PlanId } from "@/lib/billing/plans";
import { checkEntitlement } from "@/lib/billing/entitlements";

const STORAGE_KEY = "eku_usage_counters";

export interface UsageCounters {
  /** Stories created today (resets daily) */
  storiesToday: number;
  /** Total stories created this billing period */
  storiesTotal: number;
  /** Voice minutes used this billing period */
  voiceMinutes: number;
  /** Video exports this billing period */
  videoExports: number;
  /** ElevenLabs API calls this billing period */
  elevenLabsCalls: number;
  /** Last reset timestamp (ISO date string) */
  lastResetDate: string;
}

const DEFAULT_COUNTERS: UsageCounters = {
  storiesToday: 0,
  storiesTotal: 0,
  voiceMinutes: 0,
  videoExports: 0,
  elevenLabsCalls: 0,
  lastResetDate: new Date().toISOString().split("T")[0],
};

/** Plan-tier limits */
const PLAN_LIMITS: Record<PlanId, { storiesPerDay: number; voiceMinutesPerMonth: number; videoExportsPerMonth: number }> = {
  free: { storiesPerDay: 3, voiceMinutesPerMonth: 10, videoExportsPerMonth: 0 },
  plus: { storiesPerDay: Infinity, voiceMinutesPerMonth: 120, videoExportsPerMonth: 5 },
  studio: { storiesPerDay: Infinity, voiceMinutesPerMonth: Infinity, videoExportsPerMonth: Infinity },
};

/** Load counters from localStorage */
function loadCounters(): UsageCounters {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_COUNTERS };
    const parsed = JSON.parse(raw) as UsageCounters;

    // Auto-reset daily counter
    const today = new Date().toISOString().split("T")[0];
    if (parsed.lastResetDate !== today) {
      parsed.storiesToday = 0;
      parsed.lastResetDate = today;
      saveCounters(parsed);
    }
    return parsed;
  } catch {
    return { ...DEFAULT_COUNTERS };
  }
}

/** Save counters to localStorage */
function saveCounters(counters: UsageCounters) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(counters));
}

/** Get current usage counters */
export function getUsage(): UsageCounters {
  return loadCounters();
}

/** Check if user can create a story */
export function canCreateStory(planId: PlanId): { allowed: boolean; reason?: string } {
  const counters = loadCounters();
  const limits = PLAN_LIMITS[planId];
  if (counters.storiesToday >= limits.storiesPerDay) {
    return { allowed: false, reason: `Daily story limit reached (${limits.storiesPerDay})` };
  }
  return { allowed: true };
}

/** Check if user can use voice minutes */
export function canUseVoice(planId: PlanId, minutes: number = 1): { allowed: boolean; reason?: string } {
  const counters = loadCounters();
  const limits = PLAN_LIMITS[planId];
  if (counters.voiceMinutes + minutes > limits.voiceMinutesPerMonth) {
    return { allowed: false, reason: `Voice minutes limit reached (${limits.voiceMinutesPerMonth} min/month)` };
  }
  return { allowed: true };
}

/** Check if user can export video */
export function canExportVideo(planId: PlanId): { allowed: boolean; reason?: string } {
  const counters = loadCounters();
  const limits = PLAN_LIMITS[planId];
  if (limits.videoExportsPerMonth === 0) {
    return { allowed: false, reason: "Video export requires Adventurer Plus or higher" };
  }
  if (counters.videoExports >= limits.videoExportsPerMonth) {
    return { allowed: false, reason: `Monthly video export limit reached (${limits.videoExportsPerMonth})` };
  }
  return { allowed: true };
}

/** Record a story creation */
export function recordStoryCreation() {
  const counters = loadCounters();
  counters.storiesToday += 1;
  counters.storiesTotal += 1;
  saveCounters(counters);
}

/** Record voice usage */
export function recordVoiceUsage(minutes: number) {
  const counters = loadCounters();
  counters.voiceMinutes += minutes;
  saveCounters(counters);
}

/** Record a video export */
export function recordVideoExport() {
  const counters = loadCounters();
  counters.videoExports += 1;
  saveCounters(counters);
}

/** Record an ElevenLabs API call */
export function recordElevenLabsCall() {
  const counters = loadCounters();
  counters.elevenLabsCalls += 1;
  saveCounters(counters);
}

/** Get plan limits for display */
export function getPlanLimits(planId: PlanId) {
  return PLAN_LIMITS[planId];
}

/** Reset all counters (for testing or manual reset) */
export function resetUsage() {
  saveCounters({ ...DEFAULT_COUNTERS });
}
