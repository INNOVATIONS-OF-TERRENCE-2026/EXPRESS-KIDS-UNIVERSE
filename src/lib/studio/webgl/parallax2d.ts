/**
 * parallax2d.ts — 2.5D Parallax layer system
 *
 * Manages layered backgrounds with depth-based parallax scrolling.
 * This is the bridge between static image scenes and animated scenes.
 *
 * Features:
 *   - Camera pan / zoom
 *   - Depth-sorted layer rendering
 *   - Mouse/touch-driven subtle parallax (desktop)
 *   - requestAnimationFrame throttled
 *   - GPU-composited (CSS transform driven)
 */

export interface ParallaxLayer {
  /** Unique layer ID */
  id: string;
  /** Asset reference (image URL) */
  assetRef: string;
  /** Depth factor: 0 = furthest back, 1 = closest to camera */
  depth: number;
  /** Base offset X (0–1 normalized) */
  offsetX: number;
  /** Base offset Y (0–1 normalized) */
  offsetY: number;
  /** Scale multiplier */
  scale: number;
  /** Opacity */
  opacity: number;
}

export interface ParallaxCamera {
  /** Camera X position (normalized) */
  x: number;
  /** Camera Y position (normalized) */
  y: number;
  /** Zoom level (1 = default) */
  zoom: number;
}

export interface ParallaxConfig {
  /** Layers sorted by depth (back to front) */
  layers: ParallaxLayer[];
  /** Canvas / container width */
  width: number;
  /** Canvas / container height */
  height: number;
  /** Parallax intensity multiplier */
  intensity: number;
  /** Whether to respond to mouse movement */
  mouseParallax: boolean;
}

/**
 * Parallax2D — Manages 2.5D depth layer rendering.
 *
 * Usage:
 *   const parallax = new Parallax2D(config);
 *   parallax.setCamera({ x: 0.5, y: 0.5, zoom: 1 });
 *   const transforms = parallax.computeTransforms();
 *   // Apply transforms to DOM elements or canvas draws
 *   parallax.dispose();
 */
export class Parallax2D {
  private config: ParallaxConfig;
  private camera: ParallaxCamera = { x: 0.5, y: 0.5, zoom: 1 };
  private mouseX = 0;
  private mouseY = 0;
  private rafId = 0;
  private disposed = false;
  private onUpdate: ((transforms: LayerTransform[]) => void) | null = null;

  constructor(config: ParallaxConfig) {
    this.config = config;

    if (config.mouseParallax && typeof window !== "undefined") {
      this.setupMouseTracking();
    }
  }

  /** Set camera position and zoom */
  setCamera(camera: Partial<ParallaxCamera>): void {
    this.camera = { ...this.camera, ...camera };
  }

  /** Animate camera to a target position */
  animateCamera(
    target: Partial<ParallaxCamera>,
    durationMs: number = 1000,
    easing: (t: number) => number = (t) => t * (2 - t), // easeOut
  ): Promise<void> {
    return new Promise((resolve) => {
      const start = { ...this.camera };
      const startTime = performance.now();

      const animate = (now: number) => {
        if (this.disposed) { resolve(); return; }
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / durationMs);
        const e = easing(t);

        this.camera = {
          x: start.x + ((target.x ?? start.x) - start.x) * e,
          y: start.y + ((target.y ?? start.y) - start.y) * e,
          zoom: start.zoom + ((target.zoom ?? start.zoom) - start.zoom) * e,
        };

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /** Compute CSS transforms for each layer based on camera + mouse */
  computeTransforms(): LayerTransform[] {
    const { intensity, mouseParallax } = this.config;
    const mouseOffsetX = mouseParallax ? (this.mouseX - 0.5) * intensity * 0.5 : 0;
    const mouseOffsetY = mouseParallax ? (this.mouseY - 0.5) * intensity * 0.5 : 0;

    return this.config.layers
      .sort((a, b) => a.depth - b.depth)
      .map((layer) => {
        const depthFactor = 1 - layer.depth; // deeper layers move MORE
        const cameraOffsetX = (this.camera.x - 0.5) * depthFactor * intensity * 100;
        const cameraOffsetY = (this.camera.y - 0.5) * depthFactor * intensity * 100;
        const mouseShiftX = mouseOffsetX * depthFactor * 30;
        const mouseShiftY = mouseOffsetY * depthFactor * 30;

        const tx = layer.offsetX * this.config.width + cameraOffsetX + mouseShiftX;
        const ty = layer.offsetY * this.config.height + cameraOffsetY + mouseShiftY;
        const scale = layer.scale * this.camera.zoom;

        return {
          layerId: layer.id,
          transform: `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`,
          opacity: layer.opacity,
          zIndex: Math.round(layer.depth * 100),
        };
      });
  }

  /** Register callback for transform updates */
  onTransformUpdate(cb: (transforms: LayerTransform[]) => void): void {
    this.onUpdate = cb;
    this.startLoop();
  }

  /** Clean up */
  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    this.onUpdate = null;

    if (typeof window !== "undefined") {
      window.removeEventListener("mousemove", this.handleMouseMove);
    }
  }

  private setupMouseTracking(): void {
    window.addEventListener("mousemove", this.handleMouseMove, { passive: true });
  }

  private handleMouseMove = (e: MouseEvent): void => {
    this.mouseX = e.clientX / window.innerWidth;
    this.mouseY = e.clientY / window.innerHeight;
  };

  private startLoop(): void {
    if (this.disposed) return;

    const tick = () => {
      if (this.disposed) return;
      const transforms = this.computeTransforms();
      this.onUpdate?.(transforms);
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }
}

/** Output transform for a single layer */
export interface LayerTransform {
  layerId: string;
  transform: string;
  opacity: number;
  zIndex: number;
}
