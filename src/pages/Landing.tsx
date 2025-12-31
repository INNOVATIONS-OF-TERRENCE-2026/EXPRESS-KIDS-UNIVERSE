import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Wand2, BookOpen, Save, Shield, Lock, Images } from "lucide-react";
import { AuroraGradient, StarfieldParticles, CinematicSpotlight, CinematicButton, StaggerContainer, StaggerItem } from "@/components/eku";

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuroraGradient intensity="high" />
      <StarfieldParticles count={60} />
      <CinematicSpotlight />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-[90vh] flex items-center justify-center px-4">
          <StaggerContainer className="text-center max-w-4xl mx-auto" delay={0.2}>
            <StaggerItem>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
              >
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">Powered by Imagination + AI</span>
              </motion.div>
            </StaggerItem>

            <StaggerItem>
              <h1 className="font-heading text-5xl md:text-7xl font-black mb-6 aurora-text">
                Express Kids Universe
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Personalized animated adventures where your child becomes the hero of their own magical story.
              </p>
            </StaggerItem>

            <StaggerItem className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/create">
                <CinematicButton size="lg" variant="primary">
                  <Wand2 className="w-5 h-5" />
                  Create an Adventure
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

        {/* How it Works */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-3xl md:text-4xl font-bold text-center mb-16"
            >
              How It Works
            </motion.h2>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Sparkles, title: "Create a Profile", desc: "Tell us about your child - their name, age, and favorite things." },
                { icon: Wand2, title: "Generate Story", desc: "Our AI crafts a unique adventure with your child as the star." },
                { icon: BookOpen, title: "Read & Save", desc: "Enjoy the story together and save it to your gallery." },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-8 text-center group hover:scale-105 transition-transform"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/30 transition-colors">
                    <item.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-heading text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Safety Section */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-12 text-center"
            >
              <Shield className="w-12 h-12 text-secondary mx-auto mb-6" />
              <h2 className="font-heading text-3xl font-bold mb-4">Safe & Private</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                We take your child's safety seriously. All content is kid-friendly, and you're always in control with our parent dashboard.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {["Kid-safe language", "Parent controls", "Minimal data", "No ads"].map((item) => (
                  <div key={item} className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
                    <Lock className="w-4 h-4 text-secondary" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-border">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-heading font-bold">Express Kids Universe</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/parents" className="hover:text-foreground transition-colors">Parents</Link>
            </div>
            <p className="text-sm text-muted-foreground">© 2024 EKU. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}