/**
 * seo.ts — SEO Strategy Suite Type Definitions
 *
 * Comprehensive type system for the 7-tool SEO engine:
 *   1. Full SEO Strategy Builder
 *   2. Keyword Research Engine
 *   3. Intent Match Analyzer
 *   4. Competitor Structure Breakdown
 *   5. SEO Content Blueprint
 *   6. On-Page SEO Optimizer
 *   7. SEO Plan Audit
 */

// ─── Common ─────────────────────────────────────────────

export type SeoToolId =
  | "strategy-builder"
  | "keyword-research"
  | "intent-analyzer"
  | "competitor-breakdown"
  | "content-blueprint"
  | "onpage-optimizer"
  | "plan-audit";

export type SearchIntent = "informational" | "navigational" | "transactional" | "commercial";

export type ContentFormat =
  | "blog-post"
  | "landing-page"
  | "guide"
  | "listicle"
  | "comparison"
  | "tutorial"
  | "product-page"
  | "faq-page"
  | "pillar-page"
  | "case-study";

export type DifficultyLevel = "easy" | "medium" | "hard" | "very-hard";

export type Priority = "critical" | "high" | "medium" | "low";

export interface SeoScore {
  overall: number;
  technical: number;
  content: number;
  authority: number;
  userExperience: number;
}

// ─── 1. Full SEO Strategy Builder ──────────────────────

export interface BusinessProfile {
  businessName: string;
  industry: string;
  targetAudience: string;
  competitiveLandscape: string;
  goals: string;
  currentWebsite?: string;
  budget?: string;
  timeline?: string;
}

export interface KeywordPriority {
  keyword: string;
  volume: number;
  difficulty: DifficultyLevel;
  intent: SearchIntent;
  priority: Priority;
  cluster: string;
}

export interface ContentStructure {
  pillarPages: string[];
  clusterTopics: string[];
  supportingContent: string[];
  contentCalendar: ContentCalendarItem[];
}

export interface ContentCalendarItem {
  month: number;
  topic: string;
  format: ContentFormat;
  targetKeyword: string;
  priority: Priority;
}

export interface InternalLinkStrategy {
  pillarToCluster: LinkMapping[];
  clusterToSupport: LinkMapping[];
  crossLinks: LinkMapping[];
}

export interface LinkMapping {
  from: string;
  to: string;
  anchorText: string;
  relevanceScore: number;
}

export interface SeoStrategy {
  id: string;
  businessProfile: BusinessProfile;
  keywordPriorities: KeywordPriority[];
  contentStructure: ContentStructure;
  topicalAuthority: TopicalAuthorityMap;
  internalLinking: InternalLinkStrategy;
  growthFocus: GrowthFocus[];
  createdAt: number;
  updatedAt: number;
}

export interface TopicalAuthorityMap {
  primaryTopics: string[];
  secondaryTopics: string[];
  entityRelationships: EntityRelationship[];
}

export interface EntityRelationship {
  entity: string;
  relatedEntities: string[];
  strength: number;
}

export interface GrowthFocus {
  phase: string;
  duration: string;
  objectives: string[];
  kpis: string[];
  actions: string[];
}

// ─── 2. Keyword Research Engine ────────────────────────

export interface KeywordCluster {
  name: string;
  intent: SearchIntent;
  keywords: KeywordData[];
}

export interface KeywordData {
  keyword: string;
  volume: number;
  difficulty: DifficultyLevel;
  cpc: number;
  intent: SearchIntent;
  trend: "rising" | "stable" | "declining";
  type: "primary" | "secondary" | "long-tail";
  serp: SerpFeature[];
}

export type SerpFeature =
  | "featured-snippet"
  | "people-also-ask"
  | "local-pack"
  | "knowledge-panel"
  | "image-pack"
  | "video-carousel"
  | "shopping"
  | "news"
  | "sitelinks";

export interface KeywordResearch {
  id: string;
  niche: string;
  clusters: KeywordCluster[];
  totalKeywords: number;
  avgDifficulty: DifficultyLevel;
  topOpportunities: KeywordData[];
  createdAt: number;
}

// ─── 3. Intent Match Analyzer ──────────────────────────

export interface IntentAnalysis {
  id: string;
  keyword: string;
  primaryIntent: SearchIntent;
  secondaryIntents: SearchIntent[];
  bestFormat: ContentFormat;
  recommendedDepth: "shallow" | "standard" | "comprehensive" | "ultimate-guide";
  userExpectations: string[];
  contentRequirements: ContentRequirement[];
  competitiveGap: string[];
  structureRecommendation: HeadingStructure;
  createdAt: number;
}

export interface ContentRequirement {
  element: string;
  importance: Priority;
  description: string;
  present: boolean;
}

export interface HeadingStructure {
  h1: string;
  h2s: string[];
  h3s: Record<string, string[]>;
}

// ─── 4. Competitor Structure Breakdown ─────────────────

export interface CompetitorAnalysis {
  id: string;
  keyword: string;
  competitors: CompetitorPage[];
  sharedPatterns: string[];
  contentGaps: string[];
  opportunities: string[];
  avgWordCount: number;
  avgHeadingCount: number;
  dominantFormat: ContentFormat;
  createdAt: number;
}

