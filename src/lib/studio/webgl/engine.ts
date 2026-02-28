/**
 * engine.ts — Abstract WebGL/Canvas renderer interface
 *
 * Provides a renderer abstraction that downstream implementations
 * (WebGL 2.0, Canvas 2D, or server-side) can fulfil.
 *
 * No heavy dependencies — this is pure TypeScript scaffolding.
 */

import type { RenderPlan, ShotRenderPlan, RenderLayer } from "../renderPlan";

/** Renderer capabilities */
export interface RendererCapabilities {
  maxTextureSize: number;
  supportsWebGL2: boolean;
  supportsOffscreen: boolean;
  devicePixelRatio: number;
  maxLayers: number;
}

/** Asset loading status */
export interface AssetLoadStatus {
  total: number;
  loaded: number;
  failed: number;
  percent: number;
}

/** Renderer event types */
export type RendererEvent =
  | { type: "assets-progress"; status: AssetLoadStatus }
  | { type: "assets-ready" }
  | { type: "frame"; frameNumber: number; timeSec: number }
  | { type: "shot-change"; shot: ShotRenderPlan }
  | { type: "error"; message: string }
  | { type: "disposed" };

export type RendererEventListener = (event: RendererEvent) => void;

/**
 * Abstract renderer interface.
 *
 * Implementations:
 *   - WebGL2Renderer (future)
 *   - Canvas2DRenderer (future)
 *   - ServerRenderer (future)
 */
export interface IRenderer {
  /** Initialize with a canvas element */
  init(canvas: HTMLCanvasElement): void;

  /** Query renderer capabilities */
  getCapabilities(): RendererCapabilities;

  /** Load assets from a render plan */
  loadAssets(plan: RenderPlan): Promise<void>;

  /** Start playback of a specific shot */
  play(shotId?: string): void;

  /** Pause rendering */
  pause(): void;

  /** Resume rendering */
  resume(): void;

  /** Seek to a time offset in seconds */
  seekTo(timeSec: number): void;

  /** Render a single frame at the given time */
  renderFrame(timeSec: number): void;

  /** Subscribe to renderer events */
  on(listener: RendererEventListener): () => void;

  /** Clean up all resources */
  dispose(): void;
}

/**
 * NullRenderer — No-op implementation for testing and SSR.
 */
export class NullRenderer implements IRenderer {
  private listeners: RendererEventListener[] = [];

  init(_canvas: HTMLCanvasElement): void {}

  getCapabilities(): RendererCapabilities {
    return {
      maxTextureSize: 0,
      supportsWebGL2: false,
      supportsOffscreen: false,
      devicePixelRatio: 1,
      maxLayers: 0,
    };
  }

  async loadAssets(_plan: RenderPlan): Promise<void> {
    this.emit({ type: "assets-ready" });
  }

  play(_shotId?: string): void {}
  pause(): void {}
  resume(): void {}
  seekTo(_timeSec: number): void {}
  renderFrame(_timeSec: number): void {}

  on(listener: RendererEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  dispose(): void {
    this.emit({ type: "disposed" });
    this.listeners = [];
  }

  private emit(event: RendererEvent): void {
    this.listeners.forEach((l) => {
      try { l(event); } catch { /* */ }
    });
  }
}

/**
 * Canvas2DRenderer — Lightweight 2D canvas renderer for 2.5D parallax scenes.
 *
 * This is the initial renderer implementation that bridges static image
 * scenes toward animated scenes via layered parallax.
 */
export class Canvas2DRenderer implements IRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private plan: RenderPlan | null = null;
  private listeners: RendererEventListener[] = [];
  private rafId = 0;
  private playing = false;
  private currentTime = 0;
  private lastFrame = 0;
  private currentShotIndex = 0;
  private disposed = false;

