/**
 * lightingDirector.ts — Pixar-Level Lighting Simulation Prompt Engine
 *
 * Automatically augments every scene prompt with cinematic lighting intelligence.
 * Analyzes emotional tone, time of day, environment type, scene intensity,
 * and character mood to produce Pixar-grade lighting directives.
 *
 * No static presets — lighting adapts dynamically per scene.
 *
 * Lighting Layers:
 *   1. Global Illumination (ambient fill)
 *   2. Key Light (primary directional)
 *   3. Rim Light (edge separation)
 *   4. Fill Light (shadow softening)
 *   5. Volumetric Scattering (atmosphere)
 *   6. Subsurface Scattering (skin/organics)
 *   7. Depth Fog (scale/distance)
 *   8. Bounce Light (indirect reflections)
 *   9. Color Temperature (warm/cool balance)
 *  10. Specular Highlights (material response)
 */

/* ── Types ── */

export type TimeOfDay = "dawn" | "morning" | "noon" | "afternoon" | "golden-hour" | "dusk" | "night" | "midnight";

export type EnvironmentType =
  | "forest"
  | "ocean"
  | "cave"
  | "city"
  | "bedroom"
  | "castle"
  | "space"
  | "desert"
  | "mountain"
  | "underwater"
  | "meadow"
  | "village"
  | "classroom"
  | "sky"
  | "generic";

export type EmotionalIntensity = "gentle" | "moderate" | "intense" | "climactic";

export type LightingMood =
  | "warm-safe"
  | "mysterious"
  | "adventurous"
  | "triumphant"
  | "melancholy"
  | "whimsical"
  | "dramatic"
  | "serene"
  | "playful"
  | "epic";

export interface LightingDirective {
  /** Global illumination description */
  globalIllumination: string;
  /** Key light setup */
  keyLight: string;
  /** Rim/back light */
  rimLight: string;
  /** Fill light */
  fillLight: string;
  /** Volumetric effects */
  volumetrics: string;
  /** Subsurface scattering for characters */
  subsurfaceScattering: string;
  /** Depth/atmosphere fog */
  depthFog: string;
  /** Bounce/indirect lighting */
  bounceLight: string;
  /** Color temperature description */
  colorTemperature: string;
  /** Specular highlights */
  specularHighlights: string;
  /** Dynamic range hint */
  dynamicRange: string;
  /** Composite prompt fragment (all layers combined) */
  promptFragment: string;
}

export interface LightingInput {
  /** Raw scene description / caption */
  sceneDescription: string;
  /** Emotional tone of the scene */
  emotion: string;
  /** Time of day (auto-inferred if not provided) */
  timeOfDay?: TimeOfDay;
  /** Environment type (auto-inferred if not provided) */
  environment?: EnvironmentType;
  /** Scene intensity 0–1 */
  intensity?: number;
  /** Character mood (auto-mapped from emotion if not provided) */
  characterMood?: string;
  /** Act number for narrative awareness */
  act?: 1 | 2 | 3;
  /** Is this a kids-mode scene */
  isKidsMode?: boolean;
  /** Tension level 0–1 */
  tensionLevel?: number;
}

export interface LitPromptResult {
  /** Original prompt */
  original: string;
  /** Lighting-enhanced prompt */
  enhanced: string;
  /** Lighting directive breakdown */
  directive: LightingDirective;
  /** Inferred parameters */
  inferred: {
    timeOfDay: TimeOfDay;
    environment: EnvironmentType;
    intensity: EmotionalIntensity;
    mood: LightingMood;
  };
}

/* ── Environment Detection ── */

