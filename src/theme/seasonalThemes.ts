/**
 * Express Kids Universe — Seasonal Theme Bundle System
 *
 * 12 seasonal themes organized into 4 bundles:
 *   Winter Magic (Dec–Feb): Frost Glow, Candy Cane Burst, Aurora Snowfall
 *   Spring Bloom (Mar–May): Blossom Spark, Pastel Sky, Rainbow Garden
 *   Summer Adventure (Jun–Aug): Sunset Splash, Tropical Burst, Rocket Carnival
 *   Fall Galaxy (Sep–Nov): Ember Glow, Harvest Star, Midnight Pumpkin
 *
 * Each theme follows the same ThemeDefinition interface as core themes.
 * The seasonalEngine auto-activates the correct bundle default based on month.
 */

import type { ThemeDefinition } from "./themes";

export type Season = "winter" | "spring" | "summer" | "fall";

export interface SeasonalBundle {
  season: Season;
  label: string;
  emoji: string;
  description: string;
  /** First theme id is the bundle default */
  themeIds: string[];
  /** CSS class for particle overlay */
  particleClass: string;
}

/* ══════════════════════════════════════════════════════════
   WINTER MAGIC BUNDLE — Dec, Jan, Feb
   ══════════════════════════════════════════════════════════ */

const FROST_GLOW: ThemeDefinition = {
  id: "frost-glow",
  name: "Frost Glow",
  description: "Icy crystal shimmer under moonlight",
  previewColors: ["#93c5fd", "#c4b5fd", "#e0f2fe"],
  vars: {
    "--eku-bg": "215 55% 5%",
    "--eku-bg-lighter": "215 45% 10%",
    "--eku-aurora-1": "210 80% 68%",
    "--eku-aurora-2": "260 70% 72%",
    "--eku-aurora-3": "200 85% 78%",
    "--eku-gold": "45 90% 62%",
    "--eku-sky": "205 95% 80%",
    "--eku-ink": "215 20% 96%",
    "--eku-glow": "210 90% 75%",
    "--background": "215 55% 5%",
    "--foreground": "215 20% 96%",
    "--card": "215 45% 11%",
    "--card-foreground": "215 20% 96%",
    "--popover": "215 45% 9%",
    "--popover-foreground": "215 20% 96%",
    "--primary": "210 80% 68%",
    "--primary-foreground": "215 55% 5%",
    "--secondary": "260 70% 72%",
    "--secondary-foreground": "0 0% 100%",
    "--muted": "215 25% 18%",
    "--muted-foreground": "215 20% 68%",
    "--accent": "200 85% 78%",
    "--accent-foreground": "215 55% 5%",
    "--border": "215 25% 22%",
    "--input": "215 25% 16%",
    "--ring": "210 80% 68%",
    "--glass-bg": "215 35% 13%",
    "--glass-border": "215 25% 28%",
    "--glass-glow": "210 90% 75%",
  },
};

const CANDY_CANE_BURST: ThemeDefinition = {
  id: "candy-cane-burst",
  name: "Candy Cane Burst",
  description: "Peppermint red and snowy white celebration",
  previewColors: ["#ef4444", "#fca5a5", "#fef2f2"],
  vars: {
    "--eku-bg": "0 45% 5%",
    "--eku-bg-lighter": "0 35% 10%",
    "--eku-aurora-1": "0 80% 60%",
    "--eku-aurora-2": "0 60% 75%",
    "--eku-aurora-3": "150 70% 55%",
    "--eku-gold": "48 95% 60%",
    "--eku-sky": "0 70% 82%",
    "--eku-ink": "0 20% 96%",
    "--eku-glow": "0 90% 65%",
    "--background": "0 45% 5%",
    "--foreground": "0 20% 96%",
    "--card": "0 35% 11%",
    "--card-foreground": "0 20% 96%",
    "--popover": "0 35% 9%",
    "--popover-foreground": "0 20% 96%",
    "--primary": "0 80% 60%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "150 70% 55%",
    "--secondary-foreground": "0 0% 100%",
    "--muted": "0 20% 18%",
    "--muted-foreground": "0 20% 68%",
    "--accent": "48 95% 60%",
    "--accent-foreground": "0 45% 5%",
    "--border": "0 20% 22%",
    "--input": "0 20% 16%",
    "--ring": "0 80% 60%",
    "--glass-bg": "0 28% 13%",
    "--glass-border": "0 20% 27%",
    "--glass-glow": "0 90% 65%",
  },
};

const AURORA_SNOWFALL: ThemeDefinition = {
  id: "aurora-snowfall",
  name: "Aurora Snowfall",
  description: "Northern lights with gentle snowflakes",
  previewColors: ["#34d399", "#818cf8", "#bfdbfe"],
  vars: {
    "--eku-bg": "230 50% 5%",
    "--eku-bg-lighter": "230 40% 10%",
    "--eku-aurora-1": "160 70% 58%",
    "--eku-aurora-2": "240 75% 68%",
    "--eku-aurora-3": "210 80% 75%",
    "--eku-gold": "50 90% 60%",
    "--eku-sky": "210 90% 78%",
    "--eku-ink": "230 20% 96%",
    "--eku-glow": "160 80% 60%",
    "--background": "230 50% 5%",
    "--foreground": "230 20% 96%",
    "--card": "230 40% 11%",
    "--card-foreground": "230 20% 96%",
    "--popover": "230 40% 9%",
    "--popover-foreground": "230 20% 96%",
    "--primary": "160 70% 58%",
    "--primary-foreground": "230 50% 5%",
    "--secondary": "240 75% 68%",
    "--secondary-foreground": "0 0% 100%",
    "--muted": "230 25% 17%",
    "--muted-foreground": "230 20% 66%",
    "--accent": "210 80% 75%",
    "--accent-foreground": "230 50% 5%",
    "--border": "230 25% 21%",
    "--input": "230 25% 15%",
    "--ring": "160 70% 58%",
    "--glass-bg": "230 35% 12%",
    "--glass-border": "230 25% 26%",
    "--glass-glow": "160 80% 60%",
  },
};

/* ══════════════════════════════════════════════════════════
   SPRING BLOOM BUNDLE — Mar, Apr, May
   ══════════════════════════════════════════════════════════ */

const BLOSSOM_SPARK: ThemeDefinition = {
  id: "blossom-spark",
  name: "Blossom Spark",
  description: "Cherry blossom petals in morning light",
  previewColors: ["#f9a8d4", "#fbcfe8", "#fdf2f8"],
  vars: {
    "--eku-bg": "340 45% 6%",
    "--eku-bg-lighter": "340 35% 11%",
    "--eku-aurora-1": "340 75% 68%",
    "--eku-aurora-2": "320 70% 75%",
    "--eku-aurora-3": "280 65% 70%",
    "--eku-gold": "48 95% 62%",
    "--eku-sky": "200 80% 72%",
    "--eku-ink": "340 15% 96%",
    "--eku-glow": "340 80% 72%",
    "--background": "340 45% 6%",
    "--foreground": "340 15% 96%",
    "--card": "340 35% 12%",
    "--card-foreground": "340 15% 96%",
    "--popover": "340 35% 10%",
    "--popover-foreground": "340 15% 96%",
    "--primary": "340 75% 68%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "280 65% 70%",
    "--secondary-foreground": "0 0% 100%",
    "--muted": "340 22% 18%",
    "--muted-foreground": "340 15% 68%",
    "--accent": "48 95% 62%",
    "--accent-foreground": "340 45% 6%",
    "--border": "340 22% 23%",
    "--input": "340 22% 16%",
    "--ring": "340 75% 68%",
    "--glass-bg": "340 28% 14%",
    "--glass-border": "340 22% 28%",
    "--glass-glow": "340 80% 72%",
  },
};

const PASTEL_SKY: ThemeDefinition = {
  id: "pastel-sky",
  name: "Pastel Sky",
  description: "Soft pastel clouds on a spring morning",
  previewColors: ["#a5b4fc", "#c4b5fd", "#fbcfe8"],
  vars: {
    "--eku-bg": "250 45% 6%",
    "--eku-bg-lighter": "250 35% 11%",
    "--eku-aurora-1": "235 80% 72%",
    "--eku-aurora-2": "270 70% 72%",
    "--eku-aurora-3": "330 65% 72%",
    "--eku-gold": "48 90% 60%",
    "--eku-sky": "235 85% 78%",
    "--eku-ink": "250 15% 96%",
    "--eku-glow": "250 85% 75%",
    "--background": "250 45% 6%",
    "--foreground": "250 15% 96%",
    "--card": "250 35% 11%",
    "--card-foreground": "250 15% 96%",
    "--popover": "250 35% 9%",
    "--popover-foreground": "250 15% 96%",
    "--primary": "235 80% 72%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "330 65% 72%",
    "--secondary-foreground": "0 0% 100%",
    "--muted": "250 22% 18%",
    "--muted-foreground": "250 15% 66%",
    "--accent": "270 70% 72%",
    "--accent-foreground": "0 0% 100%",
    "--border": "250 22% 22%",
    "--input": "250 22% 15%",
    "--ring": "235 80% 72%",
    "--glass-bg": "250 28% 13%",
    "--glass-border": "250 22% 27%",
    "--glass-glow": "250 85% 75%",
  },
};

