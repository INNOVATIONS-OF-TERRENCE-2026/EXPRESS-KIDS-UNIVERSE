import { ChildProfile, StoryResult } from "./jobStore";

const DRAFT_KEY = "eku_child_profile_draft";
const GALLERY_KEY = "eku_gallery";
const SETTINGS_KEY = "eku_parent_settings";

// Wizard draft persistence
export function saveDraft(profile: Partial<ChildProfile>): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(profile));
}

export function loadDraft(): Partial<ChildProfile> | null {
  const data = localStorage.getItem(DRAFT_KEY);
  return data ? JSON.parse(data) : null;
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}

// Gallery persistence
export interface GalleryItem {
  jobId: string;
  title: string;
  tagline?: string;
  theme: string;
  childName: string;
  readingLevel: string;
  result: StoryResult;
  createdAt: number;
}

export function getGallery(): GalleryItem[] {
  const data = localStorage.getItem(GALLERY_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveToGallery(item: GalleryItem): void {
  const gallery = getGallery();
  const exists = gallery.find(g => g.jobId === item.jobId);
  if (!exists) {
    gallery.unshift(item);
    localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
  }
}

export function removeFromGallery(jobId: string): void {
  const gallery = getGallery().filter(g => g.jobId !== jobId);
  localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
}

// Parent settings
export interface ParentSettings {
  soundEnabled: boolean;
  reducedMotion: boolean;
  allowSaving: boolean;
  contentFilter: "gentle" | "standard";
}

export function getParentSettings(): ParentSettings {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : {
    soundEnabled: false,
    reducedMotion: false,
    allowSaving: true,
    contentFilter: "gentle",
  };
}

export function saveParentSettings(settings: ParentSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}