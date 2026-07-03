-- Cron pg_cron : refresh des vues matérialisées dashboard (legacy + optimized)
-- Complète get_store_dashboard_stats_aggregated (live SQL) pour les RPC historiques.

BEGIN;

CREATE OR REPLACE FUNCTION public.refresh_dashboard_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_base_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_orders_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_customers_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_product_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_top_products;
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_recent_orders;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats_optimized;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_all_dashboard_materialized_views()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_started_at TIMESTAMPTZ := clock_timestamp();
BEGIN
  PERFORM public.refresh_dashboard_materialized_views();

  BEGIN
    PERFORM public.refresh_dashboard_stats();
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'dashboard_stats_optimized absente — refresh ignoré';
  END;

  RETURN jsonb_build_object(
    'success', TRUE,
    'refreshed_at', NOW(),
    'duration_ms', ROUND(
      EXTRACT(EPOCH FROM (clock_timestamp() - v_started_at)) * 1000
    )::INTEGER,
    'views', jsonb_build_array(
      'dashboard_base_stats',
      'dashboard_orders_stats',
      'dashboard_customers_stats',
      'dashboard_product_performance',
      'dashboard_top_products',
      'dashboard_recent_orders',
      'dashboard_stats_optimized'
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.setup_dashboard_materialized_views_cron_job(
  p_schedule TEXT DEFAULT '15 * * * *'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  v_job_id BIGINT;
  v_schedule TEXT := COALESCE(NULLIF(trim(p_schedule), ''), '15 * * * *');
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'pg_cron extension not available',
      'hint', 'Use GitHub workflow dashboard-views-cron.yml or run refresh_all_dashboard_materialized_views() manually'
    );
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-dashboard-materialized-views') THEN
    PERFORM cron.unschedule('refresh-dashboard-materialized-views');
  END IF;

  SELECT cron.schedule(
    'refresh-dashboard-materialized-views',
    v_schedule,
    $cmd$SELECT public.refresh_all_dashboard_materialized_views();$cmd$
  ) INTO v_job_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'job_id', v_job_id,
    'job_name', 'refresh-dashboard-materialized-views',
    'schedule', v_schedule,
    'command', 'SELECT public.refresh_all_dashboard_materialized_views();'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_all_dashboard_materialized_views() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_all_dashboard_materialized_views() TO service_role;

REVOKE ALL ON FUNCTION public.setup_dashboard_materialized_views_cron_job(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setup_dashboard_materialized_views_cron_job(TEXT) TO service_role;

DO $$
DECLARE
  v_setup jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    v_setup := public.setup_dashboard_materialized_views_cron_job('15 * * * *');
    RAISE NOTICE 'Dashboard MV cron: %', v_setup;
  ELSE
    RAISE NOTICE 'pg_cron indisponible — job refresh-dashboard-materialized-views non planifié';
  END IF;
END $$;

COMMENT ON FUNCTION public.refresh_all_dashboard_materialized_views() IS
  'Rafraîchit toutes les vues matérialisées dashboard (legacy + optimized). Appelé par pg_cron et GHA secours.';

COMMENT ON FUNCTION public.setup_dashboard_materialized_views_cron_job(TEXT) IS
  'Idempotent — planifie pg_cron refresh-dashboard-materialized-views (défaut: 15 * * * *, toutes les heures à :15).';

COMMIT;
