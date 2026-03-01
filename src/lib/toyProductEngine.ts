/**
 * toyProductEngine.ts — AI Toy Product Generator (Episode-Tied Merch Engine)
 *
 * Automatically generates toy product concepts tied to:
 *   • Episode characters (Character DNA)
 *   • Scene moments (emotional intensity peaks)
 *   • Catchphrases (extracted from narration)
 *   • Emotional highlights (climactic beats)
 *   • Season arcs (milestone merchandise)
 *
 * Pipeline:
 *   1. After episode completion → analyze content
 *   2. Extract merchandise-viable moments & characters
 *   3. Score popularity & emotional intensity
 *   4. Generate structured product concepts
 *   5. Lucy Intelligence validates profitability
 *   6. Visual asset generation prompt (text-to-image)
 *   7. Pricing & complexity estimation
 *
 * Integrations:
 *   • Character DNA Engine → visual consistency for toy mockups
 *   • Season Memory Engine → season arc milestone merch
 *   • Lucy Intelligence → profitability validation
 *   • Monetization Engine → entitlement gating
 */

import type { CharacterDNA } from "@/lib/characterDNAEngine";

/* ── Types ── */

export type ProductType =
  | "plush"
  | "action-figure"
  | "puzzle"
  | "coloring-book"
  | "sticker-pack"
  | "poster"
  | "backpack-charm"
  | "lunchbox"
  | "t-shirt"
  | "board-game"
  | "playset"
  | "bedtime-lamp";

export type ProductionComplexity = "low" | "medium" | "high" | "premium";

export interface ToyProductConcept {
  /** Unique toy product ID */
  toyId: string;
  /** Character this toy is based on */
  characterId: string;
  /** Character name */
  characterName: string;
  /** Product type category */
  productType: ProductType;
  /** Visual generation prompt for product mockup */
  visualPrompt: string;
  /** Marketing tagline */
  tagline: string;
  /** Episode reference (episodeId or season milestone) */
  episodeReference: string;
  /** Suggested retail price in cents (USD) */
  suggestedPrice: number;
  /** Production complexity score */
  productionComplexityScore: number;
  /** Production complexity tier */
  productionComplexity: ProductionComplexity;
  /** Estimated production cost in cents */
  estimatedProductionCost: number;
  /** Estimated retail margin 0–1 */
  estimatedMargin: number;
  /** Lucy Intelligence profitability validation */
  lucyValidation: LucyToyValidation;
  /** Source scene moment that inspired this product */
  sourceMoment: MerchMoment;
  /** Visual asset URLs (generated later) */
  mockupUrls: string[];
  /** Status */
  status: ToyProductStatus;
  /** Created timestamp */
  createdAt: string;
}

export type ToyProductStatus =
  | "concept"
  | "validated"
  | "mockup-generated"
  | "listed"
  | "blocked";

export interface MerchMoment {
  /** Type of moment */
  type: "catchphrase" | "emotional-peak" | "prop" | "costume" | "character-intro" | "season-milestone";
  /** Description of the moment */
  description: string;
  /** Source episode/scene identifier */
  sourceEpisodeId: string;
  /** Scene number within episode */
  sceneNumber: number;
  /** Emotional intensity 0–1 */
  emotionalIntensity: number;
  /** Character popularity score 0–10 */
  characterPopularity: number;
}

export interface LucyToyValidation {
  /** Whether Lucy approves listing */
  approved: boolean;
  /** Estimated production cost proxy (cents) */
  productionCostEstimate: number;
  /** Expected margin 0–1 */
  expectedMargin: number;
  /** Manufacturing complexity 0–10 */
  manufacturingComplexity: number;
  /** Recommended retail price (cents) */
  recommendedRetailPrice: number;
  /** Reasoning */
  reasoning: string;
  /** Block reason if not approved */
  blockReason?: string;
}

export interface EpisodeContentAnalysis {
  /** Characters ranked by screen time / emotional weight */
  characterRankings: { characterId: string; name: string; popularity: number }[];
  /** Emotional intensity peaks (scene numbers with intensity > 0.7) */
  emotionalPeaks: { sceneNumber: number; intensity: number; emotion: string; description: string }[];
  /** Extracted catchphrases */
  catchphrases: { phrase: string; characterId: string; frequency: number }[];
  /** Iconic props */
  iconicProps: { name: string; description: string; sceneNumber: number }[];
  /** Season milestone (if applicable) */
  seasonMilestone?: { type: string; description: string };
}

