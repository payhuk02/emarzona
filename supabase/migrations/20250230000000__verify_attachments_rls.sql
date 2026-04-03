/**
 * Script de vérification des politiques RLS pour le bucket "attachments"
 * Date: 31 Janvier 2025
 * 
 * Ce script vérifie que :
 * 1. Le bucket "attachments" existe et est public
 * 2. Les 4 politiques RLS existent et sont correctement configurées
 * 
 * Utilisation : Exécuter dans Supabase SQL Editor pour diagnostiquer les problèmes
 */

-- =====================================================
-- VÉRIFICATION 1 : BUCKET PUBLIC
-- =====================================================

DO $$
DECLARE
  bucket_exists BOOLEAN;
  bucket_is_public BOOLEAN;
  bucket_name TEXT;
BEGIN
  -- Vérifier l'existence et la configuration du bucket
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'attachments') INTO bucket_exists;
  SELECT public, name INTO bucket_is_public, bucket_name
  FROM storage.buckets
  WHERE id = 'attachments';
  
  IF NOT bucket_exists THEN
    RAISE EXCEPTION '❌ Le bucket "attachments" n''existe pas. Exécutez d''abord la migration 20250230_create_attachments_storage_bucket.sql';
  END IF;
  
  RAISE NOTICE '✅ Bucket "attachments" existe';
  RAISE NOTICE '   Nom: %', bucket_name;
  
  IF bucket_is_public THEN
    RAISE NOTICE '✅ Bucket est PUBLIC';
  ELSE
    RAISE WARNING '❌ Bucket est PRIVÉ - Problème de configuration!';
    RAISE NOTICE '   Solution: Exécutez la migration 20250230_fix_attachments_rls_policies.sql';
  END IF;
END $$;

-- =====================================================
-- VÉRIFICATION 2 : POLITIQUES RLS
-- =====================================================

DO $$
DECLARE
  policy_count INTEGER;
  select_policy_exists BOOLEAN;
  insert_policy_exists BOOLEAN;
  update_policy_exists BOOLEAN;
  delete_policy_exists BOOLEAN;
BEGIN
  -- Compter les politiques
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%attachments%';
  
  -- Vérifier chaque politique individuellement
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Anyone can view attachments'
      AND cmd = 'SELECT'
  ) INTO select_policy_exists;
  
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can upload attachments'
      AND cmd = 'INSERT'
  ) INTO insert_policy_exists;
  
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can update their own attachments'
      AND cmd = 'UPDATE'
  ) INTO update_policy_exists;
  
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can delete their own attachments'
      AND cmd = 'DELETE'
  ) INTO delete_policy_exists;
  
  -- Afficher les résultats
  RAISE NOTICE '';
  RAISE NOTICE '📋 POLITIQUES RLS TROUVÉES: %', policy_count;
  RAISE NOTICE '';
  
  IF select_policy_exists THEN
    RAISE NOTICE '✅ "Anyone can view attachments" (SELECT) - Existe';
  ELSE
    RAISE WARNING '❌ "Anyone can view attachments" (SELECT) - MANQUANTE (CRITIQUE!)';
  END IF;
  
  IF insert_policy_exists THEN
    RAISE NOTICE '✅ "Authenticated users can upload attachments" (INSERT) - Existe';
  ELSE
    RAISE WARNING '❌ "Authenticated users can upload attachments" (INSERT) - MANQUANTE';
  END IF;
  
  IF update_policy_exists THEN
    RAISE NOTICE '✅ "Users can update their own attachments" (UPDATE) - Existe';
  ELSE
    RAISE WARNING '❌ "Users can update their own attachments" (UPDATE) - MANQUANTE';
  END IF;
  
  IF delete_policy_exists THEN
    RAISE NOTICE '✅ "Users can delete their own attachments" (DELETE) - Existe';
  ELSE
    RAISE WARNING '❌ "Users can delete their own attachments" (DELETE) - MANQUANTE';
  END IF;
  
  -- Résumé
  IF policy_count >= 4 AND select_policy_exists AND insert_policy_exists AND update_policy_exists AND delete_policy_exists THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Toutes les politiques RLS sont correctement configurées!';
  ELSE
    RAISE NOTICE '';
    RAISE WARNING '⚠️ Configuration incomplète. Exécutez la migration 20250230_fix_attachments_rls_policies.sql';
  END IF;
END $$;

-- =====================================================
-- VÉRIFICATION 3 : DÉTAILS DES POLITIQUES
-- =====================================================

SELECT 
  policyname as "Nom de la politique",
  cmd as "Commande",
  CASE 
    WHEN cmd = 'SELECT' THEN 'Lecture publique (tout le monde)'
    WHEN cmd = 'INSERT' THEN 'Upload (utilisateurs authentifiés)'
    WHEN cmd = 'UPDATE' THEN 'Mise à jour (utilisateurs authentifiés)'
    WHEN cmd = 'DELETE' THEN 'Suppression (utilisateurs authentifiés)'
    ELSE 'Autre'
  END as "Description",
  CASE 
    -- Pour SELECT et DELETE, vérifier qual (USING)
    -- Pour INSERT, vérifier with_check (WITH CHECK)
    -- Pour UPDATE, vérifier qual ET with_check
    WHEN cmd = 'INSERT' AND (with_check LIKE '%bucket_id%attachments%' OR with_check LIKE '%attachments%') THEN '✅ Filtre bucket correct'
    WHEN cmd IN ('SELECT', 'DELETE') AND (qual LIKE '%bucket_id%attachments%' OR qual LIKE '%attachments%') THEN '✅ Filtre bucket correct'
    WHEN cmd = 'UPDATE' AND ((qual LIKE '%bucket_id%attachments%' OR qual LIKE '%attachments%') OR (with_check LIKE '%bucket_id%attachments%' OR with_check LIKE '%attachments%')) THEN '✅ Filtre bucket correct'
    ELSE '⚠️ Filtre bucket suspect'
  END as "Statut"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%attachments%'
ORDER BY 
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
    ELSE 5
  END;

-- =====================================================
-- RÉSUMÉ FINAL
-- =====================================================

DO $$
DECLARE
  bucket_is_public BOOLEAN;
  select_policy_exists BOOLEAN;
  total_issues INTEGER := 0;
BEGIN
  -- Vérifier le bucket
  SELECT public INTO bucket_is_public
  FROM storage.buckets
  WHERE id = 'attachments';
  
  IF NOT bucket_is_public THEN
    total_issues := total_issues + 1;
  END IF;
  
  -- Vérifier la politique SELECT (la plus importante)
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Anyone can view attachments'
      AND cmd = 'SELECT'
  ) INTO select_policy_exists;
  
  IF NOT select_policy_exists THEN
    total_issues := total_issues + 1;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  
  IF total_issues = 0 THEN
    RAISE NOTICE '✅ RÉSUMÉ: Configuration correcte - Aucun problème détecté';
  ELSE
    RAISE WARNING '❌ RÉSUMÉ: % problème(s) détecté(s)', total_issues;
    RAISE NOTICE '';
    RAISE NOTICE 'Action requise: Exécutez la migration 20250230_fix_attachments_rls_policies.sql';
  END IF;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

