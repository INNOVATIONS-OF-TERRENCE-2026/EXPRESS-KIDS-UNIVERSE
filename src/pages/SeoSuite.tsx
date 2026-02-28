/**
 * SeoSuite.tsx — SEO Strategy Suite Dashboard
 *
 * Unified command center for all 7 SEO tools.
 * Project-scoped — all results are persisted per project.
 *
 * Tools:
 *   1. Full SEO Strategy Builder
 *   2. Keyword Research Engine
 *   3. Intent Match Analyzer
 *   4. Competitor Structure Breakdown
 *   5. SEO Content Blueprint
 *   6. On-Page SEO Optimizer
 *   7. SEO Plan Audit
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Target, BarChart3, FileText, Globe, ClipboardCheck,
  TrendingUp, ArrowLeft, Plus, Trash2, Layers, Sparkles,
  CheckCircle2, AlertCircle, ChevronRight, Lightbulb,
  BookOpen, Compass, Eye, Zap,
} from "lucide-react";
import {
  AuroraGradient, StarfieldParticles, CinematicButton,
  StaggerContainer, StaggerItem, CosmicDust, Tilt3DCard,
} from "@/components/eku";
import { Footer } from "@/components/eku/Footer";
import { SeoToolCard } from "@/components/eku/SeoToolCard";
import { SeoScoreRing } from "@/components/eku/SeoScoreRing";
import { SeoResultPanel, PriorityBadge } from "@/components/eku/SeoResultPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { seoEngine } from "@/lib/seo/seoEngine";
import type {
  SeoProject, SeoToolId, SeoStrategy, KeywordResearch, IntentAnalysis,
  CompetitorAnalysis, ContentBlueprint, OnPageAudit, SeoPlanAudit,
  BusinessProfile,
} from "@/types/seo";

// ─── Tool Registry ─────────────────────────────────────

const SEO_TOOLS = [
  {
    id: "strategy-builder" as SeoToolId,
    icon: Compass,
    title: "SEO Strategy Builder",
    description: "Complete SEO strategy from business profile to growth roadmap",
    color: "primary" as const,
  },
  {
    id: "keyword-research" as SeoToolId,
    icon: Search,
    title: "Keyword Research Engine",
    description: "Deep keyword research with clusters, intent, and opportunities",
    color: "secondary" as const,
  },
  {
    id: "intent-analyzer" as SeoToolId,
    icon: Target,
    title: "Intent Match Analyzer",
    description: "Analyze search intent and ideal content format for any keyword",
    color: "accent" as const,
  },
  {
    id: "competitor-breakdown" as SeoToolId,
    icon: BarChart3,
    title: "Competitor Breakdown",
    description: "Analyze top-ranking pages and find content gaps to exploit",
    color: "primary" as const,
  },
  {
    id: "content-blueprint" as SeoToolId,
    icon: FileText,
    title: "Content Blueprint",
    description: "Full content blueprint with title, headings, FAQs, and links",
    color: "secondary" as const,
  },
  {
    id: "onpage-optimizer" as SeoToolId,
    icon: Globe,
    title: "On-Page Optimizer",
    description: "Audit and optimize page content for maximum search visibility",
    color: "accent" as const,
  },
  {
    id: "plan-audit" as SeoToolId,
    icon: ClipboardCheck,
    title: "SEO Plan Audit",
    description: "Audit your SEO plan and get a refined sustainable strategy",
    color: "primary" as const,
  },
];

// ─── Main Component ────────────────────────────────────

export default function SeoSuite() {
  const [activeTool, setActiveTool] = useState<SeoToolId | null>(null);
  const [project, setProject] = useState<SeoProject | undefined>(() => seoEngine.getActiveProject());
  const [projectName, setProjectName] = useState("");
  const [projectDomain, setProjectDomain] = useState("");

  // Create project if none exists
  const handleCreateProject = useCallback(() => {
    if (!projectName.trim()) return;
    const p = seoEngine.createProject(projectName.trim(), projectDomain.trim() || undefined);
    setProject(p);
    setProjectName("");
    setProjectDomain("");
  }, [projectName, projectDomain]);

  const refreshProject = useCallback(() => {
    if (project) {
      setProject(seoEngine.getProject(project.id));
    }
  }, [project]);

  const handleDeleteProject = useCallback(() => {
    if (project) {
      seoEngine.deleteProject(project.id);
      const next = seoEngine.getActiveProject();
      setProject(next);
    }
  }, [project]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuroraGradient intensity="medium" />
      <StarfieldParticles count={40} />
      <CosmicDust count={12} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <StaggerContainer className="mb-8" delay={0.05}>
          <StaggerItem className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {activeTool && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setActiveTool(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold aurora-text flex items-center gap-2">
                  <TrendingUp className="w-7 h-7" />
                  SEO Strategy Suite
                </h1>
                <p className="text-muted-foreground text-sm">
                  {activeTool
                    ? SEO_TOOLS.find((t) => t.id === activeTool)?.title
                    : "7 powerful SEO tools — one command center"}
                </p>
              </div>
            </div>
            {project && (
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-full glass-card text-xs font-semibold text-primary">
                  {project.name}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8"
                  onClick={handleDeleteProject}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            )}
          </StaggerItem>
        </StaggerContainer>

        {/* Project Gate */}
        {!project ? (
          <ProjectSetup
            projectName={projectName}
            setProjectName={setProjectName}
            projectDomain={projectDomain}
            setProjectDomain={setProjectDomain}
            onCreateProject={handleCreateProject}
          />
        ) : activeTool ? (
          <ToolWorkspace
            toolId={activeTool}
            project={project}
            onBack={() => setActiveTool(null)}
            onRefresh={refreshProject}
          />
        ) : (
          <ToolDashboard
            project={project}
            onSelectTool={setActiveTool}
          />
        )}

        <Footer />
      </div>
    </div>
  );
}

