-- Migration: Système de Notifications Push
-- Date: 31 janvier 2025
-- Description: Tables et fonctions pour notifications push (Web Push API)

-- ============================================================
-- TABLE: push_subscriptions
-- Stocke les abonnements push des utilisateurs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Données d'abonnement Push
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL, -- { p256dh: string, auth: string }
  
  -- Métadonnées
  user_agent TEXT,
  device_info JSONB DEFAULT '{}'::jsonb, -- { platform, browser, etc. }
  
  -- État
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(user_id, endpoint)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id 
  ON public.push_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active 
  ON public.push_subscriptions(user_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint 
  ON public.push_subscriptions(endpoint);

-- ============================================================
-- TABLE: notification_logs
-- Logs des notifications envoyées (push, email, in-app)
-- ============================================================

-- Vérifier si la table existe déjà et ajouter les colonnes manquantes
DO $$
BEGIN
  -- Créer la table si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification_logs') THEN
    CREATE TABLE public.notification_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      
      -- Type de notification
      type TEXT NOT NULL CHECK (type IN ('push', 'email', 'in-app', 'sms')),
      
      -- Contenu
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      data JSONB DEFAULT '{}'::jsonb,
      
      -- Métadonnées
      channel TEXT, -- 'web-push', 'email', 'in-app', etc.
      provider TEXT, -- 'vapid', 'sendgrid', etc.
      
      -- État
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
      error_message TEXT,
      
      -- Pour les notifications push
      push_subscription_id UUID,
      
      -- Pour le tracking
      sent_at TIMESTAMPTZ,
      delivered_at TIMESTAMPTZ,
      opened_at TIMESTAMPTZ,
      clicked_at TIMESTAMPTZ,
      
      -- Timestamps
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    -- Ajouter les colonnes manquantes si la table existe déjà
    -- Type de notification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notification_logs' 
                   AND column_name = 'type') THEN
      ALTER TABLE public.notification_logs 
      ADD COLUMN type TEXT CHECK (type IN ('push', 'email', 'in-app', 'sms'));
      
      -- Mettre à jour les valeurs existantes
      UPDATE public.notification_logs SET type = 'email' WHERE type IS NULL;
      
      -- Rendre NOT NULL
      ALTER TABLE public.notification_logs ALTER COLUMN type SET NOT NULL;
    END IF;
    
    -- Title
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notification_logs' 
                   AND column_name = 'title') THEN
      ALTER TABLE public.notification_logs ADD COLUMN title TEXT;
      UPDATE public.notification_logs SET title = 'Notification' WHERE title IS NULL;
      ALTER TABLE public.notification_logs ALTER COLUMN title SET NOT NULL;
    END IF;
    
    -- Body
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notification_logs' 
                   AND column_name = 'body') THEN
      ALTER TABLE public.notification_logs ADD COLUMN body TEXT;
      UPDATE public.notification_logs SET body = '' WHERE body IS NULL;
      ALTER TABLE public.notification_logs ALTER COLUMN body SET NOT NULL;
    END IF;
    
    -- Data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notification_logs' 
                   AND column_name = 'data') THEN
      ALTER TABLE public.notification_logs 
      ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    -- Channel
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notification_logs' 
                   AND column_name = 'channel') THEN
      ALTER TABLE public.notification_logs ADD COLUMN channel TEXT;
    END IF;
    
    -- Provider
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notification_logs' 
                   AND column_name = 'provider') THEN
      ALTER TABLE public.notification_logs ADD COLUMN provider TEXT;
    END IF;
    
    -- Status (vérifier si la contrainte existe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notification_logs' 
                   AND column_name = 'status') THEN
      ALTER TABLE public.notification_logs 
      ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced'));
      ALTER TABLE public.notification_logs ALTER COLUMN status SET NOT NULL;
    END IF;
    
    -- Error message
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notification_logs' 
                   AND column_name = 'error_message') THEN
      ALTER TABLE public.notification_logs ADD COLUMN error_message TEXT;
    END IF;
    
    -- Push subscription ID
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notification_logs' 
                   AND column_name = 'push_subscription_id') THEN
      ALTER TABLE public.notification_logs ADD COLUMN push_subscription_id UUID;
    END IF;
    
    -- Sent at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notification_logs' 
                   AND column_name = 'sent_at') THEN
      ALTER TABLE public.notification_logs ADD COLUMN sent_at TIMESTAMPTZ;
    END IF;
    
    -- Delivered at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notification_logs' 
                   AND column_name = 'delivered_at') THEN
      ALTER TABLE public.notification_logs ADD COLUMN delivered_at TIMESTAMPTZ;
    END IF;
    
    -- Opened at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notification_logs' 
                   AND column_name = 'opened_at') THEN
      ALTER TABLE public.notification_logs ADD COLUMN opened_at TIMESTAMPTZ;
    END IF;
    
    -- Clicked at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notification_logs' 
                   AND column_name = 'clicked_at') THEN
      ALTER TABLE public.notification_logs ADD COLUMN clicked_at TIMESTAMPTZ;
    END IF;
  END IF;
  
  -- Ajouter la contrainte de clé étrangère pour push_subscription_id si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'notification_logs' 
    AND constraint_name = 'notification_logs_push_subscription_id_fkey'
  ) THEN
    ALTER TABLE public.notification_logs
    ADD CONSTRAINT notification_logs_push_subscription_id_fkey
    FOREIGN KEY (push_subscription_id) 
    REFERENCES public.push_subscriptions(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Index pour performances (créer seulement s'ils n'existent pas)
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id 
  ON public.notification_logs(user_id);

-- Index sur type (seulement si la colonne existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'notification_logs' 
             AND column_name = 'type') THEN
    CREATE INDEX IF NOT EXISTS idx_notification_logs_type 
      ON public.notification_logs(type);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notification_logs_status 
  ON public.notification_logs(status);

CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at 
  ON public.notification_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_logs_push_subscription_id 
  ON public.notification_logs(push_subscription_id);

-- ============================================================
-- FUNCTION: Enregistrer un abonnement push
-- ============================================================

CREATE OR REPLACE FUNCTION save_push_subscription(
  p_endpoint TEXT,
  p_keys JSONB,
  p_user_agent TEXT DEFAULT NULL,
  p_device_info JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_subscription_id UUID;
BEGIN
  -- Obtenir l'ID utilisateur actuel
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Upsert l'abonnement
  INSERT INTO public.push_subscriptions (
    user_id,
    endpoint,
    keys,
    user_agent,
    device_info,
    is_active,
    last_used_at,
    updated_at
  )
  VALUES (
    v_user_id,
    p_endpoint,
    p_keys,
    p_user_agent,
    p_device_info,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, endpoint) 
  DO UPDATE SET
    keys = EXCLUDED.keys,
    user_agent = EXCLUDED.user_agent,
    device_info = EXCLUDED.device_info,
    is_active = true,
    last_used_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_subscription_id;
  
  RETURN v_subscription_id;
END;
$$;

-- ============================================================
-- FUNCTION: Supprimer un abonnement push
-- ============================================================

CREATE OR REPLACE FUNCTION delete_push_subscription(p_endpoint TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Obtenir l'ID utilisateur actuel
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Désactiver l'abonnement
  UPDATE public.push_subscriptions
  SET 
    is_active = false,
    updated_at = NOW()
  WHERE user_id = v_user_id
    AND endpoint = p_endpoint;
END;
$$;

-- ============================================================
-- FUNCTION: Obtenir les abonnements actifs d'un utilisateur
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_push_subscriptions()
RETURNS TABLE (
  id UUID,
  endpoint TEXT,
  keys JSONB,
  user_agent TEXT,
  device_info JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Obtenir l'ID utilisateur actuel
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Retourner les abonnements actifs
  RETURN QUERY
  SELECT 
    ps.id,
    ps.endpoint,
    ps.keys,
    ps.user_agent,
    ps.device_info,
    ps.created_at
  FROM public.push_subscriptions ps
  WHERE ps.user_id = v_user_id
    AND ps.is_active = true
  ORDER BY ps.created_at DESC;
END;
$$;

-- ============================================================
-- FUNCTION: Obtenir les abonnements push pour un utilisateur (pour le serveur)
-- ============================================================

CREATE OR REPLACE FUNCTION get_push_subscriptions_for_user(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  endpoint TEXT,
  keys JSONB,
  user_agent TEXT,
  device_info JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Cette fonction est utilisée par le serveur (service role)
  -- pour envoyer des notifications push
  
  RETURN QUERY
  SELECT 
    ps.id,
    ps.endpoint,
    ps.keys,
    ps.user_agent,
    ps.device_info
  FROM public.push_subscriptions ps
  WHERE ps.user_id = p_user_id
    AND ps.is_active = true
  ORDER BY ps.last_used_at DESC NULLS LAST;
END;
$$;

-- ============================================================
-- FUNCTION: Logger une notification
-- ============================================================

CREATE OR REPLACE FUNCTION log_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb,
  p_channel TEXT DEFAULT NULL,
  p_provider TEXT DEFAULT NULL,
  p_push_subscription_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT 'sent'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.notification_logs (
    user_id,
    type,
    title,
    body,
    data,
    channel,
    provider,
    push_subscription_id,
    status,
    sent_at
  )
  VALUES (
    p_user_id,
    p_type,
    p_title,
    p_body,
    p_data,
    p_channel,
    p_provider,
    p_push_subscription_id,
    p_status,
    CASE WHEN p_status = 'sent' THEN NOW() ELSE NULL END
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- ============================================================
-- FUNCTION: Mettre à jour le statut d'une notification
-- ============================================================

CREATE OR REPLACE FUNCTION update_notification_status(
  p_log_id UUID,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notification_logs
  SET 
    status = p_status,
    error_message = p_error_message,
    sent_at = CASE WHEN p_status = 'sent' AND sent_at IS NULL THEN NOW() ELSE sent_at END,
    delivered_at = CASE WHEN p_status = 'delivered' THEN NOW() ELSE delivered_at END
  WHERE id = p_log_id;
END;
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Push Subscriptions : L'utilisateur peut voir ses abonnements
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Push Subscriptions : L'utilisateur peut créer ses abonnements (via fonction)
-- La fonction save_push_subscription gère déjà la sécurité

-- Push Subscriptions : L'utilisateur peut mettre à jour ses abonnements
CREATE POLICY "Users can update own push subscriptions"
  ON public.push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Push Subscriptions : L'utilisateur peut supprimer ses abonnements
CREATE POLICY "Users can delete own push subscriptions"
  ON public.push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Notification Logs : L'utilisateur peut voir ses logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification logs"
  ON public.notification_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Notification Logs : Le service role peut créer des logs
-- (géré par les fonctions avec SECURITY DEFINER)

-- ============================================================
-- TRIGGER: Mettre à jour updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_push_subscription_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscription_updated_at();

-- ============================================================
-- COMMENTAIRES
-- ============================================================

COMMENT ON TABLE public.push_subscriptions IS 
'Stocke les abonnements push des utilisateurs (Web Push API)';

COMMENT ON TABLE public.notification_logs IS 
'Logs des notifications envoyées (push, email, in-app, sms)';

COMMENT ON COLUMN public.push_subscriptions.keys IS 
'Clés de chiffrement push : { p256dh: string, auth: string }';

COMMENT ON COLUMN public.push_subscriptions.device_info IS 
'Informations sur l''appareil : { platform, browser, os, etc. }';

COMMENT ON FUNCTION save_push_subscription IS 
'Enregistre ou met à jour un abonnement push pour l''utilisateur actuel';

COMMENT ON FUNCTION delete_push_subscription IS 
'Supprime (désactive) un abonnement push pour l''utilisateur actuel';

COMMENT ON FUNCTION get_user_push_subscriptions IS 
'Retourne les abonnements push actifs de l''utilisateur actuel';

COMMENT ON FUNCTION get_push_subscriptions_for_user IS 
'Retourne les abonnements push actifs d''un utilisateur (pour le serveur)';

COMMENT ON FUNCTION log_notification IS 
'Enregistre un log de notification envoyée';

COMMENT ON FUNCTION update_notification_status IS 
'Met à jour le statut d''une notification (sent, delivered, failed, etc.)';

