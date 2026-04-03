-- =====================================================
-- MIGRATION DES DONNÉES - UNIFICATION DES SYSTÈMES
-- Date: 30 Janvier 2025
-- Description: Migration des données de promotions vers product_promotions
--              pour unifier les systèmes
-- =====================================================

-- =====================================================
-- 1. FONCTION DE MIGRATION DEPUIS PROMOTIONS
-- =====================================================

-- Supprimer la fonction si elle existe déjà
DROP FUNCTION IF EXISTS migrate_promotions_to_product_promotions() CASCADE;

CREATE OR REPLACE FUNCTION migrate_promotions_to_product_promotions()
RETURNS TABLE(
  migrated_count INTEGER,
  skipped_count INTEGER,
  errors TEXT[]
) AS $$
DECLARE
  v_promotion RECORD;
  v_migrated INTEGER := 0;
  v_skipped INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_error_text TEXT;
BEGIN
  -- Parcourir toutes les promotions
  FOR v_promotion IN 
    SELECT * FROM public.promotions
    WHERE NOT EXISTS (
      SELECT 1 FROM public.product_promotions 
      WHERE original_promotion_id = promotions.id
    )
  LOOP
    BEGIN
      -- Créer la promotion dans product_promotions
      INSERT INTO public.product_promotions (
        store_id,
        name,
        description,
        code,
        discount_type,
        discount_value,
        applies_to,
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
        v_promotion.store_id,
        COALESCE(v_promotion.description, 'Promotion migrée'),
        v_promotion.description,
        v_promotion.code,
        CASE 
          WHEN v_promotion.discount_type = 'fixed' THEN 'fixed_amount'
          ELSE v_promotion.discount_type
        END,
        v_promotion.discount_value,
        'all_products',
        v_promotion.min_purchase_amount,
        v_promotion.max_uses,
        NULL, -- max_uses_per_user n'existe pas dans promotions
        v_promotion.used_count,
        COALESCE(v_promotion.start_date, NOW()),
        v_promotion.end_date,
        v_promotion.is_active,
        false, -- Toujours avec code dans l'ancien système
        v_promotion.id,
        'promotions',
        'Migré depuis promotions le ' || NOW()::TEXT,
        v_promotion.created_at,
        v_promotion.updated_at
      );
      
      v_migrated := v_migrated + 1;
    EXCEPTION WHEN OTHERS THEN
      v_error_text := 'Erreur pour promotion ' || v_promotion.id || ': ' || SQLERRM;
      v_errors := array_append(v_errors, v_error_text);
      v_skipped := v_skipped + 1;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_migrated, v_skipped, v_errors;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. FONCTION DE MIGRATION DEPUIS DIGITAL_PRODUCT_COUPONS
-- =====================================================

-- Supprimer la fonction si elle existe déjà
DROP FUNCTION IF EXISTS migrate_digital_coupons_to_product_promotions() CASCADE;

CREATE OR REPLACE FUNCTION migrate_digital_coupons_to_product_promotions()
RETURNS TABLE(
  migrated_count INTEGER,
  skipped_count INTEGER,
  errors TEXT[]
) AS $$
DECLARE
  v_coupon RECORD;
  v_migrated INTEGER := 0;
  v_skipped INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_error_text TEXT;
