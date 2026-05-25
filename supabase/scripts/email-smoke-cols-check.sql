SELECT count(*)::int AS c
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'email_logs'
  AND column_name IN ('to_email', 'status');
