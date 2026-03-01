/**
 * CinematicSoundEngine — Scroll-triggered audio cues via Web Audio API
 *
 * Singleton. No autoplay. Unlocks AudioContext on first user interaction.
 * Respects parent sound toggle, reduced motion, and data saver.
 * Volume hard-capped at 40%. IntersectionObserver drives section triggers.
 */

import { useEffect, useRef, useCallback } from "react";
import { useReducedMotion } from "framer-motion";
import { getParentSettings } from "@/lib/storage";

/* ── Types ────────────────────────────────────────────────── */
export type CueName = "swell" | "sparkle" | "impact" | "whoosh" | "rise";

interface CueConfig {
  tones: { freq: number; type: OscillatorType; dur: number; vol: number; delay: number }[];
}

/* ── Cue definitions (all sub-40 % volume) ────────────────── */
const CUES: Record<CueName, CueConfig> = {
  /* Hero — rising ambient swell */
  swell: {
    tones: [
      { freq: 80, type: "sine", dur: 1.4, vol: 0.12, delay: 0 },
      { freq: 120, type: "sine", dur: 1.2, vol: 0.08, delay: 0.3 },
      { freq: 200, type: "sine", dur: 1.0, vol: 0.06, delay: 0.6 },
    ],
  },
  /* Feature grid — sparkle */
  sparkle: {
    tones: [
      { freq: 1200, type: "sine", dur: 0.12, vol: 0.06, delay: 0 },
      { freq: 1600, type: "sine", dur: 0.10, vol: 0.05, delay: 0.06 },
      { freq: 2000, type: "sine", dur: 0.10, vol: 0.04, delay: 0.12 },
      { freq: 2400, type: "sine", dur: 0.08, vol: 0.03, delay: 0.18 },
    ],
  },
  /* Studio Pro — cinematic impact */
  impact: {
    tones: [
      { freq: 55, type: "sawtooth", dur: 0.5, vol: 0.15, delay: 0 },
      { freq: 110, type: "triangle", dur: 0.35, vol: 0.10, delay: 0.05 },
      { freq: 220, type: "sine", dur: 0.25, vol: 0.06, delay: 0.1 },
    ],
  },
  /* Gallery — soft whoosh */
  whoosh: {
    tones: [
      { freq: 300, type: "sawtooth", dur: 0.25, vol: 0.04, delay: 0 },
    ],
  },
  /* Final CTA — triumphant rise */
  rise: {
    tones: [
      { freq: 262, type: "sine", dur: 0.3, vol: 0.10, delay: 0 },
      { freq: 330, type: "sine", dur: 0.3, vol: 0.10, delay: 0.15 },
      { freq: 392, type: "sine", dur: 0.3, vol: 0.10, delay: 0.30 },
      { freq: 523, type: "sine", dur: 0.5, vol: 0.12, delay: 0.45 },
    ],
  },
};

/* ── Max volume cap ───────────────────────────────────────── */
const MAX_VOL = 0.40;

/* ── Data saver detection ─────────────────────────────────── */
function isDataSaver(): boolean {
  return !!(navigator as any).connection?.saveData;
}

/* ── Singleton controller ─────────────────────────────────── */
class CinematicAudioController {
  private ctx: AudioContext | null = null;
  private unlocked = false;
  private playing = false; // prevents overlapping cues
  private paused = false; // external pause (trailer playback etc.)
  private firedCues = new Set<string>(); // each cue fires once per page load

  /** Call once the user interacts — unlocks AudioContext */
  unlock() {
    if (this.unlocked) return;
    try {
      this.ctx = new AudioContext();
      if (this.ctx.state === "suspended") this.ctx.resume();
      this.unlocked = true;
    } catch {
      /* browser blocked — silently fail */
    }
  }

  /** External pause (e.g. trailer playing) */
  setPaused(p: boolean) {
    this.paused = p;
  }

  /** Play a named cue if allowed */
  play(name: CueName, sectionId?: string) {
    if (!this.unlocked || !this.ctx || this.playing || this.paused) return;
    if (!getParentSettings().soundEnabled) return;
    if (isDataSaver()) return;
    if (this.firedCues.has(name)) return;

    const config = CUES[name];
    if (!config) return;

    this.firedCues.add(name);
    this.playing = true;

    if (import.meta.env.DEV) {
      console.log(`🎬 Cinematic cue triggered: ${sectionId ?? name}`);
    }

    const ctx = this.ctx;
    let maxEnd = 0;

    for (const t of config.tones) {
      const vol = Math.min(t.vol, MAX_VOL);
      const start = ctx.currentTime + t.delay;
      const end = start + t.dur;
      if (end > maxEnd) maxEnd = end;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = t.type;
      osc.frequency.setValueAtTime(t.freq, start);
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(0.001, end);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(end);
    }

    // Release overlap guard after full cue plays
    const totalDur = (maxEnd - this.ctx.currentTime) * 1000 + 50;
    setTimeout(() => {
      this.playing = false;
    }, Math.max(totalDur, 100));
  }

  /** Reset fired cues (e.g. on route change) */
  reset() {
    this.firedCues.clear();
    this.playing = false;
  }
}

/** Singleton instance — importable anywhere */
export const cinematicAudio = new CinematicAudioController();

/* ── React hook — unlocks on first interaction ────────────── */
export function useCinematicAudioUnlock() {
  useEffect(() => {
    const handler = () => cinematicAudio.unlock();
    window.addEventListener("click", handler, { once: true, passive: true });
    window.addEventListener("scroll", handler, { once: true, passive: true });
    window.addEventListener("keydown", handler, { once: true, passive: true });
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("scroll", handler);
      window.removeEventListener("keydown", handler);
    };
  }, []);
}

/* ── React hook — attach IntersectionObserver cue to a ref ── */
export function useSectionCue(cue: CueName, sectionId: string) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const fire = useCallback(() => {
    if (reduced) return;
    cinematicAudio.play(cue, sectionId);
  }, [cue, sectionId, reduced]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fire();
          observer.disconnect(); // fire once
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fire]);

  return ref;
}
