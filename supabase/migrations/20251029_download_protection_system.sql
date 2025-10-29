-- ============================================================================
-- MIGRATION: Secure Download Protection System  
-- Date: 2025-10-29
-- Description: Système de téléchargement sécurisé avec tokens temporaires
-- ============================================================================

-- ============================================================================
-- TABLES
-- ============================================================================

-- Supprimer les tables existantes (pour développement)
DROP TABLE IF EXISTS public.download_logs CASCADE;
DROP TABLE IF EXISTS public.download_tokens CASCADE;

-- ============================================================================
-- TABLE: download_tokens
-- ============================================================================
CREATE TABLE public.download_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  license_id UUID REFERENCES public.digital_product_licenses(id),
  version_id UUID REFERENCES public.product_versions(id),
  
  -- Token
  token TEXT NOT NULL UNIQUE,
  
  -- Download info
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size_mb NUMERIC,
  
  -- Security
  ip_address INET,
  max_downloads INTEGER DEFAULT 1,
  current_downloads INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Status
  is_used BOOLEAN DEFAULT false,
  is_revoked BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_download_tokens_token ON public.download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_download_tokens_customer ON public.download_tokens(customer_id);
CREATE INDEX IF NOT EXISTS idx_download_tokens_license ON public.download_tokens(license_id);
CREATE INDEX IF NOT EXISTS idx_download_tokens_expires ON public.download_tokens(expires_at);

-- ============================================================================
-- TABLE: download_logs
-- ============================================================================
CREATE TABLE public.download_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES public.download_tokens(id),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  
  -- Download details
  ip_address INET,
  user_agent TEXT,
  bytes_downloaded BIGINT,
  download_completed BOOLEAN DEFAULT false,
  download_duration_seconds INTEGER,
  
  -- Error tracking
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_download_logs_product ON public.download_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_customer ON public.download_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_created ON public.download_logs(created_at DESC);

-- ============================================================================
-- FUNCTION: Generate Secure Download Token
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_download_token(
  p_product_id UUID,
  p_file_url TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_license_id UUID DEFAULT NULL,
  p_expires_hours INTEGER DEFAULT 1
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate random token
  v_token := encode(gen_random_bytes(32), 'base64');
  v_token := replace(v_token, '/', '_');
  v_token := replace(v_token, '+', '-');
  
  -- Insert token
  INSERT INTO public.download_tokens (
    product_id,
    customer_id,
    license_id,
    token,
    file_url,
    expires_at
  ) VALUES (
    p_product_id,
    p_customer_id,
    p_license_id,
    v_token,
    p_file_url,
    now() + (p_expires_hours || ' hours')::interval
  );
  
  RETURN v_token;
END;
$$;

-- ============================================================================
-- FUNCTION: Validate Download Token
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_download_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token RECORD;
BEGIN
  SELECT * INTO v_token
  FROM public.download_tokens
  WHERE token = p_token;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Token not found');
  END IF;
  
  IF v_token.is_revoked THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Token revoked');
  END IF;
  
  IF v_token.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Token expired');
  END IF;
  
  IF v_token.current_downloads >= v_token.max_downloads THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Download limit reached');
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'file_url', v_token.file_url,
    'token_id', v_token.id
  );
END;
$$;

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE public.download_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;

-- Vendors can view their download tokens
CREATE POLICY "Vendors view tokens"
  ON public.download_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = download_tokens.product_id
      AND s.user_id = auth.uid()
    )
  );

-- Customers can view their own tokens
CREATE POLICY "Customers view own tokens"
  ON public.download_tokens FOR SELECT
  USING (
    customer_id IN (
      SELECT c.id FROM public.customers c
      JOIN auth.users u ON u.email = c.email
      WHERE u.id = auth.uid()
    )
  );

-- Vendors can view download logs for their products
CREATE POLICY "Vendors view logs"
  ON public.download_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = download_logs.product_id
      AND s.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.download_tokens IS 'Secure temporary download tokens with expiration';
COMMENT ON TABLE public.download_logs IS 'Download activity tracking and analytics';
