-- =====================================================
-- SCRIPT DE DIAGNOSTIC - EMARZONA DATABASE
-- Date: 28 Octobre 2025
-- Usage: Exécuter ce script pour diagnostiquer l'état de la DB
-- =====================================================

-- =====================================================
-- 1. VÉRIFICATION DES TABLES PRINCIPALES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 DIAGNOSTIC EMARZONA DATABASE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- Vérifier les tables Digital Products
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '🔵 DIGITAL PRODUCTS:';
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'digital_products';
  RAISE NOTICE '  digital_products: %', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'digital_product_files';
  RAISE NOTICE '  digital_product_files: %', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'digital_licenses';
  RAISE NOTICE '  digital_licenses: %', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  RAISE NOTICE '';
END $$;

-- Vérifier les tables Physical Products
DO $$
DECLARE
  v_count INTEGER;
  v_table_name TEXT;
BEGIN
  RAISE NOTICE '📦 PHYSICAL PRODUCTS:';
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'physical_products';
  RAISE NOTICE '  physical_products: %', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  -- ⚠️ VÉRIFICATION CRITIQUE: product_variants vs physical_product_variants
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'product_variants';
  
  IF v_count > 0 THEN
    RAISE WARNING '  ⚠️  product_variants existe (ancien nom) - NÉCESSITE FIX';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'physical_product_variants';
  
  IF v_count > 0 THEN
    RAISE NOTICE '  physical_product_variants: ✅';
  ELSE
    RAISE WARNING '  physical_product_variants: ❌ MANQUANTE';
    RAISE NOTICE '  👉 Exécuter: 20251028_fix_physical_product_variants_naming.sql';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'inventory_items';
  RAISE NOTICE '  inventory_items: %', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'physical_product_inventory';
  RAISE NOTICE '  physical_product_inventory: %', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  RAISE NOTICE '';
END $$;

-- Vérifier les tables Service Products
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '🛎️  SERVICE PRODUCTS:';
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'service_products';
  RAISE NOTICE '  service_products: %', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'service_bookings';
  RAISE NOTICE '  service_bookings: %', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'service_availability_slots';
  RAISE NOTICE '  service_availability_slots: %', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  RAISE NOTICE '';
END $$;

-- Vérifier order_items
DO $$
DECLARE
  v_has_column BOOLEAN;
BEGIN
  RAISE NOTICE '📝 ORDER ITEMS:';
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'order_items' 
      AND column_name = 'product_type'
  ) INTO v_has_column;
  RAISE NOTICE '  product_type column: %', CASE WHEN v_has_column THEN '✅' ELSE '❌' END;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'order_items' 
      AND column_name = 'digital_product_id'
  ) INTO v_has_column;
  RAISE NOTICE '  digital_product_id column: %', CASE WHEN v_has_column THEN '✅' ELSE '❌' END;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'order_items' 
      AND column_name = 'physical_product_id'
  ) INTO v_has_column;
  RAISE NOTICE '  physical_product_id column: %', CASE WHEN v_has_column THEN '✅' ELSE '❌' END;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'order_items' 
      AND column_name = 'variant_id'
  ) INTO v_has_column;
  RAISE NOTICE '  variant_id column: %', CASE WHEN v_has_column THEN '✅' ELSE '❌' END;
  
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 2. VÉRIFICATION DES FOREIGN KEYS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🔗 FOREIGN KEYS CRITIQUES:';
END $$;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY'
        AND table_name = 'order_items'
        AND constraint_name LIKE '%variant%'
    ) THEN '✅ order_items → variant_id'
    ELSE '❌ order_items → variant_id MANQUANTE'
  END as fk_status
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY'
        AND table_name = 'inventory_items'
        AND constraint_name LIKE '%variant%'
    ) THEN '✅ inventory_items → variant_id'
    ELSE '❌ inventory_items → variant_id MANQUANTE'
  END;

