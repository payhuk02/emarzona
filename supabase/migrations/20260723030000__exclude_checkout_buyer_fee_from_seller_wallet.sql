-- P0-A: exclude checkout buyer platform fee (2%+100) from seller wallet revenue.
-- orders.total_amount includes the fee; store_earnings must credit only the merchant subtotal.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Resolve checkout buyer fee for an order
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.order_checkout_buyer_fee_amount(p_order_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total NUMERIC := 0;
  v_meta JSONB;
  v_fee NUMERIC;
  v_subtotal NUMERIC;
  v_items NUMERIC := 0;
BEGIN
  SELECT COALESCE(o.total_amount, 0), COALESCE(o.metadata, '{}'::jsonb)
  INTO v_total, v_meta
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Preferred: explicit fee written by checkout RPCs
  BEGIN
    v_fee := (v_meta->>'platform_fee')::numeric;
  EXCEPTION WHEN OTHERS THEN
    v_fee := NULL;
  END;

  IF v_fee IS NOT NULL AND v_fee > 0 THEN
    RETURN LEAST(v_fee, GREATEST(v_total, 0));
  END IF;

  -- Explicit subtotal → fee = total − subtotal
  BEGIN
    v_subtotal := (v_meta->>'subtotal')::numeric;
  EXCEPTION WHEN OTHERS THEN
    v_subtotal := NULL;
  END;

  IF v_subtotal IS NOT NULL AND v_total > v_subtotal THEN
    RETURN GREATEST(v_total - v_subtotal, 0);
  END IF;

  -- Fallback when only platform_fee_rule is set (course/artist hotfix paths):
  -- infer fee from total − sum(order_items).
  IF COALESCE(NULLIF(trim(v_meta->>'platform_fee_rule'), ''), '') <> '' THEN
    SELECT COALESCE(SUM(
      COALESCE(
        NULLIF(oi.total_price, 0),
        COALESCE(oi.quantity, 1) * COALESCE(oi.unit_price, 0),
        0
      )
    ), 0)
    INTO v_items
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id;

    IF v_total > v_items THEN
      RETURN GREATEST(v_total - v_items, 0);
    END IF;
  END IF;

  RETURN 0;
END;
$$;

COMMENT ON FUNCTION public.order_checkout_buyer_fee_amount(UUID) IS
  'Checkout buyer fee (2%+100) embedded in orders.total_amount — not seller revenue.';

GRANT EXECUTE ON FUNCTION public.order_checkout_buyer_fee_amount(UUID)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Seller-attributable net revenue excludes buyer fee
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.order_net_revenue_amount(p_order_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(
    COALESCE(o.total_amount, 0)
      - public.order_checkout_buyer_fee_amount(o.id)
      - COALESCE(o.refunded_amount, 0),
    0
  )
  FROM public.orders o
  WHERE o.id = p_order_id;
$$;

COMMENT ON FUNCTION public.order_net_revenue_amount(UUID) IS
  'Seller-attributable net: total − checkout buyer fee − refunds (never negative).';

-- ---------------------------------------------------------------------------
-- 3. Admin fee view: also surface inferred fees (rule without platform_fee key)
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.admin_checkout_platform_fees;

CREATE VIEW public.admin_checkout_platform_fees AS
SELECT
  o.id AS order_id,
  o.order_number,
  o.store_id,
  o.currency,
  o.payment_status,
  o.status,
  o.created_at,
  o.total_amount,
  COALESCE(
    (o.metadata->>'subtotal')::numeric,
    GREATEST(o.total_amount - public.order_checkout_buyer_fee_amount(o.id), 0)
  ) AS subtotal,
  public.order_checkout_buyer_fee_amount(o.id) AS checkout_fee_amount,
  COALESCE(o.metadata->>'platform_fee_rule', '2pct_plus_100_xof') AS fee_rule,
  o.payment_provider_used
FROM public.orders o
WHERE public.order_checkout_buyer_fee_amount(o.id) > 0
ORDER BY o.created_at DESC;

COMMENT ON VIEW public.admin_checkout_platform_fees IS
  'Checkout buyer fees (2%+100) collected on paid/pending orders — platform revenue, not seller wallet.';

GRANT SELECT ON public.admin_checkout_platform_fees TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Recompute all store wallets with the corrected revenue formula
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT store_id
    FROM public.store_earnings
    WHERE store_id IS NOT NULL
  LOOP
    BEGIN
      PERFORM public.update_store_earnings(r.store_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'update_store_earnings skipped for %: %', r.store_id, SQLERRM;
    END;
  END LOOP;

  -- Also refresh stores that have eligible orders but no earnings row yet
  FOR r IN
    SELECT DISTINCT o.store_id
    FROM public.orders o
    WHERE public.is_order_eligible_for_revenue(o.status, o.payment_status)
      AND NOT EXISTS (
        SELECT 1 FROM public.store_earnings se WHERE se.store_id = o.store_id
      )
  LOOP
    BEGIN
      PERFORM public.update_store_earnings(r.store_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'update_store_earnings (seed) skipped for %: %', r.store_id, SQLERRM;
    END;
  END LOOP;
END;
$$;

COMMIT;
