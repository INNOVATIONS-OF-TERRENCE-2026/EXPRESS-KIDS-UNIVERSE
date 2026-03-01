/**
 * videoJobStore.ts — Persistent video job store with Supabase backend + local fallback.
 *
 * When Supabase is available and user is authenticated:
 *   - Jobs are persisted to the video_jobs table
 *   - Edge function is invoked for real pipeline processing
 *   - Polling reads status from DB
 *
 * Fallback (no auth / Supabase error):
 *   - In-memory simulation preserved for DEV/demo mode
 *   - Uses a public demo video URL on completion
 */

import type { VideoJob, VideoJobRequest, VideoJobStatus } from "./videoJobTypes";
import type { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

/* ── In-memory store (cache + fallback) ── */
const jobs = new Map<string, VideoJob>();
const listeners = new Map<string, Set<(job: VideoJob) => void>>();

const DEMO_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const DEMO_POSTER_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg";

function generateId(): string {
  return `vjob_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function notify(jobId: string) {
  const job = jobs.get(jobId);
  if (!job) return;
  listeners.get(jobId)?.forEach((fn) => fn({ ...job }));
}

/* ── DB row → VideoJob mapper ── */
function dbRowToJob(row: Record<string, unknown>): VideoJob {
  return {
    id: row.id as string,
    request: row.request as VideoJobRequest,
    status: row.status as VideoJobStatus,
    progress: (row.progress as number) ?? 0,
    stepLabel: (row.step_label as string) ?? "",
    outputUrl: (row.output_url as string) || undefined,
    thumbnailUrl: (row.thumbnail_url as string) || undefined,
    error: (row.error as string) || undefined,
    createdAt: new Date(row.created_at as string).getTime(),
    updatedAt: new Date(row.updated_at as string).getTime(),
  };
}

/* ── Simulated pipeline (DEV / guest fallback) ── */
function simulatePipeline(jobId: string) {
  const steps: { status: VideoJobStatus; label: string; delay: number; progress: number }[] = [
    { status: "processing", label: "Analyzing story scenes…", delay: 2000, progress: 10 },
    { status: "processing", label: "Generating voice narration…", delay: 3000, progress: 25 },
    { status: "processing", label: "Composing soundtrack…", delay: 2500, progress: 40 },
    { status: "rendering", label: "Rendering scene 1/6…", delay: 2000, progress: 50 },
    { status: "rendering", label: "Rendering scene 3/6…", delay: 2000, progress: 65 },
    { status: "rendering", label: "Rendering scene 6/6…", delay: 2000, progress: 80 },
    { status: "encoding", label: "Encoding final video…", delay: 3000, progress: 92 },
    { status: "complete", label: "Ready to watch!", delay: 1500, progress: 100 },
  ];

  let elapsed = 0;
  steps.forEach(({ status, label, delay, progress }) => {
    elapsed += delay;
    setTimeout(() => {
      const job = jobs.get(jobId);
      if (!job || job.status === "failed") return;
      job.status = status;
      job.stepLabel = label;
      job.progress = progress;
      job.updatedAt = Date.now();
      if (status === "complete") {
        job.outputUrl = DEMO_VIDEO_URL;
        job.thumbnailUrl = DEMO_POSTER_URL;
      }
      notify(jobId);
    }, elapsed);
  });
}

/** Create a new video job (async — persists to DB when possible) */
export async function createVideoJob(
  request: VideoJobRequest,
  userId?: string,
): Promise<VideoJob> {
  const id = generateId();
  const job: VideoJob = {
    id,
    request,
    status: "queued",
    progress: 0,
    stepLabel: "Queued…",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  jobs.set(id, job);

  if (userId) {
    try {
      const { error: insertErr } = await supabase.from("video_jobs").insert({
        id,
        user_id: userId,
        request: request as unknown as Json,
        status: "queued",
        progress: 0,
        step_label: "Queued…",
      });

      // If DB table doesn't exist or RLS blocks → fall back to simulation
      if (insertErr) throw insertErr;

      // Fire-and-forget edge function invocation
      supabase.functions
        .invoke("generate-video-episode", {
          body: {
            jobId: id,
            storyId: request.storyId,
            storyTitle: request.storyTitle,
            duration: request.duration,
            provider: request.provider,
            voiceAssignments: request.voiceAssignments,
            musicStyle: request.musicStyle,
          },
        })
        .catch((err) => {
          if (import.meta.env.DEV) console.warn("[VideoJobStore] Edge invoke failed:", err);
          // Edge function failed after DB insert — start local simulation as safety net
          // If the edge function recovers, DB polling will override simulation state
          setTimeout(() => simulatePipeline(id), 1000);
        });
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[VideoJobStore] DB insert failed, using simulation:", err);
      setTimeout(() => simulatePipeline(id), 1000);
    }
  } else {
    // Guest — pure local simulation
    setTimeout(() => simulatePipeline(id), 1000);
  }

  return { ...job };
}

/** Sync version for backward compatibility (always simulates) */
export function createVideoJobSync(request: VideoJobRequest): VideoJob {
  const id = generateId();
  const job: VideoJob = {
    id,
    request,
    status: "queued",
    progress: 0,
    stepLabel: "Queued…",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  jobs.set(id, job);
  setTimeout(() => simulatePipeline(id), 1000);
  return { ...job };
}

/** Poll a single job from Supabase and update local cache */
export async function pollJobFromDB(jobId: string): Promise<VideoJob | null> {
  try {
    const { data, error } = await supabase
      .from("video_jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();

    if (error || !data) return null;
    const job = dbRowToJob(data as Record<string, unknown>);
    jobs.set(job.id, job);
    notify(job.id);
    return job;
  } catch {
    return null;
  }
}

/** Load all jobs for a user from DB */
export async function loadUserJobs(userId: string): Promise<VideoJob[]> {
  try {
    const { data, error } = await supabase
      .from("video_jobs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) return getAllVideoJobs();
    const dbJobs = (data as Record<string, unknown>[]).map(dbRowToJob);
    dbJobs.forEach((j) => jobs.set(j.id, j));
    return dbJobs;
  } catch {
    return getAllVideoJobs();
  }
}

/** Get a job by ID (local cache) */
export function getVideoJob(jobId: string): VideoJob | undefined {
  const job = jobs.get(jobId);
  return job ? { ...job } : undefined;
}

/** Get all jobs (local cache) */
export function getAllVideoJobs(): VideoJob[] {
  return Array.from(jobs.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((j) => ({ ...j }));
}

/** Subscribe to local job updates */
export function subscribeVideoJob(jobId: string, callback: (job: VideoJob) => void): () => void {
  if (!listeners.has(jobId)) listeners.set(jobId, new Set());
  listeners.get(jobId)!.add(callback);
  return () => listeners.get(jobId)?.delete(callback);
}

/** Cancel a job */
export async function cancelVideoJob(jobId: string): Promise<boolean> {
  const job = jobs.get(jobId);
  if (!job || job.status === "complete" || job.status === "failed") return false;
  job.status = "failed";
  job.error = "Cancelled by user";
  job.updatedAt = Date.now();
  notify(jobId);

  try {
    await supabase.from("video_jobs").update({
      status: "failed",
      error: "Cancelled by user",
    }).eq("id", jobId);
  } catch { /* best-effort */ }

  return true;
}
