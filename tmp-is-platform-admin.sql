SELECT jsonb_build_object(
  'is_platform_admin_def', (
    SELECT pg_get_functiondef(p.oid)
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='is_platform_admin'
    ORDER BY p.oid DESC LIMIT 1
  ),
  'tx_order_fks', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('con', c.conname, 'def', pg_get_constraintdef(c.oid))), '[]'::jsonb)
    FROM pg_constraint c
    WHERE c.conrelid = 'public.transactions'::regclass AND c.contype='f'
      AND pg_get_constraintdef(c.oid) ILIKE '%order%'
  ),
  'auth_email', (
    SELECT email FROM auth.users WHERE id = '996df516-61c1-424f-aee3-cbc147a6e0ec'
  )
) AS info;