export interface CompetitorPage {
  url: string;
  title: string;
  wordCount: number;
  headingCount: number;
  headings: string[];
  semanticTopics: string[];
  contentFormat: ContentFormat;
  strengths: string[];
  weaknesses: string[];
  backlinksEstimate: number;
  domainAuthority: number;
}

// ─── 5. SEO Content Blueprint ──────────────────────────

export interface ContentBlueprint {
  id: string;
  keyword: string;
  titleFramework: TitleFramework;
  metaDescription: MetaDescription;
  headingStructure: HeadingStructure;
  semanticKeywords: SemanticKeyword[];
  faqs: FaqItem[];
  internalLinkingIdeas: InternalLinkIdea[];
  contentOutline: ContentSection[];
  estimatedWordCount: number;
  createdAt: number;
}

export interface TitleFramework {
  primary: string;
  alternatives: string[];
  lengthChars: number;
  powerWords: string[];
}

export interface MetaDescription {
  text: string;
  lengthChars: number;
  callToAction: string;
  keywordPlacement: "front" | "middle" | "end";
}

export interface SemanticKeyword {
  keyword: string;
  relevance: number;
  suggestedPlacement: string;
  frequency: number;
}

export interface FaqItem {
  question: string;
  answer: string;
  schema: boolean;
}

export interface InternalLinkIdea {
  anchorText: string;
  targetPage: string;
  context: string;
  relevance: number;
}

export interface ContentSection {
  heading: string;
  level: 2 | 3 | 4;
  summary: string;
  keyPoints: string[];
  targetWordCount: number;
  semanticKeywords: string[];
}

// ─── 6. On-Page SEO Optimizer ──────────────────────────

export interface OnPageAudit {
  id: string;
  url?: string;
  score: SeoScore;
  titleTag: TagAudit;
  metaDescription: TagAudit;
  headings: HeadingAudit;
  keywordUsage: KeywordUsageAudit;
  readability: ReadabilityAudit;
  engagement: EngagementAudit;
  technicalSeo: TechnicalSeoAudit;
  recommendations: SeoRecommendation[];
  createdAt: number;
}

export interface TagAudit {
  current: string;
  optimized: string;
  length: number;
  hasKeyword: boolean;
  isPowerful: boolean;
  issues: string[];
}

export interface HeadingAudit {
  h1Count: number;
  h2Count: number;
  h3Count: number;
  hierarchy: string[];
  issues: string[];
  optimized: string[];
}

export interface KeywordUsageAudit {
  primaryKeyword: string;
  density: number;
  firstAppearance: number;
  inTitle: boolean;
  inMeta: boolean;
  inH1: boolean;
  inH2: boolean;
  inFirstParagraph: boolean;
  issues: string[];
}

export interface ReadabilityAudit {
  fleschScore: number;
  avgSentenceLength: number;
  avgParagraphLength: number;
  passiveVoicePercentage: number;
  grade: string;
  issues: string[];
}

export interface EngagementAudit {
  hasMedia: boolean;
  hasCta: boolean;
  hasInternalLinks: boolean;
  hasExternalLinks: boolean;
  hasFaq: boolean;
  hasStructuredData: boolean;
  issues: string[];
}

export interface TechnicalSeoAudit {
  hasCanonical: boolean;
  hasOpenGraph: boolean;
  hasTwitterCard: boolean;
  hasStructuredData: boolean;
  imageAltTags: number;
  missingAltTags: number;
  issues: string[];
}

export interface SeoRecommendation {
  category: string;
  priority: Priority;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "high" | "medium" | "low";
  status: "pending" | "in-progress" | "completed";
}

// ─── 7. SEO Plan Audit ────────────────────────────────

export interface SeoPlanAudit {
  id: string;
  planSummary: string;
  overallGrade: "A" | "B" | "C" | "D" | "F";
  strengths: string[];
  weaknesses: string[];
  keywordAssessment: PlanAssessment;
  contentAssessment: PlanAssessment;
  linkingAssessment: PlanAssessment;
  optimizationAssessment: PlanAssessment;
  refinedStrategy: RefinedStrategyPoint[];
  sustainabilityScore: number;
  createdAt: number;
}

export interface PlanAssessment {
  area: string;
  grade: "A" | "B" | "C" | "D" | "F";
  findings: string[];
  recommendations: string[];
  quickWins: string[];
}

export interface RefinedStrategyPoint {
  phase: number;
  title: string;
  duration: string;
  actions: string[];
  expectedOutcome: string;
  metrics: string[];
}

// ─── Persistence ───────────────────────────────────────

export interface SeoProject {
  id: string;
  name: string;
  domain?: string;
  strategies: SeoStrategy[];
  keywordResearch: KeywordResearch[];
  intentAnalyses: IntentAnalysis[];
  competitorAnalyses: CompetitorAnalysis[];
  contentBlueprints: ContentBlueprint[];
  onPageAudits: OnPageAudit[];
  planAudits: SeoPlanAudit[];
  createdAt: number;
  updatedAt: number;
}
