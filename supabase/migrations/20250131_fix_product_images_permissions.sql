-- ============================================================
-- CORRECTION PERMISSIONS BUCKET product-images
-- Problème : Les images uploadées dans artist/ ne sont pas accessibles publiquement
-- Solution : Corriger les politiques RLS pour permettre l'accès public
-- ============================================================

-- 1. S'assurer que le bucket est public
UPDATE storage.buckets
SET public = true
WHERE id = 'product-images';

-- 2. Supprimer TOUTES les anciennes politiques pour product-images (y compris les nouvelles)
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "product-images - Upload authenticated" ON storage.objects;
DROP POLICY IF EXISTS "product-images - Public read access" ON storage.objects;
DROP POLICY IF EXISTS "product-images - Update authenticated" ON storage.objects;
DROP POLICY IF EXISTS "product-images - Delete authenticated" ON storage.objects;

-- 3. Créer une politique d'upload plus permissive pour les dossiers artist/
-- Les utilisateurs authentifiés peuvent uploader dans artist/ et autres dossiers
CREATE POLICY "product-images - Upload authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
);

-- 4. Politique de lecture publique - TOUS les fichiers du bucket sont accessibles
CREATE POLICY "product-images - Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 5. Politique de mise à jour - Les utilisateurs authentifiés peuvent mettre à jour
CREATE POLICY "product-images - Update authenticated"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- 6. Politique de suppression - Les utilisateurs authentifiés peuvent supprimer
CREATE POLICY "product-images - Delete authenticated"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

