-- ============================================================
-- Test des flux critiques RLS - Post-migration
-- Usage: Exécuter dans Supabase SQL Editor après db push
-- ============================================================

-- 1. Vérifier que toutes les tables ont RLS activé
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅' ELSE '❌' END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY rowsecurity ASC, tablename;

-- 2. Tables SANS RLS (critique)
SELECT tablename as "❌ Table sans RLS"
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false
ORDER BY tablename;

-- 3. Tables avec RLS mais SANS politiques
SELECT t.tablename as "⚠️ Table RLS sans politique"
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public' AND t.rowsecurity = true
GROUP BY t.tablename
HAVING COUNT(p.policyname) = 0
ORDER BY t.tablename;

-- 4. Compter les politiques par table
SELECT 
  tablename,
  COUNT(*) as nb_policies,
  string_agg(DISTINCT cmd::text, ', ') as operations
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 5. Vérifier les tables critiques
SELECT 
  t.tablename,
  t.rowsecurity as rls,
  COUNT(p.policyname) as policies,
  CASE 
    WHEN t.rowsecurity AND COUNT(p.policyname) > 0 THEN '✅ OK'
    WHEN t.rowsecurity AND COUNT(p.policyname) = 0 THEN '⚠️ RLS sans policy'
    ELSE '❌ DANGER'
  END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'profiles', 'stores', 'products', 'orders', 'order_items',
    'customers', 'payments', 'transactions', 'digital_products',
    'digital_licenses', 'physical_products', 'services',
    'service_bookings', 'courses', 'reviews', 'notifications',
    'affiliates', 'commissions', 'subscriptions', 'invoices'
  )
GROUP BY t.tablename, t.rowsecurity
ORDER BY status DESC, t.tablename;

-- 6. Résumé global
SELECT 
  COUNT(*) FILTER (WHERE rowsecurity = true) as "Tables avec RLS",
  COUNT(*) FILTER (WHERE rowsecurity = false) as "Tables sans RLS",
  COUNT(*) as "Total tables"
FROM pg_tables 
WHERE schemaname = 'public';
