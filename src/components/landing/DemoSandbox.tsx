/**
 * DemoSandbox — "Try It Instantly" mini sandbox section.
 *
 * - Child name input, theme pick, "Generate Preview" button
 * - 3-second loading → reveal pre-bundled sample scene
 * - Ken Burns pan + zoom on poster, narration waveform overlay
 * - Upgrade prompt after playback completes
 * - All client-side; no backend calls
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  Play,
  Loader2,
  ArrowRight,
  Volume2,
  VolumeX,
  Crown,
} from "lucide-react";
import { CinematicButton, NeonGlow, Tilt3DCard } from "@/components/eku";
import { useSectionCue } from "./CinematicSoundEngine";
import { useNavigate } from "react-router-dom";

/* ── Sample scenes — all client-side demo content ────────── */
const SAMPLE_SCENES = [
  {
    id: "space",
    label: "Space Quest",
    icon: "🚀",
    poster: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)",
    narration:
      "Once upon a time, {name} looked up at the twinkling sky and wondered — what great adventure awaits among the stars tonight?",
    waveform: [0.2, 0.5, 0.8, 0.6, 0.9, 0.4, 0.7, 0.3, 0.6, 0.8, 0.5, 0.3, 0.7, 0.9, 0.4, 0.6],
  },
  {
    id: "forest",
    label: "Magic Forest",
    icon: "🌲",
    poster: "linear-gradient(135deg, #064e3b 0%, #065f46 40%, #059669 100%)",
    narration:
      "Deep in the emerald forest, {name} discovered a trail of glowing petals that whispered — follow us, brave explorer!",
    waveform: [0.3, 0.6, 0.4, 0.8, 0.5, 0.7, 0.9, 0.4, 0.6, 0.3, 0.8, 0.5, 0.7, 0.4, 0.6, 0.9],
  },
  {
    id: "ocean",
    label: "Ocean Voyage",
    icon: "🌊",
    poster: "linear-gradient(135deg, #0c4a6e 0%, #075985 40%, #0284c7 100%)",
    narration:
      "The waves sang a gentle song as {name} set sail toward the shimmering horizon — a new ocean adventure was beginning!",
    waveform: [0.4, 0.7, 0.5, 0.3, 0.8, 0.6, 0.4, 0.9, 0.5, 0.7, 0.3, 0.6, 0.8, 0.4, 0.7, 0.5],
  },
];

/* ── Waveform visualizer (client-only fake playback) ─────── */
function NarrationWaveform({
  bars,
  playing,
  progress,
}: {
  bars: number[];
  playing: boolean;
  progress: number;
}) {
  return (
    <div className="flex items-end justify-center gap-[2px] h-8">
      {bars.map((h, i) => {
        const active = playing && i / bars.length <= progress;
        return (
          <motion.div
            key={i}
            className={`w-1 rounded-full transition-colors duration-200 ${
              active ? "bg-primary" : "bg-muted-foreground/20"
            }`}
            style={{ height: `${h * 100}%` }}
            animate={
              playing && active
                ? { scaleY: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }
                : {}
            }
            transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.02 }}
          />
        );
      })}
    </div>
  );
}

/* ── Typewriter narration ────────────────────────────────── */
function TypewriterText({ text, playing }: { text: string; playing: boolean }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!playing) {
      setDisplayed("");
      idx.current = 0;
      return;
    }
    if (reduced) {
      setDisplayed(text);
      return;
    }
    const interval = setInterval(() => {
      idx.current += 1;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) clearInterval(interval);
    }, 35);
    return () => clearInterval(interval);
  }, [text, playing, reduced]);

  return (
    <p className="text-sm sm:text-base text-foreground/80 italic min-h-[3rem] leading-relaxed">
      "{displayed}
      {playing && displayed.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="text-primary"
        >
          |
        </motion.span>
      )}
      {displayed.length === text.length && '"'}
    </p>
  );
}

/* ── Section ─────────────────────────────────────────────── */
type Phase = "idle" | "loading" | "playing" | "done";

