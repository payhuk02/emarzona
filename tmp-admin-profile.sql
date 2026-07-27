SELECT jsonb_build_object(
  'profile_cols', (
    SELECT COALESCE(jsonb_agg(column_name ORDER BY column_name), '[]'::jsonb)
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles'
      AND column_name IN ('id','user_id','role','is_super_admin')
  ),
  'admin_profile', (
    SELECT COALESCE(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
    FROM (
      SELECT id, user_id, role, is_super_admin
      FROM profiles
      WHERE user_id = '996df516-61c1-424f-aee3-cbc147a6e0ec'
         OR id = '996df516-61c1-424f-aee3-cbc147a6e0ec'
      LIMIT 3
    ) p
  ),
  'has_role_fn', (
    SELECT pg_get_functiondef(p.oid)
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname='has_role'
    LIMIT 1
  ),
  'fees_fn_args', (
    SELECT pg_get_function_identity_arguments(p.oid)
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname='admin_checkout_fees_summary'
    LIMIT 1
  )
) AS info;
