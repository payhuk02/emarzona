SELECT jsonb_build_object(
  'roles', (
    SELECT COALESCE(jsonb_agg(to_jsonb(r)), '[]'::jsonb)
    FROM user_roles r
    WHERE r.user_id = '996df516-61c1-424f-aee3-cbc147a6e0ec'
  ),
  'has_admin', public.has_role('996df516-61c1-424f-aee3-cbc147a6e0ec'::uuid, 'admin'::app_role)
) AS info;
