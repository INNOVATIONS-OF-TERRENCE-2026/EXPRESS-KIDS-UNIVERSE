

# Express Kids Universe - Comprehensive Update Plan

This plan covers 6 major features in a single implementation pass. Here's everything that will be done:

---

## 1. Logo Replacement - Express Kids Universe Branding

**What changes:**
- Copy the uploaded Express Kids Universe logo image to `public/brand/express-kids-universe-logo.png`
- Create a branding config at `src/lib/brand.ts` with logo paths, brand name, and alt text
- Update `LogoBrand.tsx` component to use the new logo instead of `/logo.png` and `/eku-icon.svg`
- Update `GlassNav.tsx`: Replace "EKU" text with the logo image, sized appropriately (max-height ~36px desktop, ~32px mobile), with `object-contain` and no forced circular clipping
- Update `Landing.tsx`: Hero logo uses new asset, footer text updated to "Express Kids Universe"
- Update `Auth.tsx`: Logo on auth card uses new asset
- Update `NotFound.tsx`: Logo uses new asset
- Update `PosterPreviewCard.tsx`: "EKU Original" badge text changed to "EKU Original" (kept as short badge)
- Update `index.html`: `apple-mobile-web-app-title` from "EKU" to "Express Kids Universe"
- All logo `<img>` tags include `onError` fallback to `/eku-icon.svg`

**Files changed:** `LogoBrand.tsx`, `GlassNav.tsx`, `Landing.tsx`, `Auth.tsx`, `NotFound.tsx`, `index.html`, new `src/lib/brand.ts`, new `public/brand/express-kids-universe-logo.png`

---

## 2. Disable Email Verification (Auto-Confirm Signups)

**What changes:**
- Configure auth to enable auto-confirm for email signups so users can immediately access the app after registration
- Update `Auth.tsx`: On successful signup, auto-redirect to `/create` instead of showing "Check your email" message
- The `useAuth.tsx` hook already handles sessions correctly via `onAuthStateChange`, so no changes needed there

**Files changed:** Auth configuration (configure-auth tool), `Auth.tsx`

---

## 3. Executive Leadership Integration

**What changes:**
- Create a new `/leadership` page (`src/pages/Leadership.tsx`) with elegant glass-card layout showing:
  - Terrence Milliner Sr. -- Founder, Engineer & CEO (primary, largest card)
  - Gloria Milliner -- President
  - Terrence Milliner Jr. -- Vice President
  - Tiara Smith -- CFO
- Add a refined footer line across all pages via the `Landing.tsx` footer:
  - "Founded & Engineered by Terrence Milliner Sr."
  - Subtle microtext for other leadership
  - Also reference "Milliner's Helping the Youth Foundation"
- Add footer to other pages that currently lack one (Gallery, ParentControls, etc.) or add a shared footer component
- Update `index.html` meta to include "Founded by Terrence Milliner Sr." in description
- Add Leadership link to footer navigation
- Add route in `App.tsx`

**Files changed:** New `src/pages/Leadership.tsx`, `Landing.tsx` (footer), `App.tsx` (route), `index.html` (meta), new `src/components/eku/Footer.tsx` (shared footer)

---

## 4. Sound Effects & Ambient Audio

**What changes:**
- Create an audio system using static bundled audio files (no external API needed for basic SFX)
- Create `src/lib/audio.ts` with an `AudioManager` class:
  - Pre-defined sound effects: button click, page transition, success, error, magic sparkle
  - Ambient background track (subtle cosmic/magical loop)
  - Respects the `soundEnabled` setting from ParentSettings in localStorage
  - Respects `reducedMotion` for volume adjustments
  - Volume controls and mute toggle
- Create audio assets using Web Audio API for synthesized sounds (no external files needed):
  - Button hover/click: soft chime
  - Success: ascending sparkle tone
  - Error: gentle low tone
  - Page transition: whoosh
  - Ambient: low-frequency cosmic drone (generated procedurally)
- Integrate audio hooks into:
  - `CinematicButton.tsx`: Click sound on press
  - `PageTransition.tsx`: Transition sound
  - `CreateStatus.tsx`: Success/failure sounds
  - `GlassNav.tsx`: Ambient audio toggle button in nav
- The existing Parent Controls toggle for "Sound Effects" already saves to localStorage -- wire it up to the AudioManager

**Files changed:** New `src/lib/audio.ts`, new `src/hooks/useAudio.ts`, `CinematicButton.tsx`, `GlassNav.tsx`

---

## 5. Read Aloud (AI Text-to-Speech)

**What changes:**
- Create a new edge function `supabase/functions/text-to-speech/index.ts` that:
  - Accepts story text and uses Lovable AI gateway for TTS (or falls back to Web Speech API on client)
  - Since Lovable AI models don't include TTS, implement client-side Web Speech API (`speechSynthesis`) as the primary approach -- no external API key needed
- Add a "Read Aloud" button to `AdventureResults.tsx`:
  - Uses the browser's built-in `speechSynthesis` API
  - Play/pause/stop controls
  - Highlights current paragraph being read
  - Speed control (0.75x, 1x, 1.25x)
  - Respects sound enabled setting from parent controls
- Create `src/hooks/useSpeechSynthesis.ts` hook for managing playback state

**Files changed:** New `src/hooks/useSpeechSynthesis.ts`, `AdventureResults.tsx`

---

## 6. Google Sign-In

**What changes:**
- Use the Lovable Cloud managed Google OAuth (no API key needed)
- Configure social auth via the configure-social-auth tool to generate the lovable module
- Update `Auth.tsx` to add a "Sign in with Google" button using `lovable.auth.signInWithOAuth("google", ...)`
- Add a visual separator ("or continue with email") between Google and email auth
- Import from `@/integrations/lovable/index`

**Files changed:** Social auth configuration (tool), `Auth.tsx`

---

## Implementation Order

1. Logo replacement (asset copy + branding config + component updates)
2. Auth: disable email verification + Google Sign-In setup
3. Update Auth.tsx (signup redirect fix + Google button)
4. Executive Leadership page + shared footer component
5. Audio system (synthesized SFX + hooks)
6. Read Aloud feature (Web Speech API)
7. Route updates in App.tsx

## Summary of All New Files
- `public/brand/express-kids-universe-logo.png`
- `src/lib/brand.ts`
- `src/pages/Leadership.tsx`
- `src/components/eku/Footer.tsx`
- `src/lib/audio.ts`
- `src/hooks/useAudio.ts`
- `src/hooks/useSpeechSynthesis.ts`

## Summary of Modified Files
- `src/components/eku/LogoBrand.tsx`
- `src/components/eku/GlassNav.tsx`
- `src/components/eku/CinematicButton.tsx`
- `src/components/eku/PosterPreviewCard.tsx`
- `src/pages/Landing.tsx`
- `src/pages/Auth.tsx`
- `src/pages/NotFound.tsx`
- `src/pages/AdventureResults.tsx`
- `src/pages/Gallery.tsx`
- `src/pages/ParentControls.tsx`
- `src/pages/Privacy.tsx`
- `src/pages/Terms.tsx`
- `src/App.tsx`
- `index.html`

