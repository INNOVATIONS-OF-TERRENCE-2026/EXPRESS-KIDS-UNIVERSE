import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Save, RotateCcw, Download, ArrowLeft, Sparkles } from "lucide-react";
import { AuroraGradient, CinematicButton, StaggerContainer, StaggerItem } from "@/components/eku";
import { getJob, StoryResult } from "@/lib/jobStore";
import { saveToGallery, getGallery } from "@/lib/storage";
import { toast } from "sonner";

export default function AdventureResults() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<StoryResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!jobId) {
      navigate("/create");
      return;
    }
    const job = getJob(jobId);
    if (!job?.result) {
      navigate("/create");
      return;
    }
    setResult(job.result);
    setIsSaved(getGallery().some(g => g.jobId === jobId));
  }, [jobId, navigate]);

  const handleSave = () => {
    if (!result || !jobId) return;
    saveToGallery({
      jobId,
      title: result.storyTitle,
      theme: result.meta.theme,
      childName: result.meta.childName,
      readingLevel: result.meta.readingLevel,
      result,
      createdAt: Date.now(),
    });
    setIsSaved(true);
    toast.success("Saved to gallery!");
  };

  if (!result) return null;

  return (
    <div className="relative min-h-screen">
      <AuroraGradient intensity="low" />

      <div className="relative z-10 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/gallery">
              <CinematicButton variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" /> Gallery
              </CinematicButton>
            </Link>
            <div className="flex gap-2">
              <CinematicButton variant="outline" size="sm" onClick={handleSave} disabled={isSaved}>
                <Save className="w-4 h-4" /> {isSaved ? "Saved" : "Save"}
              </CinematicButton>
              <CinematicButton variant="ghost" size="sm" onClick={() => navigate("/create")}>
                <RotateCcw className="w-4 h-4" /> New
              </CinematicButton>
              <CinematicButton variant="ghost" size="sm" onClick={() => toast.info("Download coming soon!")}>
                <Download className="w-4 h-4" />
              </CinematicButton>
            </div>
          </div>

          <StaggerContainer delay={0.1}>
            {/* Title */}
            <StaggerItem>
              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-4"
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="text-sm">Starring {result.meta.childName}</span>
                </motion.div>
                <h1 className="font-heading text-4xl md:text-5xl font-black aurora-text mb-4">
                  {result.storyTitle}
                </h1>
                <p className="text-muted-foreground">
                  {result.meta.theme} • {result.meta.readingLevel}
                </p>
              </div>
            </StaggerItem>

            {/* Story */}
            <StaggerItem>
              <div className="glass-card p-8 md:p-12 mb-12">
                <div className="flex items-center gap-2 mb-6 text-primary">
                  <BookOpen className="w-5 h-5" />
                  <span className="font-semibold">Reader Mode</span>
                </div>
                <div className="prose prose-invert max-w-none">
                  {result.storyText.split("\n\n").map((p, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.2 }}
                      className="text-lg leading-relaxed mb-6 text-foreground/90"
                    >
                      {p}
                    </motion.p>
                  ))}
                </div>
              </div>
            </StaggerItem>

            {/* Scenes */}
            <StaggerItem>
              <h2 className="font-heading text-2xl font-bold mb-6">Story Scenes</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.scenes.map((scene, i) => (
                  <motion.div
                    key={scene.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="glass-card overflow-hidden group"
                  >
                    <div className="aspect-video bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium">{scene.caption}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </div>
    </div>
  );
}