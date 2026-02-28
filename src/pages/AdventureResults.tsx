import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, RotateCcw, ArrowLeft, Sparkles, ImageIcon, Loader2, Volume2, Pause, Square, FastForward } from "lucide-react";
import { AuroraGradient, CinematicButton, StaggerContainer, StaggerItem } from "@/components/eku";
import { supabase } from "@/integrations/supabase/client";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { getParentSettings } from "@/lib/storage";
import { toast } from "sonner";

interface Scene { id: string; caption: string; image_url: string | null; scene_number: number; }
interface Story { id: string; title: string; story_text: string; theme: string; child_name: string; reading_level: string; }

export default function AdventureResults() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());
  const { speak, stop, pause, resume, speaking, paused, currentIndex, rate, setRate } = useSpeechSynthesis();

  useEffect(() => {
    if (!storyId) { navigate("/create"); return; }
    loadStory();
  }, [storyId]);

  const loadStory = async () => {
    const { data: storyData, error } = await supabase.from("stories").select("*").eq("id", storyId!).single();
    if (error || !storyData) { navigate("/gallery"); return; }
    setStory(storyData as Story);
    const { data: scenesData } = await supabase.from("story_scenes").select("*").eq("story_id", storyId!).order("scene_number");
    setScenes((scenesData || []) as Scene[]);
  };

  const generateImage = async (scene: Scene) => {
    if (!story) return;
    setGeneratingImages(prev => new Set(prev).add(scene.id));
    try {
      const { data, error } = await supabase.functions.invoke("generate-scene-image", {
        body: { sceneId: scene.id, caption: scene.caption, childName: story.child_name, theme: story.theme },
      });
      if (error) throw error;
      if (data?.imageUrl) {
        setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, image_url: data.imageUrl } : s));
        toast.success("Scene illustration generated!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate image");
    } finally {
      setGeneratingImages(prev => { const n = new Set(prev); n.delete(scene.id); return n; });
    }
  };

  const generateAllImages = async () => {
    for (const scene of scenes.filter(s => !s.image_url)) await generateImage(scene);
  };

  const handleReadAloud = () => {
    if (!story) return;
    if (!getParentSettings().soundEnabled) { toast.info("Enable sound effects in Parent Controls first"); return; }
    const paragraphs = story.story_text.split("\n\n").filter(Boolean);
    speak(paragraphs);
  };

  if (!story) return null;

  const paragraphs = story.story_text.split("\n\n").filter(Boolean);

  return (
    <div className="relative min-h-screen">
      <AuroraGradient intensity="low" />
      <div className="relative z-10 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Link to="/gallery"><CinematicButton variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /> Gallery</CinematicButton></Link>
            <div className="flex gap-2">
              <CinematicButton variant="ghost" size="sm" onClick={() => navigate("/create")}><RotateCcw className="w-4 h-4" /> New</CinematicButton>
            </div>
          </div>

          <StaggerContainer delay={0.1}>
            <StaggerItem>
              <div className="text-center mb-12">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-4">
                  <Sparkles className="w-4 h-4 text-accent" /><span className="text-sm">Starring {story.child_name}</span>
                </motion.div>
                <h1 className="font-heading text-4xl md:text-5xl font-black aurora-text mb-4">{story.title}</h1>
                <p className="text-muted-foreground">{story.theme} • {story.reading_level}</p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="glass-card p-8 md:p-12 mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-primary">
                    <BookOpen className="w-5 h-5" /><span className="font-semibold">Reader Mode</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {speaking && (
                      <>
                        <select value={rate} onChange={e => setRate(Number(e.target.value))} className="text-xs bg-muted rounded px-2 py-1 text-foreground">
                          <option value={0.75}>0.75x</option>
                          <option value={1}>1x</option>
                          <option value={1.25}>1.25x</option>
                        </select>
                        <CinematicButton variant="ghost" size="sm" onClick={paused ? resume : pause}>
                          <Pause className="w-4 h-4" />
                        </CinematicButton>
                        <CinematicButton variant="ghost" size="sm" onClick={stop}>
                          <Square className="w-4 h-4" />
                        </CinematicButton>
                      </>
                    )}
                    {!speaking && (
                      <CinematicButton variant="outline" size="sm" onClick={handleReadAloud}>
                        <Volume2 className="w-4 h-4" /> Read Aloud
                      </CinematicButton>
                    )}
                  </div>
                </div>
                <div className="prose prose-invert max-w-none">
                  {paragraphs.map((p, i) => (
                    <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.2 }}
                      className={`text-lg leading-relaxed mb-6 transition-colors duration-300 ${currentIndex === i ? "text-primary font-medium" : "text-foreground/90"}`}>{p}</motion.p>
                  ))}
                </div>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-2xl font-bold">Story Scenes</h2>
                {scenes.some(s => !s.image_url) && (
                  <CinematicButton variant="outline" size="sm" onClick={generateAllImages}>
                    <ImageIcon className="w-4 h-4" /> Generate All Images
                  </CinematicButton>
                )}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {scenes.map((scene, i) => (
                  <motion.div key={scene.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.1 }} className="glass-card overflow-hidden group">
                    <div className="aspect-video bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center relative overflow-hidden">
                      {scene.image_url ? (
                        <img src={scene.image_url} alt={scene.caption} className="w-full h-full object-cover" />
                      ) : generatingImages.has(scene.id) ? (
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      ) : (
                        <button onClick={() => generateImage(scene)} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                          <ImageIcon className="w-8 h-8" /><span className="text-xs">Generate Image</span>
                        </button>
                      )}
                    </div>
                    <div className="p-4"><p className="text-sm font-medium">{scene.caption}</p></div>
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
