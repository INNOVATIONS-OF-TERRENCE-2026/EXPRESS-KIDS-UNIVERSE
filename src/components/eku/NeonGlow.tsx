import { motion } from "framer-motion";

interface NeonGlowProps {
  children: React.ReactNode;
  color?: "primary" | "secondary" | "accent" | "aurora";
  intensity?: "low" | "medium" | "high";
  className?: string;
  pulse?: boolean;
}

const colorMap = {
  primary: {
    border: "hsl(var(--primary) / 0.4)",
    glow: "hsl(var(--primary) / 0.2)",
    glowStrong: "hsl(var(--primary) / 0.4)",
  },
  secondary: {
    border: "hsl(var(--secondary) / 0.4)",
    glow: "hsl(var(--secondary) / 0.2)",
    glowStrong: "hsl(var(--secondary) / 0.4)",
  },
  accent: {
    border: "hsl(var(--accent) / 0.5)",
    glow: "hsl(var(--accent) / 0.2)",
    glowStrong: "hsl(var(--accent) / 0.4)",
  },
  aurora: {
    border: "hsl(var(--eku-aurora-1) / 0.4)",
    glow: "hsl(var(--eku-aurora-2) / 0.2)",
    glowStrong: "hsl(var(--eku-aurora-1) / 0.3)",
  },
};

const intensityMap = {
  low: { blur: "20px", spread: "10px" },
  medium: { blur: "40px", spread: "20px" },
  high: { blur: "60px", spread: "30px" },
};

export function NeonGlow({
  children,
  color = "primary",
  intensity = "medium",
  className = "",
  pulse = false,
}: NeonGlowProps) {
  const c = colorMap[color];
  const int = intensityMap[intensity];

  return (
    <motion.div
      className={`relative ${className}`}
      animate={
        pulse
          ? {
              filter: [
                `drop-shadow(0 0 ${int.blur} ${c.glow})`,
                `drop-shadow(0 0 ${int.spread} ${c.glowStrong})`,
                `drop-shadow(0 0 ${int.blur} ${c.glow})`,
              ],
            }
          : undefined
      }
      transition={pulse ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
      style={{
        filter: pulse ? undefined : `drop-shadow(0 0 ${int.blur} ${c.glow})`,
      }}
    >
      {children}
    </motion.div>
  );
}
