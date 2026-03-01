/**
 * ProPlayer.tsx — Cinematic cross-browser video player engine.
 *
 * Features:
 *   - Play / Pause
 *   - Rewind 5s / Forward 5s
 *   - Volume slider + mute toggle (persisted to localStorage)
 *   - Playback speed control (0.5x, 1x, 1.5x, 2x)
 *   - Fullscreen toggle (Fullscreen API + iOS webkitEnterFullscreen)
 *   - Timeline scrubber
 *   - Save to Gallery button
 *   - Download button (cross-origin blob fallback, iOS-safe)
 *   - Keyboard: Space/K (play), Left/Right (skip), M (mute), F (fullscreen), Escape
 *   - Mobile touch: tap-to-play, controls auto-hide
 *   - iOS-safe: playsInline, preload="metadata"
 *   - WebM + MP4 auto-detection (no hardcoded type)
 *   - Safari fallback: native controls if custom overlay fails
 *   - GPU-only animations (transform/opacity), no layout shifts
 *   - Accessibility: aria-labels, focus outlines
 */

import { useRef, useState, useEffect, useCallback, memo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  Save,
  X,
  AlertCircle,
  Loader2,
  Maximize,
  Minimize,
  Gauge,
} from "lucide-react";

/* ── Types ── */
interface ProPlayerProps {
  url: string;
  title?: string;
  poster?: string;
  onSave?: () => void;
  onClose?: () => void;
  showSave?: boolean;
  className?: string;
}

/* ── Constants ── */
const VOLUME_STORAGE_KEY = "eku_player_volume";
const SKIP_SECONDS = 5;
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
const CONTROLS_HIDE_MS = 3_500;

function getStoredVolume(): number {
  try {
    const v = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (v !== null) {
      const n = parseFloat(v);
      if (!isNaN(n) && n >= 0 && n <= 1) return n;
    }
  } catch { /* blocked */ }
  return 0.8;
}

