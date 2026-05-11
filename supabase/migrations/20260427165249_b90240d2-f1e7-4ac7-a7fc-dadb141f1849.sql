-- Bucket public pour les images de services
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique
DROP POLICY IF EXISTS "Service images are publicly viewable" ON storage.objects;
CREATE POLICY "Service images are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'service-images');

-- Upload : utilisateur connecté dans son propre dossier (auth.uid()/...)
DROP POLICY IF EXISTS "Users can upload their own service images" ON storage.objects;
CREATE POLICY "Users can upload their own service images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'service-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own service images" ON storage.objects;
CREATE POLICY "Users can update their own service images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'service-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own service images" ON storage.objects;
CREATE POLICY "Users can delete their own service images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'service-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );