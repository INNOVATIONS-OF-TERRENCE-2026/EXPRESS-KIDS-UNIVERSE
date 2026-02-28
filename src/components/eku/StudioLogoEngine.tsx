import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { brand } from "@/lib/brand";

/**
 * StudioLogoEngine — Cinematic GPU-accelerated 3D animation system
 * for the Express Kids Studios brand logo.
 *
 * Layers:
 *  1. Radial energy glow (background pulse)
 *  2. 3D depth float + cursor-driven tilt (desktop only)
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

const SIZE_CONFIG = {
  md: { imgClass: "w-16 h-16 md:w-20 md:h-20", ring: 80, sparkles: 0 },
  lg: { imgClass: "w-24 h-24 md:w-32 md:h-32", ring: 100, sparkles: 4 },
  xl: { imgClass: "w-40 h-40 md:w-48 md:h-48", ring: 140, sparkles: 6 },
  hero: { imgClass: "w-56 h-56 md:w-72 md:h-72 lg:w-[22rem] lg:h-[22rem]", ring: 200, sparkles: 8 },
} as const;

const LOGO_SRC = brand.logoSrc;
const LOGO_FALLBACK = brand.logoFallback;

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

  // Tilt state driven by mouse (desktop only)
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [imgSrc, setImgSrc] = useState<string>(LOGO_SRC);
  const [clicked, setClicked] = useState(false);

  const handleImgError = useCallback(() => {
    setImgSrc((prev) => (prev === LOGO_SRC ? LOGO_FALLBACK : LOGO_FALLBACK));
  }, []);

  // Cursor-driven 3D tilt (desktop only, RAF-throttled)
  useEffect(() => {
    if (prefersReducedMotion) return;

    const isMobile = window.matchMedia("(hover: none)").matches;
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current) return; // throttle to 1 per frame
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        const el = containerRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        // Normalize to -1..1 relative to element center
        const nx = (e.clientX - cx) / (rect.width / 2);
        const ny = (e.clientY - cy) / (rect.height / 2);

        setTilt({
          x: clamp(ny * -4, 4), // rotateX (inverted Y)
          y: clamp(nx * 4, 4),  // rotateY
        });
      });
    };

    const handleMouseLeave = () => {
      setTilt({ x: 0, y: 0 });
    };

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
      style={{
        perspective: "1200px",
        background: "transparent",
      }}
      // Entrance animation
      initial={{ opacity: 0, scale: 0.6, rotateY: -20 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{
        duration: 1,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.15,
      }}
    >
      {/* Layer 1: Radial energy glow */}
      <motion.div
        className="absolute inset-0 -z-10 rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(168,85,247,0.18) 0%, rgba(6,182,212,0.08) 40%, transparent 70%)",
          filter: "blur(40px)",
          transform: "scale(1.6)",
        }}
        animate={
          shouldAnimate
            ? { opacity: [0.5, 0.8, 0.5], scale: [1.5, 1.7, 1.5] }
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
          shouldAnimate
            ? {
                y: [0, -10, 0],
                scale: [1, 1.015, 1],
              }
            : undefined
        }
        transition={
          shouldAnimate
            ? { duration: 7, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
        whileHover={{
          scale: 1.06,
          transition: { duration: 0.3 },
        }}
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
              const colors = ["#a855f7", "#06b6d4", "#f59e0b", "#ec4899", "#4ade80", "#fff", "#06b6d4", "#a855f7"];
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

        {/* Layer 4: Light sweep container */}
        <div
          className={`relative overflow-hidden rounded-full ${shouldAnimate ? "studio-light-sweep" : ""}`}
          style={{ background: "transparent" }}
        >
          {/* Core logo image */}
          <img
            src={imgSrc}
            alt={brand.logoAlt}
            className={`${config.imgClass} object-contain relative z-10`}
            style={{
              background: "transparent",
              border: "none",
              boxShadow: "none",
              filter: "drop-shadow(0 0 24px rgba(168,85,247,0.35)) drop-shadow(0 0 48px rgba(6,182,212,0.15))",
              willChange: "transform",
            }}
            onError={handleImgError}
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
                "radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)",
            }}
          />
        )}
      </motion.div>

      {/* Layer 6: Depth shadow field (static, no animation cost) */}
      <div
        className="absolute inset-0 -z-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(168,85,247,0.06) 0%, transparent 60%)",
          filter: "blur(60px)",
          transform: "scale(2) translateY(10%)",
        }}
      />
    </motion.div>
  );
});
