/**
 * seasonMemoryEngine.ts — Multi-Season Episodic Memory System
 *
 * Maintains persistent memory across episodes and seasons so that
 * characters evolve, story arcs carry forward, and the world feels
 * lived-in. Four memory layers — episode, season, character, world —
 * feed into every new story/scene generation prompt.
 *
 * Architecture:
 *   Episode Memory  →  What happened in this episode
 *   Season Memory   →  Season-level arc tracking, themes, milestones
 *   Character Memory →  Character evolution, skills, relationships
 *   World Memory    →  Persistent world-state, locations, rules
 *
 * Before generating any new episode, the engine composes a "memory
 * injection" block summarizing unresolved threads, character growth,
 * and season arc goals, to be prepended to story prompts.
 */

/* ── Types ── */

export interface EpisodeMemory {
  /** Unique episode ID */
  episodeId: string;
  /** Season this episode belongs to */
  seasonId: string;
  /** Episode number within season */
  episodeNumber: number;
  /** Short title */
  title: string;
  /** Key events that occurred */
  keyEvents: StoryEvent[];
  /** Character moments (emotional beats) */
  characterMoments: CharacterMoment[];
  /** Unresolved conflicts / cliffhangers */
  unresolvedConflicts: Conflict[];
  /** Resolved conflicts */
  resolvedConflicts: Conflict[];
  /** Lessons learned */
  lessonsLearned: string[];
  /** New items / abilities / friends introduced */
  newIntroductions: Introduction[];
  /** Emotional arc summary */
  emotionalArc: EmotionalArcSummary;
  /** Timestamp */
  createdAt: string;
}

export interface StoryEvent {
  description: string;
  significance: "minor" | "moderate" | "major" | "climactic";
  involvedCharacters: string[];
  location: string;
}

export interface CharacterMoment {
  characterName: string;
  moment: string;
  emotionalImpact: "positive" | "negative" | "neutral" | "transformative";
  growthArea: string;
}

export interface Conflict {
  id: string;
  description: string;
  type: "internal" | "interpersonal" | "external" | "mystery";
  severity: "low" | "medium" | "high";
  involvedCharacters: string[];
  resolution?: string;
}

export interface Introduction {
  type: "character" | "location" | "item" | "ability" | "concept";
  name: string;
  description: string;
  significance: "minor" | "recurring" | "major";
}

export interface EmotionalArcSummary {
  openingMood: string;
  midpointShift: string;
  closingMood: string;
  tensionPeak: number; // 0–10
  resolutionSatisfaction: number; // 0–10
}

/* ── Season Memory ── */

export interface SeasonMemory {
  seasonId: string;
  seasonNumber: number;
  /** Season title / theme */
  title: string;
  /** Overarching season theme */
  seasonTheme: string;
  /** Main season conflict */
  mainConflict: Conflict;
  /** Mid-season twist (planted or revealed) */
  midSeasonTwist: string;
  /** Finale climax description */
  finaleClimax: string;
  /** Emotional through-line */
  emotionalThroughline: string;
  /** All episodes in this season */
  episodes: EpisodeMemory[];
  /** Active recurring threads */
  recurringThreads: RecurringThread[];
  /** Season arc progress 0–100 */
  arcProgress: number;
  /** Target episode count for this season */
  targetEpisodeCount: number;
  /** Current status */
  status: "planning" | "in-progress" | "finale" | "completed";
}

export interface RecurringThread {
  id: string;
  description: string;
  introducedInEpisode: number;
  lastReferencedInEpisode: number;
  status: "active" | "dormant" | "resolved";
  payoffHint: string;
}

/* ── Character Memory ── */

