import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Check, X, Sparkles, Leaf, Wand2, Snowflake, Flower2, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "@/context/ThemeProvider";
import { getCoreThemes } from "@/theme/themes";
import { SEASONAL_BUNDLES, type SeasonalBundle } from "@/theme/seasonalThemes";

/**
 * ThemeModal — Full-viewport, accessible bottom-sheet theme selector.
 *
 * Architecture:
 *  - Fixed overlay + bottom sheet (mobile) / centered modal (desktop)
 *  - GPU animated: transform + opacity only (will-change declared)
 *  - Focus trap inside modal
 *  - ESC / overlay click closes
 *  - Arrow key grid navigation
 *  - iOS safe-area-inset-bottom respected
 *  - Reduced motion: instant transitions
 *  - No layout shifts, no nav height changes
 *
 * Sections:
 *  1. AI Dynamic "Adaptive Magic" toggle
 *  2. Auto-Seasonal toggle
 *  3. Seasonal Bundles (4 seasons × 3 themes, 2–4 col grid)
 *  4. Core Themes (10 cinematic, 2–4 col grid)
 */

/* ── Season icon mapping ── */
const SEASON_ICONS: Record<string, React.ReactNode> = {
  winter: <Snowflake className="w-4 h-4" />,
  spring: <Flower2 className="w-4 h-4" />,
  summer: <Sun className="w-4 h-4" />,
  fall: <Leaf className="w-4 h-4" />,
};

/* ── Types ── */
interface ThemeModalProps {
  open: boolean;
  onClose: () => void;
}

/* ══════════════════════════════════════════════════════════
   THEME GRID CARD
   ══════════════════════════════════════════════════════════ */
