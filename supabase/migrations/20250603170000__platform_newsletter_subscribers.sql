-- Newsletter pied de page (landing) — inscription publique sécurisée

CREATE TABLE IF NOT EXISTS public.platform_newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'footer',
  locale TEXT NOT NULL DEFAULT 'fr',
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT platform_newsletter_subscribers_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_platform_newsletter_subscribers_active
  ON public.platform_newsletter_subscribers (subscribed_at DESC)
  WHERE unsubscribed_at IS NULL;

ALTER TABLE public.platform_newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Lecture réservée aux admins (service role / policies admin existantes)
DROP POLICY IF EXISTS "Admins read newsletter subscribers" ON public.platform_newsletter_subscribers;
CREATE POLICY "Admins read newsletter subscribers"
  ON public.platform_newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

-- Pas d'insert direct côté client : RPC SECURITY DEFINER uniquement
DROP POLICY IF EXISTS "No direct insert newsletter" ON public.platform_newsletter_subscribers;
CREATE POLICY "No direct insert newsletter"
  ON public.platform_newsletter_subscribers
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.subscribe_platform_newsletter(
  p_email TEXT,
  p_source TEXT DEFAULT 'footer',
  p_locale TEXT DEFAULT 'fr'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  v_email := lower(trim(p_email));

  IF v_email IS NULL OR v_email = '' OR v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_email');
  END IF;

  INSERT INTO public.platform_newsletter_subscribers (email, source, locale)
  VALUES (v_email, COALESCE(NULLIF(trim(p_source), ''), 'footer'), COALESCE(NULLIF(trim(p_locale), ''), 'fr'))
  ON CONFLICT (email) DO UPDATE
    SET
      unsubscribed_at = NULL,
      source = EXCLUDED.source,
      locale = EXCLUDED.locale,
      subscribed_at = NOW(),
      metadata = platform_newsletter_subscribers.metadata || jsonb_build_object('resubscribed_at', NOW());

  RETURN jsonb_build_object('ok', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', 'subscription_failed');
END;
$$;

REVOKE ALL ON FUNCTION public.subscribe_platform_newsletter(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscribe_platform_newsletter(TEXT, TEXT, TEXT) TO anon, authenticated;

COMMENT ON TABLE public.platform_newsletter_subscribers IS 'Abonnés newsletter plateforme (footer landing, etc.)';
COMMENT ON FUNCTION public.subscribe_platform_newsletter IS 'Inscription newsletter publique (footer)';