const ENVIRONMENT_KEYWORDS: Record<EnvironmentType, string[]> = {
  forest:     ["forest", "tree", "woods", "jungle", "grove", "canopy", "leaf", "fern"],
  ocean:      ["ocean", "sea", "wave", "beach", "shore", "tide", "surf", "coast"],
  cave:       ["cave", "cavern", "tunnel", "underground", "grotto", "stalactite"],
  city:       ["city", "street", "building", "skyscraper", "traffic", "sidewalk", "downtown"],
  bedroom:    ["bedroom", "bed", "pillow", "blanket", "sleep", "pajama", "dream", "night light"],
  castle:     ["castle", "tower", "throne", "dungeon", "moat", "knight", "royal", "kingdom"],
  space:      ["space", "star", "planet", "rocket", "galaxy", "asteroid", "astronaut", "cosmos"],
  desert:     ["desert", "sand", "dune", "oasis", "cactus", "arid", "dry"],
  mountain:   ["mountain", "peak", "cliff", "summit", "valley", "ridge", "alpine"],
  underwater: ["underwater", "coral", "fish", "seabed", "submarine", "kelp", "abyss"],
  meadow:     ["meadow", "field", "flower", "grass", "garden", "pasture", "wildflower"],
  village:    ["village", "cottage", "farm", "barn", "market", "campfire"],
  classroom:  ["classroom", "school", "desk", "teacher", "blackboard", "library", "lesson"],
  sky:        ["sky", "cloud", "fly", "balloon", "rainbow", "bird", "soar", "airship"],
  generic:    [],
};

/** Infer environment from scene text */
function inferEnvironment(text: string): EnvironmentType {
  const lower = text.toLowerCase();
  let best: EnvironmentType = "generic";
  let bestScore = 0;

  for (const [env, keywords] of Object.entries(ENVIRONMENT_KEYWORDS)) {
    if (env === "generic") continue;
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = env as EnvironmentType;
    }
  }

  return best;
}

/* ── Time of Day Detection ── */

const TIME_KEYWORDS: Record<TimeOfDay, string[]> = {
  dawn:          ["dawn", "sunrise", "first light", "daybreak"],
  morning:       ["morning", "breakfast", "wake up", "bright day"],
  noon:          ["noon", "midday", "lunchtime", "high sun"],
  afternoon:     ["afternoon", "late day"],
  "golden-hour": ["golden hour", "sunset glow", "warm evening"],
  dusk:          ["dusk", "sunset", "twilight", "evening"],
  night:         ["night", "moonlight", "bedtime", "starry"],
  midnight:      ["midnight", "dark", "deep night", "witching hour"],
};

function inferTimeOfDay(text: string, emotion: string): TimeOfDay {
  const lower = text.toLowerCase();

  for (const [time, keywords] of Object.entries(TIME_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return time as TimeOfDay;
    }
  }

  // Infer from emotion fallback
  const emotionTimeMap: Record<string, TimeOfDay> = {
    calm: "golden-hour",
    warmth: "golden-hour",
    wonder: "dawn",
    curiosity: "morning",
    excitement: "noon",
    playful: "afternoon",
    tension: "dusk",
    fear: "night",
    hope: "dawn",
    triumph: "golden-hour",
    joy: "afternoon",
    magical: "dusk",
    dramatic: "night",
    action: "noon",
    tense: "dusk",
    triumphant: "golden-hour",
    emotional: "golden-hour",
  };

  return emotionTimeMap[emotion] || "afternoon";
}

/* ── Mood Mapping ── */

function inferLightingMood(emotion: string, intensity: number, act?: number): LightingMood {
  const moodMap: Record<string, LightingMood> = {
    calm: "serene",
    warmth: "warm-safe",
    wonder: "whimsical",
    curiosity: "adventurous",
    excitement: "playful",
    playful: "playful",
    tension: "dramatic",
    fear: "mysterious",
    hope: "warm-safe",
    triumph: "triumphant",
    triumphant: "triumphant",
    joy: "playful",
    magical: "whimsical",
    dramatic: "dramatic",
    action: "epic",
    tense: "dramatic",
    emotional: "melancholy",
  };

  let mood = moodMap[emotion] || "warm-safe";

  // Act-based adjustments
  if (act === 1 && mood === "dramatic") mood = "adventurous";
  if (act === 3 && intensity < 0.4) mood = "warm-safe";
  if (intensity > 0.8) {
    if (mood === "playful") mood = "epic";
    if (mood === "serene") mood = "warm-safe";
  }

  return mood;
}

function classifyIntensity(value: number): EmotionalIntensity {
  if (value <= 0.25) return "gentle";
  if (value <= 0.55) return "moderate";
  if (value <= 0.80) return "intense";
  return "climactic";
}

/* ── 3-Point Lighting Generator ── */

interface LightColor {
  description: string;
  temperature: "warm" | "neutral" | "cool";
}

const TIME_KEY_LIGHTS: Record<TimeOfDay, LightColor> = {
  dawn:          { description: "soft peach-pink directional light from low east", temperature: "warm" },
  morning:       { description: "clean warm directional sunlight from east", temperature: "warm" },
  noon:          { description: "strong overhead sunlight with hard shadows", temperature: "neutral" },
  afternoon:     { description: "warm angled sunlight from the west", temperature: "warm" },
  "golden-hour": { description: "rich golden directional key light at low angle", temperature: "warm" },
  dusk:          { description: "deep amber-purple directional light from horizon", temperature: "warm" },
  night:         { description: "cool silver moonlight from above-left", temperature: "cool" },
  midnight:      { description: "faint blue-silver moonlight with deep shadows", temperature: "cool" },
};

const ENV_FILL_MODIFIERS: Record<EnvironmentType, string> = {
  forest:     "dappled green-tinted light filtering through canopy",
  ocean:      "cool reflected caustic light bouncing off water surface",
  cave:       "minimal ambient fill, warm torch-like bounce from walls",
  city:       "mixed artificial light fill from buildings and streetlights",
  bedroom:    "soft warm lamp glow fill from bedside",
  castle:     "warm candlelight fill with stone wall reflections",
  space:      "blue-white starfield ambient with no fill bounce",
  desert:     "intense warm scattered fill from sand reflections",
  mountain:   "cool crisp atmosphere with subtle blue fill",
  underwater: "aquamarine diffuse ambient with caustic patterns",
  meadow:     "soft green-reflected fill from grass below",
  village:    "warm mixed interior/exterior fill light",
  classroom:  "flat fluorescent overhead with soft window side-fill",
  sky:        "bright omnidirectional sky fill with cloud softbox",
  generic:    "soft neutral ambient fill light",
};

const MOOD_RIM_STYLES: Record<LightingMood, string> = {
  "warm-safe":   "gentle warm golden rim light for cozy edge separation",
  mysterious:    "cool blue-purple rim light creating ethereal edges",
  adventurous:   "vibrant warm-white rim light with strong edge definition",
  triumphant:    "bright radiant golden rim light, hero backlighting",
  melancholy:    "soft diffused cool rim light, subtle edge glow",
  whimsical:     "pastel rainbow-tinted rim light, magical edge shimmer",
  dramatic:      "sharp high-contrast cold rim light, stark silhouette edges",
  serene:        "barely visible soft warm rim light, peaceful separation",
  playful:       "bright cheerful rim light with slight color variation",
  epic:          "intense hard rim light with atmospheric flare",
};

/* ── Volumetric & Atmospheric Systems ── */

