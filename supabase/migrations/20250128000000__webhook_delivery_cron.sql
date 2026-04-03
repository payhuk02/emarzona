-- ============================================================================
-- MIGRATION: Webhook Delivery Cron Job
-- Date: 2025-01-28
-- Author: Emarzona Team
-- Description: Configure un cron job pour traiter automatiquement les webhooks
--              en attente toutes les minutes
-- ============================================================================

-- Activer l'extension pg_cron si disponible
-- Note: pg_cron doit être activé au niveau de la base de données Supabase
-- Si non disponible, utiliser Supabase Dashboard → Database → Cron Jobs

-- Activer l'extension pg_net si disponible (pour appeler l'Edge Function via HTTP)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Créer une fonction pour appeler l'Edge Function via pg_net
CREATE OR REPLACE FUNCTION public.call_webhook_delivery_edge_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $call_func$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  edge_function_url TEXT;
  request_id BIGINT;
BEGIN
  -- Récupérer l'URL Supabase depuis les variables d'environnement ou utiliser la valeur par défaut
  -- Note: Dans Supabase, l'URL peut être récupérée via current_setting ou stockée dans une table
  -- Pour l'instant, on utilise une approche qui nécessite la configuration via Supabase Dashboard
  
  -- Construire l'URL de l'Edge Function
  -- IMPORTANT: Remplacez YOUR_PROJECT_REF par votre référence de projet Supabase
  -- Vous pouvez la trouver dans Supabase Dashboard → Settings → API → Project URL
  supabase_url := current_setting('app.settings.supabase_url', true);
  
  IF supabase_url IS NULL OR supabase_url = '' THEN
    -- Utiliser la valeur par défaut (à remplacer par votre PROJECT_REF)
    -- Exemple: https://hbdnzajbyjakdhuavrvb.supabase.co
    RAISE NOTICE 'Supabase URL not configured. Using default. Please set app.settings.supabase_url in Supabase Dashboard → Settings → Database → Custom Config';
    -- Pour l'instant, on ne peut pas appeler sans URL, donc on retourne
    RETURN;
  END IF;
  
  -- Construire l'URL complète de l'Edge Function
  edge_function_url := supabase_url || '/functions/v1/webhook-delivery';
  
  -- Récupérer la clé service role
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  IF service_role_key IS NULL OR service_role_key = '' THEN
    RAISE NOTICE 'Service role key not configured. Please set app.settings.service_role_key in Supabase Dashboard → Settings → Database → Custom Config';
    RETURN;
  END IF;
  
  -- Vérifier si pg_net est disponible
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE NOTICE 'pg_net extension not available. Please enable it in Supabase Dashboard → Database → Extensions';
    RETURN;
  END IF;
  
  -- Appeler l'Edge Function via pg_net
  SELECT net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_role_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id;
  
  RAISE NOTICE 'Webhook delivery Edge Function called at %. Request ID: %', now(), request_id;
END;
$call_func$;

-- Créer une fonction pour appeler l'Edge Function de traitement des webhooks
-- Cette fonction est appelée par le cron job pour traiter les deliveries en attente
CREATE OR REPLACE FUNCTION public.process_pending_webhook_deliveries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $process_func$
BEGIN
  -- Appeler directement l'Edge Function qui va traiter toutes les deliveries en attente
  -- L'Edge Function récupère elle-même les deliveries pending/retrying et les traite
  PERFORM public.call_webhook_delivery_edge_function();
END;
$process_func$;

-- Configurer le cron job si pg_cron est disponible
DO $$
BEGIN
  -- Vérifier si pg_cron est disponible
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Supprimer le cron job existant s'il existe (gérer l'erreur si n'existe pas)
    BEGIN
      PERFORM cron.unschedule('process-webhook-deliveries');
    EXCEPTION
      WHEN OTHERS THEN
        -- Le cron job n'existe pas encore, c'est normal
        NULL;
    END;
    
    -- Programmer le cron job (toutes les minutes)
    PERFORM cron.schedule(
      'process-webhook-deliveries',
      '* * * * *', -- Toutes les minutes
      'SELECT public.process_pending_webhook_deliveries();'
    );
    
    RAISE NOTICE 'Cron job "process-webhook-deliveries" scheduled successfully';
  ELSE
    RAISE NOTICE 'pg_cron extension not available. Please configure cron job via Supabase Dashboard → Database → Cron Jobs';
    RAISE NOTICE '';
    RAISE NOTICE 'Configuration manuelle recommandée:';
    RAISE NOTICE '  Name: process-webhook-deliveries';
    RAISE NOTICE '  Schedule: * * * * * (every minute)';
    RAISE NOTICE '  SQL Command:';
    RAISE NOTICE '    SELECT net.http_post(';
    RAISE NOTICE '      url := ''https://YOUR_PROJECT_REF.supabase.co/functions/v1/webhook-delivery'',';
    RAISE NOTICE '      headers := jsonb_build_object(';
    RAISE NOTICE '        ''Authorization'', ''Bearer '' || current_setting(''app.settings.service_role_key'', true),';
    RAISE NOTICE '        ''Content-Type'', ''application/json''';
    RAISE NOTICE '      ),';
    RAISE NOTICE '      body := ''{}''::jsonb';
    RAISE NOTICE '    );';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: Remplacez YOUR_PROJECT_REF par votre référence de projet Supabase';
  END IF;
END $$;

-- Alternative: Instructions pour configuration manuelle via Supabase Dashboard
-- ============================================================================
-- CONFIGURATION MANUELLE DU CRON JOB
-- ============================================================================
-- 
-- Si pg_cron n'est pas disponible, configurez le cron job via:
-- Supabase Dashboard → Database → Cron Jobs → New Cron Job
--
-- Configuration recommandée:
--   Name: process-webhook-deliveries
--   Schedule: * * * * * (toutes les minutes)
--   Type: HTTP Request
--   URL: https://[PROJECT_REF].supabase.co/functions/v1/webhook-delivery
--   Method: POST
--   Headers:
--     Authorization: Bearer [SERVICE_ROLE_KEY]
--     Content-Type: application/json
--   Body: {}
--
-- OU utiliser pg_net pour appeler l'Edge Function depuis SQL:
--
-- CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- SELECT cron.schedule(
--   'process-webhook-deliveries',
--   '* * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://[PROJECT_REF].supabase.co/functions/v1/webhook-delivery',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer [SERVICE_ROLE_KEY]',
--       'Content-Type', 'application/json'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
--
-- ============================================================================

COMMENT ON FUNCTION public.call_webhook_delivery_edge_function IS 
  'Fonction helper pour appeler l''Edge Function de traitement des webhooks. 
   Configurez le cron job via Supabase Dashboard si pg_cron n''est pas disponible.';

COMMENT ON FUNCTION public.process_pending_webhook_deliveries IS 
  'Fonction pour préparer les deliveries de webhooks en attente pour traitement. 
   Appelée automatiquement par le cron job toutes les minutes.';

