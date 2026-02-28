import { memo, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { brand } from "@/lib/brand";

/**
 * StudioLogoEngine — Cinematic GPU-accelerated 3D animation system
 * for the Express Kids Studios official cinematic logo.
 *
 * Renders the logo inside a perfect circle using overflow:hidden +
 * border-radius:50% + object-fit:cover at 120% scale for full fill.
 * Warm golden glow extracted from the logo palette.
 *
 * Layers:
 *  1. Radial energy glow (background pulse — warm golden)
 *  2. 3D depth float + cursor-driven tilt (desktop only, ±4deg)
 *  3. Orbital sparkle ring (CSS keyframe)
 *  4. Cinematic light sweep (::after pseudo via CSS class)
 *  5. Depth shadow field
 *  6. Entrance animation
 *  7. Hover / click micro-interactions
 *
 * Performance:
 *  - All motion via `transform` + `opacity` (GPU composited)
 *  - `will-change: transform` on animated layers
 *  - requestAnimationFrame-throttled mouse tracking
 *  - Automatic cleanup on unmount
 *  - Reduced-motion media query respected
 */

interface StudioLogoEngineProps {
  /** Size preset for the logo */
  size?: "md" | "lg" | "xl" | "hero";
  /** Additional class name for outer wrapper */
  className?: string;
}

/* Circle wrapper sizes — aspect-ratio: 1/1 enforced via equal w/h */
const SIZE_CONFIG = {
  md:   { wrapper: "w-24 h-24 md:w-28 md:h-28",                            ring: 80,  sparkles: 0 },
  lg:   { wrapper: "w-36 h-36 md:w-44 md:h-44",                            ring: 120, sparkles: 4 },
  xl:   { wrapper: "w-52 h-52 md:w-60 md:h-60",                            ring: 160, sparkles: 6 },
  hero: { wrapper: "w-64 h-64 md:w-80 md:h-80 lg:w-[22rem] lg:h-[22rem]", ring: 220, sparkles: 8 },
} as const;

const LOGO_SRC = brand.logoSrc;

/** Clamp a value between -max and +max */
const clamp = (v: number, max: number) => Math.min(Math.max(v, -max), max);

export const StudioLogoEngine = memo(function StudioLogoEngine({
  size = "hero",
  className = "",
}: StudioLogoEngineProps) {
  const config = SIZE_CONFIG[size];
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const prefersReducedMotion = useReducedMotion();

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [clicked, setClicked] = useState(false);

  // Cursor-driven 3D tilt (desktop only, RAF-throttled)
  useEffect(() => {
    if (prefersReducedMotion) return;
    const isMobile = window.matchMedia("(hover: none)").matches;
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const nx = (e.clientX - cx) / (rect.width / 2);
        const ny = (e.clientY - cy) / (rect.height / 2);
        setTilt({ x: clamp(ny * -4, 4), y: clamp(nx * 4, 4) });
      });
    };

    const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [prefersReducedMotion]);

  // Click ripple auto-reset
  useEffect(() => {
    if (!clicked) return;
    const t = setTimeout(() => setClicked(false), 600);
    return () => clearTimeout(t);
  }, [clicked]);

  const shouldAnimate = !prefersReducedMotion;

  return (
    <motion.div
      ref={containerRef}
      className={`studio-logo-engine relative inline-flex items-center justify-center ${className}`}
      style={{ perspective: "1200px", background: "transparent" }}
      initial={{ opacity: 0, scale: 0.6, rotateY: -20 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
    >
      {/* Layer 1: Radial energy glow — warm golden from logo palette */}
      <motion.div
        className="absolute inset-0 -z-10 rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,180,0,0.15) 0%, rgba(168,85,247,0.1) 40%, transparent 70%)",
          filter: "blur(40px)",
          transform: "scale(1.6)",
        }}
        animate={
          shouldAnimate
            ? { opacity: [0.5, 0.85, 0.5], scale: [1.5, 1.7, 1.5] }
            : undefined
        }
        transition={
          shouldAnimate
            ? { duration: 6, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      />

      {/* Layer 2: 3D floating + tilt container */}
      <motion.div
        className="relative will-change-transform"
        style={{
          transformStyle: "preserve-3d",
          transform: shouldAnimate
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
            : undefined,
          transition: "transform 0.15s ease-out",
        }}
        animate={
          shouldAnimate ? { y: [0, -8, 0], scale: [1, 1.012, 1] } : undefined
        }
        transition={
          shouldAnimate
            ? { duration: 7, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
        whileHover={{ scale: 1.06, transition: { duration: 0.3 } }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setClicked(true)}
      >
        {/* Layer 3: Orbital sparkle ring */}
        {shouldAnimate && config.sparkles > 0 && (
          <div
            className="absolute inset-0 studio-sparkle-ring will-change-transform"
            style={{
              width: config.ring * 2,
              height: config.ring * 2,
              left: "50%",
              top: "50%",
              marginLeft: -config.ring,
              marginTop: -config.ring,
              pointerEvents: "none",
            }}
          >
            {Array.from({ length: config.sparkles }, (_, i) => {
              const angle = (i / config.sparkles) * 360;
              const colors = [
                "#f59e0b", "#a855f7", "#06b6d4", "#ec4899",
                "#4ade80", "#ff6b35", "#06b6d4", "#f59e0b",
              ];
              return (
                <span
                  key={i}
                  className="absolute block rounded-full studio-sparkle"
                  style={{
                    width: 3,
                    height: 3,
                    background: colors[i % colors.length],
                    boxShadow: `0 0 6px ${colors[i % colors.length]}`,
                    left: "50%",
                    top: "50%",
                    transform: `rotate(${angle}deg) translateX(${config.ring}px) rotate(-${angle}deg)`,
                    opacity: 0.6,
                    animationDelay: `${i * 0.4}s`,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Layer 4: Circular logo container — perfect circle crop */}
        <div
          className={`${config.wrapper} relative rounded-full overflow-hidden ${shouldAnimate ? "studio-light-sweep" : ""}`}
          style={{
            background:
              "radial-gradient(circle at center, rgba(255,200,0,0.06), transparent 70%)",
            boxShadow:
              "0 0 60px rgba(255,180,0,0.12), 0 0 120px rgba(168,85,247,0.08)",
          }}
        >
          {/* Core logo image — object-fit:cover fills circle completely */}
          <img
            src={LOGO_SRC}
            alt={brand.logoAlt}
            className="w-[120%] h-[120%] absolute top-1/2 left-1/2 z-10"
            style={{
              transform: "translate(-50%, -50%)",
              objectFit: "cover",
              objectPosition: "center center",
              border: "none",
              background: "transparent",
              imageRendering: "auto",
              filter:
                "drop-shadow(0 0 18px rgba(255,180,0,0.5)) drop-shadow(0 0 40px rgba(168,85,247,0.2))",
              willChange: "transform",
            }}
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Layer 5: Click ripple */}
        {clicked && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none z-20"
            initial={{ scale: 0.5, opacity: 0.6 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              background:
                "radial-gradient(circle, rgba(255,180,0,0.3) 0%, transparent 70%)",
            }}
          />
        )}
      </motion.div>

      {/* Layer 6: Depth shadow field */}
      <div
        className="absolute inset-0 -z-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,180,0,0.04) 0%, transparent 60%)",
          filter: "blur(60px)",
          transform: "scale(2) translateY(10%)",
        }}
      />
    </motion.div>
  );
});
