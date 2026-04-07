-- =========================================================
-- Migration : Ajout des préférences sonores et vibratoires
-- Date : 16 Janvier 2025
-- Description : Ajoute les champs pour contrôler les sons et vibrations des notifications
-- =========================================================

-- Ajouter les colonnes manquantes si elles n'existent pas
DO $$
BEGIN
  -- Ajouter sound_notifications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notification_preferences'
    AND column_name = 'sound_notifications'
  ) THEN
    ALTER TABLE public.notification_preferences
    ADD COLUMN sound_notifications BOOLEAN DEFAULT true;

    -- Mettre à jour les valeurs existantes (true par défaut)
    UPDATE public.notification_preferences
    SET sound_notifications = true
    WHERE sound_notifications IS NULL;
  END IF;

  -- Ajouter vibration_notifications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notification_preferences'
    AND column_name = 'vibration_notifications'
  ) THEN
    ALTER TABLE public.notification_preferences
    ADD COLUMN vibration_notifications BOOLEAN DEFAULT true;

    -- Mettre à jour les valeurs existantes (true par défaut)
    UPDATE public.notification_preferences
    SET vibration_notifications = true
    WHERE vibration_notifications IS NULL;
  END IF;

  -- Ajouter sound_volume
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notification_preferences'
    AND column_name = 'sound_volume'
  ) THEN
    ALTER TABLE public.notification_preferences
    ADD COLUMN sound_volume INTEGER DEFAULT 80;

    -- Mettre à jour les valeurs existantes (80% par défaut)
    UPDATE public.notification_preferences
    SET sound_volume = 80
    WHERE sound_volume IS NULL;
  END IF;

  -- Ajouter vibration_intensity
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notification_preferences'
    AND column_name = 'vibration_intensity'
  ) THEN
    ALTER TABLE public.notification_preferences
    ADD COLUMN vibration_intensity TEXT DEFAULT 'medium'
    CHECK (vibration_intensity IN ('light', 'medium', 'heavy'));

    -- Mettre à jour les valeurs existantes ('medium' par défaut)
    UPDATE public.notification_preferences
    SET vibration_intensity = 'medium'
    WHERE vibration_intensity IS NULL;
  END IF;

  -- Ajouter notification_sound_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notification_preferences'
    AND column_name = 'notification_sound_type'
  ) THEN
    ALTER TABLE public.notification_preferences
    ADD COLUMN notification_sound_type TEXT DEFAULT 'default'
    CHECK (notification_sound_type IN ('default', 'gentle', 'urgent'));

    -- Mettre à jour les valeurs existantes ('default' par défaut)
    UPDATE public.notification_preferences
    SET notification_sound_type = 'default'
    WHERE notification_sound_type IS NULL;
  END IF;

  -- Ajouter accessibility_mode
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notification_preferences'
    AND column_name = 'accessibility_mode'
  ) THEN
    ALTER TABLE public.notification_preferences
    ADD COLUMN accessibility_mode BOOLEAN DEFAULT false;

    -- Mettre à jour les valeurs existantes (false par défaut)
    UPDATE public.notification_preferences
    SET accessibility_mode = false
    WHERE accessibility_mode IS NULL;
  END IF;

  -- Ajouter high_contrast_sounds
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notification_preferences'
    AND column_name = 'high_contrast_sounds'
  ) THEN
    ALTER TABLE public.notification_preferences
    ADD COLUMN high_contrast_sounds BOOLEAN DEFAULT false;

    -- Mettre à jour les valeurs existantes (false par défaut)
    UPDATE public.notification_preferences
    SET high_contrast_sounds = false
    WHERE high_contrast_sounds IS NULL;
  END IF;

  -- Ajouter screen_reader_friendly
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notification_preferences'
    AND column_name = 'screen_reader_friendly'
  ) THEN
    ALTER TABLE public.notification_preferences
    ADD COLUMN screen_reader_friendly BOOLEAN DEFAULT true;

    -- Mettre à jour les valeurs existantes (true par défaut)
    UPDATE public.notification_preferences
    SET screen_reader_friendly = true
    WHERE screen_reader_friendly IS NULL;
  END IF;
END $$;

-- Commentaires sur les nouvelles colonnes
COMMENT ON COLUMN public.notification_preferences.sound_notifications IS
'Préférence pour activer/désactiver les sons des notifications (WCAG 1.4.2)';

COMMENT ON COLUMN public.notification_preferences.vibration_notifications IS
'Préférence pour activer/désactiver les vibrations des notifications (mobile)';

COMMENT ON COLUMN public.notification_preferences.sound_volume IS
'Volume des sons de notifications en pourcentage (0-100, défaut: 80)';

COMMENT ON COLUMN public.notification_preferences.vibration_intensity IS
'Intensité des vibrations: light, medium, heavy (défaut: medium)';

COMMENT ON COLUMN public.notification_preferences.notification_sound_type IS
'Type de son pour les notifications: default, gentle, urgent (défaut: default)';

COMMENT ON COLUMN public.notification_preferences.accessibility_mode IS
'Mode accessibilité activé pour les notifications (optimisations pour handicaps)';

COMMENT ON COLUMN public.notification_preferences.high_contrast_sounds IS
'Sons haute contraste pour différenciation améliorée (malentendants)';

COMMENT ON COLUMN public.notification_preferences.screen_reader_friendly IS
'Optimisations pour compatibilité avec les lecteurs d''écran';

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_notification_preferences_sound
ON public.notification_preferences(sound_notifications);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_vibration
ON public.notification_preferences(vibration_notifications);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_accessibility
ON public.notification_preferences(accessibility_mode, high_contrast_sounds, screen_reader_friendly);