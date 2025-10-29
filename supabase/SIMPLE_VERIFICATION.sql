-- ============================================================================
-- VÉRIFICATION SIMPLE - TOUS LES SYSTÈMES E-COMMERCE
-- Cette version ne plante pas si des tables n'existent pas
-- ============================================================================

-- ============================================================================
-- 1. LISTER TOUTES LES TABLES PAR SYSTÈME
-- ============================================================================

-- Digital Products
SELECT 
  '💻 DIGITAL PRODUCTS' as system,
  tablename,
  '✅' as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename LIKE 'digital_%'
ORDER BY tablename;

-- Physical Products  
SELECT 
  '🏭 PHYSICAL PRODUCTS' as system,
  tablename,
  '✅' as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND (
    tablename LIKE 'physical_%' OR
    tablename IN ('product_variants', 'variant_options', 'inventory_locations', 'inventory_items', 'shipping_zones', 'shipping_rates', 'pre_orders', 'backorders', 'size_charts', 'stock_alerts', 'variant_images')
  )
ORDER BY tablename;

-- Services
SELECT 
  '🛎️ SERVICES' as system,
  tablename,
  '✅' as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND (
    tablename LIKE 'service_%' OR
    tablename IN ('booking_slots', 'recurring_bookings')
  )
ORDER BY tablename;

-- Courses
SELECT 
  '🎓 COURSES' as system,
  tablename,
  '✅' as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND (
    tablename LIKE 'course_%' OR
    tablename IN ('courses', 'student_progress', 'quiz_questions', 'enrollments')
  )
ORDER BY tablename;

-- ============================================================================
-- 2. RÉSUMÉ PAR SYSTÈME
-- ============================================================================

WITH all_systems AS (
  SELECT 
    '💻 Digital Products' as system,
    COUNT(*) as tables_count
  FROM pg_tables
  WHERE schemaname = 'public' 
    AND tablename LIKE 'digital_%'
  
  UNION ALL
  
  SELECT 
    '🏭 Physical Products' as system,
    COUNT(*) as tables_count
  FROM pg_tables
  WHERE schemaname = 'public' 
    AND (
      tablename LIKE 'physical_%' OR
      tablename IN ('product_variants', 'variant_options', 'inventory_locations', 'inventory_items', 'shipping_zones', 'shipping_rates', 'pre_orders', 'backorders', 'size_charts', 'stock_alerts', 'variant_images')
    )
  
  UNION ALL
  
  SELECT 
    '🛎️ Services' as system,
    COUNT(*) as tables_count
  FROM pg_tables
  WHERE schemaname = 'public' 
    AND (
      tablename LIKE 'service_%' OR
      tablename IN ('booking_slots', 'recurring_bookings')
    )
  
  UNION ALL
  
  SELECT 
    '🎓 Courses' as system,
    COUNT(*) as tables_count
  FROM pg_tables
  WHERE schemaname = 'public' 
    AND (
      tablename LIKE 'course_%' OR
      tablename IN ('courses', 'student_progress', 'quiz_questions', 'enrollments')
    )
)
SELECT 
  system,
  tables_count,
  CASE 
    WHEN tables_count >= 10 THEN '✅ Excellent'
    WHEN tables_count >= 7 THEN '✅ Bon'
    WHEN tables_count >= 3 THEN '⚠️  Partiel'
    WHEN tables_count > 0 THEN '⚠️  Minimal'
    ELSE '❌ Aucune table'
  END as status,
  CASE 
    WHEN tables_count >= 7 THEN 'Système complet et opérationnel'
    WHEN tables_count >= 3 THEN 'Système partiel - Migrations à exécuter'
    WHEN tables_count > 0 THEN 'Système minimal - Vérifier les migrations'
    ELSE 'Système non installé'
  END as recommandation
FROM all_systems
ORDER BY tables_count DESC;

-- ============================================================================
-- 3. VÉRIFIER LES MIGRATIONS IMPORTANTES
-- ============================================================================

-- Tables critiques par système
SELECT 
  'TABLES CRITIQUES' as check_type,
  'digital_products' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'digital_products') 
    THEN '✅ Existe' 
    ELSE '❌ Manquante' 
  END as status