export interface ToyGenerationRequest {
  episodeId: string;
  episodeTitle: string;
  theme: string;
  scenes: EpisodeSceneData[];
  characters: ToyCharacterData[];
  seasonId?: string;
  seasonArcProgress?: number;
}

export interface EpisodeSceneData {
  sceneNumber: number;
  caption: string;
  narrationText: string;
  emotion: string;
  emotionalIntensity: number;
  act: 1 | 2 | 3;
}

export interface ToyCharacterData {
  characterId: string;
  name: string;
  dna?: CharacterDNA;
  screenTimePercent: number;
}

/* ── Constants ── */

const MIN_MARGIN_THRESHOLD = 0.30; // 30% minimum margin for Lucy approval
const MAX_PRODUCTS_PER_EPISODE = 5;

/** Base production costs by product type (cents) */
const BASE_PRODUCTION_COSTS: Record<ProductType, number> = {
  "plush":           899,
  "action-figure":  1299,
  "puzzle":          499,
  "coloring-book":   299,
  "sticker-pack":    149,
  "poster":          199,
  "backpack-charm":  349,
  "lunchbox":        699,
  "t-shirt":         799,
  "board-game":     1499,
  "playset":        1999,
  "bedtime-lamp":   1499,
};

/** Retail price multipliers by product type */
const RETAIL_MULTIPLIERS: Record<ProductType, number> = {
  "plush":          2.8,
  "action-figure":  2.5,
  "puzzle":         3.0,
  "coloring-book":  3.5,
  "sticker-pack":   4.0,
  "poster":         4.0,
  "backpack-charm": 3.2,
  "lunchbox":       2.5,
  "t-shirt":        3.0,
  "board-game":     2.2,
  "playset":        2.0,
  "bedtime-lamp":   2.5,
};

/** Complexity scores by product type (0–10) */
const COMPLEXITY_SCORES: Record<ProductType, number> = {
  "plush":          4,
  "action-figure":  7,
  "puzzle":         3,
  "coloring-book":  2,
  "sticker-pack":   1,
  "poster":         1,
  "backpack-charm": 3,
  "lunchbox":       5,
  "t-shirt":        2,
  "board-game":     6,
  "playset":        9,
  "bedtime-lamp":   8,
};

/** Product types best suited to different moment types */
const MOMENT_PRODUCT_MAP: Record<MerchMoment["type"], ProductType[]> = {
  "catchphrase":      ["t-shirt", "poster", "sticker-pack"],
  "emotional-peak":   ["plush", "poster", "bedtime-lamp"],
  "prop":             ["action-figure", "playset", "backpack-charm"],
  "costume":          ["action-figure", "coloring-book"],
  "character-intro":  ["plush", "action-figure", "puzzle"],
  "season-milestone": ["board-game", "playset", "poster"],
};

/** Tagline templates */
const TAGLINE_TEMPLATES: Record<ProductType, string[]> = {
  "plush":            ["Cuddle up with {name}!", "Your adventure buddy — {name} plush"],
  "action-figure":    ["{name}: Ready for action!", "Pose {name} in any adventure"],
  "puzzle":           ["Piece together {name}'s world!", "A puzzling adventure with {name}"],
  "coloring-book":    ["Color {name}'s story your way!", "Bring {name} to life in color"],
  "sticker-pack":     ["Stick with {name}!", "Decorate everything with {name}"],
  "poster":           ["{name}'s greatest moment!", "Frame-worthy adventure art"],
  "backpack-charm":   ["Take {name} everywhere!", "Adventure on the go with {name}"],
  "lunchbox":         ["Lunch with {name}!", "Fuel your adventures with {name}"],
  "t-shirt":          ["Wear the adventure!", "\"{catchphrase}\" — {name}"],
  "board-game":       ["Play through the adventure!", "{name}'s Quest — the board game"],
  "playset":          ["Build {name}'s world!", "Every scene, in your hands"],
  "bedtime-lamp":     ["{name} glows goodnight!", "Night light adventures with {name}"],
};

/* ── Core Functions ── */

/**
 * Analyze an episode's content for merchandise-viable moments.
 */
