import { useState, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, BookOpen, Users, Volume2, Palette, Play, Plus,
  Film, Mic, Star, ChevronRight, Settings,
} from "lucide-react";
import {
  AuroraGradient, StarfieldParticles, CinematicButton,
  StaggerContainer, StaggerItem, CosmicDust, Tilt3DCard,
} from "@/components/eku";
import { Footer } from "@/components/eku/Footer";
import { BrandLogo } from "@/components/eku/BrandLogo";
import { brand } from "@/lib/brand";
import { getGallery } from "@/lib/storage";
import { profileEngine } from "@/lib/studio/profileEngine";
import { getUserSubscription } from "@/lib/billing/entitlements";
import { getPlan, formatPrice } from "@/lib/billing/plans";
import { useAuth } from "@/hooks/useAuth";

/**
 * StudioDashboard — Premium creative production console.
 *
 * Resembles Netflix Kids / Disney+ Kids dashboard.
 * Shows: episode progress, saved adventures, character profiles,
 * audio toggle, theme selector.
 */
export default function StudioDashboard() {
  const { user } = useAuth();
  const [gallery, setGallery] = useState(getGallery());
  const [profiles, setProfiles] = useState(profileEngine.getAll());
  const sub = getUserSubscription();
  const plan = getPlan(sub.planId);

  useEffect(() => {
    setGallery(getGallery());
    setProfiles(profileEngine.getAll());
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuroraGradient intensity="medium" />
      <StarfieldParticles count={40} />
      <CosmicDust count={15} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <StaggerContainer className="mb-10" delay={0.05}>
          <StaggerItem className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <BrandLogo size="md" animate3D={false} />
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold aurora-text">
                  Studio Dashboard
                </h1>
                <p className="text-muted-foreground text-sm">
                  {user?.email ? `Welcome back, Creator` : "Your creative command center"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-full glass-card text-xs font-semibold" style={{ color: plan.accent }}>
                {plan.name}
              </div>
              <Link to="/parents">
                <CinematicButton variant="outline" size="sm">
                  <Settings className="w-4 h-4" /> Settings
                </CinematicButton>
              </Link>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Quick Actions */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10" delay={0.08}>
          {[
            { to: "/create", icon: Plus, label: "New Adventure", color: "primary" },
            { to: "/gallery", icon: BookOpen, label: "My Gallery", color: "secondary" },
            { to: "/parents", icon: Settings, label: "Parent Controls", color: "accent" },
            { to: "/pricing", icon: Star, label: "Upgrade Plan", color: "primary" },
          ].map((action) => (
            <StaggerItem key={action.to}>
              <Link to={action.to}>
                <Tilt3DCard maxTilt={8}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="glass-card p-5 text-center group cursor-pointer h-full"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-${action.color}/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-${action.color}/30 transition-colors`}>
                      <action.icon className={`w-6 h-6 text-${action.color}`} />
                    </div>
                    <p className="font-semibold text-sm">{action.label}</p>
                  </motion.div>
                </Tilt3DCard>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Saved Adventures */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-bold flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" /> Saved Adventures
            </h2>
            <Link to="/gallery" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {gallery.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No adventures yet — create your first story!</p>
              <Link to="/create">
                <CinematicButton variant="primary" size="sm">
                  <Plus className="w-4 h-4" /> Create Adventure
                </CinematicButton>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gallery.slice(0, 6).map((item) => (
                <Link key={item.jobId} to={`/adventure/${item.jobId}`}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="glass-card p-5 group cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.childName} · {item.theme}
                        </p>
                      </div>
                      <Play className="w-4 h-4 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Character Profiles */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" /> Character Profiles
            </h2>
          </div>

          {profiles.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Create a character profile to personalize adventures.</p>
              <Link to="/create">
                <CinematicButton variant="outline" size="sm">
                  <Plus className="w-4 h-4" /> Create Profile
                </CinematicButton>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map((profile) => (
                <motion.div
                  key={profile.id}
                  whileHover={{ scale: 1.02 }}
                  className="glass-card p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-xl">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold">{profile.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {profile.ageRange} · {profile.voiceStyle}
                      </p>
                    </div>
                  </div>
                  {profile.favoriteThemes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {profile.favoriteThemes.slice(0, 3).map((theme) => (
                        <span key={theme} className="text-xs px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
                          {theme}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Studio Features */}
        <section className="mb-10">
          <h2 className="font-heading text-xl font-bold flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent" /> Studio Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Mic,
                title: "Voice Cast Studio",
                desc: "Assign unique voices to every character",
                color: "primary",
                badge: plan.id === "studio" ? "Active" : "Studio Pro",
              },
              {
                icon: Film,
                title: "Episode Engine",
                desc: "Generate full 15-minute animated episodes",
                color: "secondary",
                badge: plan.id !== "free" ? "Active" : "Plus+",
              },
              {
                icon: Palette,
                title: "Theme Studio",
                desc: "Custom themes and seasonal specials",
                color: "accent",
                badge: plan.id !== "free" ? "Active" : "Plus+",
              },
            ].map((feature) => (
              <Tilt3DCard key={feature.title} maxTilt={5}>
                <div className="glass-card p-6 h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-${feature.color}/20 flex items-center justify-center`}>
                      <feature.icon className={`w-5 h-5 text-${feature.color}`} />
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      feature.badge === "Active"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-muted/60 text-muted-foreground"
                    }`}>
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </Tilt3DCard>
            ))}
          </div>
        </section>

        {/* Current Plan */}
        <section className="mb-10">
          <div className="glass-card-elevated p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <h3 className="font-heading text-xl font-bold" style={{ color: plan.accent }}>
                {plan.name}
              </h3>
              <p className="text-sm text-muted-foreground">{plan.tagline}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-heading text-2xl font-bold">
                {formatPrice(plan.priceMonthly)}
                {plan.priceMonthly > 0 && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
              </span>
              {plan.id !== "studio" && (
                <Link to="/pricing">
                  <CinematicButton variant="primary" size="sm">
                    Upgrade <ChevronRight className="w-4 h-4" />
                  </CinematicButton>
                </Link>
              )}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
