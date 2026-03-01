import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Lock, Star, Zap, Crown, Shield, CreditCard, Users, Baby } from "lucide-react";
import { PLANS, FEATURES, formatPrice } from "@/lib/billing/plans";
import { CinematicButton, Tilt3DCard, NeonGlow } from "@/components/eku";

/* ── Plan icon map ───────────────────────────────────────── */
const planIcons: Record<string, React.ElementType> = {
  free: Star,
  plus: Zap,
  studio: Crown,
};

const planGlow: Record<string, "primary" | "secondary" | "accent"> = {
  free: "secondary",
  plus: "primary",
  studio: "accent",
};

/* ── Trust badges ────────────────────────────────────────── */
const TRUST_BADGES = [
  { icon: Shield, label: "Encrypted" },
  { icon: Baby, label: "Kid-Safe" },
  { icon: CreditCard, label: "Secure Billing" },
  { icon: Users, label: "Parental Controls" },
];

/* ── Section ─────────────────────────────────────────────── */
export function PricingSection() {
  const reduced = useReducedMotion();

  return (
    <section className="relative py-28 sm:py-36 px-4 overflow-hidden">
      {/* Subtle gradient */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary/70 mb-3">
            Simple Pricing
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black aurora-text mb-4">
            Pick Your Adventure
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Start free. Upgrade anytime. Cancel with one click.
          </p>
        </motion.div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto mb-16">
          {PLANS.map((plan, i) => {
            const Icon = planIcons[plan.id] ?? Star;
            const glow = planGlow[plan.id] ?? "primary";

            return (
              <Tilt3DCard key={plan.id} maxTilt={reduced ? 0 : 6} glareEnabled={!reduced}>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative glass-card-elevated p-8 rounded-3xl holographic h-full flex flex-col ${
                    plan.recommended ? "ring-2 ring-primary/30" : ""
                  }`}
                >
                  {/* Recommended badge */}
                  {plan.recommended && (
                    <motion.span
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold"
                    >
                      Most Popular
                    </motion.span>
                  )}

                  {/* Icon */}
                  <NeonGlow color={glow} intensity="low" pulse={false} className="mb-5">
                    <div className={`w-14 h-14 rounded-2xl bg-${glow}/10 border border-${glow}/20 flex items-center justify-center`}>
                      <Icon className={`w-7 h-7 text-${glow}`} />
                    </div>
                  </NeonGlow>

                  {/* Name & tagline */}
                  <h3 className="font-heading text-2xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-5">{plan.tagline}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="font-heading text-4xl font-black tracking-tight">
                      {formatPrice(plan.priceMonthly)}
                    </span>
                    {plan.priceMonthly > 0 && (
                      <span className="text-sm text-muted-foreground ml-1">/month</span>
                    )}
                    {plan.priceYearly > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        or {formatPrice(plan.priceYearly)}/year — save{" "}
                        {formatPrice(plan.priceMonthly * 12 - plan.priceYearly)}
                      </p>
                    )}
                  </div>

                  {/* Feature list */}
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((fid) => {
                      const feat = FEATURES[fid];
                      if (!feat) return null;
                      return (
                        <li key={fid} className="flex items-start gap-2.5 text-sm">
                          <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                          <span className="text-foreground/85">{feat.label}</span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* CTA */}
                  <Link to={plan.priceMonthly === 0 ? "/create" : "/pricing"}>
                    <CinematicButton
                      variant={plan.recommended ? "primary" : "outline"}
                      size="md"
                      className="w-full justify-center"
                    >
                      {plan.priceMonthly === 0 ? "Get Started Free" : "Upgrade"}
                    </CinematicButton>
                  </Link>
                </motion.div>
              </Tilt3DCard>
            );
          })}
        </div>

        {/* Locked features hint */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground/70 flex items-center justify-center gap-2 mb-10"
        >
          <Lock className="w-3.5 h-3.5" />
          Features marked with a lock require a paid plan
        </motion.p>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4"
        >
          {TRUST_BADGES.map(({ icon: TIcon, label }) => (
            <motion.div
              key={label}
              whileHover={reduced ? {} : { scale: 1.05, y: -2 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-border/30"
            >
              <TIcon className="w-4 h-4 text-secondary" />
              <span className="text-xs font-semibold text-foreground/70">{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
