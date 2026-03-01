/**
 * mediaOrchestrator.ts — Unified media pipeline coordinator.
 *
 * Orchestrates the full episode generation flow:
 *   1. Story → Episode schema (storyToEpisode)
 *   2. Voice generation for all dialogue (voiceStreamEngine / elevenlabsProvider)
 *   3. Scene image generation (generate-scene-image edge function)
 *   4. Audio composition (audioEngine)
 *   5. Render plan assembly (renderPlan)
 *   6. Video encoding (videoJobStore)
 *
 * Each step emits progress events for real-time UI feedback.
 */

import type { Episode } from "@/lib/studio/episodeSchema";
import type { VoiceProfile } from "@/lib/studio/voice/voiceTypes";
import type { VideoJob } from "@/lib/studio/video/videoJobTypes";

export type OrchestratorPhase =
  | "idle"
  | "parsing"
  | "voice-gen"
  | "image-gen"
  | "audio-mix"
  | "render"
  | "encode"
  | "complete"
  | "error";

export interface OrchestratorState {
  phase: OrchestratorPhase;
  /** Overall progress 0–100 */
  progress: number;
  /** Human-readable step label */
  label: string;
  /** Current episode being processed */
  episodeId?: string;
  /** Associated video job */
  videoJobId?: string;
  /** Error details */
  error?: string;
}

export interface OrchestratorConfig {
  /** Voice profiles mapped by character ID */
  voiceMap: Record<string, VoiceProfile>;
  /** Music style preference */
  musicStyle: string;
  /** Target duration in seconds */
  targetDurationSec: number;
  /** Whether to use cloud TTS (ElevenLabs) */
  useCloudTTS: boolean;
}

type StateListener = (state: OrchestratorState) => void;

let state: OrchestratorState = { phase: "idle", progress: 0, label: "Ready" };
const listeners = new Set<StateListener>();

function emit(patch: Partial<OrchestratorState>) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn({ ...state }));
}

/** Subscribe to orchestrator state changes */
export function onOrchestratorStateChange(fn: StateListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Get current orchestrator state */
export function getOrchestratorState(): OrchestratorState {
  return { ...state };
}

/**
 * Run the full media pipeline for an episode.
 *
 * This is the main entry point. It coordinates all subsystems
 * in sequence, emitting progress at each phase boundary.
 *
 * Currently uses simulated timing; production would dispatch
 * to real edge functions and await real results.
 */
export async function orchestrateEpisode(
  episode: Episode,
  config: OrchestratorConfig,
): Promise<string | null> {
  try {
    /* Phase 1: Parse & validate */
    emit({ phase: "parsing", progress: 5, label: "Validating episode structure…", episodeId: episode.id });
    await delay(800);

    if (episode.scenes.length === 0) {
      throw new Error("Episode has no scenes");
    }

    /* Phase 2: Voice generation */
    emit({ phase: "voice-gen", progress: 15, label: "Generating character voices…" });
    const totalDialogue = episode.scenes.reduce(
      (sum, s) => sum + s.shots.reduce((ss, shot) => ss + shot.dialogue.length, 0),
      0,
    );
    // Simulate per-line voice generation
    for (let i = 0; i < Math.min(totalDialogue, 20); i++) {
      await delay(200);
      emit({ progress: 15 + Math.round((i / Math.max(totalDialogue, 1)) * 20) });
    }

    /* Phase 3: Image generation */
    emit({ phase: "image-gen", progress: 40, label: "Generating scene illustrations…" });
    for (let i = 0; i < episode.scenes.length; i++) {
      await delay(500);
      emit({
        progress: 40 + Math.round((i / episode.scenes.length) * 20),
        label: `Generating scene ${i + 1}/${episode.scenes.length}…`,
      });
    }

    /* Phase 4: Audio mixing */
    emit({ phase: "audio-mix", progress: 65, label: "Mixing audio tracks…" });
    await delay(1500);

    /* Phase 5: Render */
    emit({ phase: "render", progress: 75, label: "Rendering video frames…" });
    await delay(2000);
    emit({ progress: 88, label: "Compositing final frames…" });
    await delay(1000);

    /* Phase 6: Encode */
    emit({ phase: "encode", progress: 92, label: "Encoding video…" });
    await delay(2000);

    /* Complete */
    const outputUrl = `https://placeholder.eku.video/${episode.id}.mp4`;
    emit({ phase: "complete", progress: 100, label: "Episode ready!", videoJobId: episode.id });

    return outputUrl;
  } catch (err: any) {
    emit({ phase: "error", label: err.message || "Unknown error", error: err.message });
    return null;
  }
}

/** Reset orchestrator to idle */
export function resetOrchestrator() {
  emit({ phase: "idle", progress: 0, label: "Ready", episodeId: undefined, videoJobId: undefined, error: undefined });
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
