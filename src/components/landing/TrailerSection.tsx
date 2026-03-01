/**
 * TrailerSection — Full-width cinematic trailer with immersive reveal.
 *
 * - Full-viewport looping gradient/animation background (no real video autoplayed)
 * - Oversized play button with glow ring pulse
 * - Click → blur→scale→glow reveal animation → ProPlayer with full controls
 * - Auto-pauses CinematicSoundEngine during playback
 * - Lazy-loads ProPlayer only when opened
 * - Scroll-out auto-pause via IntersectionObserver
 * - No autoplay, no sound until user clicks
 */

import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useInView,
} from "framer-motion";
import { Play, X, Volume2, Film } from "lucide-react";
import { NeonGlow } from "@/components/eku";
import { cinematicAudio, useSectionCue } from "./CinematicSoundEngine";

/* ── Lazy ProPlayer ──────────────────────────────────────── */
const ProPlayer = lazy(() =>
  import("@/components/ProPlayer").then((m) => ({ default: m.ProPlayer }))
);

/* ── Demo trailer URL placeholder (safe / local assets) ──── */
const TRAILER_PLACEHOLDER_URL = ""; // intentionally empty — no autoplay video

/* ── Floating particles behind poster ────────────────────── */
function FloatingMotes({ count = 12 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/20"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            y: [0, -20 - Math.random() * 30, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}
    </>
  );
}

/* ── Glow pulse ring ─────────────────────────────────────── */
function GlowRing({ reduced }: { reduced: boolean | null }) {
  if (reduced) return null;
  return (
    <>
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary/30"
        animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-accent/20"
        animate={{ scale: [1, 1.9], opacity: [0.3, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
      />
    </>
  );
}

/* ── Section ─────────────────────────────────────────────── */
export function TrailerSection() {
  const sectionRef = useSectionCue("impact", "trailer");
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { amount: 0.25 });

  /* Pause cinematic audio while trailer player is open */
  useEffect(() => {
    cinematicAudio.setPaused(open);
    return () => cinematicAudio.setPaused(false);
  }, [open]);

  /* Close player when section scrolls off-screen */
  useEffect(() => {
    if (!isInView && open) {
      setOpen(false);
    }
  }, [isInView, open]);

  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="relative py-20 sm:py-28 px-4 overflow-hidden"
    >
      {/* Section heading */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="text-center mb-12"
      >
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary/70 mb-3">
          Coming Soon
        </span>
        <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black aurora-text mb-4">
          See the Magic in Motion
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-lg">
          A glimpse into the cinematic worlds your child will explore.
        </p>
      </motion.div>

      <div className="max-w-5xl mx-auto relative z-10" ref={containerRef}>
        <AnimatePresence mode="wait">
          {!open ? (
            /* ── Poster state ──────────────────────────────── */
            <motion.div
              key="poster"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02, filter: "blur(8px)" }}
              transition={{ duration: 0.5 }}
              className="relative aspect-video rounded-3xl overflow-hidden cursor-pointer group"
              onClick={() => setOpen(true)}
              role="button"
              aria-label="Play trailer"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setOpen(true);
              }}
            >
              {/* Gradient poster BG */}
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary)/0.15)] via-[hsl(var(--card)/0.6)] to-[hsl(var(--accent)/0.12)]">
                {/* Ken Burns drift */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10"
                  animate={
                    reduced
                      ? {}
                      : {
                          backgroundPosition: ["0% 0%", "100% 100%"],
                          scale: [1, 1.06],
                        }
                  }
                  transition={{ duration: 12, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                />
                {!reduced && <FloatingMotes />}
              </div>

              {/* Dark film grain overlay */}
              <div className="absolute inset-0 bg-black/30" />

              {/* Film badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 opacity-70">
                <Film className="w-4 h-4 text-white/70" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">
                  EKU Studio Preview
                </span>
              </div>

              {/* Center play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <GlowRing reduced={reduced} />
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/90 backdrop-blur-md flex items-center justify-center shadow-2xl shadow-primary/30 group-hover:bg-primary transition-colors duration-300"
                  >
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" fill="currentColor" />
                  </motion.div>
                </div>
              </div>

              {/* Bottom text */}
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent">
                <h3 className="font-heading text-lg sm:text-xl font-bold text-white">
                  Express Kids Universe — Official Trailer
                </h3>
                <p className="text-xs text-white/60 mt-1 flex items-center gap-2">
                  <Volume2 className="w-3 h-3" /> Click to play with sound
                </p>
              </div>

              {/* Hover glow outline */}
              <div className="absolute inset-0 rounded-3xl border-2 border-primary/0 group-hover:border-primary/30 transition-all duration-500" />
            </motion.div>
          ) : (
            /* ── Player state ──────────────────────────────── */
            <motion.div
              key="player"
              initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {/* Close button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={handleClose}
                className="absolute -top-3 -right-3 z-50 w-10 h-10 rounded-full glass-card border border-border/30 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                aria-label="Close trailer"
              >
                <X className="w-4 h-4" />
              </motion.button>

              {/* ProPlayer or placeholder */}
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 ring-1 ring-primary/10">
                {TRAILER_PLACEHOLDER_URL ? (
                  <Suspense
                    fallback={
                      <div className="aspect-video bg-card flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    }
                  >
                    <ProPlayer
                      url={TRAILER_PLACEHOLDER_URL}
                      title="Express Kids Universe — Official Trailer"
                      showSave={false}
                      onClose={handleClose}
                    />
                  </Suspense>
                ) : (
                  /* Placeholder when no real trailer URL is set */
                  <div className="aspect-video bg-gradient-to-br from-card via-muted to-card flex flex-col items-center justify-center gap-4 p-8">
                    <NeonGlow color="primary" intensity="medium">
                      <Film className="w-16 h-16 text-primary/60" />
                    </NeonGlow>
                    <div className="text-center max-w-sm">
                      <h4 className="font-heading text-xl font-bold text-foreground mb-2">
                        Trailer Coming Soon
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Our cinematic trailer is in production. In the meantime, try creating
                        your own episode — it's free to start!
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleClose}
                      className="px-5 py-2 rounded-xl bg-primary/20 border border-primary/30 text-sm font-semibold text-primary hover:bg-primary/30 transition-colors"
                    >
                      Close Preview
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