export interface CharacterEvolution {
  characterName: string;
  /** Starting personality traits */
  initialTraits: string[];
  /** Current evolved traits */
  currentTraits: string[];
  /** Skills learned over episodes */
  learnedSkills: string[];
  /** Relationships formed */
  relationships: CharacterRelationship[];
  /** Key growth moments indexed by episode */
  growthTimeline: { episodeNumber: number; growth: string }[];
  /** Current emotional state */
  currentMood: string;
  /** Biggest unresolved personal challenge */
  personalChallenge: string;
}

export interface CharacterRelationship {
  otherCharacter: string;
  type: "friend" | "rival" | "mentor" | "family" | "acquaintance";
  strength: number; // 0–10
  history: string;
  introducedInEpisode: number;
}

/* ── World Memory ── */

export interface WorldMemory {
  /** Known locations */
  locations: WorldLocation[];
  /** World rules / established facts */
  worldRules: string[];
  /** Current world state (time progression, weather, etc.) */
  currentState: Record<string, string>;
  /** Items and objects of significance */
  significantItems: { name: string; owner: string; status: string }[];
}

export interface WorldLocation {
  name: string;
  description: string;
  firstAppearance: number; // episode number
  lastVisited: number;
  mood: string;
  connectedLocations: string[];
}

/* ── Memory Injection (output for prompts) ── */

export interface MemoryInjection {
  /** Summary block to prepend to story generation prompt */
  promptBlock: string;
  /** Character reminders for consistency */
  characterReminders: string[];
  /** Active threads to weave in */
  activeThreads: string[];
  /** Season arc guidance */
  seasonArcGuidance: string;
  /** Emotional continuity note */
  emotionalContinuity: string;
  /** Total word count of injection (for token budgeting) */
  wordCount: number;
}

/* ── Constants ── */

const MAX_INJECTION_WORDS = 500; // Keep prompt injection under token budget
const THREAD_DORMANT_THRESHOLD = 3; // Episodes without reference → dormant
const SEASON_ARC_ESCALATION_RATE = 0.15; // Tension increases per episode

/* ── Core Functions ── */

/**
 * Create a new season memory scaffold.
 */
export function createSeasonMemory(
  seasonNumber: number,
  title: string,
  theme: string,
  targetEpisodeCount: number = 12,
): SeasonMemory {
  return {
    seasonId: `season_${seasonNumber}_${Date.now()}`,
    seasonNumber,
    title,
    seasonTheme: theme,
    mainConflict: {
      id: `sc_${seasonNumber}`,
      description: "",
      type: "external",
      severity: "high",
      involvedCharacters: [],
    },
    midSeasonTwist: "",
    finaleClimax: "",
    emotionalThroughline: "",
    episodes: [],
    recurringThreads: [],
    arcProgress: 0,
    targetEpisodeCount,
    status: "planning",
  };
}

/**
 * Build the season arc template with escalation milestones.
 */
export function buildSeasonArc(
  season: SeasonMemory,
  mainConflict: string,
  midSeasonTwist: string,
  finaleClimax: string,
  emotionalThroughline: string,
): SeasonMemory {
  const totalEps = season.targetEpisodeCount;
  const midpoint = Math.floor(totalEps / 2);

  return {
    ...season,
    mainConflict: {
      ...season.mainConflict,
      description: mainConflict,
    },
    midSeasonTwist,
    finaleClimax,
    emotionalThroughline,
    status: "in-progress",
    recurringThreads: [
      {
        id: "main-conflict",
        description: mainConflict,
        introducedInEpisode: 1,
        lastReferencedInEpisode: 1,
        status: "active",
        payoffHint: finaleClimax,
      },
      {
        id: "mid-twist",
        description: midSeasonTwist,
        introducedInEpisode: Math.max(1, midpoint - 1),
        lastReferencedInEpisode: Math.max(1, midpoint - 1),
        status: "dormant",
        payoffHint: `Reveal around episode ${midpoint}`,
      },
    ],
  };
}

/**
 * Record an episode's memory into the season.
 */
