-- =========================================================
-- Migration : Configuration Cron Jobs pour Edge Functions
-- Date : 1 Février 2025
-- Description : Configure les cron jobs pour les Edge Functions de transactions
-- =========================================================

-- IMPORTANT: Remplacez YOUR_PROJECT_REF par votre référence de projet Supabase
-- Vous pouvez la trouver dans Supabase Dashboard → Settings → API → Project URL
-- Exemple: https://hbdnzajbyjakdhuavrvb.supabase.co

-- Vérifier que l'extension pg_net est activée
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Vérifier que l'extension pg_cron est activée (si disponible)
-- Note: pg_cron peut nécessiter une activation manuelle dans Supabase Dashboard → Database → Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =========================================================
-- CRON JOB 1: Retry Failed Transactions
-- Exécution: Toutes les heures (0 * * * *)
-- =========================================================

-- Supprimer le cron job s'il existe déjà
SELECT cron.unschedule('retry-failed-transactions') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'retry-failed-transactions'
);

-- Créer le cron job pour retry-failed-transactions
SELECT cron.schedule(
  'retry-failed-transactions',
  '0 * * * *',  -- Toutes les heures à :00
  $$
  SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/retry-failed-transactions',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- =========================================================
-- CRON JOB 2: Auto Pay Commissions
-- Exécution: Tous les jours à 2h du matin (0 2 * * *)
-- =========================================================

-- Supprimer le cron job s'il existe déjà
SELECT cron.unschedule('auto-pay-commissions') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'auto-pay-commissions'
);

-- Créer le cron job pour auto-pay-commissions
SELECT cron.schedule(
  'auto-pay-commissions',
  '0 2 * * *',  -- Tous les jours à 2h du matin
  $$
  SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/auto-pay-commissions',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- =========================================================
-- CRON JOB 3: Transaction Alerts
-- Exécution: Toutes les 6 heures (0 */6 * * *)
-- =========================================================

-- Supprimer le cron job s'il existe déjà
SELECT cron.unschedule('transaction-alerts') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'transaction-alerts'
);

-- Créer le cron job pour transaction-alerts
SELECT cron.schedule(
  'transaction-alerts',
  '0 */6 * * *',  -- Toutes les 6 heures
  $$
  SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/transaction-alerts',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- =========================================================
-- VÉRIFICATION
-- =========================================================

-- Vérifier que les cron jobs sont bien créés
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobname IN ('retry-failed-transactions', 'auto-pay-commissions', 'transaction-alerts')
ORDER BY jobname;

-- Commentaires
COMMENT ON EXTENSION pg_net IS 'Extension pour faire des requêtes HTTP depuis PostgreSQL';
COMMENT ON EXTENSION pg_cron IS 'Extension pour exécuter des tâches planifiées (cron jobs)';

-- Instructions pour configuration manuelle si pg_cron n'est pas disponible:
-- 
-- 1. Allez dans Supabase Dashboard → Database → Cron Jobs
-- 2. Pour chaque fonction, créez un nouveau cron job avec les paramètres suivants:
--
-- **retry-failed-transactions:**
--   - Name: retry-failed-transactions
--   - Schedule: 0 * * * *
--   - SQL: (voir ci-dessus)
--
-- **auto-pay-commissions:**
--   - Name: auto-pay-commissions
--   - Schedule: 0 2 * * *
--   - SQL: (voir ci-dessus)
--
-- **transaction-alerts:**
--   - Name: transaction-alerts
--   - Schedule: 0 */6 * * *
--   - SQL: (voir ci-dessus)

