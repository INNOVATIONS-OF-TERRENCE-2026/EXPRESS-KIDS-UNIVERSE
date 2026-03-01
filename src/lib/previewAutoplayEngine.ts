/**
 * previewAutoplayEngine.ts — Netflix-Style Preview Autoplay Engine
 *
 * Manages gallery video preview autoplay behavior:
 *   - Auto-play muted preview on hover / scroll-into-view
 *   - Preview length: 8–12 seconds
 *   - Only ONE preview playing at a time (singleton controller)
 *   - IntersectionObserver for visibility detection
 *   - Respects user autoplay preference
 *   - Respects low battery mode / data saver
 *   - Mobile: tap to preview, scroll stops playback
 *   - No re-render loops — event-driven architecture
 *   - Preview scrub overlay animation
 *   - Memory-safe cleanup on unmount
 */

/* ── Types ── */

export interface PreviewConfig {
  /** Preview duration in seconds (default: 10) */
  previewDurationSec: number;
  /** Minimum intersection ratio before autoplay triggers (default: 0.6) */
  intersectionThreshold: number;
  /** Delay before starting preview after intersection (ms) */
  hoverDelayMs: number;
  /** Whether autoplay is globally enabled */
  autoplayEnabled: boolean;
  /** Muted by default */
  muted: boolean;
}

export interface PreviewState {
  videoId: string;
  isPlaying: boolean;
  isMuted: boolean;
  progress: number;  // 0–1
  currentTime: number;
  duration: number;
}

export type PreviewEvent =
  | { type: "play"; videoId: string }
  | { type: "pause"; videoId: string }
  | { type: "progress"; videoId: string; progress: number }
  | { type: "ended"; videoId: string };

export type PreviewEventListener = (event: PreviewEvent) => void;

/* ── Constants ── */

const DEFAULT_CONFIG: PreviewConfig = {
  previewDurationSec: 10,
  intersectionThreshold: 0.6,
  hoverDelayMs: 800,
  autoplayEnabled: true,
  muted: true,
};

const STORAGE_KEY = "eku_preview_autoplay";

/* ── Singleton Controller ── */

/**
 * PreviewAutoplayController — Manages all video preview autoplay.
 * Only one preview can play at a time.
 */
export class PreviewAutoplayController {
  private config: PreviewConfig;
  private activeVideoId: string | null = null;
  private activeElement: HTMLVideoElement | null = null;
  private observer: IntersectionObserver | null = null;
  private hoverTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private videoElements = new Map<string, HTMLVideoElement>();
  private listeners = new Set<PreviewEventListener>();
  private abortController: AbortController | null = null;
  private isDestroyed = false;

  constructor(config: Partial<PreviewConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.config.autoplayEnabled = loadAutoplayPref();
    this.setupIntersectionObserver();
  }

  /* ── Public API ── */

  /**
   * Register a video element for preview autoplay management.
   */
  registerVideo(videoId: string, element: HTMLVideoElement): void {
    if (this.isDestroyed) return;

    element.muted = this.config.muted;
    element.playsInline = true;
    element.preload = "metadata";
    element.loop = false;

    this.videoElements.set(videoId, element);

    // Observe for intersection
    if (this.observer && element.parentElement) {
      this.observer.observe(element.parentElement);
    }

    // Time update handler for progress tracking + preview duration enforcement
    const onTimeUpdate = () => {
      if (this.activeVideoId !== videoId) return;
      const progress = element.duration > 0 ? element.currentTime / element.duration : 0;

      this.emit({ type: "progress", videoId, progress });

      // Enforce preview duration limit
      if (element.currentTime >= this.config.previewDurationSec) {
        this.stopPreview(videoId);
      }
    };

    const onEnded = () => {
      if (this.activeVideoId === videoId) {
        this.emit({ type: "ended", videoId });
        this.activeVideoId = null;
        this.activeElement = null;
      }
    };

    element.addEventListener("timeupdate", onTimeUpdate);
    element.addEventListener("ended", onEnded);
  }

  /**
   * Unregister a video element (cleanup).
   */
  unregisterVideo(videoId: string): void {
    const element = this.videoElements.get(videoId);
    if (element) {
      this.stopPreview(videoId);
      if (this.observer && element.parentElement) {
        this.observer.unobserve(element.parentElement);
      }
    }
    this.videoElements.delete(videoId);
    this.clearHoverTimer(videoId);
  }

  /**
   * Trigger preview playback for a specific video.
   * Stops any currently playing preview first.
   */
  startPreview(videoId: string): void {
    if (this.isDestroyed) return;
    if (!this.config.autoplayEnabled) return;
    if (!this.canAutoplay()) return;

    // Stop current preview
    if (this.activeVideoId && this.activeVideoId !== videoId) {
      this.stopPreview(this.activeVideoId);
    }

    const element = this.videoElements.get(videoId);
    if (!element) return;

    this.activeVideoId = videoId;
    this.activeElement = element;

    // Reset to start
    element.currentTime = 0;
    element.muted = this.config.muted;

    const playPromise = element.play();
    if (playPromise) {
      playPromise.catch(() => {
        // Autoplay blocked by browser — silently fail
        this.activeVideoId = null;
        this.activeElement = null;
      });
    }

    this.emit({ type: "play", videoId });
  }

