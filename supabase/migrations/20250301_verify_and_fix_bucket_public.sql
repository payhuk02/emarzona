-- ============================================================
-- VÉRIFICATION ET CORRECTION FINALE - Bucket product-images
-- Date : 1 Mars 2025
-- Description : Vérifie et corrige la configuration du bucket
--               et des politiques RLS pour garantir l'accès public
-- ============================================================

-- 1. Vérifier et forcer le bucket à être public
DO $$
BEGIN
  -- Vérifier si le bucket existe
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-images') THEN
    RAISE EXCEPTION 'Le bucket product-images n''existe pas. Créez-le d''abord dans le dashboard Supabase.';
  END IF;
  
  -- Forcer le bucket à être public
  UPDATE storage.buckets
  SET public = true
  WHERE id = 'product-images';
  
  IF FOUND THEN
    RAISE NOTICE '✅ Bucket product-images configuré comme PUBLIC';
  ELSE
    RAISE WARNING '⚠️ Impossible de mettre à jour le bucket (peut déjà être public)';
  END IF;
END $$;

-- 2. Supprimer TOUTES les politiques existantes pour product-images
-- (pour éviter les conflits)
DROP POLICY IF EXISTS "product-images - Upload authenticated" ON storage.objects;
DROP POLICY IF EXISTS "product-images - Public read access" ON storage.objects;
DROP POLICY IF EXISTS "product-images - Update authenticated" ON storage.objects;
DROP POLICY IF EXISTS "product-images - Delete authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads 16wiy3a_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads 16wiy3a_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- 3. Créer les politiques RLS propres et correctes

-- Politique 1: Upload pour utilisateurs authentifiés (tous les fichiers du bucket)
CREATE POLICY "product-images - Upload authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Politique 2: Lecture publique (TOUS les fichiers du bucket)
-- C'est la politique la plus importante pour l'accès public
CREATE POLICY "product-images - Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Politique 3: Mise à jour pour utilisateurs authentifiés
CREATE POLICY "product-images - Update authenticated"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Politique 4: Suppression pour utilisateurs authentifiés
CREATE POLICY "product-images - Delete authenticated"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- 4. Vérifier la configuration finale
DO $$
DECLARE
  bucket_public BOOLEAN;
  public_read_policy_exists BOOLEAN;
BEGIN
  -- Vérifier le bucket
  SELECT public INTO bucket_public
  FROM storage.buckets
  WHERE id = 'product-images';
  
  -- Vérifier la politique de lecture publique
  SELECT EXISTS (
    SELECT 1 
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'product-images - Public read access'
      AND cmd = 'SELECT'
      AND 'public' = ANY(roles)
  ) INTO public_read_policy_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RÉSULTAT DE LA VÉRIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Bucket product-images public: %', CASE WHEN bucket_public THEN '✅ OUI' ELSE '❌ NON' END;
  RAISE NOTICE 'Politique lecture publique: %', CASE WHEN public_read_policy_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
  RAISE NOTICE '';
  
  IF bucket_public AND public_read_policy_exists THEN
    RAISE NOTICE '✅ Configuration correcte !';
    RAISE NOTICE '';
    RAISE NOTICE '📋 PROCHAINES ÉTAPES:';
    RAISE NOTICE '1. Attendez 2-3 minutes (délai de propagation Supabase)';
    RAISE NOTICE '2. Testez une URL directement dans votre navigateur:';
    RAISE NOTICE '   https://[votre-projet].supabase.co/storage/v1/object/public/product-images/artist/[nom-fichier]';
    RAISE NOTICE '3. Si l''image s''affiche, le problème est résolu';
    RAISE NOTICE '4. Rechargez votre application et réessayez l''upload';
  ELSE
    RAISE WARNING '⚠️ Configuration incomplète. Vérifiez les erreurs ci-dessus.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- 5. Lister toutes les politiques pour product-images (pour vérification manuelle)
SELECT 
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || substring(qual::text, 1, 100)
    ELSE 'Pas de condition USING'
  END as conditions
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname LIKE '%product-images%' 
    OR qual::text LIKE '%product-images%'
    OR with_check::text LIKE '%product-images%'
  )
ORDER BY policyname;





