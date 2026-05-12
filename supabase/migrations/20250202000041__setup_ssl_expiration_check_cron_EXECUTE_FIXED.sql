-- Script corrigé pour créer le cron job SSL (avec résolution de l'ambiguïté)
-- Date: 2025-02-02

-- ÉTAPE 1: D'abord, exécutez ce script pour créer/corriger la fonction
-- (Fichier: 20250202_setup_ssl_expiration_check_cron_FIXED.sql)

-- ÉTAPE 2: Ensuite, exécutez cette commande pour créer le cron job
SELECT * FROM setup_ssl_expiration_check_cron(current_setting('app.settings.service_role_key', true));

-- ÉTAPE 3: Vérifier que le cron job a été créé avec succès
SELECT 
  jobid,
  schedule,
  active,
  jobname,
  description
FROM cron.job 
WHERE jobname = 'check-ssl-expiration-daily';

