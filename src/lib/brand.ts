export const brand = {
  name: "Express Kids Universe",
  shortName: "EKU",
  studioName: "Express Kids Studios",
  /** Transparent SVG — no baked-in background, blends cleanly over any surface */
  logoSrc: "/eku-icon-transparent.svg",
  /** Original poster-style logo (has dark cinematic background) */
  logoPoster: "/brand/express-kids-universe-logo.png",
  logoFallback: "/eku-icon.svg",
  logoAlt: "Express Kids Universe",
  founder: "Terrence Milliner Sr.",
  founderTitle: "Founder, Engineer & CEO",
  foundation: "Milliner's Helping the Youth Foundation",
  leadership: [
    { name: "Gloria Milliner", title: "President" },
    { name: "Terrence Milliner Jr.", title: "Vice President" },
    { name: "Tiara Smith", title: "CFO" },
  ],
} as const;
