import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

interface PageTransition3DProps {
  children: React.ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.97,
    rotateX: 2,
    filter: "blur(4px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    rotateX: -1,
    filter: "blur(2px)",
  },
};

export function PageTransition3D({ children }: PageTransition3DProps) {
  const location = useLocation();

  return (
    <div style={{ perspective: "1200px", perspectiveOrigin: "50% 50%" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="min-h-screen"
          style={{ transformStyle: "preserve-3d", transformOrigin: "50% 0%" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
