SELECT jsonb_build_object(
  'admins_profiles', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'user_id', user_id, 'role', role, 'is_super_admin', is_super_admin
    )), '[]'::jsonb)
    FROM profiles
    WHERE is_super_admin = true OR role IN ('admin','staff','manager','support','viewer')
    LIMIT 20
  ),
  'admins_roles', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('user_id', user_id, 'role', role)), '[]'::jsonb)
    FROM user_roles
    WHERE role::text = 'admin'
    LIMIT 20
  ),
  'principal', (
    SELECT jsonb_build_object('id', id, 'email', email)
    FROM auth.users WHERE email = 'contact@edigit-agence.com'
    LIMIT 1
  )
) AS info;
