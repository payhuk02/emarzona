-- ============================================================
-- CORRECTION FINALE - POLITIQUES RLS POUR product-images
-- Ce script supprime TOUTES les politiques existantes et en crée de nouvelles, simples et claires
-- Exécutez ce script dans Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. S'assurer que le bucket est public
UPDATE storage.buckets
SET public = true
WHERE id = 'product-images';

-- 2. Supprimer TOUTES les politiques existantes pour product-images
-- Utiliser une boucle pour supprimer toutes les politiques, même celles qu'on ne connaît pas
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname LIKE '%product-images%'
  ) LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    RAISE NOTICE 'Politique supprimée: %', r.policyname;
  END LOOP;
END $$;

-- 3. Créer UNE SEULE politique de lecture publique (la plus simple possible)
-- Cette politique permet à TOUT LE MONDE (public) de lire les fichiers du bucket
CREATE POLICY "product-images - Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 4. Créer une politique d'upload pour les utilisateurs authentifiés
CREATE POLICY "product-images - Upload authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- 5. Créer une politique de mise à jour
CREATE POLICY "product-images - Update authenticated"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- 6. Créer une politique de suppression
CREATE POLICY "product-images - Delete authenticated"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- ============================================================
-- VÉRIFICATION
-- ============================================================
-- Afficher les politiques créées
SELECT 
  policyname,
  cmd as operation,
  roles,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%product-images%'
ORDER BY policyname;

-- Afficher le statut du bucket
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'product-images';

-- Message de succès
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Politiques RLS corrigées avec succès !';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Politiques créées :';
  RAISE NOTICE '  1. Public read access (SELECT, public)';
  RAISE NOTICE '  2. Upload authenticated (INSERT, authenticated)';
  RAISE NOTICE '  3. Update authenticated (UPDATE, authenticated)';
  RAISE NOTICE '  4. Delete authenticated (DELETE, authenticated)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Le bucket product-images est maintenant public avec des politiques RLS correctes.';
  RAISE NOTICE '✨ Les images devraient maintenant s''afficher correctement !';
  RAISE NOTICE '';
END $$;










