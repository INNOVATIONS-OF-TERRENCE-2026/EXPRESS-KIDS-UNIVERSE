import { motion } from "framer-motion";

interface CinematicSpotlightProps {
  className?: string;
}

export function CinematicSpotlight({ className = "" }: CinematicSpotlightProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Main sweeping spotlight */}
      <motion.div
        className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, hsl(var(--eku-aurora-1) / 0.08) 10deg, transparent 20deg)`,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Secondary spotlight beam */}
      <motion.div
        className="absolute top-0 left-1/4 w-1/2 h-full"
        style={{
          background: `linear-gradient(180deg, hsl(var(--eku-aurora-2) / 0.05) 0%, transparent 50%)`,
          transformOrigin: "top center",
        }}
        animate={{
          rotate: [-15, 15, -15],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Volumetric light rays */}
      <div className="absolute inset-0">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-full"
            style={{
              left: `${20 + i * 25}%`,
              width: "2px",
              background: `linear-gradient(180deg, hsl(var(--foreground) / 0.03) 0%, transparent 70%)`,
            }}
            animate={{
              opacity: [0, 0.5, 0],
              scaleY: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 4 + i,
              delay: i * 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}