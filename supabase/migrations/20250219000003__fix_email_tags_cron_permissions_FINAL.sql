-- ============================================================
-- CORRECTION FINALE PERMISSIONS CRON JOBS - VERSION ROBUSTE
-- Date: 19 Février 2025
-- Description: Script final pour corriger définitivement les permissions
-- ============================================================
-- 
-- INSTRUCTIONS:
-- 1. Copiez-collez ce script dans Supabase Dashboard > SQL Editor
-- 2. Exécutez-le
-- 3. Vérifiez les résultats dans la section "VÉRIFICATION FINALE"
-- 4. Rechargez la page de gestion des tags
-- ============================================================

-- ============================================================
-- 1. SUPPRIMER LES ANCIENNES FONCTIONS (si elles existent)
-- ============================================================

DROP FUNCTION IF EXISTS public.get_email_tags_cron_jobs_status() CASCADE;
DROP FUNCTION IF EXISTS public.toggle_email_tags_cron_job(TEXT, BOOLEAN) CASCADE;

-- ============================================================
-- 2. CRÉER get_email_tags_cron_jobs_status
-- ============================================================

CREATE FUNCTION public.get_email_tags_cron_jobs_status()
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

-- ============================================================
-- 3. CRÉER toggle_email_tags_cron_job
-- ============================================================

CREATE FUNCTION public.toggle_email_tags_cron_job(
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

-- ============================================================
-- 4. ACCORDER LES PERMISSIONS EXPLICITEMENT
-- ============================================================

-- Permissions pour get_email_tags_cron_jobs_status
-- IMPORTANT: Accorder les permissions à tous les rôles nécessaires
GRANT EXECUTE ON FUNCTION public.get_email_tags_cron_jobs_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_tags_cron_jobs_status() TO anon;
GRANT EXECUTE ON FUNCTION public.get_email_tags_cron_jobs_status() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_email_tags_cron_jobs_status() TO postgres;
-- Accorder aussi au rôle PUBLIC (tous les utilisateurs)
GRANT EXECUTE ON FUNCTION public.get_email_tags_cron_jobs_status() TO PUBLIC;

-- Permissions pour toggle_email_tags_cron_job
GRANT EXECUTE ON FUNCTION public.toggle_email_tags_cron_job(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_email_tags_cron_job(TEXT, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION public.toggle_email_tags_cron_job(TEXT, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.toggle_email_tags_cron_job(TEXT, BOOLEAN) TO postgres;
-- Accorder aussi au rôle PUBLIC (tous les utilisateurs)
GRANT EXECUTE ON FUNCTION public.toggle_email_tags_cron_job(TEXT, BOOLEAN) TO PUBLIC;

-- ============================================================
-- 5. VÉRIFIER QUE LE SCHÉMA PUBLIC EST ACCESSIBLE
-- ============================================================

-- S'assurer que le schéma public est dans le search_path par défaut
ALTER DATABASE postgres SET search_path = public, extensions;

-- ============================================================
-- 6. VÉRIFICATION FINALE
-- ============================================================

-- Vérifier l'existence des fonctions
DO $$
DECLARE
  v_func1_exists BOOLEAN;
  v_func2_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'get_email_tags_cron_jobs_status'
  ) INTO v_func1_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'toggle_email_tags_cron_job'
  ) INTO v_func2_exists;
  
  IF v_func1_exists AND v_func2_exists THEN
    RAISE NOTICE '✅ Les deux fonctions existent';
  ELSE
    RAISE WARNING '❌ Certaines fonctions manquent. func1: %, func2: %', v_func1_exists, v_func2_exists;
  END IF;
END $$;

-- Vérifier les permissions
SELECT 
  routine_name,
  routine_type,
  security_type,
  routine_schema
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_email_tags_cron_jobs_status', 'toggle_email_tags_cron_job')
ORDER BY routine_name;

-- Test de la fonction get_email_tags_cron_jobs_status
DO $$
DECLARE
  v_count INTEGER;
  v_error TEXT;
BEGIN
  BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.get_email_tags_cron_jobs_status();
    
    RAISE NOTICE '✅ Test get_email_tags_cron_jobs_status: SUCCÈS (% cron jobs trouvés)', v_count;
  EXCEPTION
    WHEN OTHERS THEN
      v_error := SQLERRM;
      RAISE WARNING '❌ Test get_email_tags_cron_jobs_status: ERREUR - %', v_error;
  END;
END $$;

-- Test de la fonction toggle_email_tags_cron_job (lecture seule - on ne modifie pas vraiment)
DO $$
DECLARE
  v_result BOOLEAN;
  v_error TEXT;
BEGIN
  BEGIN
    -- On teste juste que la fonction peut être appelée (on ne change pas vraiment l'état)
    -- On récupère d'abord l'état actuel
    SELECT active INTO v_result
    FROM cron.job
    WHERE jobname = 'cleanup-expired-email-tags'
    LIMIT 1;
    
    IF v_result IS NOT NULL THEN
      -- On appelle la fonction avec la même valeur pour ne rien changer
      PERFORM public.toggle_email_tags_cron_job('cleanup-expired-email-tags', v_result);
      RAISE NOTICE '✅ Test toggle_email_tags_cron_job: SUCCÈS (fonction appelable)';
    ELSE
      RAISE WARNING '⚠️ Test toggle_email_tags_cron_job: Cron job non trouvé (normal si non configuré)';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      v_error := SQLERRM;
      RAISE WARNING '❌ Test toggle_email_tags_cron_job: ERREUR - %', v_error;
  END;
END $$;

-- ============================================================
-- 7. VÉRIFICATION DES PERMISSIONS PAR RÔLE
-- ============================================================

SELECT 
  p.proname as function_name,
  pr.rolname as role_name,
  CASE 
    WHEN has_function_privilege(pr.oid, p.oid, 'EXECUTE') THEN '✅ OUI'
    ELSE '❌ NON'
  END as can_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
CROSS JOIN pg_roles pr
WHERE n.nspname = 'public'
  AND p.proname IN ('get_email_tags_cron_jobs_status', 'toggle_email_tags_cron_job')
  AND pr.rolname IN ('authenticated', 'anon', 'service_role', 'postgres')
ORDER BY p.proname, pr.rolname;

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
-- 
-- Si vous voyez encore des erreurs 403 après avoir exécuté ce script:
-- 1. Vérifiez que vous êtes bien connecté en tant qu'utilisateur authentifié
-- 2. Vérifiez que l'extension pg_cron est activée
-- 3. Contactez le support Supabase si le problème persiste
-- ============================================================