export function DemoSandbox() {
  const sectionRef = useSectionCue("whoosh", "demo-sandbox");
  const reduced = useReducedMotion();
  const navigate = useNavigate();

  const [name, setName] = useState("Luna");
  const [sceneId, setSceneId] = useState("space");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);

  const scene = SAMPLE_SCENES.find((s) => s.id === sceneId)!;
  const narrationText = scene.narration.replace("{name}", name || "our hero");

  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const handleGenerate = useCallback(() => {
    setPhase("loading");
    setProgress(0);
    setTimeout(() => {
      setPhase("playing");
      // Simulate 5-second playback
      let p = 0;
      timerRef.current = setInterval(() => {
        p += 0.02;
        setProgress(Math.min(p, 1));
        if (p >= 1) {
          clearInterval(timerRef.current);
          setPhase("done");
        }
      }, 100);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleReset = useCallback(() => {
    setPhase("idle");
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="relative py-28 sm:py-36 px-4 overflow-hidden"
    >
      {/* Ambient BG glow */}
      {!reduced && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-[100px]" />
        </div>
      )}

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent/70 mb-3">
            Try It Instantly
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black aurora-text mb-4">
            Your Story Begins Here
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Type a name, pick a world, and watch the magic unfold — no sign-up required.
          </p>
        </motion.div>

        {/* Content card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Tilt3DCard maxTilt={reduced ? 0 : 3} glareEnabled={false}>
            <div className="glass-card-elevated rounded-3xl overflow-hidden p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {/* ── Idle: input controls ──────────────────── */}
                {phase === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Name input */}
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-2 block">
                          Child's Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value.slice(0, 20))}
                          placeholder="Enter a name…"
                          className="w-full bg-muted/30 border border-border/30 rounded-xl px-4 py-3 text-sm font-semibold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                          maxLength={20}
                        />
                      </div>

                      {/* Theme pick */}
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-2 block">
                          Pick a World
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {SAMPLE_SCENES.map((s) => (
                            <motion.button
                              key={s.id}
                              onClick={() => setSceneId(s.id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                sceneId === s.id
                                  ? "bg-primary/20 border-primary/40 text-primary"
                                  : "bg-muted/30 border-border/30 text-muted-foreground hover:border-primary/20"
                              }`}
                            >
                              {s.icon} {s.label}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <CinematicButton variant="primary" size="lg" onClick={handleGenerate} className="w-full justify-center">
                      <Sparkles className="w-4 h-4" /> Generate Preview
                    </CinematicButton>
                  </motion.div>
                )}

                {/* ── Loading ───────────────────────────────── */}
                {phase === "loading" && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 space-y-4"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-10 h-10 text-primary" />
                    </motion.div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      Composing {name || "your"}'s story…
                    </p>
                    {/* Fake progress dots */}
                    <div className="flex gap-2">
                      {["Storyboard", "Characters", "Narration"].map((step, i) => (
                        <motion.span
                          key={step}
                          initial={{ opacity: 0.3 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.8, duration: 0.4 }}
                          className="text-[10px] text-muted-foreground/60 font-semibold"
                        >
                          ✓ {step}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── Playing / Done ───────────────────────── */}
                {(phase === "playing" || phase === "done") && (
                  <motion.div
                    key="player"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Scene poster with Ken Burns */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden">
                      <motion.div
                        className="absolute inset-0"
                        style={{ background: scene.poster }}
                        animate={
                          !reduced && phase === "playing"
                            ? { scale: [1, 1.08], x: [0, -10], y: [0, -5] }
                            : {}
                        }
                        transition={{ duration: 5, ease: "easeInOut" }}
                      >
                        {/* Floating scene icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.span
                            className="text-8xl drop-shadow-2xl select-none"
                            animate={reduced ? {} : { y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                            {scene.icon}
                          </motion.span>
                        </div>

                        {/* Waveform overlay */}
                        <div className="absolute bottom-4 left-4 right-4">
                          <NarrationWaveform
                            bars={scene.waveform}
                            playing={phase === "playing"}
                            progress={progress}
                          />
                        </div>
                      </motion.div>

                      {/* Mute toggle */}
                      <button
                        onClick={() => setMuted(!muted)}
                        className="absolute top-3 right-3 p-2 rounded-full glass-card border border-border/30 hover:bg-muted/40 transition-colors"
                        aria-label={muted ? "Unmute" : "Mute"}
                      >
                        {muted ? (
                          <VolumeX className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-primary" />
                        )}
                      </button>

                      {/* Title */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-0.5 rounded bg-primary/80 text-[10px] font-bold text-white">
                          EKU Demo
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30">
                        <motion.div
                          className="h-full bg-primary"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Narration typewriter */}
                    <div className="px-2">
                      <TypewriterText
                        text={narrationText}
                        playing={phase === "playing" || phase === "done"}
                      />
                    </div>

                    {/* Done — upgrade prompt */}
                    <AnimatePresence>
                      {phase === "done" && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="glass-card rounded-2xl p-5 border border-accent/20 text-center space-y-3"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Crown className="w-5 h-5 text-accent" />
                            <span className="font-heading font-bold text-lg text-foreground">
                              Imagine full HD episodes like this
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            With Studio Pro, {name || "your child"} gets unlimited cinematic stories, voice-over narration, and more.
                          </p>
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <CinematicButton
                              variant="primary"
                              size="md"
                              onClick={() => navigate("/create")}
                            >
                              <Sparkles className="w-4 h-4" /> Create Your First Episode
                              <ArrowRight className="w-4 h-4" />
                            </CinematicButton>
                            <button
                              onClick={handleReset}
                              className="text-xs text-muted-foreground hover:text-primary transition-colors font-semibold"
                            >
                              Try another world →
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Tilt3DCard>
        </motion.div>
      </div>
    </section>
  );
}