export function recordEpisodeMemory(
  season: SeasonMemory,
  episode: EpisodeMemory,
): SeasonMemory {
  const updatedEpisodes = [...season.episodes, episode];
  const progress = Math.min(100, Math.round((updatedEpisodes.length / season.targetEpisodeCount) * 100));

  // Update recurring thread references
  const updatedThreads = season.recurringThreads.map((thread) => {
    const isReferenced = episode.keyEvents.some(
      (e) =>
        e.description.toLowerCase().includes(thread.description.toLowerCase().slice(0, 20)) ||
        episode.unresolvedConflicts.some((c) => c.id === thread.id),
    );

    if (isReferenced) {
      return { ...thread, lastReferencedInEpisode: episode.episodeNumber, status: "active" as const };
    }

    // Check if thread should go dormant
    const gap = episode.episodeNumber - thread.lastReferencedInEpisode;
    if (gap >= THREAD_DORMANT_THRESHOLD && thread.status === "active") {
      return { ...thread, status: "dormant" as const };
    }

    return thread;
  });

  // Check for resolved threads
  const finalThreads = updatedThreads.map((thread) => {
    const isResolved = episode.resolvedConflicts.some((c) => c.id === thread.id);
    return isResolved ? { ...thread, status: "resolved" as const } : thread;
  });

  // Determine season status
  let status = season.status;
  if (updatedEpisodes.length >= season.targetEpisodeCount) {
    status = "completed";
  } else if (updatedEpisodes.length >= season.targetEpisodeCount - 1) {
    status = "finale";
  }

  return {
    ...season,
    episodes: updatedEpisodes,
    recurringThreads: finalThreads,
    arcProgress: progress,
    status,
  };
}

/**
 * Build character evolution from episode memories.
 */
export function buildCharacterEvolution(
  characterName: string,
  episodes: EpisodeMemory[],
): CharacterEvolution {
  const moments = episodes
    .flatMap((ep) =>
      ep.characterMoments
        .filter((m) => m.characterName === characterName)
        .map((m) => ({ ...m, episodeNumber: ep.episodeNumber })),
    );

  const growthTimeline = moments.map((m) => ({
    episodeNumber: m.episodeNumber,
    growth: m.moment,
  }));

  const relationships: CharacterRelationship[] = [];
  const introductions = episodes.flatMap((ep) => ep.newIntroductions);
  const characterIntros = introductions.filter(
    (i) => i.type === "character" && i.name !== characterName,
  );

  for (const intro of characterIntros) {
    if (!relationships.find((r) => r.otherCharacter === intro.name)) {
      const ep = episodes.find((e) =>
        e.newIntroductions.some((i) => i.name === intro.name),
      );
      relationships.push({
        otherCharacter: intro.name,
        type: "acquaintance",
        strength: intro.significance === "major" ? 7 : intro.significance === "recurring" ? 5 : 3,
        history: intro.description,
        introducedInEpisode: ep?.episodeNumber ?? 1,
      });
    }
  }

  const learnedSkills = episodes
    .flatMap((ep) => ep.newIntroductions)
    .filter((i) => i.type === "ability")
    .map((i) => i.name);

  const positiveGrowth = moments.filter((m) => m.emotionalImpact === "positive" || m.emotionalImpact === "transformative");
  const currentTraits = [...new Set(positiveGrowth.map((m) => m.growthArea))];

  const lastEpisode = episodes[episodes.length - 1];
  const currentMood = lastEpisode?.emotionalArc.closingMood ?? "neutral";

  const unresolvedChallenges = episodes
    .flatMap((ep) => ep.unresolvedConflicts)
    .filter((c) => c.involvedCharacters.includes(characterName) && c.type === "internal");

  return {
    characterName,
    initialTraits: [],
    currentTraits,
    learnedSkills,
    relationships,
    growthTimeline,
    currentMood,
    personalChallenge: unresolvedChallenges[0]?.description ?? "",
  };
}

