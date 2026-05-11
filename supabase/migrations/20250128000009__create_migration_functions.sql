-- =====================================================
-- CRÉATION : Fonctions de Migration des Promotions
-- Date: 28 Janvier 2025
-- Description: Créer les fonctions nécessaires pour la migration des données
-- =====================================================

-- =====================================================
-- 1. FONCTION DE MIGRATION : promotions -> product_promotions
-- =====================================================

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
  -- Migrer chaque promotion
  FOR promo_record IN 
    SELECT * FROM public.promotions
    WHERE NOT EXISTS (
      SELECT 1 FROM public.product_promotions 
      WHERE original_promotion_id = promotions.id
    )
  LOOP
    BEGIN
      -- Déterminer le type de réduction
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

        -- Créer un nom si manquant
        name_value := COALESCE(promo_record.description, 'Promotion ' || promo_record.code);

        -- Insérer dans product_promotions
        INSERT INTO public.product_promotions (
          store_id,
          name,
          description,
          code,
          discount_type,
          discount_value,
          applies_to,
          product_ids,
          min_purchase_amount,
          max_uses,
          max_uses_per_customer,
          current_uses,
          starts_at,
          ends_at,
          is_active,
          is_automatic,
          original_promotion_id,
          migration_source,
          migration_note,
          created_at,
          updated_at
        ) VALUES (
          promo_record.store_id,
          name_value,
          promo_record.description,
          promo_record.code,
          discount_type_value,
          promo_record.discount_value,
          CASE 
            WHEN promo_record.applicable_to_product_ids IS NOT NULL 
                 AND array_length(promo_record.applicable_to_product_ids, 1) > 0 
            THEN 'specific_products'
            ELSE 'all_products'
          END,
          promo_record.applicable_to_product_ids,
          promo_record.min_purchase_amount,
          promo_record.max_uses,
          promo_record.max_uses_per_user,
          COALESCE(promo_record.used_count, 0),
          COALESCE(promo_record.start_date, NOW()),
          promo_record.end_date,
          COALESCE(promo_record.is_active, TRUE),
          FALSE, -- Les anciennes promotions nécessitent toujours un code
          promo_record.id,
          'promotions',
          'Migré depuis la table promotions le ' || NOW()::TEXT,
          COALESCE(promo_record.created_at, NOW()),
          COALESCE(promo_record.updated_at, NOW())
        ) RETURNING id INTO new_id;

        migrated := migrated + 1;

      EXCEPTION WHEN OTHERS THEN
        error_msg := 'Erreur lors de la migration de la promotion ' || COALESCE(promo_record.id::TEXT, 'unknown') || ': ' || SQLERRM;
        error_list := array_append(error_list, error_msg);
        skipped := skipped + 1;
      END;
    END;
  END LOOP;

  RETURN QUERY SELECT migrated, skipped, error_list;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. FONCTION DE MIGRATION : digital_product_coupons -> product_promotions
