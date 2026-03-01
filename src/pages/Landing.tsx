import { lazy, Suspense } from "react";
import { CosmicDust } from "@/components/eku";
import { Footer } from "@/components/eku/Footer";
import { HeroSection } from "@/components/landing/HeroSection";

/* ── Lazy-load heavy sections below the fold ─────────────── */
const FeatureUniverseSection = lazy(() =>
  import("@/components/landing/FeatureUniverseSection").then((m) => ({ default: m.FeatureUniverseSection }))
);
const StudioProSection = lazy(() =>
  import("@/components/landing/StudioProSection").then((m) => ({ default: m.StudioProSection }))
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

      {/* 3 — Studio Pro Pipeline */}
      <Suspense fallback={<SectionFallback />}>
        <StudioProSection />
      </Suspense>

      {/* 4 — Pricing */}
      <Suspense fallback={<SectionFallback />}>
        <PricingSection />
      </Suspense>

      {/* 5 — SEO Creator Suite */}
      <Suspense fallback={<SectionFallback />}>
        <SeoSection />
      </Suspense>

      {/* 6 — Theme Showcase */}
      <Suspense fallback={<SectionFallback />}>
        <ThemeShowcaseSection />
      </Suspense>

      {/* 7 — Parent Trust */}
      <Suspense fallback={<SectionFallback />}>
        <ParentTrustSection />
      </Suspense>

      {/* 8 — Gallery Preview */}
      <Suspense fallback={<SectionFallback />}>
        <GalleryPreviewSection />
      </Suspense>

      {/* 9 — Final CTA */}
      <Suspense fallback={<SectionFallback />}>
        <FinalCtaSection />
      </Suspense>

      {/* Footer */}
      <Footer />
    </div>
  );
}