/**
 * Build world memory from all episodes.
 */
export function buildWorldMemory(episodes: EpisodeMemory[]): WorldMemory {
  const locationMap = new Map<string, WorldLocation>();
  const worldRules: string[] = [];
  const items: { name: string; owner: string; status: string }[] = [];

  for (const ep of episodes) {
    // Collect locations from events
    for (const event of ep.keyEvents) {
      if (event.location && !locationMap.has(event.location)) {
        locationMap.set(event.location, {
          name: event.location,
          description: `Introduced in Episode ${ep.episodeNumber}`,
          firstAppearance: ep.episodeNumber,
          lastVisited: ep.episodeNumber,
          mood: ep.emotionalArc.openingMood,
          connectedLocations: [],
        });
      } else if (event.location && locationMap.has(event.location)) {
        const loc = locationMap.get(event.location)!;
        loc.lastVisited = ep.episodeNumber;
      }
    }

    // Collect items
    for (const intro of ep.newIntroductions) {
      if (intro.type === "item") {
        items.push({
          name: intro.name,
          owner: ep.characterMoments[0]?.characterName ?? "unknown",
          status: "active",
        });
      }
    }

    // Collect lessons as world rules
    for (const lesson of ep.lessonsLearned) {
      if (!worldRules.includes(lesson)) {
        worldRules.push(lesson);
      }
    }
  }

  return {
    locations: Array.from(locationMap.values()),
    worldRules,
    currentState: {},
    significantItems: items,
  };
}

/* ── Memory Injection Builder ── */

/**
 * Compose a memory injection block for the next episode's generation prompt.
 *
 * This is the key function: it distills all memory layers into a compact
 * summary that can be prepended to the story generation prompt to maintain
 * continuity without blowing up the token budget.
 */
export function composeMemoryInjection(
  season: SeasonMemory,
  characterEvolutions: CharacterEvolution[],
  worldMemory: WorldMemory,
  nextEpisodeNumber: number,
): MemoryInjection {
  const lines: string[] = [];
  const characterReminders: string[] = [];
  const activeThreads: string[] = [];

  // ── Previous episode summary ──
  const lastEpisode = season.episodes[season.episodes.length - 1];
  if (lastEpisode) {
    lines.push(`PREVIOUSLY: ${summarizeEpisode(lastEpisode)}`);
  }

  // ── Active threads ──
  const active = season.recurringThreads.filter((t) => t.status === "active");
  const dormant = season.recurringThreads.filter((t) => t.status === "dormant");

  if (active.length > 0) {
    lines.push(`ONGOING THREADS: ${active.map((t) => t.description).join("; ")}`);
    activeThreads.push(...active.map((t) => t.description));
  }

  // Dormant threads that need reactivation (approaching payoff)
  for (const thread of dormant) {
    if (nextEpisodeNumber >= season.targetEpisodeCount - 2) {
      lines.push(`DORMANT THREAD (reactivate for finale): ${thread.description}`);
      activeThreads.push(`[Reactivate] ${thread.description}`);
    }
  }

  // ── Season arc guidance ──
  const arcPhase = getArcPhase(nextEpisodeNumber, season.targetEpisodeCount);
  const tensionTarget = computeTensionTarget(nextEpisodeNumber, season.targetEpisodeCount);
  const arcGuidance = buildArcGuidance(season, arcPhase, tensionTarget, nextEpisodeNumber);
  lines.push(`SEASON ARC: ${arcGuidance}`);

  // ── Character reminders ──
  for (const char of characterEvolutions) {
    const reminder = buildCharacterReminder(char, nextEpisodeNumber);
    if (reminder) {
      characterReminders.push(reminder);
      lines.push(`CHARACTER [${char.characterName}]: ${reminder}`);
    }
  }

  // ── Emotional continuity ──
  const emotionalContinuity = buildEmotionalContinuity(season, nextEpisodeNumber);
  lines.push(`EMOTIONAL TONE: ${emotionalContinuity}`);

  // ── World state ──
  if (worldMemory.locations.length > 0) {
    const recentLocations = worldMemory.locations
      .sort((a, b) => b.lastVisited - a.lastVisited)
      .slice(0, 3)
      .map((l) => l.name);
    lines.push(`WORLD: Recent locations: ${recentLocations.join(", ")}`);
  }

  // ── Unresolved conflicts from last episode ──
  if (lastEpisode && lastEpisode.unresolvedConflicts.length > 0) {
    const unresolved = lastEpisode.unresolvedConflicts.map((c) => c.description).join("; ");
    lines.push(`UNRESOLVED: ${unresolved}`);
  }

  // Build final prompt block with word budget
  let promptBlock = lines.join("\n");
  const wordCount = promptBlock.split(/\s+/).length;

  // Trim if over budget
  if (wordCount > MAX_INJECTION_WORDS) {
    promptBlock = trimToWordBudget(lines, MAX_INJECTION_WORDS);
  }

  return {
    promptBlock,
    characterReminders,
    activeThreads,
    seasonArcGuidance: arcGuidance,
    emotionalContinuity,
    wordCount: Math.min(wordCount, MAX_INJECTION_WORDS),
  };
}

