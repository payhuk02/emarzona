-- S4: sync payments + factures on paid + fix invoice customer_id
-- - sync_payment_row_from_transaction : double-écrit payments depuis transactions (MF/PSP)
-- - ensure_order_invoice_paid : crée facture si absente + marque paid
-- - create_invoice_from_order : customer_id = customers.id (plus auth.users)
-- - get_admin_sales_stats : source de vérité = transactions completed

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Fix create_invoice_from_order : customer_id = public.customers
-- ---------------------------------------------------------------------------
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

  -- orders.customer_id référence public.customers (pas auth.users)
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
  'Crée une facture draft depuis une commande ; customer_id = customers.id.';

-- ---------------------------------------------------------------------------
-- 2. ensure_order_invoice_paid : create + mark paid (idempotent)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_order_invoice_paid(p_order_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_invoice_id UUID;
BEGIN
  IF p_order_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_invoice_id := public.create_invoice_from_order(p_order_id);

  UPDATE public.invoices
  SET
    status = 'paid',
    paid_at = COALESCE(paid_at, now()),
    updated_at = now()
  WHERE id = v_invoice_id
    AND status IS DISTINCT FROM 'paid';

  RETURN v_invoice_id;
END;
$$;

COMMENT ON FUNCTION public.ensure_order_invoice_paid(uuid) IS
  'Assure une facture pour la commande et la marque paid (idempotent).';

GRANT EXECUTE ON FUNCTION public.ensure_order_invoice_paid(uuid)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. sync_payment_row_from_transaction : payments ← transactions (PSP)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_payment_row_from_transaction(p_transaction_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_tx RECORD;
  v_payment_id UUID;
  v_method TEXT;
BEGIN
  IF p_transaction_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT
    t.id,
    t.store_id,
    t.order_id,
    t.customer_id,
    t.amount,
    t.currency,
    t.status,
    t.payment_provider,
    t.geniuspay_payment_method
  INTO v_tx
  FROM public.transactions t
  WHERE t.id = p_transaction_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found: %', p_transaction_id;
  END IF;

  IF v_tx.status IS DISTINCT FROM 'completed' THEN
    RETURN NULL;
  END IF;

  IF v_tx.order_id IS NULL OR v_tx.store_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_method := COALESCE(
    NULLIF(trim(v_tx.geniuspay_payment_method), ''),
    NULLIF(trim(v_tx.payment_provider), ''),
    'moneyfusion'
  );

  -- Prefer existing row for this order
  SELECT id INTO v_payment_id
  FROM public.payments
  WHERE order_id = v_tx.order_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_payment_id IS NOT NULL THEN
    UPDATE public.payments
    SET
      status = 'completed',
      amount = COALESCE(v_tx.amount, amount),
      currency = COALESCE(v_tx.currency, currency),
      payment_method = COALESCE(v_method, payment_method),
      customer_id = COALESCE(customer_id, v_tx.customer_id),
      transaction_id = p_transaction_id::text,
      updated_at = now()
    WHERE id = v_payment_id;
    RETURN v_payment_id;
  END IF;

  -- Or match by transaction_id text
  SELECT id INTO v_payment_id
  FROM public.payments
  WHERE transaction_id = p_transaction_id::text
  LIMIT 1;

  IF v_payment_id IS NOT NULL THEN
    UPDATE public.payments
    SET
      status = 'completed',
      amount = COALESCE(v_tx.amount, amount),
      order_id = COALESCE(order_id, v_tx.order_id),
      updated_at = now()
    WHERE id = v_payment_id;
    RETURN v_payment_id;
  END IF;

  INSERT INTO public.payments (
    store_id,
    order_id,
    customer_id,
    amount,
    currency,
    status,
    payment_method,
    payment_type,
    transaction_id
  ) VALUES (
    v_tx.store_id,
    v_tx.order_id,
    v_tx.customer_id,
    COALESCE(v_tx.amount, 0),
    COALESCE(v_tx.currency, 'XOF'),
    'completed',
    v_method,
    'full',
    p_transaction_id::text
  )
  RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$;

COMMENT ON FUNCTION public.sync_payment_row_from_transaction(uuid) IS
  'Upsert payments row from a completed PSP transaction (MoneyFusion/GeniusPay). Idempotent.';

GRANT EXECUTE ON FUNCTION public.sync_payment_row_from_transaction(uuid)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Admin sales stats : transactions completed (source of truth)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_sales_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_total_revenue numeric;
  v_total_commissions numeric;
  v_total_count integer;
BEGIN
  SELECT
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(COALESCE(application_fee_amount, 0)), 0),
    COUNT(*)::integer
  INTO
    v_total_revenue,
    v_total_commissions,
    v_total_count
  FROM public.transactions
  WHERE status = 'completed';

  RETURN json_build_object(
    'total_revenue', v_total_revenue,
    'total_commissions', v_total_commissions,
    'total_count', v_total_count,
    'source', 'transactions'
  );
END;
$$;

COMMENT ON FUNCTION public.get_admin_sales_stats() IS
  'Stats admin ventes : agrège transactions.status=completed (rail PSP), pas la table payments legacy.';

COMMIT;
