-- =====================================================
-- UNIFICATION DES SYSTÈMES DE PROMOTIONS
-- Date: 28 Janvier 2025
-- Description: Migration pour unifier tous les systèmes de promotions vers product_promotions
-- =====================================================

-- =====================================================
-- 1. EXTENSION DE LA TABLE product_promotions
-- =====================================================

-- Ajouter les colonnes pour supporter toutes les fonctionnalités
DO $$
BEGIN
  -- Colonnes pour le système simple (promotions)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_promotions' AND column_name = 'original_promotion_id') THEN
    ALTER TABLE public.product_promotions
    ADD COLUMN original_promotion_id UUID,
    ADD COLUMN original_digital_coupon_id UUID,
    ADD COLUMN migration_source TEXT, -- 'promotions', 'digital_product_coupons', 'product_promotions'
    ADD COLUMN migration_note TEXT;
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
    ADD COLUMN customer_eligibility TEXT DEFAULT 'all' CHECK (customer_eligibility IN ('all', 'new_customers', 'existing_customers', 'vip')),
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Colonnes pour les statistiques (digital_product_coupons)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_promotions' AND column_name = 'total_discount_given') THEN
    ALTER TABLE public.product_promotions
    ADD COLUMN total_discount_given NUMERIC DEFAULT 0,
    ADD COLUMN total_orders INTEGER DEFAULT 0;
  END IF;
END $$;

-- =====================================================
-- 2. FONCTION DE MIGRATION : promotions -> product_promotions
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
            WHEN promo_record.applicable_to_product_ids IS NOT NULL AND array_length(promo_record.applicable_to_product_ids, 1) > 0 
            THEN 'specific_products'
            ELSE 'all_products'
          END,
          promo_record.applicable_to_product_ids,
          promo_record.min_purchase_amount,
          promo_record.max_uses,
          promo_record.max_uses_per_user,
          promo_record.used_count,
          COALESCE(promo_record.start_date, NOW()),
          promo_record.end_date,
          promo_record.is_active,
          FALSE, -- Les anciennes promotions nécessitent toujours un code
          promo_record.id,
          'promotions',
          'Migré depuis la table promotions le ' || NOW()::TEXT,
          promo_record.created_at,
          promo_record.updated_at
        ) RETURNING id INTO new_id;

        migrated := migrated + 1;

      EXCEPTION WHEN OTHERS THEN
        error_msg := 'Erreur lors de la migration de la promotion ' || promo_record.id || ': ' || SQLERRM;
        error_list := array_append(error_list, error_msg);
        skipped := skipped + 1;
      END;
    END;
  END LOOP;

  RETURN QUERY SELECT migrated, skipped, error_list;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. FONCTION DE MIGRATION : digital_product_coupons -> product_promotions
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
    AND is_archived = FALSE
  LOOP
    BEGIN
      -- Déterminer applies_to
      DECLARE
        applies_to_value TEXT;
      BEGIN
        IF coupon_record.applicable_product_ids IS NOT NULL AND array_length(coupon_record.applicable_product_ids, 1) > 0 THEN
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
          coupon_record.discount_type,
          coupon_record.discount_value,
          applies_to_value,
          coupon_record.applicable_product_ids,
          coupon_record.min_purchase_amount,
          coupon_record.usage_limit,
          coupon_record.usage_limit_per_customer,
          coupon_record.usage_count,
          coupon_record.valid_from,
          coupon_record.valid_until,
          coupon_record.is_active,
          FALSE, -- Les coupons nécessitent un code
          coupon_record.id,
          'digital_product_coupons',
          'Migré depuis digital_product_coupons le ' || NOW()::TEXT,
          coupon_record.max_discount_amount,
          coupon_record.applicable_store_ids,
          coupon_record.first_time_buyers_only,
          coupon_record.exclude_sale_items,
          coupon_record.exclude_bundles,
          coupon_record.metadata,
          coupon_record.total_discount_given,
          coupon_record.total_orders,
          coupon_record.created_at,
          coupon_record.updated_at
        ) RETURNING id INTO new_id;

        migrated := migrated + 1;

      EXCEPTION WHEN OTHERS THEN
        error_msg := 'Erreur lors de la migration du coupon ' || coupon_record.id || ': ' || SQLERRM;
        error_list := array_append(error_list, error_msg);
        skipped := skipped + 1;
      END;
    END;
  END LOOP;

  RETURN QUERY SELECT migrated, skipped, error_list;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. FONCTION UNIFIÉE DE VALIDATION AU CHECKOUT
