-- E40 Epic 4.3 — SSO Enterprise vendeurs (OIDC/SAML config + JIT provisioning équipe)

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_sso_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('oidc', 'saml')),
  enabled BOOLEAN NOT NULL DEFAULT false,
  idp_display_name TEXT NOT NULL DEFAULT 'Enterprise SSO',
  allowed_email_domains TEXT[] NOT NULL DEFAULT '{}',
  default_role TEXT NOT NULL DEFAULT 'staff'
    CHECK (default_role IN ('manager', 'staff', 'support', 'viewer')),
  role_mappings JSONB NOT NULL DEFAULT '{}'::jsonb,
  jit_provisioning BOOLEAN NOT NULL DEFAULT true,
  enforce_sso BOOLEAN NOT NULL DEFAULT false,
  -- OIDC
  oidc_issuer_url TEXT,
  oidc_client_id TEXT,
  oidc_client_secret TEXT,
  oidc_scopes TEXT NOT NULL DEFAULT 'openid email profile',
  -- SAML (phase 2 validation — config stockée)
  saml_idp_entity_id TEXT,
  saml_sso_url TEXT,
  saml_certificate TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id)
);

CREATE TABLE IF NOT EXISTS public.store_sso_states (
  state_token TEXT PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.store_sso_providers(id) ON DELETE CASCADE,
  redirect_url TEXT,
  nonce TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_sso_login_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.store_sso_providers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  idp_groups JSONB NOT NULL DEFAULT '[]'::jsonb,
  assigned_role TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'denied', 'error')),
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_sso_providers_store ON public.store_sso_providers(store_id);
CREATE INDEX IF NOT EXISTS idx_store_sso_states_expires ON public.store_sso_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_store_sso_events_store ON public.store_sso_login_events(store_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Feature gating : team.sso → physical_premium (Enterprise)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.store_has_physical_feature(
  p_store_id UUID,
  p_feature_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug TEXT;
  v_rank INT := 0;
  v_required INT := 99;
  v_max_wh INT;
BEGIN
  IF public.is_platform_admin() THEN
    RETURN TRUE;
  END IF;

  v_slug := public.get_store_physical_plan_slug(p_store_id);
  IF v_slug IS NULL THEN
    RETURN FALSE;
  END IF;

  v_rank := public.physical_plan_rank(v_slug);

  SELECT p.max_warehouses INTO v_max_wh
  FROM public.platform_vendor_plans p
  WHERE p.slug = v_slug
  LIMIT 1;

  v_required := CASE p_feature_key
    WHEN 'shipping.tracking' THEN 2
    WHEN 'shipping.fedex_live' THEN 2
    WHEN 'shipping.local_africa' THEN 2
    WHEN 'suppliers.manage' THEN 2
    WHEN 'analytics.physical' THEN 2
    WHEN 'serial_tracking.manage' THEN 2
    WHEN 'warehouses.manage' THEN 2
    WHEN 'batch_shipping.manage' THEN 3
    WHEN 'lots_expiration.manage' THEN 3
    WHEN 'barcode_scanner.use' THEN 3
    WHEN 'preorders.manage' THEN 3
    WHEN 'backorders.manage' THEN 3
    WHEN 'bundles.manage' THEN 3
    WHEN 'forecasting.demand' THEN 3
    WHEN 'cost_optimization.manage' THEN 3
    WHEN 'team.sso' THEN 3
    ELSE 99
  END;

  IF p_feature_key = 'warehouses.manage' AND COALESCE(v_max_wh, 999) <= 0 THEN
    RETURN FALSE;
  END IF;

  RETURN v_rank >= v_required;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC : config publique login (sans secrets)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_store_sso_public_config(p_store_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store RECORD;
  v_provider RECORD;
BEGIN
  SELECT id, name, slug INTO v_store
  FROM public.stores
  WHERE slug = lower(trim(p_store_slug)) AND is_active = true
  LIMIT 1;

  IF v_store.id IS NULL THEN
    RETURN jsonb_build_object('enabled', false);
  END IF;

  IF NOT public.store_has_physical_feature(v_store.id, 'team.sso') THEN
    RETURN jsonb_build_object(
      'enabled', false,
      'reason', 'enterprise_plan_required',
      'store_name', v_store.name
    );
  END IF;

  SELECT * INTO v_provider
  FROM public.store_sso_providers
  WHERE store_id = v_store.id AND enabled = true
  LIMIT 1;

  IF v_provider.id IS NULL THEN
    RETURN jsonb_build_object(
      'enabled', false,
      'store_name', v_store.name,
      'store_slug', v_store.slug
    );
  END IF;

  RETURN jsonb_build_object(
    'enabled', true,
    'store_id', v_store.id,
    'store_name', v_store.name,
    'store_slug', v_store.slug,
    'provider_type', v_provider.provider_type,
    'idp_display_name', v_provider.idp_display_name,
    'allowed_email_domains', v_provider.allowed_email_domains,
    'enforce_sso', v_provider.enforce_sso
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_sso_public_config(TEXT) TO anon, authenticated, service_role;

-- Vérifie si un email doit utiliser SSO (enforce_sso actif)
CREATE OR REPLACE FUNCTION public.check_email_sso_enforcement(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_domain TEXT;
  v_row RECORD;
BEGIN
  v_domain := lower(trim(split_part(coalesce(p_email, ''), '@', 2)));
  IF v_domain = '' THEN
    RETURN jsonb_build_object('enforced', false);
  END IF;

  SELECT s.slug, s.name, p.idp_display_name
  INTO v_row
  FROM public.store_sso_providers p
  JOIN public.stores s ON s.id = p.store_id
  WHERE p.enabled = true
    AND p.enforce_sso = true
    AND public.store_has_physical_feature(p.store_id, 'team.sso')
    AND (
      cardinality(p.allowed_email_domains) = 0
      OR v_domain = ANY (SELECT lower(trim(d)) FROM unnest(p.allowed_email_domains) AS d)
    )
  ORDER BY p.updated_at DESC
  LIMIT 1;

  IF v_row.slug IS NULL THEN
    RETURN jsonb_build_object('enforced', false);
  END IF;

  RETURN jsonb_build_object(
    'enforced', true,
    'store_slug', v_row.slug,
    'store_name', v_row.name,
    'idp_display_name', v_row.idp_display_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_email_sso_enforcement(TEXT) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RPC : provision JIT membre après SSO
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.provision_store_sso_member(
  p_store_id UUID,
  p_user_id UUID,
  p_email TEXT,
  p_idp_groups JSONB DEFAULT '[]'::jsonb,
  p_default_role TEXT DEFAULT 'staff',
  p_role_mappings JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT := COALESCE(NULLIF(trim(p_default_role), ''), 'staff');
  v_group TEXT;
  v_mapped TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.stores WHERE id = p_store_id AND user_id = p_user_id) THEN
    RETURN jsonb_build_object('role', 'owner', 'status', 'active', 'is_owner', true);
  END IF;

  IF jsonb_typeof(p_idp_groups) = 'array' THEN
    FOR v_group IN SELECT jsonb_array_elements_text(p_idp_groups)
    LOOP
      v_mapped := p_role_mappings ->> v_group;
      IF v_mapped IS NOT NULL AND v_mapped IN ('manager', 'staff', 'support', 'viewer') THEN
        v_role := v_mapped;
        EXIT;
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.store_members (
    store_id, user_id, role, invited_by, status, joined_at, metadata
  )
  VALUES (
    p_store_id,
    p_user_id,
    v_role,
    (SELECT user_id FROM public.stores WHERE id = p_store_id LIMIT 1),
    'active',
    now(),
    jsonb_build_object('sso_provisioned', true, 'email', lower(trim(p_email)))
  )
  ON CONFLICT (store_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    status = 'active',
    joined_at = COALESCE(public.store_members.joined_at, now()),
    updated_at = now(),
    metadata = public.store_members.metadata || jsonb_build_object('sso_last_login', now());

  RETURN jsonb_build_object('role', v_role, 'status', 'active', 'is_owner', false);
END;
$$;

REVOKE ALL ON FUNCTION public.provision_store_sso_member(UUID, UUID, TEXT, JSONB, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_store_sso_member(UUID, UUID, TEXT, JSONB, TEXT, JSONB) TO service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.store_sso_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_sso_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_sso_login_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_sso_providers_owner ON public.store_sso_providers;
CREATE POLICY store_sso_providers_owner ON public.store_sso_providers
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.user_id = auth.uid())
    OR public.is_platform_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.user_id = auth.uid())
    OR public.is_platform_admin()
  );

DROP POLICY IF EXISTS store_sso_events_owner ON public.store_sso_login_events;
CREATE POLICY store_sso_events_owner ON public.store_sso_login_events
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.user_id = auth.uid())
    OR public.is_platform_admin()
  );

-- service_role only for states
DROP POLICY IF EXISTS store_sso_states_service ON public.store_sso_states;
CREATE POLICY store_sso_states_service ON public.store_sso_states
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.store_sso_providers IS 'Epic 4.3 — Configuration SSO Enterprise par boutique (OIDC/SAML)';
