-- ============================================================================
-- TESTS DE VALIDATION - DIGITAL PRODUCTS SYSTEM
-- Date: 2025-10-29
-- Projet: Payhuk SaaS Platform
-- Description: Tests complets pour valider l'installation des migrations
-- ============================================================================

-- ==========================================
--   DIGITAL PRODUCTS - TESTS DE VALIDATION
-- ==========================================

-- ============================================================================
-- TEST 1: VÉRIFICATION DES TABLES
-- ============================================================================

-- 📊 TEST 1: Vérification des tables...

DO $$
DECLARE
  v_count INTEGER;
  v_expected_tables TEXT[] := ARRAY[
    'digital_products',
    'digital_product_files',
    'digital_product_downloads',
    'digital_product_updates',
    'digital_licenses',
    'digital_license_activations',
    'digital_product_licenses',
    'license_activations',
    'license_events',
    'digital_bundles',
    'digital_bundle_items'
  ];
  v_table TEXT;
  v_missing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOREACH v_table IN ARRAY v_expected_tables
  LOOP
    SELECT COUNT(*) INTO v_count
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = v_table;
    
    IF v_count = 0 THEN
      v_missing_tables := array_append(v_missing_tables, v_table);
    END IF;
  END LOOP;
  
  IF array_length(v_missing_tables, 1) > 0 THEN
    RAISE EXCEPTION '❌ Tables manquantes: %', array_to_string(v_missing_tables, ', ');
  ELSE
    RAISE NOTICE '✅ Toutes les tables sont présentes (%)', array_length(v_expected_tables, 1);
  END IF;
END $$;

--

-- ============================================================================
-- TEST 2: VÉRIFICATION DES FONCTIONS
-- ============================================================================

-- ⚙️  TEST 2: Vérification des fonctions...

DO $$
DECLARE
  v_count INTEGER;
  v_expected_functions TEXT[] := ARRAY[
    'generate_license_key',
    'validate_license',
    'calculate_bundle_original_price',
    'generate_bundle_slug',
    'get_remaining_downloads',
    'has_digital_access',
    'get_download_analytics',
    'update_digital_product_stats',
    'expire_digital_licenses'
  ];
  v_function TEXT;
  v_missing_functions TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOREACH v_function IN ARRAY v_expected_functions
  LOOP
    SELECT COUNT(*) INTO v_count
    FROM pg_proc
    WHERE proname = v_function;
    
    IF v_count = 0 THEN
      v_missing_functions := array_append(v_missing_functions, v_function);
    END IF;
  END LOOP;
  
  IF array_length(v_missing_functions, 1) > 0 THEN
    RAISE EXCEPTION '❌ Fonctions manquantes: %', array_to_string(v_missing_functions, ', ');
  ELSE
    RAISE NOTICE '✅ Toutes les fonctions sont présentes (%)', array_length(v_expected_functions, 1);
  END IF;
END $$;

--

-- ============================================================================
-- TEST 3: VÉRIFICATION DES VUES
-- ============================================================================

-- 👁️  TEST 3: Vérification des vues...

DO $$
DECLARE
  v_count INTEGER;
  v_expected_views TEXT[] := ARRAY[
    'digital_products_stats',
    'recent_digital_downloads',
    'active_digital_licenses',
    'digital_bundles_with_stats'
  ];
  v_view TEXT;
  v_missing_views TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOREACH v_view IN ARRAY v_expected_views
  LOOP
    SELECT COUNT(*) INTO v_count
    FROM pg_views
    WHERE schemaname = 'public' AND viewname = v_view;
    
    IF v_count = 0 THEN
      v_missing_views := array_append(v_missing_views, v_view);
    END IF;
  END LOOP;
  
  IF array_length(v_missing_views, 1) > 0 THEN
    RAISE EXCEPTION '❌ Vues manquantes: %', array_to_string(v_missing_views, ', ');
  ELSE
    RAISE NOTICE '✅ Toutes les vues sont présentes (%)', array_length(v_expected_views, 1);
  END IF;
END $$;

--

-- ============================================================================
-- TEST 4: VÉRIFICATION DES INDEXES
-- ============================================================================