function buildVolumetrics(env: EnvironmentType, time: TimeOfDay, mood: LightingMood, kidsMode: boolean): string {
  const base: string[] = [];

  // Environment-specific
  const envVol: Record<string, string> = {
    forest:     "soft volumetric sunbeams filtering through tree canopy",
    cave:       "faint volumetric torch smoke and dust particles",
    space:      "cosmic nebula glow with subtle star fog",
    ocean:      "misty sea spray with light scattering",
    underwater: "underwater light caustics and suspended particles",
    mountain:   "thin mountain mist with crisp light shafts",
    desert:     "heat shimmer with fine sand particles in air",
    meadow:     "gentle pollen-filled air with diffused light scatter",
    sky:        "volumetric cloud formations with god rays",
  };
  if (envVol[env]) base.push(envVol[env]);

  // Time-specific
  if (time === "dawn" || time === "golden-hour") base.push("golden volumetric light rays");
  if (time === "night" || time === "midnight") base.push("subtle moonlit volumetric haze");
  if (time === "noon") base.push("bright atmospheric light scatter");

  // Mood-specific
  if (mood === "whimsical") base.push("sparkling magical particle effects");
  if (mood === "dramatic") base.push("dramatic volumetric shafts of light");
  if (mood === "mysterious") base.push("thin eerie fog with scattered light");
  if (mood === "epic") base.push("massive volumetric god rays, atmospheric scale");

  // Kids safety — keep all volumetrics soft
  if (kidsMode) {
    return base.length > 0
      ? `soft ${base.join(", ")}, child-friendly atmosphere`
      : "gentle soft atmospheric haze, warm and inviting";
  }

  return base.length > 0 ? base.join(", ") : "subtle atmospheric light scatter";
}

function buildSubsurfaceScattering(mood: LightingMood, kidsMode: boolean): string {
  if (kidsMode) {
    return "Pixar-style subsurface scattering on character skin, soft warm translucency on ears and hands, gentle glowing quality";
  }

  const sssMap: Record<LightingMood, string> = {
    "warm-safe":   "warm subsurface scattering on skin, soft pink translucency",
    mysterious:    "cool subsurface scattering, ethereal skin glow",
    adventurous:   "healthy warm subsurface scattering, sun-kissed skin",
    triumphant:    "radiant subsurface scattering, golden skin warmth",
    melancholy:    "subtle cool-toned subsurface scattering, pale translucency",
    whimsical:     "magical subsurface scattering with faint sparkle, Pixar-quality skin",
    dramatic:      "high-contrast subsurface scattering, deep shadow/warm highlight",
    serene:        "gentle barely-visible subsurface scattering, natural skin quality",
    playful:       "vibrant warm subsurface scattering, cheerful skin glow",
    epic:          "cinematic subsurface scattering with rim-light bleed through ears",
  };

  return sssMap[mood] || "natural subsurface scattering on character skin";
}

function buildDepthFog(env: EnvironmentType, time: TimeOfDay, intensity: EmotionalIntensity): string {
  const depthMod: Record<EnvironmentType, string> = {
    forest:     "layered depth fog between trees showing scale",
    ocean:      "sea mist fading to soft horizon",
    cave:       "thick close-range fog obscuring distant cave walls",
    city:       "urban haze with streetlight glow at distance",
    bedroom:    "minimal depth fog, cozy intimate space",
    castle:     "dusty atmosphere with stone-filtered depth",
    space:      "nebula depth gradient with star field falloff",
    desert:     "heat distortion haze at distance",
    mountain:   "crisp mountain atmosphere with valley fog",
    underwater: "deep ocean gradient, darker with depth",
    meadow:     "gentle morning mist at ground level",
    village:    "chimney smoke mixing into soft distance fog",
    classroom:  "minimal atmosphere, clean indoor space",
    sky:        "cloud layers creating natural depth",
    generic:    "subtle atmospheric perspective",
  };

  const base = depthMod[env] || "subtle atmospheric perspective";

  // Intensity affects density
  if (intensity === "climactic") return `dense dramatic ${base}`;
  if (intensity === "intense") return `noticeable ${base}`;
  if (intensity === "gentle") return `barely visible ${base}`;
  return base;
}