const RAINBOW_GARDEN: ThemeDefinition = {
  id: "rainbow-garden",
  name: "Rainbow Garden",
  description: "Every color blooming in a magic garden",
  previewColors: ["#f472b6", "#a3e635", "#38bdf8"],
  vars: {
    "--eku-bg": "150 40% 5%",
    "--eku-bg-lighter": "150 30% 10%",
    "--eku-aurora-1": "330 75% 62%",
    "--eku-aurora-2": "85 75% 55%",
    "--eku-aurora-3": "200 80% 62%",
    "--eku-gold": "50 95% 58%",
    "--eku-sky": "200 85% 68%",
    "--eku-ink": "150 15% 96%",
    "--eku-glow": "85 80% 58%",
    "--background": "150 40% 5%",
    "--foreground": "150 15% 96%",
    "--card": "150 30% 11%",
    "--card-foreground": "150 15% 96%",
    "--popover": "150 30% 9%",
    "--popover-foreground": "150 15% 96%",
    "--primary": "85 75% 55%",
    "--primary-foreground": "150 40% 5%",
    "--secondary": "330 75% 62%",
    "--secondary-foreground": "0 0% 100%",
    "--muted": "150 20% 17%",
    "--muted-foreground": "150 15% 65%",
    "--accent": "200 80% 62%",
    "--accent-foreground": "0 0% 100%",
    "--border": "150 20% 20%",
    "--input": "150 20% 14%",
    "--ring": "85 75% 55%",
    "--glass-bg": "150 25% 12%",
    "--glass-border": "150 20% 25%",
    "--glass-glow": "85 80% 58%",
  },
};

/* ══════════════════════════════════════════════════════════
   SUMMER ADVENTURE BUNDLE — Jun, Jul, Aug
   ══════════════════════════════════════════════════════════ */

const SUNSET_SPLASH: ThemeDefinition = {
  id: "sunset-splash",
  name: "Sunset Splash",
  description: "Ocean sunset with warm golden waves",
  previewColors: ["#fb923c", "#f97316", "#fbbf24"],
  vars: {
    "--eku-bg": "25 50% 5%",
    "--eku-bg-lighter": "25 40% 10%",
    "--eku-aurora-1": "28 90% 58%",
    "--eku-aurora-2": "20 85% 55%",
    "--eku-aurora-3": "45 90% 58%",
    "--eku-gold": "45 100% 60%",
    "--eku-sky": "200 72% 62%",
    "--eku-ink": "25 18% 96%",
    "--eku-glow": "28 95% 62%",
    "--background": "25 50% 5%",
    "--foreground": "25 18% 96%",
    "--card": "25 40% 11%",
    "--card-foreground": "25 18% 96%",
    "--popover": "25 40% 9%",
    "--popover-foreground": "25 18% 96%",
    "--primary": "28 90% 58%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "45 90% 58%",
    "--secondary-foreground": "25 50% 5%",
    "--muted": "25 22% 18%",
    "--muted-foreground": "25 18% 65%",
    "--accent": "200 72% 62%",
    "--accent-foreground": "0 0% 100%",
    "--border": "25 22% 22%",
    "--input": "25 22% 15%",
    "--ring": "28 90% 58%",
    "--glass-bg": "25 30% 12%",
    "--glass-border": "25 22% 26%",
    "--glass-glow": "28 95% 62%",
  },
};

const TROPICAL_BURST: ThemeDefinition = {
  id: "tropical-burst",
  name: "Tropical Burst",
  description: "Vibrant jungle greens and exotic blooms",
  previewColors: ["#4ade80", "#06b6d4", "#f472b6"],
  vars: {
    "--eku-bg": "165 48% 4%",
    "--eku-bg-lighter": "165 38% 9%",
    "--eku-aurora-1": "145 75% 55%",
    "--eku-aurora-2": "190 85% 52%",
    "--eku-aurora-3": "330 70% 60%",
    "--eku-gold": "48 95% 60%",
    "--eku-sky": "190 90% 65%",
    "--eku-ink": "165 15% 96%",
    "--eku-glow": "145 80% 58%",
    "--background": "165 48% 4%",
    "--foreground": "165 15% 96%",
    "--card": "165 38% 10%",
    "--card-foreground": "165 15% 96%",
    "--popover": "165 38% 8%",
    "--popover-foreground": "165 15% 96%",
    "--primary": "145 75% 55%",
    "--primary-foreground": "165 48% 4%",
    "--secondary": "190 85% 52%",
    "--secondary-foreground": "0 0% 100%",
    "--muted": "165 20% 16%",
    "--muted-foreground": "165 15% 64%",
    "--accent": "330 70% 60%",
    "--accent-foreground": "0 0% 100%",
    "--border": "165 20% 20%",
    "--input": "165 20% 14%",
    "--ring": "145 75% 55%",
    "--glass-bg": "165 28% 11%",
    "--glass-border": "165 20% 24%",
    "--glass-glow": "145 80% 58%",
  },
};

