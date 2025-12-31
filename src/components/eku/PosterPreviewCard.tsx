import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface PosterPreviewCardProps {
  title: string;
  tagline?: string;
  theme?: string;
  childName?: string;
  className?: string;
  onClick?: () => void;
}

const themeGradients: Record<string, string> = {
  "Space Quest": "from-indigo-900 via-purple-800 to-pink-700",
  "Magic Forest": "from-emerald-900 via-teal-800 to-cyan-700",
  "Ocean Voyage": "from-blue-900 via-cyan-800 to-teal-600",
  "Super Builders": "from-orange-900 via-red-800 to-yellow-700",
  "Dino Discovery": "from-green-900 via-lime-800 to-yellow-600",
  default: "from-purple-900 via-indigo-800 to-blue-700",
};

export function PosterPreviewCard({
  title,
  tagline,
  theme = "default",
  childName,
  className = "",
  onClick,
}: PosterPreviewCardProps) {
  const gradient = themeGradients[theme] || themeGradients.default;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative cursor-pointer group ${className}`}
    >
      {/* Outer glow */}
      <div className="absolute -inset-1 bg-aurora-gradient rounded-3xl opacity-30 blur-lg group-hover:opacity-50 transition-opacity" />
      
      {/* Card container */}
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-gradient-to-br shadow-2xl">
        {/* Background gradient based on theme */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
        
        {/* Decorative elements */}
        <div className="absolute inset-0">
          {/* Stars/sparkles decoration */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-foreground rounded-full"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 40}%`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 2,
                repeat: Infinity,
              }}
            />
          ))}
          
          {/* Volumetric light beam */}
          <div className="absolute top-0 left-1/4 w-1/2 h-full bg-gradient-to-b from-white/10 to-transparent transform -skew-x-12" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-6 text-foreground">
          {/* Top badge */}
          <div className="flex justify-center">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-background/20 backdrop-blur-sm text-xs font-medium"
            >
              <Sparkles className="w-3 h-3" />
              <span>EKU Original</span>
            </motion.div>
          </div>

          {/* Center - Theme icon placeholder */}
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center"
            >
              <Sparkles className="w-10 h-10 text-accent" />
            </motion.div>
          </div>

          {/* Bottom - Title and tagline */}
          <div className="text-center space-y-2">
            {childName && (
              <p className="text-sm font-medium text-foreground/70">
                Starring {childName}
              </p>
            )}
            <h3 className="font-heading text-xl font-bold text-glow leading-tight">
              {title || "Your Adventure Awaits"}
            </h3>
            {tagline && (
              <p className="text-sm text-foreground/80 italic">
                "{tagline}"
              </p>
            )}
          </div>
        </div>

        {/* Shimmer effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </motion.div>
  );
}