export const brand = {
  name: "Express Kids Universe",
  shortName: "EKU",
  studioName: "Express Kids Studios",
  /** Official cinematic full logo — the single brand mark for every surface */
  logoSrc: "/brand/express-kids-universe-logo.png",
  /** Alias kept for backward compat — same asset */
  logoPoster: "/brand/express-kids-universe-logo.png",
  /** Fallback points to the same official logo (no old EKS SVGs) */
  logoFallback: "/brand/express-kids-universe-logo.png",
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
