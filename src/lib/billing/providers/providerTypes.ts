/**
 * providerTypes.ts — Payment provider interface
 *
 * Provider-agnostic abstraction layer for subscription billing.
 * Future implementations:
 *   - StripeProvider
 *   - PaddleProvider
 *   - LemonSqueezyProvider
 *
 * No real payment keys or activation — safely ships without provider config.
 */

import type { PlanId } from "../plans";

/** Checkout session creation result */
export interface CheckoutResult {
  /** Redirect URL to payment page */
  checkoutUrl: string;
  /** Session ID for tracking */
  sessionId: string;
}

/** Subscription status from provider */
export interface ProviderSubscriptionStatus {
  /** Provider's subscription ID */
  subscriptionId: string;
  /** Plan ID mapped to our system */
  planId: PlanId;
  /** Current status */
  status: "active" | "trialing" | "past_due" | "canceled";
  /** Current period end timestamp */
  currentPeriodEnd: number;
  /** Whether subscription will cancel at period end */
  cancelAtPeriodEnd: boolean;
}

/** Webhook event from provider */
export interface WebhookEvent {
  /** Event type identifier */
  type: string;
  /** Raw event data */
  data: Record<string, unknown>;
  /** Event timestamp */
  timestamp: number;
}

/**
 * Payment provider interface.
 *
 * Each provider implementation handles:
 *   - Checkout session creation
 *   - Subscription status queries
 *   - Webhook event processing
 */
export interface PaymentProvider {
  /** Provider name */
  readonly name: string;

  /** Whether this provider is configured and ready */
  isConfigured(): boolean;

  /**
   * Create a checkout session for a given plan.
   * Returns a URL to redirect the user to.
   */
  createCheckout(params: {
    planId: PlanId;
    userId: string;
    email: string;
    billingInterval: "monthly" | "yearly";
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutResult>;

  /**
   * Get current subscription status for a user.
   */
  getSubscriptionStatus(userId: string): Promise<ProviderSubscriptionStatus | null>;

  /**
   * Process an incoming webhook event.
   * Returns the event type that was processed.
   */
  handleWebhook(event: WebhookEvent): Promise<{
    processed: boolean;
    action?: "subscription_created" | "subscription_updated" | "subscription_canceled" | "payment_failed";
    userId?: string;
    planId?: PlanId;
  }>;

  /**
   * Generate a customer portal URL for subscription management.
   */
  getPortalUrl(userId: string): Promise<string | null>;
}

/**
 * NullProvider — No-op provider for when billing is not configured.
 */
export class NullProvider implements PaymentProvider {
  readonly name = "none";

  isConfigured(): boolean {
    return false;
  }

  async createCheckout(): Promise<CheckoutResult> {
    return { checkoutUrl: "#", sessionId: "" };
  }

  async getSubscriptionStatus(): Promise<null> {
    return null;
  }

  async handleWebhook(): Promise<{ processed: boolean }> {
    return { processed: false };
  }

  async getPortalUrl(): Promise<null> {
    return null;
  }
}

/** Singleton null provider — used until a real provider is configured */
export const nullProvider = new NullProvider();
