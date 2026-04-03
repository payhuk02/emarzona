-- ================================================================
-- Améliorations Coupons : Combinables, Usage Unique par Client
-- Date: 2025-01-27
-- ================================================================

-- Ajouter colonnes pour coupons combinables
ALTER TABLE public.digital_product_coupons
ADD COLUMN IF NOT EXISTS can_combine BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS combine_with_coupon_ids UUID[], -- Liste des IDs de coupons avec lesquels ce coupon peut être combiné
ADD COLUMN IF NOT EXISTS max_combined_discount_percentage NUMERIC(5, 2) DEFAULT 50, -- Maximum de réduction totale avec plusieurs coupons
ADD COLUMN IF NOT EXISTS stack_with_other_discounts BOOLEAN DEFAULT false; -- Peut être combiné avec remises produits

-- Ajouter colonnes pour usage unique par client
ALTER TABLE public.digital_product_coupons
ADD COLUMN IF NOT EXISTS one_time_use_per_customer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_usage_tracking JSONB DEFAULT '[]'::jsonb; -- [{customer_id, order_id, used_at}]

-- Créer une table pour tracker l'usage unique par client
CREATE TABLE IF NOT EXISTS public.coupon_customer_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.digital_product_coupons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  discount_amount NUMERIC(10, 2) NOT NULL,
  order_total_before NUMERIC(10, 2) NOT NULL,
  order_total_after NUMERIC(10, 2) NOT NULL,
  
  CONSTRAINT unique_coupon_customer_usage UNIQUE (coupon_id, customer_id) -- Un coupon ne peut être utilisé qu'une fois par client si one_time_use_per_customer = true
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_coupon_customer_usage_coupon ON public.coupon_customer_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_customer_usage_customer ON public.coupon_customer_usage(customer_id);
CREATE INDEX IF NOT EXISTS idx_coupon_customer_usage_order ON public.coupon_customer_usage(order_id);

-- Fonction pour valider si un coupon peut être combiné avec d'autres
CREATE OR REPLACE FUNCTION can_combine_coupons(
  p_coupon_ids UUID[],
  p_order_total NUMERIC
)
RETURNS TABLE (
  can_combine BOOLEAN,
  total_discount NUMERIC,
  error_message TEXT
) AS $$
DECLARE
  v_coupon RECORD;
  v_total_discount NUMERIC := 0;
  v_total_discount_percentage NUMERIC := 0;
  v_max_allowed_percentage NUMERIC := 50;
  v_can_combine_all BOOLEAN := true;
  v_error_msg TEXT;
BEGIN
  -- Vérifier que tous les coupons peuvent être combinés
  FOR v_coupon IN 
    SELECT * FROM public.digital_product_coupons
    WHERE id = ANY(p_coupon_ids)
  LOOP
    IF NOT v_coupon.can_combine THEN
      v_can_combine_all := false;
      v_error_msg := format('Le coupon %s ne peut pas être combiné avec d''autres coupons', v_coupon.code);
      EXIT;
    END IF;
    
    -- Vérifier si ce coupon peut être combiné avec les autres dans la liste
    IF v_coupon.combine_with_coupon_ids IS NOT NULL AND 
       NOT (p_coupon_ids <@ v_coupon.combine_with_coupon_ids) THEN
      v_can_combine_all := false;
      v_error_msg := format('Le coupon %s ne peut pas être combiné avec certains coupons de cette liste', v_coupon.code);
      EXIT;
    END IF;
    
    -- Calculer la remise totale
    IF v_coupon.discount_type = 'percentage' THEN
      v_total_discount_percentage := v_total_discount_percentage + v_coupon.discount_value;
    ELSE
      v_total_discount := v_total_discount + v_coupon.discount_value;
    END IF;
    
    -- Vérifier le maximum de réduction combinée
    IF v_coupon.max_combined_discount_percentage IS NOT NULL THEN
      v_max_allowed_percentage := LEAST(v_max_allowed_percentage, v_coupon.max_combined_discount_percentage);
    END IF;
  END LOOP;
  
  -- Calculer le total final
  IF v_total_discount_percentage > 0 THEN
    v_total_discount := v_total_discount + (p_order_total * v_total_discount_percentage / 100);
    v_total_discount_percentage := (v_total_discount / p_order_total * 100);
  END IF;
  
  -- Vérifier si le pourcentage total dépasse le maximum
  IF v_total_discount_percentage > v_max_allowed_percentage THEN
    v_can_combine_all := false;
    v_error_msg := format('La réduction combinée (%.2f%%) dépasse le maximum autorisé (%.2f%%)', 
      v_total_discount_percentage, v_max_allowed_percentage);
  END IF;
  
  RETURN QUERY SELECT 
    v_can_combine_all,
    v_total_discount,
    v_error_msg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un coupon peut être utilisé par un client (usage unique)
