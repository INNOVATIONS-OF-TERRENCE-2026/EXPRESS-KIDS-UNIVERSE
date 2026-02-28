import { memo, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { brand } from "@/lib/brand";

/**
 * BrandLogo — Single source of truth for Express Kids Studios brand mark.
 *
 * Uses the transparent SVG logo from brand config with size presets,
 * optional text, and GPU-accelerated 3D hover/idle animation.
 *
 * All transforms use `transform` + `opacity` only — zero layout shift.
 */

interface BrandLogoProps {
  /** Preset size token */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  /** Show "EKU" text beside logo */
  showText?: boolean;
  /** Additional class names */
  className?: string;
  /** Enable idle 3D rotation animation */
  animate3D?: boolean;
}

const SIZE_MAP = {
  xs: { img: "w-6 h-6", text: "text-sm" },
  sm: { img: "w-8 h-8", text: "text-lg" },
  md: { img: "w-12 h-12", text: "text-xl" },
  lg: { img: "w-20 h-20", text: "text-2xl" },
  xl: { img: "w-32 h-32", text: "text-3xl" },
  hero: { img: "w-48 h-48 md:w-64 md:h-64", text: "text-4xl md:text-5xl" },
} as const;

const LOGO_SRC = brand.logoSrc;
const LOGO_FALLBACK = brand.logoFallback;

export const BrandLogo = memo(function BrandLogo({
  size = "md",
  showText = false,
  className = "",
  animate3D = true,
}: BrandLogoProps) {
  const s = SIZE_MAP[size];
  const [imgSrc, setImgSrc] = useState<string>(LOGO_SRC);

  const handleImgError = useCallback(() => {
    setImgSrc((prev) => (prev === LOGO_SRC ? LOGO_FALLBACK : LOGO_FALLBACK));
  }, []);

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
            animate3D
              ? {
                  rotateY: [0, 4, -4, 0],
                  rotateX: [0, -2, 2, 0],
                }
              : undefined
          }
          transition={
            animate3D
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
            src={imgSrc}
            alt={brand.logoAlt}
            className={`${s.img} object-contain relative z-10`}
            style={{
              background: "transparent",
              border: "none",
              boxShadow: "none",
              filter: "drop-shadow(0 0 16px rgba(168,85,247,0.4))",
            }}
            onError={handleImgError}
            loading="lazy"
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
