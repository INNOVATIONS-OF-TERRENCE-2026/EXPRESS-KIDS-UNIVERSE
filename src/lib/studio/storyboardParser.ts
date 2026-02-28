/**
 * storyboardParser.ts — Storyboard → Scene Block JSON parser
 *
 * Takes raw story text and produces structured scene blocks that
 * can be fed into the sceneEngine and audioEngine.
 *
 * The parser identifies:
 *   - Scene breaks (paragraph boundaries)
 *   - Dialogue lines (quoted text)
 *   - Action descriptions
 *   - Emotional beats
 */

export interface StoryboardBlock {
  id: string;
  type: "narration" | "dialogue" | "action" | "transition";
  text: string;
  characterName?: string;
  emotion?: string;
  /** Estimated duration in seconds for this block */
  estimatedDurationSec: number;
}

export interface StoryboardScene {
  sceneNumber: number;
  blocks: StoryboardBlock[];
  totalDurationSec: number;
}

export interface Storyboard {
  scenes: StoryboardScene[];
  totalDurationSec: number;
}

/** Average reading speed for children's content (words per minute) */
const CHILD_WPM = 120;

/** Dialogue detection regex — matches "quoted speech" */
const DIALOGUE_RE = /["""]([^"""]+)["""]/g;

function estimateDuration(text: string): number {
  const words = text.split(/\s+/).length;
  // Convert WPM to seconds per word, minimum 2 seconds per block
  return Math.max(2, (words / CHILD_WPM) * 60);
}

function generateBlockId(sceneNum: number, blockIdx: number): string {
  return `sb_s${sceneNum}_b${blockIdx}`;
}

/**
 * Parse raw story text into a structured Storyboard.
 */
export function parseStoryboard(storyText: string): Storyboard {
  const paragraphs = storyText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const scenes: StoryboardScene[] = paragraphs.map((para, sceneIdx) => {
    const blocks: StoryboardBlock[] = [];
    let remaining = para;
    let blockIdx = 0;

    // Extract dialogue blocks
    let match: RegExpExecArray | null;
    let lastEnd = 0;
    const dialogueRe = new RegExp(DIALOGUE_RE.source, "g");

    while ((match = dialogueRe.exec(remaining)) !== null) {
      // Narration before this dialogue
      const beforeText = remaining.slice(lastEnd, match.index).trim();
      if (beforeText) {
        blocks.push({
          id: generateBlockId(sceneIdx + 1, blockIdx++),
          type: "narration",
          text: beforeText,
          estimatedDurationSec: estimateDuration(beforeText),
        });
      }

      // The dialogue itself
      blocks.push({
        id: generateBlockId(sceneIdx + 1, blockIdx++),
        type: "dialogue",
        text: match[1],
        emotion: "neutral",
        estimatedDurationSec: estimateDuration(match[1]),
      });

      lastEnd = match.index + match[0].length;
    }

    // Remaining narration after last dialogue
    const afterText = remaining.slice(lastEnd).trim();
    if (afterText) {
      blocks.push({
        id: generateBlockId(sceneIdx + 1, blockIdx++),
        type: "narration",
        text: afterText,
        estimatedDurationSec: estimateDuration(afterText),
      });
    }

    // If no blocks extracted (no dialogue), whole paragraph is narration
    if (blocks.length === 0) {
      blocks.push({
        id: generateBlockId(sceneIdx + 1, 0),
        type: "narration",
        text: para,
        estimatedDurationSec: estimateDuration(para),
      });
    }

    // Add scene transition
    if (sceneIdx < paragraphs.length - 1) {
      blocks.push({
        id: generateBlockId(sceneIdx + 1, blockIdx++),
        type: "transition",
        text: "Scene transition",
        estimatedDurationSec: 1.5,
      });
    }

    const totalDurationSec = blocks.reduce((sum, b) => sum + b.estimatedDurationSec, 0);

    return {
      sceneNumber: sceneIdx + 1,
      blocks,
      totalDurationSec,
    };
  });

  return {
    scenes,
    totalDurationSec: scenes.reduce((sum, s) => sum + s.totalDurationSec, 0),
  };
}
