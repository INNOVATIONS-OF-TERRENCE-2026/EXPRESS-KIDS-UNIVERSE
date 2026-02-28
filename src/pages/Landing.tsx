import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Wand2, BookOpen, Save, Shield, Lock, Images, Rocket, Star } from "lucide-react";
import { 
  AuroraGradient, 
  StarfieldParticles, 
  CinematicSpotlight, 
  CinematicButton, 
  StaggerContainer, 
  StaggerItem,
  LogoBrand,
  ShootingStars,
  FloatingOrbs3D,
  CosmicDust,
  NebulaCloud,
  NeonGlow,
  Tilt3DCard,
} from "@/components/eku";

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuroraGradient intensity="high" />
      <StarfieldParticles count={80} />
      <CinematicSpotlight />
      <ShootingStars count={5} />
      <FloatingOrbs3D count={6} />
      <NebulaCloud variant="mixed" />

      <div className="relative z-10">
        {/* Hero Section — Supreme Logo Integration */}
        <section className="min-h-[95vh] flex items-center justify-center px-4 perspective-container">
          <StaggerContainer className="text-center max-w-5xl mx-auto" delay={0.1}>
            <StaggerItem>
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-card mb-6 border-gradient"
              >
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold rainbow-text">Powered by Imagination + AI</span>
                <Rocket className="w-4 h-4 text-accent" />
              </motion.div>
            </StaggerItem>

            {/* SUPREME MASSIVE LOGO */}
            <StaggerItem className="flex justify-center mb-8">
              <NeonGlow color="aurora" intensity="high" pulse>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, rotateY: -30 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ 
                    duration: 1.2, 
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.2
                  }}
                  className="relative"
                  style={{ perspective: "1000px" }}
                >
                  <motion.img
                    src="/logo.png"
                    alt="Express Kids Studios"
                    className="w-[280px] h-auto md:w-[420px] lg:w-[520px] object-contain drop-shadow-[0_0_40px_rgba(168,85,247,0.4)] relative z-10"
                    animate={{
                      y: [0, -12, 0],
                      rotateY: [0, 3, -3, 0],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{ transformStyle: "preserve-3d" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/eku-icon.svg";
                    }}
                  />
                  {/* Logo halo glow */}
                  <div className="absolute inset-0 -z-10" style={{
                    background: "radial-gradient(ellipse at center, rgba(168,85,247,0.2) 0%, rgba(6,182,212,0.1) 40%, transparent 70%)",
                    filter: "blur(40px)",
                    transform: "scale(1.5)",
                  }} />
                </motion.div>
              </NeonGlow>
            </StaggerItem>

            <StaggerItem>
              <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-black mb-6 aurora-text text-3d">
                Express Kids Universe
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Personalized animated adventures where your child becomes the 
                <span className="text-accent font-semibold"> hero </span> 
                of their own magical story.
              </p>
            </StaggerItem>

            <StaggerItem className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/create">
                <CinematicButton size="lg" variant="primary">
                  <Wand2 className="w-5 h-5" />
                  Create an Adventure
                  <Star className="w-4 h-4 text-accent" />
                </CinematicButton>
              </Link>
              <Link to="/gallery">
                <CinematicButton size="lg" variant="outline">
                  <Images className="w-5 h-5" />
                  See Gallery
                </CinematicButton>
              </Link>
            </StaggerItem>
          </StaggerContainer>
        </section>

        {/* How it Works — 3D Cards */}
        <section className="py-24 px-4 relative">
          <CosmicDust count={20} />
          <div className="max-w-6xl mx-auto relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-3xl md:text-5xl font-bold text-center mb-4 aurora-text"
            >
              How It Works
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-center mb-16 text-lg"
            >
              Three magical steps to create unforgettable stories
            </motion.p>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Sparkles, title: "Create a Profile", desc: "Tell us about your child — their name, age, and favorite things.", color: "primary", num: "01" },
                { icon: Wand2, title: "Generate Story", desc: "Our AI crafts a unique adventure with your child as the star.", color: "secondary", num: "02" },
                { icon: BookOpen, title: "Read & Save", desc: "Enjoy the story together and save it to your gallery forever.", color: "accent", num: "03" },
              ].map((item, i) => (
                <Tilt3DCard key={i}>
                  <motion.div
                    initial={{ opacity: 0, y: 40, rotateX: 10 }}
                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="glass-card-elevated p-8 text-center group holographic h-full"
                  >
                    {/* Step number */}
                    <div className="absolute top-4 right-4 text-4xl font-black text-foreground/5 font-heading">
                      {item.num}
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.1, rotateY: 10 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className={`w-20 h-20 rounded-2xl bg-${item.color}/20 flex items-center justify-center mx-auto mb-6 group-hover:bg-${item.color}/30 transition-all duration-300 border border-${item.color}/20`}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      <item.icon className={`w-10 h-10 text-${item.color}`} />
                    </motion.div>
                    <h3 className="font-heading text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </motion.div>
                </Tilt3DCard>
              ))}
            </div>
          </div>
        </section>

        {/* Safety Section — Enhanced */}
        <section className="py-24 px-4 relative">
          <div className="max-w-4xl mx-auto relative z-10">
            <Tilt3DCard maxTilt={5}>
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                className="glass-card-elevated p-12 text-center holographic"
              >
                <NeonGlow color="secondary" intensity="medium" pulse className="inline-block mb-6">
                  <Shield className="w-14 h-14 text-secondary" />
                </NeonGlow>
                <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 aurora-text">Safe & Private</h2>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
                  We take your child's safety seriously. All content is kid-friendly, and you're always in control with our parent dashboard.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  {["Kid-safe language", "Parent controls", "Minimal data", "No ads"].map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-muted/80 border border-secondary/20 backdrop-blur-sm"
                    >
                      <Lock className="w-4 h-4 text-secondary" />
                      <span className="text-sm font-semibold">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </Tilt3DCard>
          </div>
        </section>

        {/* Footer — with Logo */}
        <footer className="py-12 px-4 border-t border-border/50 relative">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <LogoBrand size="sm" animate3D={false} />
              <span className="font-heading font-bold text-lg">Express Kids Studios</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/parents" className="hover:text-foreground transition-colors">Parents</Link>
            </div>
            <p className="text-sm text-muted-foreground">&copy; 2026 Express Kids Studios. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}