  // Placeholder loaded "assets" (in production these would be Image objects)
  private loadedAssets = new Map<string, boolean>();

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    // Handle device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    this.ctx?.scale(dpr, dpr);
  }

  getCapabilities(): RendererCapabilities {
    return {
      maxTextureSize: 4096,
      supportsWebGL2: false,
      supportsOffscreen: typeof OffscreenCanvas !== "undefined",
      devicePixelRatio: window.devicePixelRatio || 1,
      maxLayers: 20,
    };
  }

  async loadAssets(plan: RenderPlan): Promise<void> {
    this.plan = plan;
    const total = plan.assetManifest.length;
    let loaded = 0;

    // Simulate asset loading (in production, load actual images)
    for (const asset of plan.assetManifest) {
      this.loadedAssets.set(asset.ref, true);
      loaded++;
      this.emit({
        type: "assets-progress",
        status: { total, loaded, failed: 0, percent: (loaded / total) * 100 },
      });
    }

    this.emit({ type: "assets-ready" });
  }

  play(_shotId?: string): void {
    if (!this.plan || this.playing) return;
    this.playing = true;
    this.lastFrame = performance.now();
    this.tick();
  }

  pause(): void {
    this.playing = false;
    cancelAnimationFrame(this.rafId);
  }

  resume(): void {
    if (this.playing) return;
    this.play();
  }

  seekTo(timeSec: number): void {
    this.currentTime = timeSec;
    this.renderFrame(timeSec);
  }

  renderFrame(timeSec: number): void {
    if (!this.ctx || !this.canvas || !this.plan) return;

    const { width, height } = this.canvas.getBoundingClientRect();
    const ctx = this.ctx;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Find current shot
    const shot = this.plan.shots[this.currentShotIndex];
    if (!shot) return;

    // Render color grade overlay as background
    const { colorGrade } = shot;
    ctx.fillStyle = `hsla(${colorGrade.hue}, ${colorGrade.saturation}%, ${colorGrade.lightness}%, ${colorGrade.opacity})`;
    ctx.fillRect(0, 0, width, height);

    // Render layers with parallax offset
    shot.layers.forEach((layer) => {
      this.renderLayer(ctx, layer, width, height, timeSec);
    });

    this.emit({ type: "frame", frameNumber: Math.floor(timeSec * (this.plan?.fps ?? 30)), timeSec });
  }

  on(listener: RendererEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  dispose(): void {
    this.disposed = true;
    this.playing = false;
    cancelAnimationFrame(this.rafId);
    this.canvas = null;
    this.ctx = null;
    this.plan = null;
    this.loadedAssets.clear();
    this.emit({ type: "disposed" });
    this.listeners = [];
  }

  private renderLayer(
    ctx: CanvasRenderingContext2D,
    layer: RenderLayer,
    width: number,
    height: number,
    _timeSec: number,
  ): void {
    ctx.save();
    ctx.globalAlpha = layer.opacity;

    // Parallax offset based on depth
    const parallaxX = (layer.depth - 0.5) * 20 * Math.sin(_timeSec * 0.3);
    const parallaxY = (layer.depth - 0.5) * 10 * Math.cos(_timeSec * 0.2);

    const x = layer.position.x * width + parallaxX;
    const y = layer.position.y * height + parallaxY;

    // Placeholder rectangle (in production this would be an image draw)
    const layerW = width * layer.scale * (layer.type === "character" ? 0.15 : 0.8);
    const layerH = height * layer.scale * (layer.type === "character" ? 0.4 : 0.6);

    const colors: Record<string, string> = {
      background: "rgba(13, 10, 46, 0.3)",
      midground: "rgba(40, 30, 80, 0.2)",
      character: "rgba(168, 85, 247, 0.3)",
      foreground: "rgba(6, 182, 212, 0.1)",
      ui: "rgba(255, 255, 255, 0.1)",
      effect: "rgba(245, 158, 11, 0.15)",
    };

    ctx.fillStyle = colors[layer.type] ?? "rgba(100,100,100,0.2)";
    ctx.fillRect(x - layerW / 2, y - layerH / 2, layerW, layerH);

    ctx.restore();
  }

  private tick = (): void => {
    if (!this.playing || this.disposed) return;

    const now = performance.now();
    const delta = (now - this.lastFrame) / 1000;
    this.lastFrame = now;
    this.currentTime += delta;

    // Advance shot pointer
    if (this.plan) {
      const shots = this.plan.shots;
      for (let i = 0; i < shots.length; i++) {
        const shot = shots[i];
        // Find the shot that contains current time
        if (i < shots.length - 1) {
          const nextShot = shots[i + 1];
          // Simple sequential: if we've passed enough time, advance
          const shotDuration = shot.camera.durationSec || 5;
          if (this.currentTime > shotDuration * (i + 1)) continue;
        }
        if (i !== this.currentShotIndex) {
          this.currentShotIndex = i;
          this.emit({ type: "shot-change", shot });
        }
        break;
      }

      // Check if done
      if (this.currentTime >= this.plan.totalDurationSec) {
        this.playing = false;
        return;
      }
    }

    this.renderFrame(this.currentTime);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private emit(event: RendererEvent): void {
    this.listeners.forEach((l) => {
      try { l(event); } catch { /* */ }
    });
  }
}

/** Detect best available renderer */
export function createRenderer(): IRenderer {
  if (typeof window === "undefined") return new NullRenderer();
  return new Canvas2DRenderer();
}
