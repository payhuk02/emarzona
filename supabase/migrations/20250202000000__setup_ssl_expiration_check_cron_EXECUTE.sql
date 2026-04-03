-- Configuration du cron job SSL avec votre Service Role Key
-- Date: 2025-02-02
-- ⚠️ IMPORTANT: Ne partagez jamais ce fichier publiquement car il contient votre clé secrète

-- Exécuter la fonction pour créer le cron job
SELECT * FROM setup_ssl_expiration_check_cron('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5ODIzMSwiZXhwIjoyMDczMTc0MjMxfQ.MT2e4tcw_5eK0fRQFN5tF1Cwu210MKFUAUGqmYm_1XE');

-- Vérifier que le cron job a été créé avec succès
SELECT 
  jobid,
  schedule,
  active,
  jobname,
  description
FROM cron.job 
WHERE jobname = 'check-ssl-expiration-daily';