export function analyzeEpisodeForMerch(request: ToyGenerationRequest): EpisodeContentAnalysis {
  const { scenes, characters } = request;

  // Character rankings — by screen time weighted by emotional intensity
  const characterRankings = characters
    .map((c) => ({
      characterId: c.characterId,
      name: c.name,
      popularity: Math.round(
        (c.screenTimePercent * 6 +
          scenes
            .filter((s) => s.narrationText.toLowerCase().includes(c.name.toLowerCase()))
            .reduce((sum, s) => sum + s.emotionalIntensity, 0) *
            4) *
          10,
      ) / 10,
    }))
    .sort((a, b) => b.popularity - a.popularity);

  // Emotional peaks — scenes with intensity > 0.7
  const emotionalPeaks = scenes
    .filter((s) => s.emotionalIntensity > 0.7)
    .map((s) => ({
      sceneNumber: s.sceneNumber,
      intensity: s.emotionalIntensity,
      emotion: s.emotion,
      description: s.caption,
    }));

  // Catchphrase extraction — repeated short phrases in narration
  const catchphrases = extractCatchphrases(scenes, characters);

  // Iconic props — nouns appearing with action verbs in high-intensity scenes
  const iconicProps = extractIconicProps(scenes);

  // Season milestone
  const seasonMilestone =
    request.seasonArcProgress && request.seasonArcProgress >= 90
      ? { type: "finale", description: `Season finale of ${request.episodeTitle}` }
      : request.seasonArcProgress && request.seasonArcProgress >= 45 && request.seasonArcProgress <= 55
        ? { type: "midseason", description: `Midseason milestone` }
        : undefined;

  return { characterRankings, emotionalPeaks, catchphrases, iconicProps, seasonMilestone };
}

/**
 * Generate toy product concepts from episode analysis.
 */
