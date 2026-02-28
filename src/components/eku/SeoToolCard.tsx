/**
 * SeoToolCard.tsx — Reusable card for each SEO tool in the dashboard
 *
 * Renders a clickable Tilt3D card with icon, title, description, and status badge.
 * Follows the EKU design system glass-card pattern.
 */

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Tilt3DCard } from "./Tilt3DCard";

interface SeoToolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: "primary" | "secondary" | "accent";
  badge?: string;
  badgeActive?: boolean;
  onClick: () => void;
  resultCount?: number;
}

export function SeoToolCard({
  icon: Icon,
  title,
  description,
  color,
  badge,
  badgeActive = false,
  onClick,
  resultCount,
}: SeoToolCardProps) {
  return (
    <Tilt3DCard maxTilt={6}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="glass-card p-6 h-full cursor-pointer group transition-colors"
      >
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl bg-${color}/20 flex items-center justify-center group-hover:bg-${color}/30 transition-colors`}
          >
            <Icon className={`w-6 h-6 text-${color}`} />
          </div>
          <div className="flex items-center gap-2">
            {resultCount !== undefined && resultCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
                {resultCount}
              </span>
            )}
            {badge && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  badgeActive
                    ? "bg-green-500/20 text-green-400"
                    : "bg-muted/60 text-muted-foreground"
                }`}
              >
                {badge}
              </span>
            )}
          </div>
        </div>
        <h3 className="font-heading font-semibold mb-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </motion.div>
    </Tilt3DCard>
  );
}
