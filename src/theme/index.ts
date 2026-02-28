/**
 * Theme Engine — barrel export
 */
export { default as THEMES, getAllThemes, getCoreThemes, getThemeById, DEFAULT_THEME_ID } from "./themes";
export type { ThemeDefinition } from "./themes";

export { default as ANIMATION_PROFILES, getAnimationProfile, DEFAULT_ANIMATION_PROFILE } from "./animationProfiles";
export type { AnimationProfile } from "./animationProfiles";

/* ── Seasonal Themes ── */
export { SEASONAL_THEMES, SEASONAL_BUNDLES, SEASONAL_THEME_IDS, getSeasonForTheme } from "./seasonalThemes";
export type { Season, SeasonalBundle } from "./seasonalThemes";

/* ── AI Dynamic Theme ── */
export { AI_DYNAMIC_THEME_ID, buildDynamicTheme, buildDynamicAnimationProfile } from "@/lib/theme/dynamicThemeGenerator";

/* ── Seasonal Engine ── */
export {
  detectCurrentSeason,
  getSeasonalDefaultThemeId,
  getCurrentSeasonBundle,
  isAutoSeasonalMode,
  setThemeMode,
  getThemeMode,
  getSeasonalParticleClass,
} from "@/lib/theme/seasonalEngine";
