-- Configuration du cron job pour vérifier l'expiration SSL quotidiennement
-- Date: 2025-02-02
-- Description: Crée un cron job pour vérifier l'expiration des certificats SSL tous les jours à 9h00 UTC

-- ⚠️ IMPORTANT: Ce script doit être exécuté avec les permissions appropriées
-- Option 1: Via le dashboard Supabase (recommandé)
-- Option 2: Via cette fonction helper avec SECURITY DEFINER

-- Fonction helper pour créer le cron job avec les bonnes permissions
CREATE OR REPLACE FUNCTION setup_ssl_expiration_check_cron(p_service_role_key TEXT)
RETURNS TABLE(jobid BIGINT, schedule TEXT, active BOOLEAN, jobname TEXT, description TEXT) AS $$
DECLARE
  v_command TEXT;
BEGIN
  -- Supprimer le cron job existant s'il existe
  DELETE FROM cron.job WHERE cron.job.jobname = 'check-ssl-expiration-daily';
  
  -- Construire la commande SQL avec la clé service role
  v_command := format(
    'SELECT net.http_post(' ||
    '  url := %L, ' ||
    '  headers := %L::jsonb, ' ||
    '  body := %L::jsonb' ||
    ') AS request_id',
    'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/check-ssl-expiration',
    format('{"Content-Type": "application/json", "Authorization": "Bearer %s"}', p_service_role_key),
    '{}'
  );
  
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
    j.schedule,
    j.active,
    j.jobname,
    j.description
  FROM cron.job j
  WHERE cron.job.jobname = 'check-ssl-expiration-daily';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire
COMMENT ON FUNCTION setup_ssl_expiration_check_cron IS 'Crée ou met à jour le cron job pour vérifier l''expiration SSL. Utilisez: SELECT * FROM setup_ssl_expiration_check_cron(''YOUR_SERVICE_ROLE_KEY'');';

-- Exemple d'utilisation (décommentez et remplacez YOUR_SERVICE_ROLE_KEY):
-- SELECT * FROM setup_ssl_expiration_check_cron('YOUR_SERVICE_ROLE_KEY');

