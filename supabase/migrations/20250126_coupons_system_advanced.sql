-- ================================================================
-- Système de Coupons/Promotions Avancé
-- Date: 26 Janvier 2025
-- 
-- Améliorations:
-- - Validation RPC pour coupons
-- - Historique d'utilisation par utilisateur
-- - Support coupons globaux (platform-wide)
-- - Limites par utilisateur
-- ================================================================

-- Ajouter colonnes manquantes à promotions
ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS applicable_to_product_ids UUID[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS applicable_to_product_types TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS max_uses_per_user INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_platform_wide BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_eligibility TEXT DEFAULT 'all' CHECK (customer_eligibility IN ('all', 'new_customers', 'existing_customers', 'vip'));

-- Créer table pour historique d'utilisation des coupons
CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  discount_amount NUMERIC(10, 2) NOT NULL,
  original_amount NUMERIC(10, 2) NOT NULL,
  final_amount NUMERIC(10, 2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  session_id TEXT, -- Pour les commandes anonymes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_coupon_usages_promotion_id ON public.coupon_usages(promotion_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user_id ON public.coupon_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_order_id ON public.coupon_usages(order_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_used_at ON public.coupon_usages(used_at DESC);

-- Activer RLS pour coupon_usages
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour coupon_usages
CREATE POLICY "Users can view their own coupon usages"
ON public.coupon_usages FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Store owners can view usages of their promotions
CREATE POLICY "Store owners can view coupon usages for their promotions"
ON public.coupon_usages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.promotions
    WHERE promotions.id = coupon_usages.promotion_id
    AND (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = promotions.store_id
        AND stores.user_id = auth.uid()
      )
      OR promotions.is_platform_wide = true
    )
  )
);

-- Fonction RPC pour valider un coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(
  coupon_code TEXT,
  cart_subtotal NUMERIC,
  product_ids UUID[] DEFAULT NULL,
  product_types TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  promotion_record RECORD;
  usage_count INTEGER;
  user_usage_count INTEGER;
  discount_amount NUMERIC;
  final_amount NUMERIC;
BEGIN
  -- Récupérer le coupon
  SELECT * INTO promotion_record
  FROM public.promotions
  WHERE code = UPPER(TRIM(coupon_code))
    AND is_active = true;

  -- Vérifier si le coupon existe
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Code coupon invalide ou expiré'
    );
  END IF;

  -- Vérifier les dates
  IF promotion_record.start_date IS NOT NULL AND promotion_record.start_date > NOW() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Ce coupon n''est pas encore actif'
    );
  END IF;

  IF promotion_record.end_date IS NOT NULL AND promotion_record.end_date < NOW() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Ce coupon a expiré'
    );
  END IF;

  -- Vérifier montant minimum
  IF promotion_record.min_purchase_amount > 0 AND cart_subtotal < promotion_record.min_purchase_amount THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Montant minimum de commande requis: ' || promotion_record.min_purchase_amount::TEXT || ' XOF'
    );
  END IF;

  -- Vérifier limites d'utilisation globales
  IF promotion_record.max_uses IS NOT NULL THEN
    SELECT COUNT(*) INTO usage_count
    FROM public.coupon_usages
    WHERE promotion_id = promotion_record.id;

    IF usage_count >= promotion_record.max_uses THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Ce coupon a atteint sa limite d''utilisation'
      );
    END IF;
  END IF;

  -- Vérifier limites par utilisateur
  IF promotion_record.max_uses_per_user IS NOT NULL AND auth.uid() IS NOT NULL THEN
    SELECT COUNT(*) INTO user_usage_count
    FROM public.coupon_usages
    WHERE promotion_id = promotion_record.id
      AND user_id = auth.uid();

    IF user_usage_count >= promotion_record.max_uses_per_user THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Vous avez atteint la limite d''utilisation pour ce coupon'
      );
    END IF;
  END IF;

  -- Vérifier produits éligibles
  IF promotion_record.applicable_to_product_ids IS NOT NULL AND array_length(promotion_record.applicable_to_product_ids, 1) > 0 THEN
    IF product_ids IS NULL OR NOT (product_ids && promotion_record.applicable_to_product_ids) THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Ce coupon ne s''applique pas aux produits de votre panier'
      );
    END IF;
  END IF;

  -- Vérifier types de produits éligibles
  IF promotion_record.applicable_to_product_types IS NOT NULL AND array_length(promotion_record.applicable_to_product_types, 1) > 0 THEN
    IF product_types IS NULL OR NOT (product_types && promotion_record.applicable_to_product_types) THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Ce coupon ne s''applique pas aux types de produits de votre panier'
      );
    END IF;
  END IF;

  -- Calculer le montant de la réduction
  IF promotion_record.discount_type = 'percentage' THEN
    discount_amount := cart_subtotal * (promotion_record.discount_value / 100);
    -- Limiter la réduction au montant du panier
    IF discount_amount > cart_subtotal THEN
      discount_amount := cart_subtotal;
    END IF;
  ELSIF promotion_record.discount_type = 'fixed' THEN
    discount_amount := LEAST(promotion_record.discount_value, cart_subtotal);
  ELSE
    discount_amount := 0;
  END IF;

  final_amount := cart_subtotal - discount_amount;

  -- Retourner le résultat
  RETURN jsonb_build_object(
    'valid', true,
    'promotion', jsonb_build_object(
      'id', promotion_record.id,
      'code', promotion_record.code,
      'description', promotion_record.description,
      'discount_type', promotion_record.discount_type,
      'discount_value', promotion_record.discount_value,
      'discount_amount', discount_amount,
      'original_amount', cart_subtotal,
      'final_amount', final_amount
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Erreur lors de la validation du coupon'
    );
END;
$$;

-- Fonction pour enregistrer l'utilisation d'un coupon
CREATE OR REPLACE FUNCTION public.record_coupon_usage(
  promotion_id_param UUID,
  order_id_param UUID,
  discount_amount_param NUMERIC,
  original_amount_param NUMERIC,
  final_amount_param NUMERIC,
  session_id_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  usage_id UUID;
  user_id_param UUID;
BEGIN
  -- Récupérer l'utilisateur actuel
  SELECT auth.uid() INTO user_id_param;

  -- Insérer l'utilisation
  INSERT INTO public.coupon_usages (
    promotion_id,
    user_id,
    order_id,
    discount_amount,
    original_amount,
    final_amount,
    session_id
  ) VALUES (
    promotion_id_param,
    user_id_param,
    order_id_param,
    discount_amount_param,
    original_amount_param,
    final_amount_param,
    session_id_param
  ) RETURNING id INTO usage_id;

  -- Mettre à jour le compteur used_count dans promotions
  UPDATE public.promotions
  SET used_count = used_count + 1
  WHERE id = promotion_id_param;

  RETURN usage_id;
END;
$$;

-- RLS Policy pour permettre la lecture publique des promotions actives
CREATE POLICY "Public can view active promotions"
ON public.promotions FOR SELECT
USING (is_active = true);

-- Commentaires
COMMENT ON FUNCTION public.validate_coupon IS 'Valide un code coupon et retourne les détails de la réduction';
COMMENT ON FUNCTION public.record_coupon_usage IS 'Enregistre l''utilisation d''un coupon lors d''une commande';

