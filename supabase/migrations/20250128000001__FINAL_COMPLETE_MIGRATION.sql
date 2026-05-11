-- =====================================================
-- MIGRATION COMPLÈTE : Extension Table + Fonctions + Migration Données
-- Date: 28 Janvier 2025
-- Description: Script complet qui fait tout en une fois
-- =====================================================

-- =====================================================
-- PARTIE 1 : EXTENSION DE LA TABLE product_promotions
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '📋 Étape 1: Extension de la table product_promotions...';
  
  -- Colonnes pour le système simple (promotions)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_promotions' AND column_name = 'original_promotion_id') THEN
    ALTER TABLE public.product_promotions
    ADD COLUMN original_promotion_id UUID,
    ADD COLUMN original_digital_coupon_id UUID,
    ADD COLUMN migration_source TEXT,
    ADD COLUMN migration_note TEXT;
    
    RAISE NOTICE '✅ Colonnes de migration ajoutées (original_promotion_id, etc.)';
  ELSE
    RAISE NOTICE '⏭️ Colonnes de migration déjà présentes';
  END IF;

  -- Colonnes pour le système digital (digital_product_coupons)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_promotions' AND column_name = 'max_discount_amount') THEN
    ALTER TABLE public.product_promotions
    ADD COLUMN max_discount_amount NUMERIC,
    ADD COLUMN applicable_store_ids UUID[],
    ADD COLUMN first_time_buyers_only BOOLEAN DEFAULT FALSE,
    ADD COLUMN exclude_sale_items BOOLEAN DEFAULT FALSE,
    ADD COLUMN exclude_bundles BOOLEAN DEFAULT FALSE,
    ADD COLUMN is_platform_wide BOOLEAN DEFAULT FALSE,
    ADD COLUMN customer_eligibility TEXT DEFAULT 'all',
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    
    -- Ajouter la contrainte CHECK si elle n'existe pas
    BEGIN
      ALTER TABLE public.product_promotions
      ADD CONSTRAINT check_customer_eligibility 
      CHECK (customer_eligibility IN ('all', 'new_customers', 'existing_customers', 'vip'));
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- La contrainte existe déjà
    END;
    
    RAISE NOTICE '✅ Colonnes étendues ajoutées (max_discount_amount, etc.)';
  ELSE
    RAISE NOTICE '⏭️ Colonnes étendues déjà présentes';
  END IF;

  -- Colonnes pour les statistiques
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_promotions' AND column_name = 'total_discount_given') THEN
    ALTER TABLE public.product_promotions
    ADD COLUMN total_discount_given NUMERIC DEFAULT 0,
    ADD COLUMN total_orders INTEGER DEFAULT 0;
    
    RAISE NOTICE '✅ Colonnes de statistiques ajoutées';
  ELSE
    RAISE NOTICE '⏭️ Colonnes de statistiques déjà présentes';
  END IF;
END $$;

-- =====================================================
-- PARTIE 2 : CRÉER LES FONCTIONS DE MIGRATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 Étape 2: Création des fonctions de migration...';
END $$;

-- 2.1. Fonction de migration depuis promotions
CREATE OR REPLACE FUNCTION migrate_promotions_to_product_promotions()
RETURNS TABLE(
  migrated_count INTEGER,
  skipped_count INTEGER,
  errors TEXT[]
) AS $$
DECLARE
  promo_record RECORD;
  new_id UUID;
  error_msg TEXT;
  migrated INTEGER := 0;
  skipped INTEGER := 0;
  error_list TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOR promo_record IN 
    SELECT * FROM public.promotions
    WHERE NOT EXISTS (
      SELECT 1 FROM public.product_promotions 
      WHERE original_promotion_id = promotions.id
    )
  LOOP
    BEGIN
      DECLARE
        discount_type_value TEXT;
        name_value TEXT;
      BEGIN
        IF promo_record.discount_type = 'percentage' THEN
          discount_type_value := 'percentage';
        ELSIF promo_record.discount_type = 'fixed' THEN
          discount_type_value := 'fixed_amount';
        ELSE
          discount_type_value := 'percentage';
        END IF;

        name_value := COALESCE(promo_record.description, 'Promotion ' || COALESCE(promo_record.code, ''));

        INSERT INTO public.product_promotions (
          store_id, name, description, code, discount_type, discount_value,
          applies_to, product_ids, min_purchase_amount, max_uses,
          max_uses_per_customer, current_uses, starts_at, ends_at,
          is_active, is_automatic, original_promotion_id, migration_source,
          migration_note, created_at, updated_at
        ) VALUES (
          promo_record.store_id, name_value, promo_record.description,
          promo_record.code, discount_type_value, promo_record.discount_value,
          CASE 
            WHEN promo_record.applicable_to_product_ids IS NOT NULL 
                 AND array_length(promo_record.applicable_to_product_ids, 1) > 0 
            THEN 'specific_products'
            ELSE 'all_products'
          END,
          promo_record.applicable_to_product_ids, promo_record.min_purchase_amount,
          promo_record.max_uses, promo_record.max_uses_per_user,
          COALESCE(promo_record.used_count, 0), COALESCE(promo_record.start_date, NOW()),
          promo_record.end_date, COALESCE(promo_record.is_active, TRUE), FALSE,
          promo_record.id, 'promotions',
          'Migré depuis la table promotions le ' || NOW()::TEXT,
          COALESCE(promo_record.created_at, NOW()), COALESCE(promo_record.updated_at, NOW())
        ) RETURNING id INTO new_id;

        migrated := migrated + 1;
      EXCEPTION WHEN OTHERS THEN
        error_msg := 'Erreur: ' || SQLERRM;
        error_list := array_append(error_list, error_msg);
        skipped := skipped + 1;
      END;
    END;
  END LOOP;

  RETURN QUERY SELECT migrated, skipped, error_list;
