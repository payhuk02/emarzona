-- Script COMPLET pour configurer le cron job SSL (tout-en-un)
-- Date: 2025-02-02
-- Ce script corrige la fonction ET crée le cron job en une seule fois

-- ============================================
-- ÉTAPE 1: Créer/Corriger la fonction helper
-- ============================================

CREATE OR REPLACE FUNCTION setup_ssl_expiration_check_cron(p_service_role_key TEXT)
RETURNS TABLE(jobid BIGINT, schedule TEXT, active BOOLEAN, jobname TEXT, description TEXT) AS $$
DECLARE
  v_command TEXT;
  v_headers TEXT;
BEGIN
  -- Supprimer le cron job existant s'il existe (qualifier explicitement pour éviter l'ambiguïté)
  DELETE FROM cron.job WHERE cron.job.jobname = 'check-ssl-expiration-daily';
  
  -- Construire les headers JSON avec la clé service role
  v_headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || p_service_role_key || '"}';
  
  -- Construire la commande SQL complète en échappant correctement les apostrophes
  v_command := 
    'SELECT net.http_post(' ||
    '  url := ''https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/check-ssl-expiration'', ' ||
    '  headers := ''' || replace(v_headers, '''', '''''') || '''::jsonb, ' ||
    '  body := ''{}''::jsonb' ||
    ') AS request_id';
  
  -- Créer le nouveau cron job
  INSERT INTO cron.job (
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active,
    jobname,
    description
  )
  VALUES (
    '0 9 * * *', -- Tous les jours à 9h00 UTC
    v_command,
    'localhost',
    5432,
    current_database(),
    'postgres',
    true,
    'check-ssl-expiration-daily',
    'Vérifie quotidiennement l''expiration des certificats SSL et envoie des alertes'
  );
  
  -- Retourner les informations du cron job créé (qualifier explicitement pour éviter l'ambiguïté)
  RETURN QUERY
  SELECT 
    j.jobid,
    j.schedule::TEXT,
    j.active,
    j.jobname,
    j.description
  FROM cron.job j
  WHERE cron.job.jobname = 'check-ssl-expiration-daily';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ÉTAPE 2: Créer le cron job avec votre clé
-- ============================================

SELECT * FROM setup_ssl_expiration_check_cron('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5ODIzMSwiZXhwIjoyMDczMTc0MjMxfQ.MT2e4tcw_5eK0fRQFN5tF1Cwu210MKFUAUGqmYm_1XE');

-- ============================================
-- ÉTAPE 3: Vérifier que le cron job est créé
-- ============================================

SELECT 
  jobid,
  schedule,
  active,
  jobname,
  description
FROM cron.job 
WHERE jobname = 'check-ssl-expiration-daily';

