import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { getThemeById, getAllThemes, DEFAULT_THEME_ID, type ThemeDefinition } from "@/theme/themes";
import { getAnimationProfile, type AnimationProfile } from "@/theme/animationProfiles";
import { SEASONAL_THEME_IDS } from "@/theme/seasonalThemes";
import {
  getThemeMode,
  setThemeMode as persistThemeMode,
  getSeasonalDefaultThemeId,
} from "@/lib/theme/seasonalEngine";
import {
  AI_DYNAMIC_THEME_ID,
  buildDynamicTheme,
  buildDynamicAnimationProfile,
} from "@/lib/theme/dynamicThemeGenerator";
import { trackInteraction } from "@/lib/theme/aiThemeEngine";

/* ───────────────────────────────────────────────────────
   ThemeProvider — Global Theme Engine v2
   ───────────────────────────────────────────────────────
   • Core themes + Seasonal bundles + AI Dynamic mode
   • Three modes: "manual" | "auto-seasonal" | "ai-dynamic"
   • Persists active theme & mode to localStorage
   • Tracks interactions for AI intensity scaling
   • Zero layout shift: applies before first paint
   ─────────────────────────────────────────────────────── */

const STORAGE_KEY = "eku-theme";

export type ThemeMode = "manual" | "auto-seasonal" | "ai-dynamic";

interface ThemeContextValue {
  /** Currently active theme definition */
  theme: ThemeDefinition;
  /** Active animation profile for the current theme */
  animationProfile: AnimationProfile;
  /** All available static themes (core + seasonal) */
  themes: ThemeDefinition[];
  /** Switch to a different theme by id (auto-sets mode to manual) */
  setTheme: (id: string) => void;
  /** Current theme selection mode */
  themeMode: ThemeMode;
  /** Switch theme mode */
  setThemeMode: (mode: ThemeMode) => void;
  /** Whether the current theme is seasonal */
  isSeasonalTheme: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Apply a theme's CSS variables to the document root.
 */
function applyThemeToDOM(theme: ThemeDefinition) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme.id);
  for (const [prop, value] of Object.entries(theme.vars)) {
    root.style.setProperty(prop, value);
  }
}

/** Read persisted theme mode (extended to include ai-dynamic) */
function getPersistedMode(): ThemeMode {
  try {
    const stored = localStorage.getItem("eku-theme-mode");
    if (stored === "auto-seasonal" || stored === "ai-dynamic") return stored;
  } catch { /* blocked */ }
  return "manual";
}

function persistMode(mode: ThemeMode) {
  try {
    localStorage.setItem("eku-theme-mode", mode);
  } catch { /* blocked */ }
  // Also sync to seasonalEngine's persister for backward compat
  if (mode === "auto-seasonal" || mode === "manual") {
    persistThemeMode(mode);
  }
}

/**
 * Read persisted theme id from localStorage.
 * Falls back to seasonal default or DEFAULT_THEME_ID.
 */
function getPersistedThemeId(): string {
  const mode = getPersistedMode();
  if (mode === "auto-seasonal") return getSeasonalDefaultThemeId();
  if (mode === "ai-dynamic") return AI_DYNAMIC_THEME_ID;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && getThemeById(stored)) return stored;
  } catch { /* blocked */ }
  return DEFAULT_THEME_ID;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<string>(getPersistedThemeId);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getPersistedMode);
  const aiRefreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAiDynamic = themeMode === "ai-dynamic";

  const theme = useMemo(() => {
    if (isAiDynamic) return buildDynamicTheme();
    return getThemeById(themeId) ?? getThemeById(DEFAULT_THEME_ID)!;
  }, [themeId, isAiDynamic]);

  const animationProfile = useMemo(() => {
    if (isAiDynamic) return buildDynamicAnimationProfile();
    return getAnimationProfile(themeId);
  }, [themeId, isAiDynamic]);

  const themes = useMemo(() => getAllThemes(), []);

  const isSeasonalTheme = useMemo(
    () => SEASONAL_THEME_IDS.has(theme.id),
    [theme.id],
  );

  // Apply theme to DOM whenever it changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  // AI dynamic mode: refresh palette every 60s to catch time-of-day changes
  useEffect(() => {
    if (isAiDynamic) {
      const refresh = () => {
        const t = buildDynamicTheme();
        applyThemeToDOM(t);
      };
      aiRefreshTimer.current = setInterval(refresh, 60_000);
      return () => {
        if (aiRefreshTimer.current) clearInterval(aiRefreshTimer.current);
      };
    }
    return () => {
      if (aiRefreshTimer.current) clearInterval(aiRefreshTimer.current);
    };
  }, [isAiDynamic]);

  // Track user clicks for AI interaction intensity
  useEffect(() => {
    if (!isAiDynamic) return;
    const handler = () => {
      trackInteraction();
    };
    document.addEventListener("click", handler, { passive: true });
    return () => document.removeEventListener("click", handler);
  }, [isAiDynamic]);

  const setTheme = useCallback((id: string) => {
    const t = getThemeById(id);
    if (!t) return;
    setThemeId(id);
    setThemeModeState("manual");
    persistMode("manual");
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* */ }
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    persistMode(mode);
    if (mode === "auto-seasonal") {
      const id = getSeasonalDefaultThemeId();
      setThemeId(id);
      try { localStorage.setItem(STORAGE_KEY, id); } catch { /* */ }
    } else if (mode === "ai-dynamic") {
      setThemeId(AI_DYNAMIC_THEME_ID);
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      animationProfile,
      themes,
      setTheme,
      themeMode,
      setThemeMode,
      isSeasonalTheme,
    }),
    [theme, animationProfile, themes, setTheme, themeMode, setThemeMode, isSeasonalTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access the global theme engine.
 * Must be used within a ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
