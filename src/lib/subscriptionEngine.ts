/**
 * subscriptionEngine.ts — Netflix-Style Subscription Billing Layer
 *
 * Stripe-first subscription management with full lifecycle:
 *   • Checkout session creation
 *   • Webhook verification
 *   • Subscription status sync (Supabase)
 *   • Grace period logic
 *   • Failed payment handling
 *   • Automatic feature gating
 *   • Portal URL for self-service management
 *
 * SAFETY:
 *   ✔ All billing UI hidden if Stripe keys missing
 *   ✔ No secret keys in client code (public key only)
 *   ✔ Webhook signature verification server-side
 *   ✔ Subscription stored in Supabase with RLS
 *   ✔ Graceful degradation to free tier on any failure
 *
 * Tier Structure:
 *   Free        — 30s episodes, limited toys, no AR
 *   Standard    — 5min episodes, AR, basic Lucy budget
 *   Studio      — 10min episodes, full cinematic, voice clone, toys, branching
 *
 * Integrations:
 *   • billing/plans.ts → plan definitions
 *   • billing/entitlements.ts → feature gating
 *   • billing/providers/providerTypes.ts → provider interface
 *   • monetizationEngine.ts → usage tracking
 *   • Supabase subscriptions table → persistent state
 */

import type { PlanId } from "@/lib/billing/plans";
import { getPlan, PLANS } from "@/lib/billing/plans";
import {
  getUserSubscription,
  setUserSubscription,
  type UserSubscription,
} from "@/lib/billing/entitlements";

/* ── Types ── */

export interface StripeConfig {
  /** Stripe publishable key (client-safe) */
  publishableKey: string;
  /** Whether Stripe is configured */
  configured: boolean;
}

export interface CheckoutSessionRequest {
  planId: PlanId;
  userId: string;
  email: string;
  billingInterval: "monthly" | "yearly";
  returnUrl: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  checkoutUrl: string;
}

export interface SubscriptionStatus {
  planId: PlanId;
  planName: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "none";
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  /** Days until expiration */
  daysRemaining: number | null;
  /** Whether currently in grace period */
  inGracePeriod: boolean;
  /** Grace period days remaining */
  graceDaysRemaining: number;
}

export interface WebhookPayload {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

export type SubscriptionFeature =
  | "episodes_short"
  | "episodes_full"
  | "episodes_cinematic"
  | "ar_projection"
  | "voice_cloning"
  | "toy_generator"
  | "interactive_branching"
  | "hd_export"
  | "priority_gen"
  | "season_memory";

/** Feature gating matrix per plan */
export const FEATURE_GATE: Record<PlanId, SubscriptionFeature[]> = {
  free: [
    "episodes_short",
  ],
  plus: [
    "episodes_short",
    "episodes_full",
    "ar_projection",
    "season_memory",
  ],
  studio: [
    "episodes_short",
    "episodes_full",
    "episodes_cinematic",
    "ar_projection",
    "voice_cloning",
    "toy_generator",
    "interactive_branching",
    "hd_export",
    "priority_gen",
    "season_memory",
  ],
};

/** Duration limits per plan (seconds) */
export const PLAN_DURATION_LIMITS: Record<PlanId, number> = {
  free: 30,
  plus: 300,
  studio: 600,
};

/* ── Constants ── */

const GRACE_PERIOD_DAYS = 3;
const STRIPE_PUBLISHABLE_KEY_PREFIX = "pk_";

/** Stripe Price IDs (set via env or config) */
const STRIPE_PRICE_IDS: Record<string, string> = {
  "plus_monthly": "",
  "plus_yearly": "",
  "studio_monthly": "",
  "studio_yearly": "",
};

/* ── Stripe Detection ── */

/**
 * Check if Stripe is configured (publishable key available).
 * All billing UI hides when this returns false.
 */
export function getStripeConfig(): StripeConfig {
  // In production, this checks for env variable or meta tag
  const key = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY) || "";
  const configured = typeof key === "string" && key.startsWith(STRIPE_PUBLISHABLE_KEY_PREFIX) && key.length > 10;
  return { publishableKey: key, configured };
}

