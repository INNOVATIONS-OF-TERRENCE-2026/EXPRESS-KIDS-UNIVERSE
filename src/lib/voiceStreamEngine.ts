/**
 * voiceStreamEngine.ts — Real-time voice streaming engine.
 *
 * Provides a unified interface for streaming TTS audio, with:
 *  - Web Speech API (local, zero-latency) as primary/fallback
 *  - ElevenLabs streaming (cloud, high-quality) when available
 *
 * The engine abstracts provider selection so the UI only calls
 * `streamText()` and `stopStream()`.
 */

import type { VoiceProfile } from "@/lib/studio/voice/voiceTypes";
import {
  getElevenLabsStatus,
  streamSpeech,
} from "@/lib/elevenlabsProvider";

export type StreamStatus = "idle" | "buffering" | "playing" | "paused" | "error";

interface StreamState {
  status: StreamStatus;
  /** Provider actually being used for this stream */
  provider: "web-speech" | "elevenlabs";
  /** Progress 0-1 within the current chunk */
  progress: number;
}

type StreamListener = (state: StreamState) => void;

const listeners = new Set<StreamListener>();
let currentState: StreamState = { status: "idle", provider: "web-speech", progress: 0 };
let audioElement: HTMLAudioElement | null = null;

function emit(patch: Partial<StreamState>) {
  currentState = { ...currentState, ...patch };
  listeners.forEach((fn) => fn({ ...currentState }));
}

/** Subscribe to stream state changes */
export function onStreamStateChange(fn: StreamListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Get current stream state snapshot */
export function getStreamState(): StreamState {
  return { ...currentState };
}

/**
 * Stream text-to-speech with the best available provider.
 *
 * Attempts ElevenLabs streaming first (if profile.provider is 'elevenlabs'
 * and the service is healthy), then falls back to Web Speech API.
 */
export async function streamText(
  text: string,
  profile: VoiceProfile,
): Promise<void> {
  stopStream();

  // Try ElevenLabs if requested and available
  if (
    profile.provider === "elevenlabs" &&
    profile.providerVoiceId &&
    getElevenLabsStatus() !== "unavailable"
  ) {
    emit({ status: "buffering", provider: "elevenlabs", progress: 0 });
    try {
      const streamUrl = await streamSpeech(text, profile.providerVoiceId);
      if (streamUrl) {
        audioElement = new Audio(streamUrl);
        audioElement.onplaying = () => emit({ status: "playing" });
        audioElement.ontimeupdate = () => {
          if (audioElement && audioElement.duration) {
            emit({ progress: audioElement.currentTime / audioElement.duration });
          }
        };
        audioElement.onended = () => emit({ status: "idle", progress: 1 });
        audioElement.onerror = () => {
          // Fallback to Web Speech on stream error
          streamWithWebSpeech(text, profile);
        };
        await audioElement.play();
        return;
      }
    } catch {
      // Fall through to Web Speech
    }
  }

  // Default: Web Speech API
  streamWithWebSpeech(text, profile);
}

function streamWithWebSpeech(text: string, profile: VoiceProfile) {
  emit({ status: "playing", provider: "web-speech", progress: 0 });

  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = profile.rate;
  utt.pitch = 1 + profile.pitch;
  utt.volume = profile.volume;

  // Try to match a system voice
  const voices = window.speechSynthesis.getVoices();
  if (profile.providerVoiceId) {
    const match = voices.find((v) => v.name === profile.providerVoiceId);
    if (match) utt.voice = match;
  } else {
    const langMatch = voices.find((v) => v.lang.startsWith(profile.language));
    if (langMatch) utt.voice = langMatch;
  }

  utt.onend = () => emit({ status: "idle", progress: 1 });
  utt.onerror = () => emit({ status: "error" });

  window.speechSynthesis.speak(utt);
}

/** Stop any ongoing stream */
export function stopStream() {
  window.speechSynthesis.cancel();
  if (audioElement) {
    audioElement.pause();
    audioElement.src = "";
    audioElement = null;
  }
  emit({ status: "idle", progress: 0 });
}

/** Pause the current stream */
export function pauseStream() {
  if (currentState.provider === "web-speech") {
    window.speechSynthesis.pause();
  } else if (audioElement) {
    audioElement.pause();
  }
  emit({ status: "paused" });
}

/** Resume the current stream */
export function resumeStream() {
  if (currentState.provider === "web-speech") {
    window.speechSynthesis.resume();
  } else if (audioElement) {
    audioElement.play();
  }
  emit({ status: "playing" });
}
