/**
 * Seasonal Engine — Auto-detects the current season and provides
 * the default seasonal theme when the user hasn't manually selected one.
 *
 * Season mapping:
 *   Dec–Feb → Winter
 *   Mar–May → Spring
 *   Jun–Aug → Summer
 *   Sep–Nov → Fall
 */

import type { Season } from "@/theme/seasonalThemes";
import { SEASONAL_BUNDLES } from "@/theme/seasonalThemes";

const STORAGE_KEY_MODE = "eku-theme-mode"; // "manual" | "auto-seasonal"

/** Detect current season from system date */
export function detectCurrentSeason(): Season {
  const month = new Date().getMonth(); // 0-indexed
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter"; // Nov(11), Dec(11 falls through), Jan(0), Feb(1)
}

/** Get the default theme id for the current season */
export function getSeasonalDefaultThemeId(): string {
  const season = detectCurrentSeason();
  const bundle = SEASONAL_BUNDLES.find((b) => b.season === season);
  return bundle?.themeIds[0] ?? "cinematic-prime";
}

/** Get the seasonal bundle for the current season */
export function getCurrentSeasonBundle() {
  const season = detectCurrentSeason();
  return SEASONAL_BUNDLES.find((b) => b.season === season)!;
}

/** Check if user is in auto-seasonal mode */
export function isAutoSeasonalMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_MODE) === "auto-seasonal";
  } catch {
    return false;
  }
}

/** Set theme selection mode */
export function setThemeMode(mode: "manual" | "auto-seasonal"): void {
  try {
    localStorage.setItem(STORAGE_KEY_MODE, mode);
  } catch {
    // silently fail
  }
}

/** Get current theme mode (defaults to "manual") */
export function getThemeMode(): "manual" | "auto-seasonal" {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_MODE);
    if (stored === "auto-seasonal") return "auto-seasonal";
  } catch {
    // fall through
  }
  return "manual";
}

/** Get the particle overlay CSS class for the current season */
export function getSeasonalParticleClass(): string {
  const bundle = getCurrentSeasonBundle();
  return bundle.particleClass;
}
