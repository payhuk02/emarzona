-- =========================================================
-- Script de Test - Améliorations Service (Phase 1, 2, 3)
-- Date : 1 Février 2025
-- Description : Tests de validation pour toutes les améliorations
-- =========================================================

-- ============================================================
-- 1. TEST: Vérifier que les RLS Policies sont consolidées
-- ============================================================

DO $$
DECLARE
  policy_count INTEGER;
  expected_policies TEXT[] := ARRAY[
    'service_bookings_select_policy',
    'service_bookings_insert_policy',
    'service_bookings_update_policy',
    'service_bookings_delete_policy'
  ];
  policy_name TEXT;
  missing_policies TEXT[] := '{}';
BEGIN
  RAISE NOTICE '=== TEST 1: Vérification RLS Policies ===';
  
  FOR policy_name IN SELECT unnest(expected_policies)
  LOOP
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'service_bookings'
      AND policyname = policy_name;
    
    IF policy_count = 0 THEN
      missing_policies := array_append(missing_policies, policy_name);
      RAISE NOTICE '❌ Policy manquante: %', policy_name;
    ELSE
      RAISE NOTICE '✅ Policy présente: %', policy_name;
    END IF;
  END LOOP;
  
  IF array_length(missing_policies, 1) > 0 THEN
    RAISE EXCEPTION 'Policies manquantes: %', array_to_string(missing_policies, ', ');
  ELSE
    RAISE NOTICE '✅ Toutes les RLS policies sont présentes';
  END IF;
END $$;

-- ============================================================
-- 2. TEST: Vérifier que les indexes composites sont créés
-- ============================================================

DO $$
DECLARE
  index_count INTEGER;
  expected_indexes TEXT[] := ARRAY[
    'idx_service_bookings_date_status',
    'idx_service_bookings_staff_date',
    'idx_service_bookings_product_date_status',
    'idx_service_bookings_user_date',
    'idx_service_bookings_product_staff',
    'idx_service_availability_day_active',
    'idx_service_availability_service_day',
    'idx_service_availability_staff_day',
    'idx_service_staff_active',
    'idx_service_staff_store_active'
  ];
  index_name TEXT;
  missing_indexes TEXT[] := '{}';
BEGIN
  RAISE NOTICE '=== TEST 2: Vérification Indexes Composites ===';
  
  FOR index_name IN SELECT unnest(expected_indexes)
  LOOP
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = index_name;
    
    IF index_count = 0 THEN
      missing_indexes := array_append(missing_indexes, index_name);
      RAISE NOTICE '❌ Index manquant: %', index_name;
    ELSE
      RAISE NOTICE '✅ Index présent: %', index_name;
    END IF;
  END LOOP;
  
  IF array_length(missing_indexes, 1) > 0 THEN
    RAISE WARNING 'Indexes manquants: %. Exécutez la migration 20250201_add_service_indexes_composites.sql', array_to_string(missing_indexes, ', ');
  ELSE
    RAISE NOTICE '✅ Tous les indexes composites sont présents';
  END IF;
END $$;

-- ============================================================
-- 3. TEST: Vérifier structure table service_bookings
-- ============================================================

DO $$
DECLARE
  column_count INTEGER;
  required_columns TEXT[] := ARRAY[
    'product_id',
    'user_id',
    'staff_member_id',
    'scheduled_date',
    'scheduled_start_time',
    'scheduled_end_time',
    'status',
    'participants_count'
  ];
  col_name TEXT;  -- Renommé pour éviter conflit avec column_name de information_schema
  missing_columns TEXT[] := '{}';
BEGIN
  RAISE NOTICE '=== TEST 3: Vérification Structure service_bookings ===';
  
  FOR col_name IN SELECT unnest(required_columns)
  LOOP
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'service_bookings'
      AND information_schema.columns.column_name = col_name;  -- Qualification explicite
    
    IF column_count = 0 THEN
      missing_columns := array_append(missing_columns, col_name);
      RAISE NOTICE '❌ Colonne manquante: %', col_name;
    ELSE
      RAISE NOTICE '✅ Colonne présente: %', col_name;
    END IF;
  END LOOP;
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE WARNING 'Colonnes manquantes: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ Structure table service_bookings correcte';
  END IF;