/**
 * Quick helper to inject memory into an existing story prompt.
 */
export function injectMemoryIntoPrompt(
  originalPrompt: string,
  injection: MemoryInjection,
): string {
  return `[STORY MEMORY — Episode Continuity]\n${injection.promptBlock}\n\n[END MEMORY]\n\n${originalPrompt}`;
}

/* ── Internal Helpers ── */

function summarizeEpisode(ep: EpisodeMemory): string {
  const majorEvents = ep.keyEvents
    .filter((e) => e.significance === "major" || e.significance === "climactic")
    .map((e) => e.description);
  const summary = majorEvents.length > 0
    ? majorEvents.join(". ")
    : ep.keyEvents.slice(0, 2).map((e) => e.description).join(". ");

  const cliffhanger = ep.unresolvedConflicts.length > 0
    ? ` Cliffhanger: ${ep.unresolvedConflicts[0].description}`
    : "";

  return `In "${ep.title}": ${summary}.${cliffhanger}`;
}

function getArcPhase(
  episodeNumber: number,
  totalEpisodes: number,
): "setup" | "rising" | "midpoint" | "escalation" | "pre-climax" | "climax" | "resolution" {
  const pct = episodeNumber / totalEpisodes;
  if (pct <= 0.15) return "setup";
  if (pct <= 0.35) return "rising";
  if (pct <= 0.5) return "midpoint";
  if (pct <= 0.7) return "escalation";
  if (pct <= 0.85) return "pre-climax";
  if (pct <= 0.95) return "climax";
  return "resolution";
}

function computeTensionTarget(episodeNumber: number, totalEpisodes: number): number {
  const pct = episodeNumber / totalEpisodes;
  // Tension curve: low start, dip at midpoint, peak near finale
  if (pct <= 0.15) return 2 + pct * 10;
  if (pct <= 0.5) return 3 + pct * 6;
  if (pct <= 0.85) return 5 + (pct - 0.5) * 14;
  if (pct <= 0.95) return 9 + (pct - 0.85) * 10; // Peak
  return 7; // Resolution — tension drops
}

