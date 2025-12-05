-- ============================================================
-- AUDIT FINAL RLS - VERSION SIMPLIFIÉE ET VISUELLE
-- Date: 2025-01-30
-- 
-- Script d'audit final optimisé pour un affichage clair
-- ============================================================

-- ============================================================
-- 1. RÉSUMÉ EXÉCUTIF (Vue d'ensemble)
-- ============================================================
SELECT 
  '📊 RÉSUMÉ EXÉCUTIF' as "Section",
  COUNT(*) as "Total Tables",
  COUNT(*) FILTER (WHERE rls_enabled) as "Tables avec RLS",
  COUNT(*) FILTER (WHERE NOT rls_enabled) as "⚠️ Sans RLS",
  COUNT(*) FILTER (WHERE rls_enabled AND policy_count > 0) as "✅ Sécurisées",
  COUNT(*) FILTER (WHERE rls_enabled AND policy_count = 0) as "🟠 Sans Politiques",
  ROUND(
    (COUNT(*) FILTER (WHERE rls_enabled AND policy_count > 0)::numeric / 
     NULLIF(COUNT(*) FILTER (WHERE rls_enabled), 0)) * 100, 
    2
  ) || '%' as "Taux de Sécurisation"
FROM audit_rls_policies();

-- ============================================================
-- 2. STATUT FINAL (Résultat Principal)
-- ============================================================
SELECT 
  CASE 
    WHEN (
      SELECT COUNT(*) FROM audit_rls_policies() WHERE NOT rls_enabled
    ) = 0 
    AND (
      SELECT COUNT(*) FROM audit_rls_policies() WHERE rls_enabled AND policy_count = 0
    ) = 0
    THEN '✅ PARFAIT - Toutes les tables sont sécurisées avec RLS'
    WHEN (
      SELECT COUNT(*) FROM audit_rls_policies() WHERE NOT rls_enabled
    ) > 0
    THEN '🔴 ATTENTION - ' || (
      SELECT COUNT(*) FROM audit_rls_policies() WHERE NOT rls_enabled
    )::text || ' tables sans RLS activé'
    WHEN (
      SELECT COUNT(*) FROM audit_rls_policies() WHERE rls_enabled AND policy_count = 0
    ) > 0
    THEN '🟠 ATTENTION - ' || (
      SELECT COUNT(*) FROM audit_rls_policies() WHERE rls_enabled AND policy_count = 0
    )::text || ' tables avec RLS mais sans politiques'
    ELSE '✅ BON - Quelques améliorations possibles'
  END as "🎯 STATUT FINAL",
  (
    SELECT COUNT(*) FROM audit_rls_policies() WHERE NOT rls_enabled
  ) as "Tables sans RLS",
  (
    SELECT COUNT(*) FROM audit_rls_policies() WHERE rls_enabled AND policy_count = 0
  ) as "Tables sans Politiques",
  (
    SELECT COUNT(*) FROM audit_rls_policies() 
    WHERE rls_enabled AND policy_count > 0
  ) as "Tables Sécurisées";

-- ============================================================
-- 3. TABLES SANS RLS (Si présentes)
-- ============================================================
SELECT 
  '🔴 TABLES SANS RLS' as "Section",
  table_name as "Table",
  recommendation as "Recommandation"
FROM audit_rls_policies()
WHERE NOT rls_enabled
ORDER BY table_name;

-- ============================================================
-- 4. TABLES SANS POLITIQUES (Si présentes)
-- ============================================================
SELECT 
  '🟠 TABLES SANS POLITIQUES' as "Section",
  table_name as "Table",
  policy_count as "Politiques",
  recommendation as "Recommandation"
FROM audit_rls_policies()
WHERE rls_enabled AND policy_count = 0
ORDER BY table_name;

-- ============================================================
-- 5. TABLES PARFAITEMENT SÉCURISÉES (Résumé)
-- ============================================================
SELECT 
  '✅ TABLES PARFAITEMENT SÉCURISÉES' as "Section",
  COUNT(*) as "Nombre",
  CASE 
    WHEN COUNT(*) > 50 THEN 'Excellent - ' || COUNT(*)::text || ' tables'
    WHEN COUNT(*) > 30 THEN 'Très bon - ' || COUNT(*)::text || ' tables'
    WHEN COUNT(*) > 10 THEN 'Bon - ' || COUNT(*)::text || ' tables'
    ELSE COUNT(*)::text || ' tables'
  END as "Statut"
FROM audit_rls_policies()
WHERE rls_enabled 
  AND policy_count > 0
  AND has_select_policy
  AND has_insert_policy
  AND has_update_policy
  AND has_delete_policy;

-- ============================================================
-- 6. DISTRIBUTION DES POLITIQUES
-- ============================================================
SELECT 
  '📊 DISTRIBUTION DES POLITIQUES' as "Section",
  policy_count as "Nombre de Politiques",
  COUNT(*) as "Nombre de Tables",
  CASE 
    WHEN policy_count = 0 THEN '🔴 Aucune'
    WHEN policy_count = 1 THEN '🟠 1 seule'
    WHEN policy_count = 2 THEN '🟡 2 politiques'
    WHEN policy_count = 3 THEN '🟢 3 politiques'
    WHEN policy_count >= 4 THEN '✅ 4+ politiques (complet)'
  END as "Évaluation"
FROM audit_rls_policies()
WHERE rls_enabled
GROUP BY policy_count
ORDER BY policy_count;

-- ============================================================
-- 7. STATISTIQUES PAR TYPE DE POLITIQUE
-- ============================================================
SELECT 
  '📈 STATISTIQUES PAR TYPE' as "Section",
  COUNT(*) as "Total Tables avec RLS",
  COUNT(*) FILTER (WHERE has_select_policy) as "✅ SELECT",
  COUNT(*) FILTER (WHERE has_insert_policy) as "✅ INSERT",
  COUNT(*) FILTER (WHERE has_update_policy) as "✅ UPDATE",
  COUNT(*) FILTER (WHERE has_delete_policy) as "✅ DELETE",
  COUNT(*) FILTER (WHERE has_select_policy AND has_insert_policy AND has_update_policy AND has_delete_policy) as "✅ TOUTES (4/4)"
FROM audit_rls_policies()
WHERE rls_enabled AND policy_count > 0;

-- ============================================================
-- 8. TOP 10 TABLES LES MIEUX SÉCURISÉES
-- ============================================================
SELECT 
  '🏆 TOP 10 TABLES LES MIEUX SÉCURISÉES' as "Section",
  table_name as "Table",
  policy_count as "Politiques",
  CASE 
    WHEN has_select_policy AND has_insert_policy AND has_update_policy AND has_delete_policy 
    THEN '✅ Complet (4/4)'
    WHEN has_select_policy AND (has_insert_policy OR has_update_policy OR has_delete_policy)
    THEN '🟢 Bon (3/4)'
    WHEN has_select_policy
    THEN '🟡 Basique (1/4)'
    ELSE '🟠 Minimal'
  END as "Statut"
FROM audit_rls_policies()
WHERE rls_enabled AND policy_count > 0
ORDER BY policy_count DESC, table_name
LIMIT 10;

-- ============================================================
-- 9. LISTE COMPLÈTE DES TABLES (Statut détaillé)
-- ============================================================
SELECT 
  table_name as "Table",
  CASE 
    WHEN NOT rls_enabled THEN '🔴 Sans RLS'
    WHEN rls_enabled AND policy_count = 0 THEN '🟠 Sans politiques'
    WHEN rls_enabled AND policy_count > 0 AND NOT has_select_policy THEN '🟡 SELECT manquant'
    WHEN rls_enabled AND policy_count > 0 AND (
      NOT has_insert_policy OR NOT has_update_policy OR NOT has_delete_policy
    ) THEN '🟡 Politiques incomplètes'
    ELSE '✅ Sécurisée'
  END as "Statut",
  policy_count as "Politiques",
  CASE 
    WHEN has_select_policy THEN '✅' ELSE '❌'
  END || ' SELECT, ' ||
  CASE 
    WHEN has_insert_policy THEN '✅' ELSE '❌'
  END || ' INSERT, ' ||
  CASE 
    WHEN has_update_policy THEN '✅' ELSE '❌'
  END || ' UPDATE, ' ||
  CASE 
    WHEN has_delete_policy THEN '✅' ELSE '❌'
  END || ' DELETE' as "Détail Politiques"
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

