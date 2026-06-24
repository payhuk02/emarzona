-- E49 Phase 0.3 — Cron fulfillment monitor + auto-résolution alertes + sweep admin

-- ---------------------------------------------------------------------------
-- Auto-résolution : alertes ouvertes dont la commande n'est plus en retard SLA
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_resolve_fulfilled_order_alerts(
  p_stale_minutes INTEGER DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stale_ids UUID[];
  v_resolved INTEGER;
BEGIN
  SELECT COALESCE(
    array_agg((elem->>'order_id')::uuid),
    ARRAY[]::uuid[]
  )
  INTO v_stale_ids
  FROM jsonb_array_elements(
    COALESCE(public.detect_stale_order_fulfillment(p_stale_minutes)->'orders', '[]'::jsonb)
  ) AS elem;

  UPDATE public.order_fulfillment_alerts a
  SET resolved_at = now()
  WHERE a.resolved_at IS NULL
    AND (
      COALESCE(array_length(v_stale_ids, 1), 0) = 0
      OR a.order_id <> ALL (v_stale_ids)
    )
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = a.order_id
        AND o.payment_status IN ('paid', 'completed')
        AND o.updated_at >= now() - interval '7 days'
    );

  GET DIAGNOSTICS v_resolved = ROW_COUNT;

  RETURN jsonb_build_object(
    'resolved_count', v_resolved,
    'stale_order_count', COALESCE(array_length(v_stale_ids, 1), 0)
  );
END;
$$;

COMMENT ON FUNCTION public.auto_resolve_fulfilled_order_alerts(INTEGER) IS
  'Marque résolues les alertes dont la commande n''apparaît plus dans le scan SLA.';

GRANT EXECUTE ON FUNCTION public.auto_resolve_fulfilled_order_alerts(INTEGER) TO service_role;

-- ---------------------------------------------------------------------------
-- Sweep admin (sans retry edge Deno) — enregistre alertes + SLA + auto-résolution
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_run_fulfillment_monitor_sweep(
  p_stale_minutes INTEGER DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_detection JSONB;
  v_stale_orders JSONB;
  v_order JSONB;
  v_issue TEXT;
  v_stale_count INTEGER;
  v_alerts_recorded INTEGER := 0;
  v_resolved JSONB;
  v_sla_status TEXT;
  v_i INTEGER;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: platform admin required';
  END IF;

  v_detection := public.detect_stale_order_fulfillment(p_stale_minutes);
  v_stale_orders := COALESCE(v_detection->'orders', '[]'::jsonb);
  v_stale_count := COALESCE((v_detection->>'stale_count')::integer, 0);

  FOR v_i IN 0 .. GREATEST(jsonb_array_length(v_stale_orders) - 1, -1) LOOP
    EXIT WHEN jsonb_array_length(v_stale_orders) = 0;
    v_order := v_stale_orders->v_i;

    FOR v_issue IN
      SELECT jsonb_array_elements_text(COALESCE(v_order->'issues', '[]'::jsonb))
    LOOP
      PERFORM public.record_order_fulfillment_alert(
        (v_order->>'order_id')::uuid,
        v_issue,
        CASE
          WHEN v_issue LIKE '%missing%' OR v_issue LIKE '%pending%' THEN 'critical'
          ELSE 'warning'
        END,
        jsonb_build_object(
          'order_number', v_order->>'order_number',
          'paid_at', v_order->>'paid_at',
          'detected_at', now(),
          'source', 'admin_sweep'
        )
      );
      v_alerts_recorded := v_alerts_recorded + 1;
    END LOOP;
  END LOOP;

  v_resolved := public.auto_resolve_fulfilled_order_alerts(p_stale_minutes);

  v_sla_status := CASE
    WHEN v_stale_count = 0 THEN 'operational'
    WHEN v_stale_count <= 3 THEN 'degraded'
    ELSE 'outage'
  END;

  PERFORM public.record_platform_sla_check(
    'fulfillment',
    'Fulfillment commandes',
    v_sla_status,
    NULL,
    CASE
      WHEN v_stale_count = 0 THEN NULL
      ELSE format(
        '%s commande(s) payée(s) > %s min sans fulfillment complet',
        v_stale_count,
        GREATEST(1, COALESCE(p_stale_minutes, 5))
      )
    END
  );

  RETURN jsonb_build_object(
    'stale_minutes', GREATEST(1, COALESCE(p_stale_minutes, 5)),
    'stale_count', v_stale_count,
    'alerts_recorded', v_alerts_recorded,
    'auto_resolved', v_resolved,
    'sla_status', v_sla_status,
    'checked_at', now()
  );
END;
$$;

COMMENT ON FUNCTION public.admin_run_fulfillment_monitor_sweep(INTEGER) IS
  'Scan SLA + enregistrement alertes pour le panneau admin (sans retry edge).';

GRANT EXECUTE ON FUNCTION public.admin_run_fulfillment_monitor_sweep(INTEGER) TO authenticated;

-- ---------------------------------------------------------------------------
-- Cron pg_cron — process-order-fulfillment-monitor (toutes les 5 min)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.setup_order_fulfillment_monitor_cron_job(
  p_project_ref text,
  p_cron_secret text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, net
AS $$
DECLARE
  v_url text;
  v_job_id bigint;
BEGIN
  IF p_project_ref IS NULL OR length(trim(p_project_ref)) = 0 THEN
    RAISE EXCEPTION 'p_project_ref is required';
  END IF;
  IF p_cron_secret IS NULL OR length(trim(p_cron_secret)) < 16 THEN
    RAISE EXCEPTION 'p_cron_secret must be at least 16 characters';
  END IF;

  v_url := format(
    'https://%s.supabase.co/functions/v1/process-order-fulfillment-monitor',
    trim(p_project_ref)
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'order-fulfillment-monitor') THEN
    PERFORM cron.unschedule('order-fulfillment-monitor');
  END IF;

  SELECT cron.schedule(
    'order-fulfillment-monitor',
    '*/5 * * * *',
    format(
      $cmd$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', %L
        ),
        body := '{}'::jsonb
      ) AS request_id;
      $cmd$,
      v_url,
      p_cron_secret
    )
  ) INTO v_job_id;

  RETURN jsonb_build_object(
    'success', true,
    'job_id', v_job_id,
    'job_name', 'order-fulfillment-monitor',
    'schedule', '*/5 * * * *',
    'edge_url', v_url
  );
END;
$$;

REVOKE ALL ON FUNCTION public.setup_order_fulfillment_monitor_cron_job(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setup_order_fulfillment_monitor_cron_job(text, text) TO service_role;

COMMENT ON FUNCTION public.setup_order_fulfillment_monitor_cron_job IS
  'E49 P0 — Cron pg_cron monitoring fulfillment post-paiement (5 min).';