const ROCKET_CARNIVAL: ThemeDefinition = {
  id: "rocket-carnival",
  name: "Rocket Carnival",
  description: "Fiesta fireworks and carnival lights",
  previewColors: ["#f43f5e", "#eab308", "#8b5cf6"],
  vars: {
    "--eku-bg": "350 48% 5%",
    "--eku-bg-lighter": "350 38% 10%",
    "--eku-aurora-1": "350 82% 58%",
    "--eku-aurora-2": "50 90% 55%",
    "--eku-aurora-3": "265 75% 60%",
    "--eku-gold": "50 100% 58%",
    "--eku-sky": "200 75% 65%",
    "--eku-ink": "350 15% 96%",
    "--eku-glow": "350 88% 62%",
    "--background": "350 48% 5%",
    "--foreground": "350 15% 96%",
    "--card": "350 38% 11%",
    "--card-foreground": "350 15% 96%",
    "--popover": "350 38% 9%",
    "--popover-foreground": "350 15% 96%",
    "--primary": "350 82% 58%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "50 90% 55%",
    "--secondary-foreground": "350 48% 5%",
    "--muted": "350 20% 17%",
    "--muted-foreground": "350 15% 65%",
    "--accent": "265 75% 60%",
    "--accent-foreground": "0 0% 100%",
    "--border": "350 20% 22%",
    "--input": "350 20% 15%",
    "--ring": "350 82% 58%",
    "--glass-bg": "350 28% 12%",
    "--glass-border": "350 20% 26%",
    "--glass-glow": "350 88% 62%",
  },
};

/* ══════════════════════════════════════════════════════════
   FALL GALAXY BUNDLE — Sep, Oct, Nov
   ══════════════════════════════════════════════════════════ */

const EMBER_GLOW: ThemeDefinition = {
  id: "ember-glow",
  name: "Ember Glow",
  description: "Warm embers in a cosmic fireplace",
  previewColors: ["#ea580c", "#dc2626", "#f59e0b"],
  vars: {
    "--eku-bg": "15 50% 4%",
    "--eku-bg-lighter": "15 40% 9%",
    "--eku-aurora-1": "18 88% 52%",
    "--eku-aurora-2": "0 75% 50%",
    "--eku-aurora-3": "38 90% 55%",
    "--eku-gold": "38 100% 58%",
    "--eku-sky": "200 65% 58%",
    "--eku-ink": "15 18% 96%",
    "--eku-glow": "18 92% 55%",
    "--background": "15 50% 4%",
    "--foreground": "15 18% 96%",
    "--card": "15 40% 10%",
    "--card-foreground": "15 18% 96%",
    "--popover": "15 40% 8%",
    "--popover-foreground": "15 18% 96%",
    "--primary": "18 88% 52%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "0 75% 50%",
    "--secondary-foreground": "0 0% 100%",
    "--muted": "15 22% 16%",
    "--muted-foreground": "15 18% 62%",
    "--accent": "38 90% 55%",
    "--accent-foreground": "15 50% 4%",
    "--border": "15 22% 20%",
    "--input": "15 22% 14%",
    "--ring": "18 88% 52%",
    "--glass-bg": "15 30% 11%",
    "--glass-border": "15 22% 24%",
    "--glass-glow": "18 92% 55%",
  },
};

const HARVEST_STAR: ThemeDefinition = {
  id: "harvest-star",
  name: "Harvest Star",
  description: "Golden harvest fields under starry sky",
  previewColors: ["#eab308", "#a16207", "#854d0e"],
  vars: {
    "--eku-bg": "40 48% 4%",
    "--eku-bg-lighter": "40 38% 9%",
    "--eku-aurora-1": "45 92% 55%",
    "--eku-aurora-2": "35 78% 42%",
    "--eku-aurora-3": "30 72% 38%",
    "--eku-gold": "45 100% 58%",
    "--eku-sky": "200 60% 55%",
    "--eku-ink": "40 18% 96%",
    "--eku-glow": "45 95% 58%",
    "--background": "40 48% 4%",
    "--foreground": "40 18% 96%",
    "--card": "40 38% 10%",
    "--card-foreground": "40 18% 96%",
    "--popover": "40 38% 8%",
    "--popover-foreground": "40 18% 96%",
    "--primary": "45 92% 55%",
    "--primary-foreground": "40 48% 4%",
    "--secondary": "35 78% 42%",
    "--secondary-foreground": "0 0% 100%",
    "--muted": "40 20% 16%",
    "--muted-foreground": "40 18% 62%",
    "--accent": "30 72% 38%",
    "--accent-foreground": "0 0% 100%",
    "--border": "40 20% 20%",
    "--input": "40 20% 13%",
    "--ring": "45 92% 55%",
    "--glass-bg": "40 28% 11%",
    "--glass-border": "40 20% 24%",
    "--glass-glow": "45 95% 58%",
  },
};

