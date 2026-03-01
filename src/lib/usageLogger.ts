/**
 * usageLogger.ts — Usage analytics and event logging.
 *
 * Feature Set 8: Tracks user interactions for analytics dashboard.
 * All data stays local (localStorage) — no external analytics services.
 *
 * Events tracked:
 *  - Story creation
 *  - Voice playback
 *  - Video generation
 *  - Theme change
 *  - Scene image generation
 *  - Session duration
 */

const STORAGE_KEY = "eku_usage_log";
const MAX_ENTRIES = 500;

export type EventType =
  | "story_created"
  | "story_viewed"
  | "voice_played"
  | "voice_profile_changed"
  | "video_job_started"
  | "video_job_completed"
  | "scene_image_generated"
  | "scene_edited"
  | "theme_changed"
  | "session_started"
  | "session_ended"
  | "pwa_installed"
  | "upgrade_clicked";

export interface UsageEvent {
  id: string;
  type: EventType;
  /** ISO timestamp */
  timestamp: string;
  /** Arbitrary metadata */
  meta?: Record<string, string | number | boolean>;
}

/** Log a usage event */
export function logEvent(type: EventType, meta?: Record<string, string | number | boolean>) {
  try {
    const events = loadEvents();
    const event: UsageEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      timestamp: new Date().toISOString(),
      meta,
    };
    events.push(event);
    // Keep only recent entries
    const trimmed = events.slice(-MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch { /* quota exceeded — silent */ }
}

/** Load all logged events */
export function loadEvents(): UsageEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Get events of a specific type */
export function getEventsByType(type: EventType): UsageEvent[] {
  return loadEvents().filter((e) => e.type === type);
}

/** Get event count by type for a date range */
export function countEvents(type: EventType, sinceDate?: Date): number {
  const events = getEventsByType(type);
  if (!sinceDate) return events.length;
  const since = sinceDate.toISOString();
  return events.filter((e) => e.timestamp >= since).length;
}

/** Get daily usage summary for the last N days */
export function getDailySummary(days: number = 7): Array<{ date: string; count: number; types: Record<string, number> }> {
  const events = loadEvents();
  const summary: Record<string, { count: number; types: Record<string, number> }> = {};

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().split("T")[0];

  for (const event of events) {
    const date = event.timestamp.split("T")[0];
    if (date < startStr) continue;
    if (!summary[date]) summary[date] = { count: 0, types: {} };
    summary[date].count += 1;
    summary[date].types[event.type] = (summary[date].types[event.type] || 0) + 1;
  }

  const result: Array<{ date: string; count: number; types: Record<string, number> }> = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const dateStr = d.toISOString().split("T")[0];
    result.push({
      date: dateStr,
      count: summary[dateStr]?.count || 0,
      types: summary[dateStr]?.types || {},
    });
  }
  return result;
}

/** Clear all usage logs */
export function clearUsageLogs() {
  localStorage.removeItem(STORAGE_KEY);
}