export function generateToyProducts(
  request: ToyGenerationRequest,
  analysis: EpisodeContentAnalysis,
): ToyProductConcept[] {
  const products: ToyProductConcept[] = [];
  const moments = buildMerchMoments(request, analysis);

  // Sort by merchandise potential
  const ranked = moments.sort(
    (a, b) =>
      b.emotionalIntensity * b.characterPopularity -
      a.emotionalIntensity * a.characterPopularity,
  );

  // Generate top products (capped)
  for (const moment of ranked.slice(0, MAX_PRODUCTS_PER_EPISODE)) {
    const productTypes = MOMENT_PRODUCT_MAP[moment.type] || ["plush"];
    const productType = productTypes[0]; // Best match

    const character = request.characters.find((c) => c.characterId === moment.description.split(":")[0]) || request.characters[0];
    const charName = character?.name || "Hero";

    // Build visual prompt
    const visualPrompt = buildVisualPrompt(charName, productType, moment, request.theme, character?.dna);

    // Pricing
    const baseCost = BASE_PRODUCTION_COSTS[productType];
    const retailMultiplier = RETAIL_MULTIPLIERS[productType];
    const suggestedPrice = Math.round(baseCost * retailMultiplier);
    const estimatedMargin = 1 - 1 / retailMultiplier;

    // Lucy validation
    const lucyValidation = lucyValidateProduct(productType, baseCost, suggestedPrice, moment);

    // Tagline
    const tagline = buildTagline(charName, productType, moment);

    const concept: ToyProductConcept = {
      toyId: `toy_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      characterId: character?.characterId || "protagonist",
      characterName: charName,
      productType,
      visualPrompt,
      tagline,
      episodeReference: request.episodeId,
      suggestedPrice,
      productionComplexityScore: COMPLEXITY_SCORES[productType],
      productionComplexity: getComplexityTier(COMPLEXITY_SCORES[productType]),
      estimatedProductionCost: baseCost,
      estimatedMargin,
      lucyValidation,
      sourceMoment: moment,
      mockupUrls: [],
      status: lucyValidation.approved ? "validated" : "blocked",
      createdAt: new Date().toISOString(),
    };

    products.push(concept);
  }

  return products;
}

/**
 * Generate visual asset prompt for product mockup image generation.
 * Used with text-to-image model (Gemini Flash Image via Lovable gateway).
 */
export function buildMockupPrompt(concept: ToyProductConcept): string {
  return [
    `Professional product photography of a ${concept.productType.replace("-", " ")} toy.`,
    `Character: ${concept.characterName}.`,
    concept.visualPrompt,
    "Studio lighting, clean white background, soft shadow.",
    "High resolution, product catalog quality, no text overlays.",
    "Packaging concept visible. Safe for children.",
    "Pixar-quality character design, vibrant colors.",
  ].join(" ");
}

/**
 * Generate a 3D turntable animation prompt (optional premium feature).
 */
export function buildTurntablePrompt(concept: ToyProductConcept): string {
  return [
    `Slow 360-degree turntable rotation of a ${concept.productType.replace("-", " ")} toy.`,
    `Character: ${concept.characterName}.`,
    concept.visualPrompt,
    "Studio lighting with gradient background.",
    "Smooth rotation, product showcase animation.",
    "6 seconds, seamless loop, no camera movement.",
  ].join(" ");
}

/**
 * Get all product concepts for an episode — full pipeline.
 */
export function generateEpisodeMerch(request: ToyGenerationRequest): {
  analysis: EpisodeContentAnalysis;
  products: ToyProductConcept[];
} {
  const analysis = analyzeEpisodeForMerch(request);
  const products = generateToyProducts(request, analysis);
  return { analysis, products };
}

/**
 * Serialize product concepts for storage.
 */
export function serializeToyProducts(products: ToyProductConcept[]): string {
  return JSON.stringify(products);
}

/**
 * Deserialize product concepts from storage.
 */
export function deserializeToyProducts(json: string): ToyProductConcept[] {
  return JSON.parse(json) as ToyProductConcept[];
}

/* ── Lucy Intelligence Integration ── */

function lucyValidateProduct(
  productType: ProductType,
  productionCost: number,
  retailPrice: number,
  moment: MerchMoment,
): LucyToyValidation {
  const margin = (retailPrice - productionCost) / retailPrice;
  const complexity = COMPLEXITY_SCORES[productType];

  // Demand multiplier from emotional intensity
  const demandFactor = 0.8 + moment.emotionalIntensity * 0.4 + moment.characterPopularity * 0.02;
  const adjustedMargin = Math.min(0.85, margin * demandFactor);

  // Manufacturing feasibility
  const mfgComplexity = complexity;

  // Recommended retail (adjusted by demand)
  const recommended = Math.round(productionCost * RETAIL_MULTIPLIERS[productType] * demandFactor);

  const approved = adjustedMargin >= MIN_MARGIN_THRESHOLD && complexity <= 8;
  const blockReason = !approved
    ? adjustedMargin < MIN_MARGIN_THRESHOLD
      ? `Projected margin too low (${(adjustedMargin * 100).toFixed(1)}% < ${MIN_MARGIN_THRESHOLD * 100}% threshold)`
      : `Manufacturing complexity too high (${complexity}/10)`
    : undefined;

  return {
    approved,
    productionCostEstimate: productionCost,
    expectedMargin: Math.round(adjustedMargin * 100) / 100,
    manufacturingComplexity: mfgComplexity,
    recommendedRetailPrice: recommended,
    reasoning: approved
      ? `Good margin (${(adjustedMargin * 100).toFixed(1)}%), moderate complexity (${complexity}/10), demand factor ${demandFactor.toFixed(2)}`
      : blockReason || "Validation failed",
    blockReason,
  };
}

/* ── Helpers ── */

function extractCatchphrases(
  scenes: EpisodeSceneData[],
  characters: ToyCharacterData[],
): EpisodeContentAnalysis["catchphrases"] {
  const phrases = new Map<string, { characterId: string; count: number }>();

  for (const scene of scenes) {
    const words = scene.narrationText.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 3 && s.length < 40);
    for (const phrase of words) {
      const key = phrase.toLowerCase();
      if (phrases.has(key)) {
        phrases.get(key)!.count++;
      } else {
        const char = characters.find((c) =>
          phrase.toLowerCase().includes(c.name.toLowerCase()),
        );
        phrases.set(key, { characterId: char?.characterId || "narrator", count: 1 });
      }
    }
  }

  return Array.from(phrases.entries())
    .filter(([, v]) => v.count >= 2)
    .map(([phrase, v]) => ({ phrase, characterId: v.characterId, frequency: v.count }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);
}

function extractIconicProps(scenes: EpisodeSceneData[]): EpisodeContentAnalysis["iconicProps"] {
  const propKeywords = [
    "sword", "wand", "shield", "crown", "gem", "key", "map", "compass",
    "crystal", "lantern", "telescope", "potion", "amulet", "staff",
    "rocket", "robot", "book", "ring", "helmet", "cape", "boots",
  ];

  const props: EpisodeContentAnalysis["iconicProps"] = [];
  for (const scene of scenes) {
    const lower = scene.caption.toLowerCase() + " " + scene.narrationText.toLowerCase();
    for (const kw of propKeywords) {
      if (lower.includes(kw) && !props.find((p) => p.name === kw)) {
        props.push({
          name: kw,
          description: `${kw} from scene ${scene.sceneNumber}: ${scene.caption.slice(0, 60)}`,
          sceneNumber: scene.sceneNumber,
        });
      }
    }
  }

  return props.slice(0, 5);
}

function buildMerchMoments(
  request: ToyGenerationRequest,
  analysis: EpisodeContentAnalysis,
): MerchMoment[] {
  const moments: MerchMoment[] = [];

  // Character intros
  for (const char of analysis.characterRankings.slice(0, 3)) {
    moments.push({
      type: "character-intro",
      description: `${char.characterId}: ${char.name}`,
      sourceEpisodeId: request.episodeId,
      sceneNumber: 1,
      emotionalIntensity: 0.6,
      characterPopularity: char.popularity,
    });
  }

  // Emotional peaks
  for (const peak of analysis.emotionalPeaks.slice(0, 3)) {
    moments.push({
      type: "emotional-peak",
      description: peak.description,
      sourceEpisodeId: request.episodeId,
      sceneNumber: peak.sceneNumber,
      emotionalIntensity: peak.intensity,
      characterPopularity: analysis.characterRankings[0]?.popularity || 5,
    });
  }

  // Catchphrases
  for (const cp of analysis.catchphrases.slice(0, 2)) {
    moments.push({
      type: "catchphrase",
      description: cp.phrase,
      sourceEpisodeId: request.episodeId,
      sceneNumber: 1,
      emotionalIntensity: 0.5 + cp.frequency * 0.1,
      characterPopularity: analysis.characterRankings.find((c) => c.characterId === cp.characterId)?.popularity || 5,
    });
  }

  // Props
  for (const prop of analysis.iconicProps.slice(0, 2)) {
    moments.push({
      type: "prop",
      description: prop.description,
      sourceEpisodeId: request.episodeId,
      sceneNumber: prop.sceneNumber,
      emotionalIntensity: 0.7,
      characterPopularity: analysis.characterRankings[0]?.popularity || 5,
    });
  }

  // Season milestone
  if (analysis.seasonMilestone) {
    moments.push({
      type: "season-milestone",
      description: analysis.seasonMilestone.description,
      sourceEpisodeId: request.episodeId,
      sceneNumber: request.scenes.length,
      emotionalIntensity: 0.9,
      characterPopularity: analysis.characterRankings[0]?.popularity || 8,
    });
  }

  return moments;
}

function buildVisualPrompt(
  charName: string,
  productType: ProductType,
  moment: MerchMoment,
  theme: string,
  dna?: CharacterDNA,
): string {
  const parts: string[] = [];

  // Character appearance from DNA
  if (dna) {
    parts.push(`Character: ${charName} with ${dna.colorPalette.primary} primary color`);
    if (dna.eyeShape) parts.push(`${dna.eyeShape.shape} eyes (${dna.eyeShape.color})`);
    if (dna.hairStyle) parts.push(`${dna.hairStyle.color} ${dna.hairStyle.style} hair`);
    if (dna.clothingSignature?.signatureItem) parts.push(`wearing ${dna.clothingSignature.signatureItem}`);
  } else {
    parts.push(`Character: ${charName}, Pixar-quality cartoon child`);
  }

  // Product-specific details
  const productDetails: Record<ProductType, string> = {
    "plush":          "Soft plush toy, huggable proportions, embroidered details, polyester fill",
    "action-figure":  "Poseable action figure, 5 points of articulation, detailed sculpt",
    "puzzle":         "100-piece jigsaw puzzle, thick cardboard pieces, full-color scene illustration",
    "coloring-book":  "Coloring book pages, clean line art, detailed backgrounds",
    "sticker-pack":   "Die-cut vinyl stickers, holographic accents, waterproof",
    "poster":         "Art print poster, matte finish, cinematic scene composition",
    "backpack-charm": "Keychain/charm accessory, enamel details, metal clasp",
    "lunchbox":       "Insulated lunchbox, colorful print, durable BPA-free plastic",
    "t-shirt":        "Kids cotton t-shirt, screen-printed graphic, vibrant colors",
    "board-game":     "Board game box and components, character-themed game pieces",
    "playset":        "Playset with miniature figures and environment pieces",
    "bedtime-lamp":   "LED night lamp with character silhouette, warm glow, USB charging",
  };

  parts.push(productDetails[productType]);
  parts.push(`Theme: ${theme}`);

  if (moment.type === "catchphrase") {
    parts.push(`Features catchphrase: "${moment.description}"`);
  }

  return parts.join(". ") + ".";
}

function buildTagline(charName: string, productType: ProductType, moment: MerchMoment): string {
  const templates = TAGLINE_TEMPLATES[productType] || ["{name} — yours to keep!"];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template
    .replace("{name}", charName)
    .replace("{catchphrase}", moment.type === "catchphrase" ? moment.description : "Adventure awaits!");
}

function getComplexityTier(score: number): ProductionComplexity {
  if (score <= 2) return "low";
  if (score <= 5) return "medium";
  if (score <= 7) return "high";
  return "premium";
}
