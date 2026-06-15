-- E41 Epic 4.4 — Audit logs exportables (SOC2 compliance)

-- ---------------------------------------------------------------------------
-- Enrichissement admin_actions
-- ---------------------------------------------------------------------------
ALTER TABLE public.admin_actions
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS actor_email TEXT;

-- ---------------------------------------------------------------------------
-- Événements audit boutique (équipe, API, SSO, settings)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  source TEXT NOT NULL DEFAULT 'store'
    CHECK (source IN ('store', 'sso', 'api', 'team', 'billing')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_audit_events_store_created
  ON public.store_audit_events(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_audit_events_action
  ON public.store_audit_events(action);
CREATE INDEX IF NOT EXISTS idx_store_audit_events_actor
  ON public.store_audit_events(actor_id);

ALTER TABLE public.store_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners view audit events" ON public.store_audit_events;
CREATE POLICY "Store owners view audit events"
  ON public.store_audit_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_audit_events.store_id AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = store_audit_events.store_id
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'manager')
    )
    OR public.is_platform_admin()
  );

DROP POLICY IF EXISTS "Authenticated insert store audit" ON public.store_audit_events;
CREATE POLICY "Authenticated insert store audit"
  ON public.store_audit_events FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Journal des exports (meta-audit SOC2)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_scope TEXT NOT NULL CHECK (export_scope IN ('platform', 'store')),
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  format TEXT NOT NULL CHECK (format IN ('csv', 'json')),
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  row_count INT NOT NULL DEFAULT 0,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_export_logs_created
  ON public.audit_export_logs(created_at DESC);

ALTER TABLE public.audit_export_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view export logs" ON public.audit_export_logs;
CREATE POLICY "Admins view export logs"
  ON public.audit_export_logs FOR SELECT TO authenticated
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Authenticated insert export log" ON public.audit_export_logs;
CREATE POLICY "Authenticated insert export log"
  ON public.audit_export_logs FOR INSERT TO authenticated
  WITH CHECK (exported_by = auth.uid());

