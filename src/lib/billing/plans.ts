/**
 * plans.ts — Subscription plan tiers for Express Kids Universe
 *
 * Defines the plan hierarchy and feature matrix.
 * Provider-agnostic — no payment provider lock-in.
 */

export type PlanId = "free" | "plus" | "studio";

export interface PlanFeature {
  id: string;
  label: string;
  /** Short description */
  description: string;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** Price in cents (USD) per month — 0 for free */
  priceMonthly: number;
  /** Price in cents (USD) per year — 0 for free */
  priceYearly: number;
  /** Ordered list of feature IDs included */
  features: string[];
  /** Visual styling */
  accent: string;
  /** Whether this is the recommended/default plan */
  recommended: boolean;
}

/** Feature definitions */
export const FEATURES: Record<string, PlanFeature> = {
  stories_basic: {
    id: "stories_basic",
    label: "3 Stories per Day",
    description: "Create up to 3 personalized stories daily",
  },
  stories_unlimited: {
    id: "stories_unlimited",
    label: "Unlimited Stories",
    description: "Create as many stories as you want",
  },
  gallery: {
    id: "gallery",
    label: "Story Gallery",
    description: "Save and revisit your favorite adventures",
  },
  profiles_1: {
    id: "profiles_1",
    label: "1 Child Profile",
    description: "Create a profile for one child",
  },
  profiles_5: {
    id: "profiles_5",
    label: "Up to 5 Profiles",
    description: "Create profiles for up to 5 children",
  },
  profiles_unlimited: {
    id: "profiles_unlimited",
    label: "Unlimited Profiles",
    description: "No limit on child profiles",
  },
  voice_basic: {
    id: "voice_basic",
    label: "Basic Voice",
    description: "Standard narrator voice",
  },
  voice_cast: {
    id: "voice_cast",
    label: "Voice Cast Studio",
    description: "Choose unique voices for every character",
  },
  episodes_short: {
    id: "episodes_short",
    label: "Short Stories (2 min)",
    description: "Quick bedtime story episodes",
  },
  episodes_full: {
    id: "episodes_full",
    label: "Full Episodes (15 min)",
    description: "Complete animated episode generation",
  },
  hd_export: {
    id: "hd_export",
    label: "HD Video Export",
    description: "Download stories as HD video files",
  },
  parent_controls: {
    id: "parent_controls",
    label: "Parent Controls",
    description: "Safety settings and content filters",
  },
  themes_basic: {
    id: "themes_basic",
    label: "5 Story Themes",
    description: "Choose from 5 adventure themes",
  },
  themes_all: {
    id: "themes_all",
    label: "All Themes",
    description: "Access every theme including seasonal specials",
  },
  priority_gen: {
    id: "priority_gen",
    label: "Priority Generation",
    description: "Your stories are generated first in the queue",
  },
  offline: {
    id: "offline",
    label: "Offline Access",
    description: "Read saved stories without internet",
  },
  toy_generator: {
    id: "toy_generator",
    label: "AI Toy Generator",
    description: "Auto-generate toy concepts from episode characters",
  },
  ar_mode: {
    id: "ar_mode",
    label: "AR Character Projection",
    description: "Project characters into your room via AR",
  },
  interactive_branching: {
    id: "interactive_branching",
    label: "Choose-Your-Ending",
    description: "Interactive branching story paths",
  },
  voice_cloning: {
    id: "voice_cloning",
    label: "AI Voice Cloning",
    description: "Clone and customise character voices",
  },
};

/** Plan definitions */
export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Explorer",
    tagline: "Begin the adventure",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "stories_basic",
      "gallery",
      "profiles_1",
      "voice_basic",
      "episodes_short",
      "parent_controls",
      "themes_basic",
    ],
    accent: "hsl(var(--muted-foreground))",
    recommended: false,
  },
  {
    id: "plus",
    name: "Adventurer Plus",
    tagline: "More magic, more stories",
    priceMonthly: 799, // $7.99
    priceYearly: 7990, // $79.90 (save ~$16)
    features: [
      "stories_unlimited",
      "gallery",
      "profiles_5",
      "voice_basic",
      "episodes_short",
      "episodes_full",
      "parent_controls",
      "themes_all",
      "offline",
      "ar_mode",
    ],
    accent: "hsl(var(--primary))",
    recommended: true,
  },
  {
    id: "studio",
    name: "Studio Pro",
    tagline: "The complete creative studio",
    priceMonthly: 1999, // $19.99
    priceYearly: 19990, // $199.90 (save ~$40)
    features: [
      "stories_unlimited",
      "gallery",
      "profiles_unlimited",
      "voice_cast",
      "episodes_short",
      "episodes_full",
      "hd_export",
      "parent_controls",
      "themes_all",
      "priority_gen",
      "offline",
      "toy_generator",
      "ar_mode",
      "interactive_branching",
      "voice_cloning",
    ],
    accent: "hsl(var(--accent))",
    recommended: false,
  },
];

/** Get a plan by ID */
export function getPlan(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

/** Format price for display */
export function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
}
