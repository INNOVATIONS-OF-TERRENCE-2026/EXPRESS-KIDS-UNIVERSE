/**
 * voiceTypes.ts — Voice profile and character voice mapping types
 *
 * Defines the data model for multi-character voice personalization:
 *   - VoiceProfile: individual voice configuration
 *   - CharacterVoiceMap: maps episode characters to voice profiles
 *
 * Provider-agnostic — supports Web Speech API with placeholder
 * interfaces for future cloud TTS providers.
 */

/** Supported TTS provider identifiers */
export type VoiceProvider = "web-speech" | "elevenlabs" | "google-cloud" | "amazon-polly" | "azure";

/** Voice style categorization */
export type VoiceStyleTag =
  | "warm"
  | "playful"
  | "adventurous"
  | "calm"
  | "energetic"
  | "mysterious"
  | "heroic"
  | "silly";

/** A single voice profile */
export interface VoiceProfile {
  /** Unique identifier */
  id: string;
  /** Display name (e.g., "Sunny", "Captain", "Whisper") */
  name: string;
  /** Style tag for UI categorization */
  style: VoiceStyleTag;
  /** Pitch adjustment (-1 to +1, 0 = neutral) */
  pitch: number;
  /** Speaking rate (0.5 to 2.0, 1.0 = normal) */
  rate: number;
  /** Volume (0 to 1) */
  volume: number;
  /** Preferred provider */
  provider: VoiceProvider;
  /** Language / locale code */
  language: string;
  /** Provider-specific voice ID or name (e.g., Web Speech API voice name) */
  providerVoiceId?: string;
}

/** Maps character IDs to voice profile IDs */
export interface CharacterVoiceMap {
  /** Episode ID this mapping belongs to */
  episodeId: string;
  /** Map of characterId → voiceProfileId */
  mapping: Record<string, string>;
}

/** Voice generation request */
export interface VoiceRequest {
  text: string;
  voiceProfile: VoiceProfile;
  /** Emotion modifier for this specific utterance */
  emotion?: "neutral" | "happy" | "sad" | "excited" | "scared" | "angry" | "curious";
}

/** Voice generation result */
export interface VoiceResult {
  /** Duration in seconds */
  durationSec: number;
  /** Audio data (blob URL or AudioBuffer reference) */
  audioRef: string;
  /** Timing markers for lip sync */
  markers?: Array<{ timeSec: number; viseme: string }>;
}

/** Preset voice profiles for quick selection */
export const PRESET_VOICES: VoiceProfile[] = [
  {
    id: "voice_narrator",
    name: "Storyteller",
    style: "warm",
    pitch: 0,
    rate: 0.9,
    volume: 0.9,
    provider: "web-speech",
    language: "en-US",
  },
  {
    id: "voice_hero",
    name: "Hero",
    style: "adventurous",
    pitch: 0.2,
    rate: 1.0,
    volume: 0.85,
    provider: "web-speech",
    language: "en-US",
  },
  {
    id: "voice_sidekick",
    name: "Buddy",
    style: "playful",
    pitch: 0.4,
    rate: 1.1,
    volume: 0.8,
    provider: "web-speech",
    language: "en-US",
  },
  {
    id: "voice_mentor",
    name: "Wise Guide",
    style: "calm",
    pitch: -0.2,
    rate: 0.85,
    volume: 0.85,
    provider: "web-speech",
    language: "en-US",
  },
  {
    id: "voice_villain",
    name: "Mischief",
    style: "mysterious",
    pitch: -0.3,
    rate: 0.95,
    volume: 0.8,
    provider: "web-speech",
    language: "en-US",
  },
  {
    id: "voice_comic",
    name: "Giggles",
    style: "silly",
    pitch: 0.5,
    rate: 1.15,
    volume: 0.8,
    provider: "web-speech",
    language: "en-US",
  },
];
