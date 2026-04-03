-- ================================================================
-- Notification System - i18n Fix
-- Date: 2 Février 2025
-- Description: Fonction RPC pour récupérer les traductions si la table existe
-- ================================================================

-- Fonction pour récupérer une traduction (si la table existe)
CREATE OR REPLACE FUNCTION get_notification_translation(
  p_notification_type TEXT,
  p_language TEXT
)
RETURNS TABLE (
  title TEXT,
  message TEXT,
  action_label TEXT
) AS $$
BEGIN
  -- Vérifier si la table existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notification_translations'
  ) THEN
    RETURN QUERY
    SELECT 
      nt.title,
      nt.message,
      nt.action_label
    FROM public.notification_translations nt
    WHERE nt.notification_type = p_notification_type
      AND nt.language = p_language
    LIMIT 1;
  ELSE
    -- Retourner NULL si la table n'existe pas
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

