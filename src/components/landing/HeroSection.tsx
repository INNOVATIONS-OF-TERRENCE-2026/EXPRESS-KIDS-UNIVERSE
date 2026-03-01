import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Wand2, Play, Sparkles } from "lucide-react";
import {
  AuroraGradient,
  StarfieldParticles,
  CinematicSpotlight,
  CinematicButton,
  StaggerContainer,
  StaggerItem,
  ShootingStars,
  FloatingOrbs3D,
  NebulaCloud,
} from "@/components/eku";
import { StudioLogoEngine } from "@/components/eku/StudioLogoEngine";

/* ── Ken Burns background montage ─────────────────────────── */
const montageGradients = [
  "radial-gradient(ellipse at 20% 50%, hsl(var(--primary)/0.12) 0%, transparent 70%)",
  "radial-gradient(ellipse at 80% 30%, hsl(var(--accent)/0.10) 0%, transparent 70%)",
  "radial-gradient(ellipse at 50% 80%, hsl(var(--secondary)/0.10) 0%, transparent 70%)",
];

/* ── Entrance variants ─────────────────────────────────────── */
const heroFade = {
  hidden: { opacity: 0, y: 40, filter: "blur(12px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: 0.25 + i * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const glowPulse = {
  initial: { boxShadow: "0 0 0px 0px hsl(var(--primary)/0)" },
  animate: {
    boxShadow: [
      "0 0 20px 4px hsl(var(--primary)/0.25)",
      "0 0 40px 8px hsl(var(--primary)/0.10)",
      "0 0 20px 4px hsl(var(--primary)/0.25)",
    ],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
  },
};

export function HeroSection() {
  const reduced = useReducedMotion();

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* ── Atmospheric layers ──────────────────────────────── */}
      <AuroraGradient intensity="high" />
      <StarfieldParticles count={reduced ? 20 : 90} />
      <CinematicSpotlight />
      <ShootingStars count={reduced ? 1 : 5} />
      <FloatingOrbs3D count={reduced ? 2 : 7} />
      <NebulaCloud variant="mixed" />

      {/* ── Ken Burns montage layer ────────────────────────── */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        {montageGradients.map((bg, i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            style={{ background: bg }}
            animate={
              reduced
                ? {}
                : {
                    scale: [1, 1.15, 1],
                    x: [0, i % 2 === 0 ? 30 : -30, 0],
                    y: [0, i % 2 === 0 ? -20 : 20, 0],
                  }
            }
            transition={{ duration: 18 + i * 4, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="relative z-10 w-full px-4">
        <StaggerContainer className="text-center max-w-5xl mx-auto" delay={0.08}>
          {/* Badge */}
          <StaggerItem>
            <motion.div
              animate={reduced ? {} : { y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-card mb-8 border border-white/10"
            >
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-foreground/80">
                The Future of Children's Storytelling
              </span>
            </motion.div>
          </StaggerItem>

          {/* Logo */}
          <StaggerItem className="flex justify-center mb-6">
            <StudioLogoEngine size="hero" />
          </StaggerItem>

          {/* Headline */}
          <motion.h1
            custom={0}
            variants={heroFade}
            initial="hidden"
            animate="visible"
            className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 aurora-text text-3d leading-[1.05]"
          >
            Where Your Child Becomes&nbsp;the&nbsp;Hero.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            custom={1}
            variants={heroFade}
            initial="hidden"
            animate="visible"
            className="text-lg sm:text-xl md:text-2xl text-muted-foreground/90 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Create stories, voices, animated episodes, and real-world adventures
            — all powered by{" "}
            <span className="text-accent font-semibold">intelligent storytelling</span>.
          </motion.p>

          {/* CTAs */}
          <motion.div
            custom={2}
            variants={heroFade}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.div
              variants={glowPulse}
              initial="initial"
              animate={reduced ? "initial" : "animate"}
              className="rounded-2xl"
            >
              <Link to="/create">
                <CinematicButton size="lg" variant="primary">
                  <Wand2 className="w-5 h-5" />
                  Start Creating Free
                </CinematicButton>
              </Link>
            </motion.div>

            <Link to="/gallery">
              <CinematicButton size="lg" variant="outline">
                <Play className="w-5 h-5" />
                Watch Demo Episode
              </CinematicButton>
            </Link>
          </motion.div>
        </StaggerContainer>
      </div>

      {/* ── Bottom gradient fade ───────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-[5] pointer-events-none" />
    </section>
  );
}
