-- =========================================================
-- Migration : Configuration et Activation Auto-Payout
-- Date : 30 Janvier 2025
-- Description : Configure les cron jobs et active les fonctionnalités de reversement automatique
-- =========================================================

-- =========================================================
-- PARTIE 1 : Configuration des Cron Jobs
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

-- Supprimer les cron jobs existants s'ils existent
DO $$
BEGIN
  PERFORM cron.unschedule('auto-payout-vendors-daily');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('auto-pay-referral-commissions-daily');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Créer le cron job pour auto-payout-vendors (3h du matin)
SELECT cron.schedule(
  'auto-payout-vendors-daily',
  '0 3 * * *', -- Tous les jours à 3h du matin
  $$
  SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/auto-payout-vendors',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5ODIzMSwiZXhwIjoyMDczMTc0MjMxfQ.MT2e4tcw_5eK0fRQFN5tF1Cwu210MKFUAUGqmYm_1XE',
      'x-cron-secret', 'auto-payout-vendors-secret-2025'
    ),
    body := jsonb_build_object()
  ) AS request_id;
  $$
);

-- Créer le cron job pour auto-pay-referral-commissions (4h du matin)
SELECT cron.schedule(
  'auto-pay-referral-commissions-daily',
  '0 4 * * *', -- Tous les jours à 4h du matin
  $$
  SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/auto-pay-referral-commissions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5ODIzMSwiZXhwIjoyMDczMTc0MjMxfQ.MT2e4tcw_5eK0fRQFN5tF1Cwu210MKFUAUGqmYm_1XE',
      'x-cron-secret', 'auto-pay-referral-commissions-secret-2025'
    ),
    body := jsonb_build_object()
  ) AS request_id;
  $$
);

-- =========================================================
-- PARTIE 2 : Configuration dans platform_settings
-- =========================================================

-- Ajouter/Modifier les configurations
INSERT INTO public.platform_settings(key, settings)
VALUES ('admin', jsonb_build_object(
  'auto_payout_vendors', jsonb_build_object(
    'enabled', true,  -- ACTIVÉ
    'delay_days', 7,
    'min_amount', 50000
  ),
  'auto_pay_referral_commissions', jsonb_build_object(
    'enabled', true,  -- ACTIVÉ
    'min_amount', 50000
  )
))
ON CONFLICT (key) DO UPDATE SET 
  settings = COALESCE(platform_settings.settings, '{}'::jsonb) || jsonb_build_object(
    'auto_payout_vendors', COALESCE(
      platform_settings.settings->'auto_payout_vendors',
      jsonb_build_object('enabled', true, 'delay_days', 7, 'min_amount', 50000)
    ) || jsonb_build_object('enabled', true),
    'auto_pay_referral_commissions', COALESCE(
      platform_settings.settings->'auto_pay_referral_commissions',
      jsonb_build_object('enabled', true, 'min_amount', 50000)
    ) || jsonb_build_object('enabled', true)
  ),
  updated_at = now();

-- =========================================================
-- PARTIE 3 : Vérification
-- =========================================================

-- Afficher les cron jobs configurés
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  LEFT(command, 100) as command_preview
FROM cron.job
WHERE jobname IN ('auto-payout-vendors-daily', 'auto-pay-referral-commissions-daily')
ORDER BY jobname;

-- Afficher la configuration
SELECT 
  settings->'auto_payout_vendors'->>'enabled' as auto_payout_enabled,
  settings->'auto_payout_vendors'->>'delay_days' as delay_days,
  settings->'auto_payout_vendors'->>'min_amount' as min_amount,
  settings->'auto_pay_referral_commissions'->>'enabled' as auto_pay_referral_enabled,
  settings->'auto_pay_referral_commissions'->>'min_amount' as referral_min_amount
FROM platform_settings
WHERE key = 'admin';