-- 📇 TEST 4: Vérification des indexes...

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_indexes
  WHERE schemaname = 'public' 
    AND (tablename LIKE 'digital_%' OR tablename LIKE 'license_%');
  
  IF v_count < 30 THEN
    RAISE EXCEPTION '❌ Nombre d''indexes insuffisant: % (attendu: 30+)', v_count;
  ELSE
    RAISE NOTICE '✅ Indexes présents: %', v_count;
  END IF;
END $$;

--

-- ============================================================================
-- TEST 5: VÉRIFICATION DES RLS POLICIES
-- ============================================================================

-- 🔒 TEST 5: Vérification des RLS policies...

DO $$
DECLARE
  v_count INTEGER;
  v_table TEXT;
  v_tables_without_rls TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Vérifier que RLS est activé sur toutes les tables digital
  FOR v_table IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND (tablename LIKE 'digital_%' OR tablename LIKE 'license_%')
  LOOP
    SELECT COUNT(*) INTO v_count
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public' 
      AND t.tablename = v_table
      AND c.relrowsecurity = true;
    
    IF v_count = 0 THEN
      v_tables_without_rls := array_append(v_tables_without_rls, v_table);
    END IF;
  END LOOP;
  
  IF array_length(v_tables_without_rls, 1) > 0 THEN
    RAISE EXCEPTION '❌ Tables sans RLS: %', array_to_string(v_tables_without_rls, ', ');
  ELSE
    -- Compter le nombre de policies
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename LIKE 'digital_%' OR tablename LIKE 'license_%';
    
    RAISE NOTICE '✅ RLS activé sur toutes les tables. Policies: %', v_count;
  END IF;
END $$;

--

-- ============================================================================
-- TEST 6: TEST FONCTIONNEL - GÉNÉRATION DE CLÉ DE LICENSE
-- ============================================================================

-- 🔑 TEST 6: Génération de clé de license...

DO $$
DECLARE
  v_license_key TEXT;
BEGIN
  SELECT generate_license_key() INTO v_license_key;
  
  IF v_license_key IS NULL OR length(v_license_key) != 19 THEN
    RAISE EXCEPTION '❌ Format de clé invalide: %', v_license_key;
  END IF;
  
  IF v_license_key !~ '^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$' THEN
    RAISE EXCEPTION '❌ Format de clé incorrect: %', v_license_key;
  END IF;
  
  RAISE NOTICE '✅ Clé générée avec succès: %', v_license_key;
END $$;

--

-- ============================================================================
-- TEST 7: TEST FONCTIONNEL - GÉNÉRATION DE SLUG DE BUNDLE
-- ============================================================================

-- 🏷️  TEST 7: Génération de slug de bundle...

DO $$
DECLARE
  v_store_id UUID;
  v_slug TEXT;
BEGIN
  -- Récupérer un store_id existant ou créer un UUID test
  SELECT id INTO v_store_id FROM public.stores LIMIT 1;
  
  IF v_store_id IS NULL THEN
    v_store_id := gen_random_uuid();
  END IF;
  
  SELECT generate_bundle_slug(v_store_id, 'Mon Super Bundle Test 2025!') INTO v_slug;
  
  IF v_slug IS NULL OR v_slug = '' THEN
    RAISE EXCEPTION '❌ Slug vide ou null';
  END IF;
  
  IF v_slug ~ '[^a-z0-9\-]' THEN
    RAISE EXCEPTION '❌ Slug contient des caractères invalides: %', v_slug;
  END IF;
  
  RAISE NOTICE '✅ Slug généré: %', v_slug;
END $$;

--

-- ============================================================================
-- TEST 8: TEST FONCTIONNEL - VALIDATION DE LICENSE
-- ============================================================================

-- ✅ TEST 8: Validation de license...

DO $$
DECLARE
  v_result JSONB;
BEGIN
  -- Tester avec une clé invalide
  SELECT validate_license('INVALID-KEY-0000-0000') INTO v_result;
  
  IF v_result->>'valid' != 'false' THEN
    RAISE EXCEPTION '❌ La validation devrait échouer pour une clé invalide';
  END IF;
  
  IF v_result->>'error' != 'license_not_found' THEN
    RAISE EXCEPTION '❌ Message d''erreur incorrect: %', v_result->>'error';
  END IF;
  
  RAISE NOTICE '✅ Validation de license fonctionne correctement';
