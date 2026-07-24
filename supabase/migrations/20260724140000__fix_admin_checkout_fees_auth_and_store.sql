-- Fix admin checkout fees: wrong profiles.id check, missing store_name, paid filter, refunds visibility.

-- 1) View with boutique + payment status + refunded amount
DROP VIEW IF EXISTS public.admin_checkout_platform_fees;

CREATE VIEW public.admin_checkout_platform_fees AS
SELECT
  o.id AS order_id,
  o.order_number,
  o.store_id,
  s.name AS store_name,
  o.currency,
  o.payment_status,
  o.status,
  o.created_at,
  o.total_amount,
  COALESCE(o.refunded_amount, 0) AS refunded_amount,
  COALESCE(
    (o.metadata->>'subtotal')::numeric,
    GREATEST(o.total_amount - public.order_checkout_buyer_fee_amount(o.id), 0)
  ) AS subtotal,
  public.order_checkout_buyer_fee_amount(o.id) AS checkout_fee_amount,
  -- Net fee retained after proportional refund of buyer total (best-effort)
  CASE
    WHEN COALESCE(o.total_amount, 0) <= 0 THEN public.order_checkout_buyer_fee_amount(o.id)
    WHEN COALESCE(o.refunded_amount, 0) <= 0 THEN public.order_checkout_buyer_fee_amount(o.id)
    WHEN COALESCE(o.refunded_amount, 0) >= o.total_amount THEN 0
    ELSE ROUND(
      public.order_checkout_buyer_fee_amount(o.id)
        * (1 - LEAST(COALESCE(o.refunded_amount, 0) / NULLIF(o.total_amount, 0), 1))
      , 2
    )
  END AS checkout_fee_net,
  COALESCE(o.metadata->>'platform_fee_rule', '2pct_plus_100_xof') AS fee_rule,
  o.payment_provider_used
FROM public.orders o
LEFT JOIN public.stores s ON s.id = o.store_id
WHERE public.order_checkout_buyer_fee_amount(o.id) > 0
  AND o.payment_status IN ('paid', 'completed', 'partially_refunded', 'refunded');

COMMENT ON VIEW public.admin_checkout_platform_fees IS
  'Checkout buyer fees (2%+100) with store_name and net fee after refunds.';

GRANT SELECT ON public.admin_checkout_platform_fees TO authenticated, service_role;

-- 2) Summary RPC: auth via profiles.user_id (not profiles.id)
CREATE OR REPLACE FUNCTION public.admin_checkout_fees_summary(
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN := false;
  v_from TIMESTAMPTZ := COALESCE(p_from, now() - interval '90 days');
  v_to TIMESTAMPTZ := COALESCE(p_to, now());
  v_total NUMERIC := 0;
  v_net NUMERIC := 0;
  v_refunded_fees NUMERIC := 0;
  v_count BIGINT := 0;
  v_breakdown JSONB := '[]'::jsonb;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND (
        COALESCE(p.is_super_admin, false) = true
        OR COALESCE(p.role, '') IN ('admin', 'super_admin', 'staff', 'manager')
      )
  ) INTO v_is_admin;

  IF NOT v_is_admin AND auth.role() <> 'service_role' THEN
    -- Fallback: user_roles / has_role if present
    BEGIN
      IF public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') THEN
        v_is_admin := true;
      END IF;
    EXCEPTION WHEN undefined_function THEN
      NULL;
    END;
  END IF;

  IF NOT v_is_admin AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Accès admin requis';
  END IF;

  SELECT
    COALESCE(SUM(checkout_fee_amount), 0),
    COALESCE(SUM(checkout_fee_net), 0),
    COALESCE(SUM(GREATEST(checkout_fee_amount - checkout_fee_net, 0)), 0),
    COUNT(*)
  INTO v_total, v_net, v_refunded_fees, v_count
  FROM public.admin_checkout_platform_fees f
  WHERE f.created_at >= v_from AND f.created_at <= v_to
    AND f.payment_status IN ('paid', 'completed', 'partially_refunded');

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'currency', currency,
        'fees', fees,
        'fees_net', fees_net,
        'orders', orders
      )
      ORDER BY fees DESC
    ),
    '[]'::jsonb
  )
  INTO v_breakdown
  FROM (
    SELECT
      currency,
      COALESCE(SUM(checkout_fee_amount), 0) AS fees,
      COALESCE(SUM(checkout_fee_net), 0) AS fees_net,
      COUNT(*) AS orders
    FROM public.admin_checkout_platform_fees
    WHERE created_at >= v_from AND created_at <= v_to
      AND payment_status IN ('paid', 'completed', 'partially_refunded')
    GROUP BY currency
  ) t;

  RETURN jsonb_build_object(
    'total_fees', v_total,
    'total_fees_net', v_net,
    'refunded_fees', v_refunded_fees,
    'order_count', v_count,
    'currency_breakdown', v_breakdown,
    'from', v_from,
    'to', v_to
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_checkout_fees_summary(TIMESTAMPTZ, TIMESTAMPTZ)
  TO authenticated, service_role;
