-- ══════════════════════════════════════════════════════════
-- Video Jobs & Gallery Items tables
-- Migration: 20260301 — Video Studio pipeline persistence
-- ══════════════════════════════════════════════════════════

-- ── Video Jobs ──
CREATE TABLE IF NOT EXISTS public.video_jobs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'rendering', 'encoding', 'complete', 'failed')),
  progress INTEGER NOT NULL DEFAULT 0,
  step_label TEXT DEFAULT 'Queued…',
  output_url TEXT,
  thumbnail_url TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.video_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video jobs"
  ON public.video_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own video jobs"
  ON public.video_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own video jobs"
  ON public.video_jobs FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_video_jobs_user_id
  ON public.video_jobs(user_id, created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER update_video_jobs_updated_at
  BEFORE UPDATE ON public.video_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ── Gallery Items ──
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'video'
    CHECK (type IN ('video', 'story', 'image', 'audio')),
  source TEXT NOT NULL DEFAULT 'video_studio',
  job_id TEXT UNIQUE,
  adventure_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  output_url TEXT,
  poster_url TEXT,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'ready'
    CHECK (status IN ('ready', 'processing', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gallery items"
  ON public.gallery_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gallery items"
  ON public.gallery_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gallery items"
  ON public.gallery_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own gallery items"
  ON public.gallery_items FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_gallery_items_user_created
  ON public.gallery_items(user_id, created_at DESC);


-- ── Videos storage bucket ──
INSERT INTO storage.buckets (id, name, public)
  VALUES ('videos', 'videos', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view videos"
  ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "Authenticated users can upload videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');
