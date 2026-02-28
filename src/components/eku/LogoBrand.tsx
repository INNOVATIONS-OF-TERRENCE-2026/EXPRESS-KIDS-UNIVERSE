import { motion } from "framer-motion";
import { brand } from "@/lib/brand";

/**
 * @deprecated Use BrandLogo instead. Kept for backward compatibility.
 */
interface LogoBrandProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  showText?: boolean;
  className?: string;
  animate3D?: boolean;
}

const sizeMap = {
  sm: { img: "w-10 h-10", text: "text-lg" },
  md: { img: "w-14 h-14", text: "text-xl" },
  lg: { img: "w-24 h-24", text: "text-2xl" },
  xl: { img: "w-36 h-36", text: "text-3xl" },
  hero: { img: "w-52 h-52 md:w-72 md:h-72", text: "text-4xl md:text-5xl" },
};

/** Radial gradient mask — dissolves hard edges */
const LOGO_MASK: React.CSSProperties = {
  WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)",
  maskImage: "radial-gradient(circle, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)",
};

export function LogoBrand({ size = "md", showText = false, className = "", animate3D = true }: LogoBrandProps) {
  const s = sizeMap[size];

  return (
    <motion.div
      className={`flex items-center gap-3 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div className="relative group" style={{ perspective: "600px" }}>
        <motion.div
          className="relative"
          animate={animate3D ? {
            rotateY: [0, 5, -5, 0],
            rotateX: [0, -3, 3, 0],
          } : undefined}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.1, rotateY: 15, rotateX: -10, transition: { duration: 0.4 } }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <img
            src={brand.logoSrc}
            alt={brand.logoAlt}
            className={`${s.img} object-contain relative z-10`}
            style={{
              filter: "drop-shadow(0 0 20px rgba(168,85,247,0.5))",
              background: "transparent",
              ...LOGO_MASK,
            }}
          />
        </motion.div>
      </div>

      {showText && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <span className={`font-heading font-black ${s.text} aurora-text`}>
            {brand.name}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
