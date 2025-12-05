-- ============================================================
-- AUDIT FINAL RLS - Version Simplifiée et Analysable
-- Date: 2025-01-30
-- 
-- Exécutez ce script section par section pour analyser les résultats
-- ============================================================

-- ============================================================
-- SECTION 1: VUE D'ENSEMBLE - Statistiques Globales
-- ============================================================
SELECT 
  '📊 STATISTIQUES GLOBALES' as section,
  COUNT(*) as total_tables,
  COUNT(*) FILTER (WHERE rls_enabled) as tables_with_rls,
  COUNT(*) FILTER (WHERE NOT rls_enabled) as tables_without_rls,
  COUNT(*) FILTER (WHERE rls_enabled AND policy_count = 0) as tables_without_policies,
  COUNT(*) FILTER (WHERE rls_enabled AND policy_count > 0) as tables_fully_secured,
  COUNT(*) FILTER (WHERE recommendation LIKE '✅%') as tables_ok,
  COUNT(*) FILTER (WHERE recommendation LIKE '⚠️%') as tables_warning,
  COUNT(*) FILTER (WHERE recommendation LIKE 'ℹ️%') as tables_info,
  ROUND(
    (COUNT(*) FILTER (WHERE rls_enabled AND policy_count > 0)::numeric / 
     NULLIF(COUNT(*), 0)) * 100, 
    2
  ) as percentage_secured
FROM rls_audit_report;

-- ============================================================
-- SECTION 2: TABLES SANS RLS (CRITIQUE - Priorité 1)
-- ============================================================
SELECT 
  '🚨 TABLES SANS RLS' as priority,
  table_name,
  'URGENT: Activer RLS et créer des politiques' as action_required,
  recommendation
FROM get_tables_without_rls()
ORDER BY table_name;

-- ============================================================
-- SECTION 3: TABLES AVEC RLS MAIS SANS POLITIQUES (CRITIQUE - Priorité 2)
-- ============================================================
SELECT 
  '⚠️ TABLES SANS POLITIQUES' as priority,
  table_name,
  'URGENT: Ajouter des politiques RLS' as action_required,
  recommendation
FROM get_tables_without_policies()
ORDER BY table_name;

-- ============================================================
-- SECTION 4: TABLES AVEC POLITIQUES INCOMPLÈTES (Priorité 3)
-- ============================================================
SELECT 
  'ℹ️ POLITIQUES INCOMPLÈTES' as priority,
  table_name,
  CASE WHEN has_select_policy THEN '✅' ELSE '❌' END as select_policy,
  CASE WHEN has_insert_policy THEN '✅' ELSE '❌' END as insert_policy,
  CASE WHEN has_update_policy THEN '✅' ELSE '❌' END as update_policy,
  CASE WHEN has_delete_policy THEN '✅' ELSE '❌' END as delete_policy,
  policy_count,
  'Ajouter les politiques manquantes' as action_required
FROM rls_audit_report
WHERE rls_enabled 
  AND policy_count > 0
  AND (
    NOT has_select_policy OR
    NOT has_insert_policy OR
    NOT has_update_policy OR
    NOT has_delete_policy
  )
ORDER BY 
  CASE 
    WHEN NOT has_select_policy THEN 0
    WHEN NOT has_insert_policy THEN 1
    WHEN NOT has_update_policy THEN 2
    ELSE 3
  END,
  table_name;

-- ============================================================
-- SECTION 5: TOUTES LES TABLES RESTANTES À SÉCURISER
-- ============================================================
SELECT 
  table_name,
  CASE 
    WHEN NOT rls_enabled THEN '❌ RLS non activé'
    WHEN rls_enabled AND policy_count = 0 THEN '⚠️ RLS activé mais sans politiques'
    WHEN NOT has_select_policy THEN '⚠️ Pas de politique SELECT'
    WHEN NOT has_insert_policy THEN 'ℹ️ Pas de politique INSERT'
    WHEN NOT has_update_policy THEN 'ℹ️ Pas de politique UPDATE'
    WHEN NOT has_delete_policy THEN 'ℹ️ Pas de politique DELETE'
    ELSE '✅ OK'
  END as status,
  rls_enabled,
  policy_count,
  recommendation
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
    WHEN NOT rls_enabled THEN 0
    WHEN rls_enabled AND policy_count = 0 THEN 1
    WHEN NOT has_select_policy THEN 2
    ELSE 3
  END,
  table_name;

