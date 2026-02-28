import { useMemo } from "react";
import { motion } from "framer-motion";

interface CosmicDustProps {
  count?: number;
  className?: string;
}

export function CosmicDust({ count = 30, className = "" }: CosmicDustProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 10,
        driftX: Math.random() * 40 - 20,
        driftY: Math.random() * -60 - 10,
        color: [
          "rgba(168,85,247,0.6)", // purple
          "rgba(6,182,212,0.5)",  // teal
          "rgba(245,158,11,0.5)", // gold
          "rgba(236,72,153,0.4)", // pink
          "rgba(255,255,255,0.3)", // white
        ][i % 5],
      })),
    [count]
  );

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
          animate={{
            x: [0, p.driftX, p.driftX * 0.5, 0],
            y: [0, p.driftY, p.driftY * 1.5, 0],
            opacity: [0, 0.8, 0.6, 0],
            scale: [0.5, 1.2, 0.8, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
