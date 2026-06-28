-- ==============================================================================
-- ⏱️ Phase Finale: pg_cron pour le Worker DLQ (Retry automatisé)
-- ==============================================================================
-- Active l'extension pg_cron et planifie un job toutes les minutes
-- qui appelle l'Edge Function process-webhook-dlq via pg_net (HTTP asynchrone).
-- ==============================================================================

-- 1. Activer les extensions requises (pg_cron est disponible nativement sur Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Planifier le job DLQ toutes les minutes (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-webhook-dlq-worker') THEN
    PERFORM cron.unschedule('process-webhook-dlq-worker');
  END IF;
END $$;

SELECT cron.schedule(
    'process-webhook-dlq-worker',   -- Nom unique du job
    '* * * * *',                     -- Toutes les minutes (cron expression)
    $$
    SELECT net.http_post(
        url := coalesce(nullif(current_setting('custom.supabase_url', true), ''), 'https://hbdnzajbyjakdhuavrvb.supabase.co') || '/functions/v1/process-webhook-dlq',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('custom.service_role_key', true)
        ),
        body := '{}'::jsonb
    );
    $$
);

-- 3. Vérification : lister les jobs planifiés
-- SELECT * FROM cron.job;
