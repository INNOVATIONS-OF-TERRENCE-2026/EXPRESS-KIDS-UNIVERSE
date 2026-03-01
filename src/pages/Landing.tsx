import { lazy, Suspense } from "react";
import { CosmicDust } from "@/components/eku";
import { Footer } from "@/components/eku/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { useCinematicAudioUnlock } from "@/components/landing/CinematicSoundEngine";

/* ── Lazy-load heavy sections below the fold ─────────────── */
const FeatureUniverseSection = lazy(() =>
  import("@/components/landing/FeatureUniverseSection").then((m) => ({ default: m.FeatureUniverseSection }))
);
const EpisodeBuilderPreview = lazy(() =>
  import("@/components/landing/EpisodeBuilderPreview").then((m) => ({ default: m.EpisodeBuilderPreview }))
);
const StudioProSection = lazy(() =>
  import("@/components/landing/StudioProSection").then((m) => ({ default: m.StudioProSection }))
);
const DemoSandbox = lazy(() =>
  import("@/components/landing/DemoSandbox").then((m) => ({ default: m.DemoSandbox }))
);
const TrailerSection = lazy(() =>
  import("@/components/landing/TrailerSection").then((m) => ({ default: m.TrailerSection }))
);
const PricingSection = lazy(() =>
  import("@/components/landing/PricingSection").then((m) => ({ default: m.PricingSection }))
);
const SeoSection = lazy(() =>
  import("@/components/landing/SeoSection").then((m) => ({ default: m.SeoSection }))
);
const ThemeShowcaseSection = lazy(() =>
  import("@/components/landing/ThemeShowcaseSection").then((m) => ({ default: m.ThemeShowcaseSection }))
);
const ParentTrustSection = lazy(() =>
  import("@/components/landing/ParentTrustSection").then((m) => ({ default: m.ParentTrustSection }))
);
const GalleryPreviewSection = lazy(() =>
  import("@/components/landing/GalleryPreviewSection").then((m) => ({ default: m.GalleryPreviewSection }))
);
const FinalCtaSection = lazy(() =>
  import("@/components/landing/FinalCtaSection").then((m) => ({ default: m.FinalCtaSection }))
);

/* ── Invisible loading fallback (no layout shift) ────────── */
function SectionFallback() {
  return <div className="min-h-[40vh]" aria-hidden />;
}

/* ── Landing page ────────────────────────────────────────── */
export default function Landing() {
  /* Unlock cinematic audio on first user interaction */
  useCinematicAudioUnlock();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* 1 — Hero */}
      <HeroSection />

      {/* Ambient dust between sections */}
      <CosmicDust count={15} />

      {/* 2 — Feature Universe */}
      <Suspense fallback={<SectionFallback />}>
        <FeatureUniverseSection />
      </Suspense>

      {/* 3 — Episode Builder Preview (interactive wizard) */}
      <Suspense fallback={<SectionFallback />}>
        <EpisodeBuilderPreview />
      </Suspense>

      {/* 4 — Studio Pro Pipeline */}
      <Suspense fallback={<SectionFallback />}>
        <StudioProSection />
      </Suspense>

      {/* 5 — Demo Sandbox (try it instantly) */}
      <Suspense fallback={<SectionFallback />}>
        <DemoSandbox />
      </Suspense>

      {/* 6 — Cinematic Trailer */}
      <Suspense fallback={<SectionFallback />}>
        <TrailerSection />
      </Suspense>

      {/* 7 — Pricing */}
      <Suspense fallback={<SectionFallback />}>
        <PricingSection />
      </Suspense>

      {/* 8 — SEO Creator Suite */}
      <Suspense fallback={<SectionFallback />}>
        <SeoSection />
      </Suspense>

      {/* 9 — Theme Showcase */}
      <Suspense fallback={<SectionFallback />}>
        <ThemeShowcaseSection />
      </Suspense>

      {/* 10 — Parent Trust */}
      <Suspense fallback={<SectionFallback />}>
        <ParentTrustSection />
      </Suspense>

      {/* 11 — Gallery Preview */}
      <Suspense fallback={<SectionFallback />}>
        <GalleryPreviewSection />
      </Suspense>

      {/* 12 — Final CTA */}
      <Suspense fallback={<SectionFallback />}>
        <FinalCtaSection />
      </Suspense>

      {/* Footer */}
      <Footer />
    </div>
  );
}
