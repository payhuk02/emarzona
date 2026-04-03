-- ============================================================
-- DIAGNOSTIC - Problème d'upload images artistes
-- Date : 1 Mars 2025
-- Description : Script de diagnostic pour identifier pourquoi
--               les uploads échouent avec "mime type application/json is not supported"
-- ============================================================

-- 1. Vérifier le statut du bucket
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'product-images';

-- 2. Vérifier toutes les politiques pour product-images
SELECT 
  policyname as "Nom de la politique",
  cmd as "Opération",
  roles::text as "Rôles",
  CASE 
    WHEN qual IS NOT NULL THEN qual::text
    ELSE 'Aucune condition USING'
  END as "Condition USING",
  CASE 
    WHEN with_check IS NOT NULL THEN with_check::text
    ELSE 'Aucune condition WITH CHECK'
  END as "Condition WITH CHECK"
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

-- 3. Vérifier s'il y a des politiques en conflit ou dupliquées
SELECT 
  cmd,
  COUNT(*) as "Nombre de politiques",
  array_agg(policyname) as "Noms des politiques"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname LIKE '%product-images%'
    OR qual::text LIKE '%product-images%'
    OR with_check::text LIKE '%product-images%'
  )
GROUP BY cmd
HAVING COUNT(*) > 1;

-- 4. Vérifier les types MIME autorisés dans le bucket
SELECT 
  unnest(allowed_mime_types) as "Type MIME autorisé"
FROM storage.buckets
WHERE id = 'product-images';

-- 5. Test : Vérifier si un utilisateur authentifié peut INSERT dans product-images
-- (Cette requête simule ce que fait Supabase lors d'un upload)
DO $$
DECLARE
  current_user_id UUID;
  test_result BOOLEAN;
BEGIN
  -- Obtenir l'ID de l'utilisateur actuel (si authentifié)
  SELECT auth.uid() INTO current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE '⚠️ Aucun utilisateur authentifié. Les politiques pour INSERT nécessitent TO authenticated.';
  ELSE
    RAISE NOTICE '✅ Utilisateur authentifié détecté: %', current_user_id;
    
    -- Vérifier si les politiques permettraient un INSERT
    -- En simulant une condition de politique
    SELECT EXISTS (
      SELECT 1 
      FROM pg_policies p
      WHERE p.schemaname = 'storage'
        AND p.tablename = 'objects'
        AND p.cmd = 'INSERT'
        AND 'authenticated' = ANY(p.roles)
        AND (
          p.policyname LIKE '%product-images%'
          OR p.qual::text LIKE '%product-images%'
          OR p.with_check::text LIKE '%product-images%'
        )
    ) INTO test_result;
    
    IF test_result THEN
      RAISE NOTICE '✅ Une politique INSERT pour product-images existe pour authenticated';
    ELSE
      RAISE WARNING '❌ Aucune politique INSERT pour product-images trouvée pour authenticated';
    END IF;
  END IF;
END $$;

-- 6. Informations de diagnostic pour le développeur
DO $$
DECLARE
  bucket_exists BOOLEAN;
  bucket_public BOOLEAN;
  insert_policy_exists BOOLEAN;
  select_policy_exists BOOLEAN;
BEGIN
  -- Vérifier si le bucket existe
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'product-images'
  ) INTO bucket_exists;
  
  IF NOT bucket_exists THEN
    RAISE WARNING '❌ Le bucket product-images n''existe pas !';
    RETURN;
  END IF;
  
  -- Vérifier si le bucket est public
  SELECT public INTO bucket_public
  FROM storage.buckets
  WHERE id = 'product-images';
  
  -- Vérifier les politiques
  SELECT EXISTS (
    SELECT 1 
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd = 'INSERT'
      AND 'authenticated' = ANY(roles)
      AND (
        policyname LIKE '%product-images%'
        OR qual::text LIKE '%product-images%'
        OR with_check::text LIKE '%product-images%'
      )
  ) INTO insert_policy_exists;
  
  SELECT EXISTS (
    SELECT 1 
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd = 'SELECT'
      AND (
        'public' = ANY(roles) OR 'authenticated' = ANY(roles)
      )
      AND (
        policyname LIKE '%product-images%'
        OR qual::text LIKE '%product-images%'
        OR with_check::text LIKE '%product-images%'
      )
  ) INTO select_policy_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RÉSUMÉ DU DIAGNOSTIC';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Bucket existe: %', CASE WHEN bucket_exists THEN '✅ OUI' ELSE '❌ NON' END;
  RAISE NOTICE 'Bucket public: %', CASE WHEN bucket_public THEN '✅ OUI' ELSE '❌ NON' END;
  RAISE NOTICE 'Politique INSERT (authenticated): %', CASE WHEN insert_policy_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
  RAISE NOTICE 'Politique SELECT (public/authenticated): %', CASE WHEN select_policy_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
  RAISE NOTICE '';
  
  IF NOT insert_policy_exists THEN
    RAISE WARNING '❌ PROBLÈME IDENTIFIÉ: Aucune politique INSERT pour authenticated.';
    RAISE NOTICE '→ Solution: Exécutez la migration 20250301_final_fix_product_images_access.sql';
  END IF;
  
  IF bucket_exists AND bucket_public AND insert_policy_exists AND select_policy_exists THEN
    RAISE NOTICE '✅ Configuration semble correcte.';
    RAISE NOTICE '';
    RAISE NOTICE 'Si les uploads échouent toujours:';
    RAISE NOTICE '1. Vérifiez que vous êtes bien connecté (auth.uid() doit retourner un UUID)';
    RAISE NOTICE '2. Vérifiez les logs du navigateur pour plus de détails';
    RAISE NOTICE '3. Vérifiez que le Content-Type est correctement défini dans le code client';
    RAISE NOTICE '4. Testez avec un autre type de fichier image';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;





