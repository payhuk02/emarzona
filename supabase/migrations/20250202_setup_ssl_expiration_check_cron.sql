-- Configuration du cron job pour vérifier l'expiration SSL quotidiennement
-- Date: 2025-02-02
-- Description: Crée un cron job pour vérifier l'expiration des certificats SSL tous les jours à 9h00

-- IMPORTANT: Remplacez YOUR_SERVICE_ROLE_KEY par votre vraie clé service role
-- Vous pouvez la trouver dans: Settings > API > service_role key (secret)

-- Supprimer le cron job existant s'il existe
DELETE FROM cron.job WHERE jobname = 'check-ssl-expiration-daily';

-- Créer le cron job pour vérifier l'expiration SSL quotidiennement à 9h00
-- Format cron: minute hour day month weekday
-- '0 9 * * *' = Tous les jours à 9h00 UTC
INSERT INTO cron.job (
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname,
  description
)
VALUES (
  '0 9 * * *', -- Tous les jours à 9h00 UTC
  $$SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/check-ssl-expiration',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id$$,
  'localhost',
  5432,
  current_database(),
  'postgres',
  true,
  'check-ssl-expiration-daily',
  'Vérifie quotidiennement l''expiration des certificats SSL et envoie des alertes'
);

