import { useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Film,
  Mic,
  Fingerprint,
  Gamepad2,
  ShoppingBag,
  Sparkles,
  X,
  Palette,
  Brain,
  Clock,
  Save,
  Volume2,
  PlayCircle,
  Headphones,
  RefreshCw,
  Layers,
  Globe,
  Users,
  Box,
  DollarSign,
  ArrowUp,
  ChevronRight,
} from "lucide-react";
import { Tilt3DCard, NeonGlow } from "@/components/eku";

/* ── Feature data ────────────────────────────────────────── */
interface FeaturePillar {
  icon: React.ElementType;
  title: string;
  tagline: string;
  color: "primary" | "secondary" | "accent" | "aurora";
  details: { icon: React.ElementType; text: string }[];
}

const PILLARS: FeaturePillar[] = [
  {
    icon: BookOpen,
    title: "Story Creation",
    tagline: "Personalized adventures that cast your child as the star.",
    color: "primary",
    details: [
      { icon: Sparkles, text: "Personalized stories starring your child" },
      { icon: Users, text: "Family & friends woven into every tale" },
      { icon: Brain, text: "Lesson themes — kindness, confidence & more" },
      { icon: Palette, text: "Mood engine adapts tone to your child" },
      { icon: Save, text: "Auto-save wizard — never lose progress" },
    ],
  },
  {
    icon: Film,
    title: "Video Episodes",
    tagline: "Full animated episodes with Hollywood-grade pacing.",
    color: "accent",
    details: [
      { icon: PlayCircle, text: "Full cinematic animated episodes" },
      { icon: Clock, text: "Duration presets — 2, 5, or 15 minutes" },
      { icon: Film, text: "Hollywood 3-act story structure" },
      { icon: Layers, text: "Color grading & cinematic transitions" },
      { icon: Save, text: "Auto-save to your personal gallery" },
    ],
  },
  {
    icon: Mic,
    title: "Voice Studio",
    tagline: "Character voices that bring every scene to life.",
    color: "secondary",
    details: [
      { icon: Users, text: "Unique voice for every character" },
      { icon: Volume2, text: "Adjustable narration speed & pitch" },
      { icon: Headphones, text: "Real-time streaming playback" },
      { icon: BookOpen, text: "Read-aloud mode with highlighting" },
      { icon: RefreshCw, text: "Instant voice preview & switching" },
    ],
  },
  {
    icon: Fingerprint,
    title: "Character Continuity",
    tagline: "Characters stay consistent across every episode & season.",
    color: "aurora",
    details: [
      { icon: Fingerprint, text: "Consistent character design — every frame" },
      { icon: Layers, text: "Multi-season memory system" },
      { icon: ArrowUp, text: "Story arcs that evolve across episodes" },
      { icon: Globe, text: "World-building memory layers" },
      { icon: Brain, text: "Character growth tracking over time" },
    ],
  },
  {
    icon: Gamepad2,
    title: "Interactive & AR",
    tagline: "Choose-your-own endings and project characters into your room.",
    color: "primary",
    details: [
      { icon: Gamepad2, text: "Choose-your-own-ending adventures" },
      { icon: Globe, text: "AR character projection into your room" },
      { icon: Users, text: "Safe parental approval system" },
      { icon: Layers, text: "Canon path tracking for continuity" },
      { icon: Sparkles, text: "Character interactions — wave, dance, talk" },
    ],
  },
  {
    icon: ShoppingBag,
    title: "Creator Economy",
    tagline: "Turn episode moments into real-world toy concepts.",
    color: "accent",
    details: [
      { icon: Box, text: "Auto-generated toy & merch concepts" },
      { icon: ShoppingBag, text: "Product mockups from episode content" },
      { icon: DollarSign, text: "Built-in profit validation engine" },
      { icon: Sparkles, text: "12 product types — plush to playset" },
      { icon: ArrowUp, text: "360° product turntable renders" },
    ],
  },
];

