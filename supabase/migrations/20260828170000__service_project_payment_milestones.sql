-- P3: Multi-milestone payments for project service orders (delivery_secured)

CREATE TABLE IF NOT EXISTS public.service_order_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  percentage NUMERIC(5, 2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  trigger_type TEXT NOT NULL DEFAULT 'order_placed'
    CHECK (trigger_type IN ('order_placed', 'delivery_approved', 'manual')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'awaiting_payment', 'held', 'released', 'paid', 'cancelled')),
  secured_payment_id UUID REFERENCES public.secured_payments(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_order_milestones_order
  ON public.service_order_milestones (order_id, sort_order);

ALTER TABLE public.service_order_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers view own service milestones" ON public.service_order_milestones;
CREATE POLICY "Buyers view own service milestones"
  ON public.service_order_milestones
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.customers c ON c.id = o.customer_id
      WHERE o.id = service_order_milestones.order_id
        AND lower(trim(c.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

DROP POLICY IF EXISTS "Vendors manage service milestones" ON public.service_order_milestones;
CREATE POLICY "Vendors manage service milestones"
  ON public.service_order_milestones
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.stores s ON s.id = o.store_id
      WHERE o.id = service_order_milestones.order_id
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.stores s ON s.id = o.store_id
      WHERE o.id = service_order_milestones.order_id
        AND s.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.persist_service_order_milestones(
  p_order_id UUID,
  p_milestones JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
  v_idx INTEGER := 0;
  v_inserted INTEGER := 0;
  v_first_id UUID;
BEGIN
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_id requis';
  END IF;

  IF p_milestones IS NULL OR jsonb_typeof(p_milestones) <> 'array' THEN
    RAISE EXCEPTION 'milestones doit être un tableau JSON';
  END IF;

  DELETE FROM public.service_order_milestones WHERE order_id = p_order_id;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_milestones)
  LOOP
    INSERT INTO public.service_order_milestones (
      order_id,
      sort_order,
      label,
      percentage,
      amount,
      trigger_type,
      status
    ) VALUES (
      p_order_id,
      v_idx,
      COALESCE(NULLIF(trim(v_row->>'label'), ''), 'Jalon'),
      COALESCE((v_row->>'percentage')::NUMERIC, 0),
      COALESCE((v_row->>'amount')::NUMERIC, 0),
      COALESCE(NULLIF(v_row->>'trigger', ''), 'order_placed'),
      CASE
        WHEN COALESCE(NULLIF(v_row->>'trigger', ''), 'order_placed') = 'order_placed'
          THEN 'awaiting_payment'
        ELSE 'pending'
      END
    )
    RETURNING id INTO v_first_id;

    v_idx := v_idx + 1;
    v_inserted := v_inserted + 1;
  END LOOP;

  UPDATE public.orders
  SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'project_milestones_enabled', true,
    'project_milestone_count', v_inserted
  )
  WHERE id = p_order_id;

  RETURN jsonb_build_object('inserted', v_inserted, 'order_id', p_order_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.persist_service_order_milestones(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.persist_service_order_milestones(UUID, JSONB) TO service_role;

COMMENT ON TABLE public.service_order_milestones IS
  'Jalons de paiement pour commandes service projet (escrow par étape).';

-- Après paiement checkout : jalons « order_placed » passent en held
CREATE OR REPLACE FUNCTION public.activate_service_order_checkout_milestones(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_id requis';
  END IF;

  UPDATE public.service_order_milestones
  SET status = 'held', updated_at = now()
  WHERE order_id = p_order_id
    AND trigger_type = 'order_placed'
    AND status = 'awaiting_payment';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN jsonb_build_object('updated', v_updated, 'order_id', p_order_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_service_order_checkout_milestones(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_service_order_checkout_milestones(UUID) TO service_role;

-- Confirmation livraison : libère les jalons démarrage, active le solde
CREATE OR REPLACE FUNCTION public.approve_service_project_delivery(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining NUMERIC := 0;
  v_released INTEGER := 0;
  v_activated INTEGER := 0;
BEGIN
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_id requis';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.service_order_milestones WHERE order_id = p_order_id
  ) THEN
    RAISE EXCEPTION 'Aucun jalon pour cette commande';
  END IF;

  UPDATE public.service_order_milestones
  SET status = 'released', released_at = now(), updated_at = now()
  WHERE order_id = p_order_id
    AND trigger_type = 'order_placed'
    AND status IN ('held', 'awaiting_payment');

  GET DIAGNOSTICS v_released = ROW_COUNT;

  UPDATE public.service_order_milestones
  SET status = 'awaiting_payment', updated_at = now()
  WHERE order_id = p_order_id
    AND trigger_type = 'delivery_approved'
    AND status = 'pending';

  GET DIAGNOSTICS v_activated = ROW_COUNT;

  SELECT COALESCE(SUM(amount), 0) INTO v_remaining
  FROM public.service_order_milestones
  WHERE order_id = p_order_id
    AND status = 'awaiting_payment';

  UPDATE public.secured_payments
  SET
    status = 'released',
    released_at = now(),
    updated_at = now()
  WHERE order_id = p_order_id
    AND status = 'held';

  UPDATE public.orders
  SET
    delivery_status = 'confirmed',
    delivery_confirmed_at = now(),
    remaining_amount = v_remaining,
    payment_status = CASE WHEN v_remaining > 0 THEN 'partial' ELSE 'completed' END,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'project_milestone_delivery_approved_at', now()
    ),
    updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'order_id', p_order_id,
    'released_milestones', v_released,
    'activated_milestones', v_activated,
    'remaining_amount', v_remaining
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_service_project_delivery(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_service_project_delivery(UUID) TO service_role;

-- Après paiement du solde jalon : marque les jalons delivery_approved comme payés
CREATE OR REPLACE FUNCTION public.complete_service_milestone_balance_payment(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_id requis';
  END IF;

  UPDATE public.service_order_milestones
  SET status = 'paid', paid_at = now(), updated_at = now()
  WHERE order_id = p_order_id
    AND trigger_type = 'delivery_approved'
    AND status = 'awaiting_payment';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  UPDATE public.orders
  SET
    remaining_amount = 0,
    payment_status = 'completed',
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'project_milestones_completed_at', now()
    ),
    updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('updated', v_updated, 'order_id', p_order_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_service_milestone_balance_payment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_service_milestone_balance_payment(UUID) TO service_role;
