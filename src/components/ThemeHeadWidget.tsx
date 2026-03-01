/**
 * ThemeHeadWidget.tsx — Floating transparent theme selector widget.
 *
 * Replaces the full ThemeModal in the nav with a lightweight floating panel:
 *   - Fixed top-right (desktop) or bottom-sheet (mobile)
 *   - Transparent glass background (backdrop-blur)
 *   - X close button
 *   - Auto-close after theme selection (300ms delay)
 *   - ESC / click-outside closes
 *   - GPU-only animations (transform + opacity)
 *   - No layout shifts, no nav height changes
 *   - No body scroll lock (desktop); safe lock on mobile only
 */

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
} from "react";
import { Check, X, Sparkles, Leaf, Snowflake, Flower2, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "@/context/ThemeProvider";
import { getCoreThemes } from "@/theme/themes";
import { SEASONAL_BUNDLES, type SeasonalBundle } from "@/theme/seasonalThemes";

/* ── Season icon mapping ── */
const SEASON_ICONS: Record<string, React.ReactNode> = {
  winter: <Snowflake className="w-3.5 h-3.5" />,
  spring: <Flower2 className="w-3.5 h-3.5" />,
  summer: <Sun className="w-3.5 h-3.5" />,
  fall: <Leaf className="w-3.5 h-3.5" />,
};

interface ThemeHeadWidgetProps {
  open: boolean;
  onClose: () => void;
}

/* ── Mini theme swatch ── */
const ThemeSwatch = memo(function ThemeSwatch({
  id,
  name,
  previewColors,
  isActive,
  onClick,
}: {
  id: string;
  name: string;
  previewColors: [string, string, string];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center rounded-xl p-2 transition-colors duration-150
        outline-none focus-visible:ring-2 focus-visible:ring-primary/60
        ${isActive ? "ring-2 ring-primary/50 bg-primary/10" : "hover:bg-foreground/5"}
      `}
      aria-pressed={isActive}
      aria-label={`${name} theme${isActive ? " (active)" : ""}`}
    >
      <div
        className="w-full aspect-[4/3] rounded-lg ring-1 ring-white/10"
        style={{
          background: `linear-gradient(135deg, ${previewColors[0]}, ${previewColors[1]}, ${previewColors[2]})`,
        }}
      />
      <p className={`mt-1.5 text-[10px] font-medium text-center leading-tight truncate w-full ${isActive ? "text-primary" : "text-foreground/80"}`}>
        {name}
      </p>
      {isActive && (
        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-primary-foreground" />
        </div>
      )}
    </button>
  );
});

/* ── Mode toggle (compact) ── */
function ModeToggle({
  icon,
  label,
  isActive,
  gradient,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left
        transition-colors duration-150 outline-none
        focus-visible:ring-2 focus-visible:ring-primary/60
        ${isActive ? "ring-1 ring-primary/50 bg-primary/10" : "hover:bg-foreground/5"}
      `}
      aria-pressed={isActive}
    >
      <div className={`w-8 h-8 rounded-lg shrink-0 ring-1 ring-white/10 flex items-center justify-center ${gradient}`}>
        {icon}
      </div>
      <span className={`text-xs font-semibold flex-1 truncate ${isActive ? "text-primary" : "text-foreground/80"}`}>
        {label}
      </span>
      {isActive && (
        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Check className="w-2.5 h-2.5 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN WIDGET
   ══════════════════════════════════════════════════════════ */
export const ThemeHeadWidget = memo(function ThemeHeadWidget({ open, onClose }: ThemeHeadWidgetProps) {
  const { theme: activeTheme, themes, setTheme, themeMode, setThemeMode } = useTheme();
  const widgetRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const coreThemes = useMemo(() => getCoreThemes(), []);
  const themeMap = useMemo(() => new Map(themes.map((t) => [t.id, t])), [themes]);

  const isAiActive = themeMode === "ai-dynamic";
  const isAutoSeasonal = themeMode === "auto-seasonal";

  /* ── Animated close ── */
  const animatedClose = useCallback(() => {
    setClosing(true);
    // Wait for exit animation
    closeTimerRef.current = setTimeout(() => {
      setClosing(false);
      onClose();
    }, 220);
  }, [onClose]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  /* ── ESC key ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") animatedClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, animatedClose]);

  /* ── Auto-close after selection ── */
  const handleThemeSelect = useCallback(
    (id: string) => {
      setTheme(id);
      setTimeout(() => animatedClose(), 300);
    },
    [setTheme, animatedClose],
  );

  const handleModeToggle = useCallback(
    (mode: ThemeMode) => {
      setThemeMode(mode);
      setTimeout(() => animatedClose(), 300);
    },
    [setThemeMode, animatedClose],
  );

  if (!open) return null;

  return (
    <>
      {/* Click-outside overlay (transparent, no blur) */}
      <div
        className="theme-head-overlay"
        onClick={animatedClose}
        aria-hidden="true"
      />

      {/* Widget panel */}
      <div
        ref={widgetRef}
        className={`theme-head-widget ${closing ? "theme-head-closing" : ""}`}
        role="dialog"
        aria-modal="false"
        aria-label="Theme selector"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="font-heading font-bold text-sm text-foreground">
            Themes
          </h3>
          <button
            onClick={animatedClose}
            className="p-1.5 rounded-full hover:bg-foreground/10 transition-colors focus-visible:ring-2 focus-visible:ring-primary/60 outline-none"
            aria-label="Close theme selector"
          >
            <X className="w-4 h-4 text-foreground/60" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="theme-head-scroll px-4 pb-4">
          {/* Mode toggles */}
          <ModeToggle
            icon={<Sparkles className="w-4 h-4 text-white" />}
            label="✨ Adaptive Magic"
            isActive={isAiActive}
            gradient="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400"
            onClick={() => handleModeToggle(isAiActive ? "manual" : "ai-dynamic")}
          />
          <div className="mt-1.5">
            <ModeToggle
              icon={<Leaf className="w-3.5 h-3.5 text-white" />}
              label="🌍 Auto-Seasonal"
              isActive={isAutoSeasonal}
              gradient="bg-gradient-to-br from-cyan-400 via-emerald-400 to-amber-400"
              onClick={() => handleModeToggle(isAutoSeasonal ? "manual" : "auto-seasonal")}
            />
          </div>

          {/* Seasonal */}
          <div className="mt-3 mb-2 flex items-center gap-1.5 px-0.5">
            <Snowflake className="w-3 h-3 text-primary/60" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Seasonal</span>
          </div>
          {SEASONAL_BUNDLES.map((bundle) => (
            <div key={bundle.season} className="mb-2">
              <div className="flex items-center gap-1 mb-1 px-0.5">
                {SEASON_ICONS[bundle.season]}
                <span className="text-[10px] font-semibold text-foreground/50">
                  {bundle.emoji} {bundle.label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {bundle.themeIds.map((id) => {
                  const t = themeMap.get(id);
                  if (!t) return null;
                  return (
                    <ThemeSwatch
                      key={id}
                      id={id}
                      name={t.name}
                      previewColors={t.previewColors}
                      isActive={activeTheme.id === id}
                      onClick={() => handleThemeSelect(id)}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Core */}
          <div className="mt-3 mb-2 flex items-center gap-1.5 px-0.5">
            <Sparkles className="w-3 h-3 text-primary/60" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Core</span>
            <span className="ml-auto text-[9px] text-muted-foreground">{coreThemes.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {coreThemes.map((t) => (
              <ThemeSwatch
                key={t.id}
                id={t.id}
                name={t.name}
                previewColors={t.previewColors}
                isActive={activeTheme.id === t.id}
                onClick={() => handleThemeSelect(t.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
});
