/**
 * characterDNAEngine.ts — Character Consistency Engine (Multi-Episode Identity)
 *
 * Ensures characters look identical across:
 *   - Episodes within a season
 *   - Seasons within a series
 *   - Scenes within an episode
 *   - Camera angles and lighting conditions
 *
 * Stores a "Character DNA" profile that encodes:
 *   - Facial structure embedding (deterministic hash)
 *   - Color palette signature
 *   - Eye/hair/clothing descriptors
 *   - Animation style profile
 *   - Personality→visual traits mapping
 *   - Voice profile linkage
 *
 * Before every scene generation, the engine injects character identity
 * prompts to prevent drift. If a provider supports reference images,
 * it attaches the canonical character frame.
 *
 * No Character Drift Rule:
 *   If consistency score drops below threshold → auto-trigger regeneration.
 */

import type { AgeRange, CharacterProfile, AvatarConfig, PersonalityAttributes } from "@/types/characterProfile";

/* ── Types ── */

export interface CharacterDNA {
  /** Unique character identifier (matches CharacterProfile.id) */
  characterId: string;
  /** Display name */
  name: string;
  /** Deterministic facial structure hash (64-char hex) */
  facialStructureHash: string;
  /** Dominant color palette (hex values) */
  colorPalette: ColorPalette;
  /** Eye shape descriptor */
  eyeShape: EyeDescriptor;
  /** Hair style descriptor */
  hairStyle: HairDescriptor;
  /** Clothing signature */
  clothingSignature: ClothingDescriptor;
  /** Animation style profile */
  animationStyleProfile: AnimationStyle;
  /** Personality-to-visual traits mapping */
  personalityTraits: VisualPersonality;
  /** Linked voice profile ID */
  voiceProfileId: string | null;
  /** Canonical reference image URL (most consistent frame) */
  referenceImageUrl: string | null;
  /** Age range for age-appropriate rendering */
  ageRange: AgeRange;
  /** Schema version for migration */
  schemaVersion: number;
  /** Created timestamp */
  createdAt: number;
  /** Last updated timestamp */
  updatedAt: number;
}

export interface ColorPalette {
  /** Primary character color (e.g., shirt, main outfit) */
  primary: string;
  /** Secondary color (e.g., pants, accessory) */
  secondary: string;
  /** Skin tone */
  skin: string;
  /** Hair color */
  hair: string;
  /** Eye color */
  eyes: string;
  /** Accent color (e.g., belt, trim) */
  accent: string;
}

export interface EyeDescriptor {
  shape: "round" | "almond" | "wide" | "narrow" | "cartoon-large" | "sparkle";
  size: "small" | "medium" | "large" | "oversized";
  expression: "curious" | "cheerful" | "determined" | "dreamy" | "mischievous";
  color: string;
  /** Extra details (lashes, brow shape) */
  details: string;
}

export interface HairDescriptor {
  style: string; // "short curly brown", "long straight black", etc.
  color: string;
  length: "short" | "medium" | "long" | "bald";
  texture: "straight" | "wavy" | "curly" | "coily" | "braided";
  accessories: string[]; // "bow", "headband", "hat"
}

export interface ClothingDescriptor {
  /** Top garment */
  top: string;
  /** Bottom garment */
  bottom: string;
  /** Footwear */
  shoes: string;
  /** Accessories */
  accessories: string[];
  /** Signature item (always worn) */
  signatureItem: string;
  /** Style keywords */
  styleKeywords: string[];
}

export interface AnimationStyle {
  /** Body proportions (chibi, normal, tall) */
  proportions: "chibi" | "toddler" | "child" | "preteen";
  /** Head-to-body ratio for cartoon */
  headRatio: number; // 1:2 for chibi, 1:4 for child, etc.
  /** Line weight (thin, medium, thick) */
  lineWeight: "thin" | "medium" | "thick";
  /** Movement style keywords */
  movementStyle: string[];
  /** Facial expression range (subtle, moderate, exaggerated) */
  expressionRange: "subtle" | "moderate" | "exaggerated";
}

