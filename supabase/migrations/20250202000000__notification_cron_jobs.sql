-- ================================================================
-- Notification System - Cron Jobs Configuration
-- Date: 2 Février 2025
-- Description: Configuration des jobs cron pour les notifications
-- ================================================================

-- Vérifier que l'extension pg_cron est activée
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ================================================================
-- 1. TRAITEMENT DES NOTIFICATIONS SCHEDULÉES
-- ================================================================
-- Traiter les notifications programmées toutes les 5 minutes

-- Supprimer le job s'il existe déjà
SELECT cron.unschedule('process-scheduled-notifications') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-scheduled-notifications'
);

-- Fonction pour traiter les notifications schedulées
CREATE OR REPLACE FUNCTION process_scheduled_notifications_job()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier s'il y a des notifications en attente
  -- Le traitement réel sera fait par une Edge Function
  PERFORM 1 FROM public.scheduled_notifications
  WHERE status = 'pending'
    AND scheduled_at <= NOW()
  LIMIT 1;
  
  -- Si des notifications sont en attente, log pour monitoring
  IF FOUND THEN
    RAISE NOTICE 'Scheduled notifications pending - trigger processing';
  END IF;
END;
$$;

-- Créer le job
SELECT cron.schedule(
  'process-scheduled-notifications',
  '*/5 * * * *', -- Toutes les 5 minutes
  $$SELECT process_scheduled_notifications_job();$$
);

-- ================================================================
-- 2. TRAITEMENT DES RETRIES EN ATTENTE
-- ================================================================
-- Traiter les retries toutes les 10 minutes

SELECT cron.unschedule('process-notification-retries') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-notification-retries'
);

-- Fonction pour traiter les retries
CREATE OR REPLACE FUNCTION process_notification_retries_job()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier s'il y a des retries en attente
  PERFORM 1 FROM public.notification_retries
  WHERE status = 'pending'
    AND next_retry_at <= NOW()
  LIMIT 1;
  
  IF FOUND THEN
    RAISE NOTICE 'Notification retries pending - trigger processing';
  END IF;
END;
$$;

SELECT cron.schedule(
  'process-notification-retries',
  '*/10 * * * *', -- Toutes les 10 minutes
  $$SELECT process_notification_retries_job();$$
);

-- ================================================================
-- 3. ENVOI DES DIGESTS QUOTIDIENS
-- ================================================================
-- Envoyer les digests quotidiens tous les jours à 8h00 (UTC)

SELECT cron.unschedule('send-daily-digests') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-daily-digests'
);

-- Fonction pour vérifier les digests quotidiens
CREATE OR REPLACE FUNCTION check_daily_digests_job()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM 1 FROM public.notification_preferences
  WHERE email_digest_frequency = 'daily'
  LIMIT 1;
  
  IF FOUND THEN
    RAISE NOTICE 'Daily digests to send - trigger processing';
  END IF;
END;
$$;

SELECT cron.schedule(
  'send-daily-digests',
  '0 8 * * *', -- Tous les jours à 8h00 UTC
  $$SELECT check_daily_digests_job();$$
);

-- ================================================================
-- 4. ENVOI DES DIGESTS HEBDOMADAIRES
-- ================================================================
-- Envoyer les digests hebdomadaires tous les lundis à 8h00 (UTC)

SELECT cron.unschedule('send-weekly-digests') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-weekly-digests'
);

-- Fonction pour vérifier les digests hebdomadaires
CREATE OR REPLACE FUNCTION check_weekly_digests_job()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM 1 FROM public.notification_preferences
  WHERE email_digest_frequency = 'weekly'
  LIMIT 1;
  
  IF FOUND THEN
    RAISE NOTICE 'Weekly digests to send - trigger processing';
  END IF;
END;
$$;

SELECT cron.schedule(
  'send-weekly-digests',
  '0 8 * * 1', -- Tous les lundis à 8h00 UTC
  $$SELECT check_weekly_digests_job();$$
);

-- ================================================================
-- 5. NETTOYAGE AUTOMATIQUE
-- ================================================================
-- Nettoyer les anciennes notifications tous les jours à 2h00 (UTC)

SELECT cron.unschedule('cleanup-notifications') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-notifications'
);

SELECT cron.schedule(
  'cleanup-notifications',
  '0 2 * * *', -- Tous les jours à 2h00 UTC
  $$
  SELECT * FROM cleanup_notifications_enhanced();
  $$
);

-- ================================================================
-- 6. NETTOYAGE DES RATE LIMITS
-- ================================================================
-- Nettoyer les anciens rate limits toutes les heures

SELECT cron.unschedule('cleanup-rate-limits') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-rate-limits'
);

SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 * * * *', -- Toutes les heures
  $$
  DELETE FROM public.notification_rate_limits
  WHERE sent_at < NOW() - INTERVAL '7 days';
  $$
);

-- ================================================================
-- 7. RAPPELS DE RÉSERVATIONS (SERVICES)
-- ================================================================
-- Vérifier les rappels de réservations toutes les heures

SELECT cron.unschedule('check-service-booking-reminders') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'check-service-booking-reminders'
);

