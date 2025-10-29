-- =====================================================
-- VALIDATION TESTS - Physical Advanced Features
-- Date: 29 Octobre 2025
-- =====================================================

-- =====================================================
-- 1. VÉRIFIER QUE TOUTES LES TABLES EXISTENT
-- =====================================================

SELECT 
  'Tables existantes' as test_name,
  COUNT(*) as total_tables,
  CASE 
    WHEN COUNT(*) = 11 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected 11 tables'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'pre_orders',
  'pre_order_customers',
  'backorders',
  'backorder_customers',
  'stock_alerts',
  'size_charts',
  'size_chart_measurements',
  'product_size_charts',
  'product_bundles',
  'bundle_items',
  'variant_images'
);

-- =====================================================
-- 2. VÉRIFIER RLS ACTIVÉ
-- =====================================================

SELECT 
  'RLS activé' as test_name,
  COUNT(*) as total_with_rls,
  CASE 
    WHEN COUNT(*) = 11 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected RLS on 11 tables'
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND rowsecurity = true
AND tablename IN (
  'pre_orders',
  'pre_order_customers',
  'backorders',
  'backorder_customers',
  'stock_alerts',
  'size_charts',
  'size_chart_measurements',
  'product_size_charts',
  'product_bundles',
  'bundle_items',
  'variant_images'
);

-- =====================================================
-- 3. VÉRIFIER POLICIES CRÉÉES
-- =====================================================

SELECT 
  'Policies créées' as test_name,
  COUNT(*) as total_policies,
  CASE 
    WHEN COUNT(*) >= 20 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected at least 20 policies'
  END as status
FROM pg_policies 
WHERE tablename IN (
  'pre_orders',
  'pre_order_customers',
  'backorders',
  'backorder_customers',
  'stock_alerts',
  'size_charts',
  'size_chart_measurements',
  'product_size_charts',
  'product_bundles',
  'bundle_items',
  'variant_images'
);

-- =====================================================
-- 4. VÉRIFIER INDEXES
-- =====================================================

SELECT 
  'Indexes créés' as test_name,
  COUNT(*) as total_indexes,
  CASE 
    WHEN COUNT(*) >= 15 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected at least 15 indexes'
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'pre_orders',
  'pre_order_customers',
  'backorders',
  'backorder_customers',
  'stock_alerts',
  'size_charts',
  'size_chart_measurements',
  'product_bundles',
  'bundle_items',
  'variant_images'
);

-- =====================================================
-- 5. VÉRIFIER TRIGGERS
-- =====================================================

SELECT 
  'Triggers créés' as test_name,
  COUNT(*) as total_triggers,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected at least 5 triggers'
  END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%updated_at%'
AND event_object_table IN (
  'pre_orders',
  'backorders',
  'stock_alerts',
  'size_charts',
  'product_bundles'
);

-- =====================================================
-- 6. TEST D'INSERTION - Pre-order
-- =====================================================

-- Note: Ce test nécessite un store_id et product_id valides
-- Remplacer 'YOUR_STORE_ID' et 'YOUR_PRODUCT_ID' par des valeurs réelles

/*
INSERT INTO public.pre_orders (
  store_id,
  product_id,
  status,
  is_enabled,
  expected_availability_date
) VALUES (
  'YOUR_STORE_ID'::UUID,
  'YOUR_PRODUCT_ID'::UUID,
  'active',
  true,
  NOW() + INTERVAL '30 days'
) RETURNING id, status, created_at;
*/

-- =====================================================
-- 7. RÉSUMÉ FINAL
-- =====================================================

SELECT 
  '=== RÉSUMÉ VALIDATION ===' as summary,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('pre_orders','backorders','stock_alerts','size_charts','product_bundles','variant_images')) as tables_created,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true AND tablename IN ('pre_orders','backorders','stock_alerts','size_charts','product_bundles','variant_images')) as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('pre_orders','backorders','stock_alerts','size_charts','product_bundles','variant_images')) as policies_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('pre_orders','backorders','stock_alerts','size_charts','product_bundles','variant_images')) as indexes_count;

