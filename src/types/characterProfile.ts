/**
 * characterProfile.ts — Persistent child character profile types
 *
 * Each child profile captures identity, personality, and preferences for:
 *   - Character consistency across episodes
 *   - Voice personalization
 *   - Animation continuity
 *   - Theme-aware content generation
 */

/** Age range bracket for content calibration */
export type AgeRange = "3-5" | "6-8" | "9-12";

/** Voice style preference for TTS personalization */
export type VoiceStyle = "warm" | "playful" | "adventurous" | "calm" | "energetic";

/** Personality attribute with 0-100 intensity */
export interface PersonalityAttributes {
  brave: number;
  curious: number;
  funny: number;
  kind: number;
  adventurous: number;
  creative: number;
  shy: number;
}

/** Avatar selection for visual identity */
export interface AvatarConfig {
  /** One of the preset avatar IDs or custom uploaded URL */
  id: string;
  /** Skin tone (for future avatar rendering) */
  skinTone?: string;
  /** Hair style token */
  hairStyle?: string;
  /** Accessory token (hat, glasses, etc.) */
  accessory?: string;
}

/** Core child profile for the platform */
export interface CharacterProfile {
  /** Unique identifier */
  id: string;
  /** Child's display name */
  name: string;
  /** Avatar configuration */
  avatar: AvatarConfig;
  /** Age range bracket */
  ageRange: AgeRange;
  /** Personality attributes (0-100 each) */
  personality: PersonalityAttributes;
  /** Favorite themes for story generation */
  favoriteThemes: string[];
  /** Preferred voice style for TTS */
  voiceStyle: VoiceStyle;
  /** Preferred pronouns */
  pronouns: "he/him" | "she/her" | "they/them";
  /** Interests / keywords for content personalization */
  interests: string[];
  /** Profile creation timestamp */
  createdAt: number;
  /** Last updated timestamp */
  updatedAt: number;
}

/** Minimal profile for creation wizard */
export type CharacterProfileDraft = Partial<CharacterProfile> & {
  name: string;
};

/** Default personality for new profiles */
export const DEFAULT_PERSONALITY: PersonalityAttributes = {
  brave: 60,
  curious: 70,
  funny: 50,
  kind: 80,
  adventurous: 65,
  creative: 60,
  shy: 30,
};

/** Default avatar for new profiles */
export const DEFAULT_AVATAR: AvatarConfig = {
  id: "default-star",
};