-- =====================================================

CREATE OR REPLACE FUNCTION validate_unified_promotion(
  p_code TEXT,
  p_store_id UUID DEFAULT NULL,
  p_product_ids UUID[] DEFAULT NULL,
  p_category_ids UUID[] DEFAULT NULL,
  p_collection_ids UUID[] DEFAULT NULL,
  p_order_amount NUMERIC DEFAULT 0,
  p_customer_id UUID DEFAULT NULL,
  p_is_first_order BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  v_promotion RECORD;
  v_discount_amount NUMERIC;
  v_now TIMESTAMPTZ := NOW();
  v_applies BOOLEAN := FALSE;
BEGIN
  -- Trouver la promotion par code
  SELECT * INTO v_promotion
  FROM public.product_promotions
  WHERE code = UPPER(TRIM(p_code))
    AND is_active = TRUE
    AND (v_now >= starts_at)
    AND (ends_at IS NULL OR ends_at >= v_now);

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Code promotionnel invalide ou expiré'
    );
  END IF;

  -- Vérifier les limites d'utilisation
  IF v_promotion.max_uses IS NOT NULL AND v_promotion.current_uses >= v_promotion.max_uses THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Ce code promotionnel a atteint sa limite d''utilisation'
    );
  END IF;

  -- Vérifier limite par client
  IF p_customer_id IS NOT NULL AND v_promotion.max_uses_per_customer IS NOT NULL THEN
    DECLARE
      v_usage_count INTEGER;
    BEGIN
      SELECT COUNT(*) INTO v_usage_count
      FROM public.promotion_usage
      WHERE promotion_id = v_promotion.id
        AND customer_id = p_customer_id;
      
      IF v_usage_count >= v_promotion.max_uses_per_customer THEN
        RETURN jsonb_build_object(
          'valid', false,
          'error', 'Vous avez déjà utilisé ce code promotionnel le maximum de fois autorisé'
        );
      END IF;
    END;
  END IF;

  -- Vérifier montant minimum
  IF p_order_amount < COALESCE(v_promotion.min_purchase_amount, 0) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', format('Montant minimum requis: %s XOF', v_promotion.min_purchase_amount),
      'min_amount', v_promotion.min_purchase_amount
    );
  END IF;

  -- Vérifier éligibilité client
  IF v_promotion.customer_eligibility = 'new_customers' AND NOT p_is_first_order THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Ce code promotionnel est réservé aux nouveaux clients'
    );
  END IF;

  IF v_promotion.customer_eligibility = 'existing_customers' AND p_is_first_order THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Ce code promotionnel est réservé aux clients existants'
    );
  END IF;

  -- Vérifier first_time_buyers_only
  IF v_promotion.first_time_buyers_only AND NOT p_is_first_order THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Ce code promotionnel est réservé aux premiers achats'
    );
  END IF;

  -- Vérifier store
  IF p_store_id IS NOT NULL AND v_promotion.applicable_store_ids IS NOT NULL 
     AND array_length(v_promotion.applicable_store_ids, 1) > 0 THEN
    IF NOT (p_store_id = ANY(v_promotion.applicable_store_ids)) THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Ce code promotionnel ne s''applique pas à cette boutique'
      );
    END IF;
  END IF;

  -- Vérifier application aux produits
  IF p_product_ids IS NOT NULL AND array_length(p_product_ids, 1) > 0 THEN
    IF v_promotion.applies_to = 'specific_products' AND v_promotion.product_ids IS NOT NULL THEN
      v_applies := (p_product_ids && v_promotion.product_ids);
    ELSIF v_promotion.applies_to = 'categories' AND v_promotion.category_ids IS NOT NULL THEN
      -- Vérifier si les produits du panier appartiennent aux catégories
      IF p_category_ids IS NOT NULL AND array_length(p_category_ids, 1) > 0 THEN
        v_applies := (p_category_ids && v_promotion.category_ids);
      ELSE
        -- Vérifier via la table products
        SELECT EXISTS(
          SELECT 1 
          FROM public.products p
          WHERE p.id = ANY(p_product_ids)
            AND p.category_id = ANY(v_promotion.category_ids)
        ) INTO v_applies;
      END IF;
    ELSIF v_promotion.applies_to = 'collections' AND v_promotion.collection_ids IS NOT NULL THEN
      -- Vérifier si les produits du panier appartiennent aux collections
      IF p_collection_ids IS NOT NULL AND array_length(p_collection_ids, 1) > 0 THEN
        v_applies := (p_collection_ids && v_promotion.collection_ids);
      ELSE
        -- Vérifier via la table collection_products
        SELECT EXISTS(
          SELECT 1 
          FROM public.collection_products cp
          WHERE cp.product_id = ANY(p_product_ids)
            AND cp.collection_id = ANY(v_promotion.collection_ids)
        ) INTO v_applies;
      END IF;
    ELSIF v_promotion.applies_to = 'all_products' THEN
      v_applies := TRUE;
    ELSE
      v_applies := FALSE;
    END IF;

    IF NOT v_applies THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Ce code promotionnel ne s''applique pas aux produits de votre panier'
      );
    END IF;
  END IF;

  -- Calculer la réduction
  IF v_promotion.discount_type = 'percentage' THEN
    v_discount_amount := (p_order_amount * v_promotion.discount_value) / 100;
    IF v_promotion.max_discount_amount IS NOT NULL AND v_discount_amount > v_promotion.max_discount_amount THEN
      v_discount_amount := v_promotion.max_discount_amount;
    END IF;
  ELSIF v_promotion.discount_type = 'fixed_amount' THEN
    v_discount_amount := v_promotion.discount_value;
  ELSE
    v_discount_amount := 0;
  END IF;

  -- Limiter au montant de la commande
  IF v_discount_amount > p_order_amount THEN
    v_discount_amount := p_order_amount;
  END IF;

  -- Retourner le résultat
  RETURN jsonb_build_object(
    'valid', true,
    'promotion_id', v_promotion.id,
    'code', v_promotion.code,
    'name', v_promotion.name,
    'discount_type', v_promotion.discount_type,
    'discount_value', v_promotion.discount_value,
    'discount_amount', v_discount_amount,
    'order_total_before', p_order_amount,
    'order_total_after', p_order_amount - v_discount_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. MIGRATION DES DONNÉES D'UTILISATION
-- =====================================================

-- Migrer coupon_usages vers promotion_usage
CREATE OR REPLACE FUNCTION migrate_coupon_usages_to_promotion_usage()
RETURNS INTEGER AS $$
DECLARE
  usage_record RECORD;
  promotion_id_value UUID;
  migrated_count INTEGER := 0;
BEGIN
  -- Migrer les usages depuis coupon_usages qui référencent promotions
  FOR usage_record IN 
    SELECT cu.*, p.id as new_promotion_id
    FROM public.coupon_usages cu
    INNER JOIN public.promotions p ON cu.promotion_id = p.id
    INNER JOIN public.product_promotions pp ON pp.original_promotion_id = p.id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.promotion_usage pu
      WHERE pu.promotion_id = pp.id
        AND pu.order_id = cu.order_id
    )
  LOOP
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
      usage_record.discount_amount,
      usage_record.original_amount,
      usage_record.final_amount,
      usage_record.used_at
    ) ON CONFLICT DO NOTHING;
    
    migrated_count := migrated_count + 1;
  END LOOP;

  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. COMMENTAIRES ET DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION migrate_promotions_to_product_promotions() IS 
'Migre les données de la table promotions vers product_promotions. Retourne le nombre de migrations réussies, échouées et les erreurs.';

COMMENT ON FUNCTION migrate_digital_coupons_to_product_promotions() IS 
'Migre les données de digital_product_coupons vers product_promotions. Retourne le nombre de migrations réussies, échouées et les erreurs.';

COMMENT ON FUNCTION validate_unified_promotion(TEXT, UUID, UUID[], UUID[], UUID[], NUMERIC, UUID, BOOLEAN) IS 
'Fonction unifiée de validation de code promotionnel qui fonctionne avec product_promotions pour tous les types de promotions.';

COMMENT ON FUNCTION migrate_coupon_usages_to_promotion_usage() IS 
'Migre les données d''utilisation depuis coupon_usages vers promotion_usage pour unifier le suivi.';

