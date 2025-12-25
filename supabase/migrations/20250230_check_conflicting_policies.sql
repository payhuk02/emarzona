/**
 * Vérifier les politiques conflictuelles pour le bucket attachments
 * Date: 31 Janvier 2025
 * 
 * Ce script cherche toutes les politiques qui pourraient bloquer l'accès
 * même si elles ne mentionnent pas explicitement "attachments"
 */

-- =====================================================
-- 1. TOUTES LES POLITIQUES SUR storage.objects
-- =====================================================

SELECT 
  policyname as "Nom",
  cmd as "Commande",
  roles::text as "Rôles",
  CASE 
    WHEN qual IS NOT NULL THEN substring(qual::text, 1, 200)
    ELSE NULL
  END as "USING (tronqué)",
  CASE 
    WHEN with_check IS NOT NULL THEN substring(with_check::text, 1, 200)
    ELSE NULL
  END as "WITH CHECK (tronqué)"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY cmd, policyname;

-- =====================================================
-- 2. POLITIQUES QUI POURRAIENT BLOQUER (sans bucket_id spécifique)
-- =====================================================

SELECT 
  policyname as "⚠️ Politique suspecte",
  cmd as "Commande",
  roles::text as "Rôles",
  qual::text as "USING",
  with_check::text as "WITH CHECK"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND cmd = 'SELECT'
  AND (
    -- Politiques sans restriction bucket_id
    (qual IS NULL OR qual::text NOT LIKE '%bucket_id%')
    OR
    -- Politiques avec des conditions restrictives
    qual::text LIKE '%false%'
    OR qual::text LIKE '%auth.uid()%'
    OR qual::text LIKE '%auth.role()%'
  )
  AND policyname NOT LIKE '%attachment%'
ORDER BY policyname;

-- =====================================================
-- 3. VÉRIFIER SI LE BUCKET EST VRAIMENT PUBLIC
-- =====================================================

SELECT 
  id,
  name,
  public,
  CASE 
    WHEN public THEN '✅ Public'
    ELSE '❌ Privé - PROBLÈME!'
  END as "Statut",
  file_size_limit,
  created_at
FROM storage.buckets
WHERE id = 'attachments';

-- =====================================================
-- 4. TESTER L'ACCÈS DIRECT (simulation)
-- =====================================================

DO $$
DECLARE
  bucket_public BOOLEAN;
  select_policy_count INTEGER;
  public_select_count INTEGER;
BEGIN
  -- Vérifier le bucket
  SELECT public INTO bucket_public
  FROM storage.buckets
  WHERE id = 'attachments';
  
  -- Compter les politiques SELECT
  SELECT COUNT(*) INTO select_policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND cmd = 'SELECT'
    AND policyname LIKE '%attachment%';
  
  -- Compter les politiques SELECT publiques
  SELECT COUNT(*) INTO public_select_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND cmd = 'SELECT'
    AND policyname LIKE '%attachment%'
    AND roles::text LIKE '%public%';
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'VÉRIFICATION FINALE:';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Bucket public: %', CASE WHEN bucket_public THEN '✅ OUI' ELSE '❌ NON' END;
  RAISE NOTICE 'Politiques SELECT pour attachments: %', select_policy_count;
  RAISE NOTICE 'Politiques SELECT publiques: %', public_select_count;
  RAISE NOTICE '';
  
  IF NOT bucket_public THEN
    RAISE WARNING '🔴 Le bucket n''est PAS public!';
    RAISE NOTICE '   Exécutez: UPDATE storage.buckets SET public = true WHERE id = ''attachments'';';
  END IF;
  
  IF public_select_count = 0 THEN
    RAISE WARNING '🔴 Aucune politique SELECT publique trouvée!';
  ELSIF public_select_count > 1 THEN
    RAISE WARNING '⚠️ Plusieurs politiques SELECT publiques trouvées (% politiques)', public_select_count;
    RAISE NOTICE '   Cela peut causer des conflits. Vérifiez les résultats ci-dessus.';
  END IF;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