function buildBounceLight(env: EnvironmentType, time: TimeOfDay): string {
  const envBounce: Record<string, string> = {
    forest: "green-tinted bounce light from forest floor and foliage",
    ocean: "blue-white caustic bounce from water reflections",
    cave: "orange-warm bounce from torchlit stone walls",
    desert: "golden sand-reflected bounce light from below",
    meadow: "soft green upward bounce from sunlit grass",
    underwater: "cyan caustic bounce from sandy seabed",
    classroom: "soft neutral bounce from white walls",
    castle: "warm amber bounce from flagstone floors",
  };

  if (envBounce[env]) return envBounce[env];

  // Time-based fallback
  if (time === "golden-hour" || time === "dusk") return "warm golden bounce light from illuminated surroundings";
  if (time === "night" || time === "midnight") return "cool reflected moonlight bounce from nearby surfaces";
  return "natural indirect bounce lighting from environment";
}

function buildColorTemperature(time: TimeOfDay, mood: LightingMood, kidsMode: boolean): string {
  if (kidsMode) {
    // Kids always get warm-leaning temperature
    if (time === "night" || time === "midnight") return "cool moonlit tones balanced with warm safe ambient";
    return "warm inviting color temperature, 4500K–5500K feel";
  }

  const tempMap: Record<TimeOfDay, string> = {
    dawn:          "soft warm peach-pink, ~3500K color temperature",
    morning:       "clean warm daylight, ~5000K balanced",
    noon:          "neutral bright daylight, ~5600K",
    afternoon:     "warm gold-leaning, ~4800K",
    "golden-hour": "rich golden warmth, ~3200K amber tones",
    dusk:          "deep warm amber transitioning to cool purple, ~3000K",
    night:         "cool blue-silver, ~7500K moonlight",
    midnight:      "deep cold blue, ~9000K sparse illumination",
  };

  return tempMap[time] || "balanced natural color temperature";
}

function buildDynamicRange(mood: LightingMood, intensity: EmotionalIntensity): string {
  if (intensity === "climactic") return "extreme high dynamic range, bright highlights with rich deep shadows";
  if (mood === "dramatic" || mood === "epic") return "high dynamic range, cinematic contrast ratio";
  if (mood === "serene" || mood === "warm-safe") return "compressed dynamic range, soft shadows, gentle highlights";
  if (mood === "whimsical") return "medium dynamic range, balanced with pastel smoothness";
  return "natural dynamic range, film-quality tonal mapping";
}

function buildSpecularHighlights(env: EnvironmentType, mood: LightingMood): string {
  const specMap: Record<string, string> = {
    ocean: "bright specular water highlights, glinting wave crests",
    underwater: "soft caustic specular on character surfaces",
    cave: "sharp specular on wet cave walls and crystal formations",
    space: "pinpoint star specular, metallic surface reflections",
    castle: "warm specular on polished armor and stone",
  };

  if (specMap[env]) return specMap[env];

  if (mood === "whimsical") return "soft magical specular sparkle on surfaces";
  if (mood === "dramatic") return "hard sharp specular highlights, glass-like";
  if (mood === "epic") return "intense specular with lens flare hints";
  return "natural specular highlights on reflective surfaces";
}

/* ── Core API ── */

/**
 * Generate a complete lighting directive for a scene.
 *
 * Analyzes the scene description, emotion, time, environment, and intensity
 * to produce a multi-layer cinematic lighting specification.
 */
