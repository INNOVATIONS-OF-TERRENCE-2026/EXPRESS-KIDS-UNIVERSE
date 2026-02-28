import { useMemo } from "react";
import { motion } from "framer-motion";

interface StarfieldParticlesProps {
  count?: number;
  className?: string;
}

export function StarfieldParticles({ count = 50, className = "" }: StarfieldParticlesProps) {
  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      delay: Math.random() * 3,
      duration: Math.random() * 2 + 2,
      color: Math.random() > 0.85 
        ? ["#a855f7", "#06b6d4", "#f59e0b", "#ec4899"][Math.floor(Math.random() * 4)]
        : undefined,
    }));
  }, [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            backgroundColor: star.color || "hsl(var(--foreground))",
            boxShadow: star.color 
              ? `0 0 ${star.size * 3}px ${star.color}`
              : undefined,
          }}
          animate={{
            opacity: [0.15, 0.9, 0.15],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* Prominent cross-shaped stars */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`bright-${i}`}
          className="absolute"
          style={{
            left: `${10 + i * 16}%`,
            top: `${8 + (i % 4) * 22}%`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.6, 1],
          }}
          transition={{
            duration: 3 + i * 0.5,
            delay: i * 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="w-0.5 h-5 bg-gradient-to-b from-transparent via-foreground to-transparent absolute left-1/2 -translate-x-1/2" />
          <div className="w-5 h-0.5 bg-gradient-to-r from-transparent via-foreground to-transparent absolute top-1/2 -translate-y-1/2" />
        </motion.div>
      ))}

      {/* Depth layer: distant tiny stars (no animation for perf) */}
      {Array.from({ length: 30 }, (_, i) => (
        <div
          key={`distant-${i}`}
          className="absolute rounded-full bg-foreground/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: 1,
            height: 1,
          }}
        />
      ))}
    </div>
  );
}