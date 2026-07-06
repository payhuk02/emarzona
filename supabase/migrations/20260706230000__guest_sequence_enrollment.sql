-- Phase 3: enrollments invités séquences email (post-checkout guest)

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Schema: recipient_email + user_id nullable
-- ---------------------------------------------------------------------------
ALTER TABLE public.email_sequence_enrollments
  ADD COLUMN IF NOT EXISTS recipient_email TEXT;

ALTER TABLE public.email_sequence_enrollments
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.email_sequence_enrollments
  DROP CONSTRAINT IF EXISTS unique_sequence_user;

ALTER TABLE public.email_sequence_enrollments
  DROP CONSTRAINT IF EXISTS enrollments_identity_check;

ALTER TABLE public.email_sequence_enrollments
  ADD CONSTRAINT enrollments_identity_check CHECK (
    user_id IS NOT NULL
    OR (recipient_email IS NOT NULL AND trim(recipient_email) <> '')
  );

CREATE UNIQUE INDEX IF NOT EXISTS unique_sequence_enrollment_user
  ON public.email_sequence_enrollments (sequence_id, user_id)
  WHERE user_id IS NOT NULL AND status <> 'cancelled';

CREATE UNIQUE INDEX IF NOT EXISTS unique_sequence_enrollment_email
  ON public.email_sequence_enrollments (sequence_id, lower(recipient_email))
  WHERE recipient_email IS NOT NULL AND user_id IS NULL AND status <> 'cancelled';

CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_recipient_email
  ON public.email_sequence_enrollments (lower(recipient_email))
  WHERE recipient_email IS NOT NULL;

COMMENT ON COLUMN public.email_sequence_enrollments.recipient_email IS
  'Email du contact invité (sans compte auth). Mutuellement exclusif avec user_id.';

