-- Documentation : cron campagnes email programmées
-- Ne pas stocker de secret en clair dans pg_cron.
--
-- Configuration requise :
-- 1. Définir CRON_SECRET dans Supabase Dashboard → Edge Functions → Secrets
-- 2. Définir RESEND_API_KEY, RESEND_WEBHOOK_SECRET, EDGE_INTERNAL_SECRET
-- 3. Créer le cron job via Dashboard (Database → Cron) ou SQL ci-dessous
--    en remplaçant YOUR_PROJECT_REF et YOUR_CRON_SECRET
--
-- Exemple d'appel HTTP (pg_net) :
-- SELECT net.http_post(
--   url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-scheduled-campaigns',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'x-cron-secret', 'YOUR_CRON_SECRET'
--   ),
--   body := jsonb_build_object('limit', 10)
-- );
--
-- Désactiver l'ancien job avec placeholder si présent :
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'process-scheduled-email-campaigns'
  ) THEN
    PERFORM cron.unschedule('process-scheduled-email-campaigns');
    RAISE NOTICE 'Unscheduled legacy process-scheduled-email-campaigns cron (reconfigure with CRON_SECRET).';
  END IF;
EXCEPTION
  WHEN undefined_table THEN
  NULL;
  WHEN OTHERS THEN
  RAISE NOTICE 'Could not unschedule cron job: %', SQLERRM;
END $$;
