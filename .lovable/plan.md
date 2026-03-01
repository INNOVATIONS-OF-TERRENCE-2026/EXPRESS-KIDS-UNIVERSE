

# PWA Brand Fix, QA Stabilization, Launch Screen & Theme Polish

This plan covers all requested changes in a single implementation pass, organized into 5 parts.

---

## Part 1: PWA Icon Correction

**Problem:** PWA install icons reference placeholder `icon-192.png` / `icon-512.png` files, not the actual Express Kids Studios logo.

**Solution:**
- Copy the uploaded Express Kids Studios logo (`user-uploads://80A255DA-343F-4A1C-A726-465FFF98C336.PNG`) to `public/pwa-icons/expresskids-512.png`
- Create resized variants by copying the same image for `expresskids-192.png` and `apple-touch-icon.png` (the browser will scale; perfect at 512)
- For the maskable version, we cannot run `sharp` in Lovable, so we copy the same logo to `expresskids-512-maskable.png` (it already has sufficient safe zone padding given the circular logo shape)
- Update `vite.config.ts` manifest section:
  - `short_name`: "Express Kids" (not "EKU")
  - `name`: "Express Kids Studios"
  - `background_color`: "#0e1026"
  - `theme_color`: "#6c5ce7"
  - Icon paths point to `/pwa-icons/expresskids-*` files
- Update `index.html`:
  - `<link rel="apple-touch-icon" href="/pwa-icons/apple-touch-icon.png">`
  - `<meta name="theme-color" content="#6c5ce7">`
  - Remove old favicon link references to `favicon-16x16.png` / `favicon-32x32.png` if present
- Update `vite.config.ts` `includeAssets` to reference new paths

**Files:** `vite.config.ts`, `index.html`, new `public/pwa-icons/` assets (4 files, all copies of the uploaded logo)

---

## Part 2: QA & Bug Fixes

**Issue found:** Console warning -- `BrandLogo` is a `memo` component that cannot receive refs. The `Footer` component renders it and something passes a ref.

**Fix:** This is a React warning about `memo` + refs. The `BrandLogo` component is wrapped in `memo()` but likely receives a ref from a parent. We will verify and either add `forwardRef` to `BrandLogo` or remove the ref usage.

**Other checks:**
- Verify all routes exist and match components (already confirmed -- all routes are wired in `App.tsx`)
- OAuth denylist in service worker config already covers `/~oauth/`, `/oauth/`, `/auth/`, `/callback/`, `/signin/`, `/login/` -- this is correct
- `brand.shortName` is used as "EKU" in a few places -- update to "Express Kids" where user-facing (PwaInstallButton shows `brand.shortName`)

**Files:** `src/components/eku/BrandLogo.tsx` (minor fix), `src/lib/brand.ts` (update shortName)

---

## Part 3: Custom Launch Screen Component

**What:** Create a cinematic splash screen that displays on PWA launch before the app loads.

**Implementation:**
- The existing `StudioIntro` component already serves this exact purpose -- it shows a full-screen cinematic intro with the logo, star field, orbital ring, and fade-out on first session load
- Update `StudioIntro.tsx` minimally:
  - Use `background_color` matching manifest (`#0e1026`) as the base color
  - Ensure the splash background gradient uses `#0e1026` as the deepest dark tone so there is zero white flash between PWA splash and app render

**Files:** `src/components/StudioIntro.tsx` (minor background color tweak)

---

## Part 4: Theme Modal Polish

The `ThemeModal` already has:
- X close button (top-right, line 388-395)
- ESC key closes (line 259-263, and global handler line 341-348)
- Click outside closes (overlay onClick, line 364-366)
- Focus trap (Tab/Shift+Tab, lines 266-285)
- Body scroll lock (lines 319-327)
- Bottom sheet on mobile with drag handle (line 374-376)
- GPU-only animations (all CSS keyframes use transform + opacity)

**Missing: Auto-close on theme select.** Currently selecting a theme does NOT close the modal.

**Fix:**
- Update `handleSetTheme` in `ThemeModal.tsx` to call `onClose()` after a short delay (300ms) so the user sees the selection feedback before the panel closes
- Same for mode toggle -- when toggling AI/Seasonal, close after brief delay

**Files:** `src/components/ThemeModal.tsx`

---

## Part 5: PWA Install Experience Polish

The `PwaInstallButton` already has:
- Dropdown with blur backdrop and shadow elevation
- translateY animation (lines 208-211)
- Click outside close (lines 83-102)
- ESC close (line 94)
- `aria-expanded` and `aria-haspopup` (lines 188-189)

**Enhancement:**
- Add a subtle cinematic glow outline on hover to the dropdown container
- Add soft backdrop-filter blur to the dropdown

**Files:** `src/components/eku/PwaInstallButton.tsx` (minor style enhancement)

---

## Implementation Order

1. Copy uploaded logo to `public/pwa-icons/` (4 asset copies)
2. Update `vite.config.ts` (manifest icons, name, colors)
3. Update `index.html` (apple-touch-icon path, theme-color)
4. Update `src/lib/brand.ts` (shortName fix)
5. Fix `BrandLogo.tsx` ref warning
6. Update `StudioIntro.tsx` background color
7. Update `ThemeModal.tsx` (auto-close on select)
8. Polish `PwaInstallButton.tsx` dropdown styles

## Files Changed Summary

| File | Change |
|------|--------|
| `public/pwa-icons/expresskids-192.png` | New -- brand logo copy |
| `public/pwa-icons/expresskids-512.png` | New -- brand logo copy |
| `public/pwa-icons/expresskids-512-maskable.png` | New -- brand logo copy |
| `public/pwa-icons/apple-touch-icon.png` | New -- brand logo copy |
| `vite.config.ts` | Manifest icons, name, colors |
| `index.html` | Apple touch icon path, theme-color |
| `src/lib/brand.ts` | shortName update |
| `src/components/eku/BrandLogo.tsx` | Fix ref warning |
| `src/components/StudioIntro.tsx` | Background color match |
| `src/components/ThemeModal.tsx` | Auto-close on theme select |
| `src/components/eku/PwaInstallButton.tsx` | Dropdown glow polish |

