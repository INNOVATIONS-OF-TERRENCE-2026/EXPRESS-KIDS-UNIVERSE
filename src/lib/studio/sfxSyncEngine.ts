/**
 * sfxSyncEngine.ts — SFX Timestamp Alignment Engine
 *
 * Detects keywords in narration text, maps them to SFX identifiers,
 * and produces precisely timed SFX cue sheets:
 *   - Keyword detection from script analysis
 *   - 80–120ms pre-roll alignment (SFX slightly leads the word)
 *   - Anti-overlap protection (prevents distortion from stacking)
 *   - Auto-normalization of SFX loudness relative to narration
 *
 * Outputs a flat array of SFX cues per scene that the renderer
 * can schedule onto AudioContext at compose time.
 */

import type { PacingMode } from "./timelineOrchestrator";

/* ── Types ── */

export interface SfxCue {
  /** Unique cue identifier */
  id: string;
  /** SFX asset identifier (maps to asset library) */
  sfxId: string;
  /** Human-readable SFX name */
  sfxName: string;
  /** Timestamp in seconds (scene-relative) */
  timestamp: number;
  /** Volume 0–1 (normalized) */
  volume: number;
  /** Fade-in duration in seconds */
  fadeIn: number;
  /** Fade-out duration in seconds */
  fadeOut: number;
  /** The keyword that triggered this SFX */
  triggerKeyword: string;
  /** Word position in narration (0-based index) */
  wordIndex: number;
}

export interface SfxAnalysisInput {
  sceneId: string;
  narrationText: string;
  narrationDuration: number;
  emotion: string;
}

export interface SceneSfxSheet {
  sceneId: string;
  cues: SfxCue[];
}

/* ── SFX Keyword Dictionary ── */

interface SfxMapping {
  sfxId: string;
  sfxName: string;
  /** Base volume 0–1 */
  volume: number;
  /** Fade in/out durations */
  fadeIn: number;
  fadeOut: number;
  /** SFX asset duration (approx) for overlap prevention */
  durationSec: number;
}

/**
 * Keyword → SFX mapping dictionary.
 * Keywords are matched case-insensitively as whole words.
 */
const SFX_DICTIONARY: Record<string, SfxMapping> = {
  // Impact sounds
  boom:      { sfxId: "sfx_boom",       sfxName: "Boom",          volume: 0.70, fadeIn: 0.02, fadeOut: 0.15, durationSec: 1.2 },
  crash:     { sfxId: "sfx_crash",      sfxName: "Crash",         volume: 0.65, fadeIn: 0.02, fadeOut: 0.20, durationSec: 1.5 },
  bang:      { sfxId: "sfx_bang",       sfxName: "Bang",          volume: 0.60, fadeIn: 0.01, fadeOut: 0.10, durationSec: 0.8 },
  slam:      { sfxId: "sfx_slam",       sfxName: "Door Slam",     volume: 0.55, fadeIn: 0.01, fadeOut: 0.12, durationSec: 0.6 },
  thunder:   { sfxId: "sfx_thunder",    sfxName: "Thunder",       volume: 0.75, fadeIn: 0.05, fadeOut: 0.30, durationSec: 2.0 },
  explosion: { sfxId: "sfx_explosion",  sfxName: "Explosion",     volume: 0.80, fadeIn: 0.02, fadeOut: 0.25, durationSec: 1.8 },

  // Character sounds
  laugh:     { sfxId: "sfx_laugh",      sfxName: "Laughter",      volume: 0.45, fadeIn: 0.05, fadeOut: 0.10, durationSec: 1.0 },
  giggle:    { sfxId: "sfx_giggle",     sfxName: "Giggle",        volume: 0.40, fadeIn: 0.03, fadeOut: 0.08, durationSec: 0.7 },
  whisper:   { sfxId: "sfx_whisper",    sfxName: "Whisper",       volume: 0.30, fadeIn: 0.10, fadeOut: 0.15, durationSec: 0.8 },
  gasp:      { sfxId: "sfx_gasp",       sfxName: "Gasp",          volume: 0.40, fadeIn: 0.02, fadeOut: 0.05, durationSec: 0.4 },
  scream:    { sfxId: "sfx_scream",     sfxName: "Scream",        volume: 0.55, fadeIn: 0.01, fadeOut: 0.10, durationSec: 1.0 },
  cry:       { sfxId: "sfx_cry",        sfxName: "Crying",        volume: 0.35, fadeIn: 0.08, fadeOut: 0.15, durationSec: 1.5 },
  cheer:     { sfxId: "sfx_cheer",      sfxName: "Cheering",      volume: 0.50, fadeIn: 0.05, fadeOut: 0.15, durationSec: 1.2 },

  // Nature sounds
  splash:    { sfxId: "sfx_splash",     sfxName: "Splash",        volume: 0.50, fadeIn: 0.02, fadeOut: 0.15, durationSec: 0.8 },
  wind:      { sfxId: "sfx_wind",       sfxName: "Wind",          volume: 0.35, fadeIn: 0.20, fadeOut: 0.30, durationSec: 2.5 },
  rain:      { sfxId: "sfx_rain",       sfxName: "Rain",          volume: 0.30, fadeIn: 0.30, fadeOut: 0.40, durationSec: 3.0 },
  birds:     { sfxId: "sfx_birds",      sfxName: "Birds",         volume: 0.25, fadeIn: 0.15, fadeOut: 0.20, durationSec: 2.0 },
  ocean:     { sfxId: "sfx_ocean",      sfxName: "Ocean Waves",   volume: 0.30, fadeIn: 0.25, fadeOut: 0.30, durationSec: 3.0 },
  roar:      { sfxId: "sfx_roar",       sfxName: "Roar",          volume: 0.65, fadeIn: 0.03, fadeOut: 0.20, durationSec: 1.5 },

  // Object sounds
  door:      { sfxId: "sfx_door",       sfxName: "Door",          volume: 0.40, fadeIn: 0.02, fadeOut: 0.08, durationSec: 0.5 },
  bell:      { sfxId: "sfx_bell",       sfxName: "Bell",          volume: 0.45, fadeIn: 0.01, fadeOut: 0.15, durationSec: 1.0 },
  knock:     { sfxId: "sfx_knock",      sfxName: "Knock",         volume: 0.40, fadeIn: 0.01, fadeOut: 0.05, durationSec: 0.4 },
  whoosh:    { sfxId: "sfx_whoosh",     sfxName: "Whoosh",        volume: 0.45, fadeIn: 0.02, fadeOut: 0.10, durationSec: 0.6 },
  sparkle:   { sfxId: "sfx_sparkle",    sfxName: "Sparkle Magic", volume: 0.40, fadeIn: 0.05, fadeOut: 0.20, durationSec: 1.2 },
  magic:     { sfxId: "sfx_magic",      sfxName: "Magic Spell",   volume: 0.50, fadeIn: 0.08, fadeOut: 0.25, durationSec: 1.5 },

  // Music-adjacent
  trumpet:   { sfxId: "sfx_fanfare",    sfxName: "Fanfare",       volume: 0.50, fadeIn: 0.03, fadeOut: 0.20, durationSec: 1.5 },
  drum:      { sfxId: "sfx_drum",       sfxName: "Drum Hit",      volume: 0.50, fadeIn: 0.01, fadeOut: 0.10, durationSec: 0.6 },

  // Action
  sword:     { sfxId: "sfx_sword",      sfxName: "Sword",         volume: 0.50, fadeIn: 0.01, fadeOut: 0.08, durationSec: 0.5 },
  arrow:     { sfxId: "sfx_arrow",      sfxName: "Arrow",         volume: 0.45, fadeIn: 0.01, fadeOut: 0.10, durationSec: 0.6 },
  footsteps: { sfxId: "sfx_footsteps",  sfxName: "Footsteps",     volume: 0.30, fadeIn: 0.05, fadeOut: 0.10, durationSec: 1.5 },
  running:   { sfxId: "sfx_running",    sfxName: "Running",       volume: 0.35, fadeIn: 0.05, fadeOut: 0.10, durationSec: 2.0 },
};

/** All keywords as a regex pattern (precompiled) */
const KEYWORD_REGEX = new RegExp(
  `\\b(${Object.keys(SFX_DICTIONARY).join("|")})\\b`,
  "gi",
);