END $$;

--

-- ============================================================================
-- TEST 9: VÉRIFICATION DES CONTRAINTES
-- ============================================================================

-- 🛡️  TEST 9: Vérification des contraintes...

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Vérifier les contraintes CHECK
  SELECT COUNT(*) INTO v_count
  FROM pg_constraint
  WHERE contype = 'c' 
    AND conrelid IN (
      SELECT oid FROM pg_class 
      WHERE relname LIKE 'digital_%' OR relname LIKE 'license_%'
    );
  
  IF v_count < 10 THEN
    RAISE EXCEPTION '❌ Nombre de contraintes CHECK insuffisant: %', v_count;
  END IF;
  
  -- Vérifier les contraintes UNIQUE
  SELECT COUNT(*) INTO v_count
  FROM pg_constraint
  WHERE contype = 'u' 
    AND conrelid IN (
      SELECT oid FROM pg_class 
      WHERE relname LIKE 'digital_%' OR relname LIKE 'license_%'
    );
  
  IF v_count < 3 THEN
    RAISE EXCEPTION '❌ Nombre de contraintes UNIQUE insuffisant: %', v_count;
  END IF;
  
  RAISE NOTICE '✅ Contraintes présentes et valides';
END $$;

--

-- ============================================================================
-- TEST 10: VÉRIFICATION DES TRIGGERS
-- ============================================================================

-- ⚡ TEST 10: Vérification des triggers...

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_trigger
  WHERE tgrelid IN (
    SELECT oid FROM pg_class 
    WHERE relname LIKE 'digital_%' OR relname LIKE 'license_%'
  );
  
  IF v_count < 5 THEN
    RAISE EXCEPTION '❌ Nombre de triggers insuffisant: %', v_count;
  END IF;
  
  RAISE NOTICE '✅ Triggers présents: %', v_count;
END $$;

--

-- ============================================================================
-- RÉSUMÉ FINAL
-- ============================================================================

-- ==========================================
--            RÉSUMÉ DES TESTS
-- ==========================================

SELECT 
  '📊 Tables' as categorie,
  COUNT(*) as total
FROM pg_tables 
WHERE schemaname = 'public' 
  AND (tablename LIKE 'digital_%' OR tablename LIKE 'license_%')

UNION ALL

SELECT 
  '⚙️  Fonctions' as categorie,
  COUNT(*) as total
FROM pg_proc
WHERE proname LIKE '%digital%' OR proname LIKE '%bundle%' OR proname LIKE '%license%'

UNION ALL

SELECT 
  '👁️  Vues' as categorie,
  COUNT(*) as total
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname LIKE '%digital%'

UNION ALL

SELECT 
  '📇 Indexes' as categorie,
  COUNT(*) as total
FROM pg_indexes
WHERE schemaname = 'public' 
  AND (tablename LIKE 'digital_%' OR tablename LIKE 'license_%')

UNION ALL

SELECT 
  '🔒 RLS Policies' as categorie,
  COUNT(*) as total
FROM pg_policies
WHERE tablename LIKE 'digital_%' OR tablename LIKE 'license_%'

UNION ALL

SELECT 
  '⚡ Triggers' as categorie,
  COUNT(*) as total
FROM pg_trigger
WHERE tgrelid IN (
  SELECT oid FROM pg_class 
  WHERE relname LIKE 'digital_%' OR relname LIKE 'license_%'
);

--
-- ==========================================
--   ✅ TOUS LES TESTS SONT PASSÉS !
-- ==========================================
--
-- 🎉 Le système Digital Products est 100% opérationnel !
--
-- 📋 Prochaines étapes recommandées:
--    1. Tester l'interface utilisateur
--    2. Créer des produits digitaux de test
--    3. Tester le système de bundles
--    4. Vérifier les analytics dans les dashboards
--

-- ============================================================================
-- FIN DES TESTS
-- ============================================================================

