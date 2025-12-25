-- ============================================================
-- AUDIT FINAL RLS - Emarzona
-- Date: 2025-01-30
-- 
-- Ce script identifie toutes les tables restantes à sécuriser
-- après les Phases 1, 2 et 3
-- ============================================================

-- ============================================================
-- 1. RAPPORT COMPLET - Toutes les tables avec statut RLS
-- ============================================================
SELECT 
  '📊 RAPPORT COMPLET RLS' as section,
  table_name,
  rls_enabled,
  policy_count,
  CASE WHEN has_select_policy THEN '✅' ELSE '❌' END as select_policy,
  CASE WHEN has_insert_policy THEN '✅' ELSE '❌' END as insert_policy,
  CASE WHEN has_update_policy THEN '✅' ELSE '❌' END as update_policy,
  CASE WHEN has_delete_policy THEN '✅' ELSE '❌' END as delete_policy,
  recommendation
FROM rls_audit_report
ORDER BY 
  CASE 
    WHEN recommendation LIKE '⚠️%' THEN 0  -- Priorité haute : problèmes critiques
    WHEN recommendation LIKE 'ℹ️%' THEN 1  -- Priorité moyenne : améliorations
    ELSE 2  -- OK
  END,
  table_name;

-- ============================================================
-- 2. STATISTIQUES GLOBALES
-- ============================================================
SELECT 
  '📈 STATISTIQUES GLOBALES' as section,
  COUNT(*) as total_tables,
  COUNT(*) FILTER (WHERE rls_enabled) as tables_with_rls,
  COUNT(*) FILTER (WHERE NOT rls_enabled) as tables_without_rls,
  COUNT(*) FILTER (WHERE rls_enabled AND policy_count = 0) as tables_without_policies,
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
-- 3. TABLES SANS RLS (CRITIQUE - Priorité 1)
-- ============================================================
SELECT 
  '🚨 TABLES SANS RLS (CRITIQUE)' as section,
  table_name,
  recommendation,
  'URGENT: Activer RLS et créer des politiques' as action_required
FROM get_tables_without_rls()
ORDER BY table_name;

-- ============================================================
-- 4. TABLES AVEC RLS MAIS SANS POLITIQUES (CRITIQUE - Priorité 2)
-- ============================================================
SELECT 
  '⚠️ TABLES AVEC RLS MAIS SANS POLITIQUES (CRITIQUE)' as section,
  table_name,
  recommendation,
  'URGENT: Ajouter des politiques RLS' as action_required
FROM get_tables_without_policies()
ORDER BY table_name;

-- ============================================================
-- 5. TABLES AVEC POLITIQUES INCOMPLÈTES (Priorité 3)
-- ============================================================
SELECT 
  'ℹ️ TABLES AVEC POLITIQUES INCOMPLÈTES' as section,
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
    WHEN NOT has_select_policy THEN 0  -- SELECT est le plus critique
    WHEN NOT has_insert_policy THEN 1
    WHEN NOT has_update_policy THEN 2
    ELSE 3
  END,
  table_name;

-- ============================================================
-- 6. TABLES PAR CATÉGORIE - Identification des tables importantes
-- ============================================================

-- 6.1 Tables de configuration et paramètres
SELECT 
  '⚙️ TABLES DE CONFIGURATION' as category,
  table_name,
  rls_enabled,
  policy_count,
  recommendation
FROM rls_audit_report
WHERE table_name IN (
  'platform_settings', 'admin_config', 'email_templates',
  'platform_customization', 'resource_conflict_settings',
  'staff_availability_settings'
)
ORDER BY 
  CASE WHEN NOT rls_enabled THEN 0 ELSE 1 END,
  table_name;

-- 6.2 Tables de produits spécialisés
SELECT 
  '📦 TABLES DE PRODUITS SPÉCIALISÉS' as category,
  table_name,
  rls_enabled,
  policy_count,
  recommendation
