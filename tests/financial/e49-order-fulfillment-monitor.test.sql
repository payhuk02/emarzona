-- E49 — Order fulfillment monitoring RPC exists

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'detect_stale_order_fulfillment'
  ) THEN
    RAISE EXCEPTION 'detect_stale_order_fulfillment missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'record_order_fulfillment_alert'
  ) THEN
    RAISE EXCEPTION 'record_order_fulfillment_alert missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'order_fulfillment_alerts'
  ) THEN
    RAISE EXCEPTION 'order_fulfillment_alerts table missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'admin_detect_stale_order_fulfillment'
  ) THEN
    RAISE EXCEPTION 'admin_detect_stale_order_fulfillment missing';
  END IF;
END $$;

-- Smoke: RPC returns expected shape
SELECT
  (public.detect_stale_order_fulfillment(5)->>'stale_count') IS NOT NULL AS has_stale_count,
  jsonb_typeof(public.detect_stale_order_fulfillment(5)->'orders') = 'array' AS orders_is_array;