END $$;

-- ============================================================
-- 4. TEST: Vérifier fonctions utilitaires
-- ============================================================

DO $$
DECLARE
  func_count INTEGER;
  expected_functions TEXT[] := ARRAY[
    'get_available_slots',
    'get_service_booking_stats',
    'calculate_waitlist_position',
    'notify_waitlist_customers',
    'convert_waitlist_to_booking'
  ];
  func_name TEXT;
  missing_functions TEXT[] := '{}';
BEGIN
  RAISE NOTICE '=== TEST 4: Vérification Fonctions Utilitaires ===';
  
  FOR func_name IN SELECT unnest(expected_functions)
  LOOP
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = func_name;
    
    IF func_count = 0 THEN
      missing_functions := array_append(missing_functions, func_name);
      RAISE NOTICE '⚠️ Fonction optionnelle non trouvée: %', func_name;
    ELSE
      RAISE NOTICE '✅ Fonction présente: %', func_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Vérification des fonctions terminée';
END $$;

-- ============================================================
-- 5. TEST: Vérifier contraintes CHECK sur service_bookings.status
-- ============================================================

DO $$
DECLARE
  constraint_found BOOLEAN;
BEGIN
  RAISE NOTICE '=== TEST 5: Vérification Contraintes CHECK ===';
  
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'service_bookings'
      AND tc.constraint_type = 'CHECK'
      AND cc.check_clause LIKE '%status%'
  ) INTO constraint_found;
  
  IF constraint_found THEN
    RAISE NOTICE '✅ Contrainte CHECK sur status présente';
  ELSE
    RAISE WARNING '⚠️ Contrainte CHECK sur status non trouvée';
  END IF;
END $$;

-- ============================================================
-- 6. TEST: Performance - Vérifier utilisation des indexes
-- ============================================================

DO $$
DECLARE
  index_usage_count INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 6: Vérification Performance Indexes ===';
  
  -- Vérifier que les indexes sont utilisables
  -- (Note: Ce test nécessite des données pour être vraiment utile)
  
  SELECT COUNT(*) INTO index_usage_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('service_bookings', 'service_availability_slots', 'service_staff_members')
    AND indexname LIKE 'idx_service%';
  
  RAISE NOTICE '✅ Nombre d''indexes trouvés: %', index_usage_count;
  
  IF index_usage_count < 10 THEN
    RAISE WARNING '⚠️ Moins d''indexes que prévu. Exécutez la migration 20250201_add_service_indexes_composites.sql';
  END IF;
END $$;

-- ============================================================
-- 7. TEST: Vérifier RLS activé sur toutes les tables
-- ============================================================

DO $$
DECLARE
  table_count INTEGER;
  rls_enabled_count INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 7: Vérification RLS Activé ===';
  
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'service_products',
      'service_bookings',
      'service_staff_members',
      'service_availability_slots',
      'service_resources',
      'service_waitlist'
    );
  
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
    AND t.tablename IN (
      'service_products',
      'service_bookings',
      'service_staff_members',
      'service_availability_slots',
      'service_resources',
      'service_waitlist'
    )
    AND c.relrowsecurity = true;
  
  RAISE NOTICE 'Tables service trouvées: %', table_count;
  RAISE NOTICE 'Tables avec RLS activé: %', rls_enabled_count;
  
  IF rls_enabled_count < table_count THEN
    RAISE WARNING '⚠️ Certaines tables n''ont pas RLS activé';
  ELSE
    RAISE NOTICE '✅ Toutes les tables ont RLS activé';
  END IF;
END $$;

-- ============================================================
-- RÉSUMÉ FINAL
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TESTS DE VÉRIFICATION TERMINÉS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Si tous les tests passent (✅), les améliorations sont correctement appliquées.';
  RAISE NOTICE 'Si des warnings apparaissent (⚠️), vérifiez les migrations correspondantes.';
  RAISE NOTICE '';
END $$;

