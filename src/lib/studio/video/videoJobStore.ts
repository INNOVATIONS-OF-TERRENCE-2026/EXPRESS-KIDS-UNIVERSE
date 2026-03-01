/**
 * videoJobStore.ts — In-memory video job store with simulated pipeline.
 *
 * Manages video generation jobs locally. In production, jobs would be
 * dispatched to Supabase Edge Functions / cloud workers. The local
 * store provides an immediate feedback loop for the UI.
 */

import type { VideoJob, VideoJobRequest, VideoJobStatus } from "./videoJobTypes";

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

/** Simulate the video pipeline progression */
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
        job.outputUrl = `https://placeholder.eku.video/${jobId}.mp4`;
        job.thumbnailUrl = `https://placeholder.eku.video/${jobId}_thumb.jpg`;
      }
      notify(jobId);
    }, elapsed);
  });
}

/** Create a new video job */
export function createVideoJob(request: VideoJobRequest): VideoJob {
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

  // Start simulated pipeline after a brief queue delay
  setTimeout(() => simulatePipeline(id), 1000);

  return { ...job };
}

/** Get a job by ID */
export function getVideoJob(jobId: string): VideoJob | undefined {
  const job = jobs.get(jobId);
  return job ? { ...job } : undefined;
}

/** Get all jobs */
export function getAllVideoJobs(): VideoJob[] {
  return Array.from(jobs.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((j) => ({ ...j }));
}

/** Subscribe to job updates */
export function subscribeVideoJob(jobId: string, callback: (job: VideoJob) => void): () => void {
  if (!listeners.has(jobId)) listeners.set(jobId, new Set());
  listeners.get(jobId)!.add(callback);
  return () => listeners.get(jobId)?.delete(callback);
}

/** Cancel a job */
export function cancelVideoJob(jobId: string): boolean {
  const job = jobs.get(jobId);
  if (!job || job.status === "complete" || job.status === "failed") return false;
  job.status = "failed";
  job.error = "Cancelled by user";
  job.updatedAt = Date.now();
  notify(jobId);
  return true;
}
