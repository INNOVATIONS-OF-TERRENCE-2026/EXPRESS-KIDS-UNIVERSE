import { useMemo } from "react";
import { motion } from "framer-motion";

interface FloatingOrbs3DProps {
  count?: number;
  className?: string;
}

export function FloatingOrbs3D({ count = 5, className = "" }: FloatingOrbs3DProps) {
  const orbs = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const colors = [
          "rgba(168, 85, 247, 0.15)", // purple
          "rgba(6, 182, 212, 0.12)",  // teal
          "rgba(236, 72, 153, 0.10)", // pink
          "rgba(245, 158, 11, 0.08)", // gold
          "rgba(78, 205, 196, 0.10)", // cyan
        ];
        return {
          id: i,
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
          size: Math.random() * 200 + 80,
          color: colors[i % colors.length],
          duration: Math.random() * 10 + 15,
          delay: Math.random() * 5,
          z: Math.random() * 200 - 100,
        };
      }),
    [count]
  );

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ perspective: "1000px", perspectiveOrigin: "50% 50%" }}
    >
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle at 30% 30%, ${orb.color}, transparent 70%)`,
            filter: `blur(${orb.size * 0.3}px)`,
            transformStyle: "preserve-3d",
            transform: `translateZ(${orb.z}px)`,
          }}
          animate={{
            x: [0, Math.random() * 60 - 30, Math.random() * -40 + 20, 0],
            y: [0, Math.random() * -50 + 25, Math.random() * 40 - 20, 0],
            scale: [1, 1.2, 0.9, 1],
            opacity: [0.4, 0.8, 0.5, 0.4],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