UNION ALL
SELECT 'TABLES CRITIQUES', 'digital_bundles',
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'digital_bundles') 
    THEN '✅ Existe' 
    ELSE '❌ Manquante' 
  END
UNION ALL
SELECT 'TABLES CRITIQUES', 'physical_products',
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'physical_products') 
    THEN '✅ Existe' 
    ELSE '❌ Manquante' 
  END
UNION ALL
SELECT 'TABLES CRITIQUES', 'service_products',
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'service_products') 
    THEN '✅ Existe' 
    ELSE '❌ Manquante' 
  END
UNION ALL
SELECT 'TABLES CRITIQUES', 'courses',
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'courses') 
    THEN '✅ Existe' 
    ELSE '❌ Manquante' 
  END;

-- ============================================================================
-- 4. VÉRIFIER LES VUES ANALYTICS
-- ============================================================================

SELECT 
  'VUES ANALYTICS' as check_type,
  viewname as view_name,
  '✅ Existe' as status
FROM pg_views
WHERE schemaname = 'public' 
  AND (
    viewname LIKE 'digital_%' OR
    viewname LIKE 'physical_%' OR
    viewname LIKE 'service_%' OR
    viewname LIKE 'course_%'
  )
ORDER BY viewname;

-- ============================================================================
-- 5. VÉRIFIER LES FONCTIONS IMPORTANTES
-- ============================================================================

SELECT 
  'FONCTIONS' as check_type,
  proname as function_name,
  '✅ Existe' as status
FROM pg_proc
WHERE proname IN (
  'generate_license_key',
  'validate_license',
  'calculate_bundle_original_price',
  'generate_bundle_slug',
  'get_remaining_downloads',
  'has_digital_access'
)
ORDER BY proname;

-- ============================================================================
-- RÉSUMÉ FINAL
-- ============================================================================

DO $$
DECLARE
  v_digital_count INTEGER;
  v_physical_count INTEGER;
  v_services_count INTEGER;
  v_courses_count INTEGER;
  v_total INTEGER;
BEGIN
  -- Compter les tables de chaque système
  SELECT COUNT(*) INTO v_digital_count
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename LIKE 'digital_%';
  
  SELECT COUNT(*) INTO v_physical_count
  FROM pg_tables
  WHERE schemaname = 'public' 
    AND (tablename LIKE 'physical_%' OR tablename IN ('product_variants', 'inventory_items'));
  
  SELECT COUNT(*) INTO v_services_count
  FROM pg_tables
  WHERE schemaname = 'public' 
    AND (tablename LIKE 'service_%' OR tablename IN ('booking_slots'));
  
  SELECT COUNT(*) INTO v_courses_count
  FROM pg_tables
  WHERE schemaname = 'public' 
    AND (tablename LIKE 'course_%' OR tablename = 'courses');
  
  v_total := v_digital_count + v_physical_count + v_services_count + v_courses_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '  📊 RÉSUMÉ DE LA VÉRIFICATION';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '💻 Digital Products  : % tables', v_digital_count;
  RAISE NOTICE '🏭 Physical Products : % tables', v_physical_count;
  RAISE NOTICE '🛎️  Services          : % tables', v_services_count;
  RAISE NOTICE '🎓 Courses           : % tables', v_courses_count;
  RAISE NOTICE '';
  RAISE NOTICE '📦 TOTAL: % tables e-commerce', v_total;
  RAISE NOTICE '';
  
  IF v_total >= 35 THEN
    RAISE NOTICE '✅ EXCELLENT! Tous les systèmes sont complets';
  ELSIF v_total >= 20 THEN
    RAISE NOTICE '✅ BON! La plupart des systèmes sont installés';
  ELSIF v_total >= 10 THEN
    RAISE NOTICE '⚠️  PARTIEL - Certaines migrations manquent';
  ELSE
    RAISE NOTICE '❌ INCOMPLET - Exécuter les migrations';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  
END $$;

-- ============================================================================
-- FIN DE LA VÉRIFICATION
-- ============================================================================

