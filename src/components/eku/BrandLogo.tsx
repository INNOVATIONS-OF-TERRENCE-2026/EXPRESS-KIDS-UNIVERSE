import { memo } from "react";
import { motion } from "framer-motion";
import { brand } from "@/lib/brand";

/**
 * BrandLogo — Single source of truth for Express Kids Universe brand mark.
 *
 * Uses the official cinematic full logo (PNG) as the ONLY source.
 * Renders inside a perfect circle: overflow:hidden + border-radius:50%
 * + object-fit:cover at 120% for full fill with zero square edges.
 * GPU-composited: transform + opacity only — zero layout shift.
 *
 * Variants:
 *  - nav:    compact circle, subtle glow, no float
 *  - hero:   large circle, full glow + float animation
 *  - auth:   medium-large circle with entrance animation
 *  - footer: compact circle, no animations, muted glow
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

/* Circle wrapper dimensions — equal w/h enforces 1:1 aspect ratio */
const SIZE_MAP = {
  xs:   { wrapper: "w-7 h-7",   text: "text-sm" },
  sm:   { wrapper: "w-10 h-10", text: "text-lg" },
  md:   { wrapper: "w-14 h-14", text: "text-xl" },
  lg:   { wrapper: "w-24 h-24", text: "text-2xl" },
  xl:   { wrapper: "w-36 h-36", text: "text-3xl" },
  hero: { wrapper: "w-52 h-52 md:w-72 md:h-72", text: "text-4xl md:text-5xl" },
} as const;

/** Variant-specific glow box-shadows applied to circular wrapper */
const GLOW_MAP: Record<string, string> = {
  nav:    "0 0 8px rgba(255,180,0,0.15)",
  hero:   "0 0 40px rgba(255,180,0,0.2), 0 0 80px rgba(168,85,247,0.12)",
  auth:   "0 0 28px rgba(255,180,0,0.18), 0 0 56px rgba(168,85,247,0.1)",
  footer: "0 0 4px rgba(255,180,0,0.08)",
};

/** Variant-specific drop-shadow filters on the image */
const FILTER_MAP: Record<string, string> = {
  nav:    "drop-shadow(0 0 4px rgba(255,180,0,0.2))",
  hero:   "drop-shadow(0 0 18px rgba(255,180,0,0.5)) drop-shadow(0 0 40px rgba(168,85,247,0.15))",
  auth:   "drop-shadow(0 0 14px rgba(255,180,0,0.4)) drop-shadow(0 0 28px rgba(168,85,247,0.12))",
  footer: "drop-shadow(0 0 2px rgba(255,180,0,0.1))",
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
  const wrapperGlow = GLOW_MAP[variant] ?? GLOW_MAP.hero;
  const imgFilter = FILTER_MAP[variant] ?? FILTER_MAP.hero;

  return (
    <motion.div
      className={`inline-flex items-center gap-3 ${className}`}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {/* Circular logo container */}
      <div
        className="relative group"
        style={{
          perspective: "800px",
          background: "transparent",
        }}
      >
        {/* 3D animated wrapper */}
        <motion.div
          className="relative will-change-transform"
          animate={
            shouldAnimate
              ? { rotateY: [0, 4, -4, 0], rotateX: [0, -2, 2, 0] }
              : undefined
          }
          transition={
            shouldAnimate
              ? { duration: 8, repeat: Infinity, ease: "easeInOut" }
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
          {/* Perfect circle wrapper — overflow:hidden clips to circle */}
          <div
            className={`${s.wrapper} rounded-full overflow-hidden relative`}
            style={{
              background:
                "radial-gradient(circle at center, rgba(255,200,0,0.04), transparent 70%)",
              boxShadow: wrapperGlow,
            }}
          >
            <img
              src={brand.logoSrc}
              alt={brand.logoAlt}
              className="w-[120%] h-[120%] absolute top-1/2 left-1/2 z-10"
              style={{
                transform: "translate(-50%, -50%)",
                objectFit: "cover",
                objectPosition: "center center",
                border: "none",
                background: "transparent",
                imageRendering: "auto",
                filter: imgFilter,
              }}
              loading={variant === "hero" ? "eager" : "lazy"}
              decoding="async"
            />
          </div>
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
