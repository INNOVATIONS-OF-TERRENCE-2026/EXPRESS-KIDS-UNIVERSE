import { motion } from "framer-motion";
import { useMemo } from "react";

interface NebulaCloudProps {
  className?: string;
  variant?: "purple" | "teal" | "pink" | "mixed";
}

export function NebulaCloud({ className = "", variant = "mixed" }: NebulaCloudProps) {
  const clouds = useMemo(() => {
    const colorSets = {
      purple: [
        { color: "hsla(280,80%,60%,0.08)", x: 20, y: 30, size: 400 },
        { color: "hsla(280,60%,50%,0.05)", x: 60, y: 70, size: 300 },
      ],
      teal: [
        { color: "hsla(180,80%,50%,0.06)", x: 70, y: 20, size: 350 },
        { color: "hsla(180,60%,40%,0.04)", x: 30, y: 80, size: 280 },
      ],
      pink: [
        { color: "hsla(320,70%,55%,0.07)", x: 50, y: 40, size: 320 },
        { color: "hsla(340,80%,60%,0.04)", x: 80, y: 60, size: 260 },
      ],
      mixed: [
        { color: "hsla(280,80%,60%,0.06)", x: 15, y: 25, size: 380 },
        { color: "hsla(180,80%,50%,0.05)", x: 75, y: 20, size: 320 },
        { color: "hsla(320,70%,55%,0.05)", x: 50, y: 65, size: 350 },
        { color: "hsla(45,100%,60%,0.03)", x: 85, y: 75, size: 250 },
      ],
    };
    return colorSets[variant];
  }, [variant]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {clouds.map((cloud, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${cloud.x}%`,
            top: `${cloud.y}%`,
            width: cloud.size,
            height: cloud.size,
            background: `radial-gradient(circle at center, ${cloud.color}, transparent 70%)`,
            filter: `blur(${cloud.size * 0.2}px)`,
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 15, 0],
            scale: [1, 1.15, 0.95, 1],
            opacity: [0.6, 1, 0.7, 0.6],
          }}
          transition={{
            duration: 20 + i * 5,
            delay: i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
