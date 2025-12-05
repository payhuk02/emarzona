-- =========================================================
-- Script URGENT : Correction immédiate des permissions RLS
-- Date : 31 Janvier 2025
-- Description : Corrige les permissions pour que les images soient accessibles publiquement
-- =========================================================

-- 1. S'assurer que le bucket est public
UPDATE storage.buckets
SET public = true
WHERE id = 'product-images';

-- 2. Supprimer TOUTES les anciennes politiques pour product-images
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'objects' 
      AND schemaname = 'storage'
      AND (policyname LIKE '%product-images%' OR policyname LIKE '%product_images%')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- 3. Créer la politique de LECTURE PUBLIQUE (la plus importante)
CREATE POLICY "product-images - Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 4. Créer la politique d'UPLOAD pour utilisateurs authentifiés
CREATE POLICY "product-images - Upload authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- 5. Créer la politique de MISE À JOUR pour utilisateurs authentifiés
CREATE POLICY "product-images - Update authenticated"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- 6. Créer la politique de SUPPRESSION pour utilisateurs authentifiés
CREATE POLICY "product-images - Delete authenticated"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- 7. Vérification finale
SELECT 
  'Bucket public' AS check_type,
  CASE WHEN public THEN '✅ OUI' ELSE '❌ NON' END AS status
FROM storage.buckets 
WHERE id = 'product-images'

UNION ALL

SELECT 
  'Politique lecture publique' AS check_type,
  CASE WHEN COUNT(*) > 0 THEN '✅ OUI' ELSE '❌ NON' END AS status
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname = 'product-images - Public read access'
  AND cmd = 'SELECT'
  AND 'public' = ANY(roles);

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Script exécuté avec succès !';
  RAISE NOTICE '📋 Vérifiez que le bucket est public et que 4 politiques sont créées.';
  RAISE NOTICE '🔄 Rechargez la page et testez l''upload d''une image.';
END $$;










