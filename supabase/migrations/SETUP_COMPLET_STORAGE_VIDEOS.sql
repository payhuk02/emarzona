-- =====================================================
-- CONFIGURATION COMPLÈTE DU STORAGE POUR VIDÉOS
-- Date : 27 octobre 2025
-- Auteur : Intelli / payhuk02
-- 
-- ⚠️  EXÉCUTER CE SCRIPT VIA LE DASHBOARD SUPABASE
-- =====================================================

-- =====================================================
-- PARTIE 1 : CRÉER LE BUCKET
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  524288000, -- 500 MB
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];

-- =====================================================
-- PARTIE 2 : SUPPRIMER LES ANCIENNES POLITIQUES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;

-- =====================================================
-- PARTIE 3 : CRÉER LES NOUVELLES POLITIQUES
-- =====================================================

-- Politique 1 : INSERT (Upload)
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = 'course-videos'
);

-- Politique 2 : SELECT (Lecture publique)
CREATE POLICY "Anyone can view videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'videos');

-- Politique 3 : UPDATE (Modification)
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

-- Politique 4 : DELETE (Suppression)
CREATE POLICY "Users can delete their own videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND
  owner = auth.uid()
);

-- =====================================================
-- PARTIE 4 : VÉRIFICATION
-- =====================================================

DO $$
DECLARE
  bucket_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Vérifier le bucket
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets
  WHERE id = 'videos';
  
  IF bucket_count > 0 THEN
    RAISE NOTICE '✅ Bucket "videos" créé/mis à jour avec succès';
  ELSE
    RAISE WARNING '❌ Erreur : Bucket "videos" non trouvé';
  END IF;
  
  -- Vérifier les politiques
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname IN (
      'Authenticated users can upload videos',
      'Anyone can view videos',
      'Users can update their own videos',
      'Users can delete their own videos'
    );
  
  RAISE NOTICE '✅ Nombre de politiques créées : %', policy_count;
  
  IF policy_count = 4 THEN
    RAISE NOTICE '🎉 CONFIGURATION COMPLÈTE RÉUSSIE !';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Résumé :';
    RAISE NOTICE '  ✅ Bucket "videos" : configuré';
    RAISE NOTICE '  ✅ Taille max : 500 MB par fichier';
    RAISE NOTICE '  ✅ Types acceptés : MP4, WebM, OGG, MOV, AVI';
    RAISE NOTICE '  ✅ Politiques RLS : 4 politiques actives';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Prochaines étapes :';
    RAISE NOTICE '  1. Créer le dossier "course-videos" dans Storage';
    RAISE NOTICE '  2. Tester l''upload depuis votre application';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Vous pouvez maintenant uploader des vidéos !';
  ELSE
    RAISE WARNING '⚠️  Attention : Seulement % politiques créées sur 4', policy_count;
  END IF;
END $$;