END;
$$ LANGUAGE plpgsql;

-- 2.2. Fonction de migration depuis digital_product_coupons
CREATE OR REPLACE FUNCTION migrate_digital_coupons_to_product_promotions()
RETURNS TABLE(
  migrated_count INTEGER,
  skipped_count INTEGER,
  errors TEXT[]
) AS $$
DECLARE
  coupon_record RECORD;
  new_id UUID;
  error_msg TEXT;
  migrated INTEGER := 0;
  skipped INTEGER := 0;
  error_list TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOR coupon_record IN 
    SELECT * FROM public.digital_product_coupons
    WHERE NOT EXISTS (
      SELECT 1 FROM public.product_promotions 
      WHERE original_digital_coupon_id = digital_product_coupons.id
    )
    AND (is_archived = FALSE OR is_archived IS NULL)
  LOOP
    BEGIN
      DECLARE
        applies_to_value TEXT;
      BEGIN
        IF coupon_record.applicable_product_ids IS NOT NULL 
           AND array_length(coupon_record.applicable_product_ids, 1) > 0 THEN
          applies_to_value := 'specific_products';
        ELSE
          applies_to_value := 'all_products';
        END IF;

        INSERT INTO public.product_promotions (
          store_id, name, description, code, discount_type, discount_value,
          applies_to, product_ids, min_purchase_amount, max_uses,
          max_uses_per_customer, current_uses, starts_at, ends_at,
          is_active, is_automatic, original_digital_coupon_id, migration_source,
          migration_note, max_discount_amount, applicable_store_ids,
          first_time_buyers_only, exclude_sale_items, exclude_bundles,
          metadata, total_discount_given, total_orders, created_at, updated_at
        ) VALUES (
          coupon_record.store_id, coupon_record.name, coupon_record.description,
          coupon_record.code,
          CASE WHEN coupon_record.discount_type = 'fixed' THEN 'fixed_amount' ELSE coupon_record.discount_type END,
          coupon_record.discount_value, applies_to_value, coupon_record.applicable_product_ids,
          coupon_record.min_purchase_amount, coupon_record.usage_limit,
          coupon_record.usage_limit_per_customer, COALESCE(coupon_record.usage_count, 0),
          COALESCE(coupon_record.valid_from, NOW()), coupon_record.valid_until,
          COALESCE(coupon_record.is_active, TRUE), FALSE, coupon_record.id,
          'digital_product_coupons', 'Migré depuis digital_product_coupons le ' || NOW()::TEXT,
          coupon_record.max_discount_amount, coupon_record.applicable_store_ids,
          COALESCE(coupon_record.first_time_buyers_only, FALSE),
          COALESCE(coupon_record.exclude_sale_items, FALSE),
          COALESCE(coupon_record.exclude_bundles, FALSE),
          COALESCE(coupon_record.metadata, '{}'::jsonb),
          COALESCE(coupon_record.total_discount_given, 0),
          COALESCE(coupon_record.total_orders, 0),
          COALESCE(coupon_record.created_at, NOW()), COALESCE(coupon_record.updated_at, NOW())
        ) RETURNING id INTO new_id;

        migrated := migrated + 1;
      EXCEPTION WHEN OTHERS THEN
        error_msg := 'Erreur: ' || SQLERRM;
        error_list := array_append(error_list, error_msg);
        skipped := skipped + 1;
      END;
    END;
  END LOOP;

  RETURN QUERY SELECT migrated, skipped, error_list;
END;
$$ LANGUAGE plpgsql;

-- 2.3. Fonction de migration des utilisations
CREATE OR REPLACE FUNCTION migrate_coupon_usages_to_promotion_usage()
RETURNS INTEGER AS $$
DECLARE
  usage_record RECORD;
  migrated_count INTEGER := 0;
