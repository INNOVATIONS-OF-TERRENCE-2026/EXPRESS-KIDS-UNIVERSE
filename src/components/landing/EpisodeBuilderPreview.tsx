import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Wand2,
  Palette,
  Sun,
  Moon,
  Smile,
  Heart,
  BookOpen,
  Calculator,
  Users,
  Sparkles,
  Play,
  Clock,
} from "lucide-react";
import { CinematicButton, Tilt3DCard, NeonGlow } from "@/components/eku";
import { useSectionCue } from "./CinematicSoundEngine";

/* ── Demo data ───────────────────────────────────────────── */
const THEMES = [
  { id: "space", label: "Space Quest", gradient: "from-indigo-600/50 via-purple-700/40 to-blue-900/60", icon: "🚀" },
  { id: "forest", label: "Magic Forest", gradient: "from-emerald-600/50 via-teal-700/40 to-green-900/60", icon: "🌲" },
  { id: "ocean", label: "Ocean Voyage", gradient: "from-cyan-600/50 via-blue-700/40 to-sky-900/60", icon: "🌊" },
  { id: "dino", label: "Dino Discovery", gradient: "from-lime-600/50 via-emerald-700/40 to-teal-900/60", icon: "🦕" },
];

const MOODS = [
  { id: "calm", label: "Calm", icon: Moon, lighting: "brightness(0.85) saturate(1.1)" },
  { id: "excited", label: "Excited", icon: Sun, lighting: "brightness(1.15) saturate(1.3)" },
  { id: "silly", label: "Silly", icon: Smile, lighting: "brightness(1.05) saturate(1.2) hue-rotate(10deg)" },
];

const LESSONS = [
  { id: "kindness", label: "Kindness", icon: Heart, tagline: "A tale of compassion and caring" },
  { id: "confidence", label: "Confidence", icon: Sparkles, tagline: "A journey of self-belief" },
  { id: "friendship", label: "Friendship", icon: Users, tagline: "An adventure in togetherness" },
  { id: "learning", label: "Learning", icon: Calculator, tagline: "A story of wonder and discovery" },
];

