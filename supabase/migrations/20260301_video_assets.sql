-- Video asset storage (narration audio + rendered video files)
-- Bucket: video-assets (public reads, authenticated writes)

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('video-assets', 'video-assets', true, 104857600) -- 100 MB limit
ON CONFLICT (id) DO NOTHING;

-- Anyone can read video assets (public bucket)
DO $$ BEGIN
  CREATE POLICY "Anyone can view video assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'video-assets');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Authenticated users can upload video assets
DO $$ BEGIN
  CREATE POLICY "Auth users can upload video assets"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'video-assets' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Authenticated users can overwrite their uploads
DO $$ BEGIN
  CREATE POLICY "Auth users can update video assets"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'video-assets' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
