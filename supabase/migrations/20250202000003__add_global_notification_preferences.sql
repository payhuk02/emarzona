-- =========================================================
-- Migration : Ajout des préférences globales de notifications
-- Date : 2 Février 2025
-- Description : Ajoute les champs globaux email_notifications, push_notifications, sms_notifications
-- =========================================================

-- Ajouter les colonnes manquantes si elles n'existent pas
DO $$ 
BEGIN
  -- Ajouter email_notifications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notification_preferences' 
    AND column_name = 'email_notifications'
  ) THEN
    ALTER TABLE public.notification_preferences 
    ADD COLUMN email_notifications BOOLEAN DEFAULT true;
    
    -- Mettre à jour les valeurs existantes (true par défaut)
    UPDATE public.notification_preferences 
    SET email_notifications = true 
    WHERE email_notifications IS NULL;
  END IF;

  -- Ajouter push_notifications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notification_preferences' 
    AND column_name = 'push_notifications'
  ) THEN
    ALTER TABLE public.notification_preferences 
    ADD COLUMN push_notifications BOOLEAN DEFAULT true;
    
    -- Mettre à jour les valeurs existantes (true par défaut)
    UPDATE public.notification_preferences 
    SET push_notifications = true 
    WHERE push_notifications IS NULL;
  END IF;

  -- Ajouter sms_notifications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notification_preferences' 
    AND column_name = 'sms_notifications'
  ) THEN
    ALTER TABLE public.notification_preferences 
    ADD COLUMN sms_notifications BOOLEAN DEFAULT false;
    
    -- Mettre à jour les valeurs existantes (false par défaut)
    UPDATE public.notification_preferences 
    SET sms_notifications = false 
    WHERE sms_notifications IS NULL;
  END IF;
END $$;

-- Commentaires
COMMENT ON COLUMN public.notification_preferences.email_notifications IS 
'Préférence globale pour activer/désactiver toutes les notifications email';

COMMENT ON COLUMN public.notification_preferences.push_notifications IS 
'Préférence globale pour activer/désactiver toutes les notifications push';

COMMENT ON COLUMN public.notification_preferences.sms_notifications IS 
'Préférence globale pour activer/désactiver toutes les notifications SMS';

