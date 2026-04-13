-- =========================================================
-- Migration : Configuration Cron Jobs pour Auto-Payout
-- Date : 30 Janvier 2025
-- Description : Configure les cron jobs pour reversement automatique des fonds et paiement des commissions parrainage
-- =========================================================

-- Vérifier que pg_cron est activé
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  END IF;
END $$;

-- Vérifier que pg_net est activé (pour appels HTTP)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    CREATE EXTENSION IF NOT EXISTS pg_net;
  END IF;
END $$;

-- =========================================================
-- CRON JOB 1 : Auto-Payout Vendors (3h du matin)
-- =========================================================

-- Supprimer le cron job existant s'il existe
DO $$
BEGIN
  PERFORM cron.unschedule('auto-payout-vendors-daily');
EXCEPTION
  WHEN OTHERS THEN
    -- Ignorer si le job n'existe pas
    NULL;
END $$;

-- Créer le cron job pour auto-payout-vendors
-- Schedule: 0 3 * * * (tous les jours à 3h du matin)
SELECT cron.schedule(
  'auto-payout-vendors-daily',
  '0 3 * * *', -- Tous les jours à 3h du matin
  $$
  SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/auto-payout-vendors',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'REPLACE_WITH_SECURE_CRON_SECRET'
    ),
    body := jsonb_build_object()
  ) AS request_id;
  $$
);

-- Commentaire
COMMENT ON EXTENSION pg_cron IS 'Extension pour planifier des tâches cron. 
Job auto-payout-vendors-daily: Exécute auto-payout-vendors tous les jours à 3h du matin.';

-- =========================================================
-- CRON JOB 2 : Auto-Pay Referral Commissions (4h du matin)
-- =========================================================

-- Supprimer le cron job existant s'il existe
DO $$
BEGIN
  PERFORM cron.unschedule('auto-pay-referral-commissions-daily');
EXCEPTION
  WHEN OTHERS THEN
    -- Ignorer si le job n'existe pas
    NULL;
END $$;

-- Créer le cron job pour auto-pay-referral-commissions
-- Schedule: 0 4 * * * (tous les jours à 4h du matin)
SELECT cron.schedule(
  'auto-pay-referral-commissions-daily',
  '0 4 * * *', -- Tous les jours à 4h du matin
  $$
  SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/auto-pay-referral-commissions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'REPLACE_WITH_SECURE_CRON_SECRET'
    ),
    body := jsonb_build_object()
  ) AS request_id;
  $$
);

-- Commentaire
COMMENT ON EXTENSION pg_cron IS 'Extension pour planifier des tâches cron. 
Job auto-pay-referral-commissions-daily: Exécute auto-pay-referral-commissions tous les jours à 4h du matin.';

-- =========================================================
-- VÉRIFICATION DES CRON JOBS
-- =========================================================

-- Afficher les cron jobs configurés
DO $$
DECLARE
  job_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO job_count
  FROM cron.job
  WHERE jobname IN ('auto-payout-vendors-daily', 'auto-pay-referral-commissions-daily');
  
  RAISE NOTICE 'Cron jobs configurés: %', job_count;
END $$;

