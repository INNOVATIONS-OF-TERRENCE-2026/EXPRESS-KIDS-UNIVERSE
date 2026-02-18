import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, X, AlertCircle, CheckCircle } from "lucide-react";
import { AuroraGradient, StarfieldParticles, CinematicButton } from "@/components/eku";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STAGES = ["Writing story with AI...", "Designing scenes...", "Preparing your adventure..."];

export default function CreateStatus() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storyId = searchParams.get("storyId");
  const [status, setStatus] = useState<"generating" | "done" | "failed">("generating");
  const [progress, setProgress] = useState(20);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!storyId) { navigate("/create"); return; }

    // Animate progress stages for UX
    const stageTimer1 = setTimeout(() => { setStage(1); setProgress(50); }, 3000);
    const stageTimer2 = setTimeout(() => { setStage(2); setProgress(75); }, 8000);

    const poll = setInterval(async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("status")
        .eq("id", storyId)
        .single();

      if (error || !data) { setStatus("failed"); clearInterval(poll); return; }

      if (data.status === "done") {
        setStatus("done");
        setProgress(100);
        setStage(2);
        toast.success("Adventure ready!");
        setTimeout(() => navigate(`/adventure/${storyId}`), 1000);
        clearInterval(poll);
      } else if (data.status === "failed") {
        setStatus("failed");
        toast.error("Generation failed. Please try again.");
        clearInterval(poll);
      }
    }, 2000);

    return () => { clearInterval(poll); clearTimeout(stageTimer1); clearTimeout(stageTimer2); };
  }, [storyId, navigate]);

  if (!storyId) return null;

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <AuroraGradient intensity="medium" />
      <StarfieldParticles count={40} />

      <div className="relative z-10 w-full max-w-lg mx-auto px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center">
          {status === "failed" ? (
            <>
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
              <h2 className="font-heading text-2xl font-bold mb-4">Something went wrong</h2>
              <p className="text-muted-foreground mb-6">We couldn't generate your adventure. Please try again.</p>
              <CinematicButton onClick={() => navigate("/create")}>Try Again</CinematicButton>
            </>
          ) : status === "done" ? (
            <>
              <CheckCircle className="w-16 h-16 text-secondary mx-auto mb-6" />
              <h2 className="font-heading text-2xl font-bold mb-4">Adventure Ready!</h2>
              <p className="text-muted-foreground">Redirecting you to your story...</p>
            </>
          ) : (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 mx-auto mb-6">
                <Loader2 className="w-full h-full text-primary" />
              </motion.div>
              <h2 className="font-heading text-2xl font-bold mb-2">Creating Your Adventure</h2>
              <p className="text-muted-foreground mb-8">AI is crafting something magical...</p>
              <div className="space-y-4 mb-8">
                {STAGES.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < stage ? "bg-secondary text-secondary-foreground" :
                      i === stage ? "bg-primary text-primary-foreground animate-pulse" :
                      "bg-muted text-muted-foreground"
                    }`}>{i < stage ? "✓" : i + 1}</div>
                    <span className={i <= stage ? "text-foreground" : "text-muted-foreground"}>{s}</span>
                  </div>
                ))}
              </div>
              <Progress value={progress} className="mb-6" />
              <CinematicButton variant="ghost" onClick={() => navigate("/create")}><X className="w-4 h-4 mr-2" /> Cancel</CinematicButton>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
