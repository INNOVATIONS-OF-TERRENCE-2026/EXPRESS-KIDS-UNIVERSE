/**
 * Theme Engine — barrel export
 */
export { default as THEMES, getAllThemes, getThemeById, DEFAULT_THEME_ID } from "./themes";
export type { ThemeDefinition } from "./themes";

export { default as ANIMATION_PROFILES, getAnimationProfile, DEFAULT_ANIMATION_PROFILE } from "./animationProfiles";
export type { AnimationProfile } from "./animationProfiles";
