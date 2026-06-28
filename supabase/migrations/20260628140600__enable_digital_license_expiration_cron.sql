-- Migration: Activation du Cron Job pour l'expiration des licences digitales
-- Date: 2026-06-28
-- Objectif: Corriger la faille DRM en réactivant l'expiration automatique des abonnements/licences.

DO $$
BEGIN
  -- Vérifier si l'extension pg_cron est installée
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
  
    -- 1. Nettoyer tout ancien job portant ce nom pour éviter les conflits
    IF EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'expire-digital-licenses'
    ) THEN
      PERFORM cron.unschedule('expire-digital-licenses');
    END IF;
    
    -- 2. Planifier le job pour s'exécuter tous les jours à minuit
    -- La fonction public.expire_digital_licenses() a été créée dans la migration 20251029000004
    PERFORM cron.schedule(
      'expire-digital-licenses',
      '0 0 * * *',
      'SELECT public.expire_digital_licenses();'
    );
    
    RAISE NOTICE 'Le cron job expire-digital-licenses a été planifié avec succès.';
    
  ELSE
    RAISE WARNING 'Extension pg_cron non trouvée. Le job d''expiration des licences n''a pas pu être planifié.';
  END IF;
END $$;
