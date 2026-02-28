import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share, X } from "lucide-react";
import { brand } from "@/lib/brand";

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

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelper, setShowIosHelper] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if previously dismissed this session
    if (sessionStorage.getItem("pwa-install-dismissed")) {
      setDismissed(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Also detect app installed
    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    }
  }, [deferredPrompt]);

  const handleIosInstall = useCallback(() => {
    setShowIosHelper(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "1");
  }, []);

  // Don't show if already standalone or dismissed
  if (isStandalone() || dismissed) return null;

  const showAndroid = !!deferredPrompt;
  const showIos = isIosSafari() && !deferredPrompt;

  if (!showAndroid && !showIos) return null;

  return (
    <>
      {/* Install button - transparent, minimal */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={showAndroid ? handleInstall : handleIosInstall}
        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-foreground/80 hover:text-foreground bg-transparent hover:bg-foreground/5 border border-foreground/10 hover:border-foreground/20 transition-all duration-300 group"
        title="Install App"
      >
        <Download className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
        <span className="hidden sm:inline">Install</span>
        {/* Dismiss X */}
        <span
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="ml-1 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity cursor-pointer"
        >
          <X className="w-3 h-3" />
        </span>
      </motion.button>

      {/* iOS Helper Sheet */}
      <AnimatePresence>
        {showIosHelper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowIosHelper(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="glass-card p-6 pb-10 w-full max-w-md mx-4 mb-4 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowIosHelper(false)}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-foreground/10"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-16 h-16 mx-auto mb-4">
                <img
                  src={brand.logoSrc}
                  alt={brand.logoAlt}
                  className="w-full h-full object-contain"
                  style={{
                    WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)",
                    maskImage: "radial-gradient(circle, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)",
                  }}
                />
              </div>
              <h3 className="font-heading text-lg font-bold mb-2">Install Express Kids Universe</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add to your home screen for the best experience!
              </p>
              <div className="space-y-3 text-left text-sm">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <span className="text-lg">1.</span>
                  <span>Tap the <Share className="inline w-4 h-4 -mt-0.5" /> Share button in Safari</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <span className="text-lg">2.</span>
                  <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <span className="text-lg">3.</span>
                  <span>Tap <strong>"Add"</strong> to install</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
