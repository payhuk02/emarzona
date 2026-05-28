-- Harden public unsubscribe RPC (enterprise security)
-- Safe to run in SQL Editor on production (idempotent).
--
-- Fixes:
-- - Remove ambiguous function overloads (5-arg legacy vs 4-arg hardened)
-- - Remove client-controlled user_id writes (auth.uid() only)
-- - Remove public UPDATE surface on email_unsubscribes

-- 1) Remove ALL overloads of record_email_unsubscribe (fixes: function name is not unique)
DROP FUNCTION IF EXISTS public.record_email_unsubscribe(text, text, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.record_email_unsubscribe(text, text, text, uuid);

-- 2) Single canonical function (4 args)
CREATE OR REPLACE FUNCTION public.record_email_unsubscribe(
  p_email text,
  p_unsubscribe_type text DEFAULT 'marketing',
  p_reason text DEFAULT NULL,
  p_campaign_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_user_id uuid := NULL;
BEGIN
  IF v_email IS NULL OR length(v_email) < 5 OR position('@' in v_email) < 2 THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;

  IF p_unsubscribe_type NOT IN ('all', 'marketing', 'newsletter', 'transactional') THEN
    RAISE EXCEPTION 'invalid_unsubscribe_type';
  END IF;

  BEGIN
    v_user_id := auth.uid();
  EXCEPTION WHEN others THEN
    v_user_id := NULL;
  END;

  INSERT INTO public.email_unsubscribes (
    email,
    unsubscribe_type,
    reason,
    campaign_id,
    user_id,
    unsubscribed_at
  )
  VALUES (
    v_email,
    p_unsubscribe_type,
    NULLIF(p_reason, ''),
    p_campaign_id,
    v_user_id,
    now()
  )
  ON CONFLICT (email, unsubscribe_type)
  DO NOTHING;
END;
$$;

COMMENT ON FUNCTION public.record_email_unsubscribe(text, text, text, uuid) IS
  'Enregistre un désabonnement email (public). user_id is auth.uid() when authenticated; never from client.';

REVOKE ALL ON FUNCTION public.record_email_unsubscribe(text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_email_unsubscribe(text, text, text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.record_email_unsubscribe(text, text, text, uuid) TO authenticated;

-- 3) Policies: drop legacy/public variants, keep INSERT-only public path
DROP POLICY IF EXISTS "Anyone can unsubscribe with email" ON public.email_unsubscribes;
DROP POLICY IF EXISTS "Anyone can unsubscribe" ON public.email_unsubscribes;
DROP POLICY IF EXISTS "Public update unsubscribe on conflict" ON public.email_unsubscribes;
DROP POLICY IF EXISTS "Public insert unsubscribe by email" ON public.email_unsubscribes;

CREATE POLICY "Public insert unsubscribe by email"
  ON public.email_unsubscribes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND char_length(trim(email)) >= 5
    AND trim(email) LIKE '%@%'
    AND unsubscribe_type IN ('all', 'marketing', 'newsletter', 'transactional')
  );

-- Optional: remove broad authenticated-only policy if still present (superseded by public insert + RPC)
DROP POLICY IF EXISTS "Anyone can unsubscribe with email" ON public.email_unsubscribes;
