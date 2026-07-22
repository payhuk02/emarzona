-- Fix create_invoice_from_order: stores.logo_url a été déplacé vers store_appearance.
-- Cause du 400 checkout : ERROR 42703 column "logo_url" does not exist.

BEGIN;

CREATE OR REPLACE FUNCTION public.create_invoice_from_order(p_order_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  order_record RECORD;
  invoice_id UUID;
  invoice_number TEXT;
  billing_info JSONB;
  store_info JSONB;
  tax_calculation JSONB;
  valid_customer_id UUID;
  v_logo_url TEXT;
BEGIN
  SELECT * INTO order_record
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF EXISTS (SELECT 1 FROM public.invoices WHERE order_id = p_order_id) THEN
    SELECT id INTO invoice_id FROM public.invoices WHERE order_id = p_order_id LIMIT 1;
    RETURN invoice_id;
  END IF;

  invoice_number := generate_invoice_number();

  billing_info := COALESCE(order_record.metadata->'shipping_address', '{}'::jsonb);

  SELECT sa.logo_url INTO v_logo_url
  FROM public.store_appearance sa
  WHERE sa.store_id = order_record.store_id
  LIMIT 1;

  SELECT jsonb_build_object(
    'name', s.name,
    'address', s.address_line1,
    'city', s.city,
    'postal_code', s.postal_code,
    'country', s.country,
    'tax_id', s.metadata->>'tax_id',
    'logo_url', v_logo_url
  )
  INTO store_info
  FROM public.stores s
  WHERE s.id = order_record.store_id;

  SELECT calculate_order_taxes(
    p_order_id,
    COALESCE(billing_info->>'country', 'BF'),
    billing_info->>'state',
    order_record.store_id
  ) INTO tax_calculation;

  IF order_record.customer_id IS NOT NULL THEN
    SELECT id INTO valid_customer_id FROM auth.users WHERE id = order_record.customer_id;
  END IF;

  INSERT INTO public.invoices (
    invoice_number,
    order_id,
    store_id,
    customer_id,
    subtotal,
    discount_amount,
    tax_amount,
    shipping_amount,
    total_amount,
    currency,
    tax_breakdown,
    billing_address,
    store_info,
    status
  ) VALUES (
    invoice_number,
    p_order_id,
    order_record.store_id,
    valid_customer_id,
    COALESCE((tax_calculation->>'subtotal')::NUMERIC, order_record.total_amount),
    COALESCE((order_record.metadata->>'discount_amount')::NUMERIC, 0),
    COALESCE((tax_calculation->>'tax_amount')::NUMERIC, 0),
    COALESCE((tax_calculation->>'shipping_amount')::NUMERIC, 0),
    COALESCE((tax_calculation->>'total_with_tax')::NUMERIC, order_record.total_amount),
    order_record.currency,
    tax_calculation->'tax_breakdown',
    billing_info,
    store_info,
    'draft'
  ) RETURNING id INTO invoice_id;

  INSERT INTO public.invoice_items (
    invoice_id,
    product_id,
    product_type,
    product_name,
    quantity,
    unit_price,
    total_price
  )
  SELECT
    invoice_id,
    product_id,
    product_type,
    product_name,
    quantity,
    unit_price,
    total_price
  FROM public.order_items
  WHERE order_id = p_order_id;

  RETURN invoice_id;
END;
$function$;

COMMENT ON FUNCTION public.create_invoice_from_order(uuid) IS
  'Crée une facture depuis une commande ; logo boutique via store_appearance.';

GRANT EXECUTE ON FUNCTION public.create_invoice_from_order(uuid)
  TO anon, authenticated, service_role;

COMMIT;
