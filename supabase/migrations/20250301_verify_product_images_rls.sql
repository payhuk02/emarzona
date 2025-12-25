-- ============================================================
-- VÉRIFICATION ET DIAGNOSTIC - Accès public bucket product-images
-- Date : 1 Mars 2025
-- Description : Script de vérification pour diagnostiquer les problèmes
--               d'accès aux images uploadées
-- ============================================================

-- 1. Vérifier si le bucket existe et s'il est public
DO $$
DECLARE
  bucket_public BOOLEAN;
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'product-images'
  ) INTO bucket_exists;
  
  IF NOT bucket_exists THEN
    RAISE EXCEPTION 'Le bucket product-images n''existe pas. Créez-le d''abord dans le dashboard Supabase.';
  END IF;
  
  SELECT public INTO bucket_public
  FROM storage.buckets
  WHERE id = 'product-images';
  
  IF NOT bucket_public THEN
    RAISE WARNING 'Le bucket product-images n''est PAS public. Exécutez la migration 20250301_fix_product_images_artist_access.sql';
  ELSE
    RAISE NOTICE '✅ Le bucket product-images est public';
  END IF;
END $$;

-- 2. Lister toutes les politiques RLS existantes pour product-images
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
  AND schemaname = 'storage'
  AND (
    policyname LIKE '%product-images%' 
    OR qual::text LIKE '%product-images%'
    OR with_check::text LIKE '%product-images%'
  )
ORDER BY policyname;

-- 3. Vérifier qu'il existe une politique de lecture publique
DO $$
DECLARE
  public_read_policy_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'product-images - Public read access'
      AND cmd = 'SELECT'
      AND 'public' = ANY(roles)
  ) INTO public_read_policy_exists;
  
  IF NOT public_read_policy_exists THEN
    RAISE WARNING '❌ La politique "product-images - Public read access" n''existe pas ou n''est pas correctement configurée';
    RAISE NOTICE '💡 Exécutez la migration 20250301_fix_product_images_artist_access.sql pour corriger';
  ELSE
    RAISE NOTICE '✅ La politique de lecture publique existe';
  END IF;
END $$;

-- 4. Compter les fichiers dans artist/
DO $$
DECLARE
  file_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO file_count
  FROM storage.objects
  WHERE bucket_id = 'product-images'
    AND name LIKE 'artist/%';
  
  RAISE NOTICE '📁 Nombre de fichiers dans artist/: %', file_count;
  
  IF file_count = 0 THEN
    RAISE NOTICE '⚠️  Aucun fichier trouvé dans artist/. Téléchargez une image pour tester.';
  END IF;
END $$;

-- 5. Instructions de diagnostic
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNOSTIC TERMINÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Si les images ne se chargent toujours pas :';
  RAISE NOTICE '1. Vérifiez dans le dashboard Supabase > Storage > product-images > Policies';
  RAISE NOTICE '   qu''il existe une politique SELECT pour "public"';
  RAISE NOTICE '';
  RAISE NOTICE '2. Testez une URL directement dans votre navigateur :';
  RAISE NOTICE '   https://[votre-projet].supabase.co/storage/v1/object/public/product-images/artist/[nom-fichier]';
  RAISE NOTICE '';
  RAISE NOTICE '3. Si vous voyez une erreur JSON, les politiques RLS bloquent l''accès';
  RAISE NOTICE '   Exécutez: supabase/migrations/20250301_fix_product_images_artist_access.sql';
  RAISE NOTICE '';
  RAISE NOTICE '4. Attendez 2-3 minutes après avoir modifié les politiques RLS';
  RAISE NOTICE '   (délai de propagation Supabase)';
  RAISE NOTICE '';
END $$;





