-- Migration: Paramètres de notifications par boutique
-- Date: 2025-02-02
-- Description: Permet de configurer les notifications email par boutique avec paramètres par type d'événement

-- Table pour les paramètres de notifications par boutique
CREATE TABLE IF NOT EXISTS public.store_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  
  -- Configuration email générale
  email_enabled BOOLEAN DEFAULT true,
  notification_email TEXT, -- Email dédié pour les notifications (si différent du contact_email)
  
  -- Notifications par type d'événement (Email)
  email_new_order BOOLEAN DEFAULT true,
  email_order_status_change BOOLEAN DEFAULT true,
  email_order_cancelled BOOLEAN DEFAULT true,
  email_order_refund BOOLEAN DEFAULT true,
  email_payment_received BOOLEAN DEFAULT true,
  email_payment_failed BOOLEAN DEFAULT true,
  email_low_stock BOOLEAN DEFAULT true,
  email_out_of_stock BOOLEAN DEFAULT false,
  email_new_review BOOLEAN DEFAULT true,
  email_new_question BOOLEAN DEFAULT true,
  email_withdrawal_request BOOLEAN DEFAULT true,
  email_withdrawal_completed BOOLEAN DEFAULT true,
  email_domain_verified BOOLEAN DEFAULT true,
  email_ssl_expiring BOOLEAN DEFAULT true,
  email_ssl_expired BOOLEAN DEFAULT true,
  
  -- Fréquence des notifications
  notification_frequency TEXT DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
  
  -- Heures silencieuses (Ne pas déranger)
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  quiet_hours_timezone TEXT DEFAULT 'Africa/Ouagadougou',
  
  -- Alertes critiques (toujours envoyées même en heures silencieuses)
  critical_alerts_enabled BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_store_notification_settings_store_id 
  ON public.store_notification_settings(store_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_store_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER store_notification_settings_updated_at
  BEFORE UPDATE ON public.store_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_store_notification_settings_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.store_notification_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Les propriétaires de boutique peuvent lire leurs paramètres
CREATE POLICY "store_notification_settings_select_own"
  ON public.store_notification_settings FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );

-- Policy: Les propriétaires de boutique peuvent modifier leurs paramètres
CREATE POLICY "store_notification_settings_update_own"
  ON public.store_notification_settings FOR UPDATE
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );

-- Policy: Les propriétaires de boutique peuvent créer leurs paramètres
CREATE POLICY "store_notification_settings_insert_own"
  ON public.store_notification_settings FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );

-- Commentaires
COMMENT ON TABLE public.store_notification_settings IS 'Paramètres de notifications email configurables par boutique';
COMMENT ON COLUMN public.store_notification_settings.notification_email IS 'Email dédié pour les notifications (si différent du contact_email de la boutique)';
COMMENT ON COLUMN public.store_notification_settings.notification_frequency IS 'Fréquence de regroupement des notifications (immediate, hourly, daily, weekly)';
COMMENT ON COLUMN public.store_notification_settings.quiet_hours_enabled IS 'Active les heures silencieuses (pas de notifications sauf alertes critiques)';

-- Fonction helper pour obtenir ou créer les paramètres par défaut
CREATE OR REPLACE FUNCTION get_or_create_store_notification_settings(p_store_id UUID)
RETURNS public.store_notification_settings AS $$
DECLARE
  v_settings public.store_notification_settings;
BEGIN
  -- Essayer de récupérer les paramètres existants
  SELECT * INTO v_settings
  FROM public.store_notification_settings
  WHERE store_id = p_store_id;
  
  -- Si pas trouvé, créer avec valeurs par défaut
  IF v_settings IS NULL THEN
    INSERT INTO public.store_notification_settings (store_id)
    VALUES (p_store_id)
    RETURNING * INTO v_settings;
  END IF;
  
  RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_or_create_store_notification_settings IS 'Récupère ou crée les paramètres de notifications avec valeurs par défaut pour une boutique';