const ThemeGridCard = memo(function ThemeGridCard({
  id,
  name,
  description,
  previewColors,
  isActive,
  staggerIdx,
  onClick,
}: {
  id: string;
  name: string;
  description: string;
  previewColors: [string, string, string];
  isActive: boolean;
  staggerIdx: number;
  onClick: () => void;
}) {
  return (
    <button
      data-theme-card={id}
      onClick={onClick}
      className={`
        theme-modal-card group relative flex flex-col items-center
        rounded-[20px] p-3 transition-colors duration-200 outline-none
        focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2
        focus-visible:ring-offset-[hsl(var(--eku-bg))]
        ${isActive
          ? "ring-2 ring-primary/60 bg-primary/10"
          : "hover:bg-foreground/5 active:bg-foreground/8"
        }
      `}
      style={{ animationDelay: `${staggerIdx * 20}ms` }}
      aria-pressed={isActive}
      aria-label={`${name} theme${isActive ? " (active)" : ""}`}
      tabIndex={0}
    >
      {/* Gradient swatch */}
      <div
        className="w-full aspect-[4/3] rounded-2xl ring-1 ring-white/10 group-hover:shadow-[0_0_20px_rgba(var(--eku-glow-rgb,160,120,255),0.25)] transition-shadow duration-300"
        style={{
          background: `linear-gradient(135deg, ${previewColors[0]}, ${previewColors[1]}, ${previewColors[2]})`,
        }}
      />

      {/* Label */}
      <p className={`mt-2 text-xs font-semibold text-center leading-tight truncate w-full ${isActive ? "text-primary" : "text-foreground"}`}>
        {name}
      </p>
      <p className="text-[10px] text-muted-foreground text-center leading-tight truncate w-full mt-0.5">
        {description}
      </p>

      {/* Active badge */}
      {isActive && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
    </button>
  );
});

/* ══════════════════════════════════════════════════════════
   MODE TOGGLE CARD
   ══════════════════════════════════════════════════════════ */
function ModeToggleCard({
  icon,
  label,
  description,
  isActive,
  gradient,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  isActive: boolean;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        theme-modal-card w-full flex items-center gap-3 p-3 rounded-2xl
        text-left transition-colors duration-200 outline-none
        focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2
        focus-visible:ring-offset-[hsl(var(--eku-bg))]
        ${isActive ? "ring-2 ring-primary/60 bg-primary/10" : "hover:bg-foreground/5"}
      `}
      aria-pressed={isActive}
      tabIndex={0}
    >
      <div className={`w-10 h-10 rounded-xl shrink-0 ring-1 ring-white/10 flex items-center justify-center ${gradient}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isActive ? "text-primary" : "text-foreground"}`}>
          {label}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">{description}</p>
      </div>
      {isActive && (
        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   SECTION HEADER
   ══════════════════════════════════════════════════════════ */
function SectionLabel({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mt-6 mb-3 px-1">
      <span className="text-primary/70">{icon}</span>
      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/80">{title}</h3>
      {typeof count === "number" && (
        <span className="ml-auto text-[10px] font-medium text-muted-foreground">{count}</span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SEASONAL BUNDLE SECTION
   ══════════════════════════════════════════════════════════ */
function SeasonalBundle({
  bundle,
  activeThemeId,
  themeMap,
  globalOffset,
  onSelect,
}: {
  bundle: SeasonalBundle;
  activeThemeId: string;
  themeMap: Map<string, { id: string; name: string; description: string; previewColors: [string, string, string] }>;
  globalOffset: number;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2 px-1">
        {SEASON_ICONS[bundle.season]}
        <span className="text-[11px] font-semibold text-foreground/70">
          {bundle.emoji} {bundle.label}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {bundle.themeIds.map((id, i) => {
          const t = themeMap.get(id);
          if (!t) return null;
          return (
            <ThemeGridCard
              key={id}
              id={id}
              name={t.name}
              description={t.description}
              previewColors={t.previewColors}
              isActive={activeThemeId === id}
              staggerIdx={globalOffset + i}
              onClick={() => onSelect(id)}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN MODAL
   ══════════════════════════════════════════════════════════ */
export const ThemeModal = memo(function ThemeModal({ open, onClose }: ThemeModalProps) {
  const { theme: activeTheme, themes, setTheme, themeMode, setThemeMode } = useTheme();
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const coreThemes = useMemo(() => getCoreThemes(), []);
  const themeMap = useMemo(() => new Map(themes.map((t) => [t.id, t])), [themes]);

  const isAiActive = themeMode === "ai-dynamic";
  const isAutoSeasonal = themeMode === "auto-seasonal";

  /* ── Focus trap ── */
  useEffect(() => {
    if (!open) return;

    // Store the element that had focus before modal opened
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the close button on open
    requestAnimationFrame(() => {
      closeRef.current?.focus();
    });

    return () => {
      // Restore focus on close
      previousFocusRef.current?.focus();
    };
  }, [open]);

  /* ── Keyboard handling ── */
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }

      // Focus trap: Tab / Shift+Tab
      if (e.key === "Tab") {
        const sheet = sheetRef.current;
        if (!sheet) return;

        const focusable = sheet.querySelectorAll<HTMLElement>(
          'button, [tabindex="0"], a[href], input, select, textarea'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }

      // Arrow key grid navigation
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        const sheet = sheetRef.current;
        if (!sheet) return;

        const cards = Array.from(sheet.querySelectorAll<HTMLElement>("[data-theme-card]"));
        const idx = cards.indexOf(document.activeElement as HTMLElement);
        if (idx < 0) return;

        e.preventDefault();

        // Compute columns from grid layout
        const firstRect = cards[0]?.getBoundingClientRect();
        const secondRect = cards[1]?.getBoundingClientRect();
        const cols = firstRect && secondRect && Math.abs(firstRect.top - secondRect.top) < 2
          ? Math.round(sheet.clientWidth / firstRect.width)
          : 2;

        let next = idx;
        switch (e.key) {
          case "ArrowRight": next = Math.min(idx + 1, cards.length - 1); break;
          case "ArrowLeft": next = Math.max(idx - 1, 0); break;
          case "ArrowDown": next = Math.min(idx + cols, cards.length - 1); break;
          case "ArrowUp": next = Math.max(idx - cols, 0); break;
        }
        cards[next]?.focus();
      }
    },
    [onClose],
  );

  /* ── Lock body scroll when open ── */
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* ── Event handlers ── */
  const handleSetTheme = useCallback(
    (id: string) => {
      setTheme(id);
      setTimeout(() => onClose(), 300);
    },
    [setTheme, onClose],
  );

  const handleModeToggle = useCallback(
    (mode: ThemeMode) => {
      setThemeMode(mode);
      setTimeout(() => onClose(), 300);
    },
    [setThemeMode, onClose],
  );

  /* ── Global keydown for ESC when sheet ref not focused ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Don't render anything when closed (after exit animation)
  if (!open) return null;

  return (
    <div
      className={`theme-modal-root ${open ? "theme-modal-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Theme selector"
      onKeyDown={handleKeyDown}
    >
      {/* ── Overlay ── */}
      <div
        className="theme-modal-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Sheet ── */}
      <div
        ref={sheetRef}
        className="theme-modal-sheet"
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-foreground/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 md:pt-6">
          <div>
            <h2 className="font-heading font-bold text-xl text-foreground">
              Themes
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose your cinematic universe
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="p-2 rounded-full hover:bg-foreground/10 transition-colors focus-visible:ring-2 focus-visible:ring-primary/60 outline-none"
            aria-label="Close theme selector"
          >
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="theme-modal-scroll px-6 pb-6">

          {/* ── AI Dynamic Mode ── */}
          <ModeToggleCard
            icon={<Sparkles className="w-5 h-5 text-white" />}
            label="✨ Adaptive Magic Mode"
            description="AI theme that changes with time of day & activity"
            isActive={isAiActive}
            gradient="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400"
            onClick={() => handleModeToggle(isAiActive ? "manual" : "ai-dynamic")}
          />

          {/* ── Auto-Seasonal Toggle ── */}
          <div className="mt-2">
            <ModeToggleCard
              icon={<Leaf className="w-4 h-4 text-white" />}
              label="🌍 Auto-Seasonal"
              description="Automatically matches the current season"
              isActive={isAutoSeasonal}
              gradient="bg-gradient-to-br from-cyan-400 via-emerald-400 to-amber-400"
              onClick={() => handleModeToggle(isAutoSeasonal ? "manual" : "auto-seasonal")}
            />
          </div>

          {/* ── Seasonal Bundles ── */}
          <SectionLabel
            icon={<Snowflake className="w-4 h-4" />}
            title="Seasonal Themes"
            count={12}
          />
          {SEASONAL_BUNDLES.map((bundle, bi) => (
            <SeasonalBundle
              key={bundle.season}
              bundle={bundle}
              activeThemeId={activeTheme.id}
              themeMap={themeMap}
              globalOffset={bi * 3}
              onSelect={handleSetTheme}
            />
          ))}

          {/* ── Core Themes ── */}
          <SectionLabel
            icon={<Sparkles className="w-4 h-4" />}
            title="Core Themes"
            count={coreThemes.length}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {coreThemes.map((t, i) => (
              <ThemeGridCard
                key={t.id}
                id={t.id}
                name={t.name}
                description={t.description}
                previewColors={t.previewColors}
                isActive={activeTheme.id === t.id}
                staggerIdx={i + 12}
                onClick={() => handleSetTheme(t.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
