import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { CinematicButton } from "./CinematicButton";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {/* Animated icon container */}
      <motion.div
        animate={{
          y: [0, -10, 0],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative mb-8"
      >
        {/* Glow background */}
        <div className="absolute inset-0 w-32 h-32 bg-aurora-gradient rounded-full blur-2xl opacity-30" />
        
        {/* Icon container */}
        <div className="relative w-32 h-32 rounded-full glass-card flex items-center justify-center">
          <Icon className="w-12 h-12 text-primary" />
        </div>

        {/* Orbiting dots */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-secondary"
            style={{
              left: "50%",
              top: "50%",
            }}
            animate={{
              x: [
                Math.cos((i / 3) * Math.PI * 2) * 70,
                Math.cos((i / 3) * Math.PI * 2 + Math.PI * 2) * 70,
              ],
              y: [
                Math.sin((i / 3) * Math.PI * 2) * 70,
                Math.sin((i / 3) * Math.PI * 2 + Math.PI * 2) * 70,
              ],
            }}
            transition={{
              duration: 8,
              delay: i * 0.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </motion.div>

      {/* Text content */}
      <h3 className="font-heading text-2xl font-bold text-foreground mb-3">
        {title}
      </h3>
      <p className="text-muted-foreground max-w-md mb-8">
        {description}
      </p>

      {/* Action button */}
      {actionLabel && onAction && (
        <CinematicButton onClick={onAction} variant="primary">
          {actionLabel}
        </CinematicButton>
      )}
    </motion.div>
  );
}