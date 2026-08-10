-- Webhooks sortants : pipeline delivery + RLS admin
-- Exécution : psql ou supabase db execute -f tests/financial/webhook-delivery-alignment.test.sql

-- Test 1: call_webhook_delivery_edge_function(uuid) existe
DO $$
BEGIN
  ASSERT to_regprocedure('public.call_webhook_delivery_edge_function(uuid)') IS NOT NULL,
    'call_webhook_delivery_edge_function(uuid) must exist';
  RAISE NOTICE '✓ Test 1: call_webhook_delivery_edge_function exists';
END $$;

-- Test 2: trigger enqueue sur webhook_deliveries
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1
    FROM pg_trigger t
    INNER JOIN pg_class c ON c.oid = t.tgrelid
    INNER JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'webhook_deliveries'
      AND t.tgname = 'on_webhook_delivery_insert_enqueue'
      AND NOT t.tgisinternal
  ), 'on_webhook_delivery_insert_enqueue trigger must exist on webhook_deliveries';
  RAISE NOTICE '✓ Test 2: enqueue trigger on webhook_deliveries';
END $$;

-- Test 3: trigger_webhook + test_webhook RPC disponibles
DO $$
BEGIN
  ASSERT to_regprocedure('public.trigger_webhook(uuid, text, text, jsonb)') IS NOT NULL
      OR to_regprocedure('public.trigger_webhook(uuid, text, jsonb, text)') IS NOT NULL
      OR EXISTS (
        SELECT 1
        FROM pg_proc p
        INNER JOIN pg_namespace ns ON ns.oid = p.pronamespace
        WHERE ns.nspname = 'public' AND p.proname = 'trigger_webhook'
      ),
    'trigger_webhook must exist';
  ASSERT to_regprocedure('public.test_webhook(uuid)') IS NOT NULL,
    'test_webhook(uuid) must exist';
  RAISE NOTICE '✓ Test 3: trigger_webhook and test_webhook RPC exist';
END $$;

-- Test 4: policies admin plateforme
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'webhooks'
      AND policyname = 'Platform admins can manage all webhooks'
  ), 'Platform admins webhook policy must exist';
  ASSERT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'webhook_deliveries'
      AND policyname = 'Platform admins can view all webhook deliveries'
  ), 'Platform admins webhook_deliveries policy must exist';
  RAISE NOTICE '✓ Test 4: platform admin RLS policies exist';
END $$;

-- Test 5: verify_webhook_delivery_config RPC
DO $$
BEGIN
  ASSERT to_regprocedure('public.verify_webhook_delivery_config()') IS NOT NULL,
    'verify_webhook_delivery_config() must exist';
  RAISE NOTICE '✓ Test 5: verify_webhook_delivery_config exists';
END $$;
