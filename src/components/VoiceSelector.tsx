/**
 * VoiceSelector.tsx — Hybrid voice selector bottom-sheet.
 *
 * Three tabs:
 *  1. Presets — 6 preset character voices from voiceTypes.ts
 *  2. Device  — System voices from the Web Speech API
 *  3. Studio  — ElevenLabs cloud voices (shown only when available)
 *
 * Each entry has:
 *  - Name + style tag
 *  - Test button (plays a short sample)
 *  - Selection indicator
 *
 * Persists selection to localStorage via useVoiceEngine.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  Square,
  X,
  Mic,
  Monitor,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { CinematicButton } from "@/components/eku";
import {
  VoiceProfile,
  PRESET_VOICES,
  VoiceStyleTag,
} from "@/lib/studio/voice/voiceTypes";

/* ── Style badge colors ── */
const STYLE_COLORS: Record<VoiceStyleTag, string> = {
  warm: "bg-orange-500/20 text-orange-300",
  playful: "bg-pink-500/20 text-pink-300",
  adventurous: "bg-blue-500/20 text-blue-300",
  calm: "bg-teal-500/20 text-teal-300",
  energetic: "bg-yellow-500/20 text-yellow-300",
  mysterious: "bg-purple-500/20 text-purple-300",
  heroic: "bg-red-500/20 text-red-300",
  silly: "bg-green-500/20 text-green-300",
};

const SAMPLE_TEXT = "Once upon a time, in a land of imagination…";

type Tab = "presets" | "device" | "studio";

interface Props {
  selectedProfile: VoiceProfile;
  onSelect: (profile: VoiceProfile) => void;
  availableVoices: SpeechSynthesisVoice[];
}

export default function VoiceSelector({ selectedProfile, onSelect, availableVoices }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("presets");
  const [testingId, setTestingId] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  /* Stop any test audio on close */
  const close = useCallback(() => {
    window.speechSynthesis.cancel();
    setTestingId(null);
    setOpen(false);
  }, []);

  /* Close on ESC */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, close]);

  /* ── Build device voice profiles ── */
  const deviceProfiles: VoiceProfile[] = useMemo(() => {
    const recommended = availableVoices.filter(
      (v) => v.lang.startsWith("en") && !v.name.includes("Google"),
    );
    const finalList = recommended.length > 0 ? recommended : availableVoices.filter((v) => v.lang.startsWith("en"));
    return finalList.slice(0, 12).map((v) => ({
      id: `device_${v.name}`,
      name: v.name.replace(/Microsoft |Google |Apple /, "").split(" - ")[0],
      style: "calm" as VoiceStyleTag,
      pitch: 0,
      rate: 1,
      volume: 0.85,
      provider: "web-speech" as const,
      language: v.lang,
      providerVoiceId: v.name,
    }));
  }, [availableVoices]);

  /* ── Test voice ── */
  const testVoice = useCallback(
    (profile: VoiceProfile) => {
      window.speechSynthesis.cancel();
      if (testingId === profile.id) {
        setTestingId(null);
        return;
      }
      const utt = new SpeechSynthesisUtterance(SAMPLE_TEXT);
      utt.rate = profile.rate;
      utt.pitch = 1 + profile.pitch;
      utt.volume = profile.volume;
      if (profile.providerVoiceId) {
        const v = availableVoices.find((av) => av.name === profile.providerVoiceId);
        if (v) utt.voice = v;
      }
      utt.onend = () => setTestingId(null);
      utt.onerror = () => setTestingId(null);
      setTestingId(profile.id);
      window.speechSynthesis.speak(utt);
    },
    [testingId, availableVoices],
  );

  /* ── Select and close ── */
  const selectVoice = useCallback(
    (profile: VoiceProfile) => {
      onSelect(profile);
      close();
    },
    [onSelect, close],
  );

  const tabs: { key: Tab; label: string; icon: typeof Sparkles }[] = [
    { key: "presets", label: "Characters", icon: Sparkles },
    { key: "device", label: "Device", icon: Monitor },
    { key: "studio", label: "Studio", icon: Mic },
  ];

  const profiles = tab === "presets" ? PRESET_VOICES : tab === "device" ? deviceProfiles : [];

  return (
    <>
      {/* Trigger button */}
      <CinematicButton variant="outline" size="sm" onClick={() => setOpen(true)} aria-label="Choose voice">
        <Volume2 className="w-4 h-4" />
        <span className="hidden sm:inline">{selectedProfile.name}</span>
        <ChevronDown className="w-3 h-3" />
      </CinematicButton>

      {/* Bottom-sheet overlay */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
              onClick={close}
            />

            {/* Sheet */}
            <motion.div
              ref={sheetRef}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[9999] bg-background/95 backdrop-blur-xl rounded-t-3xl border-t border-border max-h-[75vh] overflow-hidden flex flex-col"
              role="dialog"
              aria-label="Voice selector"
            >
              {/* Handle + close */}
              <div className="flex items-center justify-between px-6 pt-4 pb-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-primary" />
                  <span className="font-heading font-bold text-lg">Voice</span>
                </div>
                <button onClick={close} className="p-2 rounded-xl hover:bg-foreground/10 transition-colors" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-6 py-2" role="tablist">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={tab === t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      tab === t.key
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:bg-foreground/5"
                    }`}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Voice list */}
              <div className="flex-1 overflow-y-auto px-6 pb-8 pt-2">
                {tab === "studio" ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mic className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    <p className="font-medium mb-1">Studio Voices Coming Soon</p>
                    <p className="text-sm">ElevenLabs integration will unlock premium AI voices</p>
                  </div>
                ) : profiles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No voices available</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {profiles.map((p) => {
                      const isSelected = selectedProfile.id === p.id;
                      const isTesting = testingId === p.id;
                      return (
                        <motion.button
                          key={p.id}
                          layout
                          onClick={() => selectVoice(p)}
                          className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors w-full ${
                            isSelected
                              ? "bg-primary/15 ring-1 ring-primary/40"
                              : "hover:bg-foreground/5"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{p.name}</span>
                              {tab === "presets" && (
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STYLE_COLORS[p.style]}`}>
                                  {p.style}
                                </span>
                              )}
                              {isSelected && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                                  Active
                                </span>
                              )}
                            </div>
                            {tab === "presets" && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Pitch {p.pitch > 0 ? "+" : ""}{p.pitch} · Rate {p.rate}x
                              </p>
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); testVoice(p); }}
                            className="p-2 rounded-lg hover:bg-foreground/10 transition-colors flex-shrink-0"
                            aria-label={isTesting ? "Stop test" : `Test ${p.name} voice`}
                          >
                            {isTesting ? (
                              <Square className="w-4 h-4 text-primary" />
                            ) : (
                              <Volume2 className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