-- ============================================================
-- SECTION 6: PRIORISATION PAR SENSIBILITÉ DES DONNÉES
-- ============================================================
SELECT 
  CASE 
    WHEN table_name IN (
      'platform_settings', 'admin_config', 'commissions',
      'subscriptions', 'disputes', 'invoices', 'store_withdrawals',
      'commission_payments'
    ) THEN '🔴 CRITIQUE'
    WHEN table_name IN (
      'lessons', 'quizzes', 'assignments', 'certificates',
      'service_availability', 'recurring_bookings', 'course_enrollments',
      'affiliates', 'affiliate_links'
    ) THEN '🟠 HAUTE'
    WHEN table_name IN (
      'product_analytics', 'store_analytics', 'daily_stats',
      'file_uploads', 'course_resources', 'digital_product_files'
    ) THEN '🟡 MOYENNE'
    ELSE '🟢 BASSE'
  END as priority,
  table_name,
  CASE 
    WHEN NOT rls_enabled THEN '❌ RLS non activé'
    WHEN rls_enabled AND policy_count = 0 THEN '⚠️ Sans politiques'
    WHEN NOT has_select_policy THEN '⚠️ SELECT manquant'
    ELSE '✅ OK'
  END as status,
  rls_enabled,
  policy_count
FROM rls_audit_report
WHERE table_name IN (
  -- Tables critiques
  'platform_settings', 'admin_config', 'commissions',
  'subscriptions', 'disputes', 'invoices', 'store_withdrawals',
  'commission_payments',
  -- Tables haute priorité
  'lessons', 'quizzes', 'assignments', 'certificates',
  'service_availability', 'recurring_bookings', 'course_enrollments',
  'affiliates', 'affiliate_links',
  -- Tables moyenne priorité
  'product_analytics', 'store_analytics', 'daily_stats',
  'file_uploads', 'course_resources', 'digital_product_files'
)
AND (
  NOT rls_enabled 
  OR (rls_enabled AND policy_count = 0)
  OR (rls_enabled AND policy_count > 0 AND NOT has_select_policy)
)
ORDER BY 
  CASE 
    WHEN table_name IN (
      'platform_settings', 'admin_config', 'commissions',
      'subscriptions', 'disputes', 'invoices', 'store_withdrawals',
      'commission_payments'
    ) THEN 0
    WHEN table_name IN (
      'lessons', 'quizzes', 'assignments', 'certificates',
      'service_availability', 'recurring_bookings', 'course_enrollments',
      'affiliates', 'affiliate_links'
    ) THEN 1
    WHEN table_name IN (
      'product_analytics', 'store_analytics', 'daily_stats',
      'file_uploads', 'course_resources', 'digital_product_files'
    ) THEN 2
    ELSE 3
  END,
  table_name;

-- ============================================================
-- SECTION 7: RÉSUMÉ PAR PHASE
-- ============================================================
SELECT 
  'Phase 1 - Tables Critiques' as phase,
  COUNT(*) as tables_secured,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as tables_list
FROM rls_audit_report
WHERE table_name IN (
  'orders', 'order_items', 'payments', 'transactions',
  'cart_items', 'notifications', 'api_keys', 'webhooks',
  'shipments', 'product_returns', 'service_bookings'
)
AND rls_enabled AND policy_count > 0

UNION ALL

SELECT 
  'Phase 2 - Produits et Marketing' as phase,
  COUNT(*) as tables_secured,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as tables_list
FROM rls_audit_report
WHERE table_name IN (
  'products', 'product_variants', 'product_images',
  'categories', 'reviews', 'promotions'
)
AND rls_enabled AND policy_count > 0

UNION ALL

SELECT 
  'Phase 3 - Affiliation, Cours et Produits' as phase,
  COUNT(*) as tables_secured,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as tables_list
FROM rls_audit_report
WHERE table_name IN (
  'affiliates', 'affiliate_links', 'commission_payments',
  'courses', 'course_enrollments',
  'digital_products', 'physical_products', 'service_products',
  'store_withdrawals'
)
AND rls_enabled AND policy_count > 0;

-- ============================================================
-- SECTION 8: TABLES PAR DOMAINE FONCTIONNEL
-- ============================================================

-- 8.1 Configuration
SELECT 
  '⚙️ CONFIGURATION' as category,
  table_name,
  rls_enabled,
  policy_count,
  CASE WHEN has_select_policy THEN '✅' ELSE '❌' END as has_select
FROM rls_audit_report
WHERE table_name IN (
  'platform_settings', 'admin_config', 'email_templates',
  'platform_customization'
)
ORDER BY 
  CASE WHEN NOT rls_enabled THEN 0 ELSE 1 END,
  table_name;

