/**
 * WaveformVisualizer.tsx — Audio waveform visualization component.
 *
 * Feature Set 7: Renders an animated waveform bar display for:
 *  - Voice playback visualization
 *  - Music track preview
 *  - Audio recording feedback
 *
 * GPU-optimized: uses transform-based animations only.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";

interface Props {
  /** Waveform amplitude data (0-1 array) */
  data?: number[];
  /** Number of bars to display */
  barCount?: number;
  /** Whether audio is currently playing */
  isPlaying?: boolean;
  /** Bar color (CSS value) */
  color?: string;
  /** Height in pixels */
  height?: number;
  /** Optional className */
  className?: string;
}

export default function WaveformVisualizer({
  data,
  barCount = 32,
  isPlaying = false,
  color = "currentColor",
  height = 40,
  className = "",
}: Props) {
  // Generate bars from data or create placeholder
  const bars = useMemo(() => {
    if (data && data.length > 0) {
      // Downsample or upsample to barCount
      const result: number[] = [];
      for (let i = 0; i < barCount; i++) {
        const idx = Math.floor((i / barCount) * data.length);
        result.push(data[Math.min(idx, data.length - 1)]);
      }
      return result;
    }
    // Generate random placeholder bars
    return Array.from({ length: barCount }, () => 0.1 + Math.random() * 0.6);
  }, [data, barCount]);

  return (
    <div
      className={`flex items-end justify-center gap-[2px] ${className}`}
      style={{ height }}
      role="img"
      aria-label={isPlaying ? "Audio waveform playing" : "Audio waveform"}
    >
      {bars.map((amplitude, i) => {
        const barHeight = Math.max(4, amplitude * height);
        return (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              width: Math.max(2, Math.floor((height * 0.8) / barCount)),
              backgroundColor: color,
              opacity: isPlaying ? 0.9 : 0.3,
            }}
            initial={{ height: 4 }}
            animate={{
              height: isPlaying ? barHeight : barHeight * 0.3,
            }}
            transition={
              isPlaying
                ? {
                    duration: 0.3 + Math.random() * 0.3,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: i * 0.02,
                  }
                : { duration: 0.5 }
            }
          />
        );
      })}
    </div>
  );
}
