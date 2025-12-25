-- Création du cron job SSL Expiration via cron.schedule()
-- Date: 2025-02-02
-- Cette méthode utilise cron.schedule() qui est la méthode recommandée par Supabase

-- Supprimer le cron job existant s'il existe
SELECT cron.unschedule('check-ssl-expiration-daily');

-- Créer le nouveau cron job avec cron.schedule()
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

-- Vérifier que le cron job a été créé
SELECT 
  jobid,
  schedule,
  active,
  jobname,
  description
FROM cron.job 
WHERE jobname = 'check-ssl-expiration-daily';