FROM rls_audit_report
WHERE table_name IN (
  'artist_products', 'product_templates', 'product_bundles',
  'bundle_items', 'pre_orders', 'backorders', 'stock_alerts'
)
ORDER BY 
  CASE WHEN NOT rls_enabled THEN 0 ELSE 1 END,
  table_name;

-- 6.3 Tables de commandes et expéditions avancées
SELECT 
  '📋 TABLES DE COMMANDES AVANCÉES' as category,
  table_name,
  rls_enabled,
  policy_count,
  recommendation
FROM rls_audit_report
WHERE table_name IN (
  'abandoned_carts', 'invoices', 'taxes', 'upsell_tracking',
  'batch_shipments', 'shipping_labels'
)
ORDER BY 
  CASE WHEN NOT rls_enabled THEN 0 ELSE 1 END,
  table_name;

-- 6.4 Tables de cours et formations
SELECT 
  '🎓 TABLES DE COURS ET FORMATIONS' as category,
  table_name,
  rls_enabled,
  policy_count,
  recommendation
FROM rls_audit_report
WHERE table_name IN (
  'lessons', 'lesson_progress', 'quizzes', 'quiz_questions',
  'quiz_attempts', 'assignments', 'assignment_submissions',
  'certificates', 'course_paths', 'path_enrollments'
)
ORDER BY 
  CASE WHEN NOT rls_enabled THEN 0 ELSE 1 END,
  table_name;

-- 6.5 Tables d'affiliation et commissions
SELECT 
  '💰 TABLES D''AFFILIATION' as category,
  table_name,
  rls_enabled,
  policy_count,
  recommendation
FROM rls_audit_report
WHERE table_name IN (
  'commissions', 'affiliate_clicks', 'affiliate_conversions',
  'loyalty_points', 'loyalty_transactions', 'loyalty_rewards'
)
ORDER BY 
  CASE WHEN NOT rls_enabled THEN 0 ELSE 1 END,
  table_name;

-- 6.6 Tables de services et réservations
SELECT 
  '🛎️ TABLES DE SERVICES' as category,
  table_name,
  rls_enabled,
  policy_count,
  recommendation
FROM rls_audit_report
WHERE table_name IN (
  'service_availability', 'service_staff_members', 'staff_custom_hours',
  'staff_time_off', 'recurring_bookings', 'booking_patterns'
)
ORDER BY 
  CASE WHEN NOT rls_enabled THEN 0 ELSE 1 END,
  table_name;

-- 6.7 Tables de souscriptions
SELECT 
  '🔄 TABLES DE SOUSCRIPTIONS' as category,
  table_name,
  rls_enabled,
  policy_count,
  recommendation
FROM rls_audit_report
WHERE table_name IN (
  'subscriptions', 'subscription_plans', 'subscription_usage',
  'subscription_changes', 'subscription_payments'
)
ORDER BY 
  CASE WHEN NOT rls_enabled THEN 0 ELSE 1 END,
  table_name;

-- 6.8 Tables de communication
SELECT 
  '💬 TABLES DE COMMUNICATION' as category,
  table_name,
  rls_enabled,
  policy_count,
  recommendation
FROM rls_audit_report
WHERE table_name IN (
  'vendor_conversations', 'vendor_messages', 'shipping_service_conversations',
  'shipping_service_messages', 'disputes', 'message_attachments'
)
ORDER BY 
  CASE WHEN NOT rls_enabled THEN 0 ELSE 1 END,
  table_name;

-- 6.9 Tables d'analytics et statistiques
SELECT 
  '📊 TABLES D''ANALYTICS' as category,
  table_name,
  rls_enabled,
  policy_count,
  recommendation
FROM rls_audit_report
WHERE table_name IN (
  'product_analytics', 'store_analytics', 'daily_stats',
  'advanced_analytics_dashboards', 'analytics_events'
)
ORDER BY 
  CASE WHEN NOT rls_enabled THEN 0 ELSE 1 END,
  table_name;

-- 6.10 Tables de fichiers et stockage
SELECT 
  '📁 TABLES DE FICHIERS' as category,
  table_name,
  rls_enabled,
  policy_count,
  recommendation
