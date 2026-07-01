-- Phase 2.6 — Supprime le fallback TVA 18 % pour les pays non configurés.
-- UEMOA : taux dans tax_configurations (seed BF, CI, SN, …).
-- International : Stripe Tax via edge stripe-tax-calculate.

CREATE OR REPLACE FUNCTION public.calculate_taxes_pre_order(
  p_subtotal NUMERIC(10, 2),
  p_shipping_amount NUMERIC(10, 2),
  p_country_code TEXT,
  p_state_province TEXT DEFAULT NULL,
  p_store_id UUID DEFAULT NULL,
  p_product_types TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tax_config RECORD;
  tax_breakdown JSONB := '[]'::jsonb;
  total_tax NUMERIC(10, 2) := 0;
  taxable_amount NUMERIC(10, 2);
  calculated_tax NUMERIC(10, 2);
  tax_entry JSONB;
  applies_to_products BOOLEAN;
BEGIN
  FOR tax_config IN
    SELECT *
    FROM public.tax_configurations
    WHERE is_active = true
      AND country_code = p_country_code
      AND (state_province IS NULL OR state_province = p_state_province OR p_state_province IS NULL)
      AND (store_id = p_store_id OR store_id IS NULL)
      AND (effective_from <= CURRENT_DATE)
      AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
    ORDER BY priority DESC, created_at DESC
  LOOP
    applies_to_products := true;
    IF tax_config.applies_to_product_types IS NOT NULL
       AND array_length(tax_config.applies_to_product_types, 1) > 0
       AND p_product_types IS NOT NULL THEN
      applies_to_products := EXISTS (
        SELECT 1
        FROM unnest(tax_config.applies_to_product_types) AS tax_type
        WHERE tax_type = ANY(p_product_types)
      );
    END IF;

    IF NOT applies_to_products THEN
      CONTINUE;
    END IF;

    IF tax_config.applies_to_shipping THEN
      taxable_amount := p_subtotal + p_shipping_amount;
    ELSE
      taxable_amount := p_subtotal;
    END IF;

    IF tax_config.tax_inclusive THEN
      calculated_tax := taxable_amount - (taxable_amount / (1 + tax_config.rate / 100));
    ELSE
      calculated_tax := taxable_amount * (tax_config.rate / 100);
    END IF;

    total_tax := total_tax + calculated_tax;

    tax_entry := jsonb_build_object(
      'type', tax_config.tax_type,
      'name', tax_config.tax_name,
      'rate', tax_config.rate,
      'amount', calculated_tax,
      'applies_to_shipping', tax_config.applies_to_shipping,
      'tax_inclusive', tax_config.tax_inclusive
    );

    tax_breakdown := tax_breakdown || jsonb_build_array(tax_entry);
  END LOOP;

  -- Pas de taux par défaut global : international = Stripe Tax côté client.
  RETURN jsonb_build_object(
    'tax_amount', total_tax,
    'tax_breakdown', tax_breakdown,
    'subtotal', p_subtotal,
    'shipping_amount', p_shipping_amount,
    'total_with_tax', p_subtotal + p_shipping_amount + total_tax
  );
END;
$$;

COMMENT ON FUNCTION public.calculate_taxes_pre_order IS
  'Taxes pré-commande depuis tax_configurations (UEMOA). Pas de fallback 18 % — international via Stripe Tax.';
