import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Rocket } from "lucide-react";
import { AuroraGradient, StarfieldParticles, CinematicButton, ShootingStars } from "@/components/eku";
import { BrandLogo } from "@/components/eku/BrandLogo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <AuroraGradient intensity="medium" />
      <StarfieldParticles count={50} />
      <ShootingStars count={4} />

      <div className="relative z-10 text-center px-4 max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex justify-center mb-8">
            <BrandLogo size="xl" animate3D />
          </div>

          <motion.h1
            className="font-heading text-8xl md:text-9xl font-black aurora-text text-3d mb-4"
            animate={{ 
              textShadow: [
                "0 0 20px rgba(168,85,247,0.3)",
                "0 0 40px rgba(168,85,247,0.5)",
                "0 0 20px rgba(168,85,247,0.3)",
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            404
          </motion.h1>

          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4 text-foreground">
            Lost in the Universe!
          </h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            This adventure doesn't exist yet. Let's get you back to where the magic happens!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <CinematicButton variant="primary" size="lg">
                <Home className="w-5 h-5" />
                Go Home
              </CinematicButton>
            </Link>
            <Link to="/create">
              <CinematicButton variant="outline" size="lg">
                <Rocket className="w-5 h-5" />
                Create Adventure
              </CinematicButton>
            </Link>
          </div>
        </motion.div>

        {/* Floating astronaut emoji */}
        <motion.div
          className="absolute -top-10 right-0 text-6xl"
          animate={{ 
            y: [0, -20, 0], 
            rotate: [0, 10, -10, 0],
            x: [0, 15, -10, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          🚀
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
