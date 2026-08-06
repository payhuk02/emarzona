-- Invoices: no automatic platform VAT on create_invoice_from_order.
-- Tax is taken from order.metadata when checkout recorded it; otherwise 0.
-- Platform-wide tax_configurations seeds (store_id IS NULL) must not inflate invoices.

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
  v_subtotal NUMERIC(10, 2);
  v_shipping NUMERIC(10, 2);
  v_tax_amount NUMERIC(10, 2);
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

  v_shipping := COALESCE((order_record.metadata->>'shipping_amount')::NUMERIC, 0);
  v_subtotal := order_record.total_amount - v_shipping;
  v_tax_amount := COALESCE((order_record.metadata->>'tax_amount')::NUMERIC, 0);

  tax_calculation := jsonb_build_object(
    'subtotal', v_subtotal,
    'shipping_amount', v_shipping,
    'tax_amount', v_tax_amount,
    'tax_breakdown', COALESCE(order_record.metadata->'tax_breakdown', '[]'::jsonb),
    'total_with_tax', order_record.total_amount
  );

  IF order_record.customer_id IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.customers c WHERE c.id = order_record.customer_id) THEN
    valid_customer_id := order_record.customer_id;
  ELSE
    valid_customer_id := NULL;
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
    v_subtotal,
    COALESCE((order_record.metadata->>'discount_amount')::NUMERIC, 0),
    v_tax_amount,
    v_shipping,
    order_record.total_amount,
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
  'Crée une facture depuis une commande. TVA uniquement si enregistrée dans order.metadata (pas de seed platform par défaut).';

-- Corriger les factures existantes générées avec TVA platform par défaut (sans taxe au checkout)
UPDATE public.invoices i
SET
  tax_amount = 0,
  tax_breakdown = '[]'::jsonb,
  total_amount = o.total_amount,
  subtotal = o.total_amount - COALESCE(i.shipping_amount, 0),
  updated_at = now()
FROM public.orders o
WHERE i.order_id = o.id
  AND COALESCE((o.metadata->>'tax_amount')::numeric, 0) = 0
  AND COALESCE(i.tax_amount, 0) > 0;

COMMIT;
