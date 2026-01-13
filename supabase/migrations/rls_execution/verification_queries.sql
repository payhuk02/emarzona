-- ============================================================
-- Vérification Pattern 1 (user_id)
-- Tables: notifications, notifications, user_preferences, certificates, saved_addresses, user_activity_logs, user_sessions
-- ============================================================

-- 1. Vérifier que RLS est activé sur toutes les tables
SELECT
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅ RLS activé' ELSE '❌ RLS NON activé' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('notifications', 'notifications', 'user_preferences', 'certificates', 'saved_addresses', 'user_activity_logs', 'user_sessions');

-- 2. Vérifier les politiques existantes
SELECT
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(cmd::text, ', ') as operations
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('notifications', 'notifications', 'user_preferences', 'certificates', 'saved_addresses', 'user_activity_logs', 'user_sessions')
GROUP BY tablename
ORDER BY tablename;

-- 3. Vérifier la présence de la colonne user_id
SELECT
  'notifications' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'user_id'
  ) as has_user_id;
SELECT
  'notifications' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'user_id'
  ) as has_user_id;
SELECT
  'user_preferences' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_preferences'
      AND column_name = 'user_id'
  ) as has_user_id;
SELECT
  'certificates' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'certificates'
      AND column_name = 'user_id'
  ) as has_user_id;
SELECT
  'saved_addresses' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_addresses'
      AND column_name = 'user_id'
  ) as has_user_id;
SELECT
  'user_activity_logs' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_activity_logs'
      AND column_name = 'user_id'
  ) as has_user_id;
SELECT
  'user_sessions' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_sessions'
      AND column_name = 'user_id'
  ) as has_user_id;



-- ============================================================
-- Vérification Pattern 2 (store_id)
-- Tables: disputes, invoices, subscriptions, product_analytics, recurring_bookings, service_availability, warranty_claims, store_analytics
-- ============================================================

-- 1. Vérifier que RLS est activé sur toutes les tables
SELECT
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅ RLS activé' ELSE '❌ RLS NON activé' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('disputes', 'invoices', 'subscriptions', 'product_analytics', 'recurring_bookings', 'service_availability', 'warranty_claims', 'store_analytics');

-- 2. Vérifier les politiques existantes
SELECT
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(cmd::text, ', ') as operations
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('disputes', 'invoices', 'subscriptions', 'product_analytics', 'recurring_bookings', 'service_availability', 'warranty_claims', 'store_analytics')
GROUP BY tablename
ORDER BY tablename;

-- 3. Vérifier la présence de la colonne store_id
SELECT
  'disputes' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'disputes'
      AND column_name = 'store_id'
  ) as has_store_id;
SELECT
  'invoices' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'invoices'
      AND column_name = 'store_id'
  ) as has_store_id;
SELECT
  'subscriptions' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscriptions'
      AND column_name = 'store_id'
  ) as has_store_id;
SELECT
  'product_analytics' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_analytics'
      AND column_name = 'store_id'
  ) as has_store_id;
SELECT
  'recurring_bookings' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'recurring_bookings'
      AND column_name = 'store_id'
  ) as has_store_id;
SELECT
  'service_availability' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'service_availability'
      AND column_name = 'store_id'
  ) as has_store_id;
SELECT
  'warranty_claims' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'warranty_claims'
      AND column_name = 'store_id'
  ) as has_store_id;
SELECT
  'store_analytics' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'store_analytics'
      AND column_name = 'store_id'
  ) as has_store_id;



-- ============================================================
-- Vérification Pattern 3 (public)
-- Tables: community_posts, public_reviews, reviews
-- ============================================================

-- 1. Vérifier que RLS est activé sur toutes les tables
SELECT
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅ RLS activé' ELSE '❌ RLS NON activé' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('community_posts', 'public_reviews', 'reviews');

-- 2. Vérifier les politiques existantes
SELECT
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(cmd::text, ', ') as operations
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('community_posts', 'public_reviews', 'reviews')
GROUP BY tablename
ORDER BY tablename;

-- 3. Vérifier la présence de la colonne user_id
SELECT
  'community_posts' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'community_posts'
      AND column_name = 'user_id'
  ) as has_user_id;
SELECT
  'public_reviews' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'public_reviews'
      AND column_name = 'user_id'
  ) as has_user_id;
SELECT
  'reviews' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reviews'
      AND column_name = 'user_id'
  ) as has_user_id;



-- ============================================================
-- Vérification Pattern 4 (admin_only)
-- Tables: admin_config, platform_settings, system_logs, admin_actions
-- ============================================================

-- 1. Vérifier que RLS est activé sur toutes les tables
SELECT
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅ RLS activé' ELSE '❌ RLS NON activé' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('admin_config', 'platform_settings', 'system_logs', 'admin_actions');

-- 2. Vérifier les politiques existantes
SELECT
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(cmd::text, ', ') as operations
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('admin_config', 'platform_settings', 'system_logs', 'admin_actions')
GROUP BY tablename
ORDER BY tablename;



-- ============================================================
-- Vérification Globale
-- ============================================================

-- Compter toutes les tables avec RLS activé
SELECT
  COUNT(*) as total_tables_with_rls
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;

-- Compter toutes les politiques RLS existantes
SELECT
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';