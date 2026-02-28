/**
 * Dynamic Theme Generator — Builds a ThemeDefinition on the fly
 * for the AI Dynamic ("Adaptive Magic") mode.
 *
 * Uses the aiThemeEngine's palette generator and wraps it in
 * the standard ThemeDefinition interface so the ThemeProvider
 * can apply it like any other theme.
 */

import type { ThemeDefinition } from "@/theme/themes";
import type { AnimationProfile } from "@/theme/animationProfiles";
import { DEFAULT_ANIMATION_PROFILE } from "@/theme/animationProfiles";
import { generateDynamicPalette, type DynamicPalette } from "./aiThemeEngine";

export const AI_DYNAMIC_THEME_ID = "ai-dynamic";

/** Generate a full ThemeDefinition for the current AI dynamic state */
export function buildDynamicTheme(): ThemeDefinition {
  const palette = generateDynamicPalette();

  return {
    id: AI_DYNAMIC_THEME_ID,
    name: "✨ Adaptive Magic",
    description: "AI-generated theme that adapts to you",
    previewColors: [
      paletteToHex(palette, "--primary"),
      paletteToHex(palette, "--secondary"),
      paletteToHex(palette, "--accent"),
    ],
    vars: palette.vars,
  };
}

/** Generate an animation profile for the dynamic palette */
export function buildDynamicAnimationProfile(palette?: DynamicPalette): AnimationProfile {
  const p = palette ?? generateDynamicPalette();
  const i = p.animationIntensity;

  return {
    themeId: AI_DYNAMIC_THEME_ID,
    label: "Adaptive Magic Flow",
    particleDensity: 0.8 + i * 0.5,
    particleSpeed: 0.5 + i * 0.4,
    particleColor: p.particleColor,
    glowIntensity: 0.8 + i * 0.6,
    glowPulseSpeed: 3.5 - i * 1.0,
    hoverScale: 1.04 + i * 0.04,
    hoverDuration: Math.round(350 - i * 100),
    shimmerSpeed: 3.0 - i * 0.8,
    shimmerOpacity: 0.08 + i * 0.06,
    gradientSpeed: Math.round(10 - i * 3),
    gradientAngle: p.gradientAngle,
    entranceDuration: 0.6,
    entranceEase: "cubic-bezier(0.22, 1, 0.36, 1)",
    floatAmplitude: Math.round(8 + i * 4),
    floatDuration: 7 - i * 1.5,
  };
}

/** Quick helper to extract a pseudo-hex from an HSL variable string for preview */
function paletteToHex(palette: DynamicPalette, varName: string): string {
  const hsl = palette.vars[varName];
  if (!hsl) return "#a855f7";
  const parts = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!parts) return "#a855f7";
  const [, h, s, l] = parts.map(Number);
  return hslToHex(h, s, l);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Re-export palette generation for direct use */
export { generateDynamicPalette } from "./aiThemeEngine";
export { DEFAULT_ANIMATION_PROFILE };
