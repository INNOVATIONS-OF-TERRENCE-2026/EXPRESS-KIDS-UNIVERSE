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
 *  - View completed video jobs
 */

import { useEffect, useState, useCallback } from "react";
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
  type VideoDuration,
  type VideoJob,
  type VideoVoiceAssignment,
} from "@/lib/studio/video/videoJobTypes";
import {
  createVideoJob,
  getAllVideoJobs,
  subscribeVideoJob,
} from "@/lib/studio/video/videoJobStore";
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
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [creating, setCreating] = useState(false);

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

  /* ── Load existing jobs ── */
  useEffect(() => {
    setJobs(getAllVideoJobs());
  }, []);

  /* ── Create job ── */
  const handleCreate = useCallback(() => {
    if (!selectedStory || creating) return;
    setCreating(true);

    // Default voice assignments: narrator voice for all
    const voiceAssignments: VideoVoiceAssignment[] = [
      {
        characterId: "narrator",
        characterName: "Narrator",
        voiceProfileId: PRESET_VOICES[0].id,
      },
    ];

    const job = createVideoJob({
      storyId: selectedStory.id,
      storyTitle: selectedStory.title,
      duration,
      provider: "internal",
      voiceAssignments,
      musicStyle: "magical",
    });

    // Subscribe to updates
    const unsub = subscribeVideoJob(job.id, (updated) => {
      setJobs((prev) =>
        prev.map((j) => (j.id === updated.id ? updated : j)),
      );
      if (updated.status === "complete") {
        toast.success(`"${selectedStory.title}" video is ready!`);
        unsub();
      }
      if (updated.status === "failed") {
        toast.error(updated.error || "Video generation failed");
        unsub();
      }
    });

    setJobs((prev) => [job, ...prev]);
    setCreating(false);
    setSelectedStory(null);
    toast.info("Video generation started!");
  }, [selectedStory, duration, creating]);

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
                        <CinematicButton variant="outline" size="sm">
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
    </div>
  );
}
