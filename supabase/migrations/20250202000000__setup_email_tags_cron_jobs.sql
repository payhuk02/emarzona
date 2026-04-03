-- ============================================================
-- CONFIGURATION CRON JOBS POUR NETTOYAGE AUTOMATIQUE
-- Date: 2 Février 2025
-- Description: Configure les tâches cron pour nettoyer automatiquement les tags
-- ============================================================

-- ============================================================
-- PRÉREQUIS: Extension pg_cron doit être activée
-- ============================================================

-- Vérifier si l'extension pg_cron est disponible
-- Si non disponible, cette migration échouera avec un message clair

-- ============================================================
-- 1. CRON JOB: Nettoyage des tags expirés (Quotidien)
-- ============================================================

-- Supprimer le cron job s'il existe déjà
SELECT cron.unschedule('cleanup-expired-email-tags') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-email-tags'
);

-- Créer le cron job pour nettoyer les tags expirés tous les jours à 2h du matin
-- Nettoie automatiquement les tags expirés tous les jours à 2h du matin
SELECT cron.schedule(
  'cleanup-expired-email-tags',
  '0 2 * * *', -- Tous les jours à 2h00
  $$
  SELECT cleanup_expired_tags();
  $$
);

-- ============================================================
-- 2. CRON JOB: Nettoyage des tags non utilisés (Hebdomadaire)
-- ============================================================

-- Supprimer le cron job s'il existe déjà
SELECT cron.unschedule('cleanup-unused-email-tags') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-unused-email-tags'
);

-- Créer le cron job pour nettoyer les tags non utilisés tous les dimanches à 3h du matin
-- Nettoie automatiquement les tags non utilisés depuis 90 jours tous les dimanches à 3h du matin
SELECT cron.schedule(
  'cleanup-unused-email-tags',
  '0 3 * * 0', -- Tous les dimanches à 3h00
  $$
  SELECT cleanup_unused_tags(NULL, 90);
  $$
);

-- ============================================================
-- 3. FONCTION HELPER: Mise à jour de tous les segments dynamiques
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_all_dynamic_segment_counts()
RETURNS INTEGER AS $$
DECLARE
  segment_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  -- Mettre à jour tous les segments dynamiques
  FOR segment_record IN 
    SELECT id FROM public.email_segments WHERE type = 'dynamic'
  LOOP
    PERFORM update_segment_member_count(segment_record.id);
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_all_dynamic_segment_counts IS 'Met à jour les compteurs de membres pour tous les segments dynamiques';

-- ============================================================
-- 4. CRON JOB: Mise à jour des compteurs de segments (Quotidien)
-- ============================================================

-- Supprimer le cron job s'il existe déjà
SELECT cron.unschedule('update-segment-member-counts') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'update-segment-member-counts'
);

-- Créer le cron job pour mettre à jour les compteurs de segments tous les jours à 4h du matin
-- Met à jour les compteurs de membres pour tous les segments dynamiques tous les jours à 4h du matin
SELECT cron.schedule(
  'update-segment-member-counts',
  '0 4 * * *', -- Tous les jours à 4h00
  $$
  SELECT update_all_dynamic_segment_counts();
  $$
);

-- ============================================================
-- 5. FONCTION HELPER: Vérifier l'état des cron jobs
-- ============================================================

-- Supprimer l'ancienne fonction si elle existe (pour permettre le changement de signature)
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

-- ============================================================
-- 6. FONCTION HELPER: Activer/Désactiver un cron job
-- ============================================================

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

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================

-- NOTE: Si l'extension pg_cron n'est pas disponible, vous devrez:
-- 1. Activer l'extension dans Supabase Dashboard > Database > Extensions
-- 2. Ou utiliser une alternative comme Supabase Edge Functions avec scheduling

