-- ============================================================
-- TEST FINAL - Vérification complète de l'accès public
-- Date : 1 Mars 2025
-- Description : Script de test pour vérifier tous les aspects
--               de l'accès public au bucket product-images
-- ============================================================

-- 1. Vérifier le statut public du bucket
DO $$
DECLARE
  bucket_is_public BOOLEAN;
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'product-images'
  ) INTO bucket_exists;
  
  IF NOT bucket_exists THEN
    RAISE EXCEPTION '❌ Le bucket product-images n''existe pas';
  END IF;
  
  SELECT public INTO bucket_is_public
  FROM storage.buckets
  WHERE id = 'product-images';
  
  IF bucket_is_public THEN
    RAISE NOTICE '✅ Bucket product-images est PUBLIC';
  ELSE
    RAISE WARNING '❌ Bucket product-images n''est PAS public !';
    RAISE NOTICE '💡 Solution: Dans le dashboard Supabase > Storage > Buckets > product-images, activez "Public bucket"';
    -- Essayer de le forcer
    UPDATE storage.buckets SET public = true WHERE id = 'product-images';
    RAISE NOTICE '✅ Tentative de correction: bucket mis à jour comme public';
  END IF;
END $$;

-- 2. Vérifier toutes les politiques RLS pour product-images
SELECT 
  policyname as "Nom de la politique",
  cmd as "Opération",
  roles::text as "Rôles",
  CASE 
    WHEN qual IS NOT NULL THEN substring(qual::text, 1, 150)
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || substring(with_check::text, 1, 150)
    ELSE 'Aucune condition'
  END as "Conditions"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname LIKE '%product-images%' 
    OR qual::text LIKE '%product-images%'
    OR with_check::text LIKE '%product-images%'
  )
ORDER BY 
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
    ELSE 5
  END,
  policyname;

-- 3. Vérifier spécifiquement la politique de lecture publique
DO $$
DECLARE
  public_read_exists BOOLEAN;
  public_read_details RECORD;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'product-images - Public read access'
      AND cmd = 'SELECT'
      AND 'public' = ANY(roles)
  ) INTO public_read_exists;
  
  IF public_read_exists THEN
    SELECT * INTO public_read_details
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'product-images - Public read access';
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Politique de lecture publique trouvée:';
    RAISE NOTICE '   - Nom: %', public_read_details.policyname;
    RAISE NOTICE '   - Opération: %', public_read_details.cmd;
    RAISE NOTICE '   - Rôles: %', public_read_details.roles;
    RAISE NOTICE '   - Condition USING: %', COALESCE(public_read_details.qual::text, 'Aucune');
  ELSE
    RAISE WARNING '❌ Politique de lecture publique manquante ou incorrecte !';
    RAISE NOTICE '💡 Exécutez: supabase/migrations/20250301_fix_product_images_artist_access.sql';
  END IF;
END $$;

-- 4. Lister quelques fichiers dans artist/ pour test
SELECT 
  name as "Nom du fichier",
  created_at as "Date de création",
  metadata->>'size' as "Taille (bytes)",
  metadata->>'mimetype' as "Type MIME"
FROM storage.objects
WHERE bucket_id = 'product-images'
  AND name LIKE 'artist/%'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Vérifier le statut public du bucket (critique pour l'accès public)
DO $$
DECLARE
  bucket_public BOOLEAN;
  bucket_file_count INTEGER;
BEGIN
  SELECT public INTO bucket_public
  FROM storage.buckets
  WHERE id = 'product-images';
  
  SELECT COUNT(*) INTO bucket_file_count
  FROM storage.objects
  WHERE bucket_id = 'product-images'
    AND name LIKE 'artist/%';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNOSTIC FINAL';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Bucket product-images:';
  RAISE NOTICE '  - Public: %', CASE WHEN bucket_public THEN '✅ OUI' ELSE '❌ NON (PROBLÈME!)' END;
  RAISE NOTICE '  - Fichiers dans artist/: %', bucket_file_count;
  RAISE NOTICE '';
  
  IF NOT bucket_public THEN
    RAISE WARNING '⚠️⚠️⚠️ LE BUCKET N''EST PAS PUBLIC ⚠️⚠️⚠️';
    RAISE NOTICE '';
    RAISE NOTICE 'SOLUTION IMMÉDIATE:';
    RAISE NOTICE '1. Ouvrez le dashboard Supabase';
    RAISE NOTICE '2. Allez dans Storage > Buckets';
    RAISE NOTICE '3. Cliquez sur "product-images"';
    RAISE NOTICE '4. Activez "Public bucket" (bouton toggle)';
    RAISE NOTICE '5. Sauvegardez';
    RAISE NOTICE '';
    RAISE NOTICE 'Ou exécutez cette commande:';
    RAISE NOTICE 'UPDATE storage.buckets SET public = true WHERE id = ''product-images'';';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- 6. Instructions de test
DO $$
DECLARE
  test_file_name TEXT;
BEGIN
  SELECT name INTO test_file_name
  FROM storage.objects
  WHERE bucket_id = 'product-images'
    AND name LIKE 'artist/%'
  ORDER BY created_at DESC
  LIMIT 1;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST MANUEL À EFFECTUER';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  IF test_file_name IS NOT NULL THEN
    RAISE NOTICE '1. Testez cette URL dans votre navigateur:';
    RAISE NOTICE '   https://hbdnzajbyjakdhuavrvb.supabase.co/storage/v1/object/public/product-images/%', test_file_name;
  ELSE
    RAISE NOTICE '1. Upload une image dans votre application';
    RAISE NOTICE '2. Testez son URL dans votre navigateur:';
    RAISE NOTICE '   https://hbdnzajbyjakdhuavrvb.supabase.co/storage/v1/object/public/product-images/artist/[nom-fichier]';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '2. Résultats possibles:';
  RAISE NOTICE '   ✅ Image affichée → Problème résolu !';
  RAISE NOTICE '   ⚠️ JSON avec message d''erreur → Politiques RLS ou bucket non public';
  RAISE NOTICE '   ❌ 404 Not Found → Fichier inexistant ou chemin incorrect';
  RAISE NOTICE '   ❌ 403 Forbidden → Bucket non public ou politiques bloquantes';
  RAISE NOTICE '';
  RAISE NOTICE '💡 IMPORTANT: Attendez 2-3 minutes après modification';
  RAISE NOTICE '   (délai de propagation Supabase nécessaire)';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

