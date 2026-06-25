-- Phase 2 : Enterprise Readiness - SOC2 Compliance
-- Rendre les tables d'audit immuables (Append-Only)

CREATE OR REPLACE FUNCTION public.prevent_update_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'P0001: Audit logs are immutable for SOC2 compliance. UPDATE or DELETE operations are strictly forbidden.';
END;
$$;

-- 1. Table : admin_actions
DROP TRIGGER IF EXISTS trg_admin_actions_immutable ON public.admin_actions;
CREATE TRIGGER trg_admin_actions_immutable
  BEFORE UPDATE OR DELETE ON public.admin_actions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_update_delete();

-- 2. Table : store_audit_events
DROP TRIGGER IF EXISTS trg_store_audit_events_immutable ON public.store_audit_events;
CREATE TRIGGER trg_store_audit_events_immutable
  BEFORE UPDATE OR DELETE ON public.store_audit_events
  FOR EACH ROW EXECUTE FUNCTION public.prevent_update_delete();

-- 3. Table : audit_export_logs
DROP TRIGGER IF EXISTS trg_audit_export_logs_immutable ON public.audit_export_logs;
CREATE TRIGGER trg_audit_export_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_export_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_update_delete();

-- FIN de la migration SOC2
