-- =========================================================
-- Migration : Correction Cron Job avec Service Role Key Directe
-- Date : 30 Janvier 2025
-- Description : Utilise la service role key directement pour résoudre les erreurs 401
-- =========================================================

-- ⚠️ ATTENTION : N'incluez jamais de service role key en clair dans une migration
-- Utilisez uniquement un secret d'exécution dédié au cron (x-cron-secret)

-- Supprimer l'ancien cron job
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'process-scheduled-email-campaigns'
  ) THEN
    PERFORM cron.unschedule('process-scheduled-email-campaigns');
  END IF;
END $$;

-- Recréer le cron job avec la service role key directement
SELECT cron.schedule(
  'process-scheduled-email-campaigns',
  '0,5,10,15,20,25,30,35,40,45,50,55 * * * *',  -- Toutes les 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-campaigns',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'REPLACE_WITH_SECURE_CRON_SECRET'
    ),
    body := jsonb_build_object('limit', 10)
  ) AS request_id;
  $$
);

-- Vérification
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  LEFT(command, 200) as command_preview
FROM cron.job
WHERE jobname = 'process-scheduled-email-campaigns';


