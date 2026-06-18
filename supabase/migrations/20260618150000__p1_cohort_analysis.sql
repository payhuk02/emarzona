-- P1 Analytics: cohorte clients vendeur + RPC get_cohort_analysis

CREATE OR REPLACE FUNCTION public.get_cohort_analysis(
  p_start_date TIMESTAMPTZ,
  p_store_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_store_id IS NULL THEN
    RAISE EXCEPTION 'STORE_ID_REQUIRED';
  END IF;

  IF auth.uid() IS NOT NULL
    AND NOT public.is_platform_admin()
    AND NOT EXISTS (
      SELECT 1
      FROM public.stores s
      WHERE s.id = p_store_id
        AND s.user_id = auth.uid()
    ) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  WITH first_orders AS (
    SELECT
      o.customer_id,
      date_trunc('month', MIN(o.created_at)) AS cohort_month,
      MIN(o.created_at) AS first_order_at
    FROM public.orders o
    WHERE o.store_id = p_store_id
      AND o.customer_id IS NOT NULL
      AND o.payment_status = 'paid'
      AND public.is_order_paid_for_revenue(o.status, o.payment_status)
    GROUP BY o.customer_id
  ),
  filtered_cohorts AS (
    SELECT *
    FROM first_orders
    WHERE cohort_month >= date_trunc('month', p_start_date)
  ),
  cohort_stats AS (
    SELECT
      fc.cohort_month,
      COUNT(*)::INTEGER AS total_users,
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1
          FROM public.orders o2
          WHERE o2.customer_id = fc.customer_id
            AND o2.store_id = p_store_id
            AND o2.payment_status = 'paid'
            AND public.is_order_paid_for_revenue(o2.status, o2.payment_status)
            AND o2.created_at > fc.first_order_at
            AND o2.created_at <= fc.first_order_at + INTERVAL '7 days'
        )
      )::INTEGER AS week_1,
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1
          FROM public.orders o2
          WHERE o2.customer_id = fc.customer_id
            AND o2.store_id = p_store_id
            AND o2.payment_status = 'paid'
            AND public.is_order_paid_for_revenue(o2.status, o2.payment_status)
            AND o2.created_at > fc.first_order_at
            AND o2.created_at <= fc.first_order_at + INTERVAL '14 days'
        )
      )::INTEGER AS week_2,
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1
          FROM public.orders o2
          WHERE o2.customer_id = fc.customer_id
            AND o2.store_id = p_store_id
            AND o2.payment_status = 'paid'
            AND public.is_order_paid_for_revenue(o2.status, o2.payment_status)
            AND o2.created_at > fc.first_order_at
            AND o2.created_at <= fc.first_order_at + INTERVAL '28 days'
        )
      )::INTEGER AS week_4,
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1
          FROM public.orders o2
          WHERE o2.customer_id = fc.customer_id
            AND o2.store_id = p_store_id
            AND o2.payment_status = 'paid'
            AND public.is_order_paid_for_revenue(o2.status, o2.payment_status)
            AND o2.created_at > fc.first_order_at
            AND o2.created_at <= fc.first_order_at + INTERVAL '56 days'
        )
      )::INTEGER AS week_8
    FROM filtered_cohorts fc
    GROUP BY fc.cohort_month
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'cohort', to_char(cs.cohort_month, 'YYYY-MM'),
        'totalUsers', cs.total_users,
        'retention', jsonb_build_array(
          jsonb_build_object(
            'week', 1,
            'percentage', ROUND(100.0 * cs.week_1 / NULLIF(cs.total_users, 0), 1)
          ),
          jsonb_build_object(
            'week', 2,
            'percentage', ROUND(100.0 * cs.week_2 / NULLIF(cs.total_users, 0), 1)
          ),
          jsonb_build_object(
            'week', 4,
            'percentage', ROUND(100.0 * cs.week_4 / NULLIF(cs.total_users, 0), 1)
          ),
          jsonb_build_object(
            'week', 8,
            'percentage', ROUND(100.0 * cs.week_8 / NULLIF(cs.total_users, 0), 1)
          )
        )
      )
      ORDER BY cs.cohort_month
    ),
    '[]'::JSONB
  )
  INTO v_result
  FROM cohort_stats cs;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_cohort_analysis(TIMESTAMPTZ, UUID) IS
  'Rétention clients par cohorte mensuelle (réachat cumulé à 1/2/4/8 semaines).';

REVOKE ALL ON FUNCTION public.get_cohort_analysis(TIMESTAMPTZ, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cohort_analysis(TIMESTAMPTZ, UUID) TO authenticated, service_role;