export interface VisualPersonality {
  /** Posture tendency */
  posture: "upright-confident" | "relaxed-casual" | "shy-hunched" | "energetic-bouncy";
  /** Default expression */
  defaultExpression: string;
  /** Gesture style */
  gestureStyle: "big-animated" | "moderate" | "reserved" | "fidgety";
  /** Energy level visual cue */
  energyLevel: "low" | "medium" | "high" | "hyperactive";
}

/** Consistency check result */
export interface ConsistencyScore {
  /** Overall consistency 0–1 */
  overallScore: number;
  /** Per-attribute scores */
  colorMatch: number;
  hairMatch: number;
  clothingMatch: number;
  faceMatch: number;
  proportionMatch: number;
  /** Whether regeneration is recommended */
  shouldRegenerate: boolean;
  /** Specific issues found */
  issues: string[];
}

/** Prompt injection result */
export interface DNAPromptInjection {
  /** Identity prompt fragment to prepend */
  identityPrompt: string;
  /** Style reference prompt fragment */
  styleReference: string;
  /** Color specification */
  colorSpec: string;
  /** Full combined prompt */
  combinedPrompt: string;
  /** Reference image URL (if available) */
  referenceImageUrl: string | null;
}

/* ── Constants ── */

const CONSISTENCY_THRESHOLD = 0.75;
const DNA_SCHEMA_VERSION = 1;

/** Default color palettes by age/style */
const DEFAULT_SKIN_TONES: Record<string, string> = {
  light: "#FFE0BD",
  medium: "#D4A574",
  olive: "#C4956A",
  tan: "#B07D62",
  brown: "#8D5524",
  dark: "#5C3317",
};

const PERSONALITY_TO_POSTURE: Record<string, VisualPersonality["posture"]> = {
  brave: "upright-confident",
  curious: "energetic-bouncy",
  funny: "energetic-bouncy",
  kind: "relaxed-casual",
  adventurous: "upright-confident",
  creative: "relaxed-casual",
  shy: "shy-hunched",
};

const PERSONALITY_TO_EXPRESSION: Record<string, string> = {
  brave: "determined smile",
  curious: "wide-eyed wonder",
  funny: "mischievous grin",
  kind: "warm gentle smile",
  adventurous: "excited confident grin",
  creative: "dreamy focused look",
  shy: "soft sweet half-smile",
};

const PERSONALITY_TO_GESTURE: Record<string, VisualPersonality["gestureStyle"]> = {
  brave: "big-animated",
  curious: "moderate",
  funny: "big-animated",
  kind: "moderate",
  adventurous: "big-animated",
  creative: "moderate",
  shy: "reserved",
};

const AGE_TO_PROPORTIONS: Record<AgeRange, { proportions: AnimationStyle["proportions"]; headRatio: number }> = {
  "3-5": { proportions: "toddler", headRatio: 2.5 },
  "6-8": { proportions: "child", headRatio: 3.0 },
  "9-12": { proportions: "preteen", headRatio: 3.5 },
};

/* ── DNA Construction ── */

/**
 * Generate a deterministic facial structure hash from character attributes.
 * This stays constant across episodes for identity verification.
 */
