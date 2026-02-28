import { getParentSettings } from "./storage";

class AudioManager {
  private ctx: AudioContext | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientPlaying = false;

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  private isEnabled(): boolean {
    return getParentSettings().soundEnabled;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = "sine", vol = 0.15) {
    if (!this.isEnabled()) return;
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  click() {
    this.playTone(800, 0.08, "sine", 0.1);
  }

  success() {
    if (!this.isEnabled()) return;
    const ctx = this.getCtx();
    [523, 659, 784].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.2, "sine", 0.12), i * 100);
    });
  }

  error() {
    this.playTone(220, 0.3, "triangle", 0.12);
  }

  sparkle() {
    if (!this.isEnabled()) return;
    [1200, 1600, 2000].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.1, "sine", 0.06), i * 60);
    });
  }

  whoosh() {
    if (!this.isEnabled()) return;
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  startAmbient() {
    if (!this.isEnabled() || this.ambientPlaying) return;
    const ctx = this.getCtx();
    this.ambientOsc = ctx.createOscillator();
    this.ambientGain = ctx.createGain();
    this.ambientOsc.type = "sine";
    this.ambientOsc.frequency.setValueAtTime(60, ctx.currentTime);
    this.ambientGain.gain.setValueAtTime(0, ctx.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 2);
    this.ambientOsc.connect(this.ambientGain).connect(ctx.destination);
    this.ambientOsc.start();
    this.ambientPlaying = true;
  }

  stopAmbient() {
    if (!this.ambientPlaying || !this.ambientGain || !this.ambientOsc) return;
    const ctx = this.getCtx();
    this.ambientGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
    this.ambientOsc.stop(ctx.currentTime + 1);
    this.ambientPlaying = false;
    this.ambientOsc = null;
    this.ambientGain = null;
  }

  get isAmbientPlaying() {
    return this.ambientPlaying;
  }
}

export const audioManager = new AudioManager();
