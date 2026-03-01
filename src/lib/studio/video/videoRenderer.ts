/**
 * videoRenderer.ts — Client-side video composition engine.
 *
 * Takes a CompositionManifest (scene images + ElevenLabs narration audio)
 * and produces a real WebM video file using:
 *   - Canvas2D for scene rendering (Ken Burns effect, transitions, subtitles)
 *   - AudioContext for narration playback scheduling
 *   - MediaRecorder for capturing the combined video+audio stream
 *
 * The rendered WebM is uploaded to Supabase storage and becomes the
 * permanent output_url for the video job.
 */

import type { CompositionManifest, CompositionScene } from "./videoJobTypes";
import { supabase } from "@/integrations/supabase/client";

/* ── Constants ── */
const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 24;
const FADE_SEC = 0.6; // cross-fade between scenes

/* ── Public API ── */

export interface RenderCallbacks {
  onProgress: (pct: number) => void;
  onPhase: (label: string) => void;
}

/**
 * Render a composition manifest into a WebM video blob.
 *
 * Progress reports 0-100 via callbacks. Runs in approximately real-time
 * (duration ≈ total narration length). Keep the browser tab active.
 */
export async function renderVideoFromManifest(
  manifest: CompositionManifest,
  callbacks: RenderCallbacks,
): Promise<{ blob: Blob; durationSec: number }> {
  callbacks.onPhase("Loading scene images…");
  callbacks.onProgress(0);

  // ── Pre-load images ──
  const images = await Promise.all(
    manifest.scenes.map((s) => loadImage(s.imageUrl)),
  );

  callbacks.onPhase("Loading narration audio…");
  callbacks.onProgress(5);

  // ── Pre-load & decode audio ──
  const audioCtx = new AudioContext();
  const audioBuffers: (AudioBuffer | null)[] = [];
  let actualTotalDuration = 0;

  for (let i = 0; i < manifest.scenes.length; i++) {
    const scene = manifest.scenes[i];
    if (scene.audioUrl) {
      try {
        const res = await fetch(scene.audioUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        const decoded = await audioCtx.decodeAudioData(arrayBuf);
        audioBuffers.push(decoded);
        actualTotalDuration += decoded.duration;
      } catch (err) {
        console.warn(`[VideoRenderer] Failed to load audio for scene ${i + 1}:`, err);
        audioBuffers.push(null);
        actualTotalDuration += scene.audioDurationSec;
      }
    } else {
      audioBuffers.push(null);
      actualTotalDuration += scene.audioDurationSec;
    }
  }

  // Add 1s padding at end for final fade-out
  actualTotalDuration += 1;

  callbacks.onPhase("Rendering video…");
  callbacks.onProgress(10);

  // ── Create canvas ──
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d")!;

  // ── Audio destination for recording ──
  await audioCtx.resume();
  const dest = audioCtx.createMediaStreamDestination();

  // Schedule all audio clips at correct offsets
  const sceneTimes: { startSec: number; durationSec: number }[] = [];
  let audioOffset = 0;
  const startTime = audioCtx.currentTime;

  for (let i = 0; i < manifest.scenes.length; i++) {
    const buf = audioBuffers[i];
    const dur = buf ? buf.duration : manifest.scenes[i].audioDurationSec;
    sceneTimes.push({ startSec: audioOffset, durationSec: dur });

    if (buf) {
      const source = audioCtx.createBufferSource();
      source.buffer = buf;
      source.connect(dest);
      source.start(startTime + audioOffset);
    }

    audioOffset += dur;
  }

  // ── Combine canvas video stream + audio stream ──
  const videoStream = canvas.captureStream(FPS);
  const audioTrack = dest.stream.getAudioTracks()[0];

  const combinedStream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...(audioTrack ? [audioTrack] : []),
  ]);

  // ── Choose best available codec ──
  const mimeType = pickMimeType();

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 2_500_000,
    audioBitsPerSecond: 128_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise<{ blob: Blob; durationSec: number }>((resolve, reject) => {
    recorder.onstop = () => {
      audioCtx.close().catch(() => {});
      const blob = new Blob(chunks, { type: mimeType });
      resolve({ blob, durationSec: actualTotalDuration });
    };

    recorder.onerror = () => {
      audioCtx.close().catch(() => {});
      reject(new Error("MediaRecorder error"));
    };

    recorder.start(1000); // collect data every 1 second

    // ── Animation loop ──
    // Use setInterval for consistent timing even when tab loses focus briefly
    const interval = setInterval(() => {
      const elapsed = audioCtx.currentTime - startTime;
      const progress = Math.min(elapsed / actualTotalDuration, 1);

      // Report progress: 10% (start rendering) → 98% (done rendering)
      callbacks.onProgress(10 + Math.round(progress * 88));

      // Find current scene
      let sceneIdx = 0;
      for (let i = 0; i < sceneTimes.length; i++) {
        const sceneEnd = sceneTimes[i].startSec + sceneTimes[i].durationSec;
        if (elapsed < sceneEnd) {
          sceneIdx = i;
          break;
        }
        if (i === sceneTimes.length - 1) sceneIdx = i;
      }

      const sceneTime = sceneTimes[sceneIdx];
      const sceneProgress = Math.min(
        (elapsed - sceneTime.startSec) / sceneTime.durationSec,
        1,
      );

      drawScene(ctx, images[sceneIdx], manifest.scenes[sceneIdx], sceneProgress, sceneIdx);

      if (progress >= 1) {
        clearInterval(interval);
        // Draw final black frame
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        // Allow MediaRecorder to flush
        setTimeout(() => recorder.stop(), 500);
      }
    }, 1000 / FPS);
  });
}

