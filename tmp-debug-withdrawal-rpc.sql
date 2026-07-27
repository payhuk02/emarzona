SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS args,
  CASE WHEN p.prosecdef THEN 'definer' ELSE 'invoker' END AS security
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'request_store_withdrawal';

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'store_withdrawals'
ORDER BY ordinal_position;

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'store_earnings'
  AND column_name IN ('withdrawals_blocked', 'withdrawals_blocked_reason', 'available_balance');
