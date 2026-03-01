/**
 * arProjectionEngine.ts — AR Character Projection System
 *
 * Projects episode characters into the real world using the device
 * camera via WebXR (Android/modern browsers) with fallback to
 * AR Quick Look (iOS Safari).
 *
 * Requirements:
 *   • WebXR if supported → immersive-ar session
 *   • AR Quick Look fallback → USDZ link for iOS
 *   • Model formats: USDZ (iOS) + GLB (Android/web)
 *   • Lightweight poly count (< 50K triangles)
 *   • Compressed textures (KTX2 / WebP)
 *   • Character DNA integration for visual consistency
 *
 * Safety Rules:
 *   ✖ NO auto-record (camera access is display-only)
 *   ✖ NO camera frame storage without explicit consent
 *   ✖ NO geolocation collection
 *   ✖ NO background camera access
 *   ✔ Session ends when user leaves AR view
 *   ✔ Parent consent required for first AR use
 *
 * Interaction Modes:
 *   • Wave — character waves hello
 *   • Talk — speaks child's name (if voice clone enabled)
 *   • Dance — character dances
 *   • Say name — personalized greeting
 */

import type { CharacterDNA } from "@/lib/characterDNAEngine";

/* ── Types ── */

export type ARPlatform = "webxr" | "arkit-quicklook" | "unsupported";
export type ModelFormat = "glb" | "usdz";
export type InteractionMode = "wave" | "talk" | "dance" | "say-name";
export type ARSessionState = "idle" | "initializing" | "active" | "paused" | "ended" | "error";

export interface ARCapabilities {
  /** Detected platform */
  platform: ARPlatform;
  /** Whether WebXR immersive-ar is supported */
  webXRSupported: boolean;
  /** Whether AR Quick Look is available (iOS Safari) */
  quickLookSupported: boolean;
  /** Whether camera permission is granted */
  cameraPermissionGranted: boolean;
  /** Device type estimate */
  deviceType: "mobile" | "tablet" | "desktop";
  /** Parent consent for AR (stored locally) */
  parentConsentGiven: boolean;
}

export interface ARCharacterModel {
  /** Character identity */
  characterId: string;
  characterName: string;
  /** GLB model URL (Android / WebXR) */
  glbUrl: string | null;
  /** USDZ model URL (iOS / AR Quick Look) */
  usdzUrl: string | null;
  /** Texture URLs (compressed) */
  textureUrls: {
    diffuse: string | null;
    normal: string | null;
    roughness: string | null;
  };
  /** Polygon count */
  polyCount: number;
  /** Available animations */
  animations: ARAnimation[];
  /** Character DNA used for generation */
  dna: CharacterDNA | null;
  /** Model generation status */
  status: "pending" | "generating" | "ready" | "failed";
}

export interface ARAnimation {
  /** Animation name */
  name: InteractionMode;
  /** Duration in seconds */
  durationSec: number;
  /** Whether this animation loops */
  loop: boolean;
  /** Whether this animation requires voice data */
  requiresVoice: boolean;
}

export interface ARSession {
  /** Session ID */
  id: string;
  /** Current state */
  state: ARSessionState;
  /** Character being projected */
  character: ARCharacterModel;
  /** Active interaction */
  activeInteraction: InteractionMode | null;
  /** Platform used */
  platform: ARPlatform;
  /** Session start time */
  startedAt: string | null;
  /** Safety: auto-timeout after this many minutes */
  maxDurationMinutes: number;
  /** Safety: camera recording explicitly disabled */
  recordingDisabled: true;
  /** Safety: no geolocation */
  geolocationDisabled: true;
}

export interface ARModelGenerationRequest {
  characterId: string;
  characterName: string;
  dna: CharacterDNA;
  /** Target poly count budget */
  maxPolyCount: number;
  /** Generate USDZ variant */
  generateUsdz: boolean;
  /** Generate GLB variant */
  generateGlb: boolean;
}

export interface ARConsentRecord {
  parentUserId: string;
  childProfileId: string;
  consentGiven: boolean;
  consentTimestamp: string;
  /** What was consented to */
  scope: "ar-projection-display-only";
}

/* ── Constants ── */

const MAX_POLY_COUNT = 50000;
const MAX_SESSION_MINUTES = 30;
const TEXTURE_MAX_SIZE = 1024; // 1024x1024 max texture resolution
const AR_CONSENT_KEY = "eku_ar_consent";
const DEFAULT_ANIMATIONS: ARAnimation[] = [
  { name: "wave", durationSec: 2.5, loop: false, requiresVoice: false },
  { name: "talk", durationSec: 3.0, loop: false, requiresVoice: true },
  { name: "dance", durationSec: 5.0, loop: true, requiresVoice: false },
  { name: "say-name", durationSec: 2.0, loop: false, requiresVoice: true },
];

/* ── Platform Detection ── */

/**
 * Detect AR capabilities of the current device.
 */
