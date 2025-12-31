import { motion } from "framer-motion";

interface AuroraGradientProps {
  className?: string;
  intensity?: "low" | "medium" | "high";
}

export function AuroraGradient({ className = "", intensity = "medium" }: AuroraGradientProps) {
  const opacityMap = {
    low: 0.3,
    medium: 0.5,
    high: 0.7,
  };

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
      
      {/* Aurora layer 1 - Purple */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 20% 40%, hsl(var(--eku-aurora-1) / ${opacityMap[intensity]}), transparent)`,
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Aurora layer 2 - Teal */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 80% 60%, hsl(var(--eku-aurora-2) / ${opacityMap[intensity] * 0.8}), transparent)`,
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, 30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Aurora layer 3 - Pink accent */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 50% 30% at 50% 80%, hsl(var(--eku-aurora-3) / ${opacityMap[intensity] * 0.6}), transparent)`,
        }}
        animate={{
          x: [0, 20, -20, 0],
          y: [0, -15, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}