BEGIN
  -- Parcourir tous les coupons digitaux
  FOR v_coupon IN 
    SELECT * FROM public.digital_product_coupons
    WHERE is_archived = false
    AND NOT EXISTS (
      SELECT 1 FROM public.product_promotions 
      WHERE original_digital_coupon_id = digital_product_coupons.id
    )
  LOOP
    BEGIN
      -- Créer la promotion dans product_promotions
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
        max_discount_amount,
        first_time_buyers_only,
        exclude_sale_items,
        exclude_bundles,
        original_digital_coupon_id,
        migration_source,
        migration_note,
        created_at,
        updated_at
      ) VALUES (
        v_coupon.store_id,
        v_coupon.name,
        v_coupon.description,
        v_coupon.code,
        CASE 
          WHEN v_coupon.discount_type = 'fixed' THEN 'fixed_amount'
          ELSE 'percentage'
        END,
        v_coupon.discount_value,
        CASE 
          WHEN v_coupon.applicable_product_ids IS NOT NULL AND array_length(v_coupon.applicable_product_ids, 1) > 0 
          THEN 'specific_products'
          ELSE 'all_products'
        END,
        v_coupon.applicable_product_ids,
        v_coupon.min_purchase_amount,
        v_coupon.usage_limit,
        v_coupon.usage_limit_per_customer,
        v_coupon.usage_count,
        v_coupon.valid_from,
        v_coupon.valid_until,
        v_coupon.is_active,
        false, -- Toujours avec code
        v_coupon.max_discount_amount,
        v_coupon.first_time_buyers_only,
        v_coupon.exclude_sale_items,
        v_coupon.exclude_bundles,
        v_coupon.id,
        'digital_product_coupons',
        'Migré depuis digital_product_coupons le ' || NOW()::TEXT,
        v_coupon.created_at,
        v_coupon.updated_at
      );
      
      v_migrated := v_migrated + 1;
    EXCEPTION WHEN OTHERS THEN
      v_error_text := 'Erreur pour coupon ' || v_coupon.id || ': ' || SQLERRM;
      v_errors := array_append(v_errors, v_error_text);
      v_skipped := v_skipped + 1;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_migrated, v_skipped, v_errors;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. FONCTION DE MIGRATION DES UTILISATIONS
-- =====================================================

-- Supprimer la fonction si elle existe déjà (avec toutes les signatures possibles)
DROP FUNCTION IF EXISTS migrate_coupon_usages_to_promotion_usage() CASCADE;

CREATE OR REPLACE FUNCTION migrate_coupon_usages_to_promotion_usage()
RETURNS TABLE(
  migrated_count INTEGER,
  skipped_count INTEGER,
  errors TEXT[]
) AS $$
DECLARE
  v_usage RECORD;
  v_promotion_id UUID;
  v_migrated INTEGER := 0;
  v_skipped INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_error_text TEXT;
BEGIN
  -- Parcourir les utilisations de coupon_usages
  -- Gérer les deux structures : promotion_id (système simple) et coupon_id (système digital)
  FOR v_usage IN 
    SELECT * FROM public.coupon_usages cu
    WHERE (
      -- Cas 1: promotion_id existe (système simple)
      (cu.promotion_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.promotion_usage pu
        WHERE pu.order_id = cu.order_id
        AND pu.promotion_id IN (
          SELECT id FROM public.product_promotions 
          WHERE original_promotion_id = cu.promotion_id
        )
      ))
      OR
      -- Cas 2: coupon_id existe (système digital)
      (cu.coupon_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.promotion_usage pu
        WHERE pu.order_id = cu.order_id
        AND pu.promotion_id IN (
          SELECT id FROM public.product_promotions 
          WHERE original_digital_coupon_id = cu.coupon_id
        )
      ))
    )
  LOOP
    BEGIN
      -- Trouver la promotion correspondante dans product_promotions
      -- Essayer d'abord avec promotion_id, puis avec coupon_id
      SELECT id INTO v_promotion_id
      FROM public.product_promotions
      WHERE (
        (v_usage.promotion_id IS NOT NULL AND original_promotion_id = v_usage.promotion_id)
        OR
        (v_usage.coupon_id IS NOT NULL AND original_digital_coupon_id = v_usage.coupon_id)
      )
      LIMIT 1;
      
      IF v_promotion_id IS NOT NULL THEN
        INSERT INTO public.promotion_usage (
          promotion_id,
          order_id,
          customer_id,
          user_id,
          discount_amount,
          order_total_before_discount,
          order_total_after_discount,
          used_at
        ) VALUES (
          v_promotion_id,
          v_usage.order_id,
          COALESCE(v_usage.customer_id, NULL), -- customer_id peut exister dans certaines structures
          v_usage.user_id, -- user_id peut être NULL dans certaines structures
          v_usage.discount_amount,
          COALESCE(v_usage.order_total_before_discount, v_usage.original_amount, 0),
          COALESCE(v_usage.order_total_after_discount, v_usage.final_amount, 0),
          COALESCE(v_usage.used_at, v_usage.created_at, NOW())
        );
        
        v_migrated := v_migrated + 1;
      ELSE
        v_skipped := v_skipped + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_error_text := 'Erreur pour usage ' || v_usage.id || ': ' || SQLERRM;
      v_errors := array_append(v_errors, v_error_text);
      v_skipped := v_skipped + 1;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_migrated, v_skipped, v_errors;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. FONCTION DE VÉRIFICATION POST-MIGRATION