/**
 * Check if billing features should be shown.
 */
export function isBillingEnabled(): boolean {
  return getStripeConfig().configured;
}

/* ── Subscription State ── */

/**
 * Get current subscription status with computed fields.
 */
export function getSubscriptionStatus(sub?: UserSubscription): SubscriptionStatus {
  const subscription = sub ?? getUserSubscription();
  const plan = getPlan(subscription.planId);

  let daysRemaining: number | null = null;
  let inGracePeriod = false;
  let graceDaysRemaining = 0;

  if (subscription.expiresAt) {
    const now = Date.now();
    const expiry = subscription.expiresAt;
    daysRemaining = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));

    if (subscription.status === "past_due") {
      inGracePeriod = true;
      graceDaysRemaining = Math.max(0, GRACE_PERIOD_DAYS - Math.floor((now - expiry) / (1000 * 60 * 60 * 24)));
    }
  }

  return {
    planId: subscription.planId,
    planName: plan.name,
    status: subscription.status,
    currentPeriodEnd: subscription.expiresAt
      ? new Date(subscription.expiresAt).toISOString()
      : null,
    cancelAtPeriodEnd: false,
    daysRemaining,
    inGracePeriod,
    graceDaysRemaining,
  };
}

/**
 * Check if a specific feature is available for the current subscription.
 */
export function hasSubscriptionFeature(feature: SubscriptionFeature, sub?: UserSubscription): boolean {
  const subscription = sub ?? getUserSubscription();

  // During grace period, maintain access
  if (subscription.status === "past_due") {
    const status = getSubscriptionStatus(subscription);
    if (status.graceDaysRemaining <= 0) {
      // Grace period expired — fall back to free
      return FEATURE_GATE.free.includes(feature);
    }
  }

  // Canceled but not expired — keep access until period end
  if (subscription.status === "canceled" && subscription.expiresAt) {
    if (Date.now() < subscription.expiresAt) {
      return FEATURE_GATE[subscription.planId]?.includes(feature) ?? false;
    }
    return FEATURE_GATE.free.includes(feature);
  }

  // Normal active state
  if (subscription.status === "active" || subscription.status === "trialing") {
    return FEATURE_GATE[subscription.planId]?.includes(feature) ?? false;
  }

  // Default: free tier
  return FEATURE_GATE.free.includes(feature);
}

/**
 * Get the maximum episode duration allowed for a plan.
 */
export function getMaxDurationForPlan(planId?: PlanId): number {
  const id = planId ?? getUserSubscription().planId;
  return PLAN_DURATION_LIMITS[id] ?? PLAN_DURATION_LIMITS.free;
}

/**
 * Get all features available in a plan.
 */
export function getPlanFeatures(planId: PlanId): SubscriptionFeature[] {
  return [...(FEATURE_GATE[planId] || FEATURE_GATE.free)];
}

/**
 * Get features that would unlock by upgrading to a plan.
 */
export function getUpgradeUnlocks(
  currentPlanId: PlanId,
  targetPlanId: PlanId,
): SubscriptionFeature[] {
  const current = new Set(FEATURE_GATE[currentPlanId] || []);
  return (FEATURE_GATE[targetPlanId] || []).filter((f) => !current.has(f));
}

/* ── Checkout Flow ── */

/**
 * Create a Stripe Checkout session via edge function.
 *
 * The actual Stripe API call happens server-side in the
 * create-checkout edge function. This prepares the request.
 */
export function buildCheckoutRequest(
  planId: PlanId,
  userId: string,
  email: string,
  billingInterval: "monthly" | "yearly",
): CheckoutSessionRequest {
  return {
    planId,
    userId,
    email,
    billingInterval,
    returnUrl: `${window.location.origin}/account?checkout=complete`,
  };
}

/**
 * Handle post-checkout return.
 * Checks URL params and syncs subscription state.
 */
