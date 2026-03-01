import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Images, Trash2, Film, Play, Download, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuroraGradient, PosterPreviewCard, EmptyState, CinematicButton } from "@/components/eku";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getGalleryVideos, deleteGalleryItem, type GalleryVideoItem } from "@/lib/galleryService";
import { ProPlayer } from "@/components/ProPlayer";

interface StoryItem {
  id: string;
  title: string;
  theme: string;
  child_name: string;
  reading_level: string;
  created_at: string;
  status: string;
}

type GalleryTab = "stories" | "videos";

export default function Gallery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<StoryItem[]>([]);
  const [videoItems, setVideoItems] = useState<GalleryVideoItem[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"story" | "video">("story");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<GalleryTab>("stories");
  const [playingVideo, setPlayingVideo] = useState<GalleryVideoItem | null>(null);

  useEffect(() => {
    if (user) {
      Promise.all([loadStories(), loadVideos()]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadStories = async () => {
    const { data, error } = await supabase
      .from("stories")
      .select("id, title, theme, child_name, reading_level, created_at, status")
      .eq("status", "done")
      .order("created_at", { ascending: false });

    if (!error) setItems((data || []) as StoryItem[]);
  };

  const loadVideos = async () => {
    if (!user) return;
    const videos = await getGalleryVideos(user.id);
    setVideoItems(videos);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    if (deleteType === "story") {
      const { error } = await supabase.from("stories").delete().eq("id", deleteId);
      if (error) { toast.error("Failed to delete"); return; }
      setItems(prev => prev.filter(i => i.id !== deleteId));
    } else {
      const ok = await deleteGalleryItem(deleteId);
      if (!ok) { toast.error("Failed to delete"); return; }
      setVideoItems(prev => prev.filter(i => i.id !== deleteId));
    }

    setDeleteId(null);
    toast.success("Removed from gallery");
  };

  const handleDownloadVideo = useCallback((url: string, title: string) => {
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, []);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    return `${m} min`;
  };

  if (loading) return null;

  return (
    <div className="relative min-h-screen">
      <AuroraGradient intensity="low" />

      <div className="relative z-10 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl md:text-4xl font-bold aurora-text mb-2">Your Gallery</h1>
            <p className="text-muted-foreground">All your saved adventures in one place</p>
          </div>

          {/* ── Tabs ── */}
          <div className="flex justify-center gap-2 mb-8">
            <button
              onClick={() => setTab("stories")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                tab === "stories"
                  ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                  : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
              }`}
            >
              <Images className="w-4 h-4" />
              Stories ({items.length})
            </button>
            <button
              onClick={() => setTab("videos")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                tab === "videos"
                  ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                  : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
              }`}
            >
              <Film className="w-4 h-4" />
              Videos ({videoItems.length})
            </button>
          </div>

          {/* ── Stories tab ── */}
          {tab === "stories" && (
            <>
              {items.length === 0 ? (
                <EmptyState icon={Images} title="No adventures yet" description="Your universe is waiting. Create your first adventure and it will appear here." actionLabel="Create Adventure" onAction={() => navigate("/create")} />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.map(item => (
                    <div key={item.id} className="relative group">
                      <PosterPreviewCard title={item.title} theme={item.theme} childName={item.child_name} onClick={() => navigate(`/adventure/${item.id}`)} />
                      <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setDeleteType("story"); setDeleteId(item.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Videos tab ── */}
          {tab === "videos" && (
            <>
              {videoItems.length === 0 ? (
                <EmptyState icon={Film} title="No videos yet" description="Create a video in the Video Studio and it will automatically appear here." actionLabel="Go to Video Studio" onAction={() => navigate("/studio/video")} />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {videoItems.map((vid) => (
                    <div
                      key={vid.id}
                      className="glass-card overflow-hidden rounded-2xl group relative cursor-pointer"
                      onClick={() => setPlayingVideo(vid)}
                    >
                      {/* Poster / thumbnail */}
                      <div className="relative aspect-video bg-muted/20 overflow-hidden">
                        {vid.poster_url ? (
                          <img
                            src={vid.poster_url}
                            alt={vid.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                            <Film className="w-10 h-10 text-muted-foreground/50" />
                          </div>
                        )}
                        {/* Play overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100" style={{ transitionDuration: "200ms" }}>
                            <Play className="w-6 h-6 text-black ml-0.5" />
                          </div>
                        </div>
                        {/* Duration badge */}
                        {vid.duration_seconds && (
                          <span className="absolute bottom-2 right-2 text-xs bg-black/70 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(vid.duration_seconds)}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <p className="font-medium text-sm truncate">{vid.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(vid.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Actions overlay */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (vid.output_url) handleDownloadVideo(vid.output_url, vid.title);
                          }}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="w-8 h-8 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteType("video");
                            setDeleteId(vid.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete {deleteType === "story" ? "Adventure" : "Video"}?</DialogTitle><DialogDescription>This will permanently remove this {deleteType}.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ProPlayer Overlay ── */}
      <AnimatePresence>
        {playingVideo && playingVideo.output_url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPlayingVideo(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-4xl"
            >
              <ProPlayer
                url={playingVideo.output_url}
                title={playingVideo.title}
                poster={playingVideo.poster_url}
                onClose={() => setPlayingVideo(null)}
                showSave={false}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
