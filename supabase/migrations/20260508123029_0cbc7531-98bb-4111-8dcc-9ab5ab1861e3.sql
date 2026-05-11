
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('service-images', 'service-images', true, 26214400, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DO $$ BEGIN
  CREATE POLICY "service-images public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'service-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service-images user upload"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'service-images' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service-images user update"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'service-images' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service-images user delete"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'service-images' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
