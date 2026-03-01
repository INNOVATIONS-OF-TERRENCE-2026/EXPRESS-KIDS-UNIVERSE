import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Palette, Sparkles } from "lucide-react";
import { getCoreThemes } from "@/theme/themes";
import { SEASONAL_THEMES } from "@/theme/seasonalThemes";
import type { ThemeDefinition } from "@/theme/themes";

/* ── Pick 8 showcase themes (4 core + 4 seasonal) ──────── */
function getShowcaseThemes(): ThemeDefinition[] {
  const core = getCoreThemes().slice(0, 4);
  const seasonal = SEASONAL_THEMES.slice(0, 4);
  return [...core, ...seasonal];
}

/* ── Preview swatch ──────────────────────────────────────── */
function ThemeSwatch({ theme, active }: { theme: ThemeDefinition; active: boolean }) {
  const bg = theme.vars["--eku-bg"] ?? "220 20% 8%";
  const a1 = theme.vars["--eku-aurora-1"] ?? "270 80% 65%";
  const a2 = theme.vars["--eku-aurora-2"] ?? "180 70% 55%";
  const a3 = theme.vars["--eku-aurora-3"] ?? "330 80% 65%";

  return (
    <motion.div
      layout
      className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden cursor-pointer border-2 transition-colors duration-300 will-change-transform ${
        active ? "border-primary ring-2 ring-primary/30" : "border-white/10 hover:border-white/25"
      }`}
      whileHover={{ scale: 1.1, y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      style={{ background: `hsl(${bg})` }}
    >
      {/* Aurora blobs */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, hsl(${a1}/0.6), transparent 60%),
            radial-gradient(circle at 80% 70%, hsl(${a2}/0.5), transparent 50%),
            radial-gradient(circle at 50% 50%, hsl(${a3}/0.3), transparent 60%)
          `,
        }}
      />
      {active && (
        <motion.div
          layoutId="theme-active"
          className="absolute inset-0 border-2 border-primary rounded-2xl"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </motion.div>
  );
}

/* ── Full-bleed preview ──────────────────────────────────── */
function ThemePreview({ theme }: { theme: ThemeDefinition }) {
  const bg = theme.vars["--eku-bg"] ?? "220 20% 8%";
  const a1 = theme.vars["--eku-aurora-1"] ?? "270 80% 65%";
  const a2 = theme.vars["--eku-aurora-2"] ?? "180 70% 55%";
  const a3 = theme.vars["--eku-aurora-3"] ?? "330 80% 65%";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 rounded-3xl overflow-hidden will-change-opacity"
      style={{ background: `hsl(${bg})` }}
    >
      {/* Aurora layers */}
      <motion.div
        className="absolute inset-0 opacity-40 will-change-transform"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: `
            radial-gradient(ellipse at 25% 40%, hsl(${a1}/0.5), transparent 60%),
            radial-gradient(ellipse at 75% 60%, hsl(${a2}/0.4), transparent 55%),
            radial-gradient(ellipse at 50% 80%, hsl(${a3}/0.3), transparent 50%)
          `,
        }}
      />
      {/* Label */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
        <span className="text-sm font-bold text-white/90 drop-shadow-lg">{theme.name}</span>
      </div>
    </motion.div>
  );
}

/* ── Section ─────────────────────────────────────────────── */
export function ThemeShowcaseSection() {
  const themes = useMemo(() => getShowcaseThemes(), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();

  const advance = useCallback(() => {
    setActiveIndex((p) => (p + 1) % themes.length);
  }, [themes.length]);

  // Auto-cycle every 4s
  useEffect(() => {
    if (paused || reduced) return;
    const timer = window.setInterval(advance, 4000);
    return () => window.clearInterval(timer);
  }, [paused, reduced, advance]);

  const activeTheme = themes[activeIndex];

  // Precompute particle positions per theme change (prevents jitter)
  const particles = useMemo(() => {
    if (reduced) return [];
    return Array.from({ length: 12 }).map((_, i) => {
      const left = 10 + Math.random() * 80;
      const top = 10 + Math.random() * 80;
      const duration = 3 + Math.random() * 2;
      const delay = Math.random() * 2;
      return { i, left, top, duration, delay };
    });
  }, [activeIndex, reduced]);

  const onSelectTheme = (i: number) => {
    setActiveIndex(i);
    setPaused(true);
  };

  return (
    <section className="relative py-28 sm:py-36 px-4 overflow-hidden">
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <NeonIcon />
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black aurora-text mb-4">
            22 Cinematic Themes.
            <br />
            Infinite Imagination.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Core palettes, seasonal bundles, and an adaptive mode that evolves in real time.
          </p>
        </motion.div>

        {/* Preview window */}
        <div
          className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden glass-card-elevated mb-8"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onPointerDown={() => setPaused(true)} // mobile-friendly pause
        >
          <AnimatePresence mode="wait">
            {activeTheme && <ThemePreview key={activeTheme.id} theme={activeTheme} />}
          </AnimatePresence>

          {/* Particle spark overlay */}
          {!reduced && (
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              {particles.map((p) => (
                <motion.span
                  key={p.i}
                  className="absolute w-1 h-1 rounded-full bg-white/40"
                  style={{ left: `${p.left}%`, top: `${p.top}%` }}
                  animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.2, 0.5] }}
                  transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
                />
              ))}
            </motion.div>
          )}

          {/* Small state badge */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <span className="text-xs px-3 py-1 rounded-full bg-black/40 text-white/80 backdrop-blur border border-white/10">
              {reduced ? "Reduced Motion" : paused ? "Paused" : "Auto"}
            </span>
          </div>
        </div>

        {/* Swatch row */}
        <div className="flex flex-wrap justify-center gap-3">
          {themes.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTheme(i)}
              onPointerDown={() => setPaused(true)}
              aria-label={`Select theme: ${t.name}`}
              aria-pressed={i === activeIndex}
              className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <ThemeSwatch theme={t} active={i === activeIndex} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Section icon ────────────────────────────────────────── */
function NeonIcon() {
  return (
    <motion.div
      className="inline-flex items-center gap-2 mb-6"
      animate={{
        filter: [
          "drop-shadow(0 0 8px hsl(var(--accent)/0.3))",
          "drop-shadow(0 0 16px hsl(var(--accent)/0.15))",
          "drop-shadow(0 0 8px hsl(var(--accent)/0.3))",
        ],
      }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      <Palette className="w-6 h-6 text-accent" />
      <Sparkles className="w-5 h-5 text-primary/60" />
    </motion.div>
  );
}
