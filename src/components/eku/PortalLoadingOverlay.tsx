import { motion, AnimatePresence } from "framer-motion";

interface PortalLoadingOverlayProps {
  isOpen: boolean;
  message?: string;
}

export function PortalLoadingOverlay({ isOpen, message = "Opening portal..." }: PortalLoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm"
        >
          {/* Portal rings */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Outer ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-primary/30"
              animate={{ rotate: 360, scale: [1, 1.1, 1] }}
              transition={{
                rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              }}
            />
            
            {/* Middle ring */}
            <motion.div
              className="absolute inset-8 rounded-full border-4 border-secondary/40"
              animate={{ rotate: -360, scale: [1, 0.9, 1] }}
              transition={{
                rotate: { duration: 6, repeat: Infinity, ease: "linear" },
                scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
              }}
            />
            
            {/* Inner ring */}
            <motion.div
              className="absolute inset-16 rounded-full border-4 border-accent/50"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* Center glow */}
            <motion.div
              className="absolute w-16 h-16 rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Particles orbiting */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-primary"
                style={{
                  left: "50%",
                  top: "50%",
                }}
                animate={{
                  x: [
                    Math.cos((i / 6) * Math.PI * 2) * 100,
                    Math.cos((i / 6) * Math.PI * 2 + Math.PI) * 100,
                    Math.cos((i / 6) * Math.PI * 2) * 100,
                  ],
                  y: [
                    Math.sin((i / 6) * Math.PI * 2) * 100,
                    Math.sin((i / 6) * Math.PI * 2 + Math.PI) * 100,
                    Math.sin((i / 6) * Math.PI * 2) * 100,
                  ],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-1/3 font-heading text-xl text-foreground text-glow"
          >
            {message}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}