/**
 * SeoResultPanel.tsx — Expandable result panel for SEO tool outputs
 *
 * Renders analysis results in a structured, scannable format.
 * Uses glass-card styling with collapsible sections.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import type { Priority } from "@/types/seo";

interface ResultSection {
  title: string;
  items: string[];
  type?: "success" | "warning" | "error" | "info";
}

interface SeoResultPanelProps {
  title: string;
  subtitle?: string;
  sections: ResultSection[];
  defaultOpen?: boolean;
  className?: string;
}

const typeIcons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

const typeColors = {
  success: "text-green-400",
  warning: "text-yellow-400",
  error: "text-red-400",
  info: "text-blue-400",
};

export function SeoResultPanel({
  title,
  subtitle,
  sections,
  defaultOpen = false,
  className = "",
}: SeoResultPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card overflow-hidden ${className}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/20 transition-colors"
      >
        <div className="min-w-0">
          <h3 className="font-heading font-semibold text-sm truncate">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 ml-3"
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-4">
              {sections.map((section, idx) => {
                const Icon = typeIcons[section.type || "info"];
                const colorClass = typeColors[section.type || "info"];

                return (
                  <div key={idx}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${colorClass}`} />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {section.title}
                      </h4>
                    </div>
                    <ul className="space-y-1.5">
                      {section.items.map((item, i) => (
                        <li
                          key={i}
                          className="text-sm text-foreground/80 flex items-start gap-2"
                        >
                          <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Priority Badge ────────────────────────────────────

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityStyles: Record<Priority, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full border ${priorityStyles[priority]}`}
    >
      {priority}
    </span>
  );
}
