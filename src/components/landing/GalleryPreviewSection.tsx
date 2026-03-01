import { motion, useReducedMotion } from "framer-motion";
import { Play, Star } from "lucide-react";

/* ── Mock gallery items ──────────────────────────────────── */
const GALLERY_ITEMS = [
  { title: "Space Quest: The Lost Star", theme: "Space Quest", duration: "5:12" },
  { title: "Magic Forest Adventure", theme: "Magic Forest", duration: "2:48" },
  { title: "Ocean Voyage: Deep Blue", theme: "Ocean Voyage", duration: "15:00" },
  { title: "Super Builders Unite", theme: "Super Builders", duration: "3:22" },
  { title: "Dino Discovery Island", theme: "Dino Discovery", duration: "5:01" },
  { title: "Rocket Rainbow Ride", theme: "Space Quest", duration: "2:15" },
];

/* ── Theme gradient map ──────────────────────────────────── */
const themeGradients: Record<string, string> = {
  "Space Quest": "from-indigo-600/40 via-purple-700/30 to-blue-900/50",
  "Magic Forest": "from-emerald-600/40 via-teal-700/30 to-green-900/50",
  "Ocean Voyage": "from-cyan-600/40 via-blue-700/30 to-sky-900/50",
  "Super Builders": "from-orange-600/40 via-amber-700/30 to-yellow-900/50",
  "Dino Discovery": "from-lime-600/40 via-emerald-700/30 to-teal-900/50",
};

/* ── Gallery card ────────────────────────────────────────── */
function GalleryCard({
  item,
  index,
}: {
  item: (typeof GALLERY_ITEMS)[0];
  index: number;
}) {
  const reduced = useReducedMotion();
  const gradient = themeGradients[item.theme] ?? themeGradients["Space Quest"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        delay: index * 0.08,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative rounded-2xl overflow-hidden cursor-pointer"
    >
      {/* Poster bg */}
      <div className={`aspect-video bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        {/* Animated shimmer on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full"
          whileHover={reduced ? {} : { translateX: "200%" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        {/* Sparkle overlay */}
        {!reduced && (
          <motion.div
            className="absolute top-3 right-3"
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          >
            <Star className="w-4 h-4 text-white/20" />
          </motion.div>
        )}

        {/* Play icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20"
          >
            <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
          </motion.div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono text-white/80">
          {item.duration}
        </div>
      </div>

      {/* Title */}
      <div className="p-3">
        <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
          {item.title}
        </h4>
        <p className="text-[11px] text-muted-foreground">{item.theme}</p>
      </div>
    </motion.div>
  );
}

/* ── Section ─────────────────────────────────────────────── */
export function GalleryPreviewSection() {
  return (
    <section className="relative py-28 sm:py-36 px-4 overflow-hidden">
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
            Your Library
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black aurora-text mb-4">
            A Personal Streaming Gallery
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Every story and episode saved to your private gallery — ready to rewatch anytime.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
          {GALLERY_ITEMS.map((item, i) => (
            <GalleryCard key={item.title} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
