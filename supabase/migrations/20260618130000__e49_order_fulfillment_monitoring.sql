-- E49 P0 — Monitoring fulfillment post-paiement (SLA < 5 min)

CREATE TABLE IF NOT EXISTS public.order_fulfillment_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info', 'warning', 'critical')),
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_fulfillment_alerts_order
  ON public.order_fulfillment_alerts(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_fulfillment_alerts_open
  ON public.order_fulfillment_alerts(created_at DESC)
  WHERE resolved_at IS NULL;

ALTER TABLE public.order_fulfillment_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read fulfillment alerts" ON public.order_fulfillment_alerts;
CREATE POLICY "Admins read fulfillment alerts"
  ON public.order_fulfillment_alerts FOR SELECT TO authenticated
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Service role manage fulfillment alerts" ON public.order_fulfillment_alerts;
CREATE POLICY "Service role manage fulfillment alerts"
  ON public.order_fulfillment_alerts FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Détection commandes payées avec fulfillment incomplet (> p_stale_minutes)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.detect_stale_order_fulfillment(
  p_stale_minutes INTEGER DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff TIMESTAMPTZ;
  v_orders JSONB := '[]'::jsonb;
  v_row RECORD;
  v_issues TEXT[];
BEGIN
  v_cutoff := now() - make_interval(mins => GREATEST(1, COALESCE(p_stale_minutes, 5)));

  FOR v_row IN
    SELECT
      o.id,
      o.order_number,
      o.store_id,
      o.updated_at,
      o.metadata
    FROM public.orders o
    WHERE o.payment_status IN ('paid', 'completed')
      AND o.updated_at <= v_cutoff
      AND o.updated_at >= now() - interval '7 days'
  LOOP
    v_issues := ARRAY[]::TEXT[];

    -- Edge / emails post-paiement
    IF COALESCE(v_row.metadata->>'post_payment_fulfillment_at', '') = '' THEN
      v_issues := array_append(v_issues, 'edge_fulfillment_pending');
    END IF;

    IF COALESCE(v_row.metadata->>'confirmation_email_sent_at', '') = '' THEN
      v_issues := array_append(v_issues, 'confirmation_email_pending');
    END IF;

    -- Digital : licence manquante ou inactive
    IF EXISTS (
      SELECT 1
      FROM public.order_items oi
      LEFT JOIN public.digital_licenses dl ON dl.id = oi.license_id
      WHERE oi.order_id = v_row.id
        AND oi.product_type = 'digital'
        AND oi.digital_product_id IS NOT NULL
        AND COALESCE((oi.item_metadata->>'auto_generate_license')::boolean, true)
        AND (
          oi.license_id IS NULL
          OR dl.status IS DISTINCT FROM 'active'
        )
    ) THEN
      v_issues := array_append(v_issues, 'digital_license_missing');
    END IF;

    -- Physique : réservation non commitée
    IF EXISTS (
      SELECT 1
      FROM public.order_items oi
      WHERE oi.order_id = v_row.id
        AND oi.product_type = 'physical'
        AND (oi.item_metadata->>'inventory_id') IS NOT NULL
        AND COALESCE((oi.item_metadata->>'inventory_reserved')::boolean, false)
        AND NOT COALESCE((oi.item_metadata->>'inventory_committed')::boolean, false)
    ) THEN
      v_issues := array_append(v_issues, 'physical_inventory_uncommitted');
    END IF;

    -- Cours : pas d'enrollment lié à la commande
    IF EXISTS (
      SELECT 1
      FROM public.order_items oi
      WHERE oi.order_id = v_row.id
        AND oi.product_type = 'course'
        AND NOT EXISTS (
          SELECT 1
          FROM public.course_enrollments ce
          WHERE ce.order_id = v_row.id
        )
    ) THEN
      v_issues := array_append(v_issues, 'course_enrollment_missing');
    END IF;

    -- Services : booking encore pending
    IF EXISTS (
      SELECT 1
      FROM public.order_items oi
      JOIN public.service_bookings sb ON sb.id = oi.booking_id
      WHERE oi.order_id = v_row.id
        AND oi.product_type = 'service'
        AND sb.status = 'pending'
    ) THEN
      v_issues := array_append(v_issues, 'service_booking_pending');
    END IF;

    -- Artiste : certificat requis mais absent
    IF EXISTS (
      SELECT 1
      FROM public.order_items oi
      JOIN public.artist_products ap
        ON ap.id = NULLIF(oi.item_metadata->>'artist_product_id', '')::uuid
      WHERE oi.order_id = v_row.id
        AND oi.product_type = 'artist'
        AND (oi.item_metadata->>'artist_product_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND (
          ap.certificate_of_authenticity IS TRUE
          OR ap.artwork_edition_type = 'limited_edition'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM public.artist_product_certificates ac
          WHERE ac.order_id = v_row.id
            AND ac.product_id = oi.product_id
        )
    ) THEN
      v_issues := array_append(v_issues, 'artist_certificate_missing');
    END IF;

    IF array_length(v_issues, 1) IS NOT NULL THEN
      v_orders := v_orders || jsonb_build_array(
        jsonb_build_object(
          'order_id', v_row.id,
          'order_number', v_row.order_number,
          'store_id', v_row.store_id,
          'paid_at', v_row.updated_at,
          'issues', to_jsonb(v_issues)
        )
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'stale_minutes', GREATEST(1, COALESCE(p_stale_minutes, 5)),
    'stale_count', jsonb_array_length(v_orders),
    'orders', v_orders,
    'checked_at', now()
  );
END;
$$;

COMMENT ON FUNCTION public.detect_stale_order_fulfillment(INTEGER) IS
  'Liste les commandes payées dont le fulfillment (SQL + edge) dépasse le SLA.';

-- ---------------------------------------------------------------------------
-- Enregistrement alerte + déduplication 1h
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_order_fulfillment_alert(
  p_order_id UUID,
  p_issue_type TEXT,
  p_severity TEXT DEFAULT 'warning',
  p_detail JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.order_fulfillment_alerts
    WHERE order_id = p_order_id
      AND issue_type = p_issue_type
      AND resolved_at IS NULL
      AND created_at >= now() - interval '1 hour'
  ) THEN
    SELECT id INTO v_id
    FROM public.order_fulfillment_alerts
    WHERE order_id = p_order_id
      AND issue_type = p_issue_type
      AND resolved_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
    RETURN v_id;
  END IF;

  INSERT INTO public.order_fulfillment_alerts (order_id, issue_type, severity, detail)
  VALUES (p_order_id, p_issue_type, COALESCE(p_severity, 'warning'), COALESCE(p_detail, '{}'::jsonb))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.detect_stale_order_fulfillment(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_order_fulfillment_alert(UUID, TEXT, TEXT, JSONB) TO service_role;
