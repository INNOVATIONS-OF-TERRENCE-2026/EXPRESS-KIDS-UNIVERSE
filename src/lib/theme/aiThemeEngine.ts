/**
 * AI Theme Engine — Adaptive Magic Mode
 *
 * Generates dynamic theme palettes based on:
 *  • Time of day (morning/afternoon/evening/night)
 *  • User interaction intensity (click tracking)
 *  • Child profile favorite colors (if available)
 *
 * Uses deterministic HSL generation — no external API calls.
 * All computation is throttled and runs off the main thread priority.
 */

import { loadDraft } from "@/lib/storage";

/* ── Time of day detection ── */

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

/** Base hue ranges per time of day — warm mornings, cool nights */
const TIME_HUE_BASE: Record<TimeOfDay, number> = {
  morning: 40,    // warm gold
  afternoon: 180, // teal / sky
  evening: 280,   // purple / magenta
  night: 240,     // deep indigo
};

const TIME_SATURATION: Record<TimeOfDay, number> = {
  morning: 70,
  afternoon: 80,
  evening: 85,
  night: 75,
};

const TIME_LIGHTNESS_BG: Record<TimeOfDay, number> = {
  morning: 7,
  afternoon: 6,
  evening: 5,
  night: 4,
};

/* ── Interaction tracking ── */

let _clickCount = 0;
let _lastReset = Date.now();
const RESET_INTERVAL = 60_000; // reset per minute

export function trackInteraction(): void {
  const now = Date.now();
  if (now - _lastReset > RESET_INTERVAL) {
    _clickCount = 0;
    _lastReset = now;
  }
  _clickCount++;
}

/** Returns 0–1 representing interaction intensity */
function getInteractionIntensity(): number {
  return Math.min(_clickCount / 30, 1);
}

/* ── Favorite color bias ── */

/** Map common color names to hue offsets */
const COLOR_HUE_MAP: Record<string, number> = {
  red: 0, crimson: 348, scarlet: 4,
  orange: 25, coral: 16,
  yellow: 50, gold: 45, lemon: 55,
  green: 130, lime: 95, emerald: 155, mint: 165,
  teal: 175, cyan: 185, aqua: 190,
  blue: 220, sky: 200, navy: 240, indigo: 245,
  purple: 270, violet: 280, lavender: 260,
  pink: 330, magenta: 300, rose: 340,
  rainbow: -1, // special: ignore bias
};

function getFavoriteColorHue(): number | null {
  try {
    const draft = loadDraft();
    if (!draft?.favorites?.length) return null;
    for (const fav of draft.favorites) {
      const lower = fav.toLowerCase();
      for (const [name, hue] of Object.entries(COLOR_HUE_MAP)) {
        if (lower.includes(name) && hue !== -1) return hue;
      }
    }
  } catch {
    // no profile / blocked
  }
  return null;
}

/* ── Dynamic palette generation ── */

export interface DynamicPalette {
  vars: Record<string, string>;
  animationIntensity: number;
  gradientAngle: number;
  particleColor: string;
}

/**
 * Generate a complete CSS variable palette for AI Dynamic mode.
 * Deterministic per time-of-day + favorite color + interaction rate.
 * No randomness that would cause flicker — only changes on trigger.
 */
export function generateDynamicPalette(): DynamicPalette {
  const tod = getTimeOfDay();
  const baseHue = TIME_HUE_BASE[tod];
  const baseSat = TIME_SATURATION[tod];
  const bgLight = TIME_LIGHTNESS_BG[tod];
  const intensity = getInteractionIntensity();

  // Bias toward favorite color if available
  const favHue = getFavoriteColorHue();
  const primaryHue = favHue !== null
    ? lerpAngle(baseHue, favHue, 0.45)
    : baseHue;

  // Complementary and analogous hues
  const secondaryHue = (primaryHue + 150) % 360;
  const accentHue = (primaryHue + 60) % 360;
  const auroraHue1 = primaryHue;
  const auroraHue2 = secondaryHue;
  const auroraHue3 = (primaryHue + 210) % 360;

  // Glow boost from interaction
  const glowSat = Math.round(baseSat + intensity * 15);
  const glowLight = Math.round(60 + intensity * 10);

  const gradientAngle = Math.round(110 + (primaryHue % 70));

  const vars: Record<string, string> = {
    "--eku-bg": `${primaryHue} 50% ${bgLight}%`,
    "--eku-bg-lighter": `${primaryHue} 40% ${bgLight + 5}%`,
    "--eku-aurora-1": `${auroraHue1} ${baseSat}% 60%`,
    "--eku-aurora-2": `${auroraHue2} ${baseSat}% 52%`,
    "--eku-aurora-3": `${auroraHue3} ${Math.round(baseSat * 0.85)}% 55%`,
    "--eku-gold": `45 95% 60%`,
    "--eku-sky": `${Math.round((primaryHue + 160) % 360)} 85% 68%`,
    "--eku-ink": `${primaryHue} 18% 96%`,
    "--eku-glow": `${primaryHue} ${glowSat}% ${glowLight}%`,
    "--background": `${primaryHue} 50% ${bgLight}%`,
    "--foreground": `${primaryHue} 18% 96%`,
    "--card": `${primaryHue} 40% ${bgLight + 6}%`,
    "--card-foreground": `${primaryHue} 18% 96%`,
    "--popover": `${primaryHue} 40% ${bgLight + 4}%`,
    "--popover-foreground": `${primaryHue} 18% 96%`,
    "--primary": `${primaryHue} ${baseSat}% 60%`,
    "--primary-foreground": `${primaryHue} 18% 98%`,
    "--secondary": `${secondaryHue} ${Math.round(baseSat * 0.9)}% 55%`,
    "--secondary-foreground": `0 0% 100%`,
    "--muted": `${primaryHue} 25% 18%`,
    "--muted-foreground": `${primaryHue} 18% 66%`,
    "--accent": `${accentHue} ${Math.round(baseSat * 0.85)}% 58%`,
    "--accent-foreground": `0 0% 100%`,
    "--border": `${primaryHue} 25% 22%`,
    "--input": `${primaryHue} 25% 16%`,
    "--ring": `${primaryHue} ${baseSat}% 60%`,
    "--glass-bg": `${primaryHue} 32% 12%`,
    "--glass-border": `${primaryHue} 25% 26%`,
    "--glass-glow": `${primaryHue} ${glowSat}% ${glowLight}%`,
  };

  return {
    vars,
    animationIntensity: 0.8 + intensity * 0.5,
    gradientAngle,
    particleColor: `hsl(${primaryHue}, ${baseSat}%, 65%)`,
  };
}

/** Lerp between two angles on a 360° wheel */
function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return ((a + diff * t) % 360 + 360) % 360;
}
