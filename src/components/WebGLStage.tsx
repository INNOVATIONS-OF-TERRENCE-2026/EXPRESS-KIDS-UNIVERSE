import { memo, useEffect, useRef, useCallback, useState } from "react";
import { createRenderer, type IRenderer } from "@/lib/studio/webgl/engine";

/**
 * WebGLStage — Canvas component for episode rendering.
 *
 * Features:
 *   - Handles resize + device pixel ratio
 *   - Only initializes renderer when mounted (lazy)
 *   - Cleanup on unmount
 *   - Fallback message if canvas not supported
 */

interface WebGLStageProps {
  /** Width in CSS pixels (default: 100%) */
  width?: string | number;
  /** Height in CSS pixels (default: 400px) */
  height?: string | number;
  /** Additional class name */
  className?: string;
  /** Called when renderer is ready */
  onReady?: (renderer: IRenderer) => void;
}

export const WebGLStage = memo(function WebGLStage({
  width = "100%",
  height = 400,
  className = "",
  onReady,
}: WebGLStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<IRenderer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initRenderer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const renderer = createRenderer();
      renderer.init(canvas);
      rendererRef.current = renderer;

      renderer.on((event) => {
        if (event.type === "error") {
          setError(event.message);
        }
      });

      onReady?.(renderer);
    } catch (err) {
      setError("Failed to initialize rendering engine.");
    }
  }, [onReady]);

  useEffect(() => {
    initRenderer();

    // Handle resize
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, [initRenderer]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/30 rounded-xl border border-border/50 text-muted-foreground text-sm ${className}`}
        style={{ width, height }}
      >
        <p>{error}</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`rounded-xl ${className}`}
      style={{
        width,
        height,
        display: "block",
        background: "hsl(var(--eku-bg))",
      }}
    />
  );
});
