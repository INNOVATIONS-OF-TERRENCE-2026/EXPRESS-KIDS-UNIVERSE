import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Pen, Image, Mic, Film, Tv, FolderOpen } from "lucide-react";
import { NeonGlow } from "@/components/eku";

/* ── Pipeline steps ──────────────────────────────────────── */
const STEPS = [
  { icon: Pen, label: "Story", color: "primary" },
  { icon: Image, label: "Scene Art", color: "accent" },
  { icon: Mic, label: "Voice", color: "secondary" },
  { icon: Film, label: "Animation", color: "primary" },
  { icon: Tv, label: "Episode", color: "accent" },
  { icon: FolderOpen, label: "Gallery", color: "secondary" },
] as const;

/* ── Connector dot ───────────────────────────────────────── */
function Connector({ index }: { index: number }) {
  return (
    <motion.div
      className="hidden lg:flex items-center justify-center shrink-0"
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.25 + index * 0.1, type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="w-12 h-[2px] bg-gradient-to-r from-primary/30 to-accent/30 relative">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/60 to-accent/60"
          animate={{ scaleX: [0, 1, 0], originX: 0 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
        />
      </div>
    </motion.div>
  );
}

/* ── Floating duration counter ───────────────────────────── */
function DurationCounter() {
  return (
    <motion.div
      className="absolute -top-8 right-4 sm:right-12 glass-card px-4 py-2 rounded-full border border-accent/20"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 1 }}
    >
      <motion.span
        className="text-sm font-semibold text-accent"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Up to 15-minute episodes
      </motion.span>
    </motion.div>
  );
}

/* ── Section ─────────────────────────────────────────────── */
export function StudioProSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgX = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);

  return (
    <section
      ref={sectionRef}
      className="relative py-28 sm:py-36 px-4 overflow-hidden"
    >
      {/* Parallax gradient bg */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={reduced ? {} : { x: bgX }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      </motion.div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent/70 mb-3">
            Studio Pro Pipeline
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black aurora-text mb-4">
            From Storybook to Streaming&nbsp;Series.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Watch your idea transform through six cinematic production stages.
          </p>
        </motion.div>

        {/* Pipeline */}
        <div className="relative flex flex-wrap lg:flex-nowrap items-center justify-center gap-4 lg:gap-0">
          <DurationCounter />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="contents">
                {/* Step card */}
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: 0.15 + i * 0.1,
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex flex-col items-center gap-3 group"
                >
                  <NeonGlow color={step.color as any} intensity="low" pulse={false}>
                    <motion.div
                      whileHover={reduced ? {} : { scale: 1.1, y: -4 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18 }}
                      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl glass-card-elevated flex items-center justify-center border border-${step.color}/20 group-hover:border-${step.color}/40 transition-colors duration-300`}
                    >
                      <Icon className={`w-9 h-9 sm:w-10 sm:h-10 text-${step.color}`} />
                    </motion.div>
                  </NeonGlow>
                  <span className="text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                    {step.label}
                  </span>
                  {/* Step number */}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    Stage {String(i + 1).padStart(2, "0")}
                  </span>
                </motion.div>

                {/* Connector */}
                {i < STEPS.length - 1 && <Connector index={i} />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
