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
    headers := '{"Content-Type": "application/json", "x-cron-secret": "REPLACE_WITH_SECURE_CRON_SECRET"}'::jsonb,
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