function buildArcGuidance(
  season: SeasonMemory,
  phase: string,
  tension: number,
  episodeNumber: number,
): string {
  const phaseGuides: Record<string, string> = {
    setup: `Establish the world and characters. Introduce hints of ${season.mainConflict.description || "the main conflict"}. Keep tone warm and inviting.`,
    rising: `Build momentum. Deepen character relationships. The main conflict (${season.mainConflict.description || "?"}) becomes more apparent.`,
    midpoint: `MID-SEASON TWIST: ${season.midSeasonTwist || "Reveal a surprising truth that changes everything"}. Shift the emotional tone.`,
    escalation: `Stakes are rising. Characters face harder choices. Tension target: ${tension.toFixed(1)}/10. Push toward the season climax.`,
    "pre-climax": `Everything converges. Unresolved threads come to a head. Prepare for the finale. Maximum emotional investment.`,
    climax: `SEASON CLIMAX: ${season.finaleClimax || "The ultimate challenge"}. All threads converge. Emotional peak of the season.`,
    resolution: `Wrap up remaining threads. Celebrate growth. Plant seeds for next season. Emotional through-line: ${season.emotionalThroughline || "hope and friendship"}.`,
  };

  return phaseGuides[phase] || `Episode ${episodeNumber}: Continue the story. Tension: ${tension.toFixed(1)}/10.`;
}

function buildCharacterReminder(char: CharacterEvolution, nextEpisodeNumber: number): string {
  const parts: string[] = [];

  if (char.currentTraits.length > 0) {
    parts.push(`Traits: ${char.currentTraits.slice(0, 3).join(", ")}`);
  }

  if (char.currentMood) {
    parts.push(`Current mood: ${char.currentMood}`);
  }

  if (char.personalChallenge) {
    parts.push(`Personal challenge: ${char.personalChallenge}`);
  }

  // Recent relationships
  const recentRelationships = char.relationships
    .filter((r) => r.strength >= 5)
    .slice(0, 2)
    .map((r) => `${r.type} with ${r.otherCharacter}`);

  if (recentRelationships.length > 0) {
    parts.push(`Key relationships: ${recentRelationships.join(", ")}`);
  }

  // Recent growth
  const recentGrowth = char.growthTimeline
    .filter((g) => g.episodeNumber >= nextEpisodeNumber - 2)
    .slice(-1);

  if (recentGrowth.length > 0) {
    parts.push(`Recent growth: ${recentGrowth[0].growth}`);
  }

  return parts.join(". ");
}

function buildEmotionalContinuity(season: SeasonMemory, nextEpisodeNumber: number): string {
  const lastEp = season.episodes[season.episodes.length - 1];
  if (!lastEp) {
    return `Season opener. Establish a warm, inviting tone. Through-line: ${season.emotionalThroughline || "friendship and discovery"}.`;
  }

  const closingMood = lastEp.emotionalArc.closingMood;
  const phase = getArcPhase(nextEpisodeNumber, season.targetEpisodeCount);

  if (phase === "climax") {
    return `Continue from ${closingMood} mood. Push toward emotional climax. This is the culmination of ${season.emotionalThroughline || "the season's journey"}.`;
  }

  if (phase === "resolution") {
    return `Emotional cooldown from the climax. Celebrate the journey. Close with warmth and hope.`;
  }

  return `Continue from ${closingMood} mood. Build toward ${season.emotionalThroughline || "the next emotional beat"}.`;
}

function trimToWordBudget(lines: string[], maxWords: number): string {
  let result = "";
  let wordCount = 0;

  for (const line of lines) {
    const lineWords = line.split(/\s+/).length;
    if (wordCount + lineWords > maxWords) {
      // Truncate this line to fit
      const remaining = maxWords - wordCount;
      if (remaining > 10) {
        result += line.split(/\s+/).slice(0, remaining).join(" ") + "…\n";
      }
      break;
    }
    result += line + "\n";
    wordCount += lineWords;
  }

  return result.trim();
}

/* ── Serialization ── */

/**
 * Serialize season memory for storage (e.g., Supabase JSONB column).
 */
export function serializeSeasonMemory(season: SeasonMemory): string {
  return JSON.stringify(season);
}

/**
 * Deserialize season memory from storage.
 */
export function deserializeSeasonMemory(json: string): SeasonMemory {
  return JSON.parse(json) as SeasonMemory;
}
