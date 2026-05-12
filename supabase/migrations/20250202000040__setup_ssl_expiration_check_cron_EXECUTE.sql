-- Configuration du cron job SSL avec votre Service Role Key
-- Date: 2025-02-02
-- ⚠️ IMPORTANT: Ne partagez jamais ce fichier publiquement car il contient votre clé secrète

-- Exécuter la fonction pour créer le cron job
SELECT * FROM setup_ssl_expiration_check_cron(current_setting('app.settings.service_role_key', true));

-- Vérifier que le cron job a été créé avec succès
SELECT 
  jobid,
  schedule,
  active,
  jobname,
  description
FROM cron.job 
WHERE jobname = 'check-ssl-expiration-daily';

