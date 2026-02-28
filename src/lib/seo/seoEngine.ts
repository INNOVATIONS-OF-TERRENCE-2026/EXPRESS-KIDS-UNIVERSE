/**
 * seoEngine.ts — SEO Strategy Suite Engine
 *
 * Core service singleton that powers all 7 SEO tools.
 * localStorage-backed persistence with project-level isolation.
 *
 * Tools:
 *   1. Full SEO Strategy Builder
 *   2. Keyword Research Engine
 *   3. Intent Match Analyzer
 *   4. Competitor Structure Breakdown
 *   5. SEO Content Blueprint
 *   6. On-Page SEO Optimizer
 *   7. SEO Plan Audit
 *
 * Architecture matches existing engine pattern (profileEngine, introEngine).
 * All generation methods are deterministic algorithms — no external API calls.
 */

import type {
  SeoProject,
  SeoStrategy,
  BusinessProfile,
  KeywordPriority,
  KeywordResearch,
  KeywordCluster,
  KeywordData,
  IntentAnalysis,
  CompetitorAnalysis,
  CompetitorPage,
  ContentBlueprint,
  ContentSection,
  OnPageAudit,
  SeoPlanAudit,
  PlanAssessment,
  SeoRecommendation,
  SearchIntent,
  DifficultyLevel,
  ContentFormat,
  Priority,
  SerpFeature,
  GrowthFocus,
  ContentCalendarItem,
  FaqItem,
  SemanticKeyword,
  TitleFramework,
  InternalLinkIdea,
  HeadingStructure,
  RefinedStrategyPoint,
  TagAudit,
  HeadingAudit,
  KeywordUsageAudit,
  ReadabilityAudit,
  EngagementAudit,
  TechnicalSeoAudit,
  SeoScore,
  ContentRequirement,
} from "@/types/seo";

// ─── Constants ─────────────────────────────────────────

const STORAGE_KEY = "eku_seo_projects";
const ACTIVE_PROJECT_KEY = "eku_seo_active_project";

// ─── Helpers ───────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─── Keyword & Niche Intelligence ──────────────────────

const NICHE_KEYWORD_MAP: Record<string, string[]> = {
  default: [
    "best practices", "complete guide", "how to", "tips and tricks",
    "beginner guide", "advanced techniques", "tools", "strategies",
    "examples", "templates", "checklist", "comparison", "review",
    "tutorial", "case study", "mistakes to avoid", "framework",
  ],
  "digital marketing": [
    "SEO strategy", "content marketing", "social media marketing",
    "email marketing", "PPC advertising", "conversion optimization",
    "marketing automation", "brand awareness", "lead generation",
    "analytics dashboard", "ROI tracking", "customer acquisition",
    "influencer marketing", "growth hacking", "AB testing",
  ],
  ecommerce: [
    "product page optimization", "shopping cart abandonment",
    "checkout conversion", "product descriptions", "pricing strategy",
    "customer reviews", "inventory management", "shipping optimization",
    "payment gateway", "dropshipping", "subscription model",
    "cross-selling", "upselling", "customer retention",
  ],
  saas: [
    "onboarding flow", "user retention", "churn reduction",
    "pricing tiers", "feature comparison", "API documentation",
    "integration guide", "customer success", "product-led growth",
    "freemium model", "usage analytics", "scalability",
  ],
  "health & wellness": [
    "wellness routine", "nutrition guide", "fitness plan",
    "mental health tips", "sleep optimization", "stress management",
    "healthy recipes", "workout schedule", "supplement guide",
    "mindfulness practice", "recovery techniques",
  ],
  technology: [
    "software comparison", "tool review", "implementation guide",
    "tech stack", "architecture patterns", "performance optimization",
    "security best practices", "cloud migration", "DevOps pipeline",
    "AI integration", "automation workflow",
  ],
  education: [
    "learning platform", "online courses", "curriculum design",
    "student engagement", "assessment tools", "e-learning trends",
    "educational technology", "study techniques", "skill development",
    "certification programs", "tutoring services",
  ],
  "real estate": [
    "property listing", "home buying guide", "mortgage calculator",
    "market analysis", "investment property", "rental management",
    "staging tips", "open house strategy", "neighborhood guide",
    "first-time buyer", "property valuation",
  ],
  finance: [
    "investment strategy", "budgeting tools", "tax planning",
    "retirement planning", "savings account", "credit score",
    "financial advisor", "wealth management", "passive income",
    "portfolio diversification", "risk management",
  ],
};

const INTENT_SIGNALS: Record<SearchIntent, string[]> = {
  informational: ["how to", "what is", "guide", "tutorial", "learn", "tips", "examples", "why"],
  navigational: ["login", "sign in", "official", "website", "download", "dashboard"],
  transactional: ["buy", "purchase", "order", "pricing", "deal", "discount", "coupon", "subscribe"],
  commercial: ["best", "top", "review", "comparison", "vs", "alternative", "pros and cons"],
};

const CONTENT_FORMAT_MAP: Record<SearchIntent, ContentFormat[]> = {
  informational: ["guide", "tutorial", "blog-post", "faq-page", "pillar-page"],
  navigational: ["landing-page", "product-page"],
  transactional: ["product-page", "landing-page", "comparison"],
  commercial: ["comparison", "listicle", "case-study", "blog-post"],
};

const SERP_FEATURES: SerpFeature[] = [
  "featured-snippet", "people-also-ask", "local-pack", "knowledge-panel",
  "image-pack", "video-carousel", "shopping", "news", "sitelinks",
];

const POWER_WORDS = [
  "Ultimate", "Complete", "Essential", "Proven", "Definitive",
  "Comprehensive", "Expert", "Advanced", "Actionable", "Powerful",
  "Step-by-Step", "Insider", "Professional", "Master", "Breakthrough",
];

// ─── Engine Class ──────────────────────────────────────

class SeoEngine {
  // ─── Project Management ────────────────────────────

