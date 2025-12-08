/**
 * Diagnostic approfondi des politiques RLS pour le bucket "attachments"
 * Date: 31 Janvier 2025
 * 
 * Ce script affiche TOUTES les informations sur les politiques RLS
 * pour identifier précisément pourquoi l'accès est bloqué
 */

-- =====================================================
-- 1. ÉTAT DU BUCKET
-- =====================================================

SELECT 
  id as "Bucket ID",
  name as "Nom",
  public as "Public?",
  file_size_limit as "Taille max (bytes)",
  created_at as "Créé le"
FROM storage.buckets
WHERE id = 'attachments';

-- =====================================================
-- 2. TOUTES LES POLITIQUES POUR LE BUCKET "attachments"
-- =====================================================

SELECT 
  policyname as "Nom de la politique",
  cmd as "Commande",
  roles::text as "Rôles ciblés",
  CASE 
    WHEN qual IS NOT NULL THEN qual::text
    ELSE NULL
  END as "USING (qual)",
  CASE 
    WHEN with_check IS NOT NULL THEN with_check::text
    ELSE NULL
  END as "WITH CHECK",
  CASE
    WHEN cmd = 'SELECT' AND roles::text LIKE '%public%' AND qual::text LIKE '%attachments%' THEN '✅ Probablement correcte'
    WHEN cmd = 'SELECT' AND roles::text NOT LIKE '%public%' THEN '❌ MANQUE "TO public"'
    WHEN cmd = 'INSERT' AND roles::text LIKE '%authenticated%' AND with_check::text LIKE '%attachments%' THEN '✅ Probablement correcte'
    WHEN cmd = 'INSERT' AND roles::text NOT LIKE '%authenticated%' THEN '❌ MANQUE "TO authenticated"'
    ELSE '⚠️ À vérifier'
  END as "Statut"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname LIKE '%attachment%'
    OR qual::text LIKE '%attachment%'
    OR with_check::text LIKE '%attachment%'
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

-- =====================================================
-- 3. VÉRIFIER LES POLITIQUES CONFLICTUELLES
-- =====================================================

-- Chercher toutes les politiques qui pourraient affecter le bucket attachments
SELECT 
  policyname as "Politique suspecte",
  cmd as "Commande",
  roles::text as "Rôles",
  qual::text as "Condition USING",
  with_check::text as "Condition WITH CHECK"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    -- Politiques qui mentionnent storage.objects sans restriction bucket_id
    (qual IS NULL OR qual::text NOT LIKE '%bucket_id%')
    AND cmd = 'SELECT'
    AND policyname NOT LIKE '%attachment%'
  )
ORDER BY policyname;

-- =====================================================
-- 4. TEST DE LA POLITIQUE SELECT
-- =====================================================

DO $$
DECLARE
  has_public_select BOOLEAN;
  select_policy_name TEXT;
  select_policy_roles TEXT;
BEGIN
  -- Vérifier s'il existe une politique SELECT avec TO public
  SELECT 
    EXISTS(
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND cmd = 'SELECT'
        AND policyname LIKE '%attachment%'
        AND roles::text LIKE '%public%'
    ),
    policyname,
    roles::text
  INTO has_public_select, select_policy_name, select_policy_roles
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND cmd = 'SELECT'
    AND policyname LIKE '%attachment%'
  LIMIT 1;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'DIAGNOSTIC POLITIQUE SELECT:';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  
  IF has_public_select THEN
    RAISE NOTICE '✅ Politique SELECT trouvée: %', select_policy_name;
    RAISE NOTICE '   Rôles: %', select_policy_roles;
  ELSE
    RAISE WARNING '❌ AUCUNE politique SELECT avec "TO public" trouvée!';
    IF select_policy_name IS NOT NULL THEN
      RAISE NOTICE '   Politique trouvée mais rôles incorrects: %', select_policy_roles;
      RAISE NOTICE '   Nom de la politique: %', select_policy_name;
    ELSE
      RAISE WARNING '   Aucune politique SELECT pour attachments trouvée!';
    END IF;
  END IF;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- =====================================================
-- 5. COMPTE RENDU FINAL
-- =====================================================

DO $$
DECLARE
  bucket_public BOOLEAN;
  policy_count INTEGER;
  public_select_exists BOOLEAN;
BEGIN
  -- Vérifier le bucket
  SELECT public INTO bucket_public
  FROM storage.buckets
  WHERE id = 'attachments';
  
  -- Compter les politiques
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%attachment%';
  
  -- Vérifier politique SELECT publique
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd = 'SELECT'
      AND policyname LIKE '%attachment%'
      AND roles::text LIKE '%public%'
  ) INTO public_select_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'RÉSUMÉ DU DIAGNOSTIC:';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Bucket public: %', CASE WHEN bucket_public THEN '✅ OUI' ELSE '❌ NON' END;
  RAISE NOTICE 'Nombre de politiques: %', policy_count;
  RAISE NOTICE 'Politique SELECT publique: %', CASE WHEN public_select_exists THEN '✅ OUI' ELSE '❌ NON (PROBLÈME!)' END;
  RAISE NOTICE '';
  
  IF NOT bucket_public THEN
    RAISE WARNING '🔴 PROBLÈME 1: Le bucket n''est PAS public';
    RAISE NOTICE '   Solution: UPDATE storage.buckets SET public = true WHERE id = ''attachments'';';
  END IF;
  
  IF NOT public_select_exists THEN
    RAISE WARNING '🔴 PROBLÈME 2: Pas de politique SELECT avec "TO public"';
    RAISE NOTICE '   Solution: Exécutez le script 20250230_force_fix_attachments_rls.sql';
  END IF;
  
  IF bucket_public AND public_select_exists THEN
    RAISE NOTICE '✅ Configuration semble correcte.';
    RAISE NOTICE '   Si les images ne s''affichent toujours pas:';
    RAISE NOTICE '   1. Attendez 2-3 minutes pour la propagation';
    RAISE NOTICE '   2. Videz le cache du navigateur';
    RAISE NOTICE '   3. Vérifiez qu''il n''y a pas d''autres politiques conflictuelles';
  END IF;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

