/**
 * profileEngine.ts — Character profile management system
 *
 * Provides CRUD operations for child character profiles stored in localStorage.
 * Profiles enable character consistency across episodes, voice personalization,
 * and animation continuity.
 */

import type {
  CharacterProfile,
  CharacterProfileDraft,
  PersonalityAttributes,
} from "@/types/characterProfile";
import { DEFAULT_PERSONALITY, DEFAULT_AVATAR } from "@/types/characterProfile";

const STORAGE_KEY = "eku_character_profiles";
const ACTIVE_KEY = "eku_active_profile";

function generateId(): string {
  return `prof_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

class ProfileEngine {
  /** Retrieve all saved profiles */
  getAll(): CharacterProfile[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /** Get a single profile by ID */
  getById(id: string): CharacterProfile | undefined {
    return this.getAll().find((p) => p.id === id);
  }

  /** Get the currently active profile */
  getActive(): CharacterProfile | undefined {
    const activeId = localStorage.getItem(ACTIVE_KEY);
    if (!activeId) return this.getAll()[0];
    return this.getById(activeId) ?? this.getAll()[0];
  }

  /** Set the active profile */
  setActive(id: string): void {
    localStorage.setItem(ACTIVE_KEY, id);
  }

  /** Create a new profile from a draft */
  create(draft: CharacterProfileDraft): CharacterProfile {
    const now = Date.now();
    const profile: CharacterProfile = {
      id: generateId(),
      name: draft.name,
      avatar: draft.avatar ?? DEFAULT_AVATAR,
      ageRange: draft.ageRange ?? "6-8",
      personality: draft.personality ?? DEFAULT_PERSONALITY,
      favoriteThemes: draft.favoriteThemes ?? [],
      voiceStyle: draft.voiceStyle ?? "playful",
      pronouns: draft.pronouns ?? "they/them",
      interests: draft.interests ?? [],
      createdAt: now,
      updatedAt: now,
    };

    const profiles = this.getAll();
    profiles.push(profile);
    this.save(profiles);

    // Auto-activate if first profile
    if (profiles.length === 1) {
      this.setActive(profile.id);
    }

    return profile;
  }

  /** Update an existing profile */
  update(id: string, patch: Partial<CharacterProfile>): CharacterProfile | undefined {
    const profiles = this.getAll();
    const idx = profiles.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;

    profiles[idx] = {
      ...profiles[idx],
      ...patch,
      id, // prevent accidental id change
      updatedAt: Date.now(),
    };
    this.save(profiles);
    return profiles[idx];
  }

  /** Delete a profile */
  delete(id: string): boolean {
    const profiles = this.getAll();
    const filtered = profiles.filter((p) => p.id !== id);
    if (filtered.length === profiles.length) return false;
    this.save(filtered);

    // Update active if deleted
    const activeId = localStorage.getItem(ACTIVE_KEY);
    if (activeId === id) {
      localStorage.removeItem(ACTIVE_KEY);
    }
    return true;
  }

  /** Get personality summary string for prompt generation */
  getPersonalitySummary(personality: PersonalityAttributes): string {
    const traits: string[] = [];
    if (personality.brave >= 70) traits.push("brave");
    if (personality.curious >= 70) traits.push("curious");
    if (personality.funny >= 70) traits.push("funny");
    if (personality.kind >= 70) traits.push("kind");
    if (personality.adventurous >= 70) traits.push("adventurous");
    if (personality.creative >= 70) traits.push("creative");
    if (personality.shy >= 70) traits.push("shy");
    return traits.length > 0 ? traits.join(", ") : "well-rounded";
  }

  /** Get the count of profiles */
  get count(): number {
    return this.getAll().length;
  }

  private save(profiles: CharacterProfile[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }
}

export const profileEngine = new ProfileEngine();
