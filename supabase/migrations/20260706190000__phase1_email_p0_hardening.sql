-- Phase 1 P0: retirer les policies INSERT permissives sur tables email sensibles.
-- Les Edge Functions utilisent service_role (bypass RLS) ; les clients ne doivent pas INSERT directement.

BEGIN;

DROP POLICY IF EXISTS "Service role can insert logs" ON public.email_logs;
DROP POLICY IF EXISTS "Service can insert enrollments" ON public.email_sequence_enrollments;
DROP POLICY IF EXISTS "Service can insert tags" ON public.email_user_tags;

COMMENT ON TABLE public.email_logs IS
  'Journal des envois email. INSERT réservé au service_role (Edge Functions).';

COMMIT;