-- Fonction pour vérifier les rappels de réservations
CREATE OR REPLACE FUNCTION check_service_booking_reminders_job()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM 1 FROM public.service_bookings
  WHERE status = 'confirmed'
    AND (
      (booking_date = CURRENT_DATE + INTERVAL '1 day' AND booking_time::TIME = CURRENT_TIME)
      OR
      (booking_date = CURRENT_DATE AND booking_time::TIME = CURRENT_TIME + INTERVAL '1 hour')
    )
  LIMIT 1;
  
  IF FOUND THEN
    RAISE NOTICE 'Service booking reminders to send - trigger processing';
  END IF;
END;
$$;

SELECT cron.schedule(
  'check-service-booking-reminders',
  '0 * * * *', -- Toutes les heures
  $$SELECT check_service_booking_reminders_job();$$
);

-- ================================================================
-- 8. VÉRIFICATION DES LICENCES EXPIRANTES (PRODUITS DIGITAUX)
-- ================================================================
-- Vérifier les licences expirantes tous les jours à 9h00

SELECT cron.unschedule('check-expiring-licenses') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'check-expiring-licenses'
);

-- Fonction pour vérifier les licences expirantes
CREATE OR REPLACE FUNCTION check_expiring_licenses_job()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM 1 FROM public.digital_licenses
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at <= NOW() + INTERVAL '7 days'
    AND expires_at > NOW()
  LIMIT 1;
  
  IF FOUND THEN
    RAISE NOTICE 'Expiring licenses found - trigger notifications';
  END IF;
END;
$$;

SELECT cron.schedule(
  'check-expiring-licenses',
  '0 9 * * *', -- Tous les jours à 9h00 UTC
  $$SELECT check_expiring_licenses_job();$$
);

-- ================================================================
-- 9. VÉRIFICATION DES PAIEMENTS EN ATTENTE
-- ================================================================
-- Vérifier les paiements en attente toutes les 6 heures

SELECT cron.unschedule('check-pending-payments') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'check-pending-payments'
);

-- Fonction pour vérifier les paiements en attente
CREATE OR REPLACE FUNCTION check_pending_payments_job()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM 1 FROM public.transactions
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '3 days'
  LIMIT 1;
  
  IF FOUND THEN
    RAISE NOTICE 'Pending payments found - trigger reminders';
  END IF;
END;
$$;

SELECT cron.schedule(
  'check-pending-payments',
  '0 */6 * * *', -- Toutes les 6 heures
  $$SELECT check_pending_payments_job();$$
);

-- ================================================================
-- 10. RAPPORTS HEBDOMADAIRES (COMMISSIONS)
-- ================================================================
-- Envoyer les rapports hebdomadaires tous les lundis à 9h00

SELECT cron.unschedule('send-weekly-commission-reports') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-weekly-commission-reports'
);

-- Fonction pour vérifier les rapports de commissions
CREATE OR REPLACE FUNCTION check_weekly_commission_reports_job()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM 1 FROM public.affiliates
  WHERE status = 'active'
  LIMIT 1;
  
  IF FOUND THEN
    RAISE NOTICE 'Weekly commission reports to send - trigger processing';
  END IF;
END;
$$;

SELECT cron.schedule(
  'send-weekly-commission-reports',
  '0 9 * * 1', -- Tous les lundis à 9h00 UTC
  $$SELECT check_weekly_commission_reports_job();$$
);

-- ================================================================
-- VÉRIFICATION DES JOBS
-- ================================================================

-- Fonction pour lister tous les jobs cron de notifications
CREATE OR REPLACE FUNCTION list_notification_cron_jobs()
RETURNS TABLE (
  jobname TEXT,
  schedule TEXT,
  command TEXT,
  nodename TEXT,
  nodeport INTEGER,
  database TEXT,
  username TEXT,
  active BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    jobname::TEXT,
    schedule::TEXT,
    command::TEXT,
    nodename::TEXT,
    nodeport,
    database::TEXT,
    username::TEXT,
    active
  FROM cron.job
  WHERE jobname LIKE '%notification%' 
     OR jobname LIKE '%digest%'
     OR jobname LIKE '%retry%'
     OR jobname LIKE '%cleanup%'
     OR jobname LIKE '%booking%'
     OR jobname LIKE '%license%'
     OR jobname LIKE '%payment%'
     OR jobname LIKE '%commission%'
  ORDER BY jobname;
$$;

-- Commentaires
COMMENT ON FUNCTION list_notification_cron_jobs() IS 
'Lister tous les jobs cron liés aux notifications';

-- ================================================================
-- NOTES IMPORTANTES
-- ================================================================

/*
IMPORTANT: Les jobs cron ci-dessus déclenchent principalement des vérifications
et des logs. Le traitement réel des notifications doit être fait via :

1. Edge Functions Supabase qui appellent les services TypeScript
2. Ou directement via des fonctions SQL plus complexes

Pour implémenter le traitement réel, créer des Edge Functions :
- supabase/functions/process-scheduled-notifications/index.ts
- supabase/functions/process-notification-retries/index.ts
- supabase/functions/send-digests/index.ts
- etc.

Et modifier les jobs cron pour appeler ces Edge Functions via HTTP.
*/