  getAllProjects(): SeoProject[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  getProject(id: string): SeoProject | undefined {
    return this.getAllProjects().find((p) => p.id === id);
  }

  getActiveProject(): SeoProject | undefined {
    const activeId = localStorage.getItem(ACTIVE_PROJECT_KEY);
    if (activeId) {
      const project = this.getProject(activeId);
      if (project) return project;
    }
    const all = this.getAllProjects();
    return all[0];
  }

  setActiveProject(id: string): void {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  }

  createProject(name: string, domain?: string): SeoProject {
    const project: SeoProject = {
      id: generateId("seo"),
      name,
      domain,
      strategies: [],
      keywordResearch: [],
      intentAnalyses: [],
      competitorAnalyses: [],
      contentBlueprints: [],
      onPageAudits: [],
      planAudits: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const all = this.getAllProjects();
    all.push(project);
    this.save(all);
    this.setActiveProject(project.id);
    return project;
  }

  deleteProject(id: string): boolean {
    const all = this.getAllProjects();
    const filtered = all.filter((p) => p.id !== id);
    if (filtered.length === all.length) return false;
    this.save(filtered);
    const activeId = localStorage.getItem(ACTIVE_PROJECT_KEY);
    if (activeId === id) {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
    return true;
  }

  private updateProject(id: string, updater: (p: SeoProject) => void): SeoProject | undefined {
    const all = this.getAllProjects();
    const project = all.find((p) => p.id === id);
    if (!project) return undefined;
    updater(project);
    project.updatedAt = Date.now();
    this.save(all);
    return project;
  }

  private save(projects: SeoProject[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

  // ─── 1. Full SEO Strategy Builder ─────────────────

  buildStrategy(projectId: string, profile: BusinessProfile): SeoStrategy {
    const strategy: SeoStrategy = {
      id: generateId("strat"),
      businessProfile: profile,
      keywordPriorities: this.generateKeywordPriorities(profile),
      contentStructure: this.generateContentStructure(profile),
      topicalAuthority: this.generateTopicalAuthority(profile),
      internalLinking: this.generateInternalLinkingStrategy(profile),
      growthFocus: this.generateGrowthFocus(profile),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.updateProject(projectId, (p) => {
      p.strategies.push(strategy);
    });

    return strategy;
  }

  private generateKeywordPriorities(profile: BusinessProfile): KeywordPriority[] {
    const nicheKeys = this.getNicheKeywords(profile.industry);
    const priorities: KeywordPriority[] = [];
    const clusters = ["core-product", "educational", "comparison", "long-tail"];

    nicheKeys.forEach((kw, i) => {
      const fullKw = `${profile.industry} ${kw}`.toLowerCase();
      const intentIdx = i % 4;
      const intents: SearchIntent[] = ["informational", "commercial", "transactional", "navigational"];
      const difficulties: DifficultyLevel[] = ["easy", "medium", "hard", "very-hard"];
      const priorityLevels: Priority[] = ["critical", "high", "medium", "low"];

      priorities.push({
        keyword: fullKw,
        volume: Math.floor(Math.random() * 9000) + 1000,
        difficulty: difficulties[Math.min(i % 4, 3)],
        intent: intents[intentIdx],
        priority: priorityLevels[Math.min(Math.floor(i / 4), 3)],
        cluster: clusters[i % clusters.length],
      });
    });

    return priorities.sort((a, b) => {
      const order: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    });
  }

  private generateContentStructure(profile: BusinessProfile): {
    pillarPages: string[];
    clusterTopics: string[];
    supportingContent: string[];
    contentCalendar: ContentCalendarItem[];
  } {
    const industry = profile.industry.toLowerCase();
    const nicheKws = this.getNicheKeywords(industry).slice(0, 12);

    const pillarPages = nicheKws.slice(0, 3).map((kw) =>
      `${capitalize(profile.industry)}: The Complete Guide to ${capitalize(kw)}`
    );

    const clusterTopics = nicheKws.slice(3, 8).map((kw) =>
      `${capitalize(kw)} for ${profile.targetAudience}`
    );

    const supportingContent = nicheKws.slice(8, 12).map((kw) =>
      `How to ${capitalize(kw)}: A Practical Walkthrough`
    );

    const formats: ContentFormat[] = ["pillar-page", "guide", "blog-post", "listicle", "tutorial", "comparison"];
    const contentCalendar: ContentCalendarItem[] = [];
    const allTopics = [...pillarPages, ...clusterTopics, ...supportingContent];

    allTopics.forEach((topic, i) => {
      contentCalendar.push({
        month: (i % 12) + 1,
        topic,
        format: formats[i % formats.length],
        targetKeyword: nicheKws[i % nicheKws.length],
        priority: i < 3 ? "critical" : i < 8 ? "high" : "medium",
      });
    });

    return { pillarPages, clusterTopics, supportingContent, contentCalendar };
  }

  private generateTopicalAuthority(profile: BusinessProfile) {
    const nicheKws = this.getNicheKeywords(profile.industry);
    const primaryTopics = nicheKws.slice(0, 5).map((kw) => `${profile.industry} ${kw}`);
    const secondaryTopics = nicheKws.slice(5, 10).map((kw) => `${kw} insights`);

    return {
      primaryTopics,
      secondaryTopics,
      entityRelationships: primaryTopics.map((topic, i) => ({
        entity: topic,
        relatedEntities: secondaryTopics.slice(i, i + 2),
        strength: Math.round((1 - i * 0.15) * 100) / 100,
      })),
    };
  }

  private generateInternalLinkingStrategy(profile: BusinessProfile) {
    const nicheKws = this.getNicheKeywords(profile.industry);

    const pillarToCluster = nicheKws.slice(0, 3).map((kw, i) => ({
      from: `/guide/${kw.replace(/\s+/g, "-")}`,
      to: `/blog/${nicheKws[i + 3]?.replace(/\s+/g, "-") ?? "related"}`,
      anchorText: capitalize(nicheKws[i + 3] ?? kw),
      relevanceScore: 0.9 - i * 0.1,
    }));

    const clusterToSupport = nicheKws.slice(3, 6).map((kw, i) => ({
      from: `/blog/${kw.replace(/\s+/g, "-")}`,
      to: `/tips/${nicheKws[i + 6]?.replace(/\s+/g, "-") ?? "tips"}`,
      anchorText: capitalize(nicheKws[i + 6] ?? kw),
      relevanceScore: 0.8 - i * 0.1,
    }));

    return {
      pillarToCluster,
      clusterToSupport,
      crossLinks: pillarToCluster.slice(0, 2).map((link) => ({
        ...link,
        relevanceScore: 0.6,
      })),
    };
  }

  private generateGrowthFocus(profile: BusinessProfile): GrowthFocus[] {
    return [
      {
        phase: "Foundation (Months 1-3)",
        duration: "3 months",
        objectives: [
          "Establish topical authority foundations",
          "Publish 3 pillar pages",
          "Set up technical SEO infrastructure",
        ],
        kpis: [
          "Index 100% of pillar content",
          "Achieve <2s page load times",
          "Establish baseline organic traffic",
        ],
        actions: [
          "Audit and fix technical SEO issues",
          "Create and publish pillar content",
          "Implement internal linking architecture",
          "Set up analytics and tracking",
        ],
      },
      {
        phase: "Growth (Months 4-8)",
        duration: "5 months",
        objectives: [
          "Scale content production across clusters",
          `Target ${profile.targetAudience} with intent-matched content`,
          "Build authority through consistent publishing",
        ],
        kpis: [
          "50% increase in organic traffic",
          "Rank page 1 for 5+ target keywords",
          "Achieve 30+ indexed cluster pages",
        ],
        actions: [
          "Publish 2-3 cluster articles per week",
          "Optimize existing content based on performance data",
          "Expand internal linking network",
          "Begin outreach for backlink acquisition",
        ],
      },
      {
        phase: "Scale (Months 9-12)",
        duration: "4 months",
        objectives: [
          "Dominate niche SERP positions",
          "Convert organic traffic to business goals",
          "Establish thought leadership",
        ],
        kpis: [
          "200% organic traffic growth from baseline",
          "Page 1 rankings for 20+ keywords",
          "Measurable conversion from organic traffic",
        ],
        actions: [
          "Launch advanced content formats (video, interactive)",
          "Implement conversion optimization on top pages",
          "Scale link building and PR efforts",
          "Expand into adjacent topic clusters",
        ],
      },
    ];
  }

  // ─── 2. Keyword Research Engine ───────────────────

  runKeywordResearch(projectId: string, niche: string): KeywordResearch {
    const nicheKws = this.getNicheKeywords(niche);
    const clusters = this.clusterKeywords(niche, nicheKws);

    const allKeywords = clusters.flatMap((c) => c.keywords);
    const difficulties: DifficultyLevel[] = allKeywords.map((k) => k.difficulty);
    const difficultyMap: Record<DifficultyLevel, number> = { easy: 1, medium: 2, hard: 3, "very-hard": 4 };
    const avgDiff = difficulties.reduce((sum, d) => sum + difficultyMap[d], 0) / difficulties.length;
    const avgDiffLevel: DifficultyLevel =
      avgDiff < 1.5 ? "easy" : avgDiff < 2.5 ? "medium" : avgDiff < 3.5 ? "hard" : "very-hard";

    const topOpportunities = allKeywords
      .filter((k) => k.difficulty === "easy" || k.difficulty === "medium")
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    const research: KeywordResearch = {
      id: generateId("kwr"),
      niche,
      clusters,
      totalKeywords: allKeywords.length,
      avgDifficulty: avgDiffLevel,
      topOpportunities,
      createdAt: Date.now(),
    };

    this.updateProject(projectId, (p) => {
      p.keywordResearch.push(research);
    });

    return research;
  }

  private clusterKeywords(niche: string, keywords: string[]): KeywordCluster[] {
    const intents: SearchIntent[] = ["informational", "commercial", "transactional", "navigational"];
    const clusterNames = [
      `${capitalize(niche)} Fundamentals`,
      `${capitalize(niche)} Comparisons & Reviews`,
      `${capitalize(niche)} Buying Guide`,
      `${capitalize(niche)} How-To & Tutorials`,
    ];

    return intents.map((intent, idx) => {
      const clusterKws = keywords
        .filter((_, i) => i % 4 === idx)
        .map((kw) => this.generateKeywordData(niche, kw, intent));

      return {
        name: clusterNames[idx],
        intent,
        keywords: clusterKws,
      };
    });
  }

  private generateKeywordData(niche: string, keyword: string, intent: SearchIntent): KeywordData {
    const fullKw = `${niche} ${keyword}`.toLowerCase();
    const hash = this.simpleHash(fullKw);
    const volume = 500 + (hash % 9500);
    const diffIdx = hash % 4;
    const difficulties: DifficultyLevel[] = ["easy", "medium", "hard", "very-hard"];
    const trends: Array<"rising" | "stable" | "declining"> = ["rising", "stable", "declining"];
    const types: Array<"primary" | "secondary" | "long-tail"> = ["primary", "secondary", "long-tail"];

    return {
      keyword: fullKw,
      volume,
      difficulty: difficulties[diffIdx],
      cpc: Math.round((0.5 + (hash % 150) / 10) * 100) / 100,
      intent,
      trend: trends[hash % 3],
      type: types[Math.min(Math.floor(fullKw.split(" ").length / 3), 2)],
      serp: pickRandom(SERP_FEATURES, 2 + (hash % 3)),
    };
  }

  // ─── 3. Intent Match Analyzer ─────────────────────

  analyzeIntent(projectId: string, keyword: string): IntentAnalysis {
    const lowerKw = keyword.toLowerCase();
    const primaryIntent = this.detectIntent(lowerKw);
    const secondaryIntents = this.detectSecondaryIntents(lowerKw, primaryIntent);
    const bestFormat = CONTENT_FORMAT_MAP[primaryIntent][0];

    const depth = this.determineContentDepth(lowerKw, primaryIntent);
    const userExpectations = this.generateUserExpectations(lowerKw, primaryIntent);
    const contentRequirements = this.generateContentRequirements(lowerKw, primaryIntent);
    const structureRecommendation = this.generateHeadingStructure(keyword, primaryIntent);

    const analysis: IntentAnalysis = {
      id: generateId("intent"),
      keyword,
      primaryIntent,
      secondaryIntents,
      bestFormat,
      recommendedDepth: depth,
      userExpectations,
      contentRequirements,
      competitiveGap: this.identifyCompetitiveGaps(keyword),
      structureRecommendation,
      createdAt: Date.now(),
    };

    this.updateProject(projectId, (p) => {
      p.intentAnalyses.push(analysis);
    });

    return analysis;
  }

  private detectIntent(keyword: string): SearchIntent {
    let maxScore = 0;
    let detected: SearchIntent = "informational";

    for (const [intent, signals] of Object.entries(INTENT_SIGNALS)) {
      const score = signals.filter((s) => keyword.includes(s)).length;
      if (score > maxScore) {
        maxScore = score;
        detected = intent as SearchIntent;
      }
    }

    return detected;
  }

  private detectSecondaryIntents(keyword: string, primary: SearchIntent): SearchIntent[] {
    const all: SearchIntent[] = ["informational", "navigational", "transactional", "commercial"];
    return all
      .filter((i) => i !== primary)
      .filter((intent) => INTENT_SIGNALS[intent].some((s) => keyword.includes(s)))
      .slice(0, 2);
  }

  private determineContentDepth(keyword: string, intent: SearchIntent): "shallow" | "standard" | "comprehensive" | "ultimate-guide" {
    const words = keyword.split(" ").length;
    if (intent === "transactional") return "standard";
    if (intent === "navigational") return "shallow";
    if (words >= 5) return "comprehensive";
    if (keyword.includes("complete") || keyword.includes("ultimate") || keyword.includes("guide"))
      return "ultimate-guide";
    return "standard";
  }

  private generateUserExpectations(keyword: string, intent: SearchIntent): string[] {
    const base: string[] = [
      `Clear, actionable information about "${keyword}"`,
      "Well-organized content with logical progression",
      "Up-to-date and accurate information",
    ];

    const intentExpectations: Record<SearchIntent, string[]> = {
      informational: [
        "Step-by-step instructions or explanations",
        "Visual aids (images, diagrams, videos)",
        "Expert insights and source citations",
      ],
      commercial: [
        "Objective comparison of options",
        "Pros and cons analysis",
        "Clear recommendation with reasoning",
      ],
      transactional: [
        "Pricing information and value proposition",
        "Trust signals (reviews, testimonials)",
        "Clear call-to-action and next steps",
      ],
      navigational: [
        "Direct path to the target resource",
        "Quick-access navigation elements",
        "Contact or support information",
      ],
    };

    return [...base, ...intentExpectations[intent]];
  }

  private generateContentRequirements(keyword: string, intent: SearchIntent): ContentRequirement[] {
    const requirements: ContentRequirement[] = [
      { element: "Keyword in Title (H1)", importance: "critical", description: "Include target keyword naturally in the main heading", present: false },
      { element: "Meta Description", importance: "critical", description: "Compelling meta description with keyword and CTA", present: false },
      { element: "Structured Headings (H2-H4)", importance: "high", description: "Logical heading hierarchy covering subtopics", present: false },
      { element: "Internal Links", importance: "high", description: "Links to related content for topical clustering", present: false },
      { element: "FAQ Section", importance: "medium", description: "Address People Also Ask queries", present: false },
      { element: "Visual Content", importance: "medium", description: "Images, diagrams, or infographics to enhance comprehension", present: false },
      { element: "Schema Markup", importance: "medium", description: "Structured data for rich snippets eligibility", present: false },
      { element: "External Authority Links", importance: "low", description: "Outbound links to authoritative sources", present: false },
    ];

    if (intent === "transactional") {
      requirements.push({
        element: "Pricing Table",
        importance: "critical",
        description: "Clear pricing with comparison options",
        present: false,
      });
    }

    if (intent === "commercial") {
      requirements.push({
        element: "Comparison Matrix",
        importance: "high",
        description: "Side-by-side feature comparison",
        present: false,
      });
    }

    return requirements;
  }

  private generateHeadingStructure(keyword: string, intent: SearchIntent): HeadingStructure {
    const capKw = capitalize(keyword);

    const h2s = [
      `What is ${capKw}?`,
      `Why ${capKw} Matters`,
      `How to Get Started with ${capKw}`,
      `Best Practices for ${capKw}`,
      `Common Mistakes to Avoid`,
      `Frequently Asked Questions`,
    ];

    const h3s: Record<string, string[]> = {};
    h3s[h2s[2]] = ["Step 1: Research & Planning", "Step 2: Implementation", "Step 3: Optimization"];
    h3s[h2s[3]] = ["Tip 1: Start with Fundamentals", "Tip 2: Measure and Iterate", "Tip 3: Stay Updated"];
    h3s[h2s[4]] = ["Mistake 1: Ignoring Data", "Mistake 2: Moving Too Fast", "Mistake 3: Lack of Strategy"];

    return {
      h1: `${capKw}: The Complete Guide (${new Date().getFullYear()})`,
      h2s,
      h3s,
    };
  }

  private identifyCompetitiveGaps(keyword: string): string[] {
    return [
      "Most competitors lack comprehensive FAQ sections",
      "Few pages include original data or case studies",
      "Video content is underutilized for this topic",
      "Interactive tools or calculators could differentiate",
      "Most content is outdated — fresh perspective is an opportunity",
      "Schema markup rarely implemented by competitors",
    ];
  }

  // ─── 4. Competitor Structure Breakdown ────────────

  analyzeCompetitors(projectId: string, keyword: string): CompetitorAnalysis {
    const competitors = this.generateCompetitorPages(keyword);
    const avgWordCount = Math.round(competitors.reduce((s, c) => s + c.wordCount, 0) / competitors.length);
    const avgHeadingCount = Math.round(competitors.reduce((s, c) => s + c.headingCount, 0) / competitors.length);

    const sharedPatterns = [
      "All top pages include comprehensive H2 heading structure",
      `Average content length: ${avgWordCount} words`,
      "Structured data (FAQ schema) present on 60%+ of results",
      "Strong internal linking to related topic clusters",
      "Featured visual content (custom images, charts)",
    ];

    const contentGaps = [
      "None include interactive calculators or tools",
      "Video walkthroughs missing from most results",
      "User-generated content (comments, reviews) underutilized",
      "Original research and data rarely cited",
      "Mobile experience could be significantly improved",
    ];

    const opportunities = [
      "Create the most comprehensive resource (surpass top word count by 30%)",
      "Add interactive elements for engagement superiority",
      "Include original data visualization",
      "Implement superior FAQ schema coverage",
      "Optimize for featured snippet with direct answer formatting",
    ];

    const analysis: CompetitorAnalysis = {
      id: generateId("comp"),
      keyword,
      competitors,
      sharedPatterns,
      contentGaps,
      opportunities,
      avgWordCount,
      avgHeadingCount,
      dominantFormat: "guide",
      createdAt: Date.now(),
    };

    this.updateProject(projectId, (p) => {
      p.competitorAnalyses.push(analysis);
    });

    return analysis;
  }

  private generateCompetitorPages(keyword: string): CompetitorPage[] {
    const domains = [
      "authoritysite.com", "expertblog.io", "industryguide.org",
      "topresource.net", "leadingpub.com",
    ];

    const formats: ContentFormat[] = ["guide", "pillar-page", "blog-post", "listicle", "tutorial"];
    const capKw = capitalize(keyword);

    return domains.map((domain, i) => {
      const wc = 1500 + Math.floor(Math.random() * 3000);
      const hc = 8 + Math.floor(Math.random() * 12);

      return {
        url: `https://${domain}/${keyword.replace(/\s+/g, "-")}`,
        title: `${POWER_WORDS[i % POWER_WORDS.length]} ${capKw} ${["Guide", "Tutorial", "Resource", "Handbook", "Reference"][i]}`,
        wordCount: wc,
        headingCount: hc,
        headings: Array.from({ length: Math.min(hc, 6) }, (_, j) =>
          `${["Understanding", "Implementing", "Optimizing", "Advanced", "Essential", "Practical"][j]} ${capKw}`
        ),
        semanticTopics: this.getNicheKeywords(keyword).slice(0, 5),
        contentFormat: formats[i % formats.length],
        strengths: [
          i < 2 ? "Strong domain authority" : "Niche expertise",
          "Comprehensive coverage of core topic",
          `${wc}+ words of in-depth content`,
        ],
        weaknesses: [
          i > 2 ? "Outdated content (6+ months)" : "Limited visual content",
          "Weak internal linking structure",
          "Missing FAQ schema markup",
        ],
        backlinksEstimate: 50 + Math.floor(Math.random() * 450),
        domainAuthority: 30 + Math.floor(Math.random() * 60),
      };
    });
  }

  // ─── 5. SEO Content Blueprint ─────────────────────

  createBlueprint(projectId: string, keyword: string): ContentBlueprint {
    const capKw = capitalize(keyword);
    const headingStructure = this.generateHeadingStructure(keyword, "informational");

    const titleFramework: TitleFramework = {
      primary: `${capKw}: The ${pickRandom(POWER_WORDS, 1)[0]} Guide (${new Date().getFullYear()})`,
      alternatives: [
        `How to Master ${capKw} — ${pickRandom(POWER_WORDS, 1)[0]} Strategies`,
        `${capKw}: Everything You Need to Know`,
        `The ${pickRandom(POWER_WORDS, 1)[0]} ${capKw} Playbook for Success`,
      ],
      lengthChars: 55,
      powerWords: pickRandom(POWER_WORDS, 3),
    };

    const metaDesc = {
      text: `Discover proven strategies for ${keyword}. This comprehensive guide covers everything from basics to advanced techniques. Start mastering ${keyword} today.`,
      lengthChars: 155,
      callToAction: "Start mastering today",
      keywordPlacement: "front" as const,
    };

    const semanticKeywords = this.generateSemanticKeywords(keyword);
    const faqs = this.generateFaqs(keyword);
    const internalLinks = this.generateInternalLinkIdeas(keyword);
    const contentOutline = this.generateContentOutline(keyword, headingStructure);

    const blueprint: ContentBlueprint = {
      id: generateId("bp"),
      keyword,
      titleFramework,
      metaDescription: metaDesc,
      headingStructure,
      semanticKeywords,
      faqs,
      internalLinkingIdeas: internalLinks,
      contentOutline,
      estimatedWordCount: contentOutline.reduce((s, sec) => s + sec.targetWordCount, 0),
      createdAt: Date.now(),
    };

    this.updateProject(projectId, (p) => {
      p.contentBlueprints.push(blueprint);
    });

    return blueprint;
  }

  private generateSemanticKeywords(keyword: string): SemanticKeyword[] {
    const nicheKws = this.getNicheKeywords(keyword);
    return nicheKws.slice(0, 10).map((kw, i) => ({
      keyword: `${keyword} ${kw}`.toLowerCase(),
      relevance: Math.round((1 - i * 0.08) * 100) / 100,
      suggestedPlacement: ["title", "H2 heading", "body paragraph", "conclusion", "meta description"][i % 5],
      frequency: Math.max(1, 4 - Math.floor(i / 3)),
    }));
  }

  private generateFaqs(keyword: string): FaqItem[] {
    const capKw = capitalize(keyword);
    return [
      {
        question: `What is ${capKw}?`,
        answer: `${capKw} refers to the comprehensive practice of optimizing and improving outcomes through strategic planning, implementation, and continuous iteration based on data-driven insights.`,
        schema: true,
      },
      {
        question: `How do I get started with ${capKw}?`,
        answer: `Start by understanding your current baseline, setting clear objectives, researching best practices, and creating a step-by-step implementation plan. Begin with the fundamentals before advancing to complex strategies.`,
        schema: true,
      },
      {
        question: `What are the best tools for ${capKw}?`,
        answer: `The best tools depend on your specific needs and budget. Start with free options to understand the landscape, then invest in premium tools as your requirements grow and you can measure ROI.`,
        schema: true,
      },
      {
        question: `How long does it take to see results from ${capKw}?`,
        answer: `Results timelines vary based on competition, resources, and execution quality. Typically, expect initial improvements within 1-3 months, with significant results materializing in 6-12 months of consistent effort.`,
        schema: true,
      },
      {
        question: `What are common mistakes with ${capKw}?`,
        answer: `Common mistakes include: lack of strategy, ignoring data, moving too quickly without proper foundations, not adapting to changes, and failing to measure impact accurately.`,
        schema: true,
      },
    ];
  }

  private generateInternalLinkIdeas(keyword: string): InternalLinkIdea[] {
    const nicheKws = this.getNicheKeywords(keyword);
    return nicheKws.slice(0, 6).map((kw, i) => ({
      anchorText: capitalize(kw),
      targetPage: `/blog/${kw.replace(/\s+/g, "-")}`,
      context: `Link naturally from the ${["introduction", "best practices", "tools", "examples", "FAQ", "conclusion"][i]} section`,
      relevance: Math.round((0.95 - i * 0.1) * 100) / 100,
    }));
  }

  private generateContentOutline(keyword: string, structure: HeadingStructure): ContentSection[] {
    return structure.h2s.map((h2, i) => {
      const subHeadings = structure.h3s[h2] || [];
      return {
        heading: h2,
        level: 2 as const,
        summary: `Comprehensive coverage of ${h2.toLowerCase()} with actionable insights`,
        keyPoints: subHeadings.length > 0
          ? subHeadings
          : [
              `Define and explain ${h2.toLowerCase()}`,
              "Provide real-world examples",
              "Include actionable takeaways",
            ],
        targetWordCount: i === 0 ? 300 : i < 4 ? 500 : 250,
        semanticKeywords: this.getNicheKeywords(keyword).slice(i * 2, i * 2 + 2),
      };
    });
  }

  // ─── 6. On-Page SEO Optimizer ─────────────────────

  auditOnPage(projectId: string, content: string, keyword: string, url?: string): OnPageAudit {
    const titleTag = this.auditTitleTag(content, keyword);
    const metaDescription = this.auditMetaDescription(content, keyword);
    const headings = this.auditHeadings(content, keyword);
    const keywordUsage = this.auditKeywordUsage(content, keyword);
    const readability = this.auditReadability(content);
    const engagement = this.auditEngagement(content);
    const technicalSeo = this.auditTechnicalSeo(content);

    const scores = {
      technical: this.calculateTechnicalScore(technicalSeo),
      content: this.calculateContentScore(keywordUsage, headings),
      authority: this.calculateAuthorityScore(engagement),
      userExperience: this.calculateUxScore(readability, engagement),
    };

    const overall = Math.round(
      (scores.technical * 0.25 + scores.content * 0.35 + scores.authority * 0.2 + scores.userExperience * 0.2) * 100
    ) / 100;

    const score: SeoScore = { overall, ...scores };
    const recommendations = this.generateRecommendations(titleTag, metaDescription, headings, keywordUsage, readability, engagement, technicalSeo);

    const audit: OnPageAudit = {
      id: generateId("audit"),
      url,
      score,
      titleTag,
      metaDescription,
      headings,
      keywordUsage,
      readability,
      engagement,
      technicalSeo,
      recommendations,
      createdAt: Date.now(),
    };

    this.updateProject(projectId, (p) => {
      p.onPageAudits.push(audit);
    });

    return audit;
  }

  private auditTitleTag(content: string, keyword: string): TagAudit {
    const titleMatch = content.match(/<title>(.*?)<\/title>/i);
    const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const current = titleMatch?.[1] || h1Match?.[1] || content.split("\n")[0]?.slice(0, 60) || "";
    const hasKeyword = current.toLowerCase().includes(keyword.toLowerCase());
    const issues: string[] = [];

    if (current.length > 60) issues.push("Title exceeds 60 characters — may be truncated in SERPs");
    if (current.length < 30) issues.push("Title is too short — expand for better SERP presence");
    if (!hasKeyword) issues.push("Primary keyword missing from title tag");

    const capKw = capitalize(keyword);
    const optimized = `${capKw}: ${pickRandom(POWER_WORDS, 1)[0]} Guide (${new Date().getFullYear()})`;

    return {
      current,
      optimized,
      length: current.length,
      hasKeyword,
      isPowerful: POWER_WORDS.some((pw) => current.toLowerCase().includes(pw.toLowerCase())),
      issues,
    };
  }

  private auditMetaDescription(content: string, keyword: string): TagAudit {
    const metaMatch = content.match(/<meta\s+name="description"\s+content="(.*?)"/i);
    const current = metaMatch?.[1] || "";
    const hasKeyword = current.toLowerCase().includes(keyword.toLowerCase());
    const issues: string[] = [];

    if (!current) issues.push("Meta description is missing");
    if (current.length > 160) issues.push("Meta description exceeds 160 characters");
    if (current.length < 120 && current.length > 0) issues.push("Meta description is too short — aim for 150-160 characters");
    if (!hasKeyword && current) issues.push("Primary keyword missing from meta description");

    const optimized = `Discover proven strategies for ${keyword}. This ${pickRandom(POWER_WORDS, 1)[0].toLowerCase()} guide covers everything you need to succeed. Learn more now.`;

    return {
      current: current || "(missing)",
      optimized,
      length: current.length,
      hasKeyword,
      isPowerful: false,
      issues,
    };
  }

  private auditHeadings(content: string, keyword: string): HeadingAudit {
    const h1s = content.match(/<h1[^>]*>.*?<\/h1>/gi) || [];
    const h2s = content.match(/<h2[^>]*>.*?<\/h2>/gi) || [];
    const h3s = content.match(/<h3[^>]*>.*?<\/h3>/gi) || [];
    const issues: string[] = [];

    if (h1s.length === 0) issues.push("Missing H1 tag — every page needs exactly one H1");
    if (h1s.length > 1) issues.push("Multiple H1 tags detected — use exactly one H1 per page");
    if (h2s.length < 3) issues.push("Insufficient H2 headings — aim for 4-8 H2s for structure");
    if (h2s.length === 0) issues.push("No H2 headings — add subtopic headings for better structure");

    const allHeadings = [...h1s, ...h2s, ...h3s].map((h) => h.replace(/<[^>]+>/g, ""));
    const kwInHeadings = allHeadings.some((h) => h.toLowerCase().includes(keyword.toLowerCase()));
    if (!kwInHeadings) issues.push("Primary keyword not found in any heading");

    const capKw = capitalize(keyword);
    const optimized = [
      `H1: ${capKw} — Complete Guide`,
      `H2: What is ${capKw}?`,
      `H2: How ${capKw} Works`,
      `H2: Best Practices for ${capKw}`,
      `H2: Common ${capKw} Mistakes`,
      `H2: FAQ About ${capKw}`,
    ];

    return {
      h1Count: h1s.length,
      h2Count: h2s.length,
      h3Count: h3s.length,
      hierarchy: allHeadings,
      issues,
      optimized,
    };
  }

  private auditKeywordUsage(content: string, keyword: string): KeywordUsageAudit {
    const lowerContent = content.toLowerCase();
    const lowerKw = keyword.toLowerCase();
    const words = wordCount(content);
    const kwCount = (lowerContent.match(new RegExp(lowerKw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
    const density = words > 0 ? Math.round((kwCount / words) * 10000) / 100 : 0;
    const firstIdx = lowerContent.indexOf(lowerKw);
    const firstParagraph = content.split("\n").find((line) => line.trim().length > 20) || "";

    const issues: string[] = [];
    if (density > 3) issues.push("Keyword density too high — risk of keyword stuffing");
    if (density < 0.5 && words > 100) issues.push("Keyword density too low — use keyword more naturally");
    if (firstIdx > 300) issues.push("Keyword appears late in content — introduce it earlier");
    if (!firstParagraph.toLowerCase().includes(lowerKw)) issues.push("Keyword missing from first paragraph");

    return {
      primaryKeyword: keyword,
      density,
      firstAppearance: firstIdx,
      inTitle: false,
      inMeta: false,
      inH1: (content.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] || "").toLowerCase().includes(lowerKw),
      inH2: (content.match(/<h2[^>]*>(.*?)<\/h2>/gi) || []).some((h) => h.toLowerCase().includes(lowerKw)),
      inFirstParagraph: firstParagraph.toLowerCase().includes(lowerKw),
      issues,
    };
  }

  private auditReadability(content: string): ReadabilityAudit {
    const plainText = content.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const sentences = plainText.split(/[.!?]+/).filter((s) => s.trim().length > 5);
    const words = plainText.split(/\s+/).filter(Boolean);
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 10);

    const avgSentenceLength = sentences.length > 0 ? Math.round(words.length / sentences.length) : 0;
    const avgParagraphLength = paragraphs.length > 0 ? Math.round(sentences.length / paragraphs.length) : 0;

    const syllableCount = words.reduce((sum, w) => sum + Math.max(1, w.replace(/[^aeiouy]/gi, "").length), 0);
    const flesch = words.length > 0 && sentences.length > 0
      ? Math.round(206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllableCount / words.length))
      : 50;

    const passiveIndicators = ["was", "were", "been", "being", "is", "are"];
    const passiveCount = words.filter((w) => passiveIndicators.includes(w.toLowerCase())).length;
    const passivePercentage = sentences.length > 0 ? Math.round((passiveCount / sentences.length) * 100) : 0;

    const issues: string[] = [];
    if (avgSentenceLength > 25) issues.push("Sentences are too long — aim for 15-20 words average");
    if (flesch < 60) issues.push("Content readability is low — simplify language for broader audience");
    if (passivePercentage > 20) issues.push("High passive voice usage — convert to active voice");
    if (avgParagraphLength > 5) issues.push("Paragraphs are too long — break into smaller chunks");

    const grade = flesch >= 80 ? "A" : flesch >= 70 ? "B" : flesch >= 60 ? "C" : flesch >= 50 ? "D" : "F";

    return {
      fleschScore: clamp(flesch, 0, 100),
      avgSentenceLength,
      avgParagraphLength,
      passiveVoicePercentage: passivePercentage,
      grade,
      issues,
    };
  }

  private auditEngagement(content: string): EngagementAudit {
    const lowerContent = content.toLowerCase();
    const issues: string[] = [];

    const hasMedia = /<img|<video|<iframe|<picture/i.test(content);
    const hasCta = /sign up|subscribe|get started|learn more|try now|buy now|contact us/i.test(content);
    const hasInternalLinks = /<a[^>]+href="\/[^"]*"/i.test(content);
    const hasExternalLinks = /<a[^>]+href="https?:\/\/[^"]*"/i.test(content);
    const hasFaq = /faq|frequently asked|people also ask/i.test(content);
    const hasStructuredData = /application\/ld\+json|itemscope|itemtype/i.test(content);

    if (!hasMedia) issues.push("No media elements found — add images, videos, or infographics");
    if (!hasCta) issues.push("No clear call-to-action — add engagement triggers");
    if (!hasInternalLinks) issues.push("No internal links detected — add links to related content");
    if (!hasExternalLinks) issues.push("No external authority links — cite reputable sources");
    if (!hasFaq) issues.push("No FAQ section — add common questions for PAA exposure");
    if (!hasStructuredData) issues.push("No structured data — implement schema markup");

    return { hasMedia, hasCta, hasInternalLinks, hasExternalLinks, hasFaq, hasStructuredData, issues };
  }

  private auditTechnicalSeo(content: string): TechnicalSeoAudit {
    const issues: string[] = [];
    const hasCanonical = /rel="canonical"/i.test(content);
    const hasOpenGraph = /property="og:/i.test(content);
    const hasTwitterCard = /name="twitter:/i.test(content);
    const hasStructuredData = /application\/ld\+json/i.test(content);

    const imgTags = content.match(/<img[^>]*>/gi) || [];
    const imageAltTags = imgTags.filter((img) => /alt="[^"]+"/i.test(img)).length;
    const missingAltTags = imgTags.length - imageAltTags;

    if (!hasCanonical) issues.push("Missing canonical tag — add to prevent duplicate content issues");
    if (!hasOpenGraph) issues.push("Missing Open Graph tags — add for social sharing optimization");
    if (!hasTwitterCard) issues.push("Missing Twitter Card tags — add for Twitter previews");
    if (!hasStructuredData) issues.push("Missing structured data — add JSON-LD schema");
    if (missingAltTags > 0) issues.push(`${missingAltTags} image(s) missing alt text — add descriptive alt attributes`);

    return { hasCanonical, hasOpenGraph, hasTwitterCard, hasStructuredData, imageAltTags, missingAltTags, issues };
  }

  private calculateTechnicalScore(tech: TechnicalSeoAudit): number {
    let score = 50;
    if (tech.hasCanonical) score += 15;
    if (tech.hasOpenGraph) score += 10;
    if (tech.hasTwitterCard) score += 10;
    if (tech.hasStructuredData) score += 15;
    if (tech.missingAltTags === 0) score += 10;
    return clamp(score, 0, 100);
  }

  private calculateContentScore(kw: KeywordUsageAudit, headings: HeadingAudit): number {
    let score = 40;
    if (kw.density >= 0.5 && kw.density <= 3) score += 15;
    if (kw.inH1) score += 10;
    if (kw.inFirstParagraph) score += 10;
    if (headings.h1Count === 1) score += 10;
    if (headings.h2Count >= 3) score += 10;
    if (kw.issues.length === 0) score += 5;
    return clamp(score, 0, 100);
  }

  private calculateAuthorityScore(engagement: EngagementAudit): number {
    let score = 30;
    if (engagement.hasExternalLinks) score += 15;
    if (engagement.hasStructuredData) score += 15;
    if (engagement.hasFaq) score += 15;
    if (engagement.hasInternalLinks) score += 15;
    if (engagement.issues.length <= 2) score += 10;
    return clamp(score, 0, 100);
  }

  private calculateUxScore(readability: ReadabilityAudit, engagement: EngagementAudit): number {
    let score = readability.fleschScore * 0.6;
    if (engagement.hasMedia) score += 15;
    if (engagement.hasCta) score += 10;
    if (readability.avgSentenceLength <= 20) score += 10;
    if (readability.passiveVoicePercentage <= 15) score += 5;
    return clamp(Math.round(score), 0, 100);
  }

  private generateRecommendations(
    title: TagAudit,
    meta: TagAudit,
    headings: HeadingAudit,
    kw: KeywordUsageAudit,
    readability: ReadabilityAudit,
    engagement: EngagementAudit,
    tech: TechnicalSeoAudit,
  ): SeoRecommendation[] {
    const recs: SeoRecommendation[] = [];

    title.issues.forEach((issue) => {
      recs.push({
        category: "Title Tag",
        priority: "critical",
        title: "Optimize Title Tag",
        description: issue,
        impact: "high",
        effort: "low",
        status: "pending",
      });
    });

    meta.issues.forEach((issue) => {
      recs.push({
        category: "Meta Description",
        priority: "critical",
        title: "Optimize Meta Description",
        description: issue,
        impact: "high",
        effort: "low",
        status: "pending",
      });
    });

    headings.issues.forEach((issue) => {
      recs.push({
        category: "Headings",
        priority: "high",
        title: "Fix Heading Structure",
        description: issue,
        impact: "medium",
        effort: "low",
        status: "pending",
      });
    });

    kw.issues.forEach((issue) => {
      recs.push({
        category: "Keywords",
        priority: "high",
        title: "Improve Keyword Usage",
        description: issue,
        impact: "high",
        effort: "medium",
        status: "pending",
      });
    });

    engagement.issues.forEach((issue) => {
      recs.push({
        category: "Engagement",
        priority: "medium",
        title: "Enhance Content Engagement",
        description: issue,
        impact: "medium",
        effort: "medium",
        status: "pending",
      });
    });

    tech.issues.forEach((issue) => {
      recs.push({
        category: "Technical SEO",
        priority: "medium",
        title: "Technical Improvement",
        description: issue,
        impact: "medium",
        effort: "low",
        status: "pending",
      });
    });

    return recs.sort((a, b) => {
      const order: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    });
  }

  // ─── 7. SEO Plan Audit ───────────────────────────

  auditPlan(projectId: string, planSummary: string): SeoPlanAudit {
    const keywordAssessment = this.assessPlanArea("Keywords", planSummary);
    const contentAssessment = this.assessPlanArea("Content", planSummary);
    const linkingAssessment = this.assessPlanArea("Linking", planSummary);
    const optimizationAssessment = this.assessPlanArea("Optimization", planSummary);

    const grades = [keywordAssessment, contentAssessment, linkingAssessment, optimizationAssessment];
    const gradeMap: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };
    const avgGrade = grades.reduce((s, g) => s + gradeMap[g.grade], 0) / grades.length;
    const overallGrade: "A" | "B" | "C" | "D" | "F" =
      avgGrade >= 3.5 ? "A" : avgGrade >= 2.5 ? "B" : avgGrade >= 1.5 ? "C" : avgGrade >= 0.5 ? "D" : "F";

    const sustScore = Math.round(avgGrade * 25);

    const audit: SeoPlanAudit = {
      id: generateId("pa"),
      planSummary,
      overallGrade,
      strengths: this.identifyPlanStrengths(planSummary),
      weaknesses: this.identifyPlanWeaknesses(planSummary),
      keywordAssessment,
      contentAssessment,
      linkingAssessment,
      optimizationAssessment,
      refinedStrategy: this.generateRefinedStrategy(planSummary),
      sustainabilityScore: sustScore,
      createdAt: Date.now(),
    };

    this.updateProject(projectId, (p) => {
      p.planAudits.push(audit);
    });

    return audit;
  }

  private assessPlanArea(area: string, planSummary: string): PlanAssessment {
    const lowerPlan = planSummary.toLowerCase();

    const areaSignals: Record<string, string[]> = {
      Keywords: ["keyword", "search term", "query", "intent", "volume", "difficulty", "cluster"],
      Content: ["content", "blog", "article", "guide", "page", "publish", "write", "create"],
      Linking: ["link", "backlink", "internal", "external", "anchor", "outreach", "referring"],
      Optimization: ["optimize", "speed", "mobile", "technical", "schema", "meta", "title", "canonical"],
    };

    const signals = areaSignals[area] || [];
    const matchCount = signals.filter((s) => lowerPlan.includes(s)).length;
    const coverage = matchCount / signals.length;

    const grade: "A" | "B" | "C" | "D" | "F" =
      coverage >= 0.7 ? "A" : coverage >= 0.5 ? "B" : coverage >= 0.3 ? "C" : coverage >= 0.15 ? "D" : "F";

    const findingsMap: Record<string, string[]> = {
      Keywords: [
        coverage >= 0.5 ? "Keyword strategy is well-defined" : "Keyword strategy needs more depth",
        matchCount > 3 ? "Intent mapping is present" : "Search intent analysis is missing",
        lowerPlan.includes("cluster") ? "Topic clustering approach identified" : "No topic clustering strategy",
      ],
      Content: [
        coverage >= 0.5 ? "Content plan has clear direction" : "Content strategy is vague",
        lowerPlan.includes("publish") || lowerPlan.includes("calendar") ? "Publishing cadence defined" : "No publishing schedule",
        lowerPlan.includes("pillar") || lowerPlan.includes("hub") ? "Content hierarchy present" : "Flat content structure detected",
      ],
      Linking: [
        coverage >= 0.4 ? "Link strategy is addressed" : "Link building plan is weak",
        lowerPlan.includes("internal") ? "Internal linking strategy present" : "Internal linking strategy missing",
        lowerPlan.includes("backlink") || lowerPlan.includes("outreach") ? "Backlink acquisition planned" : "No backlink strategy",
      ],
      Optimization: [
        coverage >= 0.5 ? "Technical optimization is covered" : "Technical SEO is underdeveloped",
        lowerPlan.includes("mobile") || lowerPlan.includes("speed") ? "Performance optimization mentioned" : "Page performance not addressed",
        lowerPlan.includes("schema") ? "Structured data planned" : "Schema markup not mentioned",
      ],
    };

    const recommendationsMap: Record<string, string[]> = {
      Keywords: [
        "Map every target keyword to a specific page and search intent",
        "Group keywords into topical clusters with clear hierarchy",
        "Prioritize keywords by business impact, not just volume",
      ],
      Content: [
        "Create a 12-month content calendar with publishing cadence",
        "Build pillar pages for primary topics with cluster content",
        "Diversify content formats (video, infographic, interactive)",
      ],
      Linking: [
        "Implement hub-and-spoke internal linking architecture",
        "Build a backlink acquisition pipeline with outreach templates",
        "Audit and fix broken links quarterly",
      ],
      Optimization: [
        "Run Core Web Vitals audit and fix performance issues",
        "Implement schema markup for all content types",
        "Set up canonical tags and proper meta tag structure",
      ],
    };

    const quickWinsMap: Record<string, string[]> = {
      Keywords: ["Add long-tail keyword targets for quick wins", "Optimize existing pages for secondary keywords"],
      Content: ["Update and republish top-performing older content", "Add FAQ sections to existing pages"],
      Linking: ["Add 3-5 internal links to every new piece of content", "Fix broken internal links"],
      Optimization: ["Add missing meta descriptions to all pages", "Compress and add alt text to all images"],
    };

    return {
      area,
      grade,
      findings: findingsMap[area] || [],
      recommendations: recommendationsMap[area] || [],
      quickWins: quickWinsMap[area] || [],
    };
  }

  private identifyPlanStrengths(plan: string): string[] {
    const strengths: string[] = [];
    const lower = plan.toLowerCase();

    if (lower.includes("keyword") && lower.includes("content")) strengths.push("Integrates keyword research with content planning");
    if (lower.includes("schedule") || lower.includes("calendar")) strengths.push("Includes publishing schedule for consistency");
    if (lower.includes("competitor") || lower.includes("analysis")) strengths.push("Competitor awareness informs strategy");
    if (lower.includes("link")) strengths.push("Link building is part of the strategy");
    if (lower.includes("technical") || lower.includes("optimize")) strengths.push("Technical optimization is considered");
    if (lower.includes("goal") || lower.includes("metric") || lower.includes("kpi")) strengths.push("Goal-oriented approach with measurable targets");

    if (strengths.length === 0) strengths.push("Plan provides a starting foundation to build upon");

    return strengths;
  }

  private identifyPlanWeaknesses(plan: string): string[] {
    const weaknesses: string[] = [];
    const lower = plan.toLowerCase();

    if (!lower.includes("intent")) weaknesses.push("No search intent mapping — critical for content-keyword alignment");
    if (!lower.includes("cluster") && !lower.includes("pillar")) weaknesses.push("Missing topical clustering strategy");
    if (!lower.includes("backlink") && !lower.includes("outreach")) weaknesses.push("No backlink acquisition plan");
    if (!lower.includes("schema") && !lower.includes("structured data")) weaknesses.push("Schema markup not addressed");
    if (!lower.includes("mobile")) weaknesses.push("Mobile optimization not mentioned");
    if (!lower.includes("competitor")) weaknesses.push("Competitor analysis missing from strategy");
    if (wordCount(plan) < 100) weaknesses.push("Plan lacks sufficient detail for execution");

    return weaknesses;
  }

  private generateRefinedStrategy(plan: string): RefinedStrategyPoint[] {
    return [
      {
        phase: 1,
        title: "Technical Foundation & Quick Wins",
        duration: "Weeks 1-4",
        actions: [
          "Complete technical SEO audit (Core Web Vitals, mobile, schema)",
          "Fix all critical technical issues identified",
          "Optimize meta tags on top 20 existing pages",
          "Implement FAQ schema on 5 high-traffic pages",
        ],
        expectedOutcome: "Clean technical foundation with immediate SERP improvements on existing pages",
        metrics: ["Core Web Vitals pass rate", "Pages indexed", "Schema validation rate"],
      },
      {
        phase: 2,
        title: "Content Architecture & Keyword Mapping",
        duration: "Weeks 5-10",
        actions: [
          "Complete comprehensive keyword research (500+ keywords)",
          "Map keywords to intent clusters and content types",
          "Build 3 pillar page frameworks",
          "Create internal linking architecture document",
        ],
        expectedOutcome: "Complete content roadmap with keyword-to-page mapping and publishing calendar",
        metrics: ["Keywords mapped", "Content gaps identified", "Pillar pages published"],
      },
      {
        phase: 3,
        title: "Content Production & Authority Building",
        duration: "Weeks 11-24",
        actions: [
          "Publish 2-3 cluster articles per week minimum",
          "Launch backlink outreach campaign",
          "Implement internal linking on every new page",
          "Begin content refresh cycle on underperforming pages",
        ],
        expectedOutcome: "Growing organic traffic with expanding topical coverage and authority signals",
        metrics: ["Organic traffic growth %", "Page 1 rankings", "Backlinks acquired", "Content published"],
      },
      {
        phase: 4,
        title: "Scaling & Optimization",
        duration: "Weeks 25-52",
        actions: [
          "Scale content production to 4+ pieces per week",
          "Implement conversion optimization on top-traffic pages",
          "Expand into adjacent topical territories",
          "Launch PR and digital authority campaigns",
        ],
        expectedOutcome: "Market-leading organic presence with measurable business impact from SEO",
        metrics: ["Organic revenue/leads", "Market share of voice", "Featured snippets won", "Domain authority growth"],
      },
    ];
  }

  // ─── Utility ─────────────────────────────────────

  private getNicheKeywords(niche: string): string[] {
    const lower = niche.toLowerCase();
    for (const [key, keywords] of Object.entries(NICHE_KEYWORD_MAP)) {
      if (lower.includes(key) || key.includes(lower)) return keywords;
    }
    return NICHE_KEYWORD_MAP.default;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }

  get projectCount(): number {
    return this.getAllProjects().length;
  }
}

export const seoEngine = new SeoEngine();
