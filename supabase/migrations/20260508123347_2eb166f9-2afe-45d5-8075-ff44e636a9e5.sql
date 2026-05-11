
-- Remove broad public SELECT (which enabled listing); public file reads still work via the public bucket URL.
DROP POLICY IF EXISTS "service-images public read" ON storage.objects;

-- Allow authenticated users to list/read only their own folder
DO $$ BEGIN
  CREATE POLICY "service-images owner list"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'service-images' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
