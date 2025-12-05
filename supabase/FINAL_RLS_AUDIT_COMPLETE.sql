-- ============================================================
-- AUDIT FINAL COMPLET RLS - Vérification Complète
-- Date: 2025-01-30
-- 
-- Ce script effectue un audit complet pour confirmer que toutes
-- les tables sont correctement sécurisées avec RLS
-- ============================================================

-- ============================================================
-- 1. RÉSUMÉ EXÉCUTIF
-- ============================================================

SELECT 
  '📊 RÉSUMÉ EXÉCUTIF' as section,
  COUNT(*) as total_tables,
  COUNT(*) FILTER (WHERE rls_enabled) as tables_avec_rls,
  COUNT(*) FILTER (WHERE NOT rls_enabled) as tables_sans_rls,
  COUNT(*) FILTER (WHERE rls_enabled AND policy_count > 0) as tables_securisees,
  COUNT(*) FILTER (WHERE rls_enabled AND policy_count = 0) as tables_sans_politiques,
  ROUND(
    (COUNT(*) FILTER (WHERE rls_enabled AND policy_count > 0)::numeric / 
     NULLIF(COUNT(*) FILTER (WHERE rls_enabled), 0)) * 100, 
    2
  ) as pourcentage_securisation
FROM audit_rls_policies();

-- ============================================================
-- 2. TABLES SANS RLS (⚠️ CRITIQUE)
-- ============================================================

SELECT 
  '🔴 TABLES SANS RLS' as section,
  table_name,
  recommendation
FROM audit_rls_policies()
WHERE NOT rls_enabled
ORDER BY table_name;

-- ============================================================
-- 3. TABLES AVEC RLS MAIS SANS POLITIQUES (⚠️ CRITIQUE)
-- ============================================================

SELECT 
  '🟠 TABLES SANS POLITIQUES' as section,
  table_name,
  rls_enabled,
  policy_count,
  recommendation
FROM audit_rls_policies()
WHERE rls_enabled AND policy_count = 0
ORDER BY table_name;

-- ============================================================
-- 4. TABLES AVEC POLITIQUES INCOMPLÈTES
-- ============================================================

SELECT 
  '🟡 POLITIQUES INCOMPLÈTES' as section,
  table_name,
  rls_enabled,
  policy_count,
  has_select_policy,
  has_insert_policy,
  has_update_policy,
  has_delete_policy,
  recommendation
FROM audit_rls_policies()
WHERE rls_enabled 
  AND policy_count > 0
  AND (
    NOT has_select_policy 
    OR NOT has_insert_policy 
    OR NOT has_update_policy 
    OR NOT has_delete_policy
  )
ORDER BY 
  CASE WHEN NOT has_select_policy THEN 0 ELSE 1 END,
  table_name;

-- ============================================================
-- 5. TABLES PARFAITEMENT SÉCURISÉES ✅
-- ============================================================

SELECT 
  '✅ TABLES PARFAITEMENT SÉCURISÉES' as section,
  COUNT(*) as nombre_tables,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as tables
FROM audit_rls_policies()
WHERE rls_enabled 
  AND policy_count > 0
  AND has_select_policy
  AND has_insert_policy
  AND has_update_policy
  AND has_delete_policy;

-- ============================================================
-- 6. STATISTIQUES PAR TYPE DE POLITIQUE
-- ============================================================

SELECT 
  '📈 STATISTIQUES PAR TYPE' as section,
  COUNT(*) as total_tables,
  COUNT(*) FILTER (WHERE has_select_policy) as avec_select,
  COUNT(*) FILTER (WHERE has_insert_policy) as avec_insert,
  COUNT(*) FILTER (WHERE has_update_policy) as avec_update,
  COUNT(*) FILTER (WHERE has_delete_policy) as avec_delete,
  COUNT(*) FILTER (WHERE has_select_policy AND has_insert_policy AND has_update_policy AND has_delete_policy) as toutes_politiques
FROM audit_rls_policies()
WHERE rls_enabled AND policy_count > 0;

