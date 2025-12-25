-- ============================================================
-- IDENTIFIER LES 40 TABLES SANS POLITIQUES
-- Date: 2025-01-30
-- 
-- Ce script liste toutes les tables avec RLS activé mais sans politiques
-- ============================================================

-- Liste complète des tables sans politiques
SELECT 
  table_name,
  rls_enabled,
  policy_count,
  recommendation,
  CASE 
    WHEN table_name IN (
      'platform_settings', 'admin_config', 'commissions',
      'subscriptions', 'disputes', 'invoices'
    ) THEN '🔴 CRITIQUE'
    WHEN table_name IN (
      'lessons', 'quizzes', 'assignments', 'certificates',
      'service_availability', 'recurring_bookings'
    ) THEN '🟠 HAUTE'
    WHEN table_name LIKE '%analytics%' OR table_name LIKE '%stats%' THEN '🟡 MOYENNE'
    ELSE '🟢 BASSE'
  END as priorite
FROM audit_rls_policies()
WHERE rls_enabled AND policy_count = 0
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
    WHEN table_name LIKE '%analytics%' OR table_name LIKE '%stats%' THEN 2
    ELSE 3
  END,
  table_name;

-- Statistiques par priorité
SELECT 
  priorite,
  COUNT(*) as nombre_tables,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as tables
FROM (
  SELECT 
    table_name,
    CASE 
      WHEN table_name IN (
        'platform_settings', 'admin_config', 'commissions',
        'subscriptions', 'disputes', 'invoices'
      ) THEN '🔴 CRITIQUE'
      WHEN table_name IN (
        'lessons', 'quizzes', 'assignments', 'certificates',
        'service_availability', 'recurring_bookings'
      ) THEN '🟠 HAUTE'
      WHEN table_name LIKE '%analytics%' OR table_name LIKE '%stats%' THEN '🟡 MOYENNE'
      ELSE '🟢 BASSE'
    END as priorite,
    CASE 
      WHEN table_name IN (
        'platform_settings', 'admin_config', 'commissions',
        'subscriptions', 'disputes', 'invoices'
      ) THEN 0
      WHEN table_name IN (
        'lessons', 'quizzes', 'assignments', 'certificates',
        'service_availability', 'recurring_bookings'
      ) THEN 1
      WHEN table_name LIKE '%analytics%' OR table_name LIKE '%stats%' THEN 2
      ELSE 3
    END as priority_order
  FROM audit_rls_policies()
  WHERE rls_enabled AND policy_count = 0
) subquery
GROUP BY priorite, priority_order
ORDER BY priority_order;

