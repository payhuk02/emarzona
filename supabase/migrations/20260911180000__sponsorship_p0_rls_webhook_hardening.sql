-- P0 sponsorship hardening:
-- 1) Campaign mutations via SECURITY DEFINER RPCs only (no free self-activation via RLS)
-- 2) Events insert via RPC only (drop open WITH CHECK true)
-- 3) activate_marketplace_sponsorship: prefer metadata duration when sku missing

-- ---------------------------------------------------------------------------
-- RLS: marketplace_sponsorships — SELECT only for members; no direct writes
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS msp_sponsorships_insert ON public.marketplace_sponsorships;
DROP POLICY IF EXISTS msp_sponsorships_update ON public.marketplace_sponsorships;

-- Admins may still manage rows directly for support tooling (optional).
DROP POLICY IF EXISTS msp_sponsorships_admin_write ON public.marketplace_sponsorships;
CREATE POLICY msp_sponsorships_admin_write ON public.marketplace_sponsorships
  FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- RLS: marketplace_sponsorship_events — no open INSERT
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS msp_events_insert ON public.marketplace_sponsorship_events;

-- ---------------------------------------------------------------------------
-- activate: duration fallback from metadata when sku_id is NULL
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.activate_marketplace_sponsorship(
  p_sponsorship_id UUID,
  p_payment_ref TEXT DEFAULT NULL
)
RETURNS public.marketplace_sponsorships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.marketplace_sponsorships;
  v_days INTEGER := 7;
BEGIN
  SELECT * INTO v_row
  FROM public.marketplace_sponsorships
  WHERE id = p_sponsorship_id
  FOR UPDATE;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;

  IF v_row.status = 'active' THEN
    RETURN v_row;
  END IF;

  IF v_row.status NOT IN ('pending_payment', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot activate sponsorship in status %', v_row.status;
  END IF;

  IF v_row.sku_id IS NOT NULL THEN
    SELECT COALESCE(sku.duration_days, 7)
    INTO v_days
    FROM public.marketplace_sponsorship_products sku
    WHERE sku.id = v_row.sku_id;
  ELSE
    v_days := COALESCE((v_row.metadata->>'duration_days')::integer, 7);
  END IF;

  v_days := GREATEST(COALESCE(v_days, 7), 1);

  UPDATE public.marketplace_sponsorships
  SET
    status = 'active',
    starts_at = now(),
    ends_at = now() + make_interval(days => v_days),
    payment_ref = COALESCE(p_payment_ref, payment_ref),
    updated_at = now()
  WHERE id = p_sponsorship_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_marketplace_sponsorship(UUID, TEXT) TO service_role;
