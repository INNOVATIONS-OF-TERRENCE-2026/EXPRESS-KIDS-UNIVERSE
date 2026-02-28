/**
 * entitlements.ts — Feature entitlement engine
 *
 * Given a user's plan, returns feature flags for UI gating.
 * Supports entitlement overrides for promotional access.
 */

import type { PlanId } from "./plans";
import { getPlan, FEATURES } from "./plans";

/** Feature entitlement check result */
export interface Entitlement {
  featureId: string;
  label: string;
  allowed: boolean;
  reason?: string;
}

/** User subscription state */
export interface UserSubscription {
  planId: PlanId;
  status: "active" | "trialing" | "past_due" | "canceled" | "none";
  /** Expiry timestamp (ms) */
  expiresAt: number | null;
  /** Override entitlements (promotional, admin-granted, etc.) */
  overrides?: Record<string, boolean>;
}

const STORAGE_KEY = "eku_subscription";

/**
 * Get the current user's subscription (from localStorage for now).
 * In production, this would come from Supabase.
 */
export function getUserSubscription(): UserSubscription {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }

  return {
    planId: "free",
    status: "active",
    expiresAt: null,
  };
}

/** Save subscription state (temporary — production uses Supabase) */
export function setUserSubscription(sub: UserSubscription): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sub));
}

/**
 * Check if a specific feature is allowed for the user.
 */
export function checkEntitlement(featureId: string, subscription?: UserSubscription): Entitlement {
  const sub = subscription ?? getUserSubscription();
  const plan = getPlan(sub.planId);
  const feature = FEATURES[featureId];

  if (!feature) {
    return { featureId, label: featureId, allowed: false, reason: "Unknown feature" };
  }

  // Check overrides first
  if (sub.overrides?.[featureId] !== undefined) {
    return {
      featureId,
      label: feature.label,
      allowed: sub.overrides[featureId],
      reason: sub.overrides[featureId] ? "Promotional access" : "Manually restricted",
    };
  }

  // Check subscription status
  if (sub.status === "canceled" || sub.status === "none") {
    // Fall back to free plan features
    const freePlan = getPlan("free");
    const allowed = freePlan.features.includes(featureId);
    return {
      featureId,
      label: feature.label,
      allowed,
      reason: allowed ? undefined : "Subscription inactive",
    };
  }

  // Check if feature is in the plan
  const allowed = plan.features.includes(featureId);
  return {
    featureId,
    label: feature.label,
    allowed,
    reason: allowed ? undefined : `Requires ${plan.name} plan or higher`,
  };
}

/**
 * Get all entitlements for the user's current plan.
 */
export function getAllEntitlements(subscription?: UserSubscription): Entitlement[] {
  return Object.keys(FEATURES).map((fid) => checkEntitlement(fid, subscription));
}

/**
 * Quick boolean check — most common usage in UI gating.
 */
export function hasFeature(featureId: string): boolean {
  return checkEntitlement(featureId).allowed;
}

/**
 * Get the list of features that require an upgrade from current plan.
 */
export function getUpgradeFeatures(subscription?: UserSubscription): Entitlement[] {
  return getAllEntitlements(subscription).filter((e) => !e.allowed);
}
