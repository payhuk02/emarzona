-- Emarzona Protect v2 — services/enchères, escrow, remboursement admin, rétro-enrollment

CREATE TABLE IF NOT EXISTS public.order_protect_escrow_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL UNIQUE REFERENCES public.disputes(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  amount_held NUMERIC(15, 2) NOT NULL DEFAULT 0,
  amount_refunded NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'held' CHECK (
    status IN ('held', 'refunding', 'refunded', 'released', 'cancelled')
  ),
  resolution TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_protect_escrow_order ON public.order_protect_escrow_holds (order_id);

ALTER TABLE public.order_protect_escrow_holds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage protect escrow" ON public.order_protect_escrow_holds;
CREATE POLICY "Admins manage protect escrow"
  ON public.order_protect_escrow_holds
  FOR ALL
  TO authenticated
  USING (
    COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
    OR COALESCE(public.is_platform_admin(), false)
  )
  WITH CHECK (
    COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
    OR COALESCE(public.is_platform_admin(), false)
  );

GRANT SELECT ON public.order_protect_escrow_holds TO authenticated;

CREATE OR REPLACE FUNCTION public.emarzona_protect_claim_window_days(p_version TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN COALESCE(p_version, 'v2') = 'v2' THEN 45 ELSE 30 END;
$$;

CREATE OR REPLACE FUNCTION public.emarzona_protect_order_eligibility(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_covered_types TEXT[] := ARRAY['digital', 'physical', 'service', 'course', 'artist'];
  v_has_covered BOOLEAN;
  v_max_amount NUMERIC := 10000000;
BEGIN
  SELECT o.id, o.store_id, o.total_amount, o.payment_status, o.status
  INTO v_order
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'ORDER_NOT_FOUND');
  END IF;

  IF v_order.payment_status NOT IN ('paid', 'completed') THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'ORDER_NOT_PAID');
  END IF;

  IF COALESCE(v_order.total_amount, 0) < 1000 THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'ORDER_BELOW_MIN_AMOUNT');
  END IF;

  IF COALESCE(v_order.total_amount, 0) > v_max_amount THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'ORDER_ABOVE_MAX_AMOUNT');
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
      AND COALESCE(oi.product_type, 'unknown') = ANY (v_covered_types)
  )
  INTO v_has_covered;

  IF NOT v_has_covered THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'PRODUCT_TYPE_NOT_COVERED');
  END IF;

  RETURN jsonb_build_object('eligible', true, 'version', 'v2');
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_emarzona_protect_enrollment(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_eligibility JSONB;
  v_now TIMESTAMPTZ := NOW();
  v_window_days INTEGER;
BEGIN
  SELECT o.id, o.store_id INTO v_order FROM public.orders o WHERE o.id = p_order_id;
  IF NOT FOUND THEN RETURN; END IF;

  v_eligibility := public.emarzona_protect_order_eligibility(p_order_id);
  v_window_days := public.emarzona_protect_claim_window_days('v2');

  IF COALESCE((v_eligibility->>'eligible')::BOOLEAN, false) = false THEN
    INSERT INTO public.order_protect_enrollments (
      order_id, store_id, version, status, ineligible_reason
    )
    VALUES (
      p_order_id,
      v_order.store_id,
      'v2',
      'ineligible',
      v_eligibility->>'reason'
    )
    ON CONFLICT (order_id) DO UPDATE SET
      version = 'v2',
      status = 'ineligible',
      ineligible_reason = EXCLUDED.ineligible_reason,
      updated_at = NOW();
    RETURN;
  END IF;

  INSERT INTO public.order_protect_enrollments (
    order_id,
    store_id,
    version,
    status,
    coverage_starts_at,
    coverage_ends_at
  )
  VALUES (
    p_order_id,
    v_order.store_id,
    'v2',
    'active',
    v_now,
    v_now + (v_window_days || ' days')::INTERVAL
  )
  ON CONFLICT (order_id) DO UPDATE SET
    version = 'v2',
    status = 'active',
    coverage_starts_at = COALESCE(order_protect_enrollments.coverage_starts_at, EXCLUDED.coverage_starts_at),
    coverage_ends_at = EXCLUDED.coverage_ends_at,
    ineligible_reason = NULL,
    updated_at = NOW()
  WHERE order_protect_enrollments.status IN ('pending', 'ineligible', 'active');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_emarzona_protect_status(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment RECORD;
  v_can_claim BOOLEAN := false;
  v_eligibility JSONB;
  v_window INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.orders o
    LEFT JOIN public.customers c ON c.id = o.customer_id
    WHERE o.id = p_order_id
      AND (
        o.customer_id = auth.uid()
        OR (
          c.email IS NOT NULL
          AND lower(btrim(c.email::text)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
        )
        OR EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = o.store_id AND s.user_id = auth.uid()
        )
        OR COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
        OR COALESCE(public.is_platform_admin(), false)
      )
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT * INTO v_enrollment
  FROM public.order_protect_enrollments e
  WHERE e.order_id = p_order_id;

  v_eligibility := public.emarzona_protect_order_eligibility(p_order_id);
  v_window := public.emarzona_protect_claim_window_days(COALESCE(v_enrollment.version, 'v2'));

  IF FOUND THEN
    IF v_enrollment.status = 'active'
       AND v_enrollment.coverage_ends_at IS NOT NULL
       AND v_enrollment.coverage_ends_at >= NOW()
       AND v_enrollment.dispute_id IS NULL THEN
      v_can_claim := true;
    ELSIF v_enrollment.status = 'active'
          AND v_enrollment.coverage_ends_at IS NOT NULL
          AND v_enrollment.coverage_ends_at < NOW() THEN
      UPDATE public.order_protect_enrollments
      SET status = 'expired', updated_at = NOW()
      WHERE id = v_enrollment.id;
      v_enrollment.status := 'expired';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'order_id', p_order_id,
    'version', COALESCE(v_enrollment.version, 'v2'),
    'status', COALESCE(v_enrollment.status, 'none'),
    'coverage_starts_at', v_enrollment.coverage_starts_at,
    'coverage_ends_at', v_enrollment.coverage_ends_at,
    'dispute_id', v_enrollment.dispute_id,
    'ineligible_reason', v_enrollment.ineligible_reason,
    'can_claim', v_can_claim,
    'eligible_on_paid', COALESCE((v_eligibility->>'eligible')::BOOLEAN, false),
    'claim_window_days', v_window
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_emarzona_protect_escrow_hold(p_dispute_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dispute RECORD;
  v_tx RECORD;
  v_order_amount NUMERIC;
  v_refundable NUMERIC;
  v_hold_id UUID;
BEGIN
  SELECT d.id, d.order_id INTO v_dispute
  FROM public.disputes d
  WHERE d.id = p_dispute_id AND d.is_emarzona_protect = true;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT o.total_amount INTO v_order_amount
  FROM public.orders o WHERE o.id = v_dispute.order_id;

  SELECT t.id, t.amount, COALESCE(t.refunded_amount, t.moneroo_refund_amount, 0) AS refunded
  INTO v_tx
  FROM public.transactions t
  WHERE t.order_id = v_dispute.order_id
    AND t.status IN ('completed', 'partially_refunded')
  ORDER BY t.created_at DESC
  LIMIT 1;

  v_refundable := GREATEST(
    COALESCE(v_tx.amount, v_order_amount, 0) - COALESCE(v_tx.refunded, 0),
    0
  );

  INSERT INTO public.order_protect_escrow_holds (
    dispute_id,
    order_id,
    transaction_id,
    amount_held,
    status,
    metadata
  )
  VALUES (
    p_dispute_id,
    v_dispute.order_id,
    v_tx.id,
    v_refundable,
    CASE WHEN v_refundable > 0 THEN 'held' ELSE 'cancelled' END,
    jsonb_build_object(
      'escrow_mode', 'v2',
      'no_transaction', v_tx.id IS NULL
    )
  )
  ON CONFLICT (dispute_id) DO NOTHING
  RETURNING id INTO v_hold_id;

  RETURN v_hold_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_emarzona_protect_claim(
  p_order_id UUID,
  p_subject TEXT,
  p_description TEXT,
  p_reason_code TEXT DEFAULT 'other'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status JSONB;
  v_dispute_id UUID;
  v_enrollment_id UUID;
  v_escrow_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF char_length(btrim(COALESCE(p_subject, ''))) < 5 THEN
    RAISE EXCEPTION 'Subject too short';
  END IF;

  IF char_length(btrim(COALESCE(p_description, ''))) < 20 THEN
    RAISE EXCEPTION 'Description too short';
  END IF;

  v_status := public.get_emarzona_protect_status(p_order_id);

  IF COALESCE((v_status->>'can_claim')::BOOLEAN, false) = false THEN
    RAISE EXCEPTION 'Protect claim not available: %', COALESCE(v_status->>'status', 'unknown');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.disputes d
    WHERE d.order_id = p_order_id
      AND d.status NOT IN ('resolved', 'closed')
  ) THEN
    RAISE EXCEPTION 'An open dispute already exists for this order';
  END IF;

  INSERT INTO public.disputes (
    order_id,
    initiator_id,
    initiator_type,
    subject,
    description,
    status,
    priority,
    is_emarzona_protect,
    protect_reason_code
  )
  VALUES (
    p_order_id,
    auth.uid(),
    'customer',
    btrim(p_subject),
    btrim(p_description),
    'open',
    'high',
    true,
    NULLIF(btrim(p_reason_code), '')
  )
  RETURNING id INTO v_dispute_id;

  UPDATE public.order_protect_enrollments
  SET status = 'claimed', dispute_id = v_dispute_id, updated_at = NOW()
  WHERE order_id = p_order_id
  RETURNING id INTO v_enrollment_id;

  v_escrow_id := public.create_emarzona_protect_escrow_hold(v_dispute_id);

  RETURN jsonb_build_object(
    'dispute_id', v_dispute_id,
    'enrollment_id', v_enrollment_id,
    'escrow_hold_id', v_escrow_id,
    'order_id', p_order_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_emarzona_protect_dispute(
  p_dispute_id UUID,
  p_resolution TEXT,
  p_refund_amount NUMERIC DEFAULT NULL,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dispute RECORD;
  v_hold RECORD;
  v_tx RECORD;
  v_refund NUMERIC := NULL;
  v_refund_result JSONB := NULL;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (
    COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
    OR COALESCE(public.is_platform_admin(), false)
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_dispute
  FROM public.disputes d
  WHERE d.id = p_dispute_id AND d.is_emarzona_protect = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Protect dispute not found';
  END IF;

  IF v_dispute.status IN ('resolved', 'closed') THEN
    RAISE EXCEPTION 'Dispute already closed';
  END IF;

  SELECT * INTO v_hold
  FROM public.order_protect_escrow_holds h
  WHERE h.dispute_id = p_dispute_id;

  IF p_resolution IN ('refund_full', 'refund_partial') THEN
    IF v_hold.transaction_id IS NULL THEN
      RAISE EXCEPTION 'No refundable transaction linked to this Protect dispute';
    END IF;

    SELECT * INTO v_tx FROM public.transactions WHERE id = v_hold.transaction_id;

    IF p_resolution = 'refund_full' THEN
      v_refund := GREATEST(
        COALESCE(v_tx.amount, 0) - COALESCE(v_tx.refunded_amount, v_tx.moneroo_refund_amount, 0),
        0
      );
    ELSE
      v_refund := COALESCE(p_refund_amount, 0);
    END IF;

    IF v_refund <= 0 THEN
      RAISE EXCEPTION 'Invalid refund amount';
    END IF;

    UPDATE public.order_protect_escrow_holds
    SET status = 'refunding', updated_at = v_now
    WHERE id = v_hold.id;

    v_refund_result := public.apply_transaction_refund(
      v_hold.transaction_id,
      v_refund,
      'protect_' || p_dispute_id::TEXT,
      'emarzona_protect',
      'Emarzona Protect v2 — ' || p_resolution,
      jsonb_build_object('dispute_id', p_dispute_id, 'resolution', p_resolution)
    );

    UPDATE public.order_protect_escrow_holds
    SET
      status = 'refunded',
      amount_refunded = v_refund,
      resolution = p_resolution,
      resolved_by = auth.uid(),
      resolved_at = v_now,
      updated_at = v_now,
      metadata = metadata || jsonb_build_object('refund_result', v_refund_result)
    WHERE id = v_hold.id;

    UPDATE public.disputes
    SET
      status = 'resolved',
      resolution = 'Remboursement Protect (' || p_resolution || ')',
      admin_notes = COALESCE(p_admin_notes, admin_notes),
      resolved_at = v_now,
      updated_at = v_now
    WHERE id = p_dispute_id;

  ELSIF p_resolution = 'release_seller' THEN
    UPDATE public.order_protect_escrow_holds
    SET
      status = 'released',
      resolution = p_resolution,
      resolved_by = auth.uid(),
      resolved_at = v_now,
      updated_at = v_now
  WHERE id = v_hold.id;

    UPDATE public.disputes
    SET
      status = 'resolved',
      resolution = 'Fonds libérés au vendeur (Protect)',
      admin_notes = COALESCE(p_admin_notes, admin_notes),
      resolved_at = v_now,
      updated_at = v_now
    WHERE id = p_dispute_id;
  ELSE
    RAISE EXCEPTION 'Invalid resolution: %', p_resolution;
  END IF;

  RETURN jsonb_build_object(
    'dispute_id', p_dispute_id,
    'resolution', p_resolution,
    'refund_amount', v_refund,
    'refund_result', v_refund_result
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.backfill_emarzona_protect_enrollments(
  p_days_back INTEGER DEFAULT 365,
  p_limit INTEGER DEFAULT 500,
  p_reconcile_ineligible BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_activated INTEGER := 0;
  v_reconciled INTEGER := 0;
  v_days INTEGER;
  v_limit INTEGER;
BEGIN
  IF NOT (
    COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
    OR COALESCE(public.is_platform_admin(), false)
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  v_days := GREATEST(COALESCE(p_days_back, 365), 1);
  v_limit := LEAST(GREATEST(COALESCE(p_limit, 500), 1), 5000);

  FOR v_order_id IN
    SELECT o.id
    FROM public.orders o
    WHERE o.payment_status IN ('paid', 'completed')
      AND o.created_at >= NOW() - (v_days || ' days')::INTERVAL
      AND NOT EXISTS (
        SELECT 1 FROM public.order_protect_enrollments e WHERE e.order_id = o.id
      )
    ORDER BY o.created_at DESC
    LIMIT v_limit
  LOOP
    PERFORM public.activate_emarzona_protect_enrollment(v_order_id);
    v_activated := v_activated + 1;
  END LOOP;

  IF p_reconcile_ineligible THEN
    FOR v_order_id IN
      SELECT e.order_id
      FROM public.order_protect_enrollments e
      WHERE e.status = 'ineligible'
        AND e.ineligible_reason = 'PRODUCT_TYPE_NOT_COVERED'
      LIMIT v_limit
    LOOP
      DELETE FROM public.order_protect_enrollments WHERE order_id = v_order_id;
      PERFORM public.activate_emarzona_protect_enrollment(v_order_id);
      v_reconciled := v_reconciled + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'activated', v_activated,
    'reconciled', v_reconciled,
    'days_back', v_days
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_disputes(
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_status text DEFAULT NULL,
  p_initiator_type text DEFAULT NULL,
  p_assigned_admin_id uuid DEFAULT NULL,
  p_priority text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_sort_by text DEFAULT 'created_at',
  p_sort_asc boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total bigint;
  v_rows jsonb;
  v_sort_column text;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  v_sort_column := CASE p_sort_by
    WHEN 'status' THEN 'status'
    WHEN 'subject' THEN 'subject'
    WHEN 'order_id' THEN 'order_id'
    ELSE 'created_at'
  END;

  SELECT count(*)
  INTO v_total
  FROM public.disputes d
  WHERE (p_status IS NULL OR d.status = p_status)
    AND (p_initiator_type IS NULL OR d.initiator_type = p_initiator_type)
    AND (p_assigned_admin_id IS NULL OR d.assigned_admin_id = p_assigned_admin_id)
    AND (p_priority IS NULL OR d.priority = p_priority)
    AND (
      p_search IS NULL
      OR btrim(p_search) = ''
      OR d.subject ILIKE '%' || p_search || '%'
      OR d.description ILIKE '%' || p_search || '%'
      OR d.order_id::text ILIKE '%' || p_search || '%'
    );

  EXECUTE format(
    $sql$
      SELECT coalesce(jsonb_agg(row_to_json(q)), '[]'::jsonb)
      FROM (
        SELECT
          d.id,
          d.order_id,
          d.status,
          d.priority,
          d.initiator_type,
          d.assigned_admin_id,
          d.subject,
          d.description,
          d.is_emarzona_protect,
          d.protect_reason_code,
          d.created_at,
          d.updated_at
        FROM public.disputes d
        WHERE ($1 IS NULL OR d.status = $1)
          AND ($2 IS NULL OR d.initiator_type = $2)
          AND ($3 IS NULL OR d.assigned_admin_id = $3)
          AND ($4 IS NULL OR d.priority = $4)
          AND (
            $5 IS NULL
            OR btrim($5) = ''
            OR d.subject ILIKE '%%' || $5 || '%%'
            OR d.description ILIKE '%%' || $5 || '%%'
            OR d.order_id::text ILIKE '%%' || $5 || '%%'
          )
        ORDER BY %I %s
        LIMIT $6 OFFSET $7
      ) q
    $sql$,
    v_sort_column,
    CASE WHEN p_sort_asc THEN 'ASC' ELSE 'DESC' END
  )
  INTO v_rows
  USING p_status, p_initiator_type, p_assigned_admin_id, p_priority, p_search, p_limit, p_offset;

  RETURN jsonb_build_object('data', v_rows, 'count', v_total);
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_emarzona_protect_dispute(UUID, TEXT, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_emarzona_protect_enrollments(INTEGER, INTEGER, BOOLEAN) TO authenticated;

COMMENT ON TABLE public.order_protect_escrow_holds IS
  'Emarzona Protect v2 — séquestre logique lié au litige Protect (remboursement via apply_transaction_refund).';
