/**
 * useVoiceEngine.ts — Enhanced speech hook with voice profile support.
 *
 * Extends the base Web Speech API with VoiceProfile parameters
 * (pitch, rate, volume, voice selection) and persists the selected
 * profile to localStorage.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { VoiceProfile } from "@/lib/studio/voice/voiceTypes";
import { PRESET_VOICES } from "@/lib/studio/voice/voiceTypes";

const STORAGE_KEY = "eku_selected_voice_profile_id";

function resolveWebSpeechVoice(profile: VoiceProfile): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (profile.providerVoiceId) {
    const match = voices.find((v) => v.name === profile.providerVoiceId);
    if (match) return match;
  }
  // Fallback: find a voice matching the language
  return voices.find((v) => v.lang.startsWith(profile.language)) ?? voices[0] ?? null;
}

export function useVoiceEngine() {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load saved profile
  const savedId = localStorage.getItem(STORAGE_KEY);
  const defaultProfile = PRESET_VOICES.find((v) => v.id === savedId) ?? PRESET_VOICES[0];
  const [selectedProfile, setSelectedProfileState] = useState<VoiceProfile>(defaultProfile);
  const profileRef = useRef(selectedProfile);

  const setSelectedProfile = useCallback((p: VoiceProfile) => {
    profileRef.current = p;
    setSelectedProfileState(p);
    localStorage.setItem(STORAGE_KEY, p.id);
  }, []);

  // Populate device voices
  useEffect(() => {
    const update = () => setAvailableVoices(window.speechSynthesis.getVoices());
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setCurrentIndex(-1);
  }, []);

  useEffect(() => () => { window.speechSynthesis.cancel(); }, []);

  const speak = useCallback(
    (paragraphs: string[]) => {
      stop();
      if (!paragraphs.length) return;
      const profile = profileRef.current;

      const speakNext = (i: number) => {
        if (i >= paragraphs.length) {
          stop();
          return;
        }
        const utt = new SpeechSynthesisUtterance(paragraphs[i]);
        utt.rate = profile.rate;
        utt.pitch = 1 + profile.pitch; // SpeechSynth pitch is 0-2, profile pitch is -1 to +1
        utt.volume = profile.volume;

        const voice = resolveWebSpeechVoice(profile);
        if (voice) utt.voice = voice;

        utt.onstart = () => {
          setCurrentIndex(i);
          setSpeaking(true);
        };
        utt.onend = () => speakNext(i + 1);
        utt.onerror = () => stop();
        window.speechSynthesis.speak(utt);
      };
      speakNext(0);
    },
    [stop],
  );

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setPaused(false);
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    speaking,
    paused,
    currentIndex,
    selectedProfile,
    setSelectedProfile,
    availableVoices,
    rate: selectedProfile.rate,
    setRate: (r: number) => setSelectedProfile({ ...selectedProfile, rate: r }),
  };
}
