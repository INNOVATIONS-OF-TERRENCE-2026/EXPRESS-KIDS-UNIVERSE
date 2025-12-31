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
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
      duration: Math.random() * 2 + 2,
    }));
  }, [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-foreground"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* A few larger, more prominent stars */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`bright-${i}`}
          className="absolute"
          style={{
            left: `${15 + i * 20}%`,
            top: `${10 + (i % 3) * 30}%`,
          }}
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + i * 0.5,
            delay: i * 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="w-1 h-4 bg-gradient-to-b from-transparent via-foreground to-transparent absolute left-1/2 -translate-x-1/2" />
          <div className="w-4 h-1 bg-gradient-to-r from-transparent via-foreground to-transparent absolute top-1/2 -translate-y-1/2" />
        </motion.div>
      ))}
    </div>
  );
}