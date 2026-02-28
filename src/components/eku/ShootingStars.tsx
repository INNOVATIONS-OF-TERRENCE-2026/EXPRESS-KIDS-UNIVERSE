import { useMemo } from "react";
import { motion } from "framer-motion";

interface ShootingStarsProps {
  count?: number;
  className?: string;
}

export function ShootingStars({ count = 4, className = "" }: ShootingStarsProps) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        startX: Math.random() * 60 + 20, // Start from 20-80% of width
        startY: Math.random() * 30, // Start in top 30%
        angle: Math.random() * 30 + 30, // 30-60 degree angle
        delay: Math.random() * 8 + i * 3,
        duration: Math.random() * 1 + 0.6,
        size: Math.random() * 80 + 60,
      })),
    [count]
  );

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute"
          style={{
            left: `${star.startX}%`,
            top: `${star.startY}%`,
            width: star.size,
            height: 2,
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.8), rgba(168,85,247,0.5), transparent)`,
            borderRadius: "2px",
            transformOrigin: "0% 50%",
            transform: `rotate(${star.angle}deg)`,
            filter: "blur(0.5px)",
          }}
          animate={{
            opacity: [0, 1, 0],
            scaleX: [0, 1, 0],
            x: [0, star.size * 2],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 10 + 5,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
