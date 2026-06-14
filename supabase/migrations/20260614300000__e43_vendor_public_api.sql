-- E43 Epic 4.6 — API publique vendeurs REST (logs + feature gate)

-- ---------------------------------------------------------------------------
-- Journal requêtes API (rate-limit + compliance)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INT,
  duration_ms INT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_request_logs_store_created
  ON public.api_request_logs(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_key
  ON public.api_request_logs(api_key_id);

ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners view api logs" ON public.api_request_logs;
CREATE POLICY "Store owners view api logs"
  ON public.api_request_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = api_request_logs.store_id AND s.user_id = auth.uid()
    )
    OR public.is_platform_admin()
  );

-- ---------------------------------------------------------------------------
-- Vérification clé API enrichie (feature gate + id clé)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_api_key(p_key TEXT)
RETURNS TABLE (
  key_id UUID,
  user_id UUID,
  store_id UUID,
  permissions JSONB
) AS $$
DECLARE
  v_key_hash TEXT;
  v_row RECORD;
BEGIN
  v_key_hash := encode(digest(p_key, 'sha256'), 'hex');

  SELECT ak.id, ak.user_id, ak.store_id, ak.permissions
  INTO v_row
  FROM public.api_keys ak
  WHERE ak.key_hash = v_key_hash
    AND ak.is_active = true
    AND (ak.expires_at IS NULL OR ak.expires_at > now())
  LIMIT 1;

  IF v_row.id IS NULL THEN
    RETURN;
  END IF;

  IF NOT public.store_has_physical_feature(v_row.store_id, 'api.public') THEN
    RETURN;
  END IF;

  UPDATE public.api_keys
  SET last_used_at = now()
  WHERE id = v_row.id;

  RETURN QUERY
  SELECT v_row.id, v_row.user_id, v_row.store_id, v_row.permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Log requête API (appelé par edge function)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_api_request(
  p_store_id UUID,
  p_api_key_id UUID,
  p_method TEXT,
  p_path TEXT,
  p_status_code INT DEFAULT NULL,
  p_duration_ms INT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.api_request_logs (
    store_id, api_key_id, method, path, status_code, duration_ms, ip_address, user_agent
  ) VALUES (
    p_store_id, p_api_key_id, p_method, p_path, p_status_code, p_duration_ms, p_ip_address, p_user_agent
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_api_request(UUID, UUID, TEXT, TEXT, INT, INT, TEXT, TEXT)
  TO service_role;

-- ---------------------------------------------------------------------------
-- Création clé API avec audit + feature gate
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_store_api_key(
  p_store_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_permissions JSONB DEFAULT '{"products:read": true, "orders:read": true}'::jsonb,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  key TEXT,
  key_prefix TEXT,
  name TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = p_store_id AND s.user_id = auth.uid())
    OR public.is_platform_admin()
  ) THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  IF NOT public.store_has_physical_feature(p_store_id, 'api.public') THEN
    RAISE EXCEPTION 'plan_required';
  END IF;

  PERFORM public.log_store_audit_event(
    p_store_id,
    'api_key.create',
    'api_key',
    NULL,
    jsonb_build_object('name', p_name),
    'api'
  );

  RETURN QUERY
  SELECT * FROM public.create_api_key(auth.uid(), p_store_id, p_name, p_description, p_permissions, p_expires_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_store_api_key(UUID, TEXT, TEXT, JSONB, TIMESTAMPTZ)
  TO authenticated;

COMMENT ON TABLE public.api_request_logs IS 'E43 — Journal requêtes API publique vendeurs';
COMMENT ON FUNCTION public.create_store_api_key IS 'E43 — Création clé API avec audit et gating plan';
