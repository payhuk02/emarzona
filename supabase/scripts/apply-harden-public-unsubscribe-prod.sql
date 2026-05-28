-- Run once in Supabase SQL Editor (PRODUCTION) to apply unsubscribe hardening.
-- Idempotent. Does NOT touch payment tables.

BEGIN;

DROP FUNCTION IF EXISTS public.record_email_unsubscribe(text, text, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.record_email_unsubscribe(text, text, text, uuid);

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

REVOKE ALL ON FUNCTION public.record_email_unsubscribe(text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_email_unsubscribe(text, text, text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.record_email_unsubscribe(text, text, text, uuid) TO authenticated;

DROP POLICY IF EXISTS "Anyone can unsubscribe with email" ON public.email_unsubscribes;
DROP POLICY IF EXISTS "Anyone can unsubscribe" ON public.email_unsubscribes;
DROP POLICY IF EXISTS "Public update unsubscribe on conflict" ON public.email_unsubscribes;
DROP POLICY IF EXISTS email_unsubscribes_insert_policy ON public.email_unsubscribes;
DROP POLICY IF EXISTS email_unsubscribes_update_policy ON public.email_unsubscribes;

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

COMMIT;

-- Verify: should return exactly one row (4-arg signature, no p_user_id)
SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'record_email_unsubscribe'
ORDER BY args;

-- Policies: expect Public insert + admin/user SELECT (+ optional select/delete templates)
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'email_unsubscribes'
ORDER BY policyname;