-- 8.2 Cours et Formations
SELECT 
  '🎓 COURS ET FORMATIONS' as category,
  table_name,
  rls_enabled,
  policy_count,
  CASE WHEN has_select_policy THEN '✅' ELSE '❌' END as has_select
FROM rls_audit_report
WHERE table_name IN (
  'lessons', 'lesson_progress', 'quizzes', 'quiz_questions',
  'quiz_attempts', 'assignments', 'assignment_submissions',
  'certificates', 'course_paths', 'path_enrollments'
)
ORDER BY 
  CASE WHEN NOT rls_enabled THEN 0 ELSE 1 END,
  table_name;

-- 8.3 Souscriptions
SELECT 
  '🔄 SOUSCRIPTIONS' as category,
  table_name,
  rls_enabled,
  policy_count,
  CASE WHEN has_select_policy THEN '✅' ELSE '❌' END as has_select
FROM rls_audit_report
WHERE table_name IN (
  'subscriptions', 'subscription_plans', 'subscription_usage',
  'subscription_changes', 'subscription_payments'
)
ORDER BY 
  CASE WHEN NOT rls_enabled THEN 0 ELSE 1 END,
  table_name;

-- 8.4 Communication
SELECT 
  '💬 COMMUNICATION' as category,
  table_name,
  rls_enabled,
  policy_count,
  CASE WHEN has_select_policy THEN '✅' ELSE '❌' END as has_select
FROM rls_audit_report
WHERE table_name IN (
  'vendor_conversations', 'vendor_messages', 'shipping_service_conversations',
  'shipping_service_messages', 'disputes', 'message_attachments'
)
ORDER BY 
  CASE WHEN NOT rls_enabled THEN 0 ELSE 1 END,
  table_name;

-- 8.5 Analytics
SELECT 
  '📊 ANALYTICS' as category,
  table_name,
  rls_enabled,
  policy_count,
  CASE WHEN has_select_policy THEN '✅' ELSE '❌' END as has_select
FROM rls_audit_report
WHERE table_name IN (
  'product_analytics', 'store_analytics', 'daily_stats',
  'advanced_analytics_dashboards', 'analytics_events'
)
ORDER BY 
  CASE WHEN NOT rls_enabled THEN 0 ELSE 1 END,
  table_name;

-- 8.6 Fichiers
SELECT 
  '📁 FICHIERS' as category,
  table_name,
  rls_enabled,
  policy_count,
  CASE WHEN has_select_policy THEN '✅' ELSE '❌' END as has_select
FROM rls_audit_report
WHERE table_name IN (
  'file_uploads', 'digital_product_files', 'course_resources',
  'product_downloads', 'user_files'
)
ORDER BY 
  CASE WHEN NOT rls_enabled THEN 0 ELSE 1 END,
  table_name;

-- ============================================================
-- SECTION 9: RECOMMANDATIONS FINALES
-- ============================================================
SELECT 
  '📋 RECOMMANDATIONS' as section,
  COUNT(*) FILTER (WHERE NOT rls_enabled) as tables_sans_rls,
  COUNT(*) FILTER (WHERE rls_enabled AND policy_count = 0) as tables_sans_politiques,
  COUNT(*) FILTER (WHERE rls_enabled AND policy_count > 0 AND NOT has_select_policy) as tables_sans_select,
  CASE 
    WHEN COUNT(*) FILTER (WHERE NOT rls_enabled) > 0 
      THEN '🚨 URGENT: Activer RLS sur ' || COUNT(*) FILTER (WHERE NOT rls_enabled) || ' tables'
    WHEN COUNT(*) FILTER (WHERE rls_enabled AND policy_count = 0) > 0
      THEN '⚠️ IMPORTANT: Ajouter des politiques sur ' || COUNT(*) FILTER (WHERE rls_enabled AND policy_count = 0) || ' tables'
    WHEN COUNT(*) FILTER (WHERE rls_enabled AND policy_count > 0 AND NOT has_select_policy) > 0
      THEN 'ℹ️ RECOMMANDÉ: Compléter les politiques sur ' || COUNT(*) FILTER (WHERE rls_enabled AND policy_count > 0 AND NOT has_select_policy) || ' tables'
    ELSE '✅ Toutes les tables critiques sont sécurisées'
  END as recommendation
FROM rls_audit_report
WHERE table_name NOT IN (
  -- Exclure les tables système et vues
  'rls_audit_report', 'pg_stat_statements'
);

