import { memo } from "react";
import { motion } from "framer-motion";
import { brand } from "@/lib/brand";

/**
 * BrandLogo — Single source of truth for Express Kids Universe brand mark.
 *
 * Uses the official cinematic full logo (PNG) as the ONLY source.
 * Applies radial CSS mask for seamless transparent edge fade.
 * GPU-composited: transform + opacity only — zero layout shift.
 *
 * Variants:
 *  - nav:   compact, subtle glow, no float
 *  - hero:  large, full glow + float animation
 *  - auth:  medium-large with entrance animation
 *  - footer: compact, no animations, muted glow
 */

interface BrandLogoProps {
  /** Preset size token */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  /** Context variant for styling adaptation */
  variant?: "nav" | "hero" | "auth" | "footer";
  /** Show brand name text beside logo */
  showText?: boolean;
  /** Additional class names */
  className?: string;
  /** Enable idle 3D rotation animation */
  animate3D?: boolean;
}

const SIZE_MAP = {
  xs: { img: "w-7 h-7", text: "text-sm" },
  sm: { img: "w-10 h-10", text: "text-lg" },
  md: { img: "w-14 h-14", text: "text-xl" },
  lg: { img: "w-24 h-24", text: "text-2xl" },
  xl: { img: "w-36 h-36", text: "text-3xl" },
  hero: { img: "w-52 h-52 md:w-72 md:h-72", text: "text-4xl md:text-5xl" },
} as const;

/** Radial gradient mask — dissolves hard edges into transparency */
const LOGO_MASK: React.CSSProperties = {
  WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)",
  maskImage: "radial-gradient(circle, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)",
};

/** Variant-specific glow filters */
const GLOW_MAP: Record<string, string> = {
  nav: "drop-shadow(0 0 6px rgba(168,85,247,0.25))",
  hero: "drop-shadow(0 0 28px rgba(168,85,247,0.4)) drop-shadow(0 0 56px rgba(6,182,212,0.2))",
  auth: "drop-shadow(0 0 20px rgba(168,85,247,0.35)) drop-shadow(0 0 40px rgba(245,158,11,0.15))",
  footer: "drop-shadow(0 0 4px rgba(168,85,247,0.15))",
};

export const BrandLogo = memo(function BrandLogo({
  size = "md",
  variant = "hero",
  showText = false,
  className = "",
  animate3D = true,
}: BrandLogoProps) {
  const s = SIZE_MAP[size];
  const shouldAnimate = animate3D && variant !== "footer";
  const glowFilter = GLOW_MAP[variant] ?? GLOW_MAP.hero;

  return (
    <motion.div
      className={`inline-flex items-center gap-3 ${className}`}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {/* Logo image container — transparent, no background */}
      <div
        className="relative group"
        style={{
          perspective: "800px",
          background: "transparent",
          border: "none",
          boxShadow: "none",
        }}
      >
        {/* 3D animated wrapper */}
        <motion.div
          className="relative will-change-transform"
          animate={
            shouldAnimate
              ? {
                  rotateY: [0, 4, -4, 0],
                  rotateX: [0, -2, 2, 0],
                }
              : undefined
          }
          transition={
            shouldAnimate
              ? {
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : undefined
          }
          whileHover={{
            scale: 1.08,
            rotateY: 12,
            rotateX: -6,
            transition: { duration: 0.35, ease: "easeOut" },
          }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <img
            src={brand.logoSrc}
            alt={brand.logoAlt}
            className={`${s.img} object-contain relative z-10`}
            style={{
              background: "transparent",
              border: "none",
              boxShadow: "none",
              filter: glowFilter,
              ...LOGO_MASK,
            }}
            loading={variant === "hero" ? "eager" : "lazy"}
            decoding="async"
          />
        </motion.div>
      </div>

      {/* Optional text label */}
      {showText && (
        <motion.span
          className={`font-heading font-black ${s.text} aurora-text`}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          {brand.shortName}
        </motion.span>
      )}
    </motion.div>
  );
});
