import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glareEnabled?: boolean;
  perspective?: number;
  scale?: number;
}

export function Tilt3DCard({
  children,
  className = "",
  maxTilt = 10,
  glareEnabled = true,
  perspective = 800,
  scale = 1.02,
}: Tilt3DCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      setTransform({
        rotateX: (0.5 - y) * maxTilt * 2,
        rotateY: (x - 0.5) * maxTilt * 2,
      });

      if (glareEnabled) {
        setGlare({ x: x * 100, y: y * 100, opacity: 0.15 });
      }
    },
    [maxTilt, glareEnabled]
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTransform({ rotateX: 0, rotateY: 0 });
    setGlare({ x: 50, y: 50, opacity: 0 });
  }, []);

  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      style={{ perspective: `${perspective}px` }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: transform.rotateX,
        rotateY: transform.rotateY,
        scale: isHovered ? scale : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}

      {/* Glare overlay */}
      {glareEnabled && (
        <div
          className="absolute inset-0 rounded-inherit pointer-events-none z-10"
          style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 60%)`,
            borderRadius: "inherit",
            transition: "opacity 0.15s ease",
          }}
        />
      )}

      {/* Edge light effect */}
      <div
        className="absolute inset-0 rounded-inherit pointer-events-none"
        style={{
          borderRadius: "inherit",
          boxShadow: isHovered
            ? `0 0 30px hsl(280 80% 60% / 0.15), 0 20px 60px hsl(260 60% 6% / 0.4)`
            : "0 0 0 transparent",
          transition: "box-shadow 0.3s ease",
        }}
      />
    </motion.div>
  );
}
