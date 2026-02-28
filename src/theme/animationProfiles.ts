/**
 * Express Kids Universe — Animation Profiles per Theme
 *
 * Each theme has a unique animation personality that controls:
 *  - Background particle behavior
 *  - Glow intensity multiplier
 *  - Hover transform scale
 *  - Button shimmer speed
 *  - Page entrance timing
 *  - Gradient animation speed
 *  - Sparkle density
 *  - Float amplitude
 *
 * ThemeProvider reads the active profile and exposes it via context
 * so any component can adapt its motion to the current theme.
 */

export interface AnimationProfile {
  /** Unique id matching theme id */
  themeId: string;
  /** Descriptive label */
  label: string;

  /* ── Particle / background ── */
  /** Particle count multiplier (1 = default 60 particles) */
  particleDensity: number;
  /** Particle drift speed multiplier */
  particleSpeed: number;
  /** Primary particle color (CSS color) */
  particleColor: string;

  /* ── Glow ── */
  /** Glow intensity multiplier (1 = default) */
  glowIntensity: number;
  /** Glow pulse speed in seconds */
  glowPulseSpeed: number;

  /* ── Hover / interaction ── */
  /** Hover scale factor */
  hoverScale: number;
  /** Hover transition duration (ms) */
  hoverDuration: number;

  /* ── Shimmer ── */
  /** Shimmer sweep speed (seconds) */
  shimmerSpeed: number;
  /** Shimmer opacity (0-1) */
  shimmerOpacity: number;

  /* ── Gradient ── */
  /** Aurora / gradient flow speed (seconds) */
  gradientSpeed: number;
  /** Gradient direction angle (deg) */
  gradientAngle: number;

  /* ── Page entrance ── */
  /** Page entrance duration (seconds) */
  entranceDuration: number;
  /** Entrance easing curve (CSS cubic-bezier) */
  entranceEase: string;

  /* ── Float ── */
  /** Float animation amplitude in px */
  floatAmplitude: number;
  /** Float cycle duration in seconds */
  floatDuration: number;
}