BEGIN
  -- Vérifier que la table promotion_usage existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promotion_usage') THEN
    FOR usage_record IN 
      SELECT cu.*, pp.id as new_promotion_id
      FROM public.coupon_usages cu
      INNER JOIN public.promotions p ON cu.promotion_id = p.id
      INNER JOIN public.product_promotions pp ON pp.original_promotion_id = p.id
      WHERE NOT EXISTS (
        SELECT 1 FROM public.promotion_usage pu
        WHERE pu.promotion_id = pp.id AND pu.order_id = cu.order_id
      )
    LOOP
      BEGIN
        INSERT INTO public.promotion_usage (
          promotion_id, order_id, user_id, customer_id,
          discount_amount, order_total_before_discount,
          order_total_after_discount, used_at
        ) VALUES (
          usage_record.new_promotion_id, usage_record.order_id,
          usage_record.user_id, NULL,
          COALESCE(usage_record.discount_amount, 0),
          COALESCE(usage_record.original_amount, 0),
          COALESCE(usage_record.final_amount, 0),
          COALESCE(usage_record.used_at, NOW())
        ) ON CONFLICT DO NOTHING;
        
        migrated_count := migrated_count + 1;
      EXCEPTION WHEN OTHERS THEN
        CONTINUE;
      END;
    END LOOP;
  END IF;

  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Fonctions de migration créées';
END $$;

-- =====================================================
-- PARTIE 3 : EXÉCUTER LA MIGRATION DES DONNÉES
-- =====================================================

DO $$
DECLARE
  v_result RECORD;
  v_promotions_count INTEGER;
  v_digital_coupons_count INTEGER;
  v_product_promotions_count INTEGER;
  v_migrated_from_promotions INTEGER;
  v_migrated_from_digital INTEGER;
  v_migrated_usages INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 Étape 3: Migration des données...';
  
  -- État initial
  SELECT COUNT(*) INTO v_promotions_count FROM public.promotions;
  SELECT COUNT(*) INTO v_digital_coupons_count FROM public.digital_product_coupons WHERE COALESCE(is_archived, FALSE) = FALSE;
  SELECT COUNT(*) INTO v_product_promotions_count FROM public.product_promotions;
  
  RAISE NOTICE '📊 État initial:';
  RAISE NOTICE '   - Promotions: %', v_promotions_count;
  RAISE NOTICE '   - Digital coupons: %', v_digital_coupons_count;
  RAISE NOTICE '   - Product promotions: %', v_product_promotions_count;
  RAISE NOTICE '';
  
  -- Migration depuis promotions
  IF v_promotions_count > 0 THEN
    RAISE NOTICE '🔄 Migration depuis promotions...';
    SELECT * INTO v_result FROM migrate_promotions_to_product_promotions();
    RAISE NOTICE '✅ Migrées: %, Ignorées: %', v_result.migrated_count, v_result.skipped_count;
    IF array_length(v_result.errors, 1) > 0 THEN
      RAISE WARNING '⚠️ Erreurs: %', array_length(v_result.errors, 1);
    END IF;
  ELSE
    RAISE NOTICE '⏭️ Aucune promotion à migrer.';
  END IF;
  
  -- Migration depuis digital_product_coupons
  IF v_digital_coupons_count > 0 THEN
    RAISE NOTICE '🔄 Migration depuis digital_product_coupons...';
    SELECT * INTO v_result FROM migrate_digital_coupons_to_product_promotions();
    RAISE NOTICE '✅ Migrées: %, Ignorées: %', v_result.migrated_count, v_result.skipped_count;
    IF array_length(v_result.errors, 1) > 0 THEN
      RAISE WARNING '⚠️ Erreurs: %', array_length(v_result.errors, 1);
    END IF;
  ELSE
    RAISE NOTICE '⏭️ Aucun coupon digital à migrer.';
  END IF;
  
  -- Migration des utilisations
  RAISE NOTICE '🔄 Migration des utilisations...';
  SELECT migrate_coupon_usages_to_promotion_usage() INTO v_migrated_usages;
  RAISE NOTICE '✅ Utilisations migrées: %', v_migrated_usages;
  
  -- État final
  SELECT COUNT(*) INTO v_product_promotions_count FROM public.product_promotions;
  SELECT COUNT(*) INTO v_migrated_from_promotions FROM public.product_promotions WHERE migration_source = 'promotions';
  SELECT COUNT(*) INTO v_migrated_from_digital FROM public.product_promotions WHERE migration_source = 'digital_product_coupons';
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 État final:';
  RAISE NOTICE '   - Total product_promotions: %', v_product_promotions_count;
  RAISE NOTICE '   - Migrées depuis promotions: %', v_migrated_from_promotions;
  RAISE NOTICE '   - Migrées depuis digital_product_coupons: %', v_migrated_from_digital;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration complète terminée avec succès!';
END $$;

