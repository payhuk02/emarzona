-- =========================================================
-- Migration : Correction accès public pour images artistes
-- Date : 1 Mars 2025
-- Description : S'assure que les fichiers uploadés dans 
--               product-images/artist/ sont accessibles publiquement
-- =========================================================

-- 1. S'assurer que le bucket product-images est public
UPDATE storage.buckets
SET public = true
WHERE id = 'product-images';

-- 2. Supprimer TOUTES les politiques existantes pour product-images (y compris les auto-générées)
-- Cela évite les conflits entre différentes politiques
DROP POLICY IF EXISTS "product-images - Upload authenticated" ON storage.objects;
DROP POLICY IF EXISTS "product-images - Public read access" ON storage.objects;
DROP POLICY IF EXISTS "product-images - Update authenticated" ON storage.objects;
DROP POLICY IF EXISTS "product-images - Delete authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
-- Supprimer aussi les politiques auto-générées que Supabase peut créer
DROP POLICY IF EXISTS "Allow public reads 16wiy3a_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads 16wiy3a_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- Supprimer toutes les autres politiques liées à product-images via une requête dynamique
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND (
        policyname LIKE '%product-images%'
        OR qual::text LIKE '%product-images%'
        OR with_check::text LIKE '%product-images%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    RAISE NOTICE 'Politique supprimée: %', policy_record.policyname;
  END LOOP;
END $$;

-- 3. Politique : Upload pour utilisateurs authentifiés (tous les dossiers du bucket)
CREATE POLICY "product-images - Upload authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
);

-- 4. Politique : Lecture publique (TOUS les fichiers du bucket)
CREATE POLICY "product-images - Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 5. Politique : Mise à jour pour utilisateurs authentifiés
CREATE POLICY "product-images - Update authenticated"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- 6. Politique : Suppression pour utilisateurs authentifiés
CREATE POLICY "product-images - Delete authenticated"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Note: Les commentaires sur les politiques storage.objects nécessitent des privilèges super-utilisateur
-- et ne peuvent pas être ajoutés via les migrations standard. Les politiques sont documentées ici :
-- - "product-images - Upload authenticated": Permet aux utilisateurs authentifiés d'uploader des fichiers
-- - "product-images - Public read access": Permet à tous (public) de lire les fichiers (bucket public)
-- - "product-images - Update authenticated": Permet aux utilisateurs authentifiés de mettre à jour leurs fichiers
-- - "product-images - Delete authenticated": Permet aux utilisateurs authentifiés de supprimer leurs fichiers

