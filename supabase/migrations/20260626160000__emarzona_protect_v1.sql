-- Emarzona Protect v1 — couverture acheteur post-paiement + réclamations liées aux litiges

CREATE TABLE IF NOT EXISTS public.order_protect_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  version TEXT NOT NULL DEFAULT 'v1',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'active', 'expired', 'claimed', 'void', 'ineligible')
  ),
  coverage_starts_at TIMESTAMPTZ,
  coverage_ends_at TIMESTAMPTZ,
  dispute_id UUID REFERENCES public.disputes(id) ON DELETE SET NULL,
  ineligible_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_protect_enrollments_store
  ON public.order_protect_enrollments (store_id);

CREATE INDEX IF NOT EXISTS idx_order_protect_enrollments_status
  ON public.order_protect_enrollments (status);

ALTER TABLE public.disputes
  ADD COLUMN IF NOT EXISTS is_emarzona_protect BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.disputes
  ADD COLUMN IF NOT EXISTS protect_reason_code TEXT;

CREATE OR REPLACE FUNCTION public.touch_order_protect_enrollments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_protect_enrollments_updated_at ON public.order_protect_enrollments;
CREATE TRIGGER trg_order_protect_enrollments_updated_at
  BEFORE UPDATE ON public.order_protect_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_order_protect_enrollments_updated_at();

ALTER TABLE public.order_protect_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers view own protect enrollments" ON public.order_protect_enrollments;
CREATE POLICY "Buyers view own protect enrollments"
  ON public.order_protect_enrollments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      LEFT JOIN public.customers c ON c.id = o.customer_id
      WHERE o.id = order_protect_enrollments.order_id
        AND (
          o.customer_id = auth.uid()
          OR (
            c.email IS NOT NULL
            AND lower(btrim(c.email::text)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
            AND coalesce(auth.jwt() ->> 'email', '') <> ''
          )
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = order_protect_enrollments.store_id
        AND s.user_id = auth.uid()
    )
    OR COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
    OR COALESCE(public.is_platform_admin(), false)
  );

DROP POLICY IF EXISTS "Admins manage protect enrollments" ON public.order_protect_enrollments;
CREATE POLICY "Admins manage protect enrollments"
  ON public.order_protect_enrollments
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

GRANT SELECT ON public.order_protect_enrollments TO authenticated;

CREATE OR REPLACE FUNCTION public.emarzona_protect_order_eligibility(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_covered_types TEXT[] := ARRAY['digital', 'physical', 'course', 'artist'];
  v_has_covered BOOLEAN;
  v_service_only BOOLEAN;
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

  IF COALESCE(v_order.total_amount, 0) > 5000000 THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'ORDER_ABOVE_MAX_AMOUNT');
  END IF;

  SELECT
    EXISTS (
      SELECT 1 FROM public.order_items oi
      WHERE oi.order_id = p_order_id
        AND COALESCE(oi.product_type, 'unknown') = ANY (v_covered_types)
    ),
    NOT EXISTS (
      SELECT 1 FROM public.order_items oi
      WHERE oi.order_id = p_order_id
        AND COALESCE(oi.product_type, 'unknown') <> 'service'
    )
      AND EXISTS (
        SELECT 1 FROM public.order_items oi
        WHERE oi.order_id = p_order_id
          AND COALESCE(oi.product_type, 'unknown') = 'service'
      )
  INTO v_has_covered, v_service_only;

  IF v_service_only OR NOT v_has_covered THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'PRODUCT_TYPE_NOT_COVERED');
  END IF;

  RETURN jsonb_build_object('eligible', true);
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
BEGIN
  SELECT o.id, o.store_id INTO v_order FROM public.orders o WHERE o.id = p_order_id;
  IF NOT FOUND THEN RETURN; END IF;

  v_eligibility := public.emarzona_protect_order_eligibility(p_order_id);

  IF COALESCE((v_eligibility->>'eligible')::BOOLEAN, false) = false THEN
    INSERT INTO public.order_protect_enrollments (
      order_id, store_id, status, ineligible_reason
    )
    VALUES (
      p_order_id,
      v_order.store_id,
      'ineligible',
      v_eligibility->>'reason'
    )
    ON CONFLICT (order_id) DO UPDATE SET
      status = 'ineligible',
      ineligible_reason = EXCLUDED.ineligible_reason,
      updated_at = NOW();
    RETURN;
  END IF;

  INSERT INTO public.order_protect_enrollments (
    order_id,
    store_id,
    status,
    coverage_starts_at,
    coverage_ends_at
  )
  VALUES (
    p_order_id,
    v_order.store_id,
    'active',
    v_now,
    v_now + INTERVAL '30 days'
  )
  ON CONFLICT (order_id) DO UPDATE SET
    status = 'active',
    coverage_starts_at = COALESCE(order_protect_enrollments.coverage_starts_at, EXCLUDED.coverage_starts_at),
    coverage_ends_at = EXCLUDED.coverage_ends_at,
    ineligible_reason = NULL,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_activate_emarzona_protect_on_order_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_status IN ('paid', 'completed')
     AND (TG_OP = 'INSERT' OR OLD.payment_status IS DISTINCT FROM NEW.payment_status)
     AND (TG_OP = 'INSERT' OR OLD.payment_status NOT IN ('paid', 'completed')) THEN
    PERFORM public.activate_emarzona_protect_enrollment(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emarzona_protect_on_order_paid ON public.orders;
CREATE TRIGGER trg_emarzona_protect_on_order_paid
  AFTER INSERT OR UPDATE OF payment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_activate_emarzona_protect_on_order_paid();

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
    'version', COALESCE(v_enrollment.version, 'v1'),
    'status', COALESCE(v_enrollment.status, 'none'),
    'coverage_starts_at', v_enrollment.coverage_starts_at,
    'coverage_ends_at', v_enrollment.coverage_ends_at,
    'dispute_id', v_enrollment.dispute_id,
    'ineligible_reason', v_enrollment.ineligible_reason,
    'can_claim', v_can_claim,
    'eligible_on_paid', COALESCE((v_eligibility->>'eligible')::BOOLEAN, false),
    'claim_window_days', 30
  );
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

  RETURN jsonb_build_object(
    'dispute_id', v_dispute_id,
    'enrollment_id', v_enrollment_id,
    'order_id', p_order_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.emarzona_protect_order_eligibility(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_emarzona_protect_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_emarzona_protect_claim(UUID, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON TABLE public.order_protect_enrollments IS
  'Emarzona Protect v1 — couverture acheteur activée à la commande payée (30 jours).';
