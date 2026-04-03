-- ============================================================
-- CORRECTION: Afficher le statut depuis la table de config
-- Date: 19 Février 2025
-- Description: Corrige la fonction pour utiliser la table de config comme source de vérité
-- ============================================================

-- Corriger la fonction get_email_tags_cron_jobs_status_safe
-- pour utiliser le statut de la table de config (source de vérité)
CREATE OR REPLACE FUNCTION public.get_email_tags_cron_jobs_status_safe()
RETURNS TABLE (
  job_name TEXT,
  schedule TEXT,
  command TEXT,
  active BOOLEAN,
  last_run TIMESTAMPTZ,
  last_status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = cron, public
AS $$
DECLARE
  config_record RECORD;
  cron_job_record RECORD;
BEGIN
  -- Parcourir la table de configuration (source de vérité)
  FOR config_record IN 
    SELECT * FROM public.email_tags_cron_jobs_config
    ORDER BY job_name
  LOOP
    -- Essayer de récupérer les infos du cron job réel (si accessible)
    BEGIN
      SELECT 
        j.jobname::TEXT,
        j.schedule::TEXT,
        LEFT(j.command::TEXT, 200) as command_preview,
        j.active,
        latest_run.start_time as last_run,
        latest_run.status as last_status
      INTO cron_job_record
      FROM cron.job j
      LEFT JOIN LATERAL (
        SELECT start_time, status
        FROM cron.job_run_details
        WHERE jobid = j.jobid
        ORDER BY start_time DESC
        LIMIT 1
      ) latest_run ON TRUE
      WHERE j.jobname = config_record.job_name
      LIMIT 1;
      
      -- Si on a trouvé le cron job, utiliser ses données MAIS prendre le statut actif de la config
      -- (car c'est ce que l'utilisateur a modifié via l'interface)
      IF cron_job_record.jobname IS NOT NULL THEN
        RETURN QUERY SELECT 
          cron_job_record.jobname,
          cron_job_record.schedule,
          cron_job_record.command_preview,
          config_record.active, -- ⚠️ IMPORTANT: Utiliser le statut de la table de config
          cron_job_record.last_run,
          cron_job_record.last_status;
      ELSE
        -- Sinon, utiliser les données de la table de configuration
        RETURN QUERY SELECT 
          config_record.job_name,
          config_record.schedule,
          'N/A'::TEXT as command,
          config_record.active,
          NULL::TIMESTAMPTZ as last_run,
          NULL::TEXT as last_status;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- En cas d'erreur (permission denied, etc.), utiliser la table de config
        RETURN QUERY SELECT 
          config_record.job_name,
          config_record.schedule,
          'N/A'::TEXT as command,
          config_record.active,
          NULL::TIMESTAMPTZ as last_run,
          NULL::TEXT as last_status;
    END;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.get_email_tags_cron_jobs_status_safe IS 'Récupère le statut des cron jobs en utilisant la table de config comme source de vérité pour le statut actif';

