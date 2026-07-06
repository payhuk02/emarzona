-- Phase 3 P3: archivage email_logs, maintenance nocturne, index volume

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Archive table (cold storage avant purge)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_logs_archive (
  LIKE public.email_logs INCLUDING DEFAULTS
);

ALTER TABLE public.email_logs_archive
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NOT NULL DEFAULT now();

COMMENT ON TABLE public.email_logs_archive IS
  'Archive des email_logs purgés (rétention chaude 90j non-engagés, froide 730j).';

CREATE INDEX IF NOT EXISTS idx_email_logs_archive_created_at
  ON public.email_logs_archive (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_logs_archive_archived_at
  ON public.email_logs_archive (archived_at DESC);

ALTER TABLE public.email_logs_archive ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. Index volume sur email_logs (cleanup + analytics)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at
  ON public.email_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_logs_status_created
  ON public.email_logs (status, created_at DESC)
  WHERE status IN ('failed', 'bounced', 'spam', 'queued', 'sent');

-- ---------------------------------------------------------------------------
-- 3. Nettoyage webhook events (journal idempotence)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_email_webhook_events(
  p_retention_days INTEGER DEFAULT 30,
  p_batch_size INTEGER DEFAULT 10000
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER := 0;
  v_batch INTEGER;
BEGIN
  IF p_retention_days IS NULL OR p_retention_days < 7 THEN
    RAISE EXCEPTION 'p_retention_days must be >= 7';
  END IF;

  LOOP
    DELETE FROM public.email_webhook_events
    WHERE dedup_key IN (
      SELECT dedup_key
      FROM public.email_webhook_events
      WHERE processed_at < NOW() - (p_retention_days || ' days')::interval
      ORDER BY processed_at ASC
      LIMIT p_batch_size
    );

    GET DIAGNOSTICS v_batch = ROW_COUNT;
    v_deleted := v_deleted + v_batch;
    EXIT WHEN v_batch = 0;
  END LOOP;

  RETURN v_deleted;
END;
$$;

COMMENT ON FUNCTION public.cleanup_email_webhook_events IS
  'Purge les événements webhook email plus anciens que p_retention_days (défaut 30j).';

-- ---------------------------------------------------------------------------
-- 4. Archivage + purge email_logs (tiered retention)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_email_logs(
  p_warm_retention_days INTEGER DEFAULT 90,
  p_cold_retention_days INTEGER DEFAULT 730,
  p_batch_size INTEGER DEFAULT 5000
)
RETURNS TABLE (
  archived_warm INTEGER,
  deleted_warm INTEGER,
  archived_cold INTEGER,
  deleted_cold INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_archived_warm INTEGER := 0;
  v_deleted_warm INTEGER := 0;
  v_archived_cold INTEGER := 0;
  v_deleted_cold INTEGER := 0;
  v_batch INTEGER;
BEGIN
  IF p_warm_retention_days IS NULL OR p_warm_retention_days < 30 THEN
    RAISE EXCEPTION 'p_warm_retention_days must be >= 30';
  END IF;
  IF p_cold_retention_days IS NULL OR p_cold_retention_days <= p_warm_retention_days THEN
    RAISE EXCEPTION 'p_cold_retention_days must be > p_warm_retention_days';
  END IF;

  -- Warm tier: non-engaged logs après rétention chaude
  LOOP
    WITH candidates AS (
      SELECT id
      FROM public.email_logs
      WHERE created_at < NOW() - (p_warm_retention_days || ' days')::interval
        AND opened_at IS NULL
        AND clicked_at IS NULL
        AND COALESCE(status, '') NOT IN ('opened', 'clicked')
      ORDER BY created_at ASC
      LIMIT p_batch_size
    ),
    inserted AS (
      INSERT INTO public.email_logs_archive (
        id, to_email, subject, status, template_id, campaign_id, sequence_id,
        user_id, provider_message_id, sendgrid_message_id, metadata,
        opened_at, clicked_at, error_message, created_at, updated_at, archived_at
      )
      SELECT
        l.id, l.to_email, l.subject, l.status, l.template_id, l.campaign_id, l.sequence_id,
        l.user_id, l.provider_message_id, l.sendgrid_message_id, l.metadata,
        l.opened_at, l.clicked_at, l.error_message, l.created_at, l.updated_at, now()
      FROM public.email_logs l
      WHERE l.id IN (SELECT id FROM candidates)
        AND NOT EXISTS (SELECT 1 FROM public.email_logs_archive a WHERE a.id = l.id)
      RETURNING id
    ),
    removed AS (
      DELETE FROM public.email_logs
      WHERE id IN (SELECT id FROM inserted)
      RETURNING id
    )
    SELECT COUNT(*) INTO v_batch FROM removed;

    v_archived_warm := v_archived_warm + v_batch;
    v_deleted_warm := v_deleted_warm + v_batch;
    EXIT WHEN v_batch = 0;
  END LOOP;

  -- Cold tier: tous les logs après rétention froide (engagement inclus)
  LOOP
    WITH candidates AS (
      SELECT id
      FROM public.email_logs
      WHERE created_at < NOW() - (p_cold_retention_days || ' days')::interval
      ORDER BY created_at ASC
      LIMIT p_batch_size
    ),
    inserted AS (
      INSERT INTO public.email_logs_archive (
        id, to_email, subject, status, template_id, campaign_id, sequence_id,
        user_id, provider_message_id, sendgrid_message_id, metadata,
        opened_at, clicked_at, error_message, created_at, updated_at, archived_at
      )
      SELECT
        l.id, l.to_email, l.subject, l.status, l.template_id, l.campaign_id, l.sequence_id,
        l.user_id, l.provider_message_id, l.sendgrid_message_id, l.metadata,
        l.opened_at, l.clicked_at, l.error_message, l.created_at, l.updated_at, now()
      FROM public.email_logs l
      WHERE l.id IN (SELECT id FROM candidates)
        AND NOT EXISTS (SELECT 1 FROM public.email_logs_archive a WHERE a.id = l.id)
      RETURNING id
    ),
    removed AS (
      DELETE FROM public.email_logs
      WHERE id IN (SELECT id FROM inserted)
      RETURNING id
    )
    SELECT COUNT(*) INTO v_batch FROM removed;

    v_archived_cold := v_archived_cold + v_batch;
    v_deleted_cold := v_deleted_cold + v_batch;
    EXIT WHEN v_batch = 0;
  END LOOP;

  RETURN QUERY SELECT v_archived_warm, v_deleted_warm, v_archived_cold, v_deleted_cold;
END;
$$;

COMMENT ON FUNCTION public.cleanup_email_logs IS
  'Archive puis purge email_logs: 90j non-engagés, 730j tout. Agrégations daily requises avant purge.';

-- ---------------------------------------------------------------------------
-- 5. Batch maintenance (rollup + cleanups)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.run_email_maintenance_batch(
  p_warm_retention_days INTEGER DEFAULT 90,
  p_cold_retention_days INTEGER DEFAULT 730,
  p_webhook_retention_days INTEGER DEFAULT 30,
  p_batch_size INTEGER DEFAULT 5000
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_analytics_yesterday INTEGER := 0;
  v_analytics_boundary INTEGER := 0;
  v_webhook_deleted INTEGER := 0;
  v_idempotency_deleted INTEGER := 0;
  v_logs RECORD;
BEGIN
  v_analytics_yesterday := public.aggregate_daily_email_analytics(CURRENT_DATE - 1);
  v_analytics_boundary := public.aggregate_daily_email_analytics(
    (CURRENT_DATE - p_warm_retention_days)::date
  );

  SELECT * INTO v_logs
  FROM public.cleanup_email_logs(
    p_warm_retention_days,
    p_cold_retention_days,
    p_batch_size
  );

  v_webhook_deleted := public.cleanup_email_webhook_events(
    p_webhook_retention_days,
    p_batch_size
  );

  v_idempotency_deleted := public.cleanup_expired_idempotency_keys();

  RETURN jsonb_build_object(
    'success', TRUE,
    'analytics_yesterday_rows', v_analytics_yesterday,
    'analytics_boundary_rows', v_analytics_boundary,
    'archived_warm', COALESCE(v_logs.archived_warm, 0),
    'deleted_warm', COALESCE(v_logs.deleted_warm, 0),
    'archived_cold', COALESCE(v_logs.archived_cold, 0),
    'deleted_cold', COALESCE(v_logs.deleted_cold, 0),
    'webhook_events_deleted', v_webhook_deleted,
    'idempotency_keys_deleted', v_idempotency_deleted,
    'ran_at', now()
  );
END;
$$;

COMMENT ON FUNCTION public.run_email_maintenance_batch IS
  'Maintenance email nocturne: rollup analytics, archivage/purge logs, webhooks, idempotency.';

REVOKE EXECUTE ON FUNCTION public.cleanup_email_webhook_events(INTEGER, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_email_logs(INTEGER, INTEGER, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.run_email_maintenance_batch(INTEGER, INTEGER, INTEGER, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.cleanup_email_webhook_events(INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_email_logs(INTEGER, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.run_email_maintenance_batch(INTEGER, INTEGER, INTEGER, INTEGER) TO service_role;

-- ---------------------------------------------------------------------------
-- 6. Cron quotidien (05:00 UTC) — même pattern que email tags
-- ---------------------------------------------------------------------------
SELECT cron.unschedule('email-maintenance-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'email-maintenance-daily');

SELECT cron.schedule(
  'email-maintenance-daily',
  '0 5 * * *',
  $$ SELECT public.run_email_maintenance_batch(); $$
);

-- ---------------------------------------------------------------------------
-- 7. Mettre à jour le batch nightly maintenance (edge) pour inclure email
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.setup_nightly_maintenance_cron_job(
  p_project_ref TEXT,
  p_cron_secret TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, net
AS $$
DECLARE
  v_url TEXT;
  v_job_id BIGINT;
BEGIN
  IF p_project_ref IS NULL OR length(trim(p_project_ref)) = 0 THEN
    RAISE EXCEPTION 'p_project_ref is required';
  END IF;
  IF p_cron_secret IS NULL OR length(trim(p_cron_secret)) < 16 THEN
    RAISE EXCEPTION 'p_cron_secret must be at least 16 characters';
  END IF;

  v_url := format(
    'https://%s.supabase.co/functions/v1/process-nightly-maintenance',
    trim(p_project_ref)
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nightly-maintenance-batch') THEN
    PERFORM cron.unschedule('nightly-maintenance-batch');
  END IF;

  SELECT cron.schedule(
    'nightly-maintenance-batch',
    '0 4 * * *',
    format(
      $cmd$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', %L
        ),
        body := '{"jobs":["orphaned-orders","notification-cleanup","email-maintenance"]}'::jsonb
      ) AS request_id;
      $cmd$,
      v_url,
      p_cron_secret
    )
  ) INTO v_job_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'job_id', v_job_id,
    'job_name', 'nightly-maintenance-batch',
    'schedule', '0 4 * * *',
    'edge_url', v_url,
    'jobs', jsonb_build_array('orphaned-orders', 'notification-cleanup', 'email-maintenance')
  );
END;
$$;

COMMIT;
