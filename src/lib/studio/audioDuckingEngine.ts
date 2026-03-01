/**
 * audioDuckingEngine.ts — Background Music Ducking Engine
 *
 * Generates ducking envelopes for background music tracks:
 *   - BGM at 100% volume during silence gaps
 *   - Ducks to 30% during narration
 *   - 400ms exponential fade in/out curves (not linear)
 *   - Music loops safely, auto-trims to scene duration
 *
 * This engine outputs ducking metadata (timestamps + volume levels)
 * that the client-side AudioContext renderer consumes.
 * No audio decoding here — purely math.
 */

/* ── Types ── */

/** A single volume automation point */
export interface DuckingPoint {
  /** Time in seconds from scene start */
  timeSec: number;
  /** Volume 0–1 */
  volume: number;
  /** Curve type for this transition */
  curve: "exponential" | "linear" | "instant";
}

/** Ducking envelope for a single scene */
export interface SceneDuckingEnvelope {
  sceneId: string;
  /** Ordered list of volume automation points */
  points: DuckingPoint[];
  /** Scene duration this envelope covers */
  sceneDurationSec: number;
  /** Whether BGM should loop in this scene */
  loop: boolean;
}

/** Ducking config for a narration segment within a scene */
export interface NarrationSegment {
  /** Start time relative to scene start (seconds) */
  startSec: number;
  /** Duration of narration (seconds) */
  durationSec: number;
}

/** BGM ducking configuration */
export interface DuckingConfig {
  /** Volume during silence (0–1). Default: 1.0 */
  fullVolume: number;
  /** Volume during narration (0–1). Default: 0.30 */
  duckedVolume: number;
  /** Fade duration in seconds. Default: 0.4 */
  fadeDurationSec: number;
  /** Whether BGM should loop. Default: true */
  loop: boolean;
}

/* ── Constants ── */

const DEFAULT_CONFIG: DuckingConfig = {
  fullVolume: 1.0,
  duckedVolume: 0.30,
  fadeDurationSec: 0.4,
  loop: true,
};

/* ── Core Functions ── */

/**
 * Generate a ducking envelope for a single scene.
 *
 * The envelope starts at full volume, ducks down 400ms before narration starts,
 * stays ducked during narration, then fades back up 400ms after narration ends.
 *
 * Multiple narration segments are supported (e.g., dialogue exchanges).
 */
export function generateDuckingEnvelope(
  sceneId: string,
  sceneDurationSec: number,
  narrationSegments: NarrationSegment[],
  config: Partial<DuckingConfig> = {},
): SceneDuckingEnvelope {
  const cfg: DuckingConfig = { ...DEFAULT_CONFIG, ...config };
  const { fullVolume, duckedVolume, fadeDurationSec } = cfg;

  if (narrationSegments.length === 0 || sceneDurationSec <= 0) {
    // No narration — constant full volume
    return {
      sceneId,
      points: [
        { timeSec: 0, volume: fullVolume, curve: "instant" },
      ],
      sceneDurationSec,
      loop: cfg.loop,
    };
  }

  // Sort segments by start time
  const sorted = [...narrationSegments].sort((a, b) => a.startSec - b.startSec);

  // Merge overlapping / adjacent segments (within fade window)
  const merged = mergeSegments(sorted, fadeDurationSec);

  const points: DuckingPoint[] = [];

  // Start at full volume
  points.push({ timeSec: 0, volume: fullVolume, curve: "instant" });

  for (const seg of merged) {
    const duckStart = Math.max(0, seg.startSec - fadeDurationSec);
    const duckEnd = Math.min(sceneDurationSec, seg.startSec + seg.durationSec);
    const restoreEnd = Math.min(sceneDurationSec, duckEnd + fadeDurationSec);

    // Only add duck-down if we're currently at full volume
    const lastPoint = points[points.length - 1];
    if (lastPoint && lastPoint.volume >= fullVolume * 0.9) {
      // Fade down to ducked volume
      if (duckStart > lastPoint.timeSec + 0.01) {
        points.push({ timeSec: duckStart, volume: fullVolume, curve: "instant" });
      }
      points.push({ timeSec: Math.min(duckStart + fadeDurationSec, duckEnd), volume: duckedVolume, curve: "exponential" });
    }

    // Stay ducked through narration
    if (duckEnd > points[points.length - 1].timeSec + 0.01) {
      points.push({ timeSec: duckEnd, volume: duckedVolume, curve: "instant" });
    }

    // Fade back up
    if (restoreEnd < sceneDurationSec - 0.01) {
      points.push({ timeSec: restoreEnd, volume: fullVolume, curve: "exponential" });
    }
  }

  return {
    sceneId,
    points: deduplicatePoints(points),
    sceneDurationSec,
    loop: cfg.loop,
  };
}

/**
 * Generate ducking envelopes for all scenes in an episode.
 */
export function generateEpisodeDucking(
  scenes: Array<{
    sceneId: string;
    durationSec: number;
    narrationSegments: NarrationSegment[];
  }>,
  config?: Partial<DuckingConfig>,
): SceneDuckingEnvelope[] {
  return scenes.map((s) =>
    generateDuckingEnvelope(s.sceneId, s.durationSec, s.narrationSegments, config),
  );
}

/**
 * Apply ducking envelope to an AudioContext GainNode.
 *
 * Call this at render time to schedule volume automation.
 */
export function applyDuckingToGain(
  gainNode: GainNode,
  envelope: SceneDuckingEnvelope,
  sceneStartTime: number,
): void {
  const { points } = envelope;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const absTime = sceneStartTime + pt.timeSec;

    if (pt.curve === "exponential" && i > 0) {
      // Exponential ramp — clamped to avoid zero (Web Audio constraint)
      gainNode.gain.exponentialRampToValueAtTime(
        Math.max(pt.volume, 0.001),
        absTime,
      );
    } else if (pt.curve === "linear") {
      gainNode.gain.linearRampToValueAtTime(pt.volume, absTime);
    } else {
      gainNode.gain.setValueAtTime(pt.volume, absTime);
    }
  }
}

/* ── Helpers ── */

/** Merge overlapping narration segments */
function mergeSegments(sorted: NarrationSegment[], fadeWindow: number): NarrationSegment[] {
  if (sorted.length <= 1) return sorted;

  const merged: NarrationSegment[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = sorted[i];
    const prevEnd = prev.startSec + prev.durationSec;

    // Merge if gap is less than 2× fade window (keep ducked between close segments)
    if (curr.startSec - prevEnd < fadeWindow * 2) {
      prev.durationSec = Math.max(prev.durationSec, curr.startSec + curr.durationSec - prev.startSec);
    } else {
      merged.push({ ...curr });
    }
  }

  return merged;
}

/** Remove duplicate consecutive points at very similar times */
function deduplicatePoints(points: DuckingPoint[]): DuckingPoint[] {
  if (points.length <= 1) return points;

  const result: DuckingPoint[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = result[result.length - 1];
    // Skip if same time and same volume
    if (Math.abs(points[i].timeSec - prev.timeSec) < 0.005 && Math.abs(points[i].volume - prev.volume) < 0.01) {
      continue;
    }
    result.push(points[i]);
  }
  return result;
}
