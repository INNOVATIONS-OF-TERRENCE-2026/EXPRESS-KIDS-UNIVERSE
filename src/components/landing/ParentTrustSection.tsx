import { motion, useReducedMotion } from "framer-motion";
import {
  Shield,
  Eye,
  SlidersHorizontal,
  Save,
  ActivitySquare,
  Lock,
  ServerOff,
  CreditCard,
  Baby,
  Fingerprint,
} from "lucide-react";

/* ── Data ────────────────────────────────────────────────── */
const CONTROLS = [
  { icon: SlidersHorizontal, label: "Parental Controls", desc: "Full dashboard with granular settings" },
  { icon: Fingerprint, label: "Consent Tracking", desc: "Auditable approval for voice & AR features" },
  { icon: Eye, label: "Content Filter", desc: "Gentle or standard content modes" },
  { icon: Save, label: "Saving Toggle", desc: "Enable or disable gallery saving" },
  { icon: ActivitySquare, label: "Reduced Motion", desc: "Minimise animations for accessibility" },
];

const PRIVACY = [
  { icon: Lock, label: "Privacy-First", desc: "All analytics stay local — never sent externally" },
  { icon: ServerOff, label: "No External Tracking", desc: "Zero third-party trackers or pixels" },
  { icon: Shield, label: "Encrypted Data", desc: "AES-256 encryption on sensitive data" },
  { icon: CreditCard, label: "Verified Billing", desc: "Stripe-powered secure payment processing" },
  { icon: Baby, label: "Kid-Safe by Design", desc: "COPPA-aligned content & data handling" },
];

/* ── Item ────────────────────────────────────────────────── */
function TrustItem({
  icon: Icon,
  label,
  desc,
  index,
  side,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  index: number;
  side: "left" | "right";
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0, x: side === "left" ? -20 : 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.5 }}
      className="flex items-start gap-4 group"
    >
      <motion.div
        whileHover={reduced ? {} : { scale: 1.1 }}
        className="shrink-0 w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/15 flex items-center justify-center group-hover:bg-secondary/15 transition-colors"
      >
        <Icon className="w-5 h-5 text-secondary" />
      </motion.div>
      <div>
        <h4 className="text-sm font-bold mb-0.5">{label}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

/* ── Section ─────────────────────────────────────────────── */
export function ParentTrustSection() {
  return (
    <section className="relative py-28 sm:py-36 px-4 overflow-hidden">
      {/* Soft ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, hsl(var(--secondary)), transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-secondary/70 mb-3">
            Safety & Trust
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black aurora-text mb-4">
            Peace of Mind, Built&nbsp;In.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Every feature is designed around child safety, parental control, and data privacy.
          </p>
        </motion.div>

        {/* Split layout */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Left — Parental Controls */}
          <div>
            <h3 className="font-heading text-lg font-bold mb-6 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-primary" />
              Parental Controls
            </h3>
            <div className="space-y-5">
              {CONTROLS.map((item, i) => (
                <TrustItem key={item.label} {...item} index={i} side="left" />
              ))}
            </div>
          </div>

          {/* Right — Privacy */}
          <div>
            <h3 className="font-heading text-lg font-bold mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-secondary" />
              Privacy & Security
            </h3>
            <div className="space-y-5">
              {PRIVACY.map((item, i) => (
                <TrustItem key={item.label} {...item} index={i} side="right" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
