-- ============================================================
-- Audit RLS Rapide - Emarzona
-- Exécuter ces requêtes dans Supabase SQL Editor
-- ============================================================

-- 1. Rapport complet avec priorités
SELECT 
  table_name,
  rls_enabled,
  policy_count,
  CASE 
    WHEN has_select_policy THEN '✅' ELSE '❌' 
  END as select_policy,
  CASE 
    WHEN has_insert_policy THEN '✅' ELSE '❌' 
  END as insert_policy,
  CASE 
    WHEN has_update_policy THEN '✅' ELSE '❌' 
  END as update_policy,
  CASE 
    WHEN has_delete_policy THEN '✅' ELSE '❌' 
  END as delete_policy,
  recommendation
FROM rls_audit_report
ORDER BY 
  CASE 
    WHEN recommendation LIKE '⚠️%' THEN 0 
    WHEN recommendation LIKE 'ℹ️%' THEN 1 
    ELSE 2 
  END,
  table_name;

-- 2. Statistiques globales
SELECT 
  '📊 Statistiques RLS' as section,
  COUNT(*) as total_tables,
  COUNT(*) FILTER (WHERE rls_enabled) as tables_with_rls,
  COUNT(*) FILTER (WHERE NOT rls_enabled) as tables_without_rls,
  COUNT(*) FILTER (WHERE rls_enabled AND policy_count = 0) as tables_without_policies,
  COUNT(*) FILTER (WHERE recommendation LIKE '✅%') as tables_ok,
  COUNT(*) FILTER (WHERE recommendation LIKE '⚠️%') as tables_warning,
  COUNT(*) FILTER (WHERE recommendation LIKE 'ℹ️%') as tables_info
FROM rls_audit_report;

-- 3. Tables sans RLS (CRITIQUE)
SELECT 
  '🚨 Tables sans RLS' as section,
  table_name,
  recommendation
FROM get_tables_without_rls()
ORDER BY table_name;

-- 4. Tables avec RLS mais sans politiques (CRITIQUE)
SELECT 
  '⚠️ Tables sans politiques' as section,
  table_name,
  recommendation
FROM get_tables_without_policies()
ORDER BY table_name;

-- 5. Tables avec politiques incomplètes
SELECT 
  'ℹ️ Politiques incomplètes' as section,
  table_name,
  CASE WHEN has_select_policy THEN '✅' ELSE '❌' END as select_policy,
  CASE WHEN has_insert_policy THEN '✅' ELSE '❌' END as insert_policy,
  CASE WHEN has_update_policy THEN '✅' ELSE '❌' END as update_policy,
  CASE WHEN has_delete_policy THEN '✅' ELSE '❌' END as delete_policy,
  policy_count
FROM rls_audit_report
WHERE rls_enabled 
  AND policy_count > 0
  AND (
    NOT has_select_policy OR
    NOT has_insert_policy OR
    NOT has_update_policy OR
    NOT has_delete_policy
  )
ORDER BY table_name;


