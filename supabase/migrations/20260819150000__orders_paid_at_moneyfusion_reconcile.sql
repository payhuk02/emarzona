-- orders.paid_at for fulfillment SLA + webhook sets it atomically

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.paid_at IS
  'Horodatage du premier paiement confirmé (acompte ou total). SLA fulfillment.';

-- Index BEFORE backfill: UPDATE on orders fires triggers; CREATE INDEX in the
-- same transaction then fails with 55006 (pending trigger events).
CREATE INDEX IF NOT EXISTS idx_orders_paid_at_fulfillment
  ON public.orders (paid_at DESC NULLS LAST)
  WHERE payment_status IN ('paid', 'deposit_paid', 'completed');

-- Backfill from completed transactions
UPDATE public.orders o
SET paid_at = t.completed_at
FROM public.transactions t
WHERE t.order_id = o.id
  AND t.status = 'completed'
  AND t.completed_at IS NOT NULL
  AND o.paid_at IS NULL
  AND o.payment_status IN ('paid', 'deposit_paid', 'completed', 'cod_pending');

-- ---------------------------------------------------------------------------
-- Atomic webhook: stamp paid_at when order becomes paid / deposit_paid
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_moneroo_webhook_atomic(
    p_provider text,
    p_external_event_id text,
    p_event_type text,
    p_transaction_id uuid,
    p_payload jsonb,
    p_mapped_status text,
    p_provider_session_id text DEFAULT NULL,
    p_provider_payment_intent_id text DEFAULT NULL,
    p_connected_account_id text DEFAULT NULL,
    p_application_fee_amount numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id uuid;
    v_transaction_status text;
    v_has_physical_product boolean;
    v_paid_order_status text;
    v_payment_status text;
    v_remaining numeric;
    v_checkout_method text;
BEGIN
    BEGIN
        INSERT INTO payment_webhook_events (
            provider,
            external_event_id,
            event_type,
            transaction_id,
            payload,
            processed_at
        ) VALUES (
            p_provider,
            p_external_event_id,
            p_event_type,
            p_transaction_id,
            p_payload,
            now()
        );
    EXCEPTION WHEN unique_violation THEN
        SELECT order_id, status
        INTO v_order_id, v_transaction_status
        FROM transactions
        WHERE id = p_transaction_id;

        RETURN jsonb_build_object(
            'success', false,
            'reason', 'duplicate_webhook',
            'already_completed', v_transaction_status = 'completed',
            'order_id', v_order_id
        );
    END;

    SELECT order_id, status
    INTO v_order_id, v_transaction_status
    FROM transactions
    WHERE id = p_transaction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction not found';
    END IF;

    IF v_transaction_status = 'completed' AND p_mapped_status = 'completed' THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_completed', true,
            'order_id', v_order_id
        );
    END IF;

    UPDATE transactions SET
        status = p_mapped_status,
        completed_at = CASE WHEN p_mapped_status = 'completed' THEN now() ELSE completed_at END,
        updated_at = now(),
        webhook_processed_at = now(),
        last_webhook_payload = p_payload,
        provider_session_id = COALESCE(p_provider_session_id, provider_session_id),
        provider_payment_intent_id = COALESCE(p_provider_payment_intent_id, provider_payment_intent_id),
        connected_account_id = COALESCE(p_connected_account_id, connected_account_id),
        application_fee_amount = COALESCE(p_application_fee_amount, application_fee_amount),
        webhook_attempts = COALESCE(webhook_attempts, 0) + 1
    WHERE id = p_transaction_id;

    IF p_mapped_status = 'completed' AND v_order_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM order_items
            WHERE order_id = v_order_id AND product_type = 'physical'
        ) INTO v_has_physical_product;

        SELECT
            COALESCE(remaining_amount, 0),
            COALESCE(metadata->>'checkout_method', '')
        INTO v_remaining, v_checkout_method
        FROM orders
        WHERE id = v_order_id;

        IF v_has_physical_product THEN
            v_paid_order_status := 'confirmed';
        ELSE
            v_paid_order_status := 'completed';
        END IF;

        IF v_checkout_method = 'guarantee' AND COALESCE(v_remaining, 0) > 0 THEN
            v_payment_status := 'deposit_paid';
        ELSE
            v_payment_status := 'paid';
        END IF;

        UPDATE orders SET
            payment_status = v_payment_status,
            status = v_paid_order_status,
            paid_at = COALESCE(paid_at, now()),
            updated_at = now()
        WHERE id = v_order_id;

        UPDATE payment_webhook_events
        SET order_id = v_order_id
        WHERE provider = p_provider AND external_event_id = p_external_event_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'already_completed', false,
        'order_id', v_order_id
    );
END;
$$;

-- ---------------------------------------------------------------------------
-- SLA fulfillment: use paid_at (fallback updated_at for legacy rows)
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
  v_paid_reference TIMESTAMPTZ;
BEGIN
  v_cutoff := now() - make_interval(mins => GREATEST(1, COALESCE(p_stale_minutes, 5)));

  FOR v_row IN
    SELECT
      o.id,
      o.order_number,
      o.store_id,
      o.updated_at,
      o.paid_at,
      o.metadata
    FROM public.orders o
    WHERE o.payment_status IN ('paid', 'completed', 'deposit_paid')
      AND COALESCE(o.paid_at, o.updated_at) <= v_cutoff
      AND COALESCE(o.paid_at, o.updated_at) >= now() - interval '7 days'
  LOOP
    v_issues := ARRAY[]::TEXT[];
    v_paid_reference := COALESCE(v_row.paid_at, v_row.updated_at);

    IF COALESCE(v_row.metadata->>'post_payment_fulfillment_at', '') = '' THEN
      v_issues := array_append(v_issues, 'edge_fulfillment_pending');
    END IF;

    IF COALESCE(v_row.metadata->>'confirmation_email_sent_at', '') = '' THEN
      v_issues := array_append(v_issues, 'confirmation_email_pending');
    END IF;

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
          'paid_at', v_paid_reference,
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
  'Commandes payées (paid_at) dont le fulfillment dépasse le SLA.';
