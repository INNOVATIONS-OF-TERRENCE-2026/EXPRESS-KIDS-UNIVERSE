import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { brand } from "@/lib/brand";
import { audioManager } from "@/lib/audio";
import { getParentSettings } from "@/lib/storage";
import { introEngine, type IntroTheme } from "@/lib/studio/introEngine";

/* ─────────────────────────────────────────────────────────
   StudioIntro — Full-screen cinematic studio intro sequence
   ─────────────────────────────────────────────────────────
   • Plays ONCE per session (sessionStorage flag).
   • 3.5–4 s total timeline.
   • Respects prefers-reduced-motion + parent settings.
   • GPU-only transforms: transform + opacity.
   • Auto-dismiss + skip after 2 s.
   • High z-index overlay — scroll-locked while active.
   • Removes itself cleanly from the DOM after completion.
   ───────────────────────────────────────────────────────── */

const SESSION_KEY = "eku_intro_seen";

/* -------------- tiny star field (CSS-only, lightweight) -------------- */
function StarField({ count = 60 }: { count?: number }) {
  const stars = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 3,
      dur: 3 + Math.random() * 4,
    })),
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full intro-star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            background: "white",
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

/* -------------- Orbit ring around logo -------------- */
function OrbitRing({ visible }: { visible: boolean }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none intro-orbit-ring"
      style={{
        width: 260,
        height: 260,
        border: "1px solid rgba(168,85,247,0.2)",
        left: "50%",
        top: "50%",
        marginLeft: -130,
        marginTop: -130,
      }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={
        visible
          ? { opacity: 0.3, scale: 1, rotate: 360 }
          : { opacity: 0, scale: 0.6 }
      }
      transition={
        visible
          ? { opacity: { duration: 0.4 }, scale: { duration: 0.6 }, rotate: { duration: 20, repeat: Infinity, ease: "linear" } }
          : { duration: 0.3 }
      }
    />
  );
}

interface StudioIntroProps {
  /** Override theme (defaults to introEngine selection) */
  theme?: IntroTheme;
  /** Called when intro has fully completed or been skipped */
  onComplete?: () => void;
}

export const StudioIntro = memo(function StudioIntro({ theme, onComplete }: StudioIntroProps) {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<
    "black" | "stars" | "glow" | "burst" | "logo" | "ring" | "sweep" | "fadeout" | "done"
  >("black");
  const [showSkip, setShowSkip] = useState(false);
  const [visible, setVisible] = useState(true);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const activeTheme = theme ?? introEngine.selectTheme();

  // Clean up all timers on unmount
  const clearTimers = useCallback(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    sessionStorage.setItem(SESSION_KEY, "true");
    document.body.style.overflow = "";
    setPhase("done");
    // Brief delay so fade-out animation plays
    const t = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 500);
    timerRefs.current.push(t);
  }, [clearTimers, onComplete]);

  const skip = useCallback(() => {
    setPhase("fadeout");
    const t = setTimeout(finish, 400);
    timerRefs.current.push(t);
  }, [finish]);

  // Main timeline
  useEffect(() => {
    // Already seen this session
    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      setVisible(false);
      onComplete?.();
      return;
    }

    // If reduced motion, skip the whole thing quickly
    if (prefersReducedMotion) {
      setPhase("logo");
      const t = setTimeout(finish, 1200);
      timerRefs.current.push(t);
      return;
    }

    // Lock body scroll
    document.body.style.overflow = "hidden";

    // Timeline schedule
    const schedule: [number, typeof phase][] = [
      [0, "black"],
      [500, "stars"],
      [1000, "glow"],
      [1300, "burst"],
      [1600, "logo"],
      [2300, "ring"],
      [2800, "sweep"],
      [3500, "fadeout"],
    ];

    schedule.forEach(([ms, p]) => {
      const t = setTimeout(() => setPhase(p), ms);
      timerRefs.current.push(t);
    });

    // Show skip button after 2 s
    const skipT = setTimeout(() => setShowSkip(true), 2000);
    timerRefs.current.push(skipT);

    // Auto-dismiss at 4 s
    const doneT = setTimeout(finish, 4000);
    timerRefs.current.push(doneT);

    // Audio sting (soft whoosh + sub pulse)
    const audioT = setTimeout(() => {
      if (getParentSettings().soundEnabled) {
        audioManager.whoosh();
        // Subtle sub-bass pulse via sparkle
        setTimeout(() => audioManager.sparkle(), 300);
      }
    }, 1400);
    timerRefs.current.push(audioT);

    return () => {
      clearTimers();
      document.body.style.overflow = "";
    };
  }, [prefersReducedMotion, finish, clearTimers, onComplete]);

  if (!visible) return null;

  const themeColors = introEngine.getThemeColors(activeTheme);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="studio-intro"
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background: `radial-gradient(ellipse at center, ${themeColors.inner} 0%, ${themeColors.outer} 50%, #0e1026 100%)`,
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === "fadeout" ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          aria-hidden="true"
        >
          {/* Layer 1: Star field */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase !== "black" ? 0.6 : 0 }}
            transition={{ duration: 1.5 }}
          >
            <StarField count={80} />
          </motion.div>

          {/* Layer 2: Energy pulse / glow orb */}
          <motion.div
            className="absolute rounded-full will-change-transform"
            style={{
              width: 160,
              height: 160,
              background: `radial-gradient(circle, ${themeColors.glow} 0%, transparent 70%)`,
              filter: "blur(30px)",
            }}
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{
              opacity: ["glow", "burst", "logo", "ring", "sweep"].includes(phase) ? 0.9 : 0,
              scale: ["burst", "logo", "ring", "sweep"].includes(phase) ? 1.8 : 0.2,
            }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Layer 3: Brand logo reveal */}
          <motion.div className="relative z-10">
            <OrbitRing visible={["ring", "sweep"].includes(phase)} />

            <motion.div
              className={["sweep"].includes(phase) ? "intro-light-sweep" : ""}
              initial={{ opacity: 0, scale: 0.85, y: 12 }}
              animate={{
                opacity: ["logo", "ring", "sweep"].includes(phase) ? 1 : 0,
                scale: ["logo", "ring", "sweep"].includes(phase) ? 1 : 0.85,
                y: ["logo", "ring", "sweep"].includes(phase) ? 0 : 12,
              }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div
                className="w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden relative"
                style={{
                  boxShadow: `0 0 32px ${themeColors.glow}`,
                  background: "radial-gradient(circle at center, rgba(255,200,0,0.04), transparent 70%)",
                }}
              >
                <img
                  src={brand.logoSrc}
                  alt=""
                  className="w-[120%] h-[120%] absolute top-1/2 left-1/2 z-10"
                  style={{
                    transform: "translate(-50%, -50%)",
                    objectFit: "cover",
                    objectPosition: "center center",
                    imageRendering: "auto",
                    filter: `drop-shadow(0 0 18px ${themeColors.glow})`,
                  }}
                />
              </div>
            </motion.div>

            {/* Brand name text */}
            <motion.p
              className="text-center font-heading font-black text-xl md:text-2xl aurora-text mt-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: ["logo", "ring", "sweep"].includes(phase) ? 1 : 0,
                y: ["logo", "ring", "sweep"].includes(phase) ? 0 : 8,
              }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              {brand.name}
            </motion.p>
          </motion.div>

          {/* Skip button */}
          <AnimatePresence>
            {showSkip && phase !== "fadeout" && (
              <motion.button
                key="skip-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                onClick={skip}
                className="fixed bottom-8 right-8 text-sm text-white/60 hover:text-white/90 transition-colors px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm z-[10000]"
              >
                Skip Intro
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