-- ---------------------------------------------------------------------------
-- 2. enroll_email_in_sequence — inscription par email (guest)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enroll_email_in_sequence(
  p_sequence_id UUID,
  p_email TEXT,
  p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment_id UUID;
  v_normalized TEXT;
  v_first_step INTEGER;
  v_first_step_delay INTEGER;
  v_first_step_delay_type TEXT;
  v_next_email_at TIMESTAMPTZ;
BEGIN
  v_normalized := lower(trim(p_email));
  IF v_normalized IS NULL OR v_normalized = '' OR position('@' in v_normalized) = 0 THEN
    RAISE EXCEPTION 'Invalid email for sequence enrollment';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.email_sequences
    WHERE id = p_sequence_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Sequence not found or not active: %', p_sequence_id;
  END IF;

  -- Déjà inscrit via user_id avec le même email
  SELECT e.id INTO v_enrollment_id
  FROM public.email_sequence_enrollments e
  JOIN auth.users u ON u.id = e.user_id
  WHERE e.sequence_id = p_sequence_id
    AND lower(trim(u.email)) = v_normalized
    AND e.status <> 'cancelled'
  LIMIT 1;

  IF v_enrollment_id IS NULL THEN
    SELECT id INTO v_enrollment_id
    FROM public.email_sequence_enrollments
    WHERE sequence_id = p_sequence_id
      AND user_id IS NULL
      AND lower(trim(recipient_email)) = v_normalized
      AND status <> 'cancelled'
    LIMIT 1;
  END IF;

  IF v_enrollment_id IS NOT NULL THEN
    UPDATE public.email_sequence_enrollments
    SET
      status = 'active',
      context = p_context || jsonb_build_object('email', v_normalized),
      enrolled_at = NOW()
    WHERE id = v_enrollment_id;
    RETURN v_enrollment_id;
  END IF;

  SELECT step_order, delay_value, delay_type
  INTO v_first_step, v_first_step_delay, v_first_step_delay_type
  FROM public.email_sequence_steps
  WHERE sequence_id = p_sequence_id
  ORDER BY step_order ASC
  LIMIT 1;

  IF v_first_step_delay_type = 'immediate' THEN
    v_next_email_at := NOW();
  ELSIF v_first_step_delay_type = 'minutes' THEN
    v_next_email_at := NOW() + (v_first_step_delay || ' minutes')::INTERVAL;
  ELSIF v_first_step_delay_type = 'hours' THEN
    v_next_email_at := NOW() + (v_first_step_delay || ' hours')::INTERVAL;
  ELSIF v_first_step_delay_type = 'days' THEN
    v_next_email_at := NOW() + (v_first_step_delay || ' days')::INTERVAL;
  ELSE
    v_next_email_at := NOW();
  END IF;

  INSERT INTO public.email_sequence_enrollments (
    sequence_id,
    user_id,
    recipient_email,
    status,
    current_step,
    next_email_at,
    context
  )
  VALUES (
    p_sequence_id,
    NULL,
    v_normalized,
    'active',
    COALESCE(v_first_step, 1),
    v_next_email_at,
    p_context || jsonb_build_object('email', v_normalized)
  )
  RETURNING id INTO v_enrollment_id;

  UPDATE public.email_sequences
  SET enrolled_count = enrolled_count + 1
  WHERE id = p_sequence_id;

  RETURN v_enrollment_id;
END;
$$;

COMMENT ON FUNCTION public.enroll_email_in_sequence IS
  'Inscrit un contact invité (email sans user_id) à une séquence active.';

-- ---------------------------------------------------------------------------
-- 3. enroll_store_email_in_sequence — résolution user ou guest
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enroll_store_email_in_sequence(
  p_store_id UUID,
  p_sequence_id UUID,
  p_email TEXT,
  p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_enrollment_id UUID;
  v_normalized TEXT;
BEGIN
  v_normalized := lower(trim(p_email));
  IF v_normalized IS NULL OR v_normalized = '' THEN
    RAISE EXCEPTION 'Email required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.email_sequences s
    WHERE s.id = p_sequence_id
      AND s.store_id = p_store_id
      AND s.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Sequence not found for store or not active';
  END IF;

  IF auth.uid() IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.stores st
      WHERE st.id = p_store_id AND st.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Unauthorized store access';
    END IF;
  END IF;

  v_user_id := public.resolve_user_id_for_store_email(p_store_id, v_normalized);

  IF v_user_id IS NOT NULL THEN
    v_enrollment_id := public.enroll_user_in_sequence(
      p_sequence_id,
      v_user_id,
      p_context || jsonb_build_object('email', v_normalized, 'store_id', p_store_id)
    );
    RETURN v_enrollment_id;
  END IF;

  RETURN public.enroll_email_in_sequence(
    p_sequence_id,
    v_normalized,
    p_context || jsonb_build_object('store_id', p_store_id, 'guest_checkout', true)
  );
END;
$$;

COMMENT ON FUNCTION public.enroll_store_email_in_sequence IS
  'Inscrit un contact boutique (user_id si compte, sinon email invité) à une séquence.';

-- ---------------------------------------------------------------------------
-- 4. get_next_sequence_emails_to_send — support guest emails
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_next_sequence_emails_to_send(
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  enrollment_id UUID,
  sequence_id UUID,
  user_id UUID,
  step_id UUID,
  template_id UUID,
  recipient_email TEXT,
  context JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id AS enrollment_id,
    e.sequence_id,
    e.user_id,
    s.id AS step_id,
    s.template_id,
    lower(trim(COALESCE(u.email::TEXT, e.recipient_email, e.context ->> 'email')))::TEXT
      AS recipient_email,
    e.context
  FROM public.email_sequence_enrollments e
  LEFT JOIN auth.users u ON u.id = e.user_id
  JOIN public.email_sequence_steps s
    ON s.sequence_id = e.sequence_id AND s.step_order = e.current_step
  JOIN public.email_sequences seq ON seq.id = e.sequence_id
  WHERE e.status = 'active'
    AND e.next_email_at <= NOW()
    AND seq.status = 'active'
    AND COALESCE(u.email::TEXT, e.recipient_email, e.context ->> 'email') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.email_unsubscribes unsub
      WHERE lower(trim(unsub.email)) = lower(trim(
        COALESCE(u.email::TEXT, e.recipient_email, e.context ->> 'email')
      ))
      AND unsub.unsubscribe_type IN ('all', 'marketing', 'newsletter')
    )
  ORDER BY e.next_email_at ASC
  LIMIT p_limit;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. enroll_user_in_sequence — sans ON CONFLICT (index partiel)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enroll_user_in_sequence(
  p_sequence_id UUID,
  p_user_id UUID,
  p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment_id UUID;
  v_first_step INTEGER;
  v_first_step_delay INTEGER;
  v_first_step_delay_type TEXT;
  v_next_email_at TIMESTAMPTZ;
  v_is_new BOOLEAN := FALSE;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.email_sequences
    WHERE id = p_sequence_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Sequence not found or not active: %', p_sequence_id;
  END IF;

  SELECT id INTO v_enrollment_id
  FROM public.email_sequence_enrollments
  WHERE sequence_id = p_sequence_id
    AND user_id = p_user_id
    AND status <> 'cancelled'
  LIMIT 1;

  IF v_enrollment_id IS NOT NULL THEN
    UPDATE public.email_sequence_enrollments
    SET
      status = 'active',
      context = p_context,
      enrolled_at = NOW()
    WHERE id = v_enrollment_id;
    RETURN v_enrollment_id;
  END IF;

  SELECT step_order, delay_value, delay_type
  INTO v_first_step, v_first_step_delay, v_first_step_delay_type
  FROM public.email_sequence_steps
  WHERE sequence_id = p_sequence_id
  ORDER BY step_order ASC
  LIMIT 1;

  IF v_first_step_delay_type = 'immediate' THEN
    v_next_email_at := NOW();
  ELSIF v_first_step_delay_type = 'minutes' THEN
    v_next_email_at := NOW() + (v_first_step_delay || ' minutes')::INTERVAL;
  ELSIF v_first_step_delay_type = 'hours' THEN
    v_next_email_at := NOW() + (v_first_step_delay || ' hours')::INTERVAL;
  ELSIF v_first_step_delay_type = 'days' THEN
    v_next_email_at := NOW() + (v_first_step_delay || ' days')::INTERVAL;
  ELSE
    v_next_email_at := NOW();
  END IF;

  INSERT INTO public.email_sequence_enrollments (
    sequence_id,
    user_id,
    status,
    current_step,
    next_email_at,
    context
  )
  VALUES (
    p_sequence_id,
    p_user_id,
    'active',
    COALESCE(v_first_step, 1),
    v_next_email_at,
    p_context
  )
  RETURNING id INTO v_enrollment_id;

  v_is_new := TRUE;

  IF v_is_new THEN
    UPDATE public.email_sequences
    SET enrolled_count = enrolled_count + 1
    WHERE id = p_sequence_id;
  END IF;

  RETURN v_enrollment_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enroll_email_in_sequence(UUID, TEXT, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enroll_store_email_in_sequence(UUID, UUID, TEXT, JSONB) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.enroll_email_in_sequence(UUID, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.enroll_store_email_in_sequence(UUID, UUID, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.enroll_store_email_in_sequence(UUID, UUID, TEXT, JSONB) TO authenticated;

COMMIT;
