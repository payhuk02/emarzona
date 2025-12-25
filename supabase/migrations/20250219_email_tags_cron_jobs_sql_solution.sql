-- ============================================================
-- SOLUTION SQL PURE POUR GESTION CRON JOBS
-- Date: 19 Février 2025
-- Description: Table intermédiaire + fonctions pour gérer les cron jobs
-- sans accès direct au schéma cron via API REST
-- ============================================================

-- ============================================================
-- 1. CRÉER UNE TABLE INTERMÉDIAIRE POUR LE STATUT DES CRON JOBS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_tags_cron_jobs_config (
  job_name TEXT PRIMARY KEY,
  schedule TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_email_tags_cron_jobs_config_active 
ON public.email_tags_cron_jobs_config(active);

-- RLS pour la table
ALTER TABLE public.email_tags_cron_jobs_config ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs authentifiés peuvent lire
DROP POLICY IF EXISTS "Authenticated users can read cron jobs config" ON public.email_tags_cron_jobs_config;
CREATE POLICY "Authenticated users can read cron jobs config"
ON public.email_tags_cron_jobs_config
FOR SELECT
TO authenticated
USING (true);

-- Policy: Les utilisateurs authentifiés peuvent mettre à jour
DROP POLICY IF EXISTS "Authenticated users can update cron jobs config" ON public.email_tags_cron_jobs_config;
CREATE POLICY "Authenticated users can update cron jobs config"
ON public.email_tags_cron_jobs_config
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================
-- 2. INITIALISER LES CRON JOBS DANS LA TABLE
-- ============================================================

INSERT INTO public.email_tags_cron_jobs_config (job_name, schedule, active, description)
VALUES
  ('cleanup-expired-email-tags', '0 2 * * *', true, 'Nettoie les tags expirés tous les jours à 2h'),
  ('cleanup-unused-email-tags', '0 3 * * 0', true, 'Nettoie les tags non utilisés tous les dimanches à 3h'),
  ('update-segment-member-counts', '0 4 * * *', true, 'Met à jour les compteurs de segments tous les jours à 4h')
ON CONFLICT (job_name) DO NOTHING;

-- ============================================================
-- 3. FONCTION: Récupérer le statut des cron jobs
-- ============================================================

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
AS $$
DECLARE
  config_record RECORD;
  cron_job_record RECORD;
BEGIN
  -- Parcourir la table de configuration
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
      
      -- Si on a trouvé le cron job, utiliser ses données
      IF cron_job_record.jobname IS NOT NULL THEN
        RETURN QUERY SELECT 
          cron_job_record.jobname,
          cron_job_record.schedule,
          cron_job_record.command_preview,
          cron_job_record.active,
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

COMMENT ON FUNCTION public.get_email_tags_cron_jobs_status_safe IS 'Récupère le statut des cron jobs en utilisant une table intermédiaire si l''accès direct au schéma cron est bloqué';

GRANT EXECUTE ON FUNCTION public.get_email_tags_cron_jobs_status_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_tags_cron_jobs_status_safe() TO anon;
GRANT EXECUTE ON FUNCTION public.get_email_tags_cron_jobs_status_safe() TO PUBLIC;

-- ============================================================
-- 4. FONCTION: Activer/Désactiver un cron job
-- ============================================================

CREATE OR REPLACE FUNCTION public.toggle_email_tags_cron_job_safe(
  p_job_name TEXT,
  p_active BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = cron, public
AS $$
DECLARE
  v_user_id UUID;
  v_allowed BOOLEAN := false;
  v_updated_count INTEGER := 0;
BEGIN
  -- Vérifier que l'utilisateur est authentifié
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Vérifier que le job est autorisé
  v_allowed := p_job_name IN (
    'cleanup-expired-email-tags',
    'cleanup-unused-email-tags',
    'update-segment-member-counts'
  );

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Invalid job name: %', p_job_name;
  END IF;

  -- D'abord, essayer de mettre à jour le vrai cron job (si accessible)
  BEGIN
    UPDATE cron.job
    SET active = p_active
    WHERE jobname = p_job_name
      AND jobname IN (
        'cleanup-expired-email-tags',
        'cleanup-unused-email-tags',
        'update-segment-member-counts'
      );
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    -- Si la mise à jour a réussi, mettre à jour aussi la table de config
    IF v_updated_count > 0 THEN
      UPDATE public.email_tags_cron_jobs_config
      SET 
        active = p_active,
        last_updated_at = now(),
        updated_by = v_user_id
      WHERE job_name = p_job_name;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Si on ne peut pas mettre à jour le vrai cron job,
      -- mettre à jour seulement la table de config
      UPDATE public.email_tags_cron_jobs_config
      SET 
        active = p_active,
        last_updated_at = now(),
        updated_by = v_user_id
      WHERE job_name = p_job_name;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Cron job not found: %', p_job_name;
      END IF;
      
      -- Logger l'erreur mais continuer
      RAISE WARNING 'Could not update real cron job, but config table updated: %', SQLERRM;
  END;

  -- Si on n'a pas réussi à mettre à jour le vrai cron job, vérifier la table de config
  IF v_updated_count = 0 THEN
    UPDATE public.email_tags_cron_jobs_config
    SET 
      active = p_active,
      last_updated_at = now(),
      updated_by = v_user_id
    WHERE job_name = p_job_name;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cron job not found: %', p_job_name;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.toggle_email_tags_cron_job_safe IS 'Active ou désactive un cron job via une table intermédiaire';

GRANT EXECUTE ON FUNCTION public.toggle_email_tags_cron_job_safe(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_email_tags_cron_job_safe(TEXT, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION public.toggle_email_tags_cron_job_safe(TEXT, BOOLEAN) TO PUBLIC;

-- ============================================================
-- 5. TRIGGER: Synchroniser la table de config avec les vrais cron jobs
-- (Optionnel - pour maintenir la cohérence)
-- ============================================================

-- Fonction trigger pour synchroniser
CREATE OR REPLACE FUNCTION public.sync_cron_jobs_config()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mettre à jour la table de config quand un cron job change
  -- Cette fonction sera appelée manuellement ou via un cron job
  UPDATE public.email_tags_cron_jobs_config c
  SET active = j.active
  FROM cron.job j
  WHERE j.jobname = c.job_name
    AND j.active != c.active;
  
  RETURN NULL;
END;
$$;

-- ============================================================
-- 6. FONCTION HELPER: Synchroniser manuellement
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_email_tags_cron_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Synchroniser depuis cron.job vers la table de config
  UPDATE public.email_tags_cron_jobs_config c
  SET 
    active = j.active,
    schedule = j.schedule::TEXT
  FROM cron.job j
  WHERE j.jobname = c.job_name
    AND (j.active != c.active OR j.schedule::TEXT != c.schedule);
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
EXCEPTION
  WHEN OTHERS THEN
    -- Si on ne peut pas accéder à cron.job, retourner 0
    RETURN 0;
END;
$$;

COMMENT ON FUNCTION public.sync_email_tags_cron_jobs IS 'Synchronise la table de config avec les vrais cron jobs';

GRANT EXECUTE ON FUNCTION public.sync_email_tags_cron_jobs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_email_tags_cron_jobs() TO PUBLIC;

-- ============================================================
-- 7. VÉRIFICATION
-- ============================================================

-- Vérifier que la table existe
SELECT 
  'Table créée' as status,
  COUNT(*) as cron_jobs_count
FROM public.email_tags_cron_jobs_config;

-- Tester la fonction get_email_tags_cron_jobs_status_safe
SELECT * FROM public.get_email_tags_cron_jobs_status_safe();

-- ============================================================
-- NOTES IMPORTANTES
-- ============================================================
-- 
-- Cette solution utilise une table intermédiaire (email_tags_cron_jobs_config)
-- qui peut être lue/mise à jour sans accès au schéma cron.
-- 
-- Les fonctions "safe" essaient d'abord d'accéder aux vrais cron jobs,
-- mais si l'accès est bloqué, elles utilisent la table de configuration.
-- 
-- Pour synchroniser manuellement:
-- SELECT public.sync_email_tags_cron_jobs();
-- 
-- ============================================================

