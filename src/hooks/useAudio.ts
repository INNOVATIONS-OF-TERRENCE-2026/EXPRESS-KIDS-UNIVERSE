import { useCallback } from "react";
import { audioManager } from "@/lib/audio";

export function useAudio() {
  const click = useCallback(() => audioManager.click(), []);
  const success = useCallback(() => audioManager.success(), []);
  const error = useCallback(() => audioManager.error(), []);
  const sparkle = useCallback(() => audioManager.sparkle(), []);
  const whoosh = useCallback(() => audioManager.whoosh(), []);
  const toggleAmbient = useCallback(() => {
    if (audioManager.isAmbientPlaying) {
      audioManager.stopAmbient();
    } else {
      audioManager.startAmbient();
    }
  }, []);

  return { click, success, error, sparkle, whoosh, toggleAmbient, isAmbientPlaying: audioManager.isAmbientPlaying };
}
