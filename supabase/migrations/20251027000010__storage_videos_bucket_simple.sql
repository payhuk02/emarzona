-- =====================================================
-- SUPABASE STORAGE - BUCKET POUR VIDÉOS DE COURS
-- Date : 27 octobre 2025
-- Description : Création du bucket "videos" uniquement
-- Les politiques doivent être créées via le Dashboard
-- =====================================================

-- Créer le bucket "videos" s'il n'existe pas
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

-- Vérifier que le bucket a été créé
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'videos') THEN
    RAISE NOTICE '✅ Bucket "videos" créé avec succès';
    RAISE NOTICE '⚠️  Créez maintenant les politiques via le Dashboard Supabase';
  ELSE
    RAISE WARNING '❌ Erreur : Le bucket "videos" n''a pas été créé';
  END IF;
END $$;

