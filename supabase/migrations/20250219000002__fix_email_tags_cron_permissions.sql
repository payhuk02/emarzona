-- ============================================================
-- CORRECTION PERMISSIONS CRON JOBS POUR TAGS EMAIL
-- Date: 19 Février 2025
-- Description: Corrige les permissions d'accès aux cron jobs
-- ============================================================

-- ============================================================
-- 1. RECRÉER LA FONCTION get_email_tags_cron_jobs_status
-- avec les bonnes permissions
-- ============================================================

DROP FUNCTION IF EXISTS public.get_email_tags_cron_jobs_status();

CREATE OR REPLACE FUNCTION public.get_email_tags_cron_jobs_status()
RETURNS TABLE (
  job_name TEXT,
  schedule TEXT,
  command TEXT,
  active BOOLEAN,
  last_run TIMESTAMPTZ,
  last_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.jobname::TEXT,
    j.schedule::TEXT,
    LEFT(j.command::TEXT, 200) as command_preview,
    j.active,
    latest_run.start_time as last_run,
    latest_run.status as last_status
  FROM cron.job j
  LEFT JOIN LATERAL (
    SELECT start_time, status
    FROM cron.job_run_details
    WHERE jobid = j.jobid
    ORDER BY start_time DESC
    LIMIT 1
  ) latest_run ON TRUE
  WHERE j.jobname IN (
    'cleanup-expired-email-tags',
    'cleanup-unused-email-tags',
    'update-segment-member-counts'
  )
  ORDER BY j.jobname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = cron, public;

COMMENT ON FUNCTION public.get_email_tags_cron_jobs_status IS 'Retourne l''état de tous les cron jobs liés aux tags email';

-- Donner les permissions d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.get_email_tags_cron_jobs_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_tags_cron_jobs_status() TO anon;

-- ============================================================
-- 2. RECRÉER LA FONCTION toggle_email_tags_cron_job
-- avec les bonnes permissions
-- ============================================================

DROP FUNCTION IF EXISTS public.toggle_email_tags_cron_job(TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.toggle_email_tags_cron_job(
  p_job_name TEXT,
  p_active BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Mettre à jour le statut du cron job
  UPDATE cron.job
  SET active = p_active
  WHERE jobname = p_job_name
    AND jobname IN (
      'cleanup-expired-email-tags',
      'cleanup-unused-email-tags',
      'update-segment-member-counts'
    );
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cron job not found: %', p_job_name;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = cron, public;

COMMENT ON FUNCTION public.toggle_email_tags_cron_job IS 'Active ou désactive un cron job de nettoyage des tags';

-- Donner les permissions d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.toggle_email_tags_cron_job(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_email_tags_cron_job(TEXT, BOOLEAN) TO anon;

-- ============================================================
-- NOTE IMPORTANTE
-- ============================================================
-- Si cette migration échoue avec "permission denied for table job",
-- cela signifie que le rôle qui exécute la migration n'a pas les
-- permissions sur le schéma cron.
--
-- Solutions:
-- 1. Exécuter cette migration via Supabase Dashboard > SQL Editor
--    (elle s'exécutera avec les permissions du superutilisateur)
-- 2. Ou demander à un administrateur Supabase d'exécuter la migration
-- 3. Ou utiliser une alternative sans accès direct à cron.job
-- ============================================================

