-- Phase 2 emailing : résolution user_id pour inscriptions séquences + segments basés clients boutique

-- Résout user_id depuis email (client boutique ou compte auth)
CREATE OR REPLACE FUNCTION public.resolve_user_id_for_store_email(
  p_store_id UUID,
  p_email TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_normalized TEXT;
BEGIN
  v_normalized := lower(trim(p_email));
  IF v_normalized IS NULL OR v_normalized = '' THEN
    RETURN NULL;
  END IF;

  SELECT c.user_id INTO v_user_id
  FROM public.customers c
  WHERE c.store_id = p_store_id
    AND lower(trim(c.email)) = v_normalized
    AND c.user_id IS NOT NULL
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    RETURN v_user_id;
  END IF;

  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE lower(trim(u.email)) = v_normalized
  LIMIT 1;

  RETURN v_user_id;
END;
$$;

COMMENT ON FUNCTION public.resolve_user_id_for_store_email IS
  'Résout un user_id pour inscrire un contact (client boutique ou utilisateur auth) à une séquence email';

GRANT EXECUTE ON FUNCTION public.resolve_user_id_for_store_email(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_user_id_for_store_email(UUID, TEXT) TO service_role;

-- Segments dynamiques : critères basés sur les clients de la boutique (pas uniquement auth.users)
CREATE OR REPLACE FUNCTION public.calculate_dynamic_segment_members(
  p_segment_id UUID
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  calculated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_criteria JSONB;
  v_type TEXT;
  v_store_id UUID;
  v_min_orders INTEGER;
  v_min_spent NUMERIC;
  v_has_purchased BOOLEAN;
BEGIN
  SELECT criteria, type, store_id
  INTO v_criteria, v_type, v_store_id
  FROM public.email_segments
  WHERE id = p_segment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Segment not found: %', p_segment_id;
  END IF;

  IF v_type = 'static' THEN
    RETURN;
  END IF;

  v_min_orders := NULLIF(v_criteria->>'min_orders', '')::INTEGER;
  v_min_spent := NULLIF(v_criteria->>'min_total_spent', '')::NUMERIC;
  v_has_purchased := COALESCE((v_criteria->>'has_purchased')::BOOLEAN, FALSE)
    OR (v_min_orders IS NOT NULL AND v_min_orders >= 1);

  RETURN QUERY
  SELECT DISTINCT
    COALESCE(c.user_id, u.id) AS user_id,
    lower(trim(c.email))::TEXT AS email,
    NOW() AS calculated_at
  FROM public.customers c
  LEFT JOIN auth.users u ON lower(trim(u.email)) = lower(trim(c.email))
  WHERE c.store_id = v_store_id
    AND c.email IS NOT NULL
    AND trim(c.email) <> ''
    AND (
      v_criteria->'tags' IS NULL
      OR jsonb_array_length(v_criteria->'tags') = 0
      OR EXISTS (
        SELECT 1
        FROM public.email_user_tags t
        WHERE t.store_id = v_store_id
          AND t.tag = ANY(SELECT jsonb_array_elements_text(v_criteria->'tags'))
          AND (
            (c.user_id IS NOT NULL AND t.user_id = c.user_id)
            OR (u.id IS NOT NULL AND t.user_id = u.id)
          )
      )
    )
    AND (
      v_criteria->'excluded_tags' IS NULL
      OR jsonb_array_length(v_criteria->'excluded_tags') = 0
      OR NOT EXISTS (
        SELECT 1
        FROM public.email_user_tags t
        WHERE t.store_id = v_store_id
          AND t.tag = ANY(SELECT jsonb_array_elements_text(v_criteria->'excluded_tags'))
          AND (
            (c.user_id IS NOT NULL AND t.user_id = c.user_id)
            OR (u.id IS NOT NULL AND t.user_id = u.id)
          )
      )
    )
    AND (
      NOT v_has_purchased
      OR EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.store_id = v_store_id
          AND o.customer_id = c.id
          AND o.payment_status IN ('paid', 'completed')
      )
    )
    AND (
      v_min_orders IS NULL
      OR (
        SELECT COUNT(*)::INTEGER
        FROM public.orders o
        WHERE o.store_id = v_store_id
          AND o.customer_id = c.id
          AND o.payment_status IN ('paid', 'completed')
      ) >= v_min_orders
    )
    AND (
      v_min_spent IS NULL
      OR (
        SELECT COALESCE(SUM(o.total_amount), 0)
        FROM public.orders o
        WHERE o.store_id = v_store_id
          AND o.customer_id = c.id
          AND o.payment_status IN ('paid', 'completed')
      ) >= v_min_spent
    );
END;
$$;

COMMENT ON FUNCTION public.calculate_dynamic_segment_members IS
  'Membres segment dynamique : clients boutique + tags + commandes (Phase 2)';
