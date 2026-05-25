-- Public unsubscribe: RLS 20260329000015 limited INSERT to authenticated only.
-- Restore anon/authenticated unsubscribe via SECURITY DEFINER RPC + policies.

CREATE OR REPLACE FUNCTION public.record_email_unsubscribe(
  p_email text,
  p_unsubscribe_type text DEFAULT 'marketing',
  p_reason text DEFAULT NULL,
  p_campaign_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(p_email));
BEGIN
  IF v_email IS NULL OR length(v_email) < 5 OR position('@' in v_email) < 2 THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;

  IF p_unsubscribe_type NOT IN ('all', 'marketing', 'newsletter', 'transactional') THEN
    RAISE EXCEPTION 'invalid_unsubscribe_type';
  END IF;

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
    p_reason,
    p_campaign_id,
    p_user_id,
    now()
  )
  ON CONFLICT (email, unsubscribe_type)
  DO UPDATE SET
    reason = COALESCE(EXCLUDED.reason, email_unsubscribes.reason),
    campaign_id = COALESCE(EXCLUDED.campaign_id, email_unsubscribes.campaign_id),
    user_id = COALESCE(EXCLUDED.user_id, email_unsubscribes.user_id),
    unsubscribed_at = now();
END;
$$;

COMMENT ON FUNCTION public.record_email_unsubscribe IS
  'Enregistre un désabonnement email (page publique / liens marketing).';

REVOKE ALL ON FUNCTION public.record_email_unsubscribe(text, text, text, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_email_unsubscribe(text, text, text, uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.record_email_unsubscribe(text, text, text, uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Anyone can unsubscribe with email" ON public.email_unsubscribes;
DROP POLICY IF EXISTS "Anyone can unsubscribe" ON public.email_unsubscribes;

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

CREATE POLICY "Public update unsubscribe on conflict"
  ON public.email_unsubscribes
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (
    email IS NOT NULL
    AND unsubscribe_type IN ('all', 'marketing', 'newsletter', 'transactional')
  );
