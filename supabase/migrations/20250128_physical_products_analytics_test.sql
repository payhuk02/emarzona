-- =====================================================
-- REQUÊTES DE TEST POUR ANALYTICS PRODUITS PHYSIQUES
-- Date: 28 Janvier 2025
-- =====================================================

-- 1. Vérifier que toutes les tables existent
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN (
    'physical_product_analytics',
    'sales_forecasts',
    'warehouse_performance',
    'geographic_sales_performance',
    'stock_rotation_reports'
  )
ORDER BY table_name;

-- 2. Vérifier que les fonctions existent
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'calculate_product_analytics',
    'calculate_stock_rotation'
  )
ORDER BY routine_name;

-- 3. Obtenir un ID de produit physique réel pour tester
-- (Remplacez par un ID réel de votre base de données)
SELECT 
  pp.id as physical_product_id,
  p.name as product_name,
  p.store_id
FROM public.physical_products pp
INNER JOIN public.products p ON pp.product_id = p.id
LIMIT 5;

-- 4. Exemple d'utilisation de calculate_product_analytics
-- Remplacez 'VOTRE-UUID-ICI' par un ID réel de la requête ci-dessus
/*
SELECT calculate_product_analytics(
  'VOTRE-UUID-ICI'::UUID,  -- Remplacez par un physical_product_id réel
  '2025-01-01'::DATE,      -- Date de début
  '2025-01-31'::DATE,      -- Date de fin
  NULL,                     -- variant_id (optionnel)
  NULL,                     -- warehouse_id (optionnel)
  'monthly'                 -- period_type (optionnel, défaut: 'daily')
);
*/

-- 5. Exemple d'utilisation de calculate_stock_rotation
-- Remplacez 'VOTRE-UUID-ICI' par un ID réel
/*
SELECT calculate_stock_rotation(
  'VOTRE-UUID-ICI'::UUID,  -- Remplacez par un physical_product_id réel
  '2025-01-01'::DATE,      -- Date de début
  '2025-01-31'::DATE,      -- Date de fin
  NULL,                     -- variant_id (optionnel)
  NULL                      -- warehouse_id (optionnel)
);
*/

-- 6. Vérifier les RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'physical_product_analytics',
    'sales_forecasts',
    'warehouse_performance',
    'geographic_sales_performance',
    'stock_rotation_reports'
  )
ORDER BY tablename, policyname;

-- 7. Vérifier les triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN (
    'physical_product_analytics',
    'sales_forecasts',
    'warehouse_performance',
    'geographic_sales_performance',
    'stock_rotation_reports'
  )
ORDER BY event_object_table, trigger_name;



