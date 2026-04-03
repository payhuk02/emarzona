-- =========================================================
-- Migration : Configuration Cron Job pour Retry Automatique
-- Date : 1 Février 2025
-- Description : Configure le cron job pour exécuter retry-failed-transactions toutes les heures
-- =========================================================

-- Note: Cette migration nécessite l'extension pg_cron et pg_net
-- Vérifier que ces extensions sont activées dans Supabase Dashboard → Database → Extensions

-- Fonction helper pour appeler l'Edge Function
CREATE OR REPLACE FUNCTION public.call_retry_failed_transactions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_role_key TEXT;
BEGIN
  -- Récupérer l'URL Supabase depuis les variables d'environnement
  -- Note: Dans Supabase, vous pouvez utiliser current_setting() ou stocker dans une table
  -- Pour l'instant, nous utiliserons une approche qui nécessite la configuration manuelle
  
  -- Cette fonction sera appelée par le cron job
  -- L'URL et la clé doivent être configurées dans Supabase Dashboard → Settings → API
  
  -- Pour l'instant, on laisse vide car le cron job sera configuré manuellement
  -- via Supabase Dashboard → Database → Cron Jobs
  RAISE NOTICE 'This function should be called by pg_cron. Configure the cron job manually in Supabase Dashboard.';
END;
$$;

COMMENT ON FUNCTION public.call_retry_failed_transactions() IS 'Helper function for cron job. Configure the actual cron job in Supabase Dashboard → Database → Cron Jobs';

-- Instructions pour configuration manuelle du cron job:
-- 
-- 1. Allez dans Supabase Dashboard → Database → Cron Jobs
-- 2. Créez un nouveau cron job avec:
--    - Name: retry-failed-transactions
--    - Schedule: 0 * * * * (toutes les heures)
--    - SQL Command:
-- 
--    SELECT net.http_post(
--      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/retry-failed-transactions',
--      headers := jsonb_build_object(
--        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
--      ),
--      body := '{}'::jsonb
--    );
--
-- 3. Remplacez YOUR_PROJECT_REF par votre référence de projet Supabase
-- 4. Vérifiez que l'extension pg_net est activée (Database → Extensions)

-- Alternative: Utiliser pg_cron directement (si activé)
-- SELECT cron.schedule(
--   'retry-failed-transactions',
--   '0 * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/retry-failed-transactions',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );

