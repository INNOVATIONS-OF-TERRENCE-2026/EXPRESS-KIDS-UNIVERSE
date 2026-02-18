import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Images, Trash2 } from "lucide-react";
import { AuroraGradient, PosterPreviewCard, EmptyState, CinematicButton } from "@/components/eku";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface StoryItem {
  id: string;
  title: string;
  theme: string;
  child_name: string;
  reading_level: string;
  created_at: string;
  status: string;
}

export default function Gallery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<StoryItem[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadStories();
  }, [user]);

  const loadStories = async () => {
    const { data, error } = await supabase
      .from("stories")
      .select("id, title, theme, child_name, reading_level, created_at, status")
      .eq("status", "done")
      .order("created_at", { ascending: false });

    if (!error) setItems((data || []) as StoryItem[]);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("stories").delete().eq("id", deleteId);
    if (error) { toast.error("Failed to delete"); return; }
    setItems(prev => prev.filter(i => i.id !== deleteId));
    setDeleteId(null);
    toast.success("Removed from gallery");
  };

  if (loading) return null;

  return (
    <div className="relative min-h-screen">
      <AuroraGradient intensity="low" />

      <div className="relative z-10 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-heading text-3xl md:text-4xl font-bold aurora-text mb-2">Your Gallery</h1>
            <p className="text-muted-foreground">All your saved adventures in one place</p>
          </div>

          {items.length === 0 ? (
            <EmptyState icon={Images} title="No adventures yet" description="Your universe is waiting. Create your first adventure and it will appear here." actionLabel="Create Adventure" onAction={() => navigate("/create")} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map(item => (
                <div key={item.id} className="relative group">
                  <PosterPreviewCard title={item.title} theme={item.theme} childName={item.child_name} onClick={() => navigate(`/adventure/${item.id}`)} />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Adventure?</DialogTitle><DialogDescription>This will permanently remove this adventure.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
