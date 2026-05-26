-- Observabilité audit œuvre + backfill is_public sur certificats existants

-- ---------------------------------------------------------------------------
-- Backfill : certificats vérifiables publiquement
-- ---------------------------------------------------------------------------
UPDATE public.artist_product_certificates
SET
  is_public = true,
  updated_at = now()
WHERE verification_code IS NOT NULL
  AND COALESCE(is_valid, true) = true
  AND COALESCE(revoked, false) = false
  AND is_public IS DISTINCT FROM true;

-- ---------------------------------------------------------------------------
-- Journal d'événements fulfillment (certificats, éditions, enchères)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.artist_fulfillment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warn', 'error')),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  artist_product_id UUID REFERENCES public.artist_products(id) ON DELETE SET NULL,
  auction_id UUID REFERENCES public.artist_product_auctions(id) ON DELETE SET NULL,
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_artist_fulfillment_events_type_created
  ON public.artist_fulfillment_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_artist_fulfillment_events_severity_created
  ON public.artist_fulfillment_events (severity, created_at DESC)
  WHERE severity = 'error';

ALTER TABLE public.artist_fulfillment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read artist fulfillment events" ON public.artist_fulfillment_events;
CREATE POLICY "Admins read artist fulfillment events"
  ON public.artist_fulfillment_events
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.artist_fulfillment_events IS
  'Journal observabilité : certificats post-paiement, conflits éditions, enchères.';

-- ---------------------------------------------------------------------------
-- Helper insert (service_role / SECURITY DEFINER)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_artist_fulfillment_event(
  p_event_type TEXT,
  p_severity TEXT DEFAULT 'info',
  p_order_id UUID DEFAULT NULL,
  p_product_id UUID DEFAULT NULL,
  p_artist_product_id UUID DEFAULT NULL,
  p_auction_id UUID DEFAULT NULL,
  p_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.artist_fulfillment_events (
    event_type,
    severity,
    order_id,
    product_id,
    artist_product_id,
    auction_id,
    message,
    metadata
  )
  VALUES (
    p_event_type,
    COALESCE(NULLIF(btrim(p_severity), ''), 'info'),
    p_order_id,
    p_product_id,
    p_artist_product_id,
    p_auction_id,
    p_message,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_artist_fulfillment_event(TEXT, TEXT, UUID, UUID, UUID, UUID, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_artist_fulfillment_event(TEXT, TEXT, UUID, UUID, UUID, UUID, TEXT, JSONB) TO service_role;

-- ---------------------------------------------------------------------------
-- KPIs santé audit œuvre (admins)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_artist_audit_health(p_days INTEGER DEFAULT 7)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days INTEGER := GREATEST(COALESCE(p_days, 7), 1);
  v_since TIMESTAMPTZ := now() - (v_days || ' days')::interval;
  v_eligible BIGINT;
  v_generated BIGINT;
  v_cert_errors BIGINT;
  v_edition_conflicts BIGINT;
  v_auctions_ended BIGINT;
  v_auctions_no_winner_order BIGINT;
  v_auction_notify_errors BIGINT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  SELECT COUNT(DISTINCT o.id)
  INTO v_eligible
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  JOIN public.artist_products ap ON ap.product_id = oi.product_id
  WHERE oi.product_type = 'artist'
    AND o.payment_status IN ('paid', 'completed')
    AND o.created_at >= v_since
    AND (
      ap.certificate_of_authenticity = true
      OR ap.artwork_edition_type = 'limited_edition'
    );

  SELECT COUNT(DISTINCT c.order_id)
  INTO v_generated
  FROM public.artist_product_certificates c
  JOIN public.orders o ON o.id = c.order_id
  WHERE c.is_generated = true
    AND o.created_at >= v_since;

  SELECT COUNT(*)
  INTO v_cert_errors
  FROM public.artist_fulfillment_events e
  WHERE e.created_at >= v_since
    AND e.severity = 'error'
    AND e.event_type LIKE 'certificate.%';

  SELECT COUNT(*)
  INTO v_edition_conflicts
  FROM public.artist_fulfillment_events e
  WHERE e.created_at >= v_since
    AND e.event_type = 'edition.reservation_failed';

  SELECT COUNT(*)
  INTO v_auctions_ended
  FROM public.artist_product_auctions a
  WHERE a.status IN ('sold', 'ended', 'closed')
    AND a.updated_at >= v_since;

  SELECT COUNT(*)
  INTO v_auctions_no_winner_order
  FROM public.artist_product_auctions a
  WHERE a.status = 'sold'
    AND a.winning_bid_id IS NOT NULL
    AND a.winner_checkout_order_id IS NULL
    AND a.updated_at >= v_since;

  SELECT COUNT(*)
  INTO v_auction_notify_errors
  FROM public.artist_fulfillment_events e
  WHERE e.created_at >= v_since
    AND e.severity = 'error'
    AND e.event_type LIKE 'auction.%';

  RETURN jsonb_build_object(
    'as_of', now(),
    'period_days', v_days,
    'certificates', jsonb_build_object(
      'eligible_paid_orders', v_eligible,
      'generated_with_pdf', v_generated,
      'generation_rate_pct',
        CASE WHEN v_eligible > 0 THEN round((v_generated::numeric / v_eligible) * 100, 2) ELSE NULL END,
      'target_rate_pct', 99,
      'errors', v_cert_errors
    ),
    'editions', jsonb_build_object(
      'reservation_failures', v_edition_conflicts,
      'oversell_risks', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'product_id', sub.product_id,
          'total_editions', sub.total_editions,
          'reserved', sub.reserved,
          'oversell', sub.reserved > sub.total_editions
        ))
        FROM (
          SELECT
            ap.product_id,
            ap.total_editions,
            COALESCE((
              SELECT SUM(oi.quantity)
              FROM public.order_items oi
              JOIN public.orders o ON o.id = oi.order_id
              WHERE oi.product_id = ap.product_id
                AND oi.product_type = 'artist'
                AND o.payment_status IN ('pending', 'paid', 'completed')
            ), 0)::INTEGER AS reserved
          FROM public.artist_products ap
          WHERE ap.artwork_edition_type = 'limited_edition'
            AND ap.total_editions IS NOT NULL
        ) sub
        WHERE sub.reserved > sub.total_editions
      ), '[]'::jsonb)
    ),
    'auctions', jsonb_build_object(
      'ended_or_sold', v_auctions_ended,
      'sold_without_checkout_order', v_auctions_no_winner_order,
      'notification_errors', v_auction_notify_errors
    ),
    'recent_errors', COALESCE((
      SELECT jsonb_agg(sub.obj ORDER BY sub.created_at DESC)
      FROM (
        SELECT
          e.created_at,
          jsonb_build_object(
            'id', e.id,
            'event_type', e.event_type,
            'message', e.message,
            'order_id', e.order_id,
            'product_id', e.product_id,
            'auction_id', e.auction_id,
            'created_at', e.created_at
          ) AS obj
        FROM public.artist_fulfillment_events e
        WHERE e.severity = 'error'
          AND e.created_at >= v_since
        ORDER BY e.created_at DESC
        LIMIT 25
      ) sub
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_artist_audit_health(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_artist_audit_health(INTEGER) TO authenticated;

COMMENT ON FUNCTION public.get_artist_audit_health(INTEGER) IS
  'KPIs audit œuvre (certificats, éditions, enchères) — réservé aux admins.';