const MIDNIGHT_PUMPKIN: ThemeDefinition = {
  id: "midnight-pumpkin",
  name: "Midnight Pumpkin",
  description: "Halloween magic under a crescent moon",
  previewColors: ["#f97316", "#7c3aed", "#1e1b4b"],
  vars: {
    "--eku-bg": "260 55% 4%",
    "--eku-bg-lighter": "260 45% 9%",
    "--eku-aurora-1": "25 90% 55%",
    "--eku-aurora-2": "270 80% 55%",
    "--eku-aurora-3": "240 60% 20%",
    "--eku-gold": "25 95% 58%",
    "--eku-sky": "270 65% 62%",
    "--eku-ink": "260 18% 95%",
    "--eku-glow": "25 92% 58%",
    "--background": "260 55% 4%",
    "--foreground": "260 18% 95%",
    "--card": "260 45% 10%",
    "--card-foreground": "260 18% 95%",
    "--popover": "260 45% 8%",
    "--popover-foreground": "260 18% 95%",
    "--primary": "25 90% 55%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "270 80% 55%",
    "--secondary-foreground": "0 0% 100%",
    "--muted": "260 22% 15%",
    "--muted-foreground": "260 18% 60%",
    "--accent": "25 95% 58%",
    "--accent-foreground": "260 55% 4%",
    "--border": "260 22% 18%",
    "--input": "260 22% 12%",
    "--ring": "25 90% 55%",
    "--glass-bg": "260 35% 10%",
    "--glass-border": "260 22% 22%",
    "--glass-glow": "25 92% 58%",
  },
};

/* ══════════════════════════════════════════════════════════
   EXPORTS
   ══════════════════════════════════════════════════════════ */

/** All 12 seasonal theme definitions */
export const SEASONAL_THEMES: ThemeDefinition[] = [
  FROST_GLOW, CANDY_CANE_BURST, AURORA_SNOWFALL,
  BLOSSOM_SPARK, PASTEL_SKY, RAINBOW_GARDEN,
  SUNSET_SPLASH, TROPICAL_BURST, ROCKET_CARNIVAL,
  EMBER_GLOW, HARVEST_STAR, MIDNIGHT_PUMPKIN,
];

/** Bundle metadata for each season */
export const SEASONAL_BUNDLES: SeasonalBundle[] = [
  {
    season: "winter",
    label: "Winter Magic",
    emoji: "❄️",
    description: "Frosty wonder and holiday sparkle",
    themeIds: ["frost-glow", "candy-cane-burst", "aurora-snowfall"],
    particleClass: "seasonal-particles-winter",
  },
  {
    season: "spring",
    label: "Spring Bloom",
    emoji: "🌸",
    description: "Blossoms, petals, and rainbow light",
    themeIds: ["blossom-spark", "pastel-sky", "rainbow-garden"],
    particleClass: "seasonal-particles-spring",
  },
  {
    season: "summer",
    label: "Summer Adventure",
    emoji: "☀️",
    description: "Sun-soaked fun and tropical energy",
    themeIds: ["sunset-splash", "tropical-burst", "rocket-carnival"],
    particleClass: "seasonal-particles-summer",
  },
  {
    season: "fall",
    label: "Fall Galaxy",
    emoji: "🍂",
    description: "Golden harvests and ember magic",
    themeIds: ["ember-glow", "harvest-star", "midnight-pumpkin"],
    particleClass: "seasonal-particles-fall",
  },
];

/** Get the seasonal bundle a theme belongs to (if any) */
export function getSeasonForTheme(themeId: string): SeasonalBundle | undefined {
  return SEASONAL_BUNDLES.find((b) => b.themeIds.includes(themeId));
}

/** Get all seasonal theme ids as a flat set for quick lookup */
export const SEASONAL_THEME_IDS = new Set(SEASONAL_THEMES.map((t) => t.id));