export async function handleCheckoutReturn(): Promise<{
  success: boolean;
  planId?: PlanId;
}> {
  const params = new URLSearchParams(window.location.search);
  const checkoutStatus = params.get("checkout");

  if (checkoutStatus === "complete") {
    // In production, fetch updated subscription from Supabase
    // For now, return success — the webhook will sync state
    return { success: true };
  }

  return { success: false };
}

/* ── Webhook Processing (Server-Side Reference) ── */

/**
 * Process a Stripe webhook event.
 *
 * NOTE: This runs server-side in the Supabase Edge Function.
 * Included here as a reference for the event types handled.
 */
export function getWebhookEventHandlers(): Record<string, string> {
  return {
    "checkout.session.completed": "Create/activate subscription in Supabase",
    "customer.subscription.created": "Sync new subscription to subscriptions table",
    "customer.subscription.updated": "Update plan/status in subscriptions table",
    "customer.subscription.deleted": "Mark subscription as canceled",
    "invoice.payment_succeeded": "Reset billing period counters",
    "invoice.payment_failed": "Set status to past_due, start grace period",
    "customer.subscription.trial_will_end": "Send trial ending notification",
  };
}

/**
 * Build the server-side webhook handler signature verification params.
 * (For edge function implementation reference)
 */
export function getWebhookVerificationSpec(): {
  headerName: string;
  algorithm: string;
  tolerance: number;
} {
  return {
    headerName: "stripe-signature",
    algorithm: "HMAC-SHA256",
    tolerance: 300, // 5 minutes tolerance
  };
}

/* ── Subscription Lifecycle ── */

/**
 * Upgrade subscription locally (optimistic update).
 * Real update comes via webhook → Supabase sync.
 */
export function optimisticUpgrade(planId: PlanId): void {
  const sub = getUserSubscription();
  setUserSubscription({
    ...sub,
    planId,
    status: "active",
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // +30 days
  });
}

/**
 * Handle failed payment — enter grace period.
 */
export function enterGracePeriod(): void {
  const sub = getUserSubscription();
  setUserSubscription({
    ...sub,
    status: "past_due",
    expiresAt: Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
  });
}

/**
 * Handle subscription cancellation — maintain access until period end.
 */
export function cancelSubscription(periodEndTimestamp: number): void {
  const sub = getUserSubscription();
  setUserSubscription({
    ...sub,
    status: "canceled",
    expiresAt: periodEndTimestamp,
  });
}

/**
 * Hard reset to free tier (grace period expired or manual downgrade).
 */
export function resetToFreeTier(): void {
  setUserSubscription({
    planId: "free",
    status: "active",
    expiresAt: null,
  });
}

/* ── Plan Comparison Helpers ── */

/**
 * Get all plans with pricing for display.
 */
export function getPlansForDisplay(): Array<{
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: string;
  yearlyPrice: string;
  features: SubscriptionFeature[];
  recommended: boolean;
}> {
  return PLANS.map((p) => ({
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    monthlyPrice: p.priceMonthly === 0 ? "Free" : `$${(p.priceMonthly / 100).toFixed(2)}`,
    yearlyPrice: p.priceYearly === 0 ? "Free" : `$${(p.priceYearly / 100).toFixed(2)}`,
    features: FEATURE_GATE[p.id] || [],
    recommended: p.recommended,
  }));
}

/** Feature display labels */
export const FEATURE_LABELS: Record<SubscriptionFeature, string> = {
  episodes_short: "Short Episodes (30s)",
  episodes_full: "Full Episodes (5 min)",
  episodes_cinematic: "Cinematic Episodes (10 min)",
  ar_projection: "AR Character Projection",
  voice_cloning: "AI Voice Cloning",
  toy_generator: "AI Toy Product Generator",
  interactive_branching: "Interactive Choose-Your-Ending",
  hd_export: "HD Video Export",
  priority_gen: "Priority Generation Queue",
  season_memory: "Multi-Season Memory",
};
