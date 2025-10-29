-- ============================================================================
-- VÉRIFICATION COMPLÈTE DES 4 SYSTÈMES E-COMMERCE
-- Date: 2025-10-29
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFICATION DES TABLES
-- ============================================================================

-- Physical Products Tables
SELECT 
  '🏭 PHYSICAL PRODUCTS - TABLES' as system,
  COUNT(*) as tables_count
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN (
    'physical_products',
    'product_variants',
    'variant_options',
    'inventory_locations',
    'inventory_items',
    'shipping_zones',
    'shipping_rates',
    'pre_orders',
    'backorders',
    'size_charts',
    'product_bundles',
    'bundle_items',
    'variant_images'
  );

-- Services Tables
SELECT 
  '🛎️ SERVICES - TABLES' as system,
  COUNT(*) as tables_count
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN (
    'service_products',
    'service_bookings',
    'service_availability',
    'service_packages',
    'service_options',
    'booking_slots',
    'service_staff',
    'recurring_bookings'
  );

-- Courses Tables
SELECT 
  '🎓 COURSES - TABLES' as system,
  COUNT(*) as tables_count
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN (
    'courses',
    'course_modules',
    'course_lessons',
    'course_enrollments',
    'student_progress',
    'course_certificates',
    'quiz_questions'
  );

-- Digital Products Tables (déjà vérifié)
SELECT 
  '💻 DIGITAL PRODUCTS - TABLES' as system,
  COUNT(*) as tables_count
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename LIKE 'digital_%';

-- ============================================================================
-- 2. DÉTAIL DES TABLES PAR SYSTÈME
-- ============================================================================

-- Physical Products - Détail
SELECT 
  '🏭 PHYSICAL PRODUCTS - Détail' as info,
  tablename,
  'Existe' as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND (
    tablename LIKE 'physical_%' OR
    tablename IN ('product_variants', 'variant_options', 'inventory_locations', 'inventory_items', 'shipping_zones', 'shipping_rates', 'pre_orders', 'backorders', 'size_charts')
  )
ORDER BY tablename;

-- Services - Détail
SELECT 
  '🛎️ SERVICES - Détail' as info,
  tablename,
  'Existe' as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND (
    tablename LIKE 'service_%' OR
    tablename IN ('booking_slots', 'recurring_bookings')
  )
ORDER BY tablename;

-- Courses - Détail
SELECT 
  '🎓 COURSES - Détail' as info,
  tablename,
  'Existe' as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND (
    tablename LIKE 'course_%' OR
    tablename IN ('courses', 'student_progress', 'quiz_questions')
  )
ORDER BY tablename;

-- ============================================================================
-- 3. VÉRIFIER LES DONNÉES
-- ============================================================================

-- Physical Products - Données
SELECT 
  '🏭 PHYSICAL PRODUCTS - Données' as info,
  (SELECT COUNT(*) FROM physical_products) as physical_products_count,
  (SELECT COUNT(*) FROM product_variants) as variants_count,
  (SELECT COUNT(*) FROM inventory_items) as inventory_count;

-- Services - Données
SELECT 
  '🛎️ SERVICES - Données' as info,
  (SELECT COUNT(*) FROM service_products) as services_count,
  (SELECT COUNT(*) FROM service_bookings) as bookings_count,
  (SELECT COUNT(*) FROM service_packages) as packages_count;

-- Courses - Données
SELECT 
  '🎓 COURSES - Données' as info,
  (SELECT COUNT(*) FROM courses) as courses_count,
  (SELECT COUNT(*) FROM course_modules) as modules_count,
  (SELECT COUNT(*) FROM course_enrollments) as enrollments_count;

-- ============================================================================
-- 4. TEST DE CRÉATION - PHYSICAL PRODUCT
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID;
  v_product_id UUID;
  v_physical_id UUID;
BEGIN
  -- Récupérer un store
  SELECT id INTO v_store_id FROM public.stores LIMIT 1;
  
  IF v_store_id IS NULL THEN
    RAISE NOTICE '⚠️  Aucun store pour test Physical Product';
    RETURN;
  END IF;
  
  -- Créer un produit physique test
  INSERT INTO public.products (store_id, name, slug, price, is_active, product_type)
  VALUES (v_store_id, 'Test Physical Product', 'test-phys-' || substr(gen_random_uuid()::text, 1, 8), 99.99, true, 'physical')
  RETURNING id INTO v_product_id;
  
  -- Créer l'entrée physical_products
  INSERT INTO public.physical_products (product_id, weight, dimensions, requires_shipping, stock_quantity)
  VALUES (v_product_id, 1.5, '{"length": 20, "width": 15, "height": 10}', true, 100)
  RETURNING id INTO v_physical_id;
  
  RAISE NOTICE '✅ Physical Product créé: product_id=%, physical_id=%', v_product_id, v_physical_id;
  
  -- Nettoyer
  DELETE FROM public.products WHERE id = v_product_id;
  RAISE NOTICE '🧹 Test Physical Product nettoyé';
  
END $$;

-- ============================================================================
-- 5. TEST DE CRÉATION - SERVICE
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID;
  v_product_id UUID;
  v_service_id UUID;
BEGIN
  -- Récupérer un store
  SELECT id INTO v_store_id FROM public.stores LIMIT 1;
  
  IF v_store_id IS NULL THEN
    RAISE NOTICE '⚠️  Aucun store pour test Service';
    RETURN;
  END IF;
  
  -- Créer un produit service test
  INSERT INTO public.products (store_id, name, slug, price, is_active, product_type)
  VALUES (v_store_id, 'Test Service Product', 'test-serv-' || substr(gen_random_uuid()::text, 1, 8), 149.99, true, 'service')
  RETURNING id INTO v_product_id;
  
  -- Créer l'entrée service_products
  INSERT INTO public.service_products (product_id, duration_minutes, max_participants, requires_booking)
  VALUES (v_product_id, 60, 1, true)
  RETURNING id INTO v_service_id;
  
  RAISE NOTICE '✅ Service Product créé: product_id=%, service_id=%', v_product_id, v_service_id;
  
  -- Nettoyer
  DELETE FROM public.products WHERE id = v_product_id;
  RAISE NOTICE '🧹 Test Service nettoyé';
  
END $$;

-- ============================================================================
-- 6. TEST DE CRÉATION - COURSE
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID;
  v_course_id UUID;
BEGIN
  -- Récupérer un store
  SELECT id INTO v_store_id FROM public.stores LIMIT 1;
  
  IF v_store_id IS NULL THEN
    RAISE NOTICE '⚠️  Aucun store pour test Course';
    RETURN;
  END IF;
  
  -- Créer un cours test
  INSERT INTO public.courses (
    store_id, 
    title, 
    slug, 
    description, 
    price, 
    is_published,
    difficulty_level,
    duration_hours
  )
  VALUES (
    v_store_id, 
    'Test Course', 
    'test-course-' || substr(gen_random_uuid()::text, 1, 8),
    'Test course description',
    199.99, 
    true,
    'beginner',
    10
  )
  RETURNING id INTO v_course_id;
  
  RAISE NOTICE '✅ Course créé: course_id=%', v_course_id;
  
  -- Nettoyer
  DELETE FROM public.courses WHERE id = v_course_id;
  RAISE NOTICE '🧹 Test Course nettoyé';
  
END $$;

-- ============================================================================
-- RÉSUMÉ FINAL
-- ============================================================================

SELECT 
  '═══════════════════════════════════════' as separator
UNION ALL
SELECT '  📊 RÉSUMÉ DE LA VÉRIFICATION'
UNION ALL
SELECT '═══════════════════════════════════════';

-- Compter les tables par système
WITH system_tables AS (
  SELECT 
    CASE 
      WHEN tablename LIKE 'digital_%' THEN 'Digital Products'
      WHEN tablename LIKE 'physical_%' OR tablename IN ('product_variants', 'variant_options', 'inventory_locations', 'inventory_items', 'shipping_zones', 'shipping_rates', 'pre_orders', 'backorders', 'size_charts') THEN 'Physical Products'
      WHEN tablename LIKE 'service_%' OR tablename IN ('booking_slots', 'recurring_bookings') THEN 'Services'
      WHEN tablename LIKE 'course_%' OR tablename IN ('courses', 'student_progress', 'quiz_questions') THEN 'Courses'
      ELSE 'Other'
    END as system,
    tablename
  FROM pg_tables
  WHERE schemaname = 'public'
    AND (
      tablename LIKE 'digital_%' OR
      tablename LIKE 'physical_%' OR
      tablename LIKE 'service_%' OR
      tablename LIKE 'course_%' OR
      tablename IN ('product_variants', 'variant_options', 'inventory_locations', 'inventory_items', 'shipping_zones', 'shipping_rates', 'pre_orders', 'backorders', 'size_charts', 'booking_slots', 'recurring_bookings', 'courses', 'student_progress', 'quiz_questions')
    )
)
SELECT 
  system,
  COUNT(*) as tables_count,
  CASE 
    WHEN COUNT(*) >= 7 THEN '✅ Complet'
    WHEN COUNT(*) >= 3 THEN '⚠️  Partiel'
    ELSE '❌ Incomplet'
  END as status
FROM system_tables
WHERE system != 'Other'
GROUP BY system
ORDER BY 
  CASE system
    WHEN 'Digital Products' THEN 1
    WHEN 'Physical Products' THEN 2
    WHEN 'Services' THEN 3
    WHEN 'Courses' THEN 4
  END;

-- Message final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '  ✅ VÉRIFICATION TERMINÉE';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- FIN DE LA VÉRIFICATION
-- ============================================================================

