import { motion } from "framer-motion";
import { brand } from "@/lib/brand";

interface LogoBrandProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  showText?: boolean;
  className?: string;
  animate3D?: boolean;
}

const sizeMap = {
  sm: { img: "w-8 h-8", text: "text-lg" },
  md: { img: "w-12 h-12", text: "text-xl" },
  lg: { img: "w-20 h-20", text: "text-2xl" },
  xl: { img: "w-32 h-32", text: "text-3xl" },
  hero: { img: "w-48 h-48 md:w-64 md:h-64", text: "text-4xl md:text-5xl" },
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
        <div className={`absolute inset-0 ${s.img} rounded-full bg-aurora-gradient blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-500`} />
        <div className={`absolute inset-0 ${s.img} rounded-full`} style={{
          background: "radial-gradient(circle, hsl(280 80% 60% / 0.3), transparent 70%)",
          filter: "blur(12px)",
        }} />

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
            className={`${s.img} object-contain drop-shadow-[0_0_20px_rgba(168,85,247,0.5)] relative z-10`}
            onError={(e) => { (e.target as HTMLImageElement).src = brand.logoFallback; }}
          />
        </motion.div>

        {(size === "hero" || size === "xl") && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  left: "50%", top: "50%",
                  background: ["#a855f7", "#06b6d4", "#f59e0b", "#ec4899", "#4ade80", "#fff"][i],
                  boxShadow: `0 0 6px ${["#a855f7", "#06b6d4", "#f59e0b", "#ec4899", "#4ade80", "#fff"][i]}`,
                }}
                animate={{
                  x: [Math.cos((i / 6) * Math.PI * 2) * (size === "hero" ? 140 : 80), Math.cos((i / 6) * Math.PI * 2 + Math.PI * 2) * (size === "hero" ? 140 : 80)],
                  y: [Math.sin((i / 6) * Math.PI * 2) * (size === "hero" ? 140 : 80), Math.sin((i / 6) * Math.PI * 2 + Math.PI * 2) * (size === "hero" ? 140 : 80)],
                  opacity: [0.4, 1, 0.4],
                  scale: [1, 1.5, 1],
                }}
                transition={{ duration: 10 + i, delay: i * 0.5, repeat: Infinity, ease: "linear" }}
              />
            ))}
          </>
        )}
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
