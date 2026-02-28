import { useState, useCallback, useRef, useEffect } from "react";

export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [rate, setRate] = useState(1);
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const indexRef = useRef(0);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setCurrentIndex(-1);
    indexRef.current = 0;
  }, []);

  useEffect(() => () => { window.speechSynthesis.cancel(); }, []);

  const speak = useCallback((paragraphs: string[]) => {
    stop();
    if (!paragraphs.length) return;
    indexRef.current = 0;

    const speakNext = (i: number) => {
      if (i >= paragraphs.length) { stop(); return; }
      const utt = new SpeechSynthesisUtterance(paragraphs[i]);
      utt.rate = rate;
      utt.onstart = () => { setCurrentIndex(i); setSpeaking(true); };
      utt.onend = () => speakNext(i + 1);
      utt.onerror = () => stop();
      window.speechSynthesis.speak(utt);
    };
    speakNext(0);
  }, [rate, stop]);

  const pause = useCallback(() => { window.speechSynthesis.pause(); setPaused(true); }, []);
  const resume = useCallback(() => { window.speechSynthesis.resume(); setPaused(false); }, []);

  return { speak, stop, pause, resume, speaking, paused, currentIndex, rate, setRate };
}
