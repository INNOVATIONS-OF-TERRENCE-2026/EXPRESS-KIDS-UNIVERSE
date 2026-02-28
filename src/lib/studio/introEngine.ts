/**
 * introEngine.ts — Dynamic Studio Intro System
 *
 * Manages intro state, timing, theme selection and variation for the
 * full-screen cinematic intro sequence.
 *
 * Supports configurable themes:
 *   - default (cosmic aurora)
 *   - space (deep blue nebula)
 *   - magic (purple enchantment)
 *   - music (golden warmth)
 *
 * Theme selection can be driven by:
 *   1. Explicit override
 *   2. Child profile favorite theme
 *   3. Random selection
 */

export type IntroTheme = "default" | "space" | "magic" | "music";

export interface IntroThemeColors {
  inner: string;
  outer: string;
  glow: string;
}

const THEME_COLORS: Record<IntroTheme, IntroThemeColors> = {
  default: {
    inner: "rgba(40, 20, 80, 0.6)",
    outer: "rgba(13, 10, 46, 0.95)",
    glow: "rgba(168, 85, 247, 0.5)",
  },
  space: {
    inner: "rgba(10, 30, 80, 0.6)",
    outer: "rgba(5, 8, 30, 0.95)",
    glow: "rgba(6, 182, 212, 0.5)",
  },
  magic: {
    inner: "rgba(60, 10, 80, 0.6)",
    outer: "rgba(20, 5, 40, 0.95)",
    glow: "rgba(192, 38, 211, 0.5)",
  },
  music: {
    inner: "rgba(50, 40, 10, 0.6)",
    outer: "rgba(20, 15, 5, 0.95)",
    glow: "rgba(245, 158, 11, 0.5)",
  },
};

/** Map child profile themes to intro themes */
const PROFILE_THEME_MAP: Record<string, IntroTheme> = {
  "Space Quest": "space",
  "Magic Forest": "magic",
  "Ocean Voyage": "space",
  "Super Builders": "default",
  "Dino Discovery": "default",
};

const SESSION_KEY = "eku_intro_seen";
const THEME_KEY = "eku_intro_theme";

class IntroEngine {
  /** Has the intro already been shown this session? */
  hasPlayed(): boolean {
    return sessionStorage.getItem(SESSION_KEY) === "true";
  }

  /** Mark intro as completed */
  markPlayed(): void {
    sessionStorage.setItem(SESSION_KEY, "true");
  }

  /** Reset for testing */
  reset(): void {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(THEME_KEY);
  }

  /** Select a theme based on available context */
  selectTheme(childTheme?: string): IntroTheme {
    // Stored override from previous selection
    const stored = sessionStorage.getItem(THEME_KEY) as IntroTheme | null;
    if (stored && THEME_COLORS[stored]) return stored;

    // Map from child profile theme
    if (childTheme && PROFILE_THEME_MAP[childTheme]) {
      const mapped = PROFILE_THEME_MAP[childTheme];
      sessionStorage.setItem(THEME_KEY, mapped);
      return mapped;
    }

    // Random selection
    const themes: IntroTheme[] = ["default", "space", "magic", "music"];
    const picked = themes[Math.floor(Math.random() * themes.length)];
    sessionStorage.setItem(THEME_KEY, picked);
    return picked;
  }

  /** Get colors for a given theme */
  getThemeColors(theme: IntroTheme): IntroThemeColors {
    return THEME_COLORS[theme] ?? THEME_COLORS.default;
  }

  /** Pre-story sting timing (5 seconds for branded intro before story/episode playback) */
  getStingDuration(): number {
    return 5000;
  }

  /** Main intro duration */
  getIntroDuration(): number {
    return 4000;
  }
}

export const introEngine = new IntroEngine();
