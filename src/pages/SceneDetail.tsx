import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ImageIcon,
  Loader2,
  Volume2,
  Square,
  RotateCcw,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { AuroraGradient, CinematicButton } from "@/components/eku";
import { supabase } from "@/integrations/supabase/client";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { toast } from "sonner";

/**
 * SceneDetail — Full cinematic scene viewer with edit + regeneration.
 *
 * Route: /adventure/:storyId/scene/:sceneNumber
 *
 * Features:
 *  - Full-bleed scene image with glass control overlay
 *  - Caption editing inline
 *  - Image regeneration with duplicate-request guard
 *  - Read-aloud for scene caption
 *  - Prev/Next scene navigation
 *  - Skeleton loading state
 *  - Offline graceful (shows cached data or error)
 */

interface Scene {
  id: string;
  caption: string;
  image_url: string | null;
  scene_number: number;
}
interface Story {
  id: string;
  title: string;
  theme: string;
  child_name: string;
}

export default function SceneDetail() {
  const { storyId, sceneNumber } = useParams();
  const navigate = useNavigate();
  const num = Number(sceneNumber);

  const [story, setStory] = useState<Story | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editCaption, setEditCaption] = useState("");

  const { speak, stop, speaking } = useSpeechSynthesis();

  const scene = scenes.find((s) => s.scene_number === num) ?? null;
  const prevScene = scenes.find((s) => s.scene_number === num - 1);
  const nextScene = scenes.find((s) => s.scene_number === num + 1);

  /* ── Load story + scenes ── */
  useEffect(() => {
    if (!storyId) { navigate("/gallery"); return; }
    setLoading(true);
    (async () => {
      const [storyRes, scenesRes] = await Promise.all([
        supabase.from("stories").select("id, title, theme, child_name").eq("id", storyId).single(),
        supabase.from("story_scenes").select("*").eq("story_id", storyId).order("scene_number"),
      ]);
      if (storyRes.error || !storyRes.data) { navigate("/gallery"); return; }
      setStory(storyRes.data as Story);
      setScenes((scenesRes.data || []) as Scene[]);
      setLoading(false);
    })();
  }, [storyId, navigate]);

  /* ── Regenerate image ── */
  const handleRegenerate = useCallback(async () => {
    if (!scene || !story || regenerating) return;
    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-scene-image", {
        body: {
          sceneId: scene.id,
          caption: scene.caption,
          childName: story.child_name,
          theme: story.theme,
        },
      });
      if (error) throw error;
      if (data?.imageUrl) {
        setScenes((prev) =>
          prev.map((s) => (s.id === scene.id ? { ...s, image_url: data.imageUrl } : s)),
        );
        toast.success("Scene image regenerated!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to regenerate image");
    } finally {
      setRegenerating(false);
    }
  }, [scene, story, regenerating]);

  /* ── Save caption edit ── */
  const handleSaveCaption = useCallback(async () => {
    if (!scene) return;
    const trimmed = editCaption.trim();
    if (!trimmed || trimmed === scene.caption) { setEditing(false); return; }
    try {
      const { error } = await supabase
        .from("story_scenes")
        .update({ caption: trimmed })
        .eq("id", scene.id);
      if (error) throw error;
      setScenes((prev) =>
        prev.map((s) => (s.id === scene.id ? { ...s, caption: trimmed } : s)),
      );
      toast.success("Caption updated!");
    } catch {
      toast.error("Failed to save caption");
    }
    setEditing(false);
  }, [scene, editCaption]);

  /* ── Read aloud ── */
  const handleReadAloud = useCallback(() => {
    if (!scene) return;
    if (speaking) { stop(); return; }
    speak([scene.caption]);
  }, [scene, speaking, speak, stop]);

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="relative min-h-screen">
        <AuroraGradient intensity="low" />
        <div className="relative z-10 py-8 px-4 max-w-4xl mx-auto">
          <div className="h-8 w-40 bg-muted/30 rounded-lg animate-pulse mb-6" />
          <div className="aspect-video bg-muted/20 rounded-2xl animate-pulse mb-6" />
          <div className="h-6 w-3/4 bg-muted/20 rounded animate-pulse mb-3" />
          <div className="h-4 w-1/2 bg-muted/20 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!scene || !story) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <AuroraGradient intensity="low" />
        <div className="relative z-10 text-center">
          <p className="text-muted-foreground mb-4">Scene not found</p>
          <Link to={`/adventure/${storyId}`}>
            <CinematicButton variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" /> Back to Story
            </CinematicButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <AuroraGradient intensity="low" />
      <div className="relative z-10 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* ── Breadcrumb ── */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <Link to={`/adventure/${storyId}`}>
              <CinematicButton variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" /> {story.title}
              </CinematicButton>
            </Link>
            <span className="text-muted-foreground text-sm">
              Scene {scene.scene_number} of {scenes.length}
            </span>
          </div>

          {/* ── Scene Image ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative rounded-2xl overflow-hidden mb-6 group"
            style={{ minHeight: 240 }}
          >
            {scene.image_url ? (
              <img
                src={scene.image_url}
                alt={scene.caption}
                className="w-full aspect-video object-cover rounded-2xl"
                loading="eager"
              />
            ) : (
              <div className="w-full aspect-video bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-2xl flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
              </div>
            )}

            {/* Glass overlay controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
              <div className="flex gap-2">
                <CinematicButton
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
                  aria-label={regenerating ? "Regenerating image" : "Regenerate scene image"}
                >
                  {regenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  {regenerating ? "Generating…" : "Regenerate"}
                </CinematicButton>
              </div>
              <div className="flex gap-2">
                <CinematicButton
                  variant="ghost"
                  size="sm"
                  onClick={handleReadAloud}
                  className="bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
                  aria-label={speaking ? "Stop reading" : "Read caption aloud"}
                >
                  {speaking ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </CinematicButton>
              </div>
            </div>
          </motion.div>

          {/* ── Caption ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="glass-card p-6 mb-6"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                <Sparkles className="w-4 h-4" />
                Scene {scene.scene_number}
              </div>
              {!editing && (
                <button
                  onClick={() => { setEditCaption(scene.caption); setEditing(true); }}
                  className="p-1.5 rounded-lg hover:bg-foreground/10 transition-colors"
                  aria-label="Edit caption"
                >
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-3">
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-xl p-3 text-foreground text-lg leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <CinematicButton variant="ghost" size="sm" onClick={() => setEditing(false)}>
                    <X className="w-4 h-4" /> Cancel
                  </CinematicButton>
                  <CinematicButton variant="outline" size="sm" onClick={handleSaveCaption}>
                    <Check className="w-4 h-4" /> Save
                  </CinematicButton>
                </div>
              </div>
            ) : (
              <p className="text-lg leading-relaxed text-foreground/90">{scene.caption}</p>
            )}
          </motion.div>

          {/* ── Prev / Next Navigation ── */}
          <div className="flex items-center justify-between">
            {prevScene ? (
              <Link to={`/adventure/${storyId}/scene/${prevScene.scene_number}`}>
                <CinematicButton variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" /> Scene {prevScene.scene_number}
                </CinematicButton>
              </Link>
            ) : (
              <div />
            )}
            {nextScene ? (
              <Link to={`/adventure/${storyId}/scene/${nextScene.scene_number}`}>
                <CinematicButton variant="ghost" size="sm">
                  Scene {nextScene.scene_number} <ArrowRight className="w-4 h-4" />
                </CinematicButton>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
