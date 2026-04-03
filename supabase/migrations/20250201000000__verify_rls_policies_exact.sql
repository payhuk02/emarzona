-- ============================================================
-- VÉRIFICATION EXACTE DES POLITIQUES RLS
-- Date : 1 Février 2025
-- Description : Vérifie EXACTEMENT comment les politiques sont configurées
-- ============================================================

-- Afficher TOUTES les politiques pour storage.objects
SELECT 
  policyname as "Nom de la politique",
  cmd as "Opération",
  roles::text as "Rôles (CRITIQUE)",
  CASE 
    WHEN qual IS NOT NULL THEN substring(qual::text, 1, 200)
    ELSE 'Aucune condition USING'
  END as "Condition USING",
  CASE 
    WHEN with_check IS NOT NULL THEN substring(with_check::text, 1, 200)
    ELSE 'Aucune condition WITH CHECK'
  END as "Condition WITH CHECK"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname ILIKE '%attachment%'
    OR qual::text ILIKE '%attachment%'
    OR with_check::text ILIKE '%attachment%'
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

-- Vérifier spécifiquement la politique SELECT pour public
DO $$
DECLARE
  select_policy_for_public BOOLEAN;
  select_policy_for_authenticated BOOLEAN;
  select_policy_name TEXT;
  select_policy_roles TEXT[];
BEGIN
  -- Vérifier s'il existe une politique SELECT pour public
  SELECT 
    EXISTS (
      SELECT 1 
      FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND cmd = 'SELECT'
        AND 'public' = ANY(roles)
        AND (
          qual::text ILIKE '%attachment%'
          OR with_check::text ILIKE '%attachment%'
          OR policyname ILIKE '%attachment%'
        )
    ),
    EXISTS (
      SELECT 1 
      FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND cmd = 'SELECT'
        AND 'authenticated' = ANY(roles)
        AND (
          qual::text ILIKE '%attachment%'
          OR with_check::text ILIKE '%attachment%'
          OR policyname ILIKE '%attachment%'
        )
    )
  INTO select_policy_for_public, select_policy_for_authenticated;
  
  -- Récupérer le nom et les rôles de la politique SELECT
  SELECT 
    policyname,
    roles::text[]
  INTO select_policy_name, select_policy_roles
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND cmd = 'SELECT'
    AND (
      qual::text ILIKE '%attachment%'
      OR with_check::text ILIKE '%attachment%'
      OR policyname ILIKE '%attachment%'
    )
  LIMIT 1;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'VÉRIFICATION CRITIQUE - POLITIQUE SELECT';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  IF select_policy_name IS NOT NULL THEN
    RAISE NOTICE 'Politique SELECT trouvée: %', select_policy_name;
    RAISE NOTICE 'Rôles: %', array_to_string(select_policy_roles, ', ');
    
    IF select_policy_for_public THEN
      RAISE NOTICE '✅ Politique SELECT pour PUBLIC: ✅ OUI';
    ELSE
      RAISE WARNING '❌ Politique SELECT pour PUBLIC: ❌ NON';
    END IF;
    
    IF select_policy_for_authenticated THEN
      RAISE NOTICE '⚠️ Politique SELECT pour AUTHENTICATED: ⚠️ OUI (peut causer des problèmes)';
    END IF;
    
    IF NOT select_policy_for_public AND select_policy_for_authenticated THEN
      RAISE WARNING '';
      RAISE WARNING '❌ PROBLÈME CRITIQUE DÉTECTÉ !';
      RAISE WARNING 'La politique SELECT est pour AUTHENTICATED au lieu de PUBLIC.';
      RAISE WARNING 'Cela empêche l''accès public aux fichiers et cause l''erreur JSON.';
      RAISE WARNING '';
      RAISE WARNING 'SOLUTION:';
      RAISE WARNING '1. Supprimez la politique actuelle';
      RAISE WARNING '2. Créez une nouvelle politique SELECT pour PUBLIC';
      RAISE WARNING '';
    END IF;
  ELSE
    RAISE WARNING '❌ Aucune politique SELECT trouvée pour attachments !';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- Vérifier le bucket
SELECT 
  id,
  name,
  public as "Public",
  allowed_mime_types as "Restrictions MIME",
  file_size_limit as "Taille max (bytes)"
FROM storage.buckets
WHERE id = 'attachments';

