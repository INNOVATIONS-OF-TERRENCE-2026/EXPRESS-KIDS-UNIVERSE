/**
 * ProPlayer.tsx — Cross-browser video player with pro controls.
 *
 * Features:
 *   - Play/Pause, Rewind 5s, Forward 5s
 *   - Timeline scrubber
 *   - Volume slider + mute toggle (persisted to localStorage)
 *   - Save to Gallery button
 *   - Download button (iOS-safe fallback)
 *   - Keyboard: Space, Left/Right arrows, Escape
 *   - Accessibility: aria-labels, focus outlines
 *   - iOS-safe: playsInline, preload="metadata"
 *   - GPU-only animations, no layout shifts
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

type PlayerStatus = "loading" | "ready" | "error";

/* ══════════════════════════════════════════════════════════
   PRO PLAYER
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

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(getStoredVolume);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState<PlayerStatus>("loading");
  const [saved, setSaved] = useState(false);

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

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => {
      setDuration(video.duration);
      setStatus("ready");
    };
    const onCanPlay = () => setStatus("ready");
    const onError = () => setStatus("error");
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
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("error", onError);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
    };
  }, []);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only respond when our container is in the DOM
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
          if (onClose) onClose();
          break;
        case "m":
          toggleMute();
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Actions ── */
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const t = parseFloat(e.target.value);
    video.currentTime = t;
    setCurrentTime(t);
  }, []);

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

  const handleSave = useCallback(() => {
    if (saved) return;
    setSaved(true);
    onSave?.();
  }, [onSave, saved]);

  const handleDownload = useCallback(() => {
    if (!url) return;
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = title ? `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.mp4` : "video.mp4";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // Fallback for cross-origin or iOS Safari
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, [url, title]);

  /* ── Status label ── */
  const statusLabel =
    status === "loading" ? "Loading…" :
    status === "error" ? "Error loading video" :
    "Ready";

  return (
    <div
      ref={containerRef}
      className={`pro-player relative rounded-2xl overflow-hidden bg-black ${className}`}
      style={{ minHeight: 200 }}
    >
      {/* Close button (top-right) */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/70 transition-colors"
          aria-label="Close player"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Title overlay */}
      {title && (
        <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-lg bg-black/50 backdrop-blur-sm">
          <p className="text-white text-sm font-medium truncate max-w-[240px]">{title}</p>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        playsInline
        preload="metadata"
        controls={false}
        poster={poster}
        className="w-full block cursor-pointer"
        style={{ borderRadius: 16, aspectRatio: "16/9", objectFit: "contain", background: "#000" }}
        onClick={togglePlay}
      >
        <source src={url} type="video/mp4" />
        Your browser does not support video playback.
      </video>

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
            onClick={() => videoRef.current?.load()}
            className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Controls Bar ── */}
      <div className="pro-player-controls px-4 py-3 bg-gradient-to-t from-black/80 to-transparent">
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

          {/* Spacer */}
          <div className="flex-1" />

          {/* Status */}
          <span className="text-white/50 text-xs hidden sm:block">{statusLabel}</span>

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
            className="pro-player-btn"
            aria-label="Download video"
          >
            <Download className="w-4 h-4" />
            <span className="text-xs hidden sm:inline ml-1">Download</span>
          </button>
        </div>
      </div>
    </div>
  );
});
