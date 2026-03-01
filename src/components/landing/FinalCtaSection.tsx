import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Rocket, Sparkles } from "lucide-react";
import { CinematicButton } from "@/components/eku";

export function FinalCtaSection() {
  const reduced = useReducedMotion();

  return (
    <section className="relative py-32 sm:py-40 px-4 overflow-hidden">
      {/* Cinematic burst bg */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial burst */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary)/0.12) 0%, hsl(var(--accent)/0.06) 40%, transparent 70%)",
          }}
          animate={reduced ? {} : { scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Light rays */}
        {!reduced &&
          Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 h-[1px] origin-left"
              style={{
                width: "50vw",
                background: `linear-gradient(to right, hsl(var(--primary)/0.08), transparent)`,
                transform: `rotate(${i * 60}deg)`,
              }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Floating sparkle */}
        <motion.div
          className="inline-flex mb-6"
          animate={reduced ? {} : { y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-10 h-10 text-accent/60" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black aurora-text mb-6 leading-[1.1]"
        >
          The Ultimate Kids&nbsp;Studio.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="text-lg sm:text-xl text-muted-foreground/90 mb-10 max-w-xl mx-auto leading-relaxed"
        >
          Stories, voices, episodes, AR adventures, and a creator economy
          — all in one magical platform.
        </motion.p>

        {/* Glowing CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="inline-block"
        >
          <motion.div
            animate={
              reduced
                ? {}
                : {
                    boxShadow: [
                      "0 0 20px 4px hsl(var(--primary)/0.20)",
                      "0 0 50px 10px hsl(var(--primary)/0.10)",
                      "0 0 20px 4px hsl(var(--primary)/0.20)",
                    ],
                  }
            }
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-2xl"
          >
            <Link to="/create">
              <CinematicButton size="lg" variant="primary">
                <Rocket className="w-5 h-5" />
                Start Free Today
              </CinematicButton>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
