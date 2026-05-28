-- Public unsubscribe (legacy migration)
-- Originally introduced 5-arg record_email_unsubscribe + public INSERT/UPDATE policies.
--
-- Superseded by: 20260528104000__harden_public_unsubscribe_rpc.sql
-- This migration is a no-op on re-run to avoid:
--   - ERROR 42725: function name "public.record_email_unsubscribe" is not unique
--   - ERROR 42710: policy "Public insert unsubscribe by email" already exists
--
-- Fresh installs: run 20260528104000 (or supabase/scripts/apply-harden-public-unsubscribe-prod.sql).

SELECT 1;
