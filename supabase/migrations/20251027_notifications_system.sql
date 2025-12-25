-- Migration: Système de Notifications
-- Date: 27 octobre 2025
-- Description: Tables pour notifications in-app et préférences

-- TABLE: notifications
-- Stocke toutes les notifications pour les utilisateurs

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type de notification
  type TEXT NOT NULL CHECK (type IN (
    'course_enrollment',      -- Inscription à un cours
    'lesson_complete',        -- Leçon terminée
    'course_complete',        -- Cours terminé
    'certificate_ready',      -- Certificat disponible
    'new_course',            -- Nouveau cours disponible
    'course_update',         -- Mise à jour cours
    'quiz_passed',           -- Quiz réussi
    'quiz_failed',           -- Quiz échoué
    'affiliate_sale',        -- Vente affilié
    'affiliate_commission',  -- Commission affilié
    'comment_reply',         -- Réponse à un commentaire
    'instructor_message',    -- Message instructeur
    'system',                -- Notification système
    -- Types de notifications de commissions
    'commission_created',    -- Commission créée
    'commission_approved',   -- Commission approuvée
    'commission_rejected',   -- Commission rejetée
    'commission_paid',       -- Commission payée
    'commission_threshold_reached', -- Seuil de commission atteint
    'payment_request_created',      -- Demande de paiement créée
    'payment_request_approved',     -- Demande de paiement approuvée
    'payment_request_rejected',     -- Demande de paiement rejetée
    'payment_request_processed',    -- Demande de paiement traitée
    'weekly_report',         -- Rapport hebdomadaire
    'monthly_report'         -- Rapport mensuel
  )),
  
  -- Contenu
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Métadonnées (JSON)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- URLs d'action
  action_url TEXT,           -- URL à ouvrir au clic
  action_label TEXT,         -- Label du bouton
  
  -- État
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  -- Priorité
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  
  -- Index
  CONSTRAINT notifications_user_id_created_at_idx 
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications(user_id, is_read) 
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
  ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type 
  ON public.notifications(type);

-- TABLE: notification_preferences
-- Préférences de notifications par utilisateur

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Préférences emails
  email_course_enrollment BOOLEAN DEFAULT true,
  email_lesson_complete BOOLEAN DEFAULT false,
  email_course_complete BOOLEAN DEFAULT true,
  email_certificate_ready BOOLEAN DEFAULT true,
  email_new_course BOOLEAN DEFAULT true,
  email_course_update BOOLEAN DEFAULT true,
  email_quiz_result BOOLEAN DEFAULT true,
  email_affiliate_sale BOOLEAN DEFAULT true,
  email_comment_reply BOOLEAN DEFAULT true,
  email_instructor_message BOOLEAN DEFAULT true,
  
  -- Préférences notifications in-app
  app_course_enrollment BOOLEAN DEFAULT true,
  app_lesson_complete BOOLEAN DEFAULT true,
  app_course_complete BOOLEAN DEFAULT true,
  app_certificate_ready BOOLEAN DEFAULT true,
  app_new_course BOOLEAN DEFAULT false,
  app_course_update BOOLEAN DEFAULT true,
  app_quiz_result BOOLEAN DEFAULT true,
  app_affiliate_sale BOOLEAN DEFAULT true,
  app_comment_reply BOOLEAN DEFAULT true,
  app_instructor_message BOOLEAN DEFAULT true,
  
  -- Email de résumé
  email_digest_frequency TEXT DEFAULT 'never' CHECK (email_digest_frequency IN (
    'never', 'daily', 'weekly', 'monthly'
  )),
  
  -- Pause notifications (mode Ne pas déranger)
  pause_until TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
  ON public.notification_preferences(user_id);

-- FUNCTION: Marquer notification comme lue

CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications
  SET 
    is_read = true,
    read_at = NOW()
  WHERE id = notification_id
    AND user_id = auth.uid();
END;
$$;

-- FUNCTION: Marquer toutes comme lues

CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications
  SET 
    is_read = true,
    read_at = NOW()
  WHERE user_id = auth.uid()
    AND is_read = false;
END;
$$;

-- FUNCTION: Archiver notification

CREATE OR REPLACE FUNCTION archive_notification(notification_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications
  SET is_archived = true
  WHERE id = notification_id
    AND user_id = auth.uid();
END;
$$;

-- FUNCTION: Compter notifications non lues

CREATE OR REPLACE FUNCTION get_unread_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count
  FROM public.notifications
  WHERE user_id = auth.uid()
    AND is_read = false
    AND is_archived = false;
    
  RETURN count;
END;
$$;

-- FUNCTION: Créer préférences par défaut

CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger pour créer préférences à l'inscription
CREATE TRIGGER on_user_created_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- RLS POLICIES

-- Activer RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Notifications : L'utilisateur ne peut voir que ses propres notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Notifications : Seul le système peut créer des notifications (via service role)
CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Notifications : L'utilisateur peut mettre à jour ses notifications (marquer lu, archiver)
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Notifications : L'utilisateur peut supprimer ses notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Préférences : L'utilisateur peut voir ses préférences
CREATE POLICY "Users can view own preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Préférences : L'utilisateur peut créer ses préférences
CREATE POLICY "Users can insert own preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Préférences : L'utilisateur peut mettre à jour ses préférences
CREATE POLICY "Users can update own preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- COMMENTAIRES

COMMENT ON TABLE public.notifications IS 
'Stocke toutes les notifications in-app pour les utilisateurs (cours, quiz, affiliation, etc.)';

COMMENT ON TABLE public.notification_preferences IS 
'Préférences de notifications par utilisateur (email, in-app, fréquence)';

COMMENT ON COLUMN public.notifications.metadata IS 
'Données JSON supplémentaires (course_id, lesson_id, etc.)';

COMMENT ON COLUMN public.notifications.priority IS 
'Priorité de la notification : low, normal, high, urgent';

COMMENT ON FUNCTION mark_notification_read(UUID) IS 
'Marque une notification comme lue';

COMMENT ON FUNCTION mark_all_notifications_read() IS 
'Marque toutes les notifications de l''utilisateur comme lues';

COMMENT ON FUNCTION get_unread_count() IS 
'Retourne le nombre de notifications non lues de l''utilisateur';