-- ---------------------------------------------------------------------------
-- Helper : enregistrer un événement boutique
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_store_audit_event(
  p_store_id UUID,
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_source TEXT DEFAULT 'store',
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
  v_email TEXT;
BEGIN
  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = auth.uid() LIMIT 1;

  INSERT INTO public.store_audit_events (
    store_id, actor_id, actor_email, action, target_type, target_id,
    metadata, source, ip_address, user_agent
  ) VALUES (
    p_store_id, auth.uid(), v_email, p_action, p_target_type, p_target_id,
    COALESCE(p_metadata, '{}'::jsonb), COALESCE(p_source, 'store'),
    p_ip_address, p_user_agent
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_store_audit_event(UUID, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Vue unifiée (lecture seule, compliance)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.unified_audit_logs AS
SELECT
  a.id,
  'platform_admin'::text AS log_source,
  NULL::uuid AS store_id,
  a.actor_id,
  COALESCE(a.actor_email, u.email) AS actor_email,
  a.action,
  a.target_type,
  a.target_id::text,
  a.metadata,
  a.ip_address,
  NULL::text AS user_agent,
  a.created_at
FROM public.admin_actions a
LEFT JOIN auth.users u ON u.id = a.actor_id

UNION ALL

SELECT
  e.id,
  'store_event'::text AS log_source,
  e.store_id,
  e.actor_id,
  e.actor_email,
  e.action,
  e.target_type,
  e.target_id::text,
  e.metadata,
  e.ip_address,
  e.user_agent,
  e.created_at
FROM public.store_audit_events e

UNION ALL

SELECT
  s.id,
  'sso_login'::text AS log_source,
  s.store_id,
  s.user_id AS actor_id,
  s.email AS actor_email,
  ('sso.' || s.status)::text AS action,
  'sso_provider'::text AS target_type,
  s.provider_id::text AS target_id,
  jsonb_build_object(
    'idp_groups', s.idp_groups,
    'assigned_role', s.assigned_role,
    'error_message', s.error_message
  ) AS metadata,
  s.ip_address,
  s.user_agent,
  s.created_at
FROM public.store_sso_login_events s;

-- ---------------------------------------------------------------------------
-- RPC : requête paginée (admin plateforme ou propriétaire boutique)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.query_unified_audit_logs(
  p_store_id UUID DEFAULT NULL,
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to TIMESTAMPTZ DEFAULT NULL,
  p_action_prefix TEXT DEFAULT NULL,
  p_log_source TEXT DEFAULT NULL,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  log_source TEXT,
  store_id UUID,
  actor_id UUID,
  actor_email TEXT,
  action TEXT,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INT := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 5000);
  v_offset INT := GREATEST(COALESCE(p_offset, 0), 0);
BEGIN
  IF p_store_id IS NOT NULL THEN
    IF NOT (
      public.is_platform_admin()
      OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = p_store_id AND s.user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.store_members sm
        WHERE sm.store_id = p_store_id AND sm.user_id = auth.uid() AND sm.role IN ('owner', 'manager')
      )
    ) THEN
      RAISE EXCEPTION 'access_denied';
    END IF;

    IF NOT public.is_platform_admin()
       AND NOT public.store_has_physical_feature(p_store_id, 'audit.export') THEN
      RAISE EXCEPTION 'enterprise_plan_required';
    END IF;
  ELSE
    IF NOT public.is_platform_admin() THEN
      RAISE EXCEPTION 'access_denied';
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    u.id, u.log_source, u.store_id, u.actor_id, u.actor_email,
    u.action, u.target_type, u.target_id, u.metadata,
    u.ip_address, u.user_agent, u.created_at
  FROM public.unified_audit_logs u
  WHERE (p_store_id IS NULL OR u.store_id = p_store_id OR u.log_source = 'platform_admin')
    AND (p_from IS NULL OR u.created_at >= p_from)
    AND (p_to IS NULL OR u.created_at <= p_to)
    AND (p_action_prefix IS NULL OR u.action ILIKE p_action_prefix || '%')
    AND (p_log_source IS NULL OR u.log_source = p_log_source)
  ORDER BY u.created_at DESC
  LIMIT v_limit OFFSET v_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.query_unified_audit_logs(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, INT, INT)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RPC : export complet (SOC2 — enregistre meta-audit)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.export_unified_audit_logs(
  p_store_id UUID DEFAULT NULL,
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to TIMESTAMPTZ DEFAULT NULL,
  p_action_prefix TEXT DEFAULT NULL,
  p_log_source TEXT DEFAULT NULL,
  p_format TEXT DEFAULT 'json',
  p_max_rows INT DEFAULT 10000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows JSONB;
  v_count INT;
  v_format TEXT := lower(COALESCE(p_format, 'json'));
  v_max INT := LEAST(GREATEST(COALESCE(p_max_rows, 10000), 1), 50000);
BEGIN
  IF v_format NOT IN ('json', 'csv') THEN
    RAISE EXCEPTION 'invalid_format';
  END IF;

  SELECT jsonb_agg(row_to_json(t)::jsonb), COUNT(*)::int
  INTO v_rows, v_count
  FROM (
    SELECT * FROM public.query_unified_audit_logs(
      p_store_id, p_from, p_to, p_action_prefix, p_log_source, v_max, 0
    )
  ) t;

  INSERT INTO public.audit_export_logs (
    exported_by, export_scope, store_id, format, filters, row_count
  ) VALUES (
    auth.uid(),
    CASE WHEN p_store_id IS NULL THEN 'platform' ELSE 'store' END,
    p_store_id,
    v_format,
    jsonb_build_object(
      'from', p_from,
      'to', p_to,
      'action_prefix', p_action_prefix,
      'log_source', p_log_source,
      'max_rows', v_max
    ),
    COALESCE(v_count, 0)
  );

  RETURN jsonb_build_object(
    'format', v_format,
    'row_count', COALESCE(v_count, 0),
    'exported_at', now(),
    'rows', COALESCE(v_rows, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.export_unified_audit_logs(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT, INT)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Feature gating : audit.export → physical_premium
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
    WHEN 'audit.export' THEN 3
    WHEN 'api.public' THEN 2
    ELSE 99
  END;

  IF p_feature_key = 'warehouses.manage' AND COALESCE(v_max_wh, 999) <= 0 THEN
    RETURN FALSE;
  END IF;

  RETURN v_rank >= v_required;
END;
$$;

COMMENT ON TABLE public.store_audit_events IS 'E41 — Journal audit boutique (SOC2)';
COMMENT ON TABLE public.audit_export_logs IS 'E41 — Meta-audit des exports compliance';
COMMENT ON VIEW public.unified_audit_logs IS 'E41 — Vue unifiée admin + boutique + SSO';
