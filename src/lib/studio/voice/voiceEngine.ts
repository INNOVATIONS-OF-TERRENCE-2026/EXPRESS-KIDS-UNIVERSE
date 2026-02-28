/**
 * voiceEngine.ts — Multi-character voice generation engine
 *
 * Takes Episode schema dialogue and produces:
 *   - Narration track
 *   - Character tracks
 *   - Timing metadata (start/end per line)
 *
 * Adapters:
 *   - WebSpeechAdapter (browser Web Speech API — works offline)
 *   - PlaceholderProviderAdapter (interface only for future cloud TTS)
 */

import type { VoiceProfile, VoiceRequest, VoiceResult, CharacterVoiceMap } from "./voiceTypes";
import { PRESET_VOICES } from "./voiceTypes";
import type { Episode, Dialogue } from "../episodeSchema";
import { getParentSettings } from "@/lib/storage";

/* ───────── Provider Adapter Interface ───────── */

export interface VoiceProviderAdapter {
  readonly name: string;
  /** Check if this provider is available */
  isAvailable(): boolean;
  /** Generate speech from text */
  speak(request: VoiceRequest): Promise<VoiceResult>;
  /** Stop all currently playing audio */
  stop(): void;
  /** Get available voices */
  getVoices(): VoiceProfile[];
}

/* ───────── Web Speech API Adapter ───────── */

export class WebSpeechAdapter implements VoiceProviderAdapter {
  readonly name = "Web Speech API";
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  isAvailable(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  async speak(request: VoiceRequest): Promise<VoiceResult> {
    if (!this.isAvailable()) {
      return { durationSec: 0, audioRef: "" };
    }

    const synth = window.speechSynthesis;
    this.synth = synth;

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(request.text);
      this.currentUtterance = utterance;

      // Apply voice profile
      utterance.pitch = 1 + request.voiceProfile.pitch;
      utterance.rate = request.voiceProfile.rate;
      utterance.volume = request.voiceProfile.volume;
      utterance.lang = request.voiceProfile.language;

      // Try to find a matching system voice
      const voices = synth.getVoices();
      if (request.voiceProfile.providerVoiceId) {
        const match = voices.find((v) => v.name === request.voiceProfile.providerVoiceId);
        if (match) utterance.voice = match;
      } else {
        // Find a voice matching the language
        const langMatch = voices.find((v) => v.lang.startsWith(request.voiceProfile.language));
        if (langMatch) utterance.voice = langMatch;
      }

      // Emotion modifiers
      if (request.emotion === "excited" || request.emotion === "happy") {
        utterance.rate *= 1.1;
        utterance.pitch *= 1.05;
      } else if (request.emotion === "sad") {
        utterance.rate *= 0.9;
        utterance.pitch *= 0.95;
      } else if (request.emotion === "scared") {
        utterance.rate *= 1.2;
      }

      const startTime = Date.now();

      utterance.onend = () => {
        const durationSec = (Date.now() - startTime) / 1000;
        this.currentUtterance = null;
        resolve({
          durationSec,
          audioRef: `webspeech:${request.text.slice(0, 50)}`,
        });
      };

      utterance.onerror = () => {
        this.currentUtterance = null;
        resolve({ durationSec: 0, audioRef: "" });
      };

      synth.speak(utterance);
    });
  }

  stop(): void {
    this.synth?.cancel();
    this.currentUtterance = null;
  }

  getVoices(): VoiceProfile[] {
    if (!this.isAvailable()) return [];
    return PRESET_VOICES.filter((v) => v.provider === "web-speech");
  }
}

/* ───────── Placeholder Provider Adapter ───────── */

export class PlaceholderProviderAdapter implements VoiceProviderAdapter {
  readonly name = "Placeholder (Future Cloud TTS)";

  isAvailable(): boolean {
    return false; // Not yet implemented
  }

  async speak(_request: VoiceRequest): Promise<VoiceResult> {
    // Estimate duration from text length
    const words = _request.text.split(/\s+/).length;
    const durationSec = words / 2.5; // ~150 wpm
    return { durationSec, audioRef: `placeholder:${_request.text.slice(0, 30)}` };
  }

  stop(): void {}

  getVoices(): VoiceProfile[] {
    return [];
  }
}

/* ───────── Voice Engine ───────── */

export class VoiceEngine {
  private adapter: VoiceProviderAdapter;
  private voiceMap: Map<string, VoiceProfile> = new Map();

  constructor(adapter?: VoiceProviderAdapter) {
    // Default to Web Speech API
    const webSpeech = new WebSpeechAdapter();
    this.adapter = adapter ?? (webSpeech.isAvailable() ? webSpeech : new PlaceholderProviderAdapter());

    // Index preset voices
    PRESET_VOICES.forEach((v) => this.voiceMap.set(v.id, v));
  }

  /** Get the active adapter name */
  getAdapterName(): string {
    return this.adapter.name;
  }

  /** Check if voice is enabled via parent settings + adapter availability */
  isEnabled(): boolean {
    return getParentSettings().soundEnabled && this.adapter.isAvailable();
  }

  /** Assign a voice profile to a character */
  assignVoice(characterId: string, voiceProfileId: string): void {
    const profile = this.voiceMap.get(voiceProfileId) ?? PRESET_VOICES[0];
    this.voiceMap.set(`char:${characterId}`, profile);
  }

  /** Get voice profile for a character */
  getCharacterVoice(characterId: string): VoiceProfile {
    return (
      this.voiceMap.get(`char:${characterId}`) ??
      (characterId === "narrator" ? PRESET_VOICES[0] : PRESET_VOICES[1])
    );
  }

  /** Speak a single dialogue line */
  async speakDialogue(dialogue: Dialogue): Promise<VoiceResult> {
    if (!this.isEnabled()) {
      // Return estimated duration even when disabled
      const words = dialogue.text.split(/\s+/).length;
      return { durationSec: words / 2.5, audioRef: "" };
    }

    const voice = this.getCharacterVoice(dialogue.characterId);
    return this.adapter.speak({
      text: dialogue.text,
      voiceProfile: voice,
      emotion: dialogue.emotion,
    });
  }

  /** Generate full voice tracks for an episode's dialogue */
  async generateEpisodeTracks(
    episode: Episode,
    voiceMap?: CharacterVoiceMap,
  ): Promise<Array<{ dialogueId: string; characterId: string; result: VoiceResult }>> {
    // Apply voice map if provided
    if (voiceMap) {
      Object.entries(voiceMap.mapping).forEach(([charId, voiceId]) => {
        this.assignVoice(charId, voiceId);
      });
    }

    const results: Array<{ dialogueId: string; characterId: string; result: VoiceResult }> = [];

    for (const scene of episode.scenes) {
      for (const shot of scene.shots) {
        for (const dialogue of shot.dialogue) {
          const result = await this.speakDialogue(dialogue);
          results.push({
            dialogueId: dialogue.id,
            characterId: dialogue.characterId,
            result,
          });
        }
      }
    }

    return results;
  }

  /** Stop all voice output */
  stop(): void {
    this.adapter.stop();
  }

  /** Get all available voice profiles */
  getAvailableVoices(): VoiceProfile[] {
    return this.adapter.getVoices();
  }
}

/** Singleton voice engine */
export const voiceEngine = new VoiceEngine();
