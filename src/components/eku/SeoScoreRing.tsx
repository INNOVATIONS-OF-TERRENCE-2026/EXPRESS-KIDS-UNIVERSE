/**
 * SeoScoreRing.tsx — Animated circular score indicator
 *
 * SVG-based ring with Framer Motion animation.
 * Color transitions: red (0-40) → yellow (41-70) → green (71-100).
 * GPU-friendly: uses stroke-dashoffset for animation.
 */

import { motion } from "framer-motion";

interface SeoScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function SeoScoreRing({
  score,
  size = 120,
  strokeWidth = 8,
  label,
  className = "",
}: SeoScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 71) return "hsl(142, 76%, 46%)";
    if (s >= 41) return "hsl(45, 100%, 60%)";
    return "hsl(0, 84%, 60%)";
  };

  const getGrade = (s: number) => {
    if (s >= 90) return "A+";
    if (s >= 80) return "A";
    if (s >= 70) return "B";
    if (s >= 60) return "C";
    if (s >= 50) return "D";
    return "F";
  };

  const color = getColor(score);

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted) / 0.3)"
          strokeWidth={strokeWidth}
        />
        {/* Score ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="font-heading font-bold text-2xl"
          style={{ color }}
        >
          {Math.round(score)}
        </motion.span>
        <span className="text-xs text-muted-foreground font-medium">
          {getGrade(score)}
        </span>
      </div>
      {label && (
        <span className="text-xs text-muted-foreground mt-2 font-medium">
          {label}
        </span>
      )}
    </div>
  );
}
