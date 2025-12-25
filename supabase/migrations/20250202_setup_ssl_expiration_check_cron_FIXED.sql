-- Configuration du cron job pour vérifier l'expiration SSL quotidiennement (CORRIGÉ)
-- Date: 2025-02-02
-- Correction: Résout l'erreur d'ambiguïté de colonne jobname

-- Fonction helper pour créer le cron job avec les bonnes permissions
CREATE OR REPLACE FUNCTION setup_ssl_expiration_check_cron(p_service_role_key TEXT)
RETURNS TABLE(jobid BIGINT, schedule TEXT, active BOOLEAN, jobname TEXT, description TEXT) AS $$
DECLARE
  v_command TEXT;
  v_headers TEXT;
BEGIN
  -- Supprimer le cron job existant s'il existe (qualifier explicitement la colonne)
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
  
  -- Retourner les informations du cron job créé
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

-- Commentaire
COMMENT ON FUNCTION setup_ssl_expiration_check_cron IS 'Crée ou met à jour le cron job pour vérifier l''expiration SSL. Utilisez: SELECT * FROM setup_ssl_expiration_check_cron(''YOUR_SERVICE_ROLE_KEY'');';

-- INSTRUCTIONS:
-- 1. Exécutez d'abord ce script pour créer/corriger la fonction
-- 2. Ensuite, exécutez cette commande avec votre Service Role Key:
--    SELECT * FROM setup_ssl_expiration_check_cron('VOTRE_SERVICE_ROLE_KEY');

