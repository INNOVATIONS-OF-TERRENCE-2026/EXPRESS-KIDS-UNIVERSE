/**
 * sceneEngine.ts — Scene orchestration engine
 *
 * Takes an Episode schema and coordinates:
 *   - Scene playback sequencing
 *   - Shot transitions
 *   - Character placement
 *   - Animation cue dispatch
 *   - Timing synchronization with audio
 *
 * This is the runtime orchestrator for episode playback.
 */

import type { Episode, Scene, Shot } from "./episodeSchema";

/** Playback state for the scene engine */
export type PlaybackState = "idle" | "loading" | "playing" | "paused" | "ended";

/** Event types emitted by the scene engine */
export type SceneEvent =
  | { type: "scene-enter"; scene: Scene }
  | { type: "scene-exit"; scene: Scene }
  | { type: "shot-change"; shot: Shot; scene: Scene }
  | { type: "dialogue-start"; dialogueId: string; characterId: string; text: string }
  | { type: "dialogue-end"; dialogueId: string }
  | { type: "animation-cue"; cueId: string }
  | { type: "playback-state"; state: PlaybackState }
  | { type: "time-update"; currentSec: number; totalSec: number };

export type SceneEventListener = (event: SceneEvent) => void;

/**
 * SceneEngine — Episode playback coordinator
 *
 * Usage:
 *   const engine = new SceneEngine();
 *   engine.load(episode);
 *   engine.on(listener);
 *   engine.play();
 *   engine.pause();
 *   engine.seekTo(120); // seconds
 *   engine.dispose();
 */
export class SceneEngine {
  private episode: Episode | null = null;
  private state: PlaybackState = "idle";
  private currentSceneIndex = 0;
  private currentShotIndex = 0;
  private currentTimeSec = 0;
  private rafId = 0;
  private lastFrameTime = 0;
  private listeners: SceneEventListener[] = [];
  private disposed = false;

  /** Load an episode for playback */
  load(episode: Episode): void {
    this.episode = episode;
    this.currentSceneIndex = 0;
    this.currentShotIndex = 0;
    this.currentTimeSec = 0;
    this.emit({ type: "playback-state", state: "loading" });
    this.state = "loading";

    // Simulate asset loading — in production this would preload images/audio
    setTimeout(() => {
      if (this.disposed) return;
      this.state = "idle";
      this.emit({ type: "playback-state", state: "idle" });
    }, 100);
  }

  /** Start or resume playback */
  play(): void {
    if (!this.episode || this.state === "playing") return;
    this.state = "playing";
    this.emit({ type: "playback-state", state: "playing" });

    // Enter first scene if at start
    if (this.currentTimeSec === 0 && this.episode.scenes.length > 0) {
      this.emit({ type: "scene-enter", scene: this.episode.scenes[0] });
    }

    this.lastFrameTime = performance.now();
    this.tick();
  }

  /** Pause playback */
  pause(): void {
    if (this.state !== "playing") return;
    this.state = "paused";
    cancelAnimationFrame(this.rafId);
    this.emit({ type: "playback-state", state: "paused" });
  }

  /** Seek to a specific time in seconds */
  seekTo(sec: number): void {
    if (!this.episode) return;
    this.currentTimeSec = Math.max(0, Math.min(sec, this.episode.actualDurationSec));
    this.updateScenePointer();
    this.emit({
      type: "time-update",
      currentSec: this.currentTimeSec,
      totalSec: this.episode.actualDurationSec,
    });
  }

  /** Subscribe to scene events */
  on(listener: SceneEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /** Get current playback state */
  getState(): PlaybackState {
    return this.state;
  }

  /** Get current time */
  getCurrentTime(): number {
    return this.currentTimeSec;
  }

  /** Get current scene */
  getCurrentScene(): Scene | null {
    return this.episode?.scenes[this.currentSceneIndex] ?? null;
  }

  /** Clean up */
  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    this.listeners = [];
    this.episode = null;
    this.state = "idle";
  }

  private tick = (): void => {
    if (this.state !== "playing" || !this.episode || this.disposed) return;

    const now = performance.now();
    const deltaSec = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    this.currentTimeSec += deltaSec;

    // Check if episode ended
    if (this.currentTimeSec >= this.episode.actualDurationSec) {
      this.currentTimeSec = this.episode.actualDurationSec;
      this.state = "ended";
      this.emit({ type: "playback-state", state: "ended" });
      return;
    }

    this.updateScenePointer();

    this.emit({
      type: "time-update",
      currentSec: this.currentTimeSec,
      totalSec: this.episode.actualDurationSec,
    });

    this.rafId = requestAnimationFrame(this.tick);
  };

  private updateScenePointer(): void {
    if (!this.episode) return;
    const scenes = this.episode.scenes;

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const sceneEnd = scene.timing.startSec + scene.timing.durationSec;

      if (this.currentTimeSec >= scene.timing.startSec && this.currentTimeSec < sceneEnd) {
        if (i !== this.currentSceneIndex) {
          // Exiting old scene
          this.emit({ type: "scene-exit", scene: scenes[this.currentSceneIndex] });
          this.currentSceneIndex = i;
          this.currentShotIndex = 0;
          // Entering new scene
          this.emit({ type: "scene-enter", scene });
        }

        // Check shot within scene
        for (let j = 0; j < scene.shots.length; j++) {
          const shot = scene.shots[j];
          const shotEnd = shot.timing.startSec + shot.timing.durationSec;
          if (this.currentTimeSec >= shot.timing.startSec && this.currentTimeSec < shotEnd) {
            if (j !== this.currentShotIndex) {
              this.currentShotIndex = j;
              this.emit({ type: "shot-change", shot, scene });
            }
            break;
          }
        }
        break;
      }
    }
  }

  private emit(event: SceneEvent): void {
    this.listeners.forEach((l) => {
      try { l(event); } catch { /* listener errors should not break engine */ }
    });
  }
}
