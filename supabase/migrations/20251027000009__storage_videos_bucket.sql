-- =====================================================
-- SUPABASE STORAGE - BUCKET POUR VIDÉOS DE COURS
-- Date : 27 octobre 2025
-- Description : Configuration du bucket "videos" pour stocker les vidéos de cours
-- =====================================================

-- 1. Créer le bucket "videos" s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true, -- Public pour que les vidéos soient accessibles
  524288000, -- 500 MB en octets (500 * 1024 * 1024)
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];

-- 2. Politique : Les utilisateurs authentifiés peuvent uploader des vidéos
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = 'course-videos'
);

-- 3. Politique : Les utilisateurs peuvent voir toutes les vidéos (public)
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
CREATE POLICY "Anyone can view videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'videos');

-- 4. Politique : Les utilisateurs peuvent mettre à jour leurs propres vidéos
DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
CREATE POLICY "Users can update their own videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos' AND
  owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'videos' AND
  owner = auth.uid()
);

-- 5. Politique : Les utilisateurs peuvent supprimer leurs propres vidéos
DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;
CREATE POLICY "Users can delete their own videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND
  owner = auth.uid()
);

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON POLICY "Authenticated users can upload videos" ON storage.objects IS
'Permet aux utilisateurs authentifiés de télécharger des vidéos dans le dossier course-videos';

COMMENT ON POLICY "Anyone can view videos" ON storage.objects IS
'Permet à tout le monde de voir les vidéos (public)';

COMMENT ON POLICY "Users can update their own videos" ON storage.objects IS
'Permet aux utilisateurs de mettre à jour uniquement leurs propres vidéos';

COMMENT ON POLICY "Users can delete their own videos" ON storage.objects IS
'Permet aux utilisateurs de supprimer uniquement leurs propres vidéos';

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Vérifier que le bucket a été créé
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'videos') THEN
    RAISE NOTICE '✅ Bucket "videos" créé avec succès';
  ELSE
    RAISE WARNING '❌ Erreur : Le bucket "videos" n''a pas été créé';
  END IF;
END $$;