/** Pre-roll offset: SFX plays 80–120ms BEFORE the word is spoken */
const PRE_ROLL_MIN_MS = 80;
const PRE_ROLL_MAX_MS = 120;

/** Minimum gap between SFX cues to prevent overlap distortion */
const MIN_GAP_SEC = 0.3;

/** SFX density multiplier per pacing mode */
const DENSITY_MULTIPLIER: Record<PacingMode, number> = {
  story:       1.0,
  action:      1.3,  // more SFX
  documentary: 0.6,  // fewer SFX
  kids:        1.2,  // slightly more (fun)
};

/* ── Core Functions ── */

/**
 * Analyze narration text and detect keyword-triggered SFX cues.
 *
 * Each detected keyword is mapped to a timestamp based on its
 * word position proportionally within the narration duration.
 */
export function analyzeSceneSfx(
  input: SfxAnalysisInput,
  pacingMode: PacingMode = "story",
): SceneSfxSheet {
  const { sceneId, narrationText, narrationDuration, emotion } = input;

  if (!narrationText || narrationDuration <= 0) {
    return { sceneId, cues: [] };
  }

  const words = narrationText.split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  if (totalWords === 0) return { sceneId, cues: [] };

  // Find all keyword matches with their word positions
  const rawCues: Array<{
    keyword: string;
    wordIndex: number;
    mapping: SfxMapping;
  }> = [];

  for (let i = 0; i < words.length; i++) {
    const clean = words[i].toLowerCase().replace(/[^a-z]/g, "");
    if (SFX_DICTIONARY[clean]) {
      rawCues.push({
        keyword: clean,
        wordIndex: i,
        mapping: SFX_DICTIONARY[clean],
      });
    }
  }

  // Apply density filtering based on pacing mode
  const density = DENSITY_MULTIPLIER[pacingMode] ?? 1.0;
  const maxCues = Math.max(1, Math.round(rawCues.length * density));
  const filteredCues = rawCues.slice(0, maxCues);

  // Convert word positions to timestamps with pre-roll
  const cues: SfxCue[] = [];
  let lastCueEnd = -Infinity;

  for (const raw of filteredCues) {
    // Proportional timestamp from word position
    const wordProportion = raw.wordIndex / totalWords;
    const wordTimestamp = wordProportion * narrationDuration;

    // Apply pre-roll (80–120ms before the word)
    const preRollSec = randomPreRoll() / 1000;
    const timestamp = Math.max(0, wordTimestamp - preRollSec);

    // Anti-overlap: skip if too close to previous SFX
    if (timestamp < lastCueEnd + MIN_GAP_SEC) continue;

    // Normalize volume based on emotion intensity
    const emotionBoost = emotion === "action" || emotion === "dramatic" ? 1.15 : 1.0;
    const volume = Math.min(1, raw.mapping.volume * emotionBoost);

    const cue: SfxCue = {
      id: `${sceneId}_sfx_${cues.length}`,
      sfxId: raw.mapping.sfxId,
      sfxName: raw.mapping.sfxName,
      timestamp: Math.round(timestamp * 1000) / 1000,
      volume: Math.round(volume * 100) / 100,
      fadeIn: raw.mapping.fadeIn,
      fadeOut: raw.mapping.fadeOut,
      triggerKeyword: raw.keyword,
      wordIndex: raw.wordIndex,
    };

    cues.push(cue);
    lastCueEnd = timestamp + raw.mapping.durationSec;
  }

  return { sceneId, cues };
}

/**
 * Analyze SFX for all scenes in an episode.
 */
export function analyzeEpisodeSfx(
  scenes: SfxAnalysisInput[],
  pacingMode: PacingMode = "story",
): SceneSfxSheet[] {
  return scenes.map((s) => analyzeSceneSfx(s, pacingMode));
}

/**
 * Get the full SFX keyword dictionary (for UI display or asset loading).
 */
export function getSfxDictionary(): Record<string, SfxMapping> {
  return { ...SFX_DICTIONARY };
}

/* ── Helpers ── */

/** Random pre-roll between 80–120ms */
function randomPreRoll(): number {
  return PRE_ROLL_MIN_MS + Math.random() * (PRE_ROLL_MAX_MS - PRE_ROLL_MIN_MS);
}