/* ── Color utilities ─────────────────────────────────────── */
const colorBg: Record<string, string> = {
  primary: "bg-primary/10 border-primary/20 group-hover:bg-primary/15",
  secondary: "bg-secondary/10 border-secondary/20 group-hover:bg-secondary/15",
  accent: "bg-accent/10 border-accent/20 group-hover:bg-accent/15",
  aurora: "bg-purple-500/10 border-purple-500/20 group-hover:bg-purple-500/15",
};
const colorText: Record<string, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  accent: "text-accent",
  aurora: "text-purple-400",
};

/* ── Card Component ──────────────────────────────────────── */
function FeatureCard({ pillar, index }: { pillar: FeaturePillar; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const reduced = useReducedMotion();
  const Icon = pillar.icon;

  const toggle = useCallback(() => setExpanded((p) => !p), []);

  return (
    <>
      {/* Card */}
      <Tilt3DCard maxTilt={reduced ? 0 : 8} glareEnabled={!reduced}>
        <motion.button
          initial={{ opacity: 0, y: 50, rotateX: 8 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: index * 0.08, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          onClick={toggle}
          className="glass-card-elevated p-8 text-left group holographic w-full h-full cursor-pointer relative overflow-hidden focus-ring rounded-3xl"
          aria-expanded={expanded}
        >
          {/* Ripple on click */}
          <motion.span
            className="absolute inset-0 rounded-3xl pointer-events-none"
            whileTap={{
              background: "radial-gradient(circle at center, hsl(var(--primary)/0.08) 0%, transparent 70%)",
            }}
          />

          {/* Glow border anim */}
          <motion.span
            className="absolute inset-0 rounded-3xl pointer-events-none border border-transparent"
            whileHover={{
              borderColor: `hsl(var(--${pillar.color === "aurora" ? "primary" : pillar.color})/0.3)`,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Icon */}
          <NeonGlow color={pillar.color} intensity="low" pulse={false} className="inline-block mb-5">
            <div
              className={`w-16 h-16 rounded-2xl ${colorBg[pillar.color]} border flex items-center justify-center transition-all duration-300`}
            >
              <Icon className={`w-8 h-8 ${colorText[pillar.color]}`} />
            </div>
          </NeonGlow>

          {/* Text */}
          <h3 className="font-heading text-xl font-bold mb-2">{pillar.title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">{pillar.tagline}</p>

          {/* Expand hint */}
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary/70 group-hover:text-primary transition-colors">
            Explore <ChevronRight className="w-3 h-3" />
          </span>
        </motion.button>
      </Tilt3DCard>

      {/* Expanded overlay */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={toggle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Panel */}
            <motion.div
              className="relative glass-card-elevated p-8 sm:p-10 max-w-lg w-full rounded-3xl holographic z-10"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            >
              <button
                onClick={toggle}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <NeonGlow color={pillar.color} intensity="medium" pulse className="inline-block mb-5">
                <div
                  className={`w-16 h-16 rounded-2xl ${colorBg[pillar.color]} border flex items-center justify-center`}
                >
                  <Icon className={`w-8 h-8 ${colorText[pillar.color]}`} />
                </div>
              </NeonGlow>

              <h3 className="font-heading text-2xl font-bold mb-2">{pillar.title}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">{pillar.tagline}</p>

              <ul className="space-y-3">
                {pillar.details.map((d, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    className="flex items-start gap-3"
                  >
                    <d.icon className={`w-5 h-5 ${colorText[pillar.color]} mt-0.5 shrink-0`} />
                    <span className="text-sm text-foreground/90">{d.text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Section ─────────────────────────────────────────────── */
export function FeatureUniverseSection() {
  return (
    <section className="relative py-28 sm:py-36 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary/70 mb-3">
            Platform Capabilities
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black aurora-text mb-4">
            The Feature Universe
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Six creative pillars that power every story, voice, video, and experience.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {PILLARS.map((p, i) => (
            <FeatureCard key={p.title} pillar={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