/**
 * Upload a rendered WebM blob to Supabase storage.
 * Returns the public URL, or null on failure.
 */
export async function uploadRenderedVideo(
  blob: Blob,
  jobId: string,
): Promise<string | null> {
  try {
    const path = `renders/${jobId}.webm`;
    const { error } = await supabase.storage
      .from("video-assets")
      .upload(path, blob, {
        contentType: "video/webm",
        upsert: true,
      });

    if (error) {
      console.error("[VideoRenderer] Upload error:", error);
      return null;
    }

    const { data } = supabase.storage.from("video-assets").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error("[VideoRenderer] Upload failed:", err);
    return null;
  }
}

/* ── Scene Drawing ── */

function drawScene(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  scene: CompositionScene,
  progress: number, // 0-1 within this scene
  sceneIdx: number,
) {
  // Clear to black
  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (img && img.naturalWidth > 0) {
    // Ken Burns: slow zoom + gentle pan
    ctx.save();
    const scale = 1.0 + progress * 0.12; // zoom 1.0 → 1.12
    const panX = (sceneIdx % 2 === 0 ? 1 : -1) * progress * 30;
    const panY = (sceneIdx % 3 === 0 ? 1 : -1) * progress * 15;

    ctx.translate(WIDTH / 2 + panX, HEIGHT / 2 + panY);
    ctx.scale(scale, scale);
    ctx.translate(-WIDTH / 2, -HEIGHT / 2);

    // Cover-fit the image
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = WIDTH / HEIGHT;
    let dw: number, dh: number, dx: number, dy: number;

    if (imgRatio > canvasRatio) {
      dh = HEIGHT;
      dw = HEIGHT * imgRatio;
      dx = (WIDTH - dw) / 2;
      dy = 0;
    } else {
      dw = WIDTH;
      dh = WIDTH / imgRatio;
      dx = 0;
      dy = (HEIGHT - dh) / 2;
    }

    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  } else {
    // No image — themed gradient
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, "#2d1b69");
    gradient.addColorStop(0.5, "#1a3a5c");
    gradient.addColorStop(1, "#11998e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Show scene caption centered
    if (scene.caption) {
      ctx.save();
      ctx.font = "bold 36px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      wrapText(ctx, scene.caption, WIDTH / 2, HEIGHT / 2, WIDTH - 120, 48);
      ctx.restore();
    }
  }

  // Cross-fade in (first 0.05 of scene)
  if (progress < FADE_SEC / Math.max(1, scene.audioDurationSec)) {
    const fadeRatio = FADE_SEC / Math.max(1, scene.audioDurationSec);
    const alpha = 1 - progress / fadeRatio;
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(alpha, 1)})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // Cross-fade out (last 0.05 of scene)
  const fadeOutStart = 1 - FADE_SEC / Math.max(1, scene.audioDurationSec);
  if (progress > fadeOutStart) {
    const alpha = (progress - fadeOutStart) / (1 - fadeOutStart);
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(alpha, 1)})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // Subtitle bar at bottom
  if (scene.caption) {
    drawSubtitle(ctx, scene.caption);
  }
}

function drawSubtitle(ctx: CanvasRenderingContext2D, text: string) {
  ctx.save();
  ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  const maxWidth = WIDTH - 80;
  const metrics = ctx.measureText(text);
  const displayText =
    metrics.width > maxWidth ? text.slice(0, 80) + "…" : text;

  const textW = Math.min(ctx.measureText(displayText).width, maxWidth);
  const padding = 16;
  const barH = 40;
  const barX = (WIDTH - textW) / 2 - padding;
  const barY = HEIGHT - 56;

  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.beginPath();
  ctx.roundRect(barX, barY, textW + padding * 2, barH, 8);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.fillText(displayText, WIDTH / 2, HEIGHT - 22);
  ctx.restore();
}

/* ── Utilities ── */

function loadImage(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function pickMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  for (const mt of candidates) {
    if (MediaRecorder.isTypeSupported(mt)) return mt;
  }
  return "video/webm";
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => {
    ctx.fillText(l, x, startY + i * lineHeight);
  });
}
