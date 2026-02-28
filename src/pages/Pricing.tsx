import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Star, Zap, Crown } from "lucide-react";
import {
  AuroraGradient, StarfieldParticles, CinematicButton,
  StaggerContainer, StaggerItem, ShootingStars, Tilt3DCard,
} from "@/components/eku";
import { Footer } from "@/components/eku/Footer";
import { BrandLogo } from "@/components/eku/BrandLogo";
import { brand } from "@/lib/brand";
import { PLANS, FEATURES, formatPrice } from "@/lib/billing/plans";
import { getUserSubscription } from "@/lib/billing/entitlements";

/**
 * Pricing — Subscription plan tier display.
 *
 * Shows Free / Plus / Studio Pro tiers with feature comparison.
 * No real payment activation — placeholder until provider is configured.
 */
export default function Pricing() {
  const sub = getUserSubscription();

  const planIcons = {
    free: Star,
    plus: Zap,
    studio: Crown,
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuroraGradient intensity="medium" />
      <StarfieldParticles count={50} />
      <ShootingStars count={3} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <StaggerContainer className="text-center mb-16" delay={0.1}>
          <StaggerItem className="flex justify-center mb-4">
            <BrandLogo size="lg" animate3D />
          </StaggerItem>
          <StaggerItem>
            <h1 className="font-heading text-4xl md:text-5xl font-black aurora-text mb-4">
              Choose Your Adventure
            </h1>
          </StaggerItem>
          <StaggerItem>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Unlock the full creative studio for your child's imagination. Every plan includes a safe, ad-free experience.
            </p>
          </StaggerItem>
        </StaggerContainer>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan, i) => {
            const Icon = planIcons[plan.id as keyof typeof planIcons] ?? Star;
            const isCurrent = sub.planId === plan.id;

            return (
              <StaggerItem key={plan.id}>
                <Tilt3DCard maxTilt={6}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className={`glass-card-elevated p-8 h-full flex flex-col relative ${
                      plan.recommended ? "ring-2 ring-primary/50" : ""
                    }`}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        Most Popular
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: `${plan.accent}20` }}
                      >
                        <Icon className="w-7 h-7" style={{ color: plan.accent }} />
                      </div>
                      <h2 className="font-heading text-2xl font-bold">{plan.name}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{plan.tagline}</p>
                    </div>

                    <div className="text-center mb-6">
                      <div className="font-heading text-4xl font-black">
                        {formatPrice(plan.priceMonthly)}
                      </div>
                      {plan.priceMonthly > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          per month · {formatPrice(plan.priceYearly)}/year
                        </p>
                      )}
                    </div>

                    <div className="flex-1 space-y-3 mb-6">
                      {plan.features.map((fid) => {
                        const feature = FEATURES[fid];
                        if (!feature) return null;
                        return (
                          <div key={fid} className="flex items-start gap-2.5">
                            <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                            <span className="text-sm">{feature.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-auto">
                      {isCurrent ? (
                        <div className="text-center py-2.5 rounded-xl bg-muted/40 text-sm font-semibold text-muted-foreground">
                          Current Plan
                        </div>
                      ) : (
                        <CinematicButton
                          variant={plan.recommended ? "primary" : "outline"}
                          className="w-full"
                        >
                          {plan.priceMonthly === 0 ? "Get Started" : "Upgrade"}
                        </CinematicButton>
                      )}
                    </div>
                  </motion.div>
                </Tilt3DCard>
              </StaggerItem>
            );
          })}
        </div>

        {/* FAQ / Trust */}
        <StaggerContainer className="text-center mb-12" delay={0.1}>
          <StaggerItem>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              All plans are backed by our commitment to child safety, privacy, and ad-free content.
              Cancel anytime. No hidden fees.
            </p>
          </StaggerItem>
          <StaggerItem className="mt-4">
            <div className="flex justify-center gap-6 text-xs text-muted-foreground/60">
              <span>Secure Payments</span>
              <span>·</span>
              <span>Cancel Anytime</span>
              <span>·</span>
              <span>Family Safe</span>
            </div>
          </StaggerItem>
        </StaggerContainer>

        <Footer />
      </div>
    </div>
  );
}
