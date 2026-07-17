-- P1-1 — Hub acheteur unifié : 1 RPC pour timeline + compteurs cross-type
-- Remplace 2+ requêtes client (orders + order_items) par un round-trip SQL.

CREATE OR REPLACE FUNCTION public.get_customer_hub_summary(
  p_limit INT DEFAULT 5,
  p_active_only BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_recent JSONB;
  v_counts JSONB;
  v_active_count INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_limit IS NULL OR p_limit < 1 THEN
    p_limit := 5;
  END IF;
  IF p_limit > 20 THEN
    p_limit := 20;
  END IF;

  WITH buyer_order_scope AS (
    SELECT o.id, o.order_number, o.status, o.payment_status, o.created_at
    FROM public.orders o
    WHERE (
      o.customer_id IN (SELECT c.id FROM public.customers c WHERE c.user_id = v_uid)
      OR o.customer_id = v_uid
    )
      AND (NOT p_active_only OR o.status IS DISTINCT FROM 'completed')
    ORDER BY o.created_at DESC
    LIMIT p_limit
  ),
  order_items_agg AS (
    SELECT
      oi.order_id,
      jsonb_agg(
        jsonb_build_object('product_type', COALESCE(oi.product_type, 'digital'))
        ORDER BY oi.created_at NULLS LAST
      ) AS items
    FROM public.order_items oi
    WHERE oi.order_id IN (SELECT id FROM buyer_order_scope)
    GROUP BY oi.order_id
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', bos.id,
        'order_number', bos.order_number,
        'status', bos.status,
        'payment_status', bos.payment_status,
        'created_at', bos.created_at,
        'items', COALESCE(oia.items, '[]'::jsonb)
      )
      ORDER BY bos.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_recent
  FROM buyer_order_scope bos
  LEFT JOIN order_items_agg oia ON oia.order_id = bos.id;

  SELECT jsonb_build_object(
    'digital', COUNT(*) FILTER (WHERE COALESCE(oi.product_type, p.product_type) = 'digital')::INTEGER,
    'physical', COUNT(*) FILTER (WHERE COALESCE(oi.product_type, p.product_type) = 'physical')::INTEGER,
    'service', COUNT(*) FILTER (WHERE COALESCE(oi.product_type, p.product_type) = 'service')::INTEGER,
    'course', COUNT(*) FILTER (WHERE COALESCE(oi.product_type, p.product_type) = 'course')::INTEGER,
    'artist', COUNT(*) FILTER (WHERE COALESCE(oi.product_type, p.product_type) = 'artist')::INTEGER
  )
  INTO v_counts
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  LEFT JOIN public.products p ON p.id = oi.product_id
  WHERE (
    o.customer_id IN (SELECT c.id FROM public.customers c WHERE c.user_id = v_uid)
    OR o.customer_id = v_uid
  )
    AND o.payment_status IN ('paid', 'completed');

  SELECT COUNT(*)::INTEGER
  INTO v_active_count
  FROM public.orders o
  WHERE (
    o.customer_id IN (SELECT c.id FROM public.customers c WHERE c.user_id = v_uid)
    OR o.customer_id = v_uid
  )
    AND o.status IS DISTINCT FROM 'completed';

  RETURN jsonb_build_object(
    'recentOrders', COALESCE(v_recent, '[]'::jsonb),
    'countsByType', COALESCE(v_counts, jsonb_build_object(
      'digital', 0, 'physical', 0, 'service', 0, 'course', 0, 'artist', 0
    )),
    'activeOrdersCount', COALESCE(v_active_count, 0),
    'generatedAt', NOW()
  );
END;
$$;

COMMENT ON FUNCTION public.get_customer_hub_summary(INT, BOOLEAN) IS
  'Hub acheteur unifié — commandes récentes + compteurs par type (auth.uid).';

GRANT EXECUTE ON FUNCTION public.get_customer_hub_summary(INT, BOOLEAN) TO authenticated;
