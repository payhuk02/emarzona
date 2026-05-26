-- Phase 1 audit œuvre (suite) : RPC éditions, portail acheteur, vérification publique certificat, RLS INSERT

-- ---------------------------------------------------------------------------
-- M-03 : tracking éditions limitées (agrégation SQL, sans scan global orders)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_edition_tracking(p_product_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ap RECORD;
  v_sold INTEGER;
  v_reserved INTEGER;
  v_edition_nums INTEGER[];
BEGIN
  SELECT ap.artwork_edition_type, ap.total_editions
  INTO v_ap
  FROM public.artist_products ap
  WHERE ap.product_id = p_product_id;

  IF NOT FOUND
     OR v_ap.artwork_edition_type IS DISTINCT FROM 'limited_edition'
     OR v_ap.total_editions IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(oi.quantity), 0)::INTEGER
  INTO v_sold
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.product_id = p_product_id
    AND oi.product_type = 'artist'
    AND o.payment_status IN ('paid', 'completed');

  SELECT COALESCE(SUM(oi.quantity), 0)::INTEGER
  INTO v_reserved
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.product_id = p_product_id
    AND oi.product_type = 'artist'
    AND o.payment_status IN ('pending', 'paid', 'completed');

  SELECT COALESCE(
    array_agg(DISTINCT edition_num ORDER BY edition_num),
    ARRAY[]::INTEGER[]
  )
  INTO v_edition_nums
  FROM (
    SELECT (
      CASE
        WHEN jsonb_typeof(oi.metadata->'edition_number') = 'number'
          THEN (oi.metadata->>'edition_number')::INTEGER
        ELSE NULLIF(regexp_replace(oi.metadata->>'edition_number', '[^0-9]', '', 'g'), '')::INTEGER
      END
    ) AS edition_num
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.product_id = p_product_id
      AND oi.product_type = 'artist'
      AND o.payment_status IN ('paid', 'completed')
      AND oi.metadata IS NOT NULL
      AND oi.metadata ? 'edition_number'
  ) sub
  WHERE edition_num IS NOT NULL;

  RETURN jsonb_build_object(
    'product_id', p_product_id,
    'total_editions', v_ap.total_editions,
    'sold_count', v_sold,
    'reserved_count', v_reserved,
    'available_count', GREATEST(v_ap.total_editions - v_reserved, 0),
    'sold_percentage',
      CASE
        WHEN v_ap.total_editions > 0 THEN round((v_sold::NUMERIC / v_ap.total_editions) * 100)
        ELSE 0
      END,
    'sold_edition_numbers', to_jsonb(COALESCE(v_edition_nums, ARRAY[]::INTEGER[]))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_edition_tracking(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_edition_tracking(UUID) TO anon, authenticated;

COMMENT ON FUNCTION public.get_edition_tracking(UUID) IS
  'Statistiques édition limitée pour une œuvre (vendu = paid/completed, réservé = pending+paid+completed).';

-- ---------------------------------------------------------------------------
-- Portail acheteur : commandes artiste (customer_id / email / metadata)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_my_artist_orders()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  user_email text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
BEGIN
  IF uid IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_data ORDER BY sort_at DESC)
    FROM (
      SELECT
        o.created_at AS sort_at,
        jsonb_build_object(
          'id', o.id,
          'order_number', o.order_number,
          'total_amount', o.total_amount,
          'currency', o.currency,
          'payment_status', o.payment_status,
          'created_at', o.created_at,
          'items', COALESCE((
            SELECT jsonb_agg(
              jsonb_build_object(
                'product_name', oi.product_name,
                'product_id', oi.product_id
              )
            )
            FROM public.order_items oi
            WHERE oi.order_id = o.id
              AND oi.product_type = 'artist'
          ), '[]'::jsonb)
        ) AS row_data
      FROM public.orders o
      WHERE EXISTS (
        SELECT 1
        FROM public.order_items oi
        WHERE oi.order_id = o.id
          AND oi.product_type = 'artist'
      )
      AND (
        o.customer_id = uid
        OR EXISTS (
          SELECT 1
          FROM public.customers c
          WHERE c.id = o.customer_id
            AND user_email <> ''
            AND lower(btrim(c.email::text)) = user_email
        )
        OR (
          o.metadata IS NOT NULL
          AND jsonb_typeof(o.metadata) = 'object'
          AND (
            coalesce(o.metadata->>'userId', '') = uid::text
            OR coalesce(o.metadata->>'customerId', '') = uid::text
          )
        )
      )
      ORDER BY o.created_at DESC
      LIMIT 50
    ) sub
  ), '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.list_my_artist_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_my_artist_orders() TO authenticated;

COMMENT ON FUNCTION public.list_my_artist_orders() IS
  'Commandes acheteur contenant des œuvres artiste (auth.uid, customers.email, metadata).';

-- ---------------------------------------------------------------------------
-- Vérification publique certificat (sans exposer PII acheteur)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_artist_certificate_by_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cert RECORD;
  v_code TEXT := upper(btrim(coalesce(p_code, '')));
BEGIN
  IF length(v_code) < 8 THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'invalid_code');
  END IF;

  SELECT
    c.id,
    c.certificate_number,
    c.certificate_type,
    c.edition_number,
    c.total_edition,
    c.artwork_title,
    c.artist_name,
    c.artwork_medium,
    c.artwork_year,
    c.purchase_date,
    c.signed_by_artist,
    c.is_valid,
    c.revoked,
    c.revoked_at,
    c.revoked_reason,
    c.is_generated,
    c.generated_at,
    c.verification_code
  INTO v_cert
  FROM public.artist_product_certificates c
  WHERE c.verification_code = v_code
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  IF v_cert.revoked = TRUE OR v_cert.is_valid = FALSE THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'revoked',
      'certificate_number', v_cert.certificate_number,
      'revoked_at', v_cert.revoked_at,
      'revoked_reason', v_cert.revoked_reason
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'certificate_number', v_cert.certificate_number,
    'certificate_type', v_cert.certificate_type,
    'edition_number', v_cert.edition_number,
    'total_edition', v_cert.total_edition,
    'artwork_title', v_cert.artwork_title,
    'artist_name', v_cert.artist_name,
    'artwork_medium', v_cert.artwork_medium,
    'artwork_year', v_cert.artwork_year,
    'purchase_date', v_cert.purchase_date,
    'signed_by_artist', v_cert.signed_by_artist,
    'is_generated', v_cert.is_generated,
    'generated_at', v_cert.generated_at,
    'verification_code', v_cert.verification_code
  );
END;
$$;

REVOKE ALL ON FUNCTION public.verify_artist_certificate_by_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_artist_certificate_by_code(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.verify_artist_certificate_by_code(TEXT) IS
  'Vérification publique d''un certificat par code (sans email acheteur).';

-- ---------------------------------------------------------------------------
-- M-04 : retirer INSERT ouvert côté authenticated (service_role bypass RLS)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "System can create certificates" ON public.artist_product_certificates;
