-- ============================================================
-- Politiques RLS pour le bucket store-images
-- Payhuk - Sécurisation de l'accès au Storage
-- ============================================================

-- ==================== NETTOYAGE ====================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent uploader" ON storage.objects;
DROP POLICY IF EXISTS "Lecture publique des images de boutique" ON storage.objects;
DROP POLICY IF EXISTS "Propriétaire peut supprimer ses images" ON storage.objects;
DROP POLICY IF EXISTS "Propriétaire peut mettre à jour ses images" ON storage.objects;

-- ==================== POLITIQUES POUR STORE-IMAGES ====================

-- 1. UPLOAD : Utilisateurs authentifiés peuvent uploader dans leur dossier
CREATE POLICY "Store images - Upload par utilisateurs authentifiés"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. LECTURE : Tout le monde peut lire les images (bucket public)
CREATE POLICY "Store images - Lecture publique"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'store-images');

-- 3. SUPPRESSION : Seul le propriétaire peut supprimer ses images
CREATE POLICY "Store images - Suppression par propriétaire"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'store-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. MISE À JOUR : Seul le propriétaire peut mettre à jour ses images
CREATE POLICY "Store images - Mise à jour par propriétaire"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'store-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'store-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ==================== VÉRIFICATION ====================

-- Afficher toutes les politiques du bucket store-images
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%Store images%'
ORDER BY policyname;

-- ==================== MESSAGE DE SUCCÈS ====================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Politiques RLS configurées avec succès pour store-images !';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Politiques créées :';
  RAISE NOTICE '  1. Upload par utilisateurs authentifiés (dans leur dossier userId/)';
  RAISE NOTICE '  2. Lecture publique (tout le monde peut voir les images)';
  RAISE NOTICE '  3. Suppression par propriétaire uniquement';
  RAISE NOTICE '  4. Mise à jour par propriétaire uniquement';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Sécurité :';
  RAISE NOTICE '  - Chaque utilisateur peut uploader seulement dans son dossier';
  RAISE NOTICE '  - Les images sont publiquement accessibles (nécessaire pour les boutiques)';
  RAISE NOTICE '  - Seul le propriétaire peut supprimer/modifier ses images';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Vous pouvez maintenant uploader des images dans votre application !';
  RAISE NOTICE '';
END $$;