  /**
   * Stop a specific video preview.
   */
  stopPreview(videoId: string): void {
    const element = this.videoElements.get(videoId);
    if (element) {
      element.pause();
      element.currentTime = 0;
    }

    if (this.activeVideoId === videoId) {
      this.activeVideoId = null;
      this.activeElement = null;
    }

    this.emit({ type: "pause", videoId });
  }

  /**
   * Stop all previews.
   */
  stopAll(): void {
    if (this.activeVideoId) {
      this.stopPreview(this.activeVideoId);
    }
    this.hoverTimers.forEach((timer) => clearTimeout(timer));
    this.hoverTimers.clear();
  }

  /**
   * Handle hover enter — start delayed preview.
   */
  onHoverEnter(videoId: string): void {
    if (!this.config.autoplayEnabled || !this.canAutoplay()) return;
    this.clearHoverTimer(videoId);

    const timer = setTimeout(() => {
      this.startPreview(videoId);
    }, this.config.hoverDelayMs);

    this.hoverTimers.set(videoId, timer);
  }

  /**
   * Handle hover leave — stop preview.
   */
  onHoverLeave(videoId: string): void {
    this.clearHoverTimer(videoId);
    this.stopPreview(videoId);
  }

  /**
   * Handle tap (mobile) — toggle preview.
   */
  onTap(videoId: string): void {
    if (this.activeVideoId === videoId) {
      this.stopPreview(videoId);
    } else {
      this.startPreview(videoId);
    }
  }

  /**
   * Subscribe to preview events.
   */
  subscribe(listener: PreviewEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current state.
   */
  getState(): { activeVideoId: string | null; autoplayEnabled: boolean } {
    return {
      activeVideoId: this.activeVideoId,
      autoplayEnabled: this.config.autoplayEnabled,
    };
  }

  /**
   * Toggle autoplay preference.
   */
  setAutoplayEnabled(enabled: boolean): void {
    this.config.autoplayEnabled = enabled;
    saveAutoplayPref(enabled);
    if (!enabled) {
      this.stopAll();
    }
  }

  /**
   * Destroy controller and clean up all resources.
   */
  destroy(): void {
    this.isDestroyed = true;
    this.stopAll();
    this.observer?.disconnect();
    this.observer = null;
    this.videoElements.clear();
    this.listeners.clear();
    this.abortController?.abort();
  }

  /* ── Internal ── */

  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === "undefined") return;

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const videoId = this.findVideoIdByParent(entry.target as HTMLElement);
          if (!videoId) continue;

          if (entry.isIntersecting && entry.intersectionRatio >= this.config.intersectionThreshold) {
            // Only auto-trigger on desktop (not tap-to-play mobile)
            if (!isMobile()) {
              this.onHoverEnter(videoId);
            }
          } else {
            // Out of view → stop
            this.clearHoverTimer(videoId);
            if (this.activeVideoId === videoId) {
              this.stopPreview(videoId);
            }
          }
        }
      },
      {
        threshold: [0, this.config.intersectionThreshold, 1.0],
        rootMargin: "0px",
      },
    );
  }

  private findVideoIdByParent(parent: HTMLElement): string | null {
    for (const [id, el] of this.videoElements) {
      if (el.parentElement === parent || el.closest("[data-preview-id]")?.getAttribute("data-preview-id") === id) {
        return id;
      }
    }
    return null;
  }

  private clearHoverTimer(videoId: string): void {
    const timer = this.hoverTimers.get(videoId);
    if (timer) {
      clearTimeout(timer);
      this.hoverTimers.delete(videoId);
    }
  }

  private emit(event: PreviewEvent): void {
    this.listeners.forEach((fn) => fn(event));
  }

  /**
   * Check if autoplay is allowed by device/browser conditions.
   */
  private canAutoplay(): boolean {
    // Check data saver mode
    if (isDataSaverEnabled()) return false;

    // Check low battery (if API available)
    if (isLowBattery()) return false;

    return true;
  }
}

/* ── Utility Functions ── */

/**
 * Check if device is mobile.
 */
function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

/**
 * Check if data saver / save-data is enabled.
 */
function isDataSaverEnabled(): boolean {
  if (typeof navigator === "undefined") return false;
  // Save-Data client hint
  const connection = (navigator as any).connection;
  if (connection?.saveData) return true;
  return false;
}

/**
 * Check if battery is low (<20%).
 */
function isLowBattery(): boolean {
  // Battery Status API is deprecated but still useful where available
  try {
    const battery = (navigator as any).battery || (navigator as any).getBattery?.();
    if (battery && typeof battery.level === "number") {
      return battery.level < 0.2;
    }
  } catch { /* API not available */ }
  return false;
}

/**
 * Load autoplay preference from localStorage.
 */
function loadAutoplayPref(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val !== "false"; // Default true
  } catch {
    return true;
  }
}

/**
 * Save autoplay preference.
 */
function saveAutoplayPref(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch { /* storage unavailable */ }
}

/* ── React Hook Helper ── */

/**
 * Create a singleton controller instance.
 * Call .destroy() on unmount.
 */
export function createPreviewController(
  config?: Partial<PreviewConfig>,
): PreviewAutoplayController {
  return new PreviewAutoplayController(config);
}

/**
 * Calculate preview scrub progress bar width as a CSS percentage string.
 */
export function getPreviewScrubStyle(progress: number): React.CSSProperties {
  return {
    width: `${Math.min(100, Math.max(0, progress * 100))}%`,
    transition: "width 250ms linear",
  };
}
