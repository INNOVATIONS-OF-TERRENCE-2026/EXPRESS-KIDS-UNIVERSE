import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, X, Check } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";

/**
 * ThemeSelector — Floating theme picker panel.
 *
 * • Trigger button shown in the nav (small palette icon)
 * • Opens a slide-in drawer with 10 theme preview cards
 * • Each card shows a 3-color gradient swatch + name
 * • Active theme gets a check mark
 * • Smooth CSS transition on switch (no hard flash)
 */

export const ThemeSelector = memo(function ThemeSelector() {
  const { theme: activeTheme, themes, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Trigger button ── */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full text-foreground/70 hover:text-foreground hover:bg-foreground/5 border border-foreground/10 hover:border-foreground/20 transition-all duration-300"
        title="Change Theme"
        aria-label="Open theme selector"
      >
        <Palette className="w-4 h-4" />
      </motion.button>

      {/* ── Backdrop + Drawer ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="theme-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9990] bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              key="theme-drawer"
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="fixed top-0 right-0 bottom-0 z-[9991] w-80 max-w-[90vw] flex flex-col"
              style={{
                background: "hsl(var(--eku-bg) / 0.95)",
                backdropFilter: "blur(24px) saturate(1.5)",
                borderLeft: "1px solid hsl(var(--glass-border) / 0.3)",
                boxShadow: "-8px 0 40px rgba(0,0,0,0.4)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div>
                  <h2 className="font-heading font-bold text-lg text-foreground">
                    Themes
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose your cinematic universe
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-full hover:bg-foreground/10 transition-colors"
                  aria-label="Close theme selector"
                >
                  <X className="w-4 h-4 text-foreground/60" />
                </button>
              </div>

              {/* Theme grid */}
              <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-2.5">
                {themes.map((t, i) => {
                  const isActive = t.id === activeTheme.id;

                  return (
                    <motion.button
                      key={t.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.25 }}
                      onClick={() => {
                        setTheme(t.id);
                        // Keep panel open so user sees the effect
                      }}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-xl
                        text-left transition-all duration-200
                        ${isActive
                          ? "bg-primary/15 ring-1 ring-primary/40"
                          : "hover:bg-foreground/5"
                        }
                      `}
                      aria-pressed={isActive}
                    >
                      {/* 3-color swatch */}
                      <div
                        className="w-10 h-10 rounded-lg shrink-0 ring-1 ring-white/10"
                        style={{
                          background: `linear-gradient(135deg, ${t.previewColors[0]}, ${t.previewColors[1]}, ${t.previewColors[2]})`,
                        }}
                      />

                      {/* Label */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isActive ? "text-primary" : "text-foreground"}`}>
                          {t.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {t.description}
                        </p>
                      </div>

                      {/* Active check */}
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0"
                        >
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});