// ─── Project Setup ─────────────────────────────────────

function ProjectSetup({
  projectName,
  setProjectName,
  projectDomain,
  setProjectDomain,
  onCreateProject,
}: {
  projectName: string;
  setProjectName: (v: string) => void;
  projectDomain: string;
  setProjectDomain: (v: string) => void;
  onCreateProject: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto py-16"
    >
      <div className="glass-card-elevated p-8 text-center">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6"
        >
          <Layers className="w-10 h-10 text-primary" />
        </motion.div>
        <h2 className="font-heading text-2xl font-bold mb-2 aurora-text">
          Create an SEO Project
        </h2>
        <p className="text-muted-foreground mb-8">
          All your SEO research, strategies, and audits live within a project.
        </p>

        <div className="space-y-4 text-left">
          <div>
            <Label htmlFor="project-name" className="text-sm font-medium">
              Project Name *
            </Label>
            <Input
              id="project-name"
              placeholder="e.g. My Business SEO"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-1.5"
              onKeyDown={(e) => e.key === "Enter" && onCreateProject()}
            />
          </div>
          <div>
            <Label htmlFor="project-domain" className="text-sm font-medium">
              Domain (optional)
            </Label>
            <Input
              id="project-domain"
              placeholder="e.g. example.com"
              value={projectDomain}
              onChange={(e) => setProjectDomain(e.target.value)}
              className="mt-1.5"
              onKeyDown={(e) => e.key === "Enter" && onCreateProject()}
            />
          </div>
          <CinematicButton
            variant="primary"
            size="lg"
            className="w-full mt-4"
            onClick={onCreateProject}
            disabled={!projectName.trim()}
          >
            <Plus className="w-5 h-5" /> Create Project
          </CinematicButton>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Tool Dashboard (Homepage) ─────────────────────────

function ToolDashboard({
  project,
  onSelectTool,
}: {
  project: SeoProject;
  onSelectTool: (id: SeoToolId) => void;
}) {
  const getResultCount = (toolId: SeoToolId): number => {
    switch (toolId) {
      case "strategy-builder": return project.strategies.length;
      case "keyword-research": return project.keywordResearch.length;
      case "intent-analyzer": return project.intentAnalyses.length;
      case "competitor-breakdown": return project.competitorAnalyses.length;
      case "content-blueprint": return project.contentBlueprints.length;
      case "onpage-optimizer": return project.onPageAudits.length;
      case "plan-audit": return project.planAudits.length;
      default: return 0;
    }
  };

  const totalResults =
    project.strategies.length +
    project.keywordResearch.length +
    project.intentAnalyses.length +
    project.competitorAnalyses.length +
    project.contentBlueprints.length +
    project.onPageAudits.length +
    project.planAudits.length;

  return (
    <>
      {/* Stats Bar */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" delay={0.06}>
        {[
          { label: "Strategies", value: project.strategies.length, icon: Compass, color: "primary" },
          { label: "Keywords", value: project.keywordResearch.reduce((s, r) => s + r.totalKeywords, 0), icon: Search, color: "secondary" },
          { label: "Blueprints", value: project.contentBlueprints.length, icon: FileText, color: "accent" },
          { label: "Total Analyses", value: totalResults, icon: BarChart3, color: "primary" },
        ].map((stat) => (
          <StaggerItem key={stat.label}>
            <div className="glass-card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}/20 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}`} />
              </div>
              <div>
                <p className="font-heading font-bold text-lg">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Tool Grid */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10" delay={0.08}>
        {SEO_TOOLS.map((tool) => (
          <StaggerItem key={tool.id}>
            <SeoToolCard
              icon={tool.icon}
              title={tool.title}
              description={tool.description}
              color={tool.color}
              onClick={() => onSelectTool(tool.id)}
              resultCount={getResultCount(tool.id)}
              badge={getResultCount(tool.id) > 0 ? "Has Results" : undefined}
              badgeActive={getResultCount(tool.id) > 0}
            />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Recent Results */}
      {totalResults > 0 && (
        <section className="mb-10">
          <h2 className="font-heading text-xl font-bold flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent" /> Recent Results
          </h2>
          <div className="space-y-3">
            {project.strategies.slice(-2).map((s) => (
              <SeoResultPanel
                key={s.id}
                title={`Strategy: ${s.businessProfile.businessName}`}
                subtitle={`${s.keywordPriorities.length} keywords · ${s.growthFocus.length} growth phases`}
                sections={[
                  {
                    title: "Growth Phases",
                    items: s.growthFocus.map((g) => `${g.phase}: ${g.objectives[0]}`),
                    type: "info",
                  },
                  {
                    title: "Top Keywords",
                    items: s.keywordPriorities.slice(0, 5).map((k) => `${k.keyword} (${k.priority})`),
                    type: "success",
                  },
                ]}
              />
            ))}
            {project.onPageAudits.slice(-2).map((a) => (
              <SeoResultPanel
                key={a.id}
                title={`On-Page Audit${a.url ? `: ${a.url}` : ""}`}
                subtitle={`Score: ${Math.round(a.score.overall)}/100 · ${a.recommendations.length} recommendations`}
                sections={[
                  {
                    title: "Critical Issues",
                    items: a.recommendations.filter((r) => r.priority === "critical").map((r) => r.description),
                    type: "error",
                  },
                  {
                    title: "Improvements",
                    items: a.recommendations.filter((r) => r.priority === "high").map((r) => r.description).slice(0, 4),
                    type: "warning",
                  },
                ]}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

// ─── Tool Workspace ────────────────────────────────────

function ToolWorkspace({
  toolId,
  project,
  onBack,
  onRefresh,
}: {
  toolId: SeoToolId;
  project: SeoProject;
  onBack: () => void;
  onRefresh: () => void;
}) {
  switch (toolId) {
    case "strategy-builder": return <StrategyBuilderTool project={project} onRefresh={onRefresh} />;
    case "keyword-research": return <KeywordResearchTool project={project} onRefresh={onRefresh} />;
    case "intent-analyzer": return <IntentAnalyzerTool project={project} onRefresh={onRefresh} />;
    case "competitor-breakdown": return <CompetitorBreakdownTool project={project} onRefresh={onRefresh} />;
    case "content-blueprint": return <ContentBlueprintTool project={project} onRefresh={onRefresh} />;
    case "onpage-optimizer": return <OnPageOptimizerTool project={project} onRefresh={onRefresh} />;
    case "plan-audit": return <PlanAuditTool project={project} onRefresh={onRefresh} />;
    default: return null;
  }
}

// ─── 1. Strategy Builder ───────────────────────────────

function StrategyBuilderTool({ project, onRefresh }: { project: SeoProject; onRefresh: () => void }) {
  const [form, setForm] = useState<Partial<BusinessProfile>>({});
  const [result, setResult] = useState<SeoStrategy | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    if (!form.businessName || !form.industry || !form.targetAudience || !form.goals) return;
    setLoading(true);
    setTimeout(() => {
      const strategy = seoEngine.buildStrategy(project.id, {
        businessName: form.businessName!,
        industry: form.industry!,
        targetAudience: form.targetAudience!,
        competitiveLandscape: form.competitiveLandscape || "",
        goals: form.goals!,
        currentWebsite: form.currentWebsite,
        budget: form.budget,
        timeline: form.timeline,
      });
      setResult(strategy);
      setLoading(false);
      onRefresh();
    }, 800);
  };

  return (
    <div className="space-y-6">
      {!result ? (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card-elevated p-6 max-w-2xl">
          <h2 className="font-heading text-xl font-bold mb-1 flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" /> Full SEO Strategy Builder
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Provide your business details to generate a complete SEO strategy with keyword priorities,
            content structure, topical authority mapping, internal linking, and a phased growth roadmap.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Business Name *</Label>
              <Input className="mt-1" placeholder="Acme Corp" value={form.businessName || ""} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
            </div>
            <div>
              <Label className="text-sm">Industry / Niche *</Label>
              <Input className="mt-1" placeholder="e.g. digital marketing" value={form.industry || ""} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </div>
            <div>
              <Label className="text-sm">Target Audience *</Label>
              <Input className="mt-1" placeholder="e.g. small business owners" value={form.targetAudience || ""} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} />
            </div>
            <div>
              <Label className="text-sm">Goals *</Label>
              <Input className="mt-1" placeholder="e.g. increase organic traffic 200%" value={form.goals || ""} onChange={(e) => setForm({ ...form, goals: e.target.value })} />
            </div>
            <div>
              <Label className="text-sm">Competitive Landscape</Label>
              <Input className="mt-1" placeholder="e.g. 3 strong competitors, medium competition" value={form.competitiveLandscape || ""} onChange={(e) => setForm({ ...form, competitiveLandscape: e.target.value })} />
            </div>
            <div>
              <Label className="text-sm">Current Website</Label>
              <Input className="mt-1" placeholder="e.g. example.com" value={form.currentWebsite || ""} onChange={(e) => setForm({ ...form, currentWebsite: e.target.value })} />
            </div>
          </div>

          <CinematicButton
            variant="primary"
            size="lg"
            className="mt-6 w-full"
            onClick={handleGenerate}
            disabled={loading || !form.businessName || !form.industry || !form.targetAudience || !form.goals}
          >
            {loading ? <Zap className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? "Generating Strategy..." : "Generate Full Strategy"}
          </CinematicButton>
        </motion.div>
      ) : (
        <StrategyResult strategy={result} onReset={() => setResult(null)} />
      )}

      {/* Past strategies */}
      {project.strategies.length > 0 && !result && (
        <section>
          <h3 className="font-heading font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">
            Previous Strategies ({project.strategies.length})
          </h3>
          <div className="space-y-3">
            {project.strategies.map((s) => (
              <SeoResultPanel
                key={s.id}
                title={s.businessProfile.businessName}
                subtitle={`${s.keywordPriorities.length} keywords · ${s.businessProfile.industry}`}
                sections={[
                  { title: "Growth Phases", items: s.growthFocus.map((g) => g.phase), type: "info" },
                  { title: "Top Keywords", items: s.keywordPriorities.slice(0, 5).map((k) => `${k.keyword} — ${k.priority}`), type: "success" },
                ]}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StrategyResult({ strategy, onReset }: { strategy: SeoStrategy; onReset: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold aurora-text">
          Strategy: {strategy.businessProfile.businessName}
        </h2>
        <CinematicButton variant="outline" size="sm" onClick={onReset}>
          <Plus className="w-4 h-4" /> New Strategy
        </CinematicButton>
      </div>

      <Tabs defaultValue="keywords" className="w-full">
        <TabsList className="glass-card mb-4">
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="authority">Authority</TabsTrigger>
          <TabsTrigger value="growth">Growth Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="keywords" className="space-y-3">
          {strategy.keywordPriorities.slice(0, 12).map((kp, i) => (
            <div key={i} className="glass-card px-4 py-3 flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{kp.keyword}</p>
                <p className="text-xs text-muted-foreground">
                  Vol: {kp.volume.toLocaleString()} · {kp.intent} · {kp.cluster}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <PriorityBadge priority={kp.priority} />
                <span className="text-xs text-muted-foreground">{kp.difficulty}</span>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="content" className="space-y-3">
          <SeoResultPanel title="Pillar Pages" sections={[{ title: "Pages", items: strategy.contentStructure.pillarPages, type: "success" }]} defaultOpen />
          <SeoResultPanel title="Cluster Topics" sections={[{ title: "Topics", items: strategy.contentStructure.clusterTopics, type: "info" }]} />
          <SeoResultPanel title="Supporting Content" sections={[{ title: "Content", items: strategy.contentStructure.supportingContent, type: "info" }]} />
        </TabsContent>

        <TabsContent value="authority" className="space-y-3">
          <SeoResultPanel
            title="Topical Authority Map"
            defaultOpen
            sections={[
              { title: "Primary Topics", items: strategy.topicalAuthority.primaryTopics, type: "success" },
              { title: "Secondary Topics", items: strategy.topicalAuthority.secondaryTopics, type: "info" },
            ]}
          />
          <SeoResultPanel
            title="Internal Linking Strategy"
            sections={[
              { title: "Pillar → Cluster Links", items: strategy.internalLinking.pillarToCluster.map((l) => `${l.from} → ${l.to} (anchor: "${l.anchorText}")`), type: "info" },
              { title: "Cluster → Support Links", items: strategy.internalLinking.clusterToSupport.map((l) => `${l.from} → ${l.to}`), type: "info" },
            ]}
          />
        </TabsContent>

        <TabsContent value="growth" className="space-y-3">
          {strategy.growthFocus.map((phase, i) => (
            <SeoResultPanel
              key={i}
              title={phase.phase}
              subtitle={phase.duration}
              defaultOpen={i === 0}
              sections={[
                { title: "Objectives", items: phase.objectives, type: "success" },
                { title: "Actions", items: phase.actions, type: "info" },
                { title: "KPIs", items: phase.kpis, type: "warning" },
              ]}
            />
          ))}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

// ─── 2. Keyword Research ───────────────────────────────

function KeywordResearchTool({ project, onRefresh }: { project: SeoProject; onRefresh: () => void }) {
  const [niche, setNiche] = useState("");
  const [result, setResult] = useState<KeywordResearch | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRun = () => {
    if (!niche.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const r = seoEngine.runKeywordResearch(project.id, niche.trim());
      setResult(r);
      setLoading(false);
      onRefresh();
    }, 600);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card-elevated p-6 max-w-xl">
        <h2 className="font-heading text-xl font-bold mb-1 flex items-center gap-2">
          <Search className="w-5 h-5 text-secondary" /> Keyword Research Engine
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Enter a niche to discover primary, secondary, and long-tail keywords grouped by search intent.
        </p>
        <div className="flex gap-3">
          <Input placeholder="e.g. digital marketing" value={niche} onChange={(e) => setNiche(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRun()} className="flex-1" />
          <CinematicButton variant="primary" size="md" onClick={handleRun} disabled={loading || !niche.trim()}>
            {loading ? <Zap className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Research
          </CinematicButton>
        </div>
      </motion.div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Keywords" value={result.totalKeywords} />
            <StatCard label="Clusters" value={result.clusters.length} />
            <StatCard label="Avg. Difficulty" value={result.avgDifficulty} />
            <StatCard label="Top Opportunities" value={result.topOpportunities.length} />
          </div>

          <Tabs defaultValue={result.clusters[0]?.name || "clusters"}>
            <TabsList className="glass-card mb-4 flex-wrap h-auto">
              {result.clusters.map((c) => (
                <TabsTrigger key={c.name} value={c.name} className="text-xs">{c.name}</TabsTrigger>
              ))}
            </TabsList>
            {result.clusters.map((cluster) => (
              <TabsContent key={cluster.name} value={cluster.name} className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">
                  Intent: <span className="font-semibold text-foreground">{cluster.intent}</span> · {cluster.keywords.length} keywords
                </p>
                {cluster.keywords.map((kw, i) => (
                  <div key={i} className="glass-card px-4 py-2.5 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{kw.keyword}</p>
                      <p className="text-xs text-muted-foreground">
                        CPC: ${kw.cpc} · {kw.type} · {kw.trend}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground">{kw.volume.toLocaleString()} vol</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${difficultyColor(kw.difficulty)}`}>{kw.difficulty}</span>
                    </div>
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      )}
    </div>
  );
}

// ─── 3. Intent Analyzer ────────────────────────────────

function IntentAnalyzerTool({ project, onRefresh }: { project: SeoProject; onRefresh: () => void }) {
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState<IntentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const r = seoEngine.analyzeIntent(project.id, keyword.trim());
      setResult(r);
      setLoading(false);
      onRefresh();
    }, 500);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card-elevated p-6 max-w-xl">
        <h2 className="font-heading text-xl font-bold mb-1 flex items-center gap-2">
          <Target className="w-5 h-5 text-accent" /> Intent Match Analyzer
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Analyze search intent for any keyword and get the ideal content format, depth, and structure.
        </p>
        <div className="flex gap-3">
          <Input placeholder="e.g. best SEO tools for small business" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAnalyze()} className="flex-1" />
          <CinematicButton variant="primary" size="md" onClick={handleAnalyze} disabled={loading || !keyword.trim()}>
            {loading ? <Zap className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />} Analyze
          </CinematicButton>
        </div>
      </motion.div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Primary Intent" value={result.primaryIntent} />
            <StatCard label="Best Format" value={result.bestFormat} />
            <StatCard label="Depth" value={result.recommendedDepth} />
            <StatCard label="Requirements" value={result.contentRequirements.length} />
          </div>

          <SeoResultPanel title="User Expectations" defaultOpen sections={[{ title: "What searchers expect", items: result.userExpectations, type: "info" }]} />
          <SeoResultPanel title="Content Requirements" sections={[
            { title: "Critical", items: result.contentRequirements.filter((r) => r.importance === "critical").map((r) => `${r.element}: ${r.description}`), type: "error" },
            { title: "Important", items: result.contentRequirements.filter((r) => r.importance === "high").map((r) => `${r.element}: ${r.description}`), type: "warning" },
          ]} />
          <SeoResultPanel title="Recommended Heading Structure" sections={[
            { title: "H1", items: [result.structureRecommendation.h1], type: "success" },
            { title: "H2 Sections", items: result.structureRecommendation.h2s, type: "info" },
          ]} />
          <SeoResultPanel title="Competitive Gaps" sections={[{ title: "Opportunities to outperform", items: result.competitiveGap, type: "success" }]} />
        </motion.div>
      )}
    </div>
  );
}

// ─── 4. Competitor Breakdown ───────────────────────────

function CompetitorBreakdownTool({ project, onRefresh }: { project: SeoProject; onRefresh: () => void }) {
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState<CompetitorAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const r = seoEngine.analyzeCompetitors(project.id, keyword.trim());
      setResult(r);
      setLoading(false);
      onRefresh();
    }, 700);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card-elevated p-6 max-w-xl">
        <h2 className="font-heading text-xl font-bold mb-1 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> Competitor Structure Breakdown
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Analyze top-ranking pages for any keyword — identify shared patterns, gaps, and opportunities.
        </p>
        <div className="flex gap-3">
          <Input placeholder="e.g. content marketing strategy" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAnalyze()} className="flex-1" />
          <CinematicButton variant="primary" size="md" onClick={handleAnalyze} disabled={loading || !keyword.trim()}>
            {loading ? <Zap className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />} Analyze
          </CinematicButton>
        </div>
      </motion.div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Competitors" value={result.competitors.length} />
            <StatCard label="Avg Words" value={result.avgWordCount.toLocaleString()} />
            <StatCard label="Avg Headings" value={result.avgHeadingCount} />
            <StatCard label="Format" value={result.dominantFormat} />
          </div>

          <SeoResultPanel title="Shared Patterns" defaultOpen sections={[{ title: "What top pages have in common", items: result.sharedPatterns, type: "info" }]} />
          <SeoResultPanel title="Content Gaps" sections={[{ title: "Missing from competitors", items: result.contentGaps, type: "warning" }]} />
          <SeoResultPanel title="Opportunities" sections={[{ title: "How to outperform", items: result.opportunities, type: "success" }]} />

          <h3 className="font-heading font-semibold mt-4">Competitor Pages</h3>
          {result.competitors.map((comp, i) => (
            <SeoResultPanel
              key={i}
              title={comp.title}
              subtitle={`${comp.url} · ${comp.wordCount} words · DA: ${comp.domainAuthority}`}
              sections={[
                { title: "Strengths", items: comp.strengths, type: "success" },
                { title: "Weaknesses", items: comp.weaknesses, type: "warning" },
              ]}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ─── 5. Content Blueprint ──────────────────────────────

function ContentBlueprintTool({ project, onRefresh }: { project: SeoProject; onRefresh: () => void }) {
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState<ContentBlueprint | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const r = seoEngine.createBlueprint(project.id, keyword.trim());
      setResult(r);
      setLoading(false);
      onRefresh();
    }, 600);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card-elevated p-6 max-w-xl">
        <h2 className="font-heading text-xl font-bold mb-1 flex items-center gap-2">
          <FileText className="w-5 h-5 text-secondary" /> SEO Content Blueprint
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Generate a complete content blueprint: title framework, meta description, headings, semantic keywords, FAQs, and internal linking ideas.
        </p>
        <div className="flex gap-3">
          <Input placeholder="e.g. email marketing automation" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleGenerate()} className="flex-1" />
          <CinematicButton variant="primary" size="md" onClick={handleGenerate} disabled={loading || !keyword.trim()}>
            {loading ? <Zap className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Generate
          </CinematicButton>
        </div>
      </motion.div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <StatCard label="Estimated Word Count" value={result.estimatedWordCount.toLocaleString()} className="w-fit" />

          <SeoResultPanel title="Title Framework" defaultOpen sections={[
            { title: "Primary Title", items: [result.titleFramework.primary], type: "success" },
            { title: "Alternatives", items: result.titleFramework.alternatives, type: "info" },
            { title: "Power Words", items: result.titleFramework.powerWords, type: "info" },
          ]} />

          <SeoResultPanel title="Meta Description" sections={[
            { title: "Optimized Meta", items: [result.metaDescription.text], type: "success" },
            { title: "Details", items: [`Length: ${result.metaDescription.lengthChars} chars`, `CTA: ${result.metaDescription.callToAction}`, `Keyword Placement: ${result.metaDescription.keywordPlacement}`], type: "info" },
          ]} />

          <SeoResultPanel title="Heading Structure" sections={[
            { title: "H1", items: [result.headingStructure.h1], type: "success" },
            { title: "H2 Sections", items: result.headingStructure.h2s, type: "info" },
          ]} />

          <SeoResultPanel title="Semantic Keywords" sections={[{
            title: "Keywords & Placement",
            items: result.semanticKeywords.map((sk) => `"${sk.keyword}" — ${sk.suggestedPlacement} (relevance: ${(sk.relevance * 100).toFixed(0)}%)`),
            type: "info",
          }]} />

          <SeoResultPanel title="FAQs (Schema-Ready)" sections={[{
            title: "Questions",
            items: result.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`),
            type: "info",
          }]} />

          <SeoResultPanel title="Internal Linking Ideas" sections={[{
            title: "Link Suggestions",
            items: result.internalLinkingIdeas.map((l) => `"${l.anchorText}" → ${l.targetPage} (${l.context})`),
            type: "success",
          }]} />

          <SeoResultPanel title="Content Outline" sections={result.contentOutline.map((sec) => ({
            title: `${sec.heading} (~${sec.targetWordCount} words)`,
            items: sec.keyPoints,
            type: "info" as const,
          }))} />
        </motion.div>
      )}
    </div>
  );
}

// ─── 6. On-Page Optimizer ──────────────────────────────

function OnPageOptimizerTool({ project, onRefresh }: { project: SeoProject; onRefresh: () => void }) {
  const [content, setContent] = useState("");
  const [keyword, setKeyword] = useState("");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<OnPageAudit | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAudit = () => {
    if (!content.trim() || !keyword.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const r = seoEngine.auditOnPage(project.id, content.trim(), keyword.trim(), url.trim() || undefined);
      setResult(r);
      setLoading(false);
      onRefresh();
    }, 700);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card-elevated p-6 max-w-2xl">
        <h2 className="font-heading text-xl font-bold mb-1 flex items-center gap-2">
          <Globe className="w-5 h-5 text-accent" /> On-Page SEO Optimizer
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Paste your page content and target keyword to get a full SEO audit with actionable recommendations.
        </p>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Target Keyword *</Label>
              <Input className="mt-1" placeholder="e.g. content marketing" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm">Page URL (optional)</Label>
              <Input className="mt-1" placeholder="e.g. https://example.com/blog/post" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-sm">Page Content (HTML or plain text) *</Label>
            <textarea
              className="w-full mt-1 rounded-xl bg-background border border-input px-4 py-3 text-sm min-h-[160px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Paste your page content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <CinematicButton
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleAudit}
            disabled={loading || !content.trim() || !keyword.trim()}
          >
            {loading ? <Zap className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
            {loading ? "Auditing..." : "Run On-Page Audit"}
          </CinematicButton>
        </div>
      </motion.div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Score Rings */}
          <div className="glass-card p-6 flex flex-wrap justify-center gap-6">
            <SeoScoreRing score={result.score.overall} label="Overall" size={100} />
            <SeoScoreRing score={result.score.technical} label="Technical" size={80} strokeWidth={6} />
            <SeoScoreRing score={result.score.content} label="Content" size={80} strokeWidth={6} />
            <SeoScoreRing score={result.score.authority} label="Authority" size={80} strokeWidth={6} />
            <SeoScoreRing score={result.score.userExperience} label="UX" size={80} strokeWidth={6} />
          </div>

          <SeoResultPanel title="Title Tag" defaultOpen sections={[
            { title: "Current", items: [result.titleTag.current], type: result.titleTag.issues.length === 0 ? "success" : "warning" },
            { title: "Optimized", items: [result.titleTag.optimized], type: "success" },
            ...(result.titleTag.issues.length > 0 ? [{ title: "Issues", items: result.titleTag.issues, type: "error" as const }] : []),
          ]} />

          <SeoResultPanel title="Meta Description" sections={[
            { title: "Current", items: [result.metaDescription.current], type: result.metaDescription.issues.length === 0 ? "success" : "warning" },
            { title: "Optimized", items: [result.metaDescription.optimized], type: "success" },
            ...(result.metaDescription.issues.length > 0 ? [{ title: "Issues", items: result.metaDescription.issues, type: "error" as const }] : []),
          ]} />

          <SeoResultPanel title="Heading Structure" sections={[
            { title: "Current", items: [`H1: ${result.headings.h1Count} · H2: ${result.headings.h2Count} · H3: ${result.headings.h3Count}`], type: "info" },
            ...(result.headings.issues.length > 0 ? [{ title: "Issues", items: result.headings.issues, type: "error" as const }] : []),
            { title: "Optimized Structure", items: result.headings.optimized, type: "success" },
          ]} />

          <SeoResultPanel title="Keyword Usage" sections={[
            { title: "Analysis", items: [
              `Density: ${result.keywordUsage.density}%`,
              `In H1: ${result.keywordUsage.inH1 ? "Yes" : "No"}`,
              `In first paragraph: ${result.keywordUsage.inFirstParagraph ? "Yes" : "No"}`,
            ], type: "info" },
            ...(result.keywordUsage.issues.length > 0 ? [{ title: "Issues", items: result.keywordUsage.issues, type: "warning" as const }] : []),
          ]} />

          <SeoResultPanel title={`Readability (Grade: ${result.readability.grade})`} sections={[
            { title: "Metrics", items: [
              `Flesch Score: ${result.readability.fleschScore}`,
              `Avg Sentence Length: ${result.readability.avgSentenceLength} words`,
              `Passive Voice: ${result.readability.passiveVoicePercentage}%`,
            ], type: "info" },
            ...(result.readability.issues.length > 0 ? [{ title: "Issues", items: result.readability.issues, type: "warning" as const }] : []),
          ]} />

          {result.recommendations.length > 0 && (
            <div>
              <h3 className="font-heading font-semibold flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-accent" /> Recommendations ({result.recommendations.length})
              </h3>
              <div className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="glass-card px-4 py-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{rec.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{rec.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={rec.priority} />
                      <span className="text-xs text-muted-foreground">Impact: {rec.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ─── 7. SEO Plan Audit ─────────────────────────────────

function PlanAuditTool({ project, onRefresh }: { project: SeoProject; onRefresh: () => void }) {
  const [plan, setPlan] = useState("");
  const [result, setResult] = useState<SeoPlanAudit | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAudit = () => {
    if (!plan.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const r = seoEngine.auditPlan(project.id, plan.trim());
      setResult(r);
      setLoading(false);
      onRefresh();
    }, 600);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card-elevated p-6 max-w-2xl">
        <h2 className="font-heading text-xl font-bold mb-1 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-primary" /> SEO Plan Audit
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Paste your current SEO plan — keywords, content plan, linking strategy, and optimization approach.
          Get it graded and refined into a sustainable strategy.
        </p>

        <div className="space-y-3">
          <textarea
            className="w-full rounded-xl bg-background border border-input px-4 py-3 text-sm min-h-[200px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Paste your SEO plan here — include your keyword targets, content plan, linking strategy, and optimization approach..."
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          />
          <CinematicButton
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleAudit}
            disabled={loading || !plan.trim()}
          >
            {loading ? <Zap className="w-5 h-5 animate-spin" /> : <ClipboardCheck className="w-5 h-5" />}
            {loading ? "Auditing Plan..." : "Audit My SEO Plan"}
          </CinematicButton>
        </div>
      </motion.div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Overall Grade */}
          <div className="glass-card-elevated p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Overall Grade</p>
              <h3 className="font-heading text-4xl font-black aurora-text">{result.overallGrade}</h3>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Sustainability Score</p>
              <SeoScoreRing score={result.sustainabilityScore} size={80} strokeWidth={6} />
            </div>
          </div>

          <SeoResultPanel title="Strengths" defaultOpen sections={[{ title: "What's working", items: result.strengths, type: "success" }]} />
          <SeoResultPanel title="Weaknesses" sections={[{ title: "Areas to improve", items: result.weaknesses, type: "error" }]} />

          {[result.keywordAssessment, result.contentAssessment, result.linkingAssessment, result.optimizationAssessment].map((assessment) => (
            <SeoResultPanel
              key={assessment.area}
              title={`${assessment.area} — Grade: ${assessment.grade}`}
              sections={[
                { title: "Findings", items: assessment.findings, type: "info" },
                { title: "Recommendations", items: assessment.recommendations, type: "warning" },
                { title: "Quick Wins", items: assessment.quickWins, type: "success" },
              ]}
            />
          ))}

          <h3 className="font-heading font-semibold flex items-center gap-2 mt-4">
            <BookOpen className="w-5 h-5 text-secondary" /> Refined Strategy Roadmap
          </h3>
          {result.refinedStrategy.map((phase) => (
            <SeoResultPanel
              key={phase.phase}
              title={`Phase ${phase.phase}: ${phase.title}`}
              subtitle={phase.duration}
              sections={[
                { title: "Actions", items: phase.actions, type: "info" },
                { title: "Expected Outcome", items: [phase.expectedOutcome], type: "success" },
                { title: "Metrics", items: phase.metrics, type: "warning" },
              ]}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ─── Shared Components ─────────────────────────────────

function StatCard({ label, value, className = "" }: { label: string; value: string | number; className?: string }) {
  return (
    <div className={`glass-card px-4 py-3 ${className}`}>
      <p className="font-heading font-bold text-lg">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "easy": return "bg-green-500/20 text-green-400";
    case "medium": return "bg-yellow-500/20 text-yellow-400";
    case "hard": return "bg-orange-500/20 text-orange-400";
    case "very-hard": return "bg-red-500/20 text-red-400";
    default: return "bg-muted/60 text-muted-foreground";
  }
}
