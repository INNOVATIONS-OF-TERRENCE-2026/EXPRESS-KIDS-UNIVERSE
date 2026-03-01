/**
 * galleryService.ts — Gallery CRUD for video items (Supabase + localStorage fallback).
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { VideoJob } from "@/lib/studio/video/videoJobTypes";
import { DURATION_SEC } from "@/lib/studio/video/videoJobTypes";

/* ── Types ── */
export interface GalleryVideoItem {
  id: string;
  user_id: string;
  type: "video";
  source: string;
  job_id: string;
  adventure_id?: string;
  title: string;
  description?: string;
  output_url: string;
  poster_url?: string;
  duration_seconds?: number;
  status: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

const LOCAL_VIDEO_GALLERY_KEY = "eku_video_gallery";

/* ── Save a completed video job to gallery ── */
export async function saveVideoToGallery(
  job: VideoJob,
  userId?: string,
): Promise<boolean> {
  if (!job.outputUrl) return false;

  if (userId) {
    try {
      // Dedup check
      const { data: existing } = await supabase
        .from("gallery_items")
        .select("id")
        .eq("job_id", job.id)
        .maybeSingle();

      if (existing) return true; // Already saved

      const { error } = await supabase.from("gallery_items").insert({
        user_id: userId,
        type: "video",
        source: "video_studio",
        job_id: job.id,
        adventure_id: job.request.storyId,
        title: job.request.storyTitle || "Untitled Video",
        output_url: job.outputUrl,
        poster_url: job.thumbnailUrl,
        duration_seconds: DURATION_SEC[job.request.duration] ?? 120,
        status: "ready",
        metadata: {
          provider: job.request.provider,
          musicStyle: job.request.musicStyle,
        } as unknown as Json,
      });

      if (error) {
        if (import.meta.env.DEV) console.warn("[GalleryService] Insert error:", error);
        saveVideoToLocalGallery(job);
        return false;
      }
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[GalleryService] Supabase error:", err);
      saveVideoToLocalGallery(job);
      return false;
    }
  } else {
    saveVideoToLocalGallery(job);
    return true;
  }
}

/* ── Check if already saved ── */
export async function isVideoSaved(jobId: string, userId?: string): Promise<boolean> {
  if (userId) {
    try {
      const { data } = await supabase
        .from("gallery_items")
        .select("id")
        .eq("job_id", jobId)
        .maybeSingle();
      return !!data;
    } catch {
      return isVideoSavedLocally(jobId);
    }
  }
  return isVideoSavedLocally(jobId);
}

/* ── Fetch gallery videos for user ── */
export async function getGalleryVideos(userId: string): Promise<GalleryVideoItem[]> {
  try {
    const { data, error } = await supabase
      .from("gallery_items")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "video")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return (data ?? []) as unknown as GalleryVideoItem[];
  } catch {
    return getLocalVideoGallery();
  }
}

/* ── Delete gallery item ── */
export async function deleteGalleryItem(id: string): Promise<boolean> {
  // Local items (starts with "local_") — only in localStorage
  if (id.startsWith("local_")) {
    return deleteLocalGalleryItem(id);
  }
  try {
    const { error } = await supabase.from("gallery_items").delete().eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

/* ── Local fallback storage ── */
function getLocalVideoGallery(): GalleryVideoItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_VIDEO_GALLERY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveVideoToLocalGallery(job: VideoJob) {
  const items = getLocalVideoGallery();
  if (items.find((i) => i.job_id === job.id)) return;
  items.unshift({
    id: `local_${job.id}`,
    user_id: "guest",
    type: "video",
    source: "video_studio",
    job_id: job.id,
    adventure_id: job.request.storyId,
    title: job.request.storyTitle || "Untitled Video",
    output_url: job.outputUrl!,
    poster_url: job.thumbnailUrl,
    duration_seconds: DURATION_SEC[job.request.duration] ?? 120,
    status: "ready",
    created_at: new Date().toISOString(),
  });
  try {
    localStorage.setItem(LOCAL_VIDEO_GALLERY_KEY, JSON.stringify(items.slice(0, 100)));
  } catch { /* quota exceeded — ignore */ }
}

function isVideoSavedLocally(jobId: string): boolean {
  return getLocalVideoGallery().some((i) => i.job_id === jobId);
}

function deleteLocalGalleryItem(id: string): boolean {
  try {
    const items = getLocalVideoGallery();
    const filtered = items.filter((i) => i.id !== id);
    if (filtered.length === items.length) return false; // not found
    localStorage.setItem(LOCAL_VIDEO_GALLERY_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}
