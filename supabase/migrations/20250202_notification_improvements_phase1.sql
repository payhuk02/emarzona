-- ================================================================
-- Notification System Improvements - Phase 1
-- Date: 2 Février 2025
-- Description: Tables pour rate limiting, retry et logging
-- ================================================================

-- Table pour tracking des rate limits
CREATE TABLE IF NOT EXISTS public.notification_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms', 'push')),
  notification_type TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ajouter la contrainte unique si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'notification_rate_limits_user_channel_idx'
  ) THEN
    ALTER TABLE public.notification_rate_limits
      ADD CONSTRAINT notification_rate_limits_user_channel_idx 
      UNIQUE NULLS NOT DISTINCT (user_id, channel, notification_type, sent_at);
  END IF;
END $$;

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_notification_rate_limits_user_sent 
  ON public.notification_rate_limits(user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_rate_limits_channel 
  ON public.notification_rate_limits(channel, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_rate_limits_type 
  ON public.notification_rate_limits(notification_type, sent_at DESC)
  WHERE notification_type IS NOT NULL;

-- Table pour retries de notifications
CREATE TABLE IF NOT EXISTS public.notification_retries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms', 'push')),
  notification_data JSONB NOT NULL,
  error_message TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_notification_retries_status_next_retry 
  ON public.notification_retries(status, next_retry_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notification_retries_user 
  ON public.notification_retries(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_retries_type 
  ON public.notification_retries(notification_type, status);

-- Table pour dead letter queue (notifications définitivement échouées)
CREATE TABLE IF NOT EXISTS public.notification_dead_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms', 'push')),
  notification_data JSONB NOT NULL,
  error_message TEXT NOT NULL,
  failed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  retry_id UUID REFERENCES public.notification_retries(id) ON DELETE SET NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT
);

-- Index pour dead letter queue
CREATE INDEX IF NOT EXISTS idx_notification_dead_letters_user 
  ON public.notification_dead_letters(user_id, failed_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_dead_letters_resolved 
  ON public.notification_dead_letters(resolved, failed_at DESC)
  WHERE resolved = false;

CREATE INDEX IF NOT EXISTS idx_notification_dead_letters_type 
  ON public.notification_dead_letters(notification_type, failed_at DESC);

-- Table pour logs de notifications (analytics)
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID, -- Référence optionnelle (peut être NULL si notification in-app n'existe pas)
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms', 'push')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Performance tracking
  processing_time_ms INTEGER,
  retry_count INTEGER DEFAULT 0
);

-- Ajouter la contrainte de clé étrangère seulement si la table notifications existe ET la colonne notification_id existe
DO $$
BEGIN
  -- Vérifier que la table notifications existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications'
  ) THEN
    -- Vérifier que la colonne notification_id existe dans notification_logs
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notification_logs'
      AND column_name = 'notification_id'
    ) THEN
      -- Vérifier que la contrainte n'existe pas déjà
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public'
        AND constraint_name = 'notification_logs_notification_id_fkey'
        AND table_name = 'notification_logs'
      ) THEN
        -- Ajouter la contrainte de clé étrangère
        ALTER TABLE public.notification_logs
          ADD CONSTRAINT notification_logs_notification_id_fkey
          FOREIGN KEY (notification_id) 
          REFERENCES public.notifications(id) 
          ON DELETE SET NULL;
      END IF;
    END IF;
  END IF;
END $$;

-- Index pour analytics
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_sent 
  ON public.notification_logs(user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_logs_type_status 
  ON public.notification_logs(notification_type, status, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_logs_channel_status 
  ON public.notification_logs(channel, status, sent_at DESC);

-- Index pour notification_id seulement si la colonne existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notification_logs'
    AND column_name = 'notification_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public'
      AND tablename = 'notification_logs'
      AND indexname = 'idx_notification_logs_notification_id'
    ) THEN
      CREATE INDEX idx_notification_logs_notification_id 
        ON public.notification_logs(notification_id)
        WHERE notification_id IS NOT NULL;
    END IF;
  END IF;
END $$;

-- Fonction pour nettoyer les anciens logs (appelée par cron)
CREATE OR REPLACE FUNCTION cleanup_old_notification_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Supprimer les logs de plus de 90 jours
  DELETE FROM public.notification_logs
  WHERE sent_at < NOW() - INTERVAL '90 days';
  
  -- Supprimer les rate limits de plus de 7 jours
  DELETE FROM public.notification_rate_limits
  WHERE sent_at < NOW() - INTERVAL '7 days';
  
  -- Supprimer les retries complétés de plus de 30 jours
  DELETE FROM public.notification_retries
  WHERE status IN ('completed', 'failed')
    AND completed_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Fonction pour obtenir les statistiques de notifications
CREATE OR REPLACE FUNCTION get_notification_stats(
  p_user_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  total_sent BIGINT,
  total_delivered BIGINT,
  total_opened BIGINT,
  total_clicked BIGINT,
  total_failed BIGINT,
  delivery_rate NUMERIC,
  open_rate NUMERIC,
  click_rate NUMERIC,
  failure_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_sent BIGINT;
  v_total_delivered BIGINT;
  v_total_opened BIGINT;
  v_total_clicked BIGINT;
  v_total_failed BIGINT;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE status = 'sent'),
    COUNT(*) FILTER (WHERE status = 'delivered' OR status = 'opened' OR status = 'clicked'),
    COUNT(*) FILTER (WHERE status = 'opened' OR status = 'clicked'),
    COUNT(*) FILTER (WHERE status = 'clicked'),
    COUNT(*) FILTER (WHERE status = 'failed' OR status = 'bounced')
  INTO 
    v_total_sent,
    v_total_delivered,
    v_total_opened,
    v_total_clicked,
    v_total_failed
  FROM public.notification_logs
  WHERE (p_user_id IS NULL OR user_id = p_user_id)
    AND (p_start_date IS NULL OR sent_at >= p_start_date)
    AND (p_end_date IS NULL OR sent_at <= p_end_date);

  RETURN QUERY SELECT
    v_total_sent,
    v_total_delivered,
    v_total_opened,
    v_total_clicked,
    v_total_failed,
    CASE WHEN v_total_sent > 0 THEN (v_total_delivered::NUMERIC / v_total_sent * 100) ELSE 0 END,
    CASE WHEN v_total_delivered > 0 THEN (v_total_opened::NUMERIC / v_total_delivered * 100) ELSE 0 END,
    CASE WHEN v_total_opened > 0 THEN (v_total_clicked::NUMERIC / v_total_opened * 100) ELSE 0 END,
    CASE WHEN v_total_sent > 0 THEN (v_total_failed::NUMERIC / v_total_sent * 100) ELSE 0 END;
END;
$$;

-- RLS Policies

-- Rate limits: Les utilisateurs peuvent voir leurs propres limites
ALTER TABLE public.notification_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
  ON public.notification_rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Retries: Les utilisateurs peuvent voir leurs propres retries
ALTER TABLE public.notification_retries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own retries"
  ON public.notification_retries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Dead letters: Les utilisateurs peuvent voir leurs propres dead letters
ALTER TABLE public.notification_dead_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dead letters"
  ON public.notification_dead_letters
  FOR SELECT
  USING (auth.uid() = user_id);

-- Logs: Les utilisateurs peuvent voir leurs propres logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
  ON public.notification_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Commentaires
COMMENT ON TABLE public.notification_rate_limits IS 
'Track des notifications envoyées pour rate limiting';

COMMENT ON TABLE public.notification_retries IS 
'Notifications en échec en attente de retry';

COMMENT ON TABLE public.notification_dead_letters IS 
'Notifications définitivement échouées (dead letter queue)';

COMMENT ON TABLE public.notification_logs IS 
'Logs de toutes les notifications pour analytics et debugging';

COMMENT ON FUNCTION cleanup_old_notification_logs() IS 
'Nettoyer les anciens logs (appelée par cron)';

COMMENT ON FUNCTION get_notification_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 
'Obtenir les statistiques de notifications pour un utilisateur ou globalement';

