-- ================================================================
-- Notification System Improvements - Phase 2
-- Date: 2 Février 2025
-- Description: Tables pour templates, scheduled notifications
-- ================================================================

-- Table pour templates de notifications
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
  language TEXT NOT NULL DEFAULT 'fr' CHECK (language IN ('fr', 'en')),
  subject TEXT, -- Pour email
  title TEXT, -- Pour push
  body TEXT NOT NULL,
  html TEXT, -- Pour email
  variables TEXT[], -- Liste des variables disponibles
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE, -- null = template global
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contrainte unique
  CONSTRAINT notification_templates_unique 
    UNIQUE (slug, channel, language, store_id)
);

-- Index pour templates
CREATE INDEX IF NOT EXISTS idx_notification_templates_slug_channel 
  ON public.notification_templates(slug, channel, language);

CREATE INDEX IF NOT EXISTS idx_notification_templates_store 
  ON public.notification_templates(store_id)
  WHERE store_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_templates_active 
  ON public.notification_templates(is_active)
  WHERE is_active = true;

-- Table pour notifications schedulées
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_data JSONB NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  sent_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour scheduled notifications
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user 
  ON public.scheduled_notifications(user_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status_scheduled 
  ON public.scheduled_notifications(status, scheduled_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_at 
  ON public.scheduled_notifications(scheduled_at)
  WHERE status = 'pending';

-- Fonction pour traiter les notifications schedulées (appelée par cron)
CREATE OR REPLACE FUNCTION process_scheduled_notifications()
RETURNS TABLE (
  processed_count INTEGER,
  sent_count INTEGER,
  failed_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_processed INTEGER := 0;
  v_sent INTEGER := 0;
  v_failed INTEGER := 0;
BEGIN
  -- Cette fonction sera appelée par le service, pas directement
  -- Elle retourne juste des stats
  RETURN QUERY SELECT v_processed, v_sent, v_failed;
END;
$$;

-- Fonction pour traiter les digests (appelée par cron)
CREATE OR REPLACE FUNCTION process_digest_notifications(p_period TEXT)
RETURNS TABLE (
  processed_count INTEGER,
  sent_count INTEGER,
  failed_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_processed INTEGER := 0;
  v_sent INTEGER := 0;
  v_failed INTEGER := 0;
BEGIN
  -- Cette fonction sera appelée par le service, pas directement
  -- Elle retourne juste des stats
  RETURN QUERY SELECT v_processed, v_sent, v_failed;
END;
$$;

-- RLS Policies

-- Templates: Lecture publique, écriture admin seulement
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates"
  ON public.notification_templates
  FOR SELECT
  USING (is_active = true);

-- Scheduled notifications: Les utilisateurs peuvent voir leurs propres notifications
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled notifications"
  ON public.scheduled_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scheduled notifications"
  ON public.scheduled_notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled notifications"
  ON public.scheduled_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Commentaires
COMMENT ON TABLE public.notification_templates IS 
'Templates de notifications (email, SMS, push) avec support multilingue et branding par store';

COMMENT ON TABLE public.scheduled_notifications IS 
'Notifications programmées pour envoi ultérieur';

COMMENT ON FUNCTION process_scheduled_notifications() IS 
'Traiter les notifications schedulées en attente (appelée par cron)';

COMMENT ON FUNCTION process_digest_notifications(TEXT) IS 
'Traiter les digests de notifications (appelée par cron)';

