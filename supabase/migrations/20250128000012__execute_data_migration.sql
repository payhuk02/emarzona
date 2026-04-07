-- =====================================================
-- EXECUTION : Migration des Données vers product_promotions
-- Date: 28 Janvier 2025
-- Description: Script pour exécuter la migration des données depuis les anciens systèmes
-- =====================================================

-- =====================================================
-- PRÉPARATION : Vérifications préalables
-- =====================================================

DO $$
DECLARE
  v_promotions_count INTEGER;
  v_digital_coupons_count INTEGER;
  v_product_promotions_count INTEGER;
BEGIN
  -- Compter les enregistrements dans chaque table
  SELECT COUNT(*) INTO v_promotions_count FROM public.promotions;
  SELECT COUNT(*) INTO v_digital_coupons_count FROM public.digital_product_coupons WHERE is_archived = FALSE;
  SELECT COUNT(*) INTO v_product_promotions_count FROM public.product_promotions;
  
  RAISE NOTICE '📊 État actuel:';
  RAISE NOTICE '   - Promotions (ancien système): %', v_promotions_count;
  RAISE NOTICE '   - Digital coupons (ancien système): %', v_digital_coupons_count;
  RAISE NOTICE '   - Product promotions (nouveau système): %', v_product_promotions_count;
END $$;

-- =====================================================
-- ÉTAPE 1 : Migration depuis promotions -> product_promotions
-- =====================================================

DO $$
DECLARE
  v_result RECORD;
BEGIN
  RAISE NOTICE '🔄 Début de la migration depuis promotions...';
  
  -- Exécuter la fonction de migration
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
END $$;

-- =====================================================
-- ÉTAPE 2 : Migration depuis digital_product_coupons -> product_promotions
-- =====================================================

DO $$
DECLARE
  v_result RECORD;
BEGIN
  RAISE NOTICE '🔄 Début de la migration depuis digital_product_coupons...';
  
  -- Exécuter la fonction de migration
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
END $$;

-- =====================================================
-- ÉTAPE 3 : Migration des données d'utilisation
-- =====================================================

DO $$
DECLARE
  v_migrated_count INTEGER;
BEGIN
  RAISE NOTICE '🔄 Début de la migration des données d''utilisation...';
  
  -- Exécuter la fonction de migration des utilisations
  SELECT migrate_coupon_usages_to_promotion_usage() INTO v_migrated_count;
  
  RAISE NOTICE '✅ Migration des utilisations terminée:';
  RAISE NOTICE '   - Utilisations migrées: %', v_migrated_count;
END $$;

-- =====================================================
-- VÉRIFICATION : État final
-- =====================================================

DO $$
DECLARE
  v_promotions_count INTEGER;
  v_digital_coupons_count INTEGER;
  v_product_promotions_count INTEGER;
  v_migrated_from_promotions INTEGER;
  v_migrated_from_digital INTEGER;
BEGIN
  -- Compter les enregistrements
  SELECT COUNT(*) INTO v_promotions_count FROM public.promotions;
  SELECT COUNT(*) INTO v_digital_coupons_count FROM public.digital_product_coupons WHERE is_archived = FALSE;
  SELECT COUNT(*) INTO v_product_promotions_count FROM public.product_promotions;
  
  -- Compter les migrations
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

-- =====================================================
-- REQUÊTES DE VÉRIFICATION (optionnelles)
-- =====================================================

-- Voir les promotions migrées depuis promotions
-- SELECT 
--   id,
--   name,
--   code,
--   migration_source,
--   original_promotion_id,
--   created_at
-- FROM public.product_promotions
-- WHERE migration_source = 'promotions'
-- ORDER BY created_at DESC;

-- Voir les promotions migrées depuis digital_product_coupons
-- SELECT 
--   id,
--   name,
--   code,
--   migration_source,
--   original_digital_coupon_id,
--   created_at
-- FROM public.product_promotions
-- WHERE migration_source = 'digital_product_coupons'
-- ORDER BY created_at DESC;

-- Voir toutes les promotions (y compris celles créées directement)
-- SELECT 
--   id,
--   name,
--   code,
--   migration_source,
--   is_active,
--   created_at
-- FROM public.product_promotions
-- ORDER BY created_at DESC;

