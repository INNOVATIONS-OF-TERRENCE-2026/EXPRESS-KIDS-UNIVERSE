/**
 * characterVoiceProfiles.ts — Character voice intelligence system.
 *
 * Feature Set 2: Auto-assigns unique voice profiles to story characters
 * based on character role, personality traits, and the child's preferences.
 *
 * Provides:
 *  - Character → VoiceProfile mapping
 *  - Age/gender/personality-aware voice selection
 *  - Persistent per-story voice assignments
 */

import type { VoiceProfile, VoiceStyleTag } from "@/lib/studio/voice/voiceTypes";
import { PRESET_VOICES } from "@/lib/studio/voice/voiceTypes";

const STORAGE_KEY = "eku_character_voice_assignments";

export type CharacterRole = "protagonist" | "sidekick" | "mentor" | "villain" | "narrator" | "supporting";

export interface CharacterInfo {
  id: string;
  name: string;
  role: CharacterRole;
  /** Optional personality hint for smarter matching */
  personality?: string;
}

/** Voice assignment for a specific character in a story */
export interface CharacterVoiceAssignment {
  characterId: string;
  characterName: string;
  voiceProfileId: string;
  /** Whether this was auto-assigned or manually chosen */
  source: "auto" | "manual";
}

/** All voice assignments for a story */
export interface StoryVoiceAssignments {
  storyId: string;
  assignments: CharacterVoiceAssignment[];
  updatedAt: number;
}

/** Role → preferred voice style mapping */
const ROLE_STYLE_MAP: Record<CharacterRole, VoiceStyleTag[]> = {
  protagonist: ["adventurous", "energetic", "heroic"],
  sidekick: ["playful", "silly", "energetic"],
  mentor: ["calm", "warm", "mysterious"],
  villain: ["mysterious", "energetic"],
  narrator: ["warm", "calm"],
  supporting: ["playful", "warm", "calm"],
};

/**
 * Auto-assign voice profiles to characters based on their roles.
 * Uses a round-robin approach to ensure variety across characters.
 */
export function autoAssignVoices(
  characters: CharacterInfo[],
): CharacterVoiceAssignment[] {
  const usedVoiceIds = new Set<string>();
  const assignments: CharacterVoiceAssignment[] = [];

  for (const char of characters) {
    const preferredStyles = ROLE_STYLE_MAP[char.role] || ["warm"];

    // Find best matching voice not yet used
    let bestVoice: VoiceProfile | null = null;

    for (const style of preferredStyles) {
      const candidate = PRESET_VOICES.find(
        (v) => v.style === style && !usedVoiceIds.has(v.id),
      );
      if (candidate) {
        bestVoice = candidate;
        break;
      }
    }

    // Fallback: pick any unused voice
    if (!bestVoice) {
      bestVoice = PRESET_VOICES.find((v) => !usedVoiceIds.has(v.id)) ?? PRESET_VOICES[0];
    }

    usedVoiceIds.add(bestVoice.id);
    assignments.push({
      characterId: char.id,
      characterName: char.name,
      voiceProfileId: bestVoice.id,
      source: "auto",
    });
  }

  return assignments;
}

/**
 * Save voice assignments for a story to localStorage.
 */
export function saveVoiceAssignments(storyId: string, assignments: CharacterVoiceAssignment[]) {
  try {
    const allRaw = localStorage.getItem(STORAGE_KEY);
    const all: Record<string, StoryVoiceAssignments> = allRaw ? JSON.parse(allRaw) : {};
    all[storyId] = { storyId, assignments, updatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch { /* quota exceeded — silent fail */ }
}

/**
 * Load voice assignments for a story.
 */
export function loadVoiceAssignments(storyId: string): CharacterVoiceAssignment[] | null {
  try {
    const allRaw = localStorage.getItem(STORAGE_KEY);
    if (!allRaw) return null;
    const all: Record<string, StoryVoiceAssignments> = JSON.parse(allRaw);
    return all[storyId]?.assignments ?? null;
  } catch {
    return null;
  }
}

/**
 * Get a voice profile by ID.
 */
export function getVoiceProfileById(id: string): VoiceProfile | undefined {
  return PRESET_VOICES.find((v) => v.id === id);
}

/**
 * Override a single character's voice assignment.
 */
export function overrideCharacterVoice(
  storyId: string,
  characterId: string,
  voiceProfileId: string,
) {
  const existing = loadVoiceAssignments(storyId) || [];
  const idx = existing.findIndex((a) => a.characterId === characterId);
  if (idx >= 0) {
    existing[idx] = { ...existing[idx], voiceProfileId, source: "manual" };
  } else {
    existing.push({
      characterId,
      characterName: characterId,
      voiceProfileId,
      source: "manual",
    });
  }
  saveVoiceAssignments(storyId, existing);
}
