import { useState, useEffect, useCallback, useRef, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share, X } from "lucide-react";
import { brand } from "@/lib/brand";

/* ───────────────────────────────────────────────────────
   PWA Install Button + Downward Dropdown
   ───────────────────────────────────────────────────────
   • Dropdown ALWAYS opens downward (position: absolute, top: calc(100% + 8px))
   • Viewport-safe: clamps to visible area, never renders upward
   • Mobile responsive: centered on small screens
   • z-index: 9999 — above all nav content
   • No layout shifts, GPU-only animations
   ─────────────────────────────────────────────────────── */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window) && /Safari/.test(ua);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

/* ── Shared inline styles (no external CSS needed) ── */

const WRAPPER_STYLE: CSSProperties = {
  position: "relative",
  display: "inline-block",
};

const DROPDOWN_BASE: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 8px)",
  right: 0,
  zIndex: 9999,
  background: "rgba(27,18,53,0.92)",
  backdropFilter: "blur(20px) saturate(1.4)",
  WebkitBackdropFilter: "blur(20px) saturate(1.4)",
  borderRadius: 16,
  minWidth: 260,
  boxShadow: "0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06), 0 0 24px rgba(108,92,231,0.12)",
  maxHeight: "70vh",
  overflowY: "auto" as const,
};

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mobileCenter, setMobileCenter] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ── Prompt / installed listeners ── */
  useEffect(() => {
    if (sessionStorage.getItem("pwa-install-dismissed")) setDismissed(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferredPrompt(null);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  /* ── Close on outside click / Escape ── */
  useEffect(() => {
    if (!dropdownOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [dropdownOpen]);

  /* ── Viewport guard + mobile centering ── */
  useEffect(() => {
    if (!dropdownOpen) return;

    const check = () => {
      setMobileCenter(window.innerWidth <= 768);

      // Viewport bottom guard: if dropdown extends past viewport bottom,
      // nudge it upward but NEVER above the button (always visually below).
      if (dropdownRef.current && wrapperRef.current) {
        const dd = dropdownRef.current;
        const wr = wrapperRef.current;
        const ddRect = dd.getBoundingClientRect();
        const wrRect = wr.getBoundingClientRect();
        const overflow = ddRect.bottom - window.innerHeight + 8;

        if (overflow > 0) {
          // Clamp: never move higher than 8px below the button bottom
          const maxNudge = ddRect.top - wrRect.bottom - 8;
          const nudge = Math.min(overflow, maxNudge > 0 ? maxNudge : 0);
          dd.style.transform = `translateY(-${nudge}px)`;
        } else {
          dd.style.transform = "";
        }
      }
    };

    // Run after paint so dropdown has real dimensions
    const raf = requestAnimationFrame(check);
    window.addEventListener("resize", check);
    window.addEventListener("scroll", check, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", check);
      window.removeEventListener("scroll", check, true);
    };
  }, [dropdownOpen]);

  /* ── Handlers ── */
  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setDeferredPrompt(null);
      setDropdownOpen(false);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    setDropdownOpen(false);
    sessionStorage.setItem("pwa-install-dismissed", "1");
  }, []);

  const toggleDropdown = useCallback(() => {
    setDropdownOpen((p) => !p);
  }, []);

  /* ── Bail if not applicable ── */
  if (isStandalone() || dismissed) return null;

  const showAndroid = !!deferredPrompt;
  const showIos = isIosSafari() && !deferredPrompt;
  if (!showAndroid && !showIos) return null;

  /* ── Mobile-specific dropdown overrides ── */
  const mobileOverrides: CSSProperties = mobileCenter
    ? { left: "50%", right: "auto", transform: "translateX(-50%)", width: "min(90vw, 320px)" }
    : {};

  return (
    <div ref={wrapperRef} style={WRAPPER_STYLE}>
      {/* ── Install trigger button ── */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleDropdown}
        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-foreground/80 hover:text-foreground bg-transparent hover:bg-foreground/5 border border-foreground/10 hover:border-foreground/20 transition-all duration-300 group"
        title="Install App"
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
      >
        <Download className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
        <span className="hidden sm:inline">Install</span>

        {/* Dismiss X */}
        <span
          onClick={handleDismiss}
          className="ml-1 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity cursor-pointer"
        >
          <X className="w-3 h-3" />
        </span>
      </motion.button>

      {/* ── Dropdown — ALWAYS opens downward ── */}
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            ref={dropdownRef}
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{ ...DROPDOWN_BASE, ...mobileOverrides }}
            className="install-dropdown"
          >
            {/* ── Android install content ── */}
            {showAndroid && (
              <div className="p-5">
                {/* Logo */}
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden relative" style={{ background: "radial-gradient(circle at center, rgba(255,200,0,0.08), transparent 70%)" }}>
                    <img
                      src={brand.logoSrc}
                      alt={brand.logoAlt}
                      className="w-[120%] h-[120%] absolute top-1/2 left-1/2"
                      style={{ transform: "translate(-50%, -50%)", objectFit: "cover", objectPosition: "center" }}
                    />
                  </div>
                </div>

                <h3 className="font-heading text-base font-bold text-center text-white mb-1">
                  Install {brand.shortName}
                </h3>
                <p className="text-xs text-white/50 text-center mb-4">
                  Get the full app experience on your device.
                </p>

                <button
                  onClick={handleInstall}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Install Now
                </button>
              </div>
            )}

            {/* ── iOS Safari instructions ── */}
            {showIos && (
              <div className="p-5">
                {/* Logo */}
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden relative" style={{ background: "radial-gradient(circle at center, rgba(255,200,0,0.08), transparent 70%)" }}>
                    <img
                      src={brand.logoSrc}
                      alt={brand.logoAlt}
                      className="w-[120%] h-[120%] absolute top-1/2 left-1/2"
                      style={{ transform: "translate(-50%, -50%)", objectFit: "cover", objectPosition: "center" }}
                    />
                  </div>
                </div>

                <h3 className="font-heading text-base font-bold text-center text-white mb-1">
                  Install {brand.shortName}
                </h3>
                <p className="text-xs text-white/50 text-center mb-4">
                  Add to your home screen for the best experience!
                </p>

                <div className="space-y-2">
                  {[
                    { n: "1", text: <>Tap the <Share className="inline w-3.5 h-3.5 -mt-0.5 text-primary" /> <strong className="text-white">Share</strong> button</> },
                    { n: "2", text: <>Scroll and tap <strong className="text-white">"Add to Home Screen"</strong></> },
                    { n: "3", text: <>Tap <strong className="text-white">"Add"</strong> to install</> },
                  ].map((step) => (
                    <div
                      key={step.n}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5"
                    >
                      <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {step.n}
                      </span>
                      <span className="text-xs text-white/70 leading-relaxed">{step.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
