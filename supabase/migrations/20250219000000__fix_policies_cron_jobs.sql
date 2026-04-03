-- ============================================================
-- CORRECTION: Supprimer les policies existantes
-- Date: 19 Février 2025
-- Description: Supprime les policies existantes pour éviter les conflits
-- ============================================================

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Authenticated users can read cron jobs config" ON public.email_tags_cron_jobs_config;
DROP POLICY IF EXISTS "Authenticated users can update cron jobs config" ON public.email_tags_cron_jobs_config;

-- Recréer les policies
CREATE POLICY "Authenticated users can read cron jobs config"
ON public.email_tags_cron_jobs_config
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update cron jobs config"
ON public.email_tags_cron_jobs_config
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Vérification
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'email_tags_cron_jobs_config'
ORDER BY policyname;