-- =====================================================

-- Supprimer la fonction si elle existe déjà
DROP FUNCTION IF EXISTS verify_promotions_migration() CASCADE;

CREATE OR REPLACE FUNCTION verify_promotions_migration()
RETURNS TABLE(
  source_table TEXT,
  total_count INTEGER,
  migrated_count INTEGER,
  missing_count INTEGER,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'promotions'::TEXT,
    (SELECT COUNT(*) FROM public.promotions)::INTEGER,
    (SELECT COUNT(*) FROM public.product_promotions WHERE migration_source = 'promotions')::INTEGER,
    (
      SELECT COUNT(*) FROM public.promotions p
      WHERE NOT EXISTS (
        SELECT 1 FROM public.product_promotions pp 
        WHERE pp.original_promotion_id = p.id
      )
    )::INTEGER,
    CASE 
      WHEN (
        SELECT COUNT(*) FROM public.promotions p
        WHERE NOT EXISTS (
          SELECT 1 FROM public.product_promotions pp 
          WHERE pp.original_promotion_id = p.id
        )
      ) = 0 THEN '✅ Toutes migrées'
      ELSE '⚠️ Certaines non migrées'
    END;
    
  RETURN QUERY
  SELECT 
    'digital_product_coupons'::TEXT,
    (SELECT COUNT(*) FROM public.digital_product_coupons WHERE is_archived = false)::INTEGER,
    (SELECT COUNT(*) FROM public.product_promotions WHERE migration_source = 'digital_product_coupons')::INTEGER,
    (
      SELECT COUNT(*) FROM public.digital_product_coupons d
      WHERE d.is_archived = false
      AND NOT EXISTS (
        SELECT 1 FROM public.product_promotions pp 
        WHERE pp.original_digital_coupon_id = d.id
      )
    )::INTEGER,
    CASE 
      WHEN (
        SELECT COUNT(*) FROM public.digital_product_coupons d
        WHERE d.is_archived = false
        AND NOT EXISTS (
          SELECT 1 FROM public.product_promotions pp 
          WHERE pp.original_digital_coupon_id = d.id
        )
      ) = 0 THEN '✅ Toutes migrées'
      ELSE '⚠️ Certaines non migrées'
    END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. COMMENTAIRES
-- =====================================================

COMMENT ON FUNCTION migrate_promotions_to_product_promotions() IS 
'Migre les promotions de la table promotions vers product_promotions';

COMMENT ON FUNCTION migrate_digital_coupons_to_product_promotions() IS 
'Migre les coupons digitaux vers product_promotions';

COMMENT ON FUNCTION migrate_coupon_usages_to_promotion_usage() IS 
'Migre les utilisations de coupons vers promotion_usage';

COMMENT ON FUNCTION verify_promotions_migration() IS 
'Vérifie que toutes les promotions ont été migrées correctement';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

-- Note: Pour exécuter la migration, utiliser:
-- SELECT * FROM migrate_promotions_to_product_promotions();
-- SELECT * FROM migrate_digital_coupons_to_product_promotions();
-- SELECT * FROM migrate_coupon_usages_to_promotion_usage();
-- SELECT * FROM verify_promotions_migration();

