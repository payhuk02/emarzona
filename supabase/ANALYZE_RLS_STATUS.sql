-- ============================================================
-- ANALYSE RAPIDE DU STATUT RLS
-- Date: 2025-01-30
-- 
-- Script d'analyse rapide pour identifier les tables restantes
-- Exécutez ce script pour obtenir un résumé concis
-- ============================================================

-- ============================================================
-- RÉSUMÉ EXÉCUTIF
-- ============================================================
WITH stats AS (
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE rls_enabled AND policy_count > 0) as secured,
    COUNT(*) FILTER (WHERE NOT rls_enabled) as no_rls,
    COUNT(*) FILTER (WHERE rls_enabled AND policy_count = 0) as no_policies,
    COUNT(*) FILTER (WHERE rls_enabled AND policy_count > 0 AND NOT has_select_policy) as incomplete
  FROM rls_audit_report
)
SELECT 
  '📊 RÉSUMÉ EXÉCUTIF' as section,
  total as total_tables,
  secured as tables_securisees,
  no_rls as tables_sans_rls,
  no_policies as tables_sans_politiques,
  incomplete as tables_politiques_incompletes,
  ROUND((secured::numeric / NULLIF(total, 0)) * 100, 2) as pourcentage_securise,
  CASE 
    WHEN (secured::numeric / NULLIF(total, 0)) * 100 >= 80 THEN '✅ Excellent'
    WHEN (secured::numeric / NULLIF(total, 0)) * 100 >= 60 THEN '⚠️ Bon mais amélioration nécessaire'
    ELSE '🚨 Critique - Action urgente requise'
  END as evaluation
FROM stats;

-- ============================================================
-- TABLES CRITIQUES RESTANTES (Top 20)
-- ============================================================
SELECT 
  '🚨 TOP 20 TABLES CRITIQUES RESTANTES' as section,
  table_name,
  CASE 
    WHEN NOT rls_enabled THEN '❌ Sans RLS'
    WHEN rls_enabled AND policy_count = 0 THEN '⚠️ Sans politiques'
    WHEN NOT has_select_policy THEN '⚠️ SELECT manquant'
    ELSE 'ℹ️ Politiques incomplètes'
  END as statut,
  CASE 
    WHEN table_name IN ('platform_settings', 'admin_config', 'commissions', 'subscriptions', 'disputes', 'invoices')
      THEN '🔴 CRITIQUE'
    WHEN table_name IN ('lessons', 'quizzes', 'assignments', 'certificates', 'service_availability')
      THEN '🟠 HAUTE'
    ELSE '🟡 MOYENNE'
  END as priorite
FROM rls_audit_report
WHERE NOT rls_enabled 
   OR (rls_enabled AND policy_count = 0)
   OR (rls_enabled AND policy_count > 0 AND (
     NOT has_select_policy OR
     NOT has_insert_policy OR
     NOT has_update_policy OR
     NOT has_delete_policy
   ))
ORDER BY 
  CASE 
    WHEN table_name IN ('platform_settings', 'admin_config', 'commissions', 'subscriptions', 'disputes', 'invoices')
      THEN 0
    WHEN table_name IN ('lessons', 'quizzes', 'assignments', 'certificates', 'service_availability')
      THEN 1
    ELSE 2
  END,
  CASE 
    WHEN NOT rls_enabled THEN 0
    WHEN rls_enabled AND policy_count = 0 THEN 1
    WHEN NOT has_select_policy THEN 2
    ELSE 3
  END,
  table_name
LIMIT 20;

-- ============================================================
-- VÉRIFICATION DES PHASES
-- ============================================================
SELECT 
  '✅ VÉRIFICATION DES PHASES' as section,
  'Phase 1' as phase,
  COUNT(*) as tables_attendues,
  COUNT(*) FILTER (WHERE rls_enabled AND policy_count > 0) as tables_securisees,
  CASE 
    WHEN COUNT(*) FILTER (WHERE rls_enabled AND policy_count > 0) = 11 THEN '✅ Complète'
    ELSE '⚠️ Incomplète'
  END as statut
FROM rls_audit_report
WHERE table_name IN (
  'orders', 'order_items', 'payments', 'transactions',
  'cart_items', 'notifications', 'api_keys', 'webhooks',
  'shipments', 'product_returns', 'service_bookings'
)

UNION ALL

SELECT 
  '✅ VÉRIFICATION DES PHASES' as section,
  'Phase 2' as phase,
  COUNT(*) as tables_attendues,
  COUNT(*) FILTER (WHERE rls_enabled AND policy_count > 0) as tables_securisees,
  CASE 
    WHEN COUNT(*) FILTER (WHERE rls_enabled AND policy_count > 0) = 6 THEN '✅ Complète'
    ELSE '⚠️ Incomplète'
  END as statut
FROM rls_audit_report
WHERE table_name IN (
  'products', 'product_variants', 'product_images',
  'categories', 'reviews', 'promotions'
)

UNION ALL

SELECT 
  '✅ VÉRIFICATION DES PHASES' as section,
  'Phase 3' as phase,
  COUNT(*) as tables_attendues,
  COUNT(*) FILTER (WHERE rls_enabled AND policy_count > 0) as tables_securisees,
  CASE 
    WHEN COUNT(*) FILTER (WHERE rls_enabled AND policy_count > 0) = 9 THEN '✅ Complète'
    ELSE '⚠️ Incomplète'
  END as statut
FROM rls_audit_report
WHERE table_name IN (
  'affiliates', 'affiliate_links', 'commission_payments',
  'courses', 'course_enrollments',
  'digital_products', 'physical_products', 'service_products',
  'store_withdrawals'
);

-- ============================================================
-- TABLES PAR PRIORITÉ DE SÉCURISATION
-- ============================================================
SELECT 
  '🎯 PRIORISATION' as section,
  CASE 
    WHEN priority_group = 0 THEN '🔴 URGENT - Sans RLS'
    WHEN priority_group = 1 THEN '🟠 IMPORTANT - Sans politiques'
    WHEN priority_group = 2 THEN '🟡 RECOMMANDÉ - SELECT manquant'
    ELSE '🟢 OPTIONNEL - Politiques incomplètes'
  END as priorite,
  COUNT(*) as nombre_tables,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as tables
FROM (
  SELECT 
    table_name,
    CASE 
      WHEN NOT rls_enabled THEN 0
      WHEN rls_enabled AND policy_count = 0 THEN 1
      WHEN NOT has_select_policy THEN 2
      ELSE 3
    END as priority_group
  FROM rls_audit_report
  WHERE NOT rls_enabled 
     OR (rls_enabled AND policy_count = 0)
     OR (rls_enabled AND policy_count > 0 AND (
       NOT has_select_policy OR
       NOT has_insert_policy OR
       NOT has_update_policy OR
       NOT has_delete_policy
     ))
) subquery
GROUP BY priority_group
ORDER BY priority_group;

