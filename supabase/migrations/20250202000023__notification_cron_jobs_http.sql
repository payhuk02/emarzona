-- ================================================================
-- Notification System - Cron Jobs Configuration (HTTP Version)
-- Date: 2 Février 2025
-- Description: Jobs cron qui appellent les Edge Functions via HTTP
-- 
-- IMPORTANT: Cette migration nécessite l'extension http pour appeler les Edge Functions
-- ================================================================

-- Activer l'extension http (si disponible)
CREATE EXTENSION IF NOT EXISTS http;

-- Récupérer les variables d'environnement (à adapter selon votre configuration)
-- Note: Ces valeurs doivent être configurées dans Supabase Dashboard > Settings > Edge Functions

-- ================================================================
-- 1. TRAITEMENT DES NOTIFICATIONS SCHEDULÉES (HTTP)
-- ================================================================

-- Supprimer l'ancien job
SELECT cron.unschedule('process-scheduled-notifications') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-scheduled-notifications'
);

-- Créer le job qui appelle l'Edge Function
SELECT cron.schedule(
  'process-scheduled-notifications',
  '*/5 * * * *', -- Toutes les 5 minutes
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/process-scheduled-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ================================================================
-- 2. TRAITEMENT DES RETRIES (HTTP)
-- ================================================================

SELECT cron.unschedule('process-notification-retries') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-notification-retries'
);

SELECT cron.schedule(
  'process-notification-retries',
  '*/10 * * * *', -- Toutes les 10 minutes
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/process-notification-retries',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ================================================================
-- 3. ENVOI DES DIGESTS QUOTIDIENS (HTTP)
-- ================================================================

SELECT cron.unschedule('send-daily-digests') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-daily-digests'
);

SELECT cron.schedule(
  'send-daily-digests',
  '0 8 * * *', -- Tous les jours à 8h00 UTC
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-digests',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := jsonb_build_object('period', 'daily')
  ) AS request_id;
  $$
);

-- ================================================================
-- 4. ENVOI DES DIGESTS HEBDOMADAIRES (HTTP)
-- ================================================================

SELECT cron.unschedule('send-weekly-digests') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-weekly-digests'
);

SELECT cron.schedule(
  'send-weekly-digests',
  '0 8 * * 1', -- Tous les lundis à 8h00 UTC
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-digests',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := jsonb_build_object('period', 'weekly')
  ) AS request_id;
  $$
);

-- ================================================================
-- NOTES IMPORTANTES
-- ================================================================

/*
IMPORTANT: Pour utiliser cette version HTTP, vous devez :

1. Configurer les variables d'environnement dans Supabase :
   - app.supabase_url : URL de votre projet Supabase
   - app.supabase_anon_key : Clé anonyme de votre projet

2. Ou remplacer directement dans les requêtes :
   - current_setting('app.supabase_url') par 'https://YOUR_PROJECT.supabase.co'
   - current_setting('app.supabase_anon_key') par votre clé anonyme

3. Vérifier que l'extension http est disponible :
   - Certains projets Supabase peuvent ne pas avoir cette extension
   - Dans ce cas, utiliser la version avec fonctions SQL (20250202_notification_cron_jobs.sql)

4. Alternative : Utiliser pg_net si disponible au lieu de http
*/

