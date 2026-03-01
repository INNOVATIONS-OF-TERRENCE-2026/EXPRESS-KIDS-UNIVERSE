import { motion, useReducedMotion } from "framer-motion";
import {
  Search,
  FileText,
  BarChart3,
  Users,
  Compass,
  TrendingUp,
} from "lucide-react";
import { Tilt3DCard, NeonGlow } from "@/components/eku";

/* ── SEO tool data ───────────────────────────────────────── */
const TOOLS = [
  { icon: Compass, title: "Strategy Builder", desc: "Full SEO roadmap with phased growth plans", color: "primary" },
  { icon: Search, title: "Keyword Engine", desc: "Discover high-value keyword clusters by intent", color: "accent" },
  { icon: FileText, title: "Content Blueprint", desc: "Complete outlines with heading structure & schema", color: "secondary" },
  { icon: BarChart3, title: "On-Page Optimizer", desc: "Score & improve any page's SEO performance", color: "primary" },
  { icon: Users, title: "Competitor Breakdown", desc: "Analyze competitor pages and find content gaps", color: "accent" },
] as const;

/* ── Mock dashboard bars ─────────────────────────────────── */
function DashboardMock() {
  const reduced = useReducedMotion();

  return (
    <div className="relative glass-card p-6 rounded-2xl overflow-hidden max-w-md mx-auto">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-xs font-bold text-green-400">+42%</span>
          <span className="text-xs text-muted-foreground">traffic growth</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/50">SEO Suite</span>
      </div>

      {/* Metric bars */}
      <div className="space-y-3">
        {[
          { label: "Keywords", value: 87, color: "bg-primary" },
          { label: "Authority", value: 72, color: "bg-accent" },
          { label: "Content", value: 91, color: "bg-secondary" },
          { label: "Technical", value: 68, color: "bg-purple-500" },
        ].map((bar, i) => (
          <div key={bar.label}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-muted-foreground">{bar.label}</span>
              <span className="font-semibold text-foreground/80">{bar.value}/100</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${bar.color}`}
                initial={{ width: "0%" }}
                whileInView={{ width: `${bar.value}%` }}
                viewport={{ once: true }}
                transition={reduced ? { duration: 0 } : { delay: 0.4 + i * 0.1, duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Section ─────────────────────────────────────────────── */
export function SeoSection() {
  const reduced = useReducedMotion();

  return (
    <section className="relative py-28 sm:py-36 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent/70 mb-3">
            For Creators
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black aurora-text mb-4">
            Built for Creators Too.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            A complete SEO strategy suite — right inside the platform.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Tools grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {TOOLS.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <Tilt3DCard key={tool.title} maxTilt={reduced ? 0 : 6} glareEnabled={!reduced}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: i * 0.08, duration: 0.55 }}
                    className="glass-card p-5 rounded-2xl group hover:border-primary/20 transition-colors h-full"
                  >
                    <NeonGlow color={tool.color as any} intensity="low" className="inline-block mb-3">
                      <Icon className={`w-6 h-6 text-${tool.color}`} />
                    </NeonGlow>
                    <h4 className="font-heading text-sm font-bold mb-1">{tool.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
                  </motion.div>
                </Tilt3DCard>
              );
            })}
          </div>

          {/* Dashboard mock */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <DashboardMock />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