export function computeLightingDirective(input: LightingInput): LitPromptResult {
  const {
    sceneDescription,
    emotion,
    intensity: rawIntensity = 0.5,
    act,
    isKidsMode = true,
    tensionLevel,
  } = input;

  // Infer parameters
  const environment = input.environment || inferEnvironment(sceneDescription);
  const timeOfDay = input.timeOfDay || inferTimeOfDay(sceneDescription, emotion);
  const effectiveIntensity = tensionLevel ?? rawIntensity;
  const intensityClass = classifyIntensity(effectiveIntensity);
  const mood = inferLightingMood(emotion, effectiveIntensity, act);

  // Build each lighting layer
  const keyLightData = TIME_KEY_LIGHTS[timeOfDay];
  const keyLight = keyLightData.description;
  const fillLight = ENV_FILL_MODIFIERS[environment];
  const rimLight = MOOD_RIM_STYLES[mood];
  const globalIllumination = isKidsMode
    ? "soft warm global illumination, no harsh shadows, Pixar-quality ambient"
    : `cinematic global illumination matching ${timeOfDay} atmosphere`;
  const volumetrics = buildVolumetrics(environment, timeOfDay, mood, isKidsMode);
  const subsurfaceScattering = buildSubsurfaceScattering(mood, isKidsMode);
  const depthFog = buildDepthFog(environment, timeOfDay, intensityClass);
  const bounceLight = buildBounceLight(environment, timeOfDay);
  const colorTemperature = buildColorTemperature(timeOfDay, mood, isKidsMode);
  const dynamicRange = buildDynamicRange(mood, intensityClass);
  const specularHighlights = buildSpecularHighlights(environment, mood);

  // Composite prompt fragment — all layers condensed
  const promptParts: string[] = [
    globalIllumination,
    keyLight,
    rimLight,
    volumetrics,
    subsurfaceScattering,
    colorTemperature,
    dynamicRange,
  ];

  // Only add heavier layers for moderate+ intensity
  if (effectiveIntensity > 0.3) {
    promptParts.push(depthFog);
    promptParts.push(bounceLight);
  }
  if (effectiveIntensity > 0.6) {
    promptParts.push(specularHighlights);
  }

  const promptFragment = promptParts.join(", ");

  const directive: LightingDirective = {
    globalIllumination,
    keyLight,
    rimLight,
    fillLight,
    volumetrics,
    subsurfaceScattering,
    depthFog,
    bounceLight,
    colorTemperature,
    specularHighlights,
    dynamicRange,
    promptFragment,
  };

  // Enhance the original prompt
  const enhanced = `${sceneDescription.trim()}, ${promptFragment}`;

  return {
    original: sceneDescription,
    enhanced,
    directive,
    inferred: {
      timeOfDay,
      environment,
      intensity: intensityClass,
      mood,
    },
  };
}

/**
 * Quick-enhance a scene prompt with Pixar-level lighting.
 * Single-call convenience wrapper around computeLightingDirective.
 */
export function enhanceWithLighting(
  scenePrompt: string,
  emotion: string = "playful",
  options: Partial<LightingInput> = {},
): string {
  const result = computeLightingDirective({
    sceneDescription: scenePrompt,
    emotion,
    ...options,
  });
  return result.enhanced;
}

/**
 * Batch-enhance an array of scene prompts.
 * Each scene gets individually computed lighting based on its parameters.
 */
export function enhanceEpisodeLighting(
  scenes: Array<{
    prompt: string;
    emotion: string;
    act?: 1 | 2 | 3;
    tensionLevel?: number;
  }>,
  isKidsMode: boolean = true,
): LitPromptResult[] {
  return scenes.map((scene) =>
    computeLightingDirective({
      sceneDescription: scene.prompt,
      emotion: scene.emotion,
      act: scene.act,
      tensionLevel: scene.tensionLevel,
      isKidsMode,
    }),
  );
}

/**
 * Get a Pixar-preset lighting configuration for testing/preview.
 * Returns a fully formed lighting directive for the given mood + environment.
 */
export function getPixarPreset(
  mood: LightingMood,
  environment: EnvironmentType = "meadow",
  timeOfDay: TimeOfDay = "golden-hour",
): LightingDirective {
  const result = computeLightingDirective({
    sceneDescription: `A beautiful ${environment} scene`,
    emotion: mood === "warm-safe" ? "warmth" : mood,
    environment,
    timeOfDay,
    isKidsMode: true,
    intensity: 0.5,
  });
  return result.directive;
}
