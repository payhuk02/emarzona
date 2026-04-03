-- =========================================================
-- Migration : Configuration Cron Job pour Campagnes Email Programmées
-- Date : 30 Janvier 2025
-- Description : Configure le cron job pour traiter automatiquement les campagnes email programmées
-- =========================================================

-- IMPORTANT: Cette migration configure le cron job pour appeler l'Edge Function
-- process-scheduled-campaigns toutes les 5 minutes.
-- 
-- Si pg_cron n'est pas disponible, configurez le cron job via Supabase Dashboard :
-- Database > Cron Jobs > New Cron Job

-- Vérifier que l'extension pg_net est activée (pour les requêtes HTTP)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Vérifier que l'extension pg_cron est activée (si disponible)
-- Note: pg_cron peut nécessiter une activation manuelle dans Supabase Dashboard → Database → Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =========================================================
-- CRON JOB: Process Scheduled Email Campaigns
-- Exécution: Toutes les 5 minutes (0,5,10,15,20,25,30,35,40,45,50,55 * * * *)
-- =========================================================

-- Supprimer le cron job s'il existe déjà (pour éviter les doublons)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'process-scheduled-email-campaigns'
  ) THEN
    PERFORM cron.unschedule('process-scheduled-email-campaigns');
  END IF;
END $$;

-- Créer le cron job pour process-scheduled-campaigns
-- Remplacez 'hbdnzajbyjakdhuavrvb' par votre Project ID Supabase si différent
SELECT cron.schedule(
  'process-scheduled-email-campaigns',
  '0,5,10,15,20,25,30,35,40,45,50,55 * * * *',  -- Toutes les 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-campaigns',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'x-cron-secret', 'process-scheduled-campaigns-secret-2025'
    ),
    body := jsonb_build_object('limit', 10)
  ) AS request_id;
  $$
);

-- =========================================================
-- Vérification
-- =========================================================

-- Afficher tous les cron jobs configurés (pour vérification)
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'process-scheduled-email-campaigns'
ORDER BY jobname;

-- Commentaires
COMMENT ON EXTENSION pg_net IS 'Extension pour faire des requêtes HTTP depuis PostgreSQL';
COMMENT ON EXTENSION pg_cron IS 'Extension pour exécuter des tâches planifiées (cron jobs)';

-- =========================================================
-- Instructions pour configuration manuelle si pg_cron n'est pas disponible
-- =========================================================
-- 
-- 1. Allez dans Supabase Dashboard → Database → Cron Jobs
-- 2. Cliquez sur "New Cron Job"
-- 3. Configurez :
--    - Name: process-scheduled-email-campaigns
--    - Schedule: 0,5,10,15,20,25,30,35,40,45,50,55 * * * *
--    - SQL Command: (voir la commande ci-dessus)
-- 
-- OU utilisez un service externe (GitHub Actions, Vercel Cron, etc.)
-- Voir docs/CONFIGURATION_CRON_CAMPAGNES_PROGRAMMEES.md pour plus de détails

