-- Hotfix prod: align user_consents + legal RPCs with app (useLegal / RequireTermsConsent / E2E).
-- Prod had legacy user_consents (consent_type/consented) and doc types terms-of-service vs terms.

BEGIN;

CREATE OR REPLACE FUNCTION public.resolve_legal_document_type(p_type TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE lower(trim(p_type))
    WHEN 'terms' THEN 'terms-of-service'
    WHEN 'privacy' THEN 'privacy-policy'
    WHEN 'cookies' THEN 'cookie-policy'
    WHEN 'refund' THEN 'refund-policy'
    ELSE lower(trim(p_type))
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_active_legal_document(
  doc_type TEXT,
  doc_language TEXT DEFAULT 'fr'
)
RETURNS TABLE(
  id UUID,
  document_type TEXT,
  language TEXT,
  title TEXT,
  content TEXT,
  version TEXT,
  effective_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.document_type,
    d.language,
    d.title,
    d.content,
    d.version,
    d.effective_date
  FROM public.legal_documents d
  WHERE d.document_type = public.resolve_legal_document_type(doc_type)
    AND d.language = doc_language
    AND d.is_active = TRUE
  ORDER BY d.effective_date DESC
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_latest_legal_document(
  doc_type TEXT,
  doc_language TEXT DEFAULT 'fr'
)
RETURNS TABLE(
  id UUID,
  type TEXT,
  version TEXT,
  content TEXT,
  language TEXT,
  effective_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    lower(trim(doc_type)) AS type,
    d.version,
    d.content,
    d.language,
    d.effective_date
  FROM public.legal_documents d
  WHERE d.document_type = public.resolve_legal_document_type(doc_type)
    AND d.language = doc_language
    AND d.is_active = TRUE
  ORDER BY d.effective_date DESC
  LIMIT 1;
END;
$$;

-- Legacy table (0 rows in prod at hotfix time) — recreate with app schema.
DROP TABLE IF EXISTS public.user_consents CASCADE;

CREATE TABLE public.user_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (
    document_type IN ('terms', 'privacy', 'cookies', 'refund', 'marketing')
  ),
  document_version TEXT NOT NULL,
  consented_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  consent_method TEXT CHECK (
    consent_method IN ('signup', 'banner', 'settings', 'checkout', 'e2e')
  ),
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON public.user_consents(document_type);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own consents" ON public.user_consents;
CREATE POLICY "Users can view own consents"
  ON public.user_consents FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own consents" ON public.user_consents;
CREATE POLICY "Users can insert own consents"
  ON public.user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all consents" ON public.user_consents;
CREATE POLICY "Admins can view all consents"
  ON public.user_consents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION public.record_user_consent(
  p_user_id UUID,
  p_document_type TEXT,
  p_document_version TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_consent_method TEXT DEFAULT 'settings'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_consent_id UUID;
BEGIN
  INSERT INTO public.user_consents (
    user_id,
    document_type,
    document_version,
    ip_address,
    user_agent,
    consent_method
  ) VALUES (
    p_user_id,
    lower(trim(p_document_type)),
    p_document_version,
    p_ip_address,
    p_user_agent,
    COALESCE(p_consent_method, 'settings')
  )
  RETURNING id INTO v_consent_id;

  RETURN v_consent_id;
END;
$$;

COMMENT ON FUNCTION public.resolve_legal_document_type IS
  'Maps app legal doc keys (terms) to prod legal_documents.document_type (terms-of-service).';

COMMENT ON FUNCTION public.get_latest_legal_document IS
  'Returns active legal document for app-facing doc_type (terms/privacy/cookies/refund).';

COMMENT ON FUNCTION public.record_user_consent IS
  'Persists user CGV/consent history for RequireTermsConsent and E2E seeding.';

COMMIT;
