-- Sponsorship payment hardening:
-- 1) activate only from pending_payment (not cancelled)
-- 2) expire abandoned pending_payment checkouts after 7 days

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

  IF v_row.status IS DISTINCT FROM 'pending_payment' THEN
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

CREATE OR REPLACE FUNCTION public.expire_marketplace_sponsorships()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_abandoned INTEGER := 0;
BEGIN
  WITH expired AS (
    UPDATE public.marketplace_sponsorships s
    SET status = 'expired', updated_at = now()
    WHERE s.status = 'active'
      AND s.ends_at IS NOT NULL
      AND s.ends_at <= now()
    RETURNING s.product_id
  )
  SELECT COUNT(*)::integer INTO v_count FROM expired;

  UPDATE public.marketplace_sponsorships s
  SET status = 'cancelled', updated_at = now()
  WHERE s.status = 'pending_payment'
    AND s.source = 'paid_boost'
    AND s.created_at < now() - INTERVAL '7 days';

  GET DIAGNOSTICS v_abandoned = ROW_COUNT;

  RETURN v_count + v_abandoned;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_marketplace_sponsorships() TO service_role;
