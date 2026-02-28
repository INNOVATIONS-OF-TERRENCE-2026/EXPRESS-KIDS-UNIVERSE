import { motion } from "framer-motion";
import { Crown, Star, Shield, TrendingUp } from "lucide-react";
import { AuroraGradient, StarfieldParticles, StaggerContainer, StaggerItem } from "@/components/eku";
import { Footer } from "@/components/eku/Footer";

const leaders = [
  { name: "Terrence Milliner Sr.", title: "Founder, Engineer & CEO", icon: Crown, primary: true },
  { name: "Gloria Milliner", title: "President", icon: Star, primary: false },
  { name: "Terrence Milliner Jr.", title: "Vice President", icon: Shield, primary: false },
  { name: "Tiara Smith", title: "Chief Financial Officer", icon: TrendingUp, primary: false },
];

export default function Leadership() {
  return (
    <div className="relative min-h-screen">
      <AuroraGradient intensity="low" />
      <StarfieldParticles count={40} />

      <div className="relative z-10 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-heading text-4xl md:text-5xl font-black aurora-text mb-4"
            >
              Executive Leadership
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-lg"
            >
              The visionaries behind Express Kids Universe
            </motion.p>
          </div>

          <StaggerContainer className="grid md:grid-cols-2 gap-6" delay={0.1}>
            {leaders.map((leader) => {
              const Icon = leader.icon;
              return (
                <StaggerItem key={leader.name}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    className={`glass-card-elevated p-8 text-center holographic ${leader.primary ? "md:col-span-2 md:max-w-lg md:mx-auto" : ""}`}
                  >
                    <div className={`w-16 h-16 rounded-2xl ${leader.primary ? "bg-accent/20" : "bg-primary/20"} flex items-center justify-center mx-auto mb-4`}>
                      <Icon className={`w-8 h-8 ${leader.primary ? "text-accent" : "text-primary"}`} />
                    </div>
                    <h3 className={`font-heading text-xl font-bold mb-1 ${leader.primary ? "aurora-text text-2xl" : ""}`}>
                      {leader.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">{leader.title}</p>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-16"
          >
            <p className="text-sm text-muted-foreground/70 italic">
              Proudly supporting Milliner's Helping the Youth Foundation
            </p>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