export async function detectARCapabilities(): Promise<ARCapabilities> {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isMobile = /Mobi|Android/i.test(ua) || isIOS;
  const isTablet = /iPad|Tablet/i.test(ua) || (isMobile && Math.min(window.innerWidth, window.innerHeight) > 600);

  // Check WebXR support
  let webXRSupported = false;
  if ("xr" in navigator) {
    try {
      webXRSupported = await (navigator as any).xr.isSessionSupported("immersive-ar");
    } catch {
      webXRSupported = false;
    }
  }

  // Check AR Quick Look (iOS)
  const quickLookSupported = isIOS && !!document.createElement("a").relList?.supports?.("ar");

  // Camera permission check
  let cameraPermissionGranted = false;
  try {
    const perm = await navigator.permissions.query({ name: "camera" as PermissionName });
    cameraPermissionGranted = perm.state === "granted";
  } catch {
    // Permissions API not available — assume not granted
  }

  // Parent consent check
  const consentRaw = localStorage.getItem(AR_CONSENT_KEY);
  const parentConsentGiven = consentRaw ? JSON.parse(consentRaw)?.consentGiven === true : false;

  // Determine platform priority
  let platform: ARPlatform = "unsupported";
  if (webXRSupported) platform = "webxr";
  else if (quickLookSupported) platform = "arkit-quicklook";

  return {
    platform,
    webXRSupported,
    quickLookSupported,
    cameraPermissionGranted,
    deviceType: isTablet ? "tablet" : isMobile ? "mobile" : "desktop",
    parentConsentGiven,
  };
}

/**
 * Check if AR is available on this device.
 */
export function isARAvailable(caps: ARCapabilities): boolean {
  return caps.platform !== "unsupported";
}

/* ── Consent Management ── */

/**
 * Record parent consent for AR feature usage.
 */
export function grantARConsent(parentUserId: string, childProfileId: string): ARConsentRecord {
  const record: ARConsentRecord = {
    parentUserId,
    childProfileId,
    consentGiven: true,
    consentTimestamp: new Date().toISOString(),
    scope: "ar-projection-display-only",
  };
  localStorage.setItem(AR_CONSENT_KEY, JSON.stringify(record));
  return record;
}

/**
 * Revoke AR consent.
 */
export function revokeARConsent(): void {
  localStorage.removeItem(AR_CONSENT_KEY);
}

/**
 * Check if AR consent is valid.
 */
export function hasARConsent(): boolean {
  try {
    const raw = localStorage.getItem(AR_CONSENT_KEY);
    if (!raw) return false;
    const record = JSON.parse(raw) as ARConsentRecord;
    return record.consentGiven === true;
  } catch {
    return false;
  }
}

/* ── Character Model Management ── */

/**
 * Build an AR character model specification from Character DNA.
 *
 * This produces the model specification — actual 3D generation
 * happens server-side via a generation pipeline.
 */
export function buildARCharacterModel(
  characterId: string,
  characterName: string,
  dna: CharacterDNA | null,
): ARCharacterModel {
  return {
    characterId,
    characterName,
    glbUrl: null, // Set after server-side generation
    usdzUrl: null, // Set after server-side conversion
    textureUrls: {
      diffuse: null,
      normal: null,
      roughness: null,
    },
    polyCount: 0,
    animations: [...DEFAULT_ANIMATIONS],
    dna,
    status: "pending",
  };
}

/**
 * Generate a 3D model generation prompt from Character DNA.
 * Used with text-to-3D pipeline (server-side).
 */
export function buildModelGenerationPrompt(dna: CharacterDNA): string {
  const parts: string[] = [
    "Low-poly 3D character model for AR projection.",
    `Character: ${dna.name}.`,
    `Style: ${dna.animationStyleProfile?.proportions || "child"} proportions, Pixar-quality cartoon.`,
  ];

  if (dna.colorPalette) {
    parts.push(`Primary color: ${dna.colorPalette.primary}. Skin: ${dna.colorPalette.skin}. Hair: ${dna.colorPalette.hair}.`);
  }

  if (dna.eyeShape) {
    parts.push(`Eyes: ${dna.eyeShape.shape}, ${dna.eyeShape.color}.`);
  }

  if (dna.hairStyle) {
    parts.push(`Hair: ${dna.hairStyle.style}, ${dna.hairStyle.color}, ${dna.hairStyle.length} length.`);
  }

  if (dna.clothingSignature) {
    const clothes = dna.clothingSignature;
    parts.push(`Outfit: ${clothes.top || "colorful top"}, ${clothes.bottom || "pants"}.`);
    if (clothes.signatureItem) parts.push(`Signature item: ${clothes.signatureItem}.`);
  }

  parts.push(`Max ${MAX_POLY_COUNT} triangles. Rigged for animation. T-pose. Clean topology.`);
  parts.push(`Texture resolution: ${TEXTURE_MAX_SIZE}x${TEXTURE_MAX_SIZE}. Compressed KTX2 format.`);

  return parts.join(" ");
}

