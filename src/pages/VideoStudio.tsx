/**
 * VideoStudio.tsx — Video episode generation dashboard.
 *
 * Route: /studio/video
 *
 * Features:
 *  - Select a story from the user's gallery
 *  - Choose duration preset (2 min, 5 min, 15 min)
 *  - Map voices to characters (uses PRESET_VOICES)
 *  - Launch generation job with progress tracking
 *  - View completed video jobs with ProPlayer
 *  - Auto-save completed videos to Gallery
 *  - DB polling for real backend progress
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film,
  Play,
  Clock,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Volume2,
  Music,
  Sparkles,
} from "lucide-react";
import { AuroraGradient, CinematicButton, StaggerContainer, StaggerItem } from "@/components/eku";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PRESET_VOICES } from "@/lib/studio/voice/voiceTypes";
import {
  DURATION_LABELS,
  PACING_MODE_LABELS,
  PACING_MODE_DESCRIPTIONS,
  type VideoDuration,
  type PacingMode,
  type VideoJob,
  type VideoVoiceAssignment,
  type CompositionManifest,
} from "@/lib/studio/video/videoJobTypes";
import {
  createVideoJob,
  createVideoJobSync,
  getAllVideoJobs,
  subscribeVideoJob,
  pollJobFromDB,
  loadUserJobs,
} from "@/lib/studio/video/videoJobStore";
import { renderVideoFromManifest, uploadRenderedVideo } from "@/lib/studio/video/videoRenderer";
import { saveVideoToGallery } from "@/lib/galleryService";
import { ProPlayer } from "@/components/ProPlayer";
import { toast } from "sonner";

interface StoryOption {
  id: string;
  title: string;
  child_name: string;
  theme: string;
}

export default function VideoStudio() {
  const { user } = useAuth();
  const [stories, setStories] = useState<StoryOption[]>([]);
  const [selectedStory, setSelectedStory] = useState<StoryOption | null>(null);
  const [duration, setDuration] = useState<VideoDuration>("short");
  const [pacingMode, setPacingMode] = useState<PacingMode>("kids");
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [creating, setCreating] = useState(false);
  const [playingJob, setPlayingJob] = useState<VideoJob | null>(null);
  const savedJobIds = useRef(new Set<string>());
  const pollTimers = useRef(new Map<string, ReturnType<typeof setInterval>>());
  const unsubs = useRef(new Map<string, () => void>());
  const renderingJobs = useRef(new Set<string>());
  const isRendering = useRef(false);

  /* ── Load user stories ── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("stories")
        .select("id, title, child_name, theme")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setStories((data || []) as StoryOption[]);
    })();
  }, [user]);

  /* ── Load existing jobs (DB first, fallback to local) ── */
  useEffect(() => {
    if (user) {
      loadUserJobs(user.id).then((dbJobs) => {
        setJobs(dbJobs);
        // Resume polling for any active jobs
        dbJobs.forEach((j) => {
          if (j.status === "rendering" && j.outputUrl?.includes("manifest.json")) {
            // Resume client-side rendering
            startClientRender(j);
          } else if (!["complete", "failed"].includes(j.status)) {
            startPolling(j.id);
          }
        });
      });
    } else {
      setJobs(getAllVideoJobs());
    }
    return () => {
      // Cleanup all poll timers on unmount
      pollTimers.current.forEach((t) => clearInterval(t));
      pollTimers.current.clear();
      // Cleanup all subscriptions to prevent stale setJobs calls
      unsubs.current.forEach((fn) => fn());
      unsubs.current.clear();
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Warn before leaving during rendering ── */
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isRendering.current) {
        e.preventDefault();
        e.returnValue = "Video is rendering — leaving will cancel it.";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  /* ── Auto-save completed jobs to gallery ── */
  const autoSaveToGallery = useCallback(
    (job: VideoJob) => {
      if (savedJobIds.current.has(job.id)) return;
      if (job.status !== "complete" || !job.outputUrl) return;
      savedJobIds.current.add(job.id);
      saveVideoToGallery(job, user?.id).catch(() => {});
    },
    [user],
  );

  /* ── DB polling for active jobs ── */
  const MAX_POLLS = 100; // ~5 minutes at 3s interval
  const startPolling = useCallback(
    (jobId: string) => {
      if (pollTimers.current.has(jobId)) return;
      let pollCount = 0;
      const timer = setInterval(async () => {
        pollCount++;
        const updated = await pollJobFromDB(jobId);

        if (pollCount >= MAX_POLLS) {
          clearInterval(timer);
          pollTimers.current.delete(jobId);
          return;
        }

        if (!updated) return;

        setJobs((prev) =>
          prev.map((j) => (j.id === updated.id ? updated : j)),
        );

        // Detect "rendering" + manifest URL → start client-side render
        if (
          updated.status === "rendering" &&
          updated.outputUrl?.includes("manifest.json") &&
          !renderingJobs.current.has(updated.id)
        ) {
          clearInterval(timer);
          pollTimers.current.delete(jobId);
          startClientRender(updated);
        } else if (updated.status === "complete") {
          autoSaveToGallery(updated);
          clearInterval(timer);
          pollTimers.current.delete(jobId);
        } else if (updated.status === "failed") {
          clearInterval(timer);
          pollTimers.current.delete(jobId);
        }
      }, 3000);
      pollTimers.current.set(jobId, timer);
    },
    [autoSaveToGallery], // eslint-disable-line react-hooks/exhaustive-deps
  );

  /* ── Client-side video rendering ── */
  const startClientRender = useCallback(
    async (job: VideoJob) => {
      if (renderingJobs.current.has(job.id)) return;
      renderingJobs.current.add(job.id);
      isRendering.current = true;

      try {
        // 1. Fetch composition manifest
        const manifestUrl = job.outputUrl;
        if (!manifestUrl) throw new Error("No manifest URL");

        const res = await fetch(manifestUrl);
        if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
        const manifest: CompositionManifest = await res.json();

        // 2. Render video locally (Canvas + MediaRecorder)
        toast.info("Rendering video — please keep this tab open…");
        const { blob, durationSec } = await renderVideoFromManifest(manifest, {
          onProgress: (pct) => {
            setJobs((prev) =>
              prev.map((j) =>
                j.id === job.id
                  ? { ...j, progress: pct, stepLabel: `Rendering video… ${pct}%` }
                  : j,
              ),
            );
          },
          onPhase: (label) => {
            setJobs((prev) =>
              prev.map((j) =>
                j.id === job.id ? { ...j, stepLabel: label } : j,
              ),
            );
          },
        });

        // 3. Upload rendered video to storage
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id ? { ...j, progress: 98, stepLabel: "Uploading video…" } : j,
          ),
        );

        let videoUrl = await uploadRenderedVideo(blob, job.id);

        // Fallback: if storage upload fails, create blob URL for this session
        if (!videoUrl) {
          videoUrl = URL.createObjectURL(blob);
          console.warn("[VideoStudio] Storage upload failed; using blob URL");
        }

        // 4. Update DB with final video URL
        await supabase.from("video_jobs").update({
          status: "complete",
          progress: 100,
          step_label: "Ready to watch!",
          output_url: videoUrl,
        }).eq("id", job.id);

        // 5. Update local state + save to gallery
        const completedJob: VideoJob = {
          ...job,
          status: "complete",
          progress: 100,
          stepLabel: "Ready to watch!",
          outputUrl: videoUrl,
          updatedAt: Date.now(),
        };

        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? completedJob : j)),
        );

        // Auto-save to gallery
        await supabase.from("gallery_items").upsert({
          user_id: user?.id,
          type: "video",
          source: "video_studio",
          job_id: job.id,
          adventure_id: job.request.storyId,
          title: job.request.storyTitle || "Untitled Video",
          output_url: videoUrl,
          poster_url: job.thumbnailUrl || manifest.scenes[0]?.imageUrl,
          duration_seconds: Math.round(durationSec),
          status: "ready",
          metadata: { provider: job.request.provider, musicStyle: job.request.musicStyle },
        }, { onConflict: "job_id" }).then(() => {});

        toast.success(`"${job.request.storyTitle}" video is ready!`);
      } catch (err) {
        console.error("[VideoStudio] Client render failed:", err);
        toast.error("Video rendering failed");
        await supabase.from("video_jobs").update({
          status: "failed",
          error: err instanceof Error ? err.message : "Rendering failed",
        }).eq("id", job.id);

        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? { ...j, status: "failed" as const, error: "Rendering failed" }
              : j,
          ),
        );
      } finally {
        renderingJobs.current.delete(job.id);
        isRendering.current = renderingJobs.current.size > 0;
      }
    },
    [user],
  );

  /* ── Create job ── */
  const handleCreate = useCallback(async () => {
    if (!selectedStory || creating) return;
    setCreating(true);

    const voiceAssignments: VideoVoiceAssignment[] = [
      {
        characterId: "narrator",
        characterName: "Narrator",
        voiceProfileId: PRESET_VOICES[0].id,
      },
    ];

    const request = {
      storyId: selectedStory.id,
      storyTitle: selectedStory.title,
      duration,
      provider: "internal" as const,
      voiceAssignments,
      musicStyle: "magical",
      pacingMode,
    };

    // Create job: auth users try DB persist + edge function; falls back to
    // local simulation automatically if DB tables don't exist yet.
    const job = user
      ? await createVideoJob(request, user.id)
      : createVideoJobSync(request);

    // ALWAYS subscribe to in-memory job updates.
    // Works for BOTH paths:
    //   - Local simulation calls notify() directly
    //   - DB polling calls pollJobFromDB() which syncs to cache + calls notify()
    const storyTitle = selectedStory.title;
    const unsub = subscribeVideoJob(job.id, (updated) => {
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));

      // Edge function sets status="rendering" + manifest URL → start client render
      if (
        updated.status === "rendering" &&
        updated.outputUrl?.includes("manifest.json") &&
        !renderingJobs.current.has(updated.id)
      ) {
        startClientRender(updated);
        // Don't unsub yet — we still need to hear the final "complete" from client render
      }

      if (updated.status === "complete") {
        // Only toast if we didn't just finish client rendering (it toasts itself)
        if (!renderingJobs.current.has(updated.id)) {
          toast.success(`"${storyTitle}" video is ready!`);
        }
        autoSaveToGallery(updated);
        unsub();
        unsubs.current.delete(updated.id);
        const t = pollTimers.current.get(updated.id);
        if (t) { clearInterval(t); pollTimers.current.delete(updated.id); }
      }
      if (updated.status === "failed") {
        toast.error(updated.error || "Video generation failed");
        unsub();
        unsubs.current.delete(updated.id);
        const t = pollTimers.current.get(updated.id);
        if (t) { clearInterval(t); pollTimers.current.delete(updated.id); }
      }
    });
    // Track for cleanup on unmount
    unsubs.current.set(job.id, unsub);

    // Auth users: ALSO poll DB for real edge-function progress
    // (poll syncs DB → local cache → notify() → subscription fires)
    if (user) {
      startPolling(job.id);
    }

    setJobs((prev) => [job, ...prev]);
    setCreating(false);
    setSelectedStory(null);
    toast.info("Video generation started!");
  }, [selectedStory, duration, creating, user, startPolling, startClientRender, autoSaveToGallery]);

  /* ── Watch handler ── */
  const handleWatch = useCallback((job: VideoJob) => {
    if (!job.outputUrl) {
      toast.error("Video not available yet");
      return;
    }
    // Don't try to play manifest URLs — only real video files
    if (job.outputUrl.includes("manifest.json")) {
      toast.info("Video is still rendering…");
      return;
    }
    setPlayingJob(job);
  }, []);

  /* ── Save from player ── */
  const handlePlayerSave = useCallback(() => {
    if (!playingJob) return;
    saveVideoToGallery(playingJob, user?.id)
      .then((ok) => {
        if (ok) toast.success("Saved to Gallery");
        else toast.error("Failed to save");
      });
  }, [playingJob, user]);

  /* ── Close player (stable ref for ProPlayer memo) ── */
  const handleClosePlayer = useCallback(() => setPlayingJob(null), []);

  const activeJobs = jobs.filter((j) => !["complete", "failed"].includes(j.status));
  const completedJobs = jobs.filter((j) => j.status === "complete" || j.status === "failed");

  return (
    <div className="relative min-h-screen">
      <AuroraGradient intensity="low" />
      <div className="relative z-10 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/dashboard">
              <CinematicButton variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" /> Dashboard
              </CinematicButton>
            </Link>
          </div>

          <StaggerContainer delay={0.1}>
            <StaggerItem>
              <div className="text-center mb-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-4"
                >
                  <Film className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Video Studio</span>
                </motion.div>
                <h1 className="font-heading text-3xl md:text-4xl font-black aurora-text mb-2">
                  Create Video Episodes
                </h1>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  Transform your stories into animated video episodes with narration and music.
                </p>
              </div>
            </StaggerItem>

            {/* ── New Job Form ── */}
            <StaggerItem>
              <div className="glass-card p-6 md:p-8 mb-8">
                <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  New Video
                </h2>

                {/* Story selector */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Choose a Story
                  </label>
                  <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
                    {stories.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No stories yet.{" "}
                        <Link to="/create" className="text-primary underline">
                          Create one first
                        </Link>
                      </p>
                    ) : (
                      stories.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedStory(s)}
                          className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                            selectedStory?.id === s.id
                              ? "bg-primary/15 ring-1 ring-primary/40"
                              : "hover:bg-foreground/5"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{s.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.child_name} · {s.theme}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Duration selector */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Duration
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(DURATION_LABELS) as VideoDuration[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          duration === d
                            ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                            : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {DURATION_LABELS[d]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cinematic pacing selector */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Cinematic Pacing
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(PACING_MODE_LABELS) as PacingMode[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPacingMode(p)}
                        title={PACING_MODE_DESCRIPTIONS[p]}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          pacingMode === p
                            ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                            : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {PACING_MODE_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice & Music info */}
                <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4" /> Narrator: {PRESET_VOICES[0].name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Music className="w-4 h-4" /> Magical soundtrack
                  </span>
                </div>

                {/* Generate button */}
                <CinematicButton
                  onClick={handleCreate}
                  disabled={!selectedStory || creating}
                  className="w-full"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Generate Video
                </CinematicButton>
              </div>
            </StaggerItem>

            {/* ── Active Jobs ── */}
            {activeJobs.length > 0 && (
              <StaggerItem>
                <h2 className="font-heading text-xl font-bold mb-4">In Progress</h2>
                <div className="grid gap-3 mb-8">
                  {activeJobs.map((job) => (
                    <div key={job.id} className="glass-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-medium text-sm truncate">
                          {job.request.storyTitle}
                        </p>
                        <span className="text-xs text-primary font-medium">
                          {job.progress}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden mb-2">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${job.progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {job.stepLabel}
                      </p>
                    </div>
                  ))}
                </div>
              </StaggerItem>
            )}

            {/* ── Completed Jobs ── */}
            {completedJobs.length > 0 && (
              <StaggerItem>
                <h2 className="font-heading text-xl font-bold mb-4">Completed</h2>
                <div className="grid gap-3">
                  {completedJobs.map((job) => (
                    <div key={job.id} className="glass-card p-4 flex items-center gap-4">
                      {job.status === "complete" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {job.request.storyTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {DURATION_LABELS[job.request.duration]} ·{" "}
                          {job.status === "complete" ? "Ready" : job.error || "Failed"}
                        </p>
                      </div>
                      {job.status === "complete" && (
                        <CinematicButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleWatch(job)}
                          disabled={!job.outputUrl}
                        >
                          <Play className="w-4 h-4" /> Watch
                        </CinematicButton>
                      )}
                    </div>
                  ))}
                </div>
              </StaggerItem>
            )}
          </StaggerContainer>
        </div>
      </div>

      {/* ── ProPlayer Overlay ── */}
      <AnimatePresence>
        {playingJob && playingJob.outputUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) handleClosePlayer();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-4xl"
            >
              <ProPlayer
                url={playingJob.outputUrl}
                title={playingJob.request.storyTitle}
                poster={playingJob.thumbnailUrl}
                onClose={handleClosePlayer}
                onSave={handlePlayerSave}
                showSave={true}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