FROM rls_audit_report
WHERE table_name IN (
  'file_uploads', 'digital_product_files', 'course_resources',
  'product_downloads', 'user_files'
)
ORDER BY 
  CASE WHEN NOT rls_enabled THEN 0 ELSE 1 END,
  table_name;

-- ============================================================
-- 7. PRIORISATION DES TABLES RESTANTES
-- ============================================================
SELECT 
  '🎯 PRIORISATION DES TABLES RESTANTES' as section,
  table_name,
  CASE 
    WHEN table_name IN (
      'platform_settings', 'admin_config', 'commissions',
      'subscriptions', 'disputes', 'invoices'
    ) THEN '🔴 CRITIQUE - Données très sensibles'
    WHEN table_name IN (
      'lessons', 'quizzes', 'assignments', 'certificates',
      'service_availability', 'recurring_bookings'
    ) THEN '🟠 HAUTE - Données utilisateurs importantes'
    WHEN table_name IN (
      'product_analytics', 'store_analytics', 'daily_stats',
      'file_uploads', 'course_resources'
    ) THEN '🟡 MOYENNE - Données importantes mais moins critiques'
    ELSE '🟢 BASSE - Données moins sensibles'
  END as priority,
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
    WHEN table_name IN (
      'platform_settings', 'admin_config', 'commissions',
      'subscriptions', 'disputes', 'invoices'
    ) THEN 0
    WHEN table_name IN (
      'lessons', 'quizzes', 'assignments', 'certificates',
      'service_availability', 'recurring_bookings'
    ) THEN 1
    WHEN table_name IN (
      'product_analytics', 'store_analytics', 'daily_stats',
      'file_uploads', 'course_resources'
    ) THEN 2
    ELSE 3
  END,
  table_name;

-- ============================================================
-- 8. RÉSUMÉ PAR PHASE
-- ============================================================
SELECT 
  '📋 RÉSUMÉ PAR PHASE' as section,
  'Phase 1 - Tables Critiques' as phase,
  COUNT(*) as tables_secured
FROM rls_audit_report
WHERE table_name IN (
  'orders', 'order_items', 'payments', 'transactions',
  'cart_items', 'notifications', 'api_keys', 'webhooks',
  'shipments', 'product_returns', 'service_bookings'
)
AND rls_enabled AND policy_count > 0

UNION ALL

SELECT 
  '📋 RÉSUMÉ PAR PHASE' as section,
  'Phase 2 - Produits et Marketing' as phase,
  COUNT(*) as tables_secured
FROM rls_audit_report
WHERE table_name IN (
  'products', 'product_variants', 'product_images',
  'categories', 'reviews', 'promotions'
)
AND rls_enabled AND policy_count > 0

UNION ALL

SELECT 
  '📋 RÉSUMÉ PAR PHASE' as section,
  'Phase 3 - Affiliation, Cours et Produits Spécialisés' as phase,
  COUNT(*) as tables_secured
FROM rls_audit_report
WHERE table_name IN (
  'affiliates', 'affiliate_links', 'commission_payments',
  'courses', 'course_enrollments',
  'digital_products', 'physical_products', 'service_products',
  'store_withdrawals'
)
AND rls_enabled AND policy_count > 0

UNION ALL

SELECT 
  '📋 RÉSUMÉ PAR PHASE' as section,
  'Tables Restantes à Sécuriser' as phase,
  COUNT(*) as tables_secured
FROM rls_audit_report
WHERE NOT rls_enabled 
   OR (rls_enabled AND policy_count = 0)
   OR (rls_enabled AND policy_count > 0 AND (
     NOT has_select_policy OR
     NOT has_insert_policy OR
     NOT has_update_policy OR
     NOT has_delete_policy
   ));

-- ============================================================
-- 9. LISTE DES TABLES RESTANTES PAR PRIORITÉ
-- ============================================================
SELECT 
  '📝 LISTE DES TABLES RESTANTES' as section,
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

