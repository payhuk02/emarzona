-- ============================================================
-- Création du Cron Job pour Vérification SSL Expiration
-- Date: 2025-02-02
-- Description: Vérifie quotidiennement l'expiration des certificats SSL
-- Schedule: Tous les jours à 9h00 UTC (0 9 * * *)
-- ============================================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Supprimer le cron job existant s'il existe (éviter les doublons)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'check-ssl-expiration-daily'
  ) THEN
    PERFORM cron.unschedule('check-ssl-expiration-daily');
    RAISE NOTICE 'Cron job existant supprimé';
  END IF;
END $$;

-- Créer le nouveau cron job
SELECT cron.schedule(
  'check-ssl-expiration-daily',  -- Nom du job
  '0 9 * * *',  -- Schedule: Tous les jours à 9h00 UTC
  $$
  SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/check-ssl-expiration',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5ODIzMSwiZXhwIjoyMDczMTc0MjMxfQ.MT2e4tcw_5eK0fRQFN5tF1Cwu210MKFUAUGqmYm_1XE"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Vérifier que le cron job a été créé avec succès
SELECT 
  jobid,
  schedule,
  active,
  jobname
FROM cron.job 
WHERE jobname = 'check-ssl-expiration-daily';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Cron job "check-ssl-expiration-daily" créé avec succès!';
  RAISE NOTICE '📅 Schedule: Tous les jours à 9h00 UTC';
  RAISE NOTICE '🔗 Edge Function: check-ssl-expiration';
END $$;

