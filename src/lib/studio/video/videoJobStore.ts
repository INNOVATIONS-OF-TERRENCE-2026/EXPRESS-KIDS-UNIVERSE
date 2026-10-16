/**
 * videoJobStore.ts — Persistent video job store with Supabase backend + local fallback.
 *
 * When Supabase is available and user is authenticated:
 *   - Jobs are persisted to the video_jobs table
 *   - Edge function is invoked for real pipeline processing
 *   - Polling reads status from DB
 *
 * On failure: show an explicit error; never substitute an unrelated demo video.
 */

import type { VideoJob, VideoJobRequest, VideoJobStatus } from "./videoJobTypes";
import type { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

/* ── In-memory store (cache + fallback) ── */
const jobs = new Map<string, VideoJob>();
const listeners = new Map<string, Set<(job: VideoJob) => void>>();

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

/** Fail visibly; do not manufacture a completed video. */
function markJobFailed(jobId: string, message: string) {
  const job = jobs.get(jobId);
  if (!job || job.status === "complete" || job.status === "failed") return;
  job.status = "failed";
  job.error = message;
  job.stepLabel = "Generation failed";
  job.updatedAt = Date.now();
  notify(jobId);
}

/** Handle invocation errors without clobbering a server job already in progress. */
async function handleInvocationFailure(jobId: string, userId: string) {
  const message = "Unable to start video generation. Please try again.";
  try {
    const latest = await pollJobFromDB(jobId);
    if (latest && latest.status !== "queued") return;

    const { data: updated, error } = await supabase.from("video_jobs")
      .update({ status: "failed", error: message, step_label: "Generation failed" })
      .eq("id", jobId)
      .eq("user_id", userId)
      .eq("status", "queued")
      .select("id")
      .maybeSingle();

    if (updated || error) markJobFailed(jobId, message);
    else await pollJobFromDB(jobId);
  } catch {
    markJobFailed(jobId, message);
  }
}

/** Create a real video job, or return an explicit failure. */
export async function createVideoJob(
  request: VideoJobRequest,
  userId?: string,
): Promise<VideoJob> {
  const id = generateId();
  const job: VideoJob = {
    id, request, status: "queued", progress: 0, stepLabel: "Queued…",
    createdAt: Date.now(), updatedAt: Date.now(),
  };
  jobs.set(id, job);

  if (!userId) {
    markJobFailed(id, "Sign in to generate a personalized episode.");
    return { ...job };
  }

  try {
    const { error: insertErr } = await supabase.from("video_jobs").insert({
      id,
      user_id: userId,
      request: request as unknown as Json,
      status: "queued",
      progress: 0,
      step_label: "Queued…",
    });
    if (insertErr) throw insertErr;
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[VideoJobStore] DB insert failed:", err);
    markJobFailed(id, "Unable to queue video generation. Please try again.");
    return { ...job };
  }

  // Both a rejected promise and FunctionsResponse.error are failures.
  // Do not block the UI while the backend creates the composition.
  void supabase.functions.invoke("generate-video-episode", {
    body: {
      jobId: id,
      storyId: request.storyId,
      storyTitle: request.storyTitle,
      duration: request.duration,
      provider: request.provider,
      voiceAssignments: request.voiceAssignments,
      musicStyle: request.musicStyle,
      pacingMode: request.pacingMode || "story",
      budgetMode: request.budgetMode || "standard",
    },
  }).then(({ error }) => {
    if (error) return handleInvocationFailure(id, userId);
  }).catch((err) => {
    if (import.meta.env.DEV) console.warn("[VideoJobStore] Edge invoke failed:", err);
    return handleInvocationFailure(id, userId);
  });

  return { ...job };
}

/** Legacy synchronous entry point: no fake guest videos. */
export function createVideoJobSync(request: VideoJobRequest): VideoJob {
  const id = generateId();
  const job: VideoJob = {
    id, request, status: "failed", progress: 0,
    stepLabel: "Generation failed",
    error: "Sign in to generate a personalized episode.",
    createdAt: Date.now(), updatedAt: Date.now(),
  };
  jobs.set(id, job);
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