function generateFacialHash(name: string, ageRange: AgeRange, avatar: AvatarConfig): string {
  // Deterministic hash from character constants
  const seed = `${name}|${ageRange}|${avatar.id}|${avatar.skinTone || ""}|${avatar.hairStyle || ""}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Expand to 64-char hex
  const base = Math.abs(hash).toString(16).padStart(8, "0");
  return (base + base + base + base + base + base + base + base).slice(0, 64);
}

/**
 * Derive the dominant personality trait from personality attributes.
 */
function getDominantTrait(personality: PersonalityAttributes): string {
  const entries = Object.entries(personality) as Array<[string, number]>;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] || "curious";
}

/**
 * Build Character DNA from an existing CharacterProfile.
 */
export function buildCharacterDNA(
  profile: CharacterProfile,
  voiceProfileId?: string,
  referenceImageUrl?: string,
): CharacterDNA {
  const dominantTrait = getDominantTrait(profile.personality);
  const proportionConfig = AGE_TO_PROPORTIONS[profile.ageRange];

  // Build color palette
  const skinTone = profile.avatar.skinTone
    ? (DEFAULT_SKIN_TONES[profile.avatar.skinTone] || profile.avatar.skinTone)
    : DEFAULT_SKIN_TONES.light;

  const colorPalette: ColorPalette = {
    primary: deriveColorFromTheme(profile.favoriteThemes[0] || "adventure"),
    secondary: deriveSecondaryColor(profile.favoriteThemes[0] || "adventure"),
    skin: skinTone,
    hair: deriveHairColor(profile.avatar.hairStyle || "brown"),
    eyes: "#4A90D9",
    accent: "#FFD700",
  };

  // Eye descriptor
  const eyeShape: EyeDescriptor = {
    shape: profile.ageRange === "3-5" ? "cartoon-large" : "round",
    size: profile.ageRange === "3-5" ? "oversized" : "large",
    expression: PERSONALITY_TO_EXPRESSION[dominantTrait]?.includes("wonder")
      ? "curious"
      : PERSONALITY_TO_EXPRESSION[dominantTrait]?.includes("mischievous")
        ? "mischievous"
        : "cheerful",
    color: colorPalette.eyes,
    details: profile.ageRange === "3-5" ? "large sparkly eyes with star-shaped catchlights" : "expressive eyes with clear catchlights",
  };

  // Hair descriptor
  const hairStyle: HairDescriptor = {
    style: profile.avatar.hairStyle || "medium wavy brown",
    color: colorPalette.hair,
    length: "medium",
    texture: "wavy",
    accessories: profile.avatar.accessory ? [profile.avatar.accessory] : [],
  };

  // Clothing
  const clothingSignature: ClothingDescriptor = {
    top: deriveClothingFromTrait(dominantTrait, "top"),
    bottom: deriveClothingFromTrait(dominantTrait, "bottom"),
    shoes: profile.ageRange === "3-5" ? "small colorful sneakers" : "adventure boots",
    accessories: profile.avatar.accessory ? [profile.avatar.accessory] : [],
    signatureItem: deriveSignatureItem(dominantTrait, profile.favoriteThemes),
    styleKeywords: ["child-friendly", "colorful", "comfortable", "cartoon-style"],
  };

  // Animation style
  const animationStyleProfile: AnimationStyle = {
    proportions: proportionConfig.proportions,
    headRatio: proportionConfig.headRatio,
    lineWeight: profile.ageRange === "3-5" ? "thick" : "medium",
    movementStyle: deriveMovementStyle(dominantTrait),
    expressionRange: profile.ageRange === "3-5" ? "exaggerated" : "moderate",
  };

  // Visual personality
  const personalityTraits: VisualPersonality = {
    posture: PERSONALITY_TO_POSTURE[dominantTrait] || "relaxed-casual",
    defaultExpression: PERSONALITY_TO_EXPRESSION[dominantTrait] || "cheerful smile",
    gestureStyle: PERSONALITY_TO_GESTURE[dominantTrait] || "moderate",
    energyLevel: profile.personality.adventurous > 70 ? "high" :
                 profile.personality.shy > 60 ? "low" : "medium",
  };

  return {
    characterId: profile.id,
    name: profile.name,
    facialStructureHash: generateFacialHash(profile.name, profile.ageRange, profile.avatar),
    colorPalette,
    eyeShape,
    hairStyle,
    clothingSignature,
    animationStyleProfile,
    personalityTraits,
    voiceProfileId: voiceProfileId || null,
    referenceImageUrl: referenceImageUrl || null,
    ageRange: profile.ageRange,
    schemaVersion: DNA_SCHEMA_VERSION,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/* ── Prompt Injection ── */

/**
 * Generate a prompt injection for a character in a specific scene.
 *
 * Injects character visual identity into the image generation prompt
 * so the character remains consistent across episodes and scenes.
 */
export function injectCharacterDNA(
  dna: CharacterDNA,
  sceneContext?: string,
): DNAPromptInjection {
  const { colorPalette, eyeShape, hairStyle, clothingSignature, animationStyleProfile, personalityTraits } = dna;

  // Identity prompt — describes the character unambiguously
  const identityParts: string[] = [
    `character "${dna.name}"`,
    `${dna.ageRange} year old child`,
    `${eyeShape.size} ${eyeShape.shape} ${eyeShape.expression} eyes`,
    `${hairStyle.length} ${hairStyle.texture} ${hairStyle.color} hair`,
    `wearing ${clothingSignature.top} and ${clothingSignature.bottom}`,
    clothingSignature.signatureItem ? `always wearing ${clothingSignature.signatureItem}` : "",
    `${personalityTraits.posture.replace(/-/g, " ")} posture`,
    `${personalityTraits.defaultExpression}`,
  ].filter(Boolean);

  const identityPrompt = identityParts.join(", ");

  // Style reference — describes the art style
  const styleReference = [
    `${animationStyleProfile.proportions} proportions`,
    `${animationStyleProfile.lineWeight} line art`,
    `head-to-body ratio 1:${animationStyleProfile.headRatio}`,
    `${animationStyleProfile.expressionRange} facial expressions`,
    "Pixar/Disney-quality children's animation style",
    "consistent character model sheet accuracy",
  ].join(", ");

  // Color specification
  const colorSpec = [
    `skin tone ${colorPalette.skin}`,
    `primary outfit color ${colorPalette.primary}`,
    `secondary color ${colorPalette.secondary}`,
    `hair ${colorPalette.hair}`,
    `eyes ${colorPalette.eyes}`,
  ].join(", ");

  // Combined
  const combinedPrompt = [identityPrompt, styleReference, colorSpec].join(". ");

  return {
    identityPrompt,
    styleReference,
    colorSpec,
    combinedPrompt,
    referenceImageUrl: dna.referenceImageUrl,
  };
}

/**
 * Enhance a scene generation prompt with character DNA identity.
 * Returns the augmented prompt ready for image generation.
 */
export function enhancePromptWithDNA(
  originalPrompt: string,
  characters: CharacterDNA[],
): string {
  if (characters.length === 0) return originalPrompt;

  const characterDescs = characters.map((c) => {
    const injection = injectCharacterDNA(c);
    return injection.identityPrompt;
  });

  return `${originalPrompt}. Characters present: ${characterDescs.join("; ")}. Maintain exact character design consistency with specified colors and proportions.`;
}

/* ── Consistency Validation ── */

/**
 * Compute a consistency score between a character DNA and a scene description.
 *
 * This is a heuristic check that verifies the scene description mentions
 * the expected character attributes. In production, this would use
 * CLIP embeddings for visual similarity.
 */
export function checkConsistency(
  dna: CharacterDNA,
  sceneDescription: string,
): ConsistencyScore {
  const lower = sceneDescription.toLowerCase();
  const issues: string[] = [];

  // Color match — check if key colors are mentioned or not contradicted
  const colorMatch = checkColorPresence(lower, dna.colorPalette);

  // Hair match
  const hairMatch = lower.includes(dna.hairStyle.color.toLowerCase()) ? 1.0 :
                    lower.includes("hair") ? 0.5 : 0.7; // neutral if hair not mentioned
  if (hairMatch < 0.7) issues.push(`Hair color mismatch: expected ${dna.hairStyle.color}`);

  // Clothing match
  const clothingMatch = checkClothingPresence(lower, dna.clothingSignature);
  if (clothingMatch < 0.6) issues.push("Clothing does not match character signature");

  // Face match (via hash — in production this would use embedding distance)
  const faceMatch = lower.includes(dna.name.toLowerCase()) ? 0.9 : 0.6;
  if (faceMatch < 0.7) issues.push("Character may not be correctly identified in scene");

  // Proportion match
  const proportionMatch = checkProportionConsistency(lower, dna.animationStyleProfile);

  const overallScore = (colorMatch * 0.25 + hairMatch * 0.20 + clothingMatch * 0.20 + faceMatch * 0.25 + proportionMatch * 0.10);
  const shouldRegenerate = overallScore < CONSISTENCY_THRESHOLD;

  if (shouldRegenerate) {
    issues.push(`Overall consistency ${(overallScore * 100).toFixed(0)}% below threshold ${CONSISTENCY_THRESHOLD * 100}%`);
  }

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    colorMatch: Math.round(colorMatch * 100) / 100,
    hairMatch: Math.round(hairMatch * 100) / 100,
    clothingMatch: Math.round(clothingMatch * 100) / 100,
    faceMatch: Math.round(faceMatch * 100) / 100,
    proportionMatch: Math.round(proportionMatch * 100) / 100,
    shouldRegenerate,
    issues,
  };
}

/**
 * Get all character DNAs for an episode as a serializable object.
 * Used for caching/storage.
 */
export function serializeDNA(dna: CharacterDNA): string {
  return JSON.stringify(dna);
}

/**
 * Deserialize a character DNA from stored JSON.
 */
export function deserializeDNA(json: string): CharacterDNA {
  const parsed = JSON.parse(json) as CharacterDNA;
  if (parsed.schemaVersion !== DNA_SCHEMA_VERSION) {
    // Future migration logic would go here
    parsed.schemaVersion = DNA_SCHEMA_VERSION;
    parsed.updatedAt = Date.now();
  }
  return parsed;
}

/**
 * Update a character's reference image (canonical frame).
 * Called after a particularly good generation result.
 */
export function updateReferenceImage(
  dna: CharacterDNA,
  newReferenceUrl: string,
): CharacterDNA {
  return {
    ...dna,
    referenceImageUrl: newReferenceUrl,
    updatedAt: Date.now(),
  };
}

/* ── Helpers ── */

function deriveColorFromTheme(theme: string): string {
  const themeColors: Record<string, string> = {
    adventure: "#4A90D9",    // Blue
    space: "#6C5CE7",        // Purple
    ocean: "#00B4D8",        // Cyan
    forest: "#2ECC71",       // Green
    magic: "#9B59B6",        // Violet
    dinosaur: "#E67E22",     // Orange
    superhero: "#E74C3C",    // Red
    fairy: "#FF69B4",        // Pink
    pirate: "#8B4513",       // Brown
    robot: "#95A5A6",        // Silver
  };
  const lower = theme.toLowerCase();
  for (const [key, color] of Object.entries(themeColors)) {
    if (lower.includes(key)) return color;
  }
  return "#4A90D9"; // Default blue
}

function deriveSecondaryColor(theme: string): string {
  const secColors: Record<string, string> = {
    adventure: "#F39C12",
    space: "#2ECC71",
    ocean: "#E74C3C",
    forest: "#8B4513",
    magic: "#FFD700",
    dinosaur: "#27AE60",
    superhero: "#3498DB",
    fairy: "#DDA0DD",
    pirate: "#F39C12",
    robot: "#E74C3C",
  };
  const lower = theme.toLowerCase();
  for (const [key, color] of Object.entries(secColors)) {
    if (lower.includes(key)) return color;
  }
  return "#F39C12";
}

function deriveHairColor(hairStyle: string): string {
  const lower = hairStyle.toLowerCase();
  if (lower.includes("blonde") || lower.includes("blond")) return "#F4D03F";
  if (lower.includes("red") || lower.includes("ginger")) return "#E74C3C";
  if (lower.includes("black")) return "#2C3E50";
  if (lower.includes("white") || lower.includes("silver")) return "#BDC3C7";
  return "#8B6914"; // Default brown
}

function deriveClothingFromTrait(trait: string, piece: "top" | "bottom"): string {
  const tops: Record<string, string> = {
    brave: "bright red adventure vest with star badge",
    curious: "colorful striped explorer t-shirt",
    funny: "yellow joke-themed hoodie with smiley patches",
    kind: "soft pastel cardigan with heart button",
    adventurous: "green explorer jacket with many pockets",
    creative: "rainbow paint-splattered art smock",
    shy: "cozy oversized lavender sweater",
  };
  const bottoms: Record<string, string> = {
    brave: "sturdy dark blue shorts",
    curious: "khaki explorer shorts with utility pockets",
    funny: "colorful patchwork pants",
    kind: "comfortable soft pink leggings",
    adventurous: "rugged cargo pants",
    creative: "bright mixed-pattern skirt or shorts",
    shy: "simple comfortable jeans",
  };
  return piece === "top" ? (tops[trait] || "colorful t-shirt") : (bottoms[trait] || "comfortable shorts");
}

function deriveSignatureItem(trait: string, themes: string[]): string {
  const items: Record<string, string> = {
    brave: "a golden star-shaped pendant",
    curious: "a worn leather explorer's journal",
    funny: "a silly propeller hat",
    kind: "a friendship bracelet",
    adventurous: "a magical compass that glows",
    creative: "a rainbow-colored paintbrush tucked behind ear",
    shy: "a comforting stuffed bunny companion",
  };
  return items[trait] || "a special charm bracelet";
}

function deriveMovementStyle(trait: string): string[] {
  const styles: Record<string, string[]> = {
    brave: ["confident stride", "bold gestures", "chest-out posture"],
    curious: ["head tilts", "leaning forward", "pointing excitedly"],
    funny: ["bouncy walk", "exaggerated reactions", "silly poses"],
    kind: ["gentle movements", "open arms", "soft approaches"],
    adventurous: ["quick energetic movement", "climbing motion", "wide stances"],
    creative: ["flowing movements", "spinning", "dramatic hand waves"],
    shy: ["small shuffling steps", "looking down then up", "fidgeting"],
  };
  return styles[trait] || ["natural child movement", "playful energy"];
}

function checkColorPresence(text: string, palette: ColorPalette): number {
  let matches = 0;
  let checks = 0;

  // Check if common color words are present and not contradictory
  const colorWords: Record<string, string[]> = {
    [palette.primary]: ["blue", "red", "green", "purple", "orange", "yellow", "pink"],
    [palette.hair]: ["brown", "black", "blonde", "red", "white"],
  };

  for (const hexColor of Object.keys(colorWords)) {
    for (const word of colorWords[hexColor]) {
      if (text.includes(word)) {
        checks++;
        // Simple heuristic: if the word appears, it's somewhat matching
        matches += 0.7;
        break;
      }
    }
  }

  return checks > 0 ? Math.min(1, matches / checks) : 0.8; // Neutral if no color mentioned
}

function checkClothingPresence(text: string, clothing: ClothingDescriptor): number {
  let score = 0.7; // Base neutral score

  for (const keyword of clothing.styleKeywords) {
    if (text.includes(keyword.toLowerCase())) score += 0.1;
  }

  if (clothing.signatureItem && text.includes(clothing.signatureItem.split(" ").pop()?.toLowerCase() || "")) {
    score += 0.15;
  }

  return Math.min(1, score);
}

function checkProportionConsistency(text: string, style: AnimationStyle): number {
  // Check for proportion keywords
  if (text.includes("chibi") && style.proportions === "chibi") return 1.0;
  if (text.includes("child") || text.includes("kid")) return 0.9;
  if (text.includes("adult") || text.includes("tall")) return 0.3; // Wrong proportions
  return 0.8; // Neutral
}