/**
 * Build texture generation prompts for the character.
 */
export function buildTexturePrompts(dna: CharacterDNA): {
  diffusePrompt: string;
  normalPrompt: string;
} {
  const colors = dna.colorPalette;
  return {
    diffusePrompt: [
      `Character diffuse texture map, ${TEXTURE_MAX_SIZE}x${TEXTURE_MAX_SIZE}.`,
      `Pixar-quality cartoon shading.`,
      colors ? `Skin: ${colors.skin}. Hair: ${colors.hair}. Clothing primary: ${colors.primary}, secondary: ${colors.secondary}.` : "",
      "Clean UV layout, bright saturated colors, kid-friendly.",
    ].filter(Boolean).join(" "),
    normalPrompt: `Subtle normal map for cartoon character. Soft wrinkle details on clothing. Smooth skin. ${TEXTURE_MAX_SIZE}x${TEXTURE_MAX_SIZE}.`,
  };
}

/* ── AR Session Management ── */

/**
 * Create a new AR session (does not start it — caller initiates platform session).
 */
export function createARSession(
  character: ARCharacterModel,
  platform: ARPlatform,
): ARSession {
  return {
    id: `ar_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    state: "idle",
    character,
    activeInteraction: null,
    platform,
    startedAt: null,
    maxDurationMinutes: MAX_SESSION_MINUTES,
    recordingDisabled: true,
    geolocationDisabled: true,
  };
}

/**
 * Start an AR session (WebXR path).
 *
 * Returns the session config — actual WebXR session creation
 * is handled by the React component using this config.
 */
export function startARSession(session: ARSession): ARSession {
  if (!hasARConsent()) {
    return { ...session, state: "error" };
  }

  return {
    ...session,
    state: "initializing",
    startedAt: new Date().toISOString(),
  };
}

/**
 * Trigger an interaction on the AR character.
 */
export function triggerInteraction(
  session: ARSession,
  mode: InteractionMode,
): ARSession {
  if (session.state !== "active") return session;

  const animation = session.character.animations.find((a) => a.name === mode);
  if (!animation) return session;

  // Voice-requiring animations need voice clone or TTS
  if (animation.requiresVoice) {
    // The component layer handles actual audio playback
  }

  return {
    ...session,
    activeInteraction: mode,
  };
}

/**
 * End an AR session safely.
 */
export function endARSession(session: ARSession): ARSession {
  return {
    ...session,
    state: "ended",
    activeInteraction: null,
  };
}

/**
 * Check if session has exceeded max duration.
 */
export function isSessionExpired(session: ARSession): boolean {
  if (!session.startedAt) return false;
  const elapsed = Date.now() - new Date(session.startedAt).getTime();
  return elapsed > session.maxDurationMinutes * 60 * 1000;
}

/* ── AR Quick Look (iOS) ── */

/**
 * Generate an AR Quick Look link for iOS Safari.
 *
 * Uses the <a rel="ar"> pattern that iOS Safari auto-detects.
 * The USDZ file must be pre-generated and hosted.
 */
export function buildQuickLookLink(model: ARCharacterModel): string | null {
  if (!model.usdzUrl) return null;
  return model.usdzUrl;
}

/**
 * Build the HTML anchor attributes for AR Quick Look.
 */
export function getQuickLookAttributes(model: ARCharacterModel): Record<string, string> | null {
  if (!model.usdzUrl) return null;
  return {
    rel: "ar",
    href: model.usdzUrl,
    "data-ar": "",
    "data-ar-title": model.characterName,
  };
}

/* ── WebXR Session Config ── */

/**
 * Get WebXR session configuration for immersive-ar.
 */
export function getWebXRConfig(): {
  mode: "immersive-ar";
  requiredFeatures: string[];
  optionalFeatures: string[];
} {
  return {
    mode: "immersive-ar",
    requiredFeatures: ["hit-test", "local-floor"],
    optionalFeatures: ["dom-overlay", "light-estimation"],
  };
}

/* ── Model Optimization Validation ── */

/**
 * Validate that a model meets AR performance requirements.
 */
export function validateModelForAR(model: ARCharacterModel): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (model.polyCount > MAX_POLY_COUNT) {
    issues.push(`Poly count exceeds limit: ${model.polyCount} > ${MAX_POLY_COUNT}`);
  }

  if (!model.glbUrl && !model.usdzUrl) {
    issues.push("No model file available (GLB or USDZ required)");
  }

  if (model.animations.length === 0) {
    issues.push("No animations defined");
  }

  if (model.status !== "ready") {
    issues.push(`Model not ready (status: ${model.status})`);
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Get supported interaction modes for a character model.
 */
export function getAvailableInteractions(
  model: ARCharacterModel,
  hasVoiceClone: boolean,
): InteractionMode[] {
  return model.animations
    .filter((a) => !a.requiresVoice || hasVoiceClone)
    .map((a) => a.name);
}
