-- ============================================================
-- Migration corrective : rendre idempotentes les 4 policies
-- détectées par l'audit audit-migrations-idempotency.sh
-- ============================================================

-- 1. warranty_history (référencée dans 2 migrations)
DROP POLICY IF EXISTS "Users can view warranty history" ON public.warranty_history;

-- 2. email_tags_cron_jobs_config
DROP POLICY IF EXISTS "Authenticated users can update cron jobs config" ON public.email_tags_cron_jobs_config;

-- 3. user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
