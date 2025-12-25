-- ============================================================
-- Script d'Audit RLS (Row Level Security) - Supabase
-- ============================================================
-- Objectif: Vérifier que toutes les tables ont des politiques RLS
-- 
-- Usage:
--   1. Exécuter dans Supabase SQL Editor
--   2. Vérifier les résultats dans l'onglet "Results"
--   3. Suivre les recommandations SQL générées
--   4. Consulter docs/GUIDE_APPLICATION_AUDIT_RLS.md pour les actions
-- ============================================================

-- ============================================================
-- PARTIE 1: Vérifier l'état RLS de toutes les tables
-- ============================================================

DO $$
DECLARE
  table_record RECORD;
  policy_count INTEGER;
  total_tables INTEGER := 0;
  tables_with_rls INTEGER := 0;
  tables_without_rls INTEGER := 0;
  tables_without_policies INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'AUDIT RLS - ROW LEVEL SECURITY';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Parcourir toutes les tables du schéma public
  FOR table_record IN 
    SELECT 
      tablename, 
      rowsecurity as rls_enabled
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    total_tables := total_tables + 1;
    
    -- Compter les politiques pour cette table
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = table_record.tablename;
    
    -- Analyser l'état
    IF table_record.rls_enabled = false THEN
      tables_without_rls := tables_without_rls + 1;
      RAISE NOTICE '❌ Table: % - RLS DÉSACTIVÉ (Aucune protection)', table_record.tablename;
    ELSIF policy_count = 0 THEN
      tables_without_policies := tables_without_policies + 1;
      RAISE NOTICE '⚠️  Table: % - RLS activé mais AUCUNE politique (Accès bloqué!)', table_record.tablename;
    ELSE
      tables_with_rls := tables_with_rls + 1;
      RAISE NOTICE '✅ Table: % - RLS activé avec % politique(s)', table_record.tablename, policy_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'RÉSUMÉ';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Total de tables: %', total_tables;
  RAISE NOTICE 'Tables avec RLS + politiques: %', tables_with_rls;
  RAISE NOTICE 'Tables sans RLS: %', tables_without_rls;
  RAISE NOTICE 'Tables avec RLS mais sans politiques: %', tables_without_policies;
  RAISE NOTICE '';
  
  IF tables_without_rls > 0 OR tables_without_policies > 0 THEN
    RAISE NOTICE '⚠️  ACTION REQUISE: Des tables nécessitent une configuration RLS';
  ELSE
    RAISE NOTICE '✅ Toutes les tables ont RLS configuré correctement';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
END $$;

-- ============================================================
-- PARTIE 2: Détails des politiques existantes
-- ============================================================

SELECT 
  tablename as "Table",
  policyname as "Politique",
  permissive as "Type",
  roles as "Rôles",
  cmd as "Commande",
  CASE 
    WHEN qual IS NOT NULL THEN 'Oui'
    ELSE 'Non'
  END as "USING",
  CASE 
    WHEN with_check IS NOT NULL THEN 'Oui'
    ELSE 'Non'
  END as "WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================
-- PARTIE 3: Tables critiques sans RLS
-- ============================================================

SELECT 
  t.tablename as "Table Critique",
  t.rowsecurity as "RLS Activé",
  COUNT(p.policyname) as "Nombre de Politiques"
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'users', 'profiles', 'stores', 'products', 'orders', 
    'order_items', 'payments', 'customers', 'digital_products',
    'digital_licenses', 'physical_products', 'inventory'
  )
GROUP BY t.tablename, t.rowsecurity
HAVING t.rowsecurity = false OR COUNT(p.policyname) = 0
ORDER BY t.tablename;

-- ============================================================
-- PARTIE 4: Recommandations
-- ============================================================

-- Cette requête génère des recommandations SQL pour activer RLS
SELECT 
  'ALTER TABLE ' || tablename || ' ENABLE ROW LEVEL SECURITY;' as "Recommandation SQL"
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- ============================================================
-- NOTES
-- ============================================================
-- 
-- Après avoir exécuté cet audit:
-- 1. Activer RLS sur les tables sans RLS
-- 2. Créer des politiques pour les tables sans politiques
-- 3. Tester les politiques en développement
-- 4. Documenter les politiques dans supabase/rls-policies.md
--
-- Voir: docs/GUIDE_AUDIT_RLS_SUPABASE.md pour plus de détails
-- ============================================================

