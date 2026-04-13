-- =========================================================
-- Migration : Correction Authentification Cron Job Campagnes Email
-- Date : 30 Janvier 2025
-- Description : Ajoute le header Authorization au cron job pour résoudre les erreurs 401
-- =========================================================

-- Mettre à jour le cron job pour inclure un secret dédié x-cron-secret
-- Les fonctions sensibles doivent refuser les appels sans secret cron

-- Supprimer l'ancien cron job s'il existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'process-scheduled-email-campaigns'
  ) THEN
    PERFORM cron.unschedule('process-scheduled-email-campaigns');
  END IF;
END $$;

-- Recréer le cron job avec secret cron
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
  command
FROM cron.job
WHERE jobname = 'process-scheduled-email-campaigns';

