import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { getThemeById, getAllThemes, DEFAULT_THEME_ID, type ThemeDefinition } from "@/theme/themes";
import { getAnimationProfile, type AnimationProfile } from "@/theme/animationProfiles";

/* ───────────────────────────────────────────────────────
   ThemeProvider — Global Theme Engine
   ───────────────────────────────────────────────────────
   • Applies CSS variables to <html> via data-theme + inline style
   • Persists active theme to localStorage
   • Exposes theme + animation profile via context
   • Zero layout shift: applies before first paint via init script
   ─────────────────────────────────────────────────────── */

const STORAGE_KEY = "eku-theme";

interface ThemeContextValue {
  /** Currently active theme definition */
  theme: ThemeDefinition;
  /** Active animation profile for the current theme */
  animationProfile: AnimationProfile;
  /** All available themes */
  themes: ThemeDefinition[];
  /** Switch to a different theme by id */
  setTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Apply a theme's CSS variables to the document root.
 * This both sets the data-theme attribute AND writes every
 * CSS variable as an inline style so the theme is active
 * without requiring a matching :root[data-theme="..."] block in CSS.
 */
function applyThemeToDOM(theme: ThemeDefinition) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme.id);

  // Write all CSS variable overrides as inline styles
  for (const [prop, value] of Object.entries(theme.vars)) {
    root.style.setProperty(prop, value);
  }
}

/**
 * Read persisted theme id from localStorage.
 * Falls back to DEFAULT_THEME_ID if nothing stored or id is invalid.
 */
function getPersistedThemeId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && getThemeById(stored)) return stored;
  } catch {
    // localStorage blocked — fall through
  }
  return DEFAULT_THEME_ID;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<string>(getPersistedThemeId);

  const theme = useMemo(
    () => getThemeById(themeId) ?? getThemeById(DEFAULT_THEME_ID)!,
    [themeId]
  );

  const animationProfile = useMemo(
    () => getAnimationProfile(themeId),
    [themeId]
  );

  const themes = useMemo(() => getAllThemes(), []);

  // Apply theme to DOM whenever it changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const setTheme = useCallback((id: string) => {
    const t = getThemeById(id);
    if (!t) return;
    setThemeId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Silently fail if storage is blocked
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, animationProfile, themes, setTheme }),
    [theme, animationProfile, themes, setTheme]
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
