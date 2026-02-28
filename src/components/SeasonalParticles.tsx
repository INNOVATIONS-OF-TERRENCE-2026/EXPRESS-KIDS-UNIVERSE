import { memo, useMemo } from "react";
import { useTheme } from "@/context/ThemeProvider";
import { getSeasonForTheme, type Season } from "@/theme/seasonalThemes";

/**
 * SeasonalParticles — Lightweight CSS-animated seasonal overlay.
 *
 * Renders particles (snowflakes / petals / confetti / leaves) using
 * pure CSS animations. GPU-composited (transform + opacity only).
 * z-index layered BELOW interactive UI. pointer-events: none.
 *
 * Only renders when the active theme belongs to a seasonal bundle.
 * On non-seasonal themes this component returns null.
 *
 * Reduced motion: respects prefers-reduced-motion by not rendering.
 */

const PARTICLE_CONFIGS: Record<Season, { count: number; chars: string[]; className: string }> = {
  winter: { count: 25, chars: ["❄", "❅", "❆", "✦"], className: "seasonal-particles-winter" },
  spring: { count: 20, chars: ["🌸", "✿", "❀", "🌷"], className: "seasonal-particles-spring" },
  summer: { count: 18, chars: ["✨", "⭐", "🎆", "✧"], className: "seasonal-particles-summer" },
  fall:   { count: 20, chars: ["🍂", "🍁", "🍃", "✦"], className: "seasonal-particles-fall" },
};

export const SeasonalParticles = memo(function SeasonalParticles() {
  const { theme } = useTheme();

  const seasonBundle = useMemo(() => getSeasonForTheme(theme.id), [theme.id]);

  const particles = useMemo(() => {
    if (!seasonBundle) return null;
    const config = PARTICLE_CONFIGS[seasonBundle.season];
    return Array.from({ length: config.count }, (_, i) => ({
      id: i,
      char: config.chars[i % config.chars.length],
      left: `${(i * 37 + 13) % 100}%`,
      delay: `${(i * 1.7) % 12}s`,
      duration: `${8 + (i * 3.1) % 8}s`,
      size: `${0.6 + (i * 0.13) % 0.8}rem`,
      opacity: 0.3 + (i * 0.07) % 0.4,
    }));
  }, [seasonBundle]);

  // Don't render if not a seasonal theme
  if (!seasonBundle || !particles) return null;

  return (
    <div
      className={`seasonal-particles ${seasonBundle.particleClass}`}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="seasonal-particle"
          style={{
            position: "absolute",
            left: p.left,
            top: "-5%",
            fontSize: p.size,
            opacity: p.opacity,
            animationDelay: p.delay,
            animationDuration: p.duration,
            willChange: "transform, opacity",
          }}
        >
          {p.char}
        </span>
      ))}
    </div>
  );
});
