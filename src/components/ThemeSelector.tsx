import { memo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Palette } from "lucide-react";
import { ThemeHeadWidget } from "@/components/ThemeHeadWidget";

/**
 * ThemeSelector — Trigger button that opens the floating ThemeHeadWidget.
 *
 * Renders a small palette icon button inside GlassNav.
 * Opens a lightweight transparent floating panel (not a full modal).
 */
export const ThemeSelector = memo(function ThemeSelector() {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleOpen}
        className="relative flex items-center justify-center w-9 h-9 rounded-full text-foreground/70 hover:text-foreground hover:bg-foreground/5 border border-foreground/10 hover:border-foreground/20 transition-all duration-300"
        title="Change Theme"
        aria-label="Open theme selector"
      >
        <Palette className="w-4 h-4" />
      </motion.button>

      <ThemeHeadWidget open={open} onClose={handleClose} />
    </>
  );
});
