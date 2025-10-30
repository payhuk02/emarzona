-- =====================================================
-- Platform Roles (RBAC) - role → permissions (jsonb)
-- Date: 2025-10-30
-- =====================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_roles (
  role TEXT PRIMARY KEY,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_platform_roles_updated_at
  BEFORE UPDATE ON public.platform_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default roles if absent
INSERT INTO public.platform_roles(role, permissions) VALUES
('super_admin', '{
  "users.manage": true,
  "users.roles": true,
  "products.manage": true,
  "orders.manage": true,
  "payments.manage": true,
  "disputes.manage": true,
  "settings.manage": true,
  "emails.manage": true,
  "analytics.view": true
}'),
('admin', '{
  "users.manage": true,
  "products.manage": true,
  "orders.manage": true,
  "payments.manage": true,
  "disputes.manage": true,
  "settings.manage": false,
  "emails.manage": true,
  "analytics.view": true
}'),
('manager', '{
  "users.manage": false,
  "products.manage": true,
  "orders.manage": true,
  "payments.manage": true,
  "disputes.manage": true,
  "settings.manage": false,
  "emails.manage": false,
  "analytics.view": true
}'),
('moderator', '{
  "users.manage": false,
  "products.manage": false,
  "orders.manage": false,
  "payments.manage": false,
  "disputes.manage": true,
  "settings.manage": false,
  "emails.manage": false,
  "analytics.view": true
}'),
('support', '{
  "users.manage": false,
  "products.manage": false,
  "orders.manage": true,
  "payments.manage": false,
  "disputes.manage": true,
  "settings.manage": false,
  "emails.manage": false,
  "analytics.view": true
}'),
('viewer', '{
  "analytics.view": true
}')
ON CONFLICT (role) DO NOTHING;

COMMIT;

COMMENT ON TABLE public.platform_roles IS 'Role-based permissions (RBAC) for admin capabilities';


