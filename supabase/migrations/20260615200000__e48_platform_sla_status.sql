-- E48 Epic 5.3 — SLA plateforme + page status publique

CREATE TABLE IF NOT EXISTS public.platform_sla_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key TEXT NOT NULL,
  service_label TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('operational', 'degraded', 'outage', 'maintenance')),
  latency_ms INT,
  message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_sla_checks_service_checked
  ON public.platform_sla_checks(service_key, checked_at DESC);

CREATE TABLE IF NOT EXISTS public.platform_status_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'minor'
    CHECK (severity IN ('minor', 'major', 'critical')),
  status TEXT NOT NULL DEFAULT 'investigating'
    CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  services TEXT[] NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  updates JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_status_incidents_active
  ON public.platform_status_incidents(started_at DESC)
  WHERE resolved_at IS NULL;

ALTER TABLE public.platform_sla_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_status_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read sla checks" ON public.platform_sla_checks;
CREATE POLICY "Public read sla checks"
  ON public.platform_sla_checks FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read incidents" ON public.platform_status_incidents;
CREATE POLICY "Public read incidents"
  ON public.platform_status_incidents FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage incidents" ON public.platform_status_incidents;
CREATE POLICY "Admins manage incidents"
  ON public.platform_status_incidents FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Enregistrement check (edge platform-health)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_platform_sla_check(
  p_service_key TEXT,
  p_service_label TEXT,
  p_status TEXT,
  p_latency_ms INT DEFAULT NULL,
  p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.platform_sla_checks (service_key, service_label, status, latency_ms, message)
  VALUES (p_service_key, p_service_label, p_status, p_latency_ms, p_message)
  RETURNING id INTO v_id;

  -- Purge > 90 jours
  DELETE FROM public.platform_sla_checks
  WHERE checked_at < now() - interval '90 days';

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.record_platform_sla_check(TEXT, TEXT, TEXT, INT, TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- Résumé public (page /status + widget Enterprise)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_platform_status_summary()
RETURNS JSONB AS $$
DECLARE
  v_services JSONB;
  v_incidents JSONB;
  v_overall TEXT;
  v_uptime NUMERIC(6,3);
BEGIN
  SELECT COALESCE(jsonb_agg(row ORDER BY row->>'service_key'), '[]'::jsonb)
  INTO v_services
  FROM (
    SELECT DISTINCT ON (service_key)
      jsonb_build_object(
        'service_key', service_key,
        'service_label', service_label,
        'status', status,
        'latency_ms', latency_ms,
        'message', message,
        'checked_at', checked_at
      ) AS row
    FROM public.platform_sla_checks
    ORDER BY service_key, checked_at DESC
  ) latest;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'severity', severity,
      'status', status,
      'services', services,
      'started_at', started_at,
      'resolved_at', resolved_at,
      'updates', updates
    ) ORDER BY started_at DESC
  ), '[]'::jsonb)
  INTO v_incidents
  FROM public.platform_status_incidents
  WHERE resolved_at IS NULL
  LIMIT 10;

  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(v_services) e WHERE e->>'status' = 'outage') THEN 'outage'
    WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(v_services) e WHERE e->>'status' = 'degraded') THEN 'degraded'
    WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(v_services) e WHERE e->>'status' = 'maintenance') THEN 'maintenance'
    ELSE 'operational'
  END INTO v_overall;

  SELECT ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'operational') / NULLIF(COUNT(*), 0),
    3
  )
  INTO v_uptime
  FROM public.platform_sla_checks
  WHERE checked_at >= now() - interval '30 days';

  RETURN jsonb_build_object(
    'overall', COALESCE(v_overall, 'operational'),
    'uptime_30d', COALESCE(v_uptime, 99.900),
    'services', v_services,
    'incidents', v_incidents,
    'generated_at', now()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_platform_status_summary() TO anon, authenticated;
