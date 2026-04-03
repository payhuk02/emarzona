-- ================================================================
-- Notification System Improvements - Phase 3
-- Date: 2 Février 2025
-- Description: Tables pour i18n et améliorations
-- ================================================================

-- Table pour traductions de notifications
CREATE TABLE IF NOT EXISTS public.notification_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('fr', 'en')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contrainte unique
  CONSTRAINT notification_translations_unique 
    UNIQUE (notification_type, language)
);

-- Index pour traductions
CREATE INDEX IF NOT EXISTS idx_notification_translations_type_lang 
  ON public.notification_translations(notification_type, language);

-- Ajouter colonnes pour préférences utilisateur (si n'existent pas)
DO $$
BEGIN
  -- Ajouter timezone si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name = 'timezone'
  ) THEN
    ALTER TABLE public.profiles 
      ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;

  -- Ajouter preferred_notification_hours si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name = 'preferred_notification_hours'
  ) THEN
    ALTER TABLE public.profiles 
      ADD COLUMN preferred_notification_hours JSONB DEFAULT '{"start": 8, "end": 22}'::jsonb;
  END IF;

  -- Ajouter preferred_notification_days si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name = 'preferred_notification_days'
  ) THEN
    ALTER TABLE public.profiles 
      ADD COLUMN preferred_notification_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6];
  END IF;

  -- Ajouter language si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name = 'language'
  ) THEN
    ALTER TABLE public.profiles 
      ADD COLUMN language TEXT DEFAULT 'fr' CHECK (language IN ('fr', 'en'));
  END IF;
END $$;

-- Ajouter notification_frequency dans notification_preferences si n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notification_preferences'
    AND column_name = 'notification_frequency'
  ) THEN
    ALTER TABLE public.notification_preferences 
      ADD COLUMN notification_frequency INTEGER DEFAULT 10; -- notifications par heure
  END IF;
END $$;

-- Fonction améliorée pour nettoyage automatique
CREATE OR REPLACE FUNCTION cleanup_notifications_enhanced()
RETURNS TABLE (
  logs_deleted INTEGER,
  rate_limits_deleted INTEGER,
  retries_deleted INTEGER,
  scheduled_deleted INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_logs_deleted INTEGER := 0;
  v_rate_limits_deleted INTEGER := 0;
  v_retries_deleted INTEGER := 0;
  v_scheduled_deleted INTEGER := 0;
BEGIN
  -- Supprimer les logs de plus de 90 jours (sauf ceux avec engagement)
  DELETE FROM public.notification_logs
  WHERE sent_at < NOW() - INTERVAL '90 days'
    AND (status NOT IN ('opened', 'clicked') OR opened_at IS NULL);
  
  GET DIAGNOSTICS v_logs_deleted = ROW_COUNT;
  
  -- Supprimer les rate limits de plus de 7 jours
  DELETE FROM public.notification_rate_limits
  WHERE sent_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS v_rate_limits_deleted = ROW_COUNT;
  
  -- Supprimer les retries complétés de plus de 30 jours
  DELETE FROM public.notification_retries
  WHERE status IN ('completed', 'failed')
    AND completed_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_retries_deleted = ROW_COUNT;
  
  -- Supprimer les scheduled notifications complétées de plus de 30 jours
  DELETE FROM public.scheduled_notifications
  WHERE status IN ('sent', 'cancelled', 'failed')
    AND (sent_at < NOW() - INTERVAL '30 days' 
         OR cancelled_at < NOW() - INTERVAL '30 days');
  
  GET DIAGNOSTICS v_scheduled_deleted = ROW_COUNT;
  
  RETURN QUERY SELECT 
    v_logs_deleted,
    v_rate_limits_deleted,
    v_retries_deleted,
    v_scheduled_deleted;
END;
$$;

-- RLS Policies

-- Translations: Lecture publique
ALTER TABLE public.notification_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view translations"
  ON public.notification_translations
  FOR SELECT
  USING (true);

-- Commentaires
COMMENT ON TABLE public.notification_translations IS 
'Traductions des notifications (multilingue)';

COMMENT ON FUNCTION cleanup_notifications_enhanced() IS 
'Nettoyage amélioré des notifications avec statistiques';

