-- ============================================================
-- MIGRATION: SYSTÈME PAGES LÉGALES & CONFORMITÉ RGPD
-- Date: 27 octobre 2025
-- Description: Tables pour gérer documents légaux et consentements utilisateurs
-- ============================================================

-- Table: Documents légaux (CGU, Privacy, Cookies, Refund)
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('terms', 'privacy', 'cookies', 'refund')),
  version TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'fr' CHECK (language IN ('fr', 'en', 'es', 'pt')),
  effective_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(type, version, language)
);

-- Table: Consentements utilisateurs
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('terms', 'privacy', 'cookies', 'refund', 'marketing')),
  document_version TEXT NOT NULL,
  consented_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  consent_method TEXT CHECK (consent_method IN ('signup', 'banner', 'settings', 'checkout')),
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table: Préférences cookies utilisateurs
CREATE TABLE IF NOT EXISTS public.cookie_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  necessary BOOLEAN DEFAULT TRUE, -- Toujours true (obligatoire)
  functional BOOLEAN DEFAULT FALSE,
  analytics BOOLEAN DEFAULT FALSE,
  marketing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Demandes RGPD (export/suppression données)
CREATE TABLE IF NOT EXISTS public.gdpr_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('data_export', 'data_deletion', 'data_rectification')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  export_url TEXT, -- URL fichier export si applicable
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_legal_documents_type_language ON public.legal_documents(type, language);
CREATE INDEX IF NOT EXISTS idx_legal_documents_active ON public.legal_documents(is_active);
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON public.user_consents(document_type);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user_id ON public.gdpr_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON public.gdpr_requests(status);

-- Trigger: Updated_at automatique
CREATE OR REPLACE FUNCTION update_legal_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_legal_documents_updated_at();

CREATE TRIGGER cookie_preferences_updated_at
  BEFORE UPDATE ON public.cookie_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_legal_documents_updated_at();

-- RLS Policies

-- Legal Documents: Lecture publique, écriture admin uniquement
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Legal documents are viewable by everyone"
  ON public.legal_documents FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Only admins can insert legal documents"
  ON public.legal_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update legal documents"
  ON public.legal_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User Consents: Chaque utilisateur voit uniquement ses consentements
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents"
  ON public.user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents"
  ON public.user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consents"
  ON public.user_consents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Cookie Preferences: Utilisateur gère ses préférences
ALTER TABLE public.cookie_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cookie preferences"
  ON public.cookie_preferences FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own cookie preferences"
  ON public.cookie_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cookie preferences"
  ON public.cookie_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- GDPR Requests: Utilisateur voit ses demandes
ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own GDPR requests"
  ON public.gdpr_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create GDPR requests"
  ON public.gdpr_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all GDPR requests"
  ON public.gdpr_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update GDPR requests"
  ON public.gdpr_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function: Obtenir la dernière version d'un document
CREATE OR REPLACE FUNCTION get_latest_legal_document(
  doc_type TEXT,
  doc_language TEXT DEFAULT 'fr'
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  version TEXT,
  content TEXT,
  language TEXT,
  effective_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ld.id,
    ld.type,
    ld.version,
    ld.content,
    ld.language,
    ld.effective_date
  FROM public.legal_documents ld
  WHERE ld.type = doc_type
    AND ld.language = doc_language
    AND ld.is_active = TRUE
  ORDER BY ld.effective_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Enregistrer consentement utilisateur
CREATE OR REPLACE FUNCTION record_user_consent(
  p_user_id UUID,
  p_document_type TEXT,
  p_document_version TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_consent_method TEXT DEFAULT 'settings'
)
RETURNS UUID AS $$
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
    p_document_type,
    p_document_version,
    p_ip_address,
    p_user_agent,
    p_consent_method
  )
  RETURNING id INTO v_consent_id;
  
  RETURN v_consent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON TABLE public.legal_documents IS 'Documents légaux (CGU, Privacy, Cookies, Refund) avec versioning';
COMMENT ON TABLE public.user_consents IS 'Historique des consentements utilisateurs pour conformité RGPD';
COMMENT ON TABLE public.cookie_preferences IS 'Préférences cookies utilisateurs';
COMMENT ON TABLE public.gdpr_requests IS 'Demandes RGPD (export/suppression données)';

-- ============================================================
-- FIN MIGRATION
-- ============================================================

