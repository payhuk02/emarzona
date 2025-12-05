-- ============================================================
-- CORRECTION URGENTE - POLITIQUES RLS POUR product-images
-- Exécutez ce script dans Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. S'assurer que le bucket est public
UPDATE storage.buckets
SET public = true
WHERE id = 'product-images';

-- 2. Supprimer TOUTES les anciennes politiques pour product-images
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "product-images - Upload authenticated" ON storage.objects;
DROP POLICY IF EXISTS "product-images - Public read access" ON storage.objects;
DROP POLICY IF EXISTS "product-images - Update authenticated" ON storage.objects;
DROP POLICY IF EXISTS "product-images - Delete authenticated" ON storage.objects;

-- 3. Créer la politique de LECTURE PUBLIQUE (la plus importante !)
CREATE POLICY "product-images - Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 4. Créer la politique d'UPLOAD pour les utilisateurs authentifiés
CREATE POLICY "product-images - Upload authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- 5. Créer la politique de MISE À JOUR pour les utilisateurs authentifiés
CREATE POLICY "product-images - Update authenticated"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- 6. Créer la politique de SUPPRESSION pour les utilisateurs authentifiés
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
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%product-images%'
ORDER BY policyname;










