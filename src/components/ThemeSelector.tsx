import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, X, Check, Sparkles, Leaf, Sun, Snowflake, Flower2, Wand2 } from "lucide-react";
import { useTheme, type ThemeMode } from "@/context/ThemeProvider";
import { getCoreThemes } from "@/theme/themes";
import { SEASONAL_BUNDLES, type SeasonalBundle } from "@/theme/seasonalThemes";
import { AI_DYNAMIC_THEME_ID } from "@/lib/theme/dynamicThemeGenerator";

/**
 * ThemeSelector — Categorized theme picker drawer.
 *
 * Three sections:
 *  1. Core Themes (10 cinematic themes)
 *  2. Seasonal Bundles (4 seasons × 3 themes) + Auto-Seasonal toggle
 *  3. AI Dynamic Mode (Adaptive Magic — time-of-day + interaction)
 */

const SEASON_ICONS: Record<string, React.ReactNode> = {
  winter: <Snowflake className="w-3.5 h-3.5" />,
  spring: <Flower2 className="w-3.5 h-3.5" />,
  summer: <Sun className="w-3.5 h-3.5" />,
  fall: <Leaf className="w-3.5 h-3.5" />,
};

function ThemeCard({
  t,
  isActive,
  idx,
  onClick,
}: {
  t: { id: string; name: string; description: string; previewColors: [string, string, string] };
  isActive: boolean;
  idx: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.02, duration: 0.2 }}
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 p-2.5 rounded-xl
        text-left transition-all duration-200
        ${isActive ? "bg-primary/15 ring-1 ring-primary/40" : "hover:bg-foreground/5"}
      `}
      aria-pressed={isActive}
    >
      <div
        className="w-9 h-9 rounded-lg shrink-0 ring-1 ring-white/10"
        style={{
          background: `linear-gradient(135deg, ${t.previewColors[0]}, ${t.previewColors[1]}, ${t.previewColors[2]})`,
        }}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isActive ? "text-primary" : "text-foreground"}`}>
          {t.name}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">{t.description}</p>
      </div>
      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0"
        >
          <Check className="w-3 h-3 text-primary-foreground" />
        </motion.div>
      )}
    </motion.button>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-2 pt-4 pb-1.5 px-1">
      <span className="text-primary/70">{icon}</span>
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/80">{title}</h3>
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function SeasonalBundleGroup({
  bundle,
  activeThemeId,
  onSelect,
  themeMap,
  startIdx,
}: {
  bundle: SeasonalBundle;
  activeThemeId: string;
  onSelect: (id: string) => void;
  themeMap: Map<string, { id: string; name: string; description: string; previewColors: [string, string, string] }>;
  startIdx: number;
}) {
  return (
    <div className="mt-2">
      <div className="flex items-center gap-1.5 px-1 mb-1">
        {SEASON_ICONS[bundle.season]}
        <span className="text-[11px] font-semibold text-foreground/70">
          {bundle.emoji} {bundle.label}
        </span>
      </div>
      {bundle.themeIds.map((id, i) => {
        const t = themeMap.get(id);
        if (!t) return null;
        return (
          <ThemeCard
            key={id}
            t={t}
            isActive={activeThemeId === id}
            idx={startIdx + i}
            onClick={() => onSelect(id)}
          />
        );
      })}
    </div>
  );
}

