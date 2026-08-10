-- P1: RLS admin plateforme pour webhooks sortants (toutes boutiques)

BEGIN;

-- webhooks — admins plateforme (CRUD toutes boutiques)
DROP POLICY IF EXISTS "Platform admins can manage all webhooks" ON public.webhooks;
CREATE POLICY "Platform admins can manage all webhooks"
  ON public.webhooks
  FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- webhook_deliveries — lecture admin (historique toutes boutiques)
DROP POLICY IF EXISTS "Platform admins can view all webhook deliveries" ON public.webhook_deliveries;
CREATE POLICY "Platform admins can view all webhook deliveries"
  ON public.webhook_deliveries
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

-- webhook_logs — lecture admin (compat legacy)
DROP POLICY IF EXISTS "Platform admins can view all webhook logs" ON public.webhook_logs;
CREATE POLICY "Platform admins can view all webhook logs"
  ON public.webhook_logs
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

COMMIT;