/* ── 3-Act timeline bar ──────────────────────────────────── */
function ActTimeline({ playing }: { playing: boolean }) {
  const reduced = useReducedMotion();
  const acts = ["Act I — Setup", "Act II — Adventure", "Act III — Resolution"];

  return (
    <div className="flex items-center gap-1 w-full">
      {acts.map((act, i) => (
        <div key={act} className="flex-1">
          <div className="text-[10px] text-muted-foreground/60 mb-1 text-center font-semibold">
            {act}
          </div>
          <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                i === 0 ? "bg-primary" : i === 1 ? "bg-accent" : "bg-secondary"
              }`}
              initial={{ width: "0%" }}
              animate={playing && !reduced ? { width: "100%" } : { width: "0%" }}
              transition={{
                duration: 2,
                delay: i * 2,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Floating runtime counter ────────────────────────────── */
function RuntimeCounter({ playing }: { playing: boolean }) {
  const [seconds, setSeconds] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!playing || reduced) {
      setSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s >= 900) {
          clearInterval(interval);
          return 900;
        }
        return s + 15; // fast-forward for demo: ~1 min real → 15 min shown
      });
    }, 100);
    return () => clearInterval(interval);
  }, [playing, reduced]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <motion.div
      className="glass-card px-3 py-1.5 rounded-full border border-accent/20 inline-flex items-center gap-2"
      animate={playing && !reduced ? { y: [0, -3, 0] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <Clock className="w-3.5 h-3.5 text-accent" />
      <span className="text-xs font-mono font-semibold text-accent">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
      <span className="text-[10px] text-muted-foreground">estimated</span>
    </motion.div>
  );
}

/* ── Option chip ─────────────────────────────────────────── */
function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
        selected
          ? "bg-primary/20 border-primary/40 text-primary"
          : "bg-muted/30 border-border/30 text-muted-foreground hover:border-primary/20"
      }`}
    >
      {children}
    </motion.button>
  );
}

/* ── Section ─────────────────────────────────────────────── */
export function EpisodeBuilderPreview() {
  const sectionRef = useSectionCue("sparkle", "episode-builder");
  const reduced = useReducedMotion();

  const [name, setName] = useState("Alex");
  const [themeId, setThemeId] = useState("space");
  const [moodId, setMoodId] = useState("excited");
  const [lessonId, setLessonId] = useState("kindness");
  const [playing, setPlaying] = useState(false);

  const theme = THEMES.find((t) => t.id === themeId)!;
  const mood = MOODS.find((m) => m.id === moodId)!;
  const lesson = LESSONS.find((l) => l.id === lessonId)!;

  const handlePlay = useCallback(() => {
    setPlaying(false);
    // Re-trigger on next tick
    requestAnimationFrame(() => setPlaying(true));
  }, []);

  // Auto-play timeline on first render
  useEffect(() => {
    const t = setTimeout(() => setPlaying(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const generatedTitle = `${name}'s ${theme.label}`;

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="relative py-28 sm:py-36 px-4 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary/70 mb-3">
            Interactive Preview
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black aurora-text mb-4">
            Build an Episode in Seconds
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            See how your choices shape every story — live.
          </p>
        </motion.div>

        {/* Columns */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* ── Left: Mock wizard ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Step 1 — Name */}
            <div className="glass-card p-5 rounded-2xl">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-2 block">
                <span className="inline-flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-primary" />
                  Step 1 — Child's Name
                </span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 20))}
                placeholder="Enter a name…"
                className="w-full bg-muted/30 border border-border/30 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                maxLength={20}
              />
            </div>

            {/* Step 2 — Theme */}
            <div className="glass-card p-5 rounded-2xl">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-3 block">
                <span className="inline-flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-accent" />
                  Step 2 — Choose Theme
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((t) => (
                  <Chip key={t.id} selected={themeId === t.id} onClick={() => setThemeId(t.id)}>
                    {t.icon} {t.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Step 3 — Mood */}
            <div className="glass-card p-5 rounded-2xl">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-3 block">
                <span className="inline-flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-secondary" />
                  Step 3 — Select Mood
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => {
                  const Icon = m.icon;
                  return (
                    <Chip key={m.id} selected={moodId === m.id} onClick={() => setMoodId(m.id)}>
                      <span className="inline-flex items-center gap-1">
                        <Icon className="w-3 h-3" /> {m.label}
                      </span>
                    </Chip>
                  );
                })}
              </div>
            </div>

            {/* Step 4 — Lesson */}
            <div className="glass-card p-5 rounded-2xl">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-3 block">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  Step 4 — Add Lesson
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {LESSONS.map((l) => {
                  const Icon = l.icon;
                  return (
                    <Chip key={l.id} selected={lessonId === l.id} onClick={() => setLessonId(l.id)}>
                      <span className="inline-flex items-center gap-1">
                        <Icon className="w-3 h-3" /> {l.label}
                      </span>
                    </Chip>
                  );
                })}
              </div>
            </div>

            {/* Play */}
            <CinematicButton variant="primary" size="md" onClick={handlePlay} className="w-full justify-center">
              <Play className="w-4 h-4" /> Preview Episode Arc
            </CinematicButton>
          </motion.div>

          {/* ── Right: Live preview panel ─────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="sticky top-24"
          >
            <Tilt3DCard maxTilt={reduced ? 0 : 5} glareEnabled={!reduced}>
              <div className="glass-card-elevated rounded-3xl overflow-hidden holographic">
                {/* Preview poster */}
                <div className="relative aspect-video overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={themeId}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`}
                      style={{ filter: mood.lighting }}
                    >
                      {/* Animated overlay sparks */}
                      {!reduced &&
                        Array.from({ length: 6 }).map((_, i) => (
                          <motion.span
                            key={i}
                            className="absolute w-1 h-1 rounded-full bg-white/30"
                            style={{
                              left: `${15 + Math.random() * 70}%`,
                              top: `${15 + Math.random() * 70}%`,
                            }}
                            animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.5, 0.5] }}
                            transition={{
                              duration: 2 + Math.random() * 2,
                              repeat: Infinity,
                              delay: Math.random() * 2,
                            }}
                          />
                        ))}

                      {/* Theme icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.span
                          className="text-7xl drop-shadow-2xl select-none"
                          animate={reduced ? {} : { y: [0, -8, 0], rotate: [0, 3, -3, 0] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                          {theme.icon}
                        </motion.span>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <AnimatePresence mode="wait">
                      <motion.h3
                        key={`${name}-${themeId}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="font-heading text-lg sm:text-xl font-bold text-white drop-shadow-lg"
                      >
                        {generatedTitle}
                      </motion.h3>
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={lessonId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-white/70 mt-0.5"
                      >
                        {lesson.tagline}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  {/* EKU Original badge */}
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-primary/80 text-[10px] font-bold text-white">
                    EKU Original
                  </div>
                </div>

                {/* Bottom panel */}
                <div className="p-5 space-y-4">
                  {/* Runtime counter */}
                  <div className="flex justify-between items-center">
                    <RuntimeCounter playing={playing} />
                    <NeonGlow color="accent" intensity="low" className="inline-flex">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-accent/70">
                        {mood.label} Mood
                      </span>
                    </NeonGlow>
                  </div>

                  {/* 3-Act timeline */}
                  <ActTimeline playing={playing} />
                </div>
              </div>
            </Tilt3DCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