CREATE OR REPLACE FUNCTION can_use_coupon_by_customer(
  p_coupon_id UUID,
  p_customer_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_one_time_use BOOLEAN;
  v_already_used BOOLEAN;
BEGIN
  -- Récupérer le paramètre one_time_use_per_customer
  SELECT one_time_use_per_customer INTO v_one_time_use
  FROM public.digital_product_coupons
  WHERE id = p_coupon_id;
  
  -- Si pas d'usage unique requis, retourner true
  IF NOT v_one_time_use THEN
    RETURN true;
  END IF;
  
  -- Vérifier si déjà utilisé par ce client
  SELECT EXISTS(
    SELECT 1 FROM public.coupon_customer_usage
    WHERE coupon_id = p_coupon_id AND customer_id = p_customer_id
  ) INTO v_already_used;
  
  RETURN NOT v_already_used;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour enregistrer l'usage d'un coupon par un client
CREATE OR REPLACE FUNCTION record_coupon_usage(
  p_coupon_id UUID,
  p_customer_id UUID,
  p_order_id UUID,
  p_discount_amount NUMERIC,
  p_order_total_before NUMERIC,
  p_order_total_after NUMERIC
)
RETURNS void AS $$
DECLARE
  v_one_time_use BOOLEAN;
BEGIN
  -- Récupérer le paramètre one_time_use_per_customer
  SELECT one_time_use_per_customer INTO v_one_time_use
  FROM public.digital_product_coupons
  WHERE id = p_coupon_id;
  
  -- Enregistrer l'usage
  INSERT INTO public.coupon_customer_usage (
    coupon_id,
    customer_id,
    order_id,
    discount_amount,
    order_total_before,
    order_total_after
  ) VALUES (
    p_coupon_id,
    p_customer_id,
    p_order_id,
    p_discount_amount,
    p_order_total_before,
    p_order_total_after
  )
  ON CONFLICT (coupon_id, customer_id) DO NOTHING; -- Si one_time_use_per_customer = true, cette contrainte empêchera les doublons
  
  -- Mettre à jour le tracking dans le coupon
  UPDATE public.digital_product_coupons
  SET 
    usage_count = usage_count + 1,
    customer_usage_tracking = customer_usage_tracking || jsonb_build_object(
      'customer_id', p_customer_id,
      'order_id', p_order_id,
      'used_at', now(),
      'discount_amount', p_discount_amount
    )
  WHERE id = p_coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS pour coupon_customer_usage
ALTER TABLE public.coupon_customer_usage ENABLE ROW LEVEL SECURITY;

-- Politique : Les vendeurs peuvent voir les usages de leurs coupons
CREATE POLICY "Store owners can view coupon usage"
  ON public.coupon_customer_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_product_coupons c
      INNER JOIN public.stores s ON c.store_id = s.id
      WHERE c.id = coupon_customer_usage.coupon_id
        AND s.user_id = auth.uid()
    )
  );

-- Politique : Les clients peuvent voir leurs propres usages
CREATE POLICY "Customers can view own coupon usage"
  ON public.coupon_customer_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = coupon_customer_usage.customer_id
        AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Commentaires
COMMENT ON COLUMN public.digital_product_coupons.can_combine IS 'Indique si ce coupon peut être combiné avec d''autres coupons';
COMMENT ON COLUMN public.digital_product_coupons.one_time_use_per_customer IS 'Indique si ce coupon ne peut être utilisé qu''une seule fois par client';
COMMENT ON TABLE public.coupon_customer_usage IS 'Tracking de l''usage unique des coupons par client';