-- ============================================================
-- 7. DISTRIBUTION DU NOMBRE DE POLITIQUES PAR TABLE
-- ============================================================

SELECT 
  '📊 DISTRIBUTION DES POLITIQUES' as section,
  policy_count as nombre_politiques,
  COUNT(*) as nombre_tables,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as tables
FROM audit_rls_policies()
WHERE rls_enabled AND policy_count > 0
GROUP BY policy_count
ORDER BY policy_count;

-- ============================================================
-- 8. TOP 20 TABLES AVEC LE PLUS DE POLITIQUES
-- ============================================================

SELECT 
  '🏆 TOP 20 TABLES' as section,
  table_name,
  policy_count,
  has_select_policy,
  has_insert_policy,
  has_update_policy,
  has_delete_policy,
  array_length(policies, 1) as nombre_politiques_liste
FROM audit_rls_policies()
WHERE rls_enabled AND policy_count > 0
ORDER BY policy_count DESC, table_name
LIMIT 20;

-- ============================================================
-- 9. VÉRIFICATION FINALE - RÉSULTAT ATTENDU
-- ============================================================

SELECT 
  '🎯 VÉRIFICATION FINALE' as section,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM audit_rls_policies() WHERE NOT rls_enabled
    ) = 0 
    AND (
      SELECT COUNT(*) FROM audit_rls_policies() WHERE rls_enabled AND policy_count = 0
    ) = 0
    THEN '✅ PARFAIT - Toutes les tables sont sécurisées'
    WHEN (
      SELECT COUNT(*) FROM audit_rls_policies() WHERE NOT rls_enabled
    ) > 0
    THEN '⚠️ ATTENTION - ' || (
      SELECT COUNT(*) FROM audit_rls_policies() WHERE NOT rls_enabled
    )::text || ' tables sans RLS'
    WHEN (
      SELECT COUNT(*) FROM audit_rls_policies() WHERE rls_enabled AND policy_count = 0
    ) > 0
    THEN '⚠️ ATTENTION - ' || (
      SELECT COUNT(*) FROM audit_rls_policies() WHERE rls_enabled AND policy_count = 0
    )::text || ' tables sans politiques'
    ELSE '✅ BON - Quelques améliorations possibles'
  END as statut_final,
  (
    SELECT COUNT(*) FROM audit_rls_policies() WHERE NOT rls_enabled
  ) as tables_sans_rls,
  (
    SELECT COUNT(*) FROM audit_rls_policies() WHERE rls_enabled AND policy_count = 0
  ) as tables_sans_politiques,
  (
    SELECT COUNT(*) FROM audit_rls_policies() 
    WHERE rls_enabled AND policy_count > 0
  ) as tables_securisees;

-- ============================================================
-- 10. LISTE COMPLÈTE DES TABLES ET LEUR STATUT
-- ============================================================

SELECT 
  '📋 LISTE COMPLÈTE' as section,
  table_name,
  CASE 
    WHEN NOT rls_enabled THEN '🔴 Sans RLS'
    WHEN rls_enabled AND policy_count = 0 THEN '🟠 Sans politiques'
    WHEN rls_enabled AND policy_count > 0 AND NOT has_select_policy THEN '🟡 SELECT manquant'
    WHEN rls_enabled AND policy_count > 0 AND (
      NOT has_insert_policy OR NOT has_update_policy OR NOT has_delete_policy
    ) THEN '🟡 Politiques incomplètes'
    ELSE '✅ Sécurisée'
  END as statut,
  rls_enabled,
  policy_count,
  has_select_policy,
  has_insert_policy,
  has_update_policy,
  has_delete_policy
FROM audit_rls_policies()
ORDER BY 
  CASE 
    WHEN NOT rls_enabled THEN 0
    WHEN rls_enabled AND policy_count = 0 THEN 1
    WHEN rls_enabled AND policy_count > 0 AND NOT has_select_policy THEN 2
    WHEN rls_enabled AND policy_count > 0 AND (
      NOT has_insert_policy OR NOT has_update_policy OR NOT has_delete_policy
    ) THEN 3
    ELSE 4
  END,
  table_name;

