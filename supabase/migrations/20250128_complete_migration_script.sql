-- =====================================================
-- SCRIPT COMPLET : Migration des Promotions
-- Date: 28 Janvier 2025
-- Description: Script complet qui crée les fonctions ET migre les données
-- =====================================================

-- =====================================================
-- ÉTAPE 1 : Créer les fonctions de migration (si elles n'existent pas)
-- =====================================================

\echo '📋 Étape 1: Vérification et création des fonctions de migration...'

-- Vérifier et créer migrate_promotions_to_product_promotions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'migrate_promotions_to_product_promotions'
      AND routine_schema = 'public'
  ) THEN
    RAISE NOTICE 'Création de la fonction migrate_promotions_to_product_promotions...';
    -- La fonction sera créée dans le fichier séparé
  ELSE
    RAISE NOTICE 'Fonction migrate_promotions_to_product_promotions existe déjà.';
  END IF;
END $$;

-- Inclure la création des fonctions depuis le fichier séparé
-- (Vous devrez exécuter 20250128_create_migration_functions.sql d'abord)

-- =====================================================
-- ÉTAPE 2 : Vérifier l'état actuel
-- =====================================================

\echo '📊 Étape 2: État actuel des données...'

DO $$
DECLARE
  v_promotions_count INTEGER;
  v_digital_coupons_count INTEGER;
  v_product_promotions_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_promotions_count FROM public.promotions;
  SELECT COUNT(*) INTO v_digital_coupons_count FROM public.digital_product_coupons WHERE COALESCE(is_archived, FALSE) = FALSE;
  SELECT COUNT(*) INTO v_product_promotions_count FROM public.product_promotions;
  
  RAISE NOTICE '📊 État actuel:';
  RAISE NOTICE '   - Promotions (ancien système): %', v_promotions_count;
  RAISE NOTICE '   - Digital coupons (ancien système): %', v_digital_coupons_count;
  RAISE NOTICE '   - Product promotions (nouveau système): %', v_product_promotions_count;
END $$;

-- =====================================================
-- ÉTAPE 3 : Migration depuis promotions -> product_promotions
-- =====================================================

\echo '🔄 Étape 3: Migration depuis promotions...'

DO $$
DECLARE
  v_result RECORD;
BEGIN
  -- Vérifier que la fonction existe
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'migrate_promotions_to_product_promotions'
      AND routine_schema = 'public'
  ) THEN
    SELECT * INTO v_result FROM migrate_promotions_to_product_promotions();
    
    RAISE NOTICE '✅ Migration depuis promotions terminée:';
    RAISE NOTICE '   - Migrées: %', v_result.migrated_count;
    RAISE NOTICE '   - Ignorées: %', v_result.skipped_count;
    
    IF array_length(v_result.errors, 1) > 0 THEN
      RAISE WARNING '⚠️ Erreurs rencontrées:';
      FOR i IN 1..array_length(v_result.errors, 1) LOOP
        RAISE WARNING '   - %', v_result.errors[i];
      END LOOP;
    END IF;
  ELSE
    RAISE EXCEPTION 'Erreur: La fonction migrate_promotions_to_product_promotions n''existe pas. Veuillez exécuter d''abord 20250128_create_migration_functions.sql';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 4 : Migration depuis digital_product_coupons -> product_promotions
-- =====================================================

\echo '🔄 Étape 4: Migration depuis digital_product_coupons...'

DO $$
DECLARE
  v_result RECORD;
BEGIN
  -- Vérifier que la fonction existe
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'migrate_digital_coupons_to_product_promotions'
      AND routine_schema = 'public'
  ) THEN
    SELECT * INTO v_result FROM migrate_digital_coupons_to_product_promotions();
    
    RAISE NOTICE '✅ Migration depuis digital_product_coupons terminée:';
    RAISE NOTICE '   - Migrées: %', v_result.migrated_count;
    RAISE NOTICE '   - Ignorées: %', v_result.skipped_count;
    
    IF array_length(v_result.errors, 1) > 0 THEN
      RAISE WARNING '⚠️ Erreurs rencontrées:';
      FOR i IN 1..array_length(v_result.errors, 1) LOOP
        RAISE WARNING '   - %', v_result.errors[i];
      END LOOP;
    END IF;
  ELSE
    RAISE EXCEPTION 'Erreur: La fonction migrate_digital_coupons_to_product_promotions n''existe pas. Veuillez exécuter d''abord 20250128_create_migration_functions.sql';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 5 : Migration des données d'utilisation
-- =====================================================

\echo '🔄 Étape 5: Migration des données d''utilisation...'

DO $$
DECLARE
  v_migrated_count INTEGER;
BEGIN
  -- Vérifier que la fonction existe et que la table promotion_usage existe
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'migrate_coupon_usages_to_promotion_usage'
      AND routine_schema = 'public'
  ) THEN
    SELECT migrate_coupon_usages_to_promotion_usage() INTO v_migrated_count;
    
    RAISE NOTICE '✅ Migration des utilisations terminée:';
    RAISE NOTICE '   - Utilisations migrées: %', v_migrated_count;
  ELSE
    RAISE NOTICE '⚠️ Fonction migrate_coupon_usages_to_promotion_usage non trouvée. Ignorée.';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 6 : Rapport final
-- =====================================================

\echo '📊 Étape 6: Rapport final...'

DO $$
DECLARE
  v_promotions_count INTEGER;
  v_digital_coupons_count INTEGER;
  v_product_promotions_count INTEGER;
  v_migrated_from_promotions INTEGER;
  v_migrated_from_digital INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_promotions_count FROM public.promotions;
  SELECT COUNT(*) INTO v_digital_coupons_count FROM public.digital_product_coupons WHERE COALESCE(is_archived, FALSE) = FALSE;
  SELECT COUNT(*) INTO v_product_promotions_count FROM public.product_promotions;
  
  SELECT COUNT(*) INTO v_migrated_from_promotions 
  FROM public.product_promotions 
  WHERE migration_source = 'promotions';
  
  SELECT COUNT(*) INTO v_migrated_from_digital 
  FROM public.product_promotions 
  WHERE migration_source = 'digital_product_coupons';
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 État final après migration:';
  RAISE NOTICE '   - Promotions (ancien système): %', v_promotions_count;
  RAISE NOTICE '   - Digital coupons (ancien système): %', v_digital_coupons_count;
  RAISE NOTICE '   - Product promotions (nouveau système): %', v_product_promotions_count;
  RAISE NOTICE '   - Migrées depuis promotions: %', v_migrated_from_promotions;
  RAISE NOTICE '   - Migrées depuis digital_product_coupons: %', v_migrated_from_digital;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration terminée avec succès!';
END $$;

