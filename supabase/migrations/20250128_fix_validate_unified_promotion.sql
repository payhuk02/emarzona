-- =====================================================
-- CORRECTION : Fonction validate_unified_promotion
-- Date: 28 Janvier 2025
-- Description: Correction de la fonction de validation pour inclure p_collection_ids
-- =====================================================

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS validate_unified_promotion(TEXT, UUID, UUID[], UUID[], NUMERIC, UUID, BOOLEAN);
DROP FUNCTION IF EXISTS validate_unified_promotion(TEXT, UUID, UUID[], UUID[], UUID[], NUMERIC, UUID, BOOLEAN);

-- Recréer la fonction avec tous les paramètres nécessaires
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

-- Ajouter le commentaire
COMMENT ON FUNCTION validate_unified_promotion(TEXT, UUID, UUID[], UUID[], UUID[], NUMERIC, UUID, BOOLEAN) IS 
'Fonction unifiée de validation de code promotionnel qui fonctionne avec product_promotions pour tous les types de promotions.';