function storeVolume(v: number) {
  try {
    localStorage.setItem(VOLUME_STORAGE_KEY, String(v));
  } catch { /* quota */ }
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Detect MIME type from URL extension */
function detectMimeType(url: string): string | undefined {
  const lower = url.toLowerCase().split("?")[0];
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mp4") || lower.endsWith(".m4v")) return "video/mp4";
  if (lower.endsWith(".ogg") || lower.endsWith(".ogv")) return "video/ogg";
  return undefined; // let browser auto-detect
}

type PlayerStatus = "loading" | "ready" | "error";

/* ══════════════════════════════════════════════════════════
   PRO PLAYER — Cinematic Video Engine
   ══════════════════════════════════════════════════════════ */
export const ProPlayer = memo(function ProPlayer({
  url,
  title,
  poster,
  onSave,
  onClose,
  showSave = true,
  className = "",
}: ProPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastVolumeRef = useRef(getStoredVolume());
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const useFallbackControls = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(getStoredVolume);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState<PlayerStatus>("loading");
  const [saved, setSaved] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const mimeType = detectMimeType(url);

  /* ── Auto-hide controls ── */
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setControlsVisible(false);
        setShowSpeedMenu(false);
      }
    }, CONTROLS_HIDE_MS);
  }, []);

  /* ── Sync volume to video element on mount ── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = lastVolumeRef.current;
  }, []);

  /* ── Video event listeners ── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => { setPlaying(true); showControls(); };
    const onPause = () => { setPlaying(false); setControlsVisible(true); };
    const onEnded = () => { setPlaying(false); setControlsVisible(true); };
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => {
      setDuration(video.duration);
      setStatus("ready");
    };
    const onCanPlay = () => setStatus("ready");
    const onError = () => {
      // If custom playback fails, enable native controls as fallback
      if (!useFallbackControls.current) {
        useFallbackControls.current = true;
        video.controls = true;
      }
      setStatus("error");
    };
    const onWaiting = () => setStatus("loading");
    const onPlaying = () => setStatus("ready");

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("error", onError);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);

    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("error", onError);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Fullscreen change listener ── */
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler);
    };
  }, []);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-SKIP_SECONDS);
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(SKIP_SECONDS);
          break;
        case "Escape":
          if (isFullscreen) toggleFullscreen();
          else if (onClose) onClose();
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, isFullscreen]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Actions ── */
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
    showControls();
  }, [showControls]);

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    showControls();
  }, [showControls]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const t = parseFloat(e.target.value);
    video.currentTime = t;
    setCurrentTime(t);
    showControls();
  }, [showControls]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const v = parseFloat(e.target.value);
    video.volume = v;
    video.muted = false;
    setVolumeState(v);
    setMuted(false);
    lastVolumeRef.current = v > 0 ? v : lastVolumeRef.current;
    storeVolume(v);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.muted || video.volume === 0) {
      const restore = lastVolumeRef.current > 0 ? lastVolumeRef.current : 0.8;
      video.muted = false;
      video.volume = restore;
      setVolumeState(restore);
      setMuted(false);
    } else {
      lastVolumeRef.current = video.volume;
      video.muted = true;
      setMuted(true);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else if (container.requestFullscreen) {
      container.requestFullscreen().catch(() => {});
    } else if ((video as any)?.webkitEnterFullscreen) {
      // iOS Safari fallback — fullscreen the video element directly
      (video as any).webkitEnterFullscreen();
    }
  }, []);

  const changeSpeed = useCallback((speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    showControls();
  }, [showControls]);

  const handleSave = useCallback(() => {
    if (saved) return;
    setSaved(true);
    onSave?.();
  }, [onSave, saved]);

  const handleDownload = useCallback(() => {
    if (!url || downloading) return;
    const ext = url.toLowerCase().includes(".webm") ? "webm" : "mp4";
    const filename = title ? `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.${ext}` : `video.${ext}`;
    const isSameOrigin = url.startsWith(window.location.origin) || url.startsWith("/");

    if (isSameOrigin) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      setDownloading(true);
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("fetch failed");
          return res.blob();
        })
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
        })
        .catch(() => {
          window.open(url, "_blank", "noopener,noreferrer");
        })
        .finally(() => setDownloading(false));
    }
  }, [url, title, downloading]);

  return (
    <div
      ref={containerRef}
      className={`pro-player relative rounded-2xl overflow-hidden bg-black ${className}`}
      style={{ minHeight: 200 }}
      onMouseMove={showControls}
      onTouchStart={showControls}
    >
      {/* Close button (top-right) */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/70 transition-colors"
          aria-label="Close player"
          style={{ opacity: controlsVisible ? 1 : 0, transition: "opacity 0.3s" }}
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Title overlay */}
      {title && (
        <div
          className="absolute top-3 left-3 z-10 px-3 py-1 rounded-lg bg-black/50 backdrop-blur-sm"
          style={{ opacity: controlsVisible ? 1 : 0, transition: "opacity 0.3s" }}
        >
          <p className="text-white text-sm font-medium truncate max-w-[240px]">{title}</p>
        </div>
      )}

      {/* Video element — NO hardcoded type; uses src directly for auto-detection */}
      <video
        ref={videoRef}
        playsInline
        preload="metadata"
        controls={false}
        poster={poster}
        className="w-full block cursor-pointer"
        style={{ borderRadius: isFullscreen ? 0 : 16, aspectRatio: "16/9", objectFit: "contain", background: "#000" }}
        onClick={togglePlay}
        src={url}
      />

      {/* Loading overlay */}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      {/* Error overlay */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-white text-sm">Failed to load video</p>
          <button
            onClick={() => {
              setStatus("loading");
              const v = videoRef.current;
              if (v) { v.load(); v.play().catch(() => {}); }
            }}
            className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Controls Bar ── */}
      <div
        className="pro-player-controls px-4 py-3 bg-gradient-to-t from-black/80 to-transparent"
        style={{ opacity: controlsVisible ? 1 : 0, transition: "opacity 0.3s" }}
      >
        {/* Timeline */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white/70 text-xs tabular-nums w-10 text-right shrink-0">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="pro-player-timeline flex-1 h-1 accent-primary cursor-pointer"
            aria-label="Video timeline"
          />
          <span className="text-white/70 text-xs tabular-nums w-10 shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* Button row */}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="pro-player-btn"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          {/* Rewind 5s */}
          <button
            onClick={() => skip(-SKIP_SECONDS)}
            className="pro-player-btn"
            aria-label="Rewind 5 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Forward 5s */}
          <button
            onClick={() => skip(SKIP_SECONDS)}
            className="pro-player-btn"
            aria-label="Forward 5 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={toggleMute}
              className="pro-player-btn"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="pro-player-volume w-16 sm:w-20 h-1 accent-primary cursor-pointer"
              aria-label="Volume"
            />
          </div>

          {/* Playback Speed */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu((v) => !v)}
              className="pro-player-btn"
              aria-label="Playback speed"
            >
              <Gauge className="w-4 h-4" />
              <span className="text-xs ml-0.5 hidden sm:inline">{playbackSpeed}x</span>
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-black/90 backdrop-blur-sm rounded-lg py-1 min-w-[80px] z-30">
                {SPEED_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeSpeed(s)}
                    className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 transition-colors ${
                      playbackSpeed === s ? "text-primary font-bold" : "text-white/80"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Save */}
          {showSave && onSave && (
            <button
              onClick={handleSave}
              disabled={saved}
              className={`pro-player-btn ${saved ? "text-green-400" : ""}`}
              aria-label={saved ? "Saved to Gallery" : "Save to Gallery"}
            >
              <Save className="w-4 h-4" />
              <span className="text-xs hidden sm:inline ml-1">{saved ? "Saved" : "Save"}</span>
            </button>
          )}

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="pro-player-btn"
            aria-label={downloading ? "Downloading…" : "Download video"}
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="text-xs hidden sm:inline ml-1">
              {downloading ? "…" : "Download"}
            </span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="pro-player-btn"
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
});
