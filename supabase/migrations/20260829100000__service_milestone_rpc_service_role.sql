-- Autorise service_role (edge functions, E2E admin) sur persist / approve

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
  v_role TEXT := coalesce(auth.jwt() ->> 'role', current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_id requis';
  END IF;

  IF v_role IS DISTINCT FROM 'service_role'
    AND NOT EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.stores s ON s.id = o.store_id
      WHERE o.id = p_order_id
        AND s.user_id = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.customers c ON c.id = o.customer_id
      WHERE o.id = p_order_id
        AND lower(trim(c.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    ) THEN
    RAISE EXCEPTION 'Accès refusé pour cette commande';
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
  v_role TEXT := coalesce(auth.jwt() ->> 'role', current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_id requis';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.service_order_milestones WHERE order_id = p_order_id
  ) THEN
    RAISE EXCEPTION 'Aucun jalon pour cette commande';
  END IF;

  IF v_role IS DISTINCT FROM 'service_role'
    AND NOT EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.stores s ON s.id = o.store_id
      WHERE o.id = p_order_id
        AND s.user_id = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.customers c ON c.id = o.customer_id
      WHERE o.id = p_order_id
        AND lower(trim(c.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    ) THEN
    RAISE EXCEPTION 'Accès refusé pour cette commande';
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
