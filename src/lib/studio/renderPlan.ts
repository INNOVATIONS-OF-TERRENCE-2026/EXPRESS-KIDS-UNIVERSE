/**
 * renderPlan.ts — Produces a RenderPlan for downstream renderers
 *
 * A RenderPlan is the bridge between the Episode data model and the
 * visual rendering layer (WebGL, server-side renderer, or export pipeline).
 *
 * A RenderPlan includes:
 *   - Asset references (backgrounds, character sprites, UI elements)
 *   - Camera movements for each shot
 *   - Parallax layer configurations
 *   - Animation cue timecodes
 *   - Color grading / mood overlays
 */

import type { Episode, Scene, Shot, CameraMove } from "./episodeSchema";

/** A visual layer in the render stack */
export interface RenderLayer {
  id: string;
  type: "background" | "midground" | "character" | "foreground" | "ui" | "effect";
  assetRef: string;
  /** Depth for parallax (0 = back, 1 = front) */
  depth: number;
  /** Initial position (normalized 0–1) */
  position: { x: number; y: number };
  /** Scale factor */
  scale: number;
  /** Opacity (0–1) */
  opacity: number;
}

/** Animation instruction for a render layer */
export interface RenderAnimation {
  layerId: string;
  property: "position" | "scale" | "opacity" | "rotation";
  from: number | { x: number; y: number };
  to: number | { x: number; y: number };
  startSec: number;
  durationSec: number;
  easing: string;
}

/** Color grading overlay for mood */
export interface ColorGrade {
  /** HSL overlay color */
  hue: number;
  saturation: number;
  lightness: number;
  /** Blend opacity 0–1 */
  opacity: number;
}

/** A complete render instruction set for one shot */
export interface ShotRenderPlan {
  shotId: string;
  sceneId: string;
  layers: RenderLayer[];
  animations: RenderAnimation[];
  camera: CameraMove;
  colorGrade: ColorGrade;
  /** Subtitle / dialogue overlay text */
  subtitles: Array<{ text: string; startSec: number; durationSec: number }>;
}

/** The full render plan for an episode */
export interface RenderPlan {
  episodeId: string;
  title: string;
  totalDurationSec: number;
  /** Resolution target */
  resolution: { width: number; height: number };
  /** Frames per second target */
  fps: number;
  /** Ordered shot render plans */
  shots: ShotRenderPlan[];
  /** Global asset manifest for preloading */
  assetManifest: Array<{ ref: string; type: "image" | "audio" | "sprite" | "font" }>;
}

/** Mood → color grade mapping */
const MOOD_GRADES: Record<string, ColorGrade> = {
  adventurous: { hue: 35, saturation: 60, lightness: 50, opacity: 0.08 },
  calm: { hue: 200, saturation: 40, lightness: 60, opacity: 0.06 },
  tense: { hue: 0, saturation: 50, lightness: 30, opacity: 0.1 },
  magical: { hue: 280, saturation: 70, lightness: 55, opacity: 0.08 },
  playful: { hue: 45, saturation: 80, lightness: 60, opacity: 0.06 },
  emotional: { hue: 240, saturation: 40, lightness: 45, opacity: 0.08 },
  triumphant: { hue: 50, saturation: 90, lightness: 55, opacity: 0.1 },
};

function buildShotLayers(shot: Shot, scene: Scene): RenderLayer[] {
  const layers: RenderLayer[] = [];

  // Background layer
  layers.push({
    id: `${shot.id}_bg`,
    type: "background",
    assetRef: shot.backgroundRef ?? `scene_${scene.number}_bg`,
    depth: 0,
    position: { x: 0.5, y: 0.5 },
    scale: 1,
    opacity: 1,
  });

  // Parallax midground
  if (shot.parallaxLayers?.length) {
    shot.parallaxLayers.forEach((ref, i) => {
      layers.push({
        id: `${shot.id}_parallax_${i}`,
        type: "midground",
        assetRef: ref,
        depth: 0.2 + i * 0.15,
        position: { x: 0.5, y: 0.5 },
        scale: 1,
        opacity: 0.8,
      });
    });
  } else {
    // Default midground layer
    layers.push({
      id: `${shot.id}_mid`,
      type: "midground",
      assetRef: `scene_${scene.number}_mid`,
      depth: 0.3,
      position: { x: 0.5, y: 0.5 },
      scale: 1,
      opacity: 0.6,
    });
  }

  // Character layers
  shot.characterIds.forEach((charId, i) => {
    const xPos = shot.characterIds.length > 1
      ? 0.3 + (i / (shot.characterIds.length - 1)) * 0.4
      : 0.5;
    layers.push({
      id: `${shot.id}_char_${charId}`,
      type: "character",
      assetRef: `char_${charId}`,
      depth: 0.6 + i * 0.05,
      position: { x: xPos, y: 0.6 },
      scale: 1,
      opacity: 1,
    });
  });

  // Foreground atmosphere
  layers.push({
    id: `${shot.id}_fg`,
    type: "foreground",
    assetRef: `scene_${scene.number}_fg`,
    depth: 0.9,
    position: { x: 0.5, y: 0.5 },
    scale: 1,
    opacity: 0.3,
  });

  return layers;
}

function buildShotAnimations(shot: Shot, layers: RenderLayer[]): RenderAnimation[] {
  const anims: RenderAnimation[] = [];

  // Parallax drift on background
  const bgLayer = layers.find((l) => l.type === "background");
  if (bgLayer && shot.camera.type === "pan") {
    anims.push({
      layerId: bgLayer.id,
      property: "position",
      from: shot.camera.from ?? { x: 0.5, y: 0.5, z: 0 },
      to: shot.camera.to ?? { x: 0.6, y: 0.5, z: 0 },
      startSec: shot.timing.startSec,
      durationSec: shot.timing.durationSec,
      easing: shot.camera.easing,
    });
  }

  // Zoom effect on characters
  if (shot.camera.type === "zoom") {
    layers.filter((l) => l.type === "character").forEach((charLayer) => {
      anims.push({
        layerId: charLayer.id,
        property: "scale",
        from: 1,
        to: 1.15,
        startSec: shot.timing.startSec,
        durationSec: shot.timing.durationSec,
        easing: shot.camera.easing,
      });
    });
  }

  return anims;
}

/**
 * Generate a full RenderPlan from an Episode.
 */
export function generateRenderPlan(episode: Episode): RenderPlan {
  const shots: ShotRenderPlan[] = [];
  const assetSet = new Set<string>();

  episode.scenes.forEach((scene) => {
    const colorGrade = MOOD_GRADES[scene.mood] ?? MOOD_GRADES.adventurous;

    scene.shots.forEach((shot) => {
      const layers = buildShotLayers(shot, scene);
      const animations = buildShotAnimations(shot, layers);

      // Collect asset refs
      layers.forEach((l) => assetSet.add(l.assetRef));

      // Extract subtitles from dialogue
      const subtitles = shot.dialogue.map((d) => ({
        text: d.text,
        startSec: d.timing.startSec,
        durationSec: d.timing.durationSec,
      }));

      shots.push({
        shotId: shot.id,
        sceneId: scene.id,
        layers,
        animations,
        camera: shot.camera,
        colorGrade,
        subtitles,
      });
    });
  });

  const assetManifest = Array.from(assetSet).map((ref) => ({
    ref,
    type: "image" as const,
  }));

  return {
    episodeId: episode.id,
    title: episode.title,
    totalDurationSec: episode.actualDurationSec,
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    shots,
    assetManifest,
  };
}