-- =====================================================
-- 3. COMPTER LES DONNÉES
-- =====================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📊 DONNÉES EXISTANTES:';
  
  -- Digital
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'digital_products'
  ) THEN
    SELECT COUNT(*) INTO v_count FROM public.digital_products;
    RAISE NOTICE '  Digital products: %', v_count;
  ELSE
    RAISE NOTICE '  Digital products: 0 (table manquante)';
  END IF;

  -- Physical
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'physical_products'
  ) THEN
    SELECT COUNT(*) INTO v_count FROM public.physical_products;
    RAISE NOTICE '  Physical products: %', v_count;
  ELSE
    RAISE NOTICE '  Physical products: 0 (table manquante)';
  END IF;
  
  -- Check variants table (old or new)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'physical_product_variants') THEN
    SELECT COUNT(*) INTO v_count FROM public.physical_product_variants;
    RAISE NOTICE '  Physical variants: %', v_count;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_variants') THEN
    SELECT COUNT(*) INTO v_count FROM public.product_variants;
    RAISE NOTICE '  Product variants (old): %', v_count;
  ELSE
    RAISE NOTICE '  Physical variants: 0 (table manquante)';
  END IF;
  
  -- Service
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'service_products'
  ) THEN
    SELECT COUNT(*) INTO v_count FROM public.service_products;
    RAISE NOTICE '  Service products: %', v_count;
  ELSE
    RAISE NOTICE '  Service products: 0 (table manquante)';
  END IF;

  -- Orders
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'order_items'
  ) THEN
    SELECT COUNT(*) INTO v_count FROM public.order_items;
    RAISE NOTICE '  Order items: %', v_count;
  ELSE
    RAISE NOTICE '  Order items: 0 (table manquante)';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 4. RECOMMANDATIONS
-- =====================================================

DO $$
DECLARE
  v_has_old_table BOOLEAN;
  v_has_new_table BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '💡 RECOMMANDATIONS:';
  RAISE NOTICE '========================================';
  
  -- Check table names
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'product_variants'
  ) INTO v_has_old_table;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'physical_product_variants'
  ) INTO v_has_new_table;
  
  IF v_has_old_table AND NOT v_has_new_table THEN
    RAISE WARNING '';
    RAISE WARNING '⚠️  PROBLÈME DÉTECTÉ:';
    RAISE WARNING '  La table "product_variants" existe mais devrait s''appeler';
    RAISE WARNING '  "physical_product_variants" pour cohérence avec le code.';
    RAISE WARNING '';
    RAISE WARNING '✅ SOLUTION:';
    RAISE WARNING '  Exécuter: supabase/migrations/20251028_fix_physical_product_variants_naming.sql';
    RAISE WARNING '';
  ELSIF v_has_new_table THEN
    RAISE NOTICE '✅ Structure correcte: physical_product_variants existe';
  ELSE
    RAISE WARNING '❌ Aucune table de variantes trouvée';
    RAISE WARNING '  Exécuter: supabase/migrations/20251028_physical_products_professional.sql';
    RAISE WARNING '  Puis: supabase/migrations/20251028_fix_physical_product_variants_naming.sql';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📖 Guide complet: MIGRATIONS_EXECUTION_GUIDE.md';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 5. LISTE DES MIGRATIONS RECOMMANDÉES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📝 ORDRE DES MIGRATIONS:';
  RAISE NOTICE '  1️⃣  20251027_digital_products_professional.sql';
  RAISE NOTICE '  2️⃣  20251028_physical_products_professional.sql';
  RAISE NOTICE '  3️⃣  20251028_fix_physical_product_variants_naming.sql ⚠️ CRITIQUE';
  RAISE NOTICE '  4️⃣  20251028000001_service_products_system.sql';
  RAISE NOTICE '  5️⃣  20251028_extend_order_items_for_specialized_products.sql';
  RAISE NOTICE '';
END $$;

