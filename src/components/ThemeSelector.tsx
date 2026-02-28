import { memo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Palette } from "lucide-react";
import { ThemeModal } from "@/components/ThemeModal";

/**
 * ThemeSelector — Trigger button that opens the full ThemeModal.
 *
 * Renders a small palette icon button inside GlassNav.
 * The actual theme drawer/modal is rendered via portal-free fixed
 * positioning inside ThemeModal. No dropdown, no absolute positioning,
 * no upward expansion — clean bottom-sheet on mobile, centered on desktop.
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

      <ThemeModal open={open} onClose={handleClose} />
    </>
  );
});