const PROFILES: AnimationProfile[] = [
  {
    themeId: "candy-nebula",
    label: "Floating Confetti Sparkle",
    particleDensity: 1.3,
    particleSpeed: 0.8,
    particleColor: "#f472b6",
    glowIntensity: 1.2,
    glowPulseSpeed: 2.5,
    hoverScale: 1.08,
    hoverDuration: 280,
    shimmerSpeed: 2.2,
    shimmerOpacity: 0.12,
    gradientSpeed: 7,
    gradientAngle: 135,
    entranceDuration: 0.5,
    entranceEase: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    floatAmplitude: 12,
    floatDuration: 7,
  },
  {
    themeId: "cosmic-studio",
    label: "Cinematic Shimmer Sweep",
    particleDensity: 0.9,
    particleSpeed: 0.5,
    particleColor: "#818cf8",
    glowIntensity: 0.9,
    glowPulseSpeed: 3.5,
    hoverScale: 1.05,
    hoverDuration: 350,
    shimmerSpeed: 3.0,
    shimmerOpacity: 0.08,
    gradientSpeed: 10,
    gradientAngle: 140,
    entranceDuration: 0.7,
    entranceEase: "cubic-bezier(0.22, 1, 0.36, 1)",
    floatAmplitude: 8,
    floatDuration: 8,
  },
  {
    themeId: "rocket-rainbow",
    label: "Fast Radiant Streaks",
    particleDensity: 1.5,
    particleSpeed: 1.4,
    particleColor: "#f97316",
    glowIntensity: 1.4,
    glowPulseSpeed: 1.8,
    hoverScale: 1.1,
    hoverDuration: 200,
    shimmerSpeed: 1.5,
    shimmerOpacity: 0.15,
    gradientSpeed: 5,
    gradientAngle: 120,
    entranceDuration: 0.4,
    entranceEase: "cubic-bezier(0.16, 1, 0.3, 1)",
    floatAmplitude: 14,
    floatDuration: 5,
  },
  {
    themeId: "stardust-gold",
    label: "Golden Dust Trail",
    particleDensity: 1.1,
    particleSpeed: 0.6,
    particleColor: "#f59e0b",
    glowIntensity: 1.3,
    glowPulseSpeed: 2.8,
    hoverScale: 1.06,
    hoverDuration: 300,
    shimmerSpeed: 2.5,
    shimmerOpacity: 0.14,
    gradientSpeed: 8,
    gradientAngle: 150,
    entranceDuration: 0.55,
    entranceEase: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    floatAmplitude: 10,
    floatDuration: 7,
  },
  {
    themeId: "emerald-galaxy",
    label: "Emerald Pulse Wave",
    particleDensity: 1.0,
    particleSpeed: 0.7,
    particleColor: "#34d399",
    glowIntensity: 1.1,
    glowPulseSpeed: 3.0,
    hoverScale: 1.07,
    hoverDuration: 300,
    shimmerSpeed: 2.8,
    shimmerOpacity: 0.1,
    gradientSpeed: 9,
    gradientAngle: 160,
    entranceDuration: 0.6,
    entranceEase: "cubic-bezier(0.22, 1, 0.36, 1)",
    floatAmplitude: 9,
    floatDuration: 7.5,
  },
  {
    themeId: "bubblegum-sky",
    label: "Playful Bounce Pop",
    particleDensity: 1.4,
    particleSpeed: 0.9,
    particleColor: "#f472b6",
    glowIntensity: 1.2,
    glowPulseSpeed: 2.2,
    hoverScale: 1.12,
    hoverDuration: 250,
    shimmerSpeed: 2.0,
    shimmerOpacity: 0.13,
    gradientSpeed: 6,
    gradientAngle: 130,
    entranceDuration: 0.45,
    entranceEase: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    floatAmplitude: 14,
    floatDuration: 6,
  },
  {
    themeId: "solar-burst",
    label: "Corona Fire Flare",
    particleDensity: 1.2,
    particleSpeed: 1.2,
    particleColor: "#f97316",
    glowIntensity: 1.5,
    glowPulseSpeed: 1.6,
    hoverScale: 1.09,
    hoverDuration: 220,
    shimmerSpeed: 1.8,
    shimmerOpacity: 0.16,
    gradientSpeed: 5,
    gradientAngle: 115,
    entranceDuration: 0.4,
    entranceEase: "cubic-bezier(0.16, 1, 0.3, 1)",
    floatAmplitude: 12,
    floatDuration: 5.5,
  },
  {
    themeId: "aurora-dream",
    label: "Smooth Gradient Waves",
    particleDensity: 0.8,
    particleSpeed: 0.4,
    particleColor: "#34d399",
    glowIntensity: 0.8,
    glowPulseSpeed: 4.0,
    hoverScale: 1.04,
    hoverDuration: 400,
    shimmerSpeed: 3.5,
    shimmerOpacity: 0.07,
    gradientSpeed: 12,
    gradientAngle: 170,
    entranceDuration: 0.8,
    entranceEase: "cubic-bezier(0.22, 1, 0.36, 1)",
    floatAmplitude: 6,
    floatDuration: 10,
  },
  {
    themeId: "magic-spectrum",
    label: "Rainbow Prism Shift",
    particleDensity: 1.3,
    particleSpeed: 1.0,
    particleColor: "#a855f7",
    glowIntensity: 1.3,
    glowPulseSpeed: 2.0,
    hoverScale: 1.08,
    hoverDuration: 260,
    shimmerSpeed: 2.0,
    shimmerOpacity: 0.14,
    gradientSpeed: 4,
    gradientAngle: 125,
    entranceDuration: 0.5,
    entranceEase: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    floatAmplitude: 11,
    floatDuration: 6.5,
  },
  {
    themeId: "cinematic-prime",
    label: "Classic Cinematic Glow",
    particleDensity: 1.0,
    particleSpeed: 0.7,
    particleColor: "#a855f7",
    glowIntensity: 1.0,
    glowPulseSpeed: 3.0,
    hoverScale: 1.06,
    hoverDuration: 300,
    shimmerSpeed: 2.5,
    shimmerOpacity: 0.1,
    gradientSpeed: 8,
    gradientAngle: 135,
    entranceDuration: 0.6,
    entranceEase: "cubic-bezier(0.22, 1, 0.36, 1)",
    floatAmplitude: 10,
    floatDuration: 6,
  },

  /* ══════════════════════════════════════════════════════════
     SEASONAL ANIMATION PROFILES
     ══════════════════════════════════════════════════════════ */

  /* ── Winter Magic ── */
  {
    themeId: "frost-glow",
    label: "Icy Crystal Drift",
    particleDensity: 0.9,
    particleSpeed: 0.4,
    particleColor: "#93c5fd",
    glowIntensity: 0.9,
    glowPulseSpeed: 3.8,
    hoverScale: 1.04,
    hoverDuration: 380,
    shimmerSpeed: 3.2,
    shimmerOpacity: 0.08,
    gradientSpeed: 11,
    gradientAngle: 165,
    entranceDuration: 0.7,
    entranceEase: "cubic-bezier(0.22, 1, 0.36, 1)",
    floatAmplitude: 6,
    floatDuration: 9,
  },
  {
    themeId: "candy-cane-burst",
    label: "Peppermint Pop",
    particleDensity: 1.3,
    particleSpeed: 0.9,
    particleColor: "#fca5a5",
    glowIntensity: 1.2,
    glowPulseSpeed: 2.2,
    hoverScale: 1.1,
    hoverDuration: 250,
    shimmerSpeed: 2.0,
    shimmerOpacity: 0.14,
    gradientSpeed: 6,
    gradientAngle: 130,
    entranceDuration: 0.45,
    entranceEase: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    floatAmplitude: 12,
    floatDuration: 6,
  },
  {
    themeId: "aurora-snowfall",
    label: "Northern Lights Wave",
    particleDensity: 0.8,
    particleSpeed: 0.35,
    particleColor: "#34d399",
    glowIntensity: 0.85,
    glowPulseSpeed: 4.2,
    hoverScale: 1.04,
    hoverDuration: 400,
    shimmerSpeed: 3.5,
    shimmerOpacity: 0.07,
    gradientSpeed: 13,
    gradientAngle: 175,
    entranceDuration: 0.8,
    entranceEase: "cubic-bezier(0.22, 1, 0.36, 1)",
    floatAmplitude: 5,
    floatDuration: 10,
  },

  /* ── Spring Bloom ── */
  {
    themeId: "blossom-spark",
    label: "Cherry Petal Float",
    particleDensity: 1.2,
    particleSpeed: 0.6,
    particleColor: "#f9a8d4",
    glowIntensity: 1.0,
    glowPulseSpeed: 3.0,
    hoverScale: 1.07,
    hoverDuration: 300,
    shimmerSpeed: 2.5,
    shimmerOpacity: 0.1,
    gradientSpeed: 8,
    gradientAngle: 140,
    entranceDuration: 0.55,
    entranceEase: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    floatAmplitude: 10,
    floatDuration: 7,
  },
  {
    themeId: "pastel-sky",
    label: "Soft Cloud Drift",
    particleDensity: 0.7,
    particleSpeed: 0.35,
    particleColor: "#c4b5fd",
    glowIntensity: 0.75,
    glowPulseSpeed: 4.0,
    hoverScale: 1.04,
    hoverDuration: 380,
    shimmerSpeed: 3.5,
    shimmerOpacity: 0.06,
    gradientSpeed: 12,
    gradientAngle: 160,
    entranceDuration: 0.75,
    entranceEase: "cubic-bezier(0.22, 1, 0.36, 1)",
    floatAmplitude: 5,
    floatDuration: 10,
  },
  {
    themeId: "rainbow-garden",
    label: "Magic Garden Bloom",
    particleDensity: 1.4,
    particleSpeed: 0.85,
    particleColor: "#a3e635",
    glowIntensity: 1.2,
    glowPulseSpeed: 2.4,
    hoverScale: 1.09,
    hoverDuration: 260,
    shimmerSpeed: 2.0,
    shimmerOpacity: 0.13,
    gradientSpeed: 5,
    gradientAngle: 125,
    entranceDuration: 0.45,
    entranceEase: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    floatAmplitude: 13,
    floatDuration: 5.5,
  },

  /* ── Summer Adventure ── */
  {
    themeId: "sunset-splash",
    label: "Golden Wave Pulse",
    particleDensity: 1.1,
    particleSpeed: 0.7,
    particleColor: "#fb923c",
    glowIntensity: 1.3,
    glowPulseSpeed: 2.6,
    hoverScale: 1.07,
    hoverDuration: 280,
    shimmerSpeed: 2.2,
    shimmerOpacity: 0.12,
    gradientSpeed: 7,
    gradientAngle: 145,
    entranceDuration: 0.5,
    entranceEase: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    floatAmplitude: 10,
    floatDuration: 7,
  },
  {
    themeId: "tropical-burst",
    label: "Jungle Spark Dance",
    particleDensity: 1.3,
    particleSpeed: 0.95,
    particleColor: "#4ade80",
    glowIntensity: 1.15,
    glowPulseSpeed: 2.2,
    hoverScale: 1.1,
    hoverDuration: 240,
    shimmerSpeed: 1.8,
    shimmerOpacity: 0.14,
    gradientSpeed: 5,
    gradientAngle: 120,
    entranceDuration: 0.4,
    entranceEase: "cubic-bezier(0.16, 1, 0.3, 1)",
    floatAmplitude: 14,
    floatDuration: 5,
  },
  {
    themeId: "rocket-carnival",
    label: "Fiesta Firework Flash",
    particleDensity: 1.5,
    particleSpeed: 1.3,
    particleColor: "#f43f5e",
    glowIntensity: 1.4,
    glowPulseSpeed: 1.8,
    hoverScale: 1.12,
    hoverDuration: 200,
    shimmerSpeed: 1.5,
    shimmerOpacity: 0.16,
    gradientSpeed: 4,
    gradientAngle: 115,
    entranceDuration: 0.35,
    entranceEase: "cubic-bezier(0.16, 1, 0.3, 1)",
    floatAmplitude: 16,
    floatDuration: 4.5,
  },

  /* ── Fall Galaxy ── */
  {
    themeId: "ember-glow",
    label: "Warm Ember Pulse",
    particleDensity: 1.0,
    particleSpeed: 0.6,
    particleColor: "#ea580c",
    glowIntensity: 1.3,
    glowPulseSpeed: 2.8,
    hoverScale: 1.06,
    hoverDuration: 300,
    shimmerSpeed: 2.5,
    shimmerOpacity: 0.12,
    gradientSpeed: 8,
    gradientAngle: 140,
    entranceDuration: 0.55,
    entranceEase: "cubic-bezier(0.22, 1, 0.36, 1)",
    floatAmplitude: 9,
    floatDuration: 7,
  },
  {
    themeId: "harvest-star",
    label: "Golden Field Shimmer",
    particleDensity: 0.9,
    particleSpeed: 0.5,
    particleColor: "#eab308",
    glowIntensity: 1.2,
    glowPulseSpeed: 3.0,
    hoverScale: 1.05,
    hoverDuration: 320,
    shimmerSpeed: 2.8,
    shimmerOpacity: 0.1,
    gradientSpeed: 9,
    gradientAngle: 150,
    entranceDuration: 0.6,
    entranceEase: "cubic-bezier(0.22, 1, 0.36, 1)",
    floatAmplitude: 8,
    floatDuration: 8,
  },
  {
    themeId: "midnight-pumpkin",
    label: "Spooky Glow Haunt",
    particleDensity: 1.1,
    particleSpeed: 0.7,
    particleColor: "#f97316",
    glowIntensity: 1.25,
    glowPulseSpeed: 2.5,
    hoverScale: 1.08,
    hoverDuration: 280,
    shimmerSpeed: 2.2,
    shimmerOpacity: 0.13,
    gradientSpeed: 7,
    gradientAngle: 135,
    entranceDuration: 0.5,
    entranceEase: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    floatAmplitude: 11,
    floatDuration: 6.5,
  },
];

/** Default profile (matches cinematic-prime) */
export const DEFAULT_ANIMATION_PROFILE = PROFILES.find(
  (p) => p.themeId === "cinematic-prime"
)!;

/** Get animation profile for a theme id */
export function getAnimationProfile(themeId: string): AnimationProfile {
  return PROFILES.find((p) => p.themeId === themeId) ?? DEFAULT_ANIMATION_PROFILE;
}

export default PROFILES;
