-- ============================================================
-- SCRIPT SIMPLE DE CORRECTION PERMISSIONS CRON JOBS
-- Date: 19 Février 2025
-- Description: Script simple à exécuter directement dans Supabase Dashboard
-- ============================================================
-- 
-- INSTRUCTIONS:
-- 1. Copiez-collez ce script dans Supabase Dashboard > SQL Editor
-- 2. Exécutez-le
-- 3. Rechargez la page de gestion des tags
-- ============================================================

-- Vérifier si les fonctions existent
DO $$
BEGIN
  RAISE NOTICE 'Vérification des fonctions existantes...';
END $$;

-- ============================================================
-- 1. FONCTION get_email_tags_cron_jobs_status
-- ============================================================

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS public.get_email_tags_cron_jobs_status() CASCADE;

-- Créer la fonction avec SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_email_tags_cron_jobs_status()
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
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION public.get_email_tags_cron_jobs_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_tags_cron_jobs_status() TO anon;
GRANT EXECUTE ON FUNCTION public.get_email_tags_cron_jobs_status() TO service_role;

-- ============================================================
-- 2. FONCTION toggle_email_tags_cron_job
-- ============================================================

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS public.toggle_email_tags_cron_job(TEXT, BOOLEAN) CASCADE;

-- Créer la fonction avec SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.toggle_email_tags_cron_job(
  p_job_name TEXT,
  p_active BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = cron, public
AS $$
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
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION public.toggle_email_tags_cron_job(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_email_tags_cron_job(TEXT, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION public.toggle_email_tags_cron_job(TEXT, BOOLEAN) TO service_role;

-- ============================================================
-- 3. VÉRIFICATION
-- ============================================================

-- Vérifier que les fonctions existent et ont les bonnes permissions
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN p.prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security_type,
  n.nspname as schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('get_email_tags_cron_jobs_status', 'toggle_email_tags_cron_job')
ORDER BY p.proname;

-- Vérifier les permissions accordées (méthode alternative)
SELECT 
  routine_name as function_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_email_tags_cron_jobs_status', 'toggle_email_tags_cron_job')
ORDER BY routine_name;

-- Test de la fonction get_email_tags_cron_jobs_status
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.get_email_tags_cron_jobs_status();
  
  RAISE NOTICE '✅ Fonction get_email_tags_cron_jobs_status testée avec succès. % cron jobs trouvés.', v_count;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur lors du test: %', SQLERRM;
END $$;

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
-- 
-- Si vous voyez des erreurs, vérifiez:
-- 1. Que l'extension pg_cron est activée (Database > Extensions)
-- 2. Que vous exécutez ce script via Supabase Dashboard (pas CLI)
-- 3. Que les cron jobs existent bien dans cron.job
-- ============================================================