export const ThemeSelector = memo(function ThemeSelector() {
  const { theme: activeTheme, themes, setTheme, themeMode, setThemeMode } = useTheme();
  const [open, setOpen] = useState(false);

  const coreThemes = getCoreThemes();
  const themeMap = new Map(themes.map((t) => [t.id, t]));

  const handleSetTheme = (id: string) => {
    setTheme(id); // automatically sets mode to "manual"
  };

  const handleModeToggle = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  const isAiActive = themeMode === "ai-dynamic";
  const isAutoSeasonal = themeMode === "auto-seasonal";

  return (
    <>
      {/* ── Trigger button ── */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full text-foreground/70 hover:text-foreground hover:bg-foreground/5 border border-foreground/10 hover:border-foreground/20 transition-all duration-300"
        title="Change Theme"
        aria-label="Open theme selector"
      >
        <Palette className="w-4 h-4" />
      </motion.button>

      {/* ── Backdrop + Drawer ── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="theme-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9990] bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            <motion.div
              key="theme-drawer"
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="fixed top-0 right-0 bottom-0 z-[9991] w-80 max-w-[90vw] flex flex-col"
              style={{
                background: "hsl(var(--eku-bg) / 0.95)",
                backdropFilter: "blur(24px) saturate(1.5)",
                borderLeft: "1px solid hsl(var(--glass-border) / 0.3)",
                boxShadow: "-8px 0 40px rgba(0,0,0,0.4)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div>
                  <h2 className="font-heading font-bold text-lg text-foreground">Themes</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Choose your cinematic universe</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-full hover:bg-foreground/10 transition-colors"
                  aria-label="Close theme selector"
                >
                  <X className="w-4 h-4 text-foreground/60" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 pb-6">

                {/* ──────── AI Dynamic Mode ──────── */}
                <SectionHeader
                  icon={<Wand2 className="w-3.5 h-3.5" />}
                  title="Adaptive Magic"
                  subtitle="AI-generated theme that adapts to you"
                />
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0, duration: 0.2 }}
                  onClick={() => handleModeToggle(isAiActive ? "manual" : "ai-dynamic")}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-xl
                    text-left transition-all duration-200
                    ${isAiActive ? "bg-primary/15 ring-1 ring-primary/40" : "hover:bg-foreground/5"}
                  `}
                  aria-pressed={isAiActive}
                >
                  <div className="w-10 h-10 rounded-lg shrink-0 ring-1 ring-white/10 flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isAiActive ? "text-primary" : "text-foreground"}`}>
                      ✨ Adaptive Magic Mode
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Changes with time of day & activity
                    </p>
                  </div>
                  {isAiActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0"
                    >
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </motion.div>
                  )}
                </motion.button>

                {/* ──────── Auto-Seasonal Toggle ──────── */}
                <div className="mt-3">
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.02, duration: 0.2 }}
                    onClick={() => handleModeToggle(isAutoSeasonal ? "manual" : "auto-seasonal")}
                    className={`
                      w-full flex items-center gap-3 p-2.5 rounded-xl
                      text-left transition-all duration-200
                      ${isAutoSeasonal ? "bg-secondary/15 ring-1 ring-secondary/40" : "hover:bg-foreground/5"}
                    `}
                    aria-pressed={isAutoSeasonal}
                  >
                    <div className="w-9 h-9 rounded-lg shrink-0 ring-1 ring-white/10 flex items-center justify-center bg-gradient-to-br from-cyan-400 via-emerald-400 to-amber-400">
                      <Leaf className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isAutoSeasonal ? "text-secondary" : "text-foreground"}`}>
                        🌍 Auto-Seasonal
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        Automatically matches the current season
                      </p>
                    </div>
                    {isAutoSeasonal && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center shrink-0"
                      >
                        <Check className="w-3 h-3 text-secondary-foreground" />
                      </motion.div>
                    )}
                  </motion.button>
                </div>

                {/* ──────── Seasonal Bundles ──────── */}
                <SectionHeader
                  icon={<Snowflake className="w-3.5 h-3.5" />}
                  title="Seasonal Themes"
                  subtitle="12 themes across 4 seasons"
                />
                {SEASONAL_BUNDLES.map((bundle, bi) => (
                  <SeasonalBundleGroup
                    key={bundle.season}
                    bundle={bundle}
                    activeThemeId={activeTheme.id}
                    onSelect={handleSetTheme}
                    themeMap={themeMap}
                    startIdx={bi * 3}
                  />
                ))}

                {/* ──────── Core Themes ──────── */}
                <SectionHeader
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  title="Core Themes"
                  subtitle="10 cinematic color worlds"
                />
                <div className="space-y-1">
                  {coreThemes.map((t, i) => (
                    <ThemeCard
                      key={t.id}
                      t={t}
                      isActive={activeTheme.id === t.id}
                      idx={i}
                      onClick={() => handleSetTheme(t.id)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});