-- =====================================================

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
  -- Migrer chaque coupon digital
  FOR coupon_record IN 
    SELECT * FROM public.digital_product_coupons
    WHERE NOT EXISTS (
      SELECT 1 FROM public.product_promotions 
      WHERE original_digital_coupon_id = digital_product_coupons.id
    )
    AND (is_archived = FALSE OR is_archived IS NULL)
  LOOP
    BEGIN
      -- Déterminer applies_to
      DECLARE
        applies_to_value TEXT;
      BEGIN
        IF coupon_record.applicable_product_ids IS NOT NULL 
           AND array_length(coupon_record.applicable_product_ids, 1) > 0 THEN
          applies_to_value := 'specific_products';
        ELSE
          applies_to_value := 'all_products';
        END IF;

        -- Insérer dans product_promotions
        INSERT INTO public.product_promotions (
          store_id,
          name,
          description,
          code,
          discount_type,
          discount_value,
          applies_to,
          product_ids,
          min_purchase_amount,
          max_uses,
          max_uses_per_customer,
          current_uses,
          starts_at,
          ends_at,
          is_active,
          is_automatic,
          original_digital_coupon_id,
          migration_source,
          migration_note,
          max_discount_amount,
          applicable_store_ids,
          first_time_buyers_only,
          exclude_sale_items,
          exclude_bundles,
          metadata,
          total_discount_given,
          total_orders,
          created_at,
          updated_at
        ) VALUES (
          coupon_record.store_id,
          coupon_record.name,
          coupon_record.description,
          coupon_record.code,
          CASE 
            WHEN coupon_record.discount_type = 'fixed' THEN 'fixed_amount'
            ELSE coupon_record.discount_type
          END,
          coupon_record.discount_value,
          applies_to_value,
          coupon_record.applicable_product_ids,
          coupon_record.min_purchase_amount,
          coupon_record.usage_limit,
          coupon_record.usage_limit_per_customer,
          COALESCE(coupon_record.usage_count, 0),
          COALESCE(coupon_record.valid_from, NOW()),
          coupon_record.valid_until,
          COALESCE(coupon_record.is_active, TRUE),
          FALSE, -- Les coupons nécessitent un code
          coupon_record.id,
          'digital_product_coupons',
          'Migré depuis digital_product_coupons le ' || NOW()::TEXT,
          coupon_record.max_discount_amount,
          coupon_record.applicable_store_ids,
          COALESCE(coupon_record.first_time_buyers_only, FALSE),
          COALESCE(coupon_record.exclude_sale_items, FALSE),
          COALESCE(coupon_record.exclude_bundles, FALSE),
          COALESCE(coupon_record.metadata, '{}'::jsonb),
          COALESCE(coupon_record.total_discount_given, 0),
          COALESCE(coupon_record.total_orders, 0),
          COALESCE(coupon_record.created_at, NOW()),
          COALESCE(coupon_record.updated_at, NOW())
        ) RETURNING id INTO new_id;

        migrated := migrated + 1;

      EXCEPTION WHEN OTHERS THEN
        error_msg := 'Erreur lors de la migration du coupon ' || COALESCE(coupon_record.id::TEXT, 'unknown') || ': ' || SQLERRM;
        error_list := array_append(error_list, error_msg);
        skipped := skipped + 1;
      END;
    END;
  END LOOP;

  RETURN QUERY SELECT migrated, skipped, error_list;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. FONCTION DE MIGRATION DES UTILISATIONS
-- =====================================================

CREATE OR REPLACE FUNCTION migrate_coupon_usages_to_promotion_usage()
RETURNS INTEGER AS $$
DECLARE
  usage_record RECORD;
  promotion_id_value UUID;
  migrated_count INTEGER := 0;
BEGIN
  -- Migrer les usages depuis coupon_usages qui référencent promotions
  FOR usage_record IN 
    SELECT cu.*, pp.id as new_promotion_id
    FROM public.coupon_usages cu
    INNER JOIN public.promotions p ON cu.promotion_id = p.id
    INNER JOIN public.product_promotions pp ON pp.original_promotion_id = p.id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.promotion_usage pu
      WHERE pu.promotion_id = pp.id
        AND pu.order_id = cu.order_id
    )
  LOOP
    BEGIN
      INSERT INTO public.promotion_usage (
        promotion_id,
        order_id,
        user_id,
        customer_id,
        discount_amount,
        order_total_before_discount,
        order_total_after_discount,
        used_at
      ) VALUES (
        usage_record.new_promotion_id,
        usage_record.order_id,
        usage_record.user_id,
        NULL, -- customer_id sera récupéré depuis order si nécessaire
        COALESCE(usage_record.discount_amount, 0),
        COALESCE(usage_record.original_amount, 0),
        COALESCE(usage_record.final_amount, 0),
        COALESCE(usage_record.used_at, NOW())
      ) ON CONFLICT DO NOTHING;
      
      migrated_count := migrated_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Ignorer les erreurs individuelles et continuer
      CONTINUE;
    END;
  END LOOP;

  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VÉRIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Fonctions de migration créées avec succès!';
  RAISE NOTICE '   - migrate_promotions_to_product_promotions()';
  RAISE NOTICE '   - migrate_digital_coupons_to_product_promotions()';
  RAISE NOTICE '   - migrate_coupon_usages_to_promotion_usage()';
END $$;

