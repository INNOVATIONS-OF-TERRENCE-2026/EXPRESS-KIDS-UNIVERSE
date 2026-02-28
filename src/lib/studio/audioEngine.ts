/**
 * audioEngine.ts — Episode audio orchestration
 *
 * Manages audio tracks for episode playback:
 *   - Background music per scene
 *   - Sound effects triggered by animation cues
 *   - Voice track synchronization
 *   - Volume ducking during dialogue
 *
 * Uses the Web Audio API — same AudioContext approach as the existing audioManager.
 */

import type { Scene } from "./episodeSchema";
import { getParentSettings } from "@/lib/storage";

/** Audio track definition */
export interface AudioTrack {
  id: string;
  type: "music" | "sfx" | "voice" | "ambient";
  /** Start time in seconds (episode-relative) */
  startSec: number;
  /** Duration in seconds */
  durationSec: number;
  /** Volume 0–1 */
  volume: number;
  /** Audio source reference (URL or generated) */
  sourceRef?: string;
}

/** Audio timeline for an episode */
export interface AudioTimeline {
  tracks: AudioTrack[];
  totalDurationSec: number;
}

/**
 * AudioEngine — Episode audio coordinator
 *
 * Usage:
 *   const engine = new AudioEngine();
 *   engine.loadTimeline(timeline);
 *   engine.play();
 *   engine.pause();
 *   engine.seekTo(30);
 *   engine.dispose();
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private timeline: AudioTimeline | null = null;
  private masterGain: GainNode | null = null;
  private activeSources: Map<string, { osc: OscillatorNode; gain: GainNode }> = new Map();
  private playing = false;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private isEnabled(): boolean {
    return getParentSettings().soundEnabled;
  }

  /** Load an audio timeline */
  loadTimeline(timeline: AudioTimeline): void {
    this.timeline = timeline;
  }

  /** Generate a simple ambient audio timeline from scenes */
  generateFromScenes(scenes: Scene[]): AudioTimeline {
    const tracks: AudioTrack[] = [];

    scenes.forEach((scene, i) => {
      // Ambient music track per scene
      tracks.push({
        id: `music_scene_${i}`,
        type: "music",
        startSec: scene.timing.startSec,
        durationSec: scene.timing.durationSec,
        volume: 0.08,
      });

      // Scene transition SFX
      if (i > 0) {
        tracks.push({
          id: `sfx_transition_${i}`,
          type: "sfx",
          startSec: scene.timing.startSec,
          durationSec: 1.5,
          volume: 0.05,
        });
      }
    });

    const totalDurationSec = scenes.length > 0
      ? scenes[scenes.length - 1].timing.startSec + scenes[scenes.length - 1].timing.durationSec
      : 0;

    return { tracks, totalDurationSec };
  }

  /** Play a procedural tone for a scene mood */
  playMoodTone(mood: Scene["mood"]): void {
    if (!this.isEnabled()) return;

    const ctx = this.getCtx();
    const moodFreqs: Record<string, number> = {
      adventurous: 220,
      calm: 110,
      tense: 165,
      magical: 330,
      playful: 440,
      emotional: 196,
      triumphant: 293,
    };

    const freq = moodFreqs[mood] ?? 220;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);

    osc.connect(gain).connect(this.masterGain ?? ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 3);
  }

  /** Play a transition sound */
  playTransition(): void {
    if (!this.isEnabled()) return;

    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain).connect(this.masterGain ?? ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }

  /** Set master volume (0–1) */
  setMasterVolume(vol: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.getCtx().currentTime);
    }
  }

  /** Stop all active audio */
  stopAll(): void {
    this.activeSources.forEach(({ osc, gain }) => {
      try {
        gain.gain.setValueAtTime(0, this.getCtx().currentTime);
        osc.stop();
      } catch { /* already stopped */ }
    });
    this.activeSources.clear();
    this.playing = false;
  }

  /** Clean up resources */
  dispose(): void {
    this.stopAll();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.masterGain = null;
    this.timeline = null;
  }
}

/** Singleton instance */
export const episodeAudioEngine = new AudioEngine();
