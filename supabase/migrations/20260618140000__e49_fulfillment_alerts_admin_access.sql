-- E49 — Accès admin UI pour order_fulfillment_alerts

DROP POLICY IF EXISTS "Admins resolve fulfillment alerts" ON public.order_fulfillment_alerts;
CREATE POLICY "Admins resolve fulfillment alerts"
  ON public.order_fulfillment_alerts FOR UPDATE TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE OR REPLACE FUNCTION public.admin_detect_stale_order_fulfillment(
  p_stale_minutes INTEGER DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: platform admin required';
  END IF;

  RETURN public.detect_stale_order_fulfillment(p_stale_minutes);
END;
$$;

COMMENT ON FUNCTION public.admin_detect_stale_order_fulfillment(INTEGER) IS
  'Scan SLA fulfillment pour le panneau admin (wrapper sécurisé).';

GRANT EXECUTE ON FUNCTION public.admin_detect_stale_order_fulfillment(INTEGER) TO authenticated;
