-- ================================================================
-- Physical Products Notifications System
-- Date: 2025-01-27
-- Description: Système complet de notifications automatiques pour produits physiques
-- ================================================================

-- Table pour les alertes de prix (wishlist)
CREATE TABLE IF NOT EXISTS public.physical_product_price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.physical_product_variants(id) ON DELETE CASCADE,
  
  -- Price settings
  original_price NUMERIC NOT NULL,
  target_price NUMERIC,
  price_drop_threshold NUMERIC, -- Pourcentage de baisse requis
  current_price NUMERIC NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  alert_sent BOOLEAN DEFAULT false,
  alert_sent_at TIMESTAMPTZ,
  alert_sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_product_price_alert UNIQUE (user_id, product_id, variant_id)
);

-- Table pour les alertes de stock (retour en stock)
CREATE TABLE IF NOT EXISTS public.physical_product_stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.physical_product_variants(id) ON DELETE CASCADE,
  
  -- Stock settings
  min_quantity_required INTEGER DEFAULT 1,
  notify_on_back_in_stock BOOLEAN DEFAULT true,
  notify_on_low_stock BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  alert_sent BOOLEAN DEFAULT false,
  alert_sent_at TIMESTAMPTZ,
  alert_sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
  stock_status TEXT CHECK (stock_status IN ('out_of_stock', 'low_stock', 'in_stock')) DEFAULT 'out_of_stock',
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_product_stock_alert UNIQUE (user_id, product_id, variant_id)
);

-- Table pour les alertes de promotions
CREATE TABLE IF NOT EXISTS public.physical_product_promotion_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  
  -- Promotion settings
  min_discount_percentage NUMERIC, -- Pourcentage de réduction minimum
  notify_on_promotion_start BOOLEAN DEFAULT true,
  notify_on_promotion_end BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_alert_sent_at TIMESTAMPTZ,
  last_alert_sent_date DATE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_product_promotion_alert UNIQUE (user_id, product_id)
);

-- Table pour les notifications d'expédition
CREATE TABLE IF NOT EXISTS public.physical_product_shipment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Shipment info
  shipment_status TEXT NOT NULL CHECK (shipment_status IN (
    'preparing',
    'shipped',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'exception',
    'returned'
  )),
  tracking_number TEXT,
  carrier_name TEXT,
  estimated_delivery_date DATE,
  
  -- Notification settings
  notify_on_status_change BOOLEAN DEFAULT true,
  notify_on_delivery BOOLEAN DEFAULT true,
  notify_on_exception BOOLEAN DEFAULT true,
  
  -- Notification channels
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  sms_sent BOOLEAN DEFAULT false,
  sms_sent_at TIMESTAMPTZ,
  push_sent BOOLEAN DEFAULT false,
  push_sent_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les notifications de retours
CREATE TABLE IF NOT EXISTS public.physical_product_return_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES public.product_returns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- Return status
  return_status TEXT NOT NULL CHECK (return_status IN (
    'requested',
    'approved',
    'rejected',
    'received',
    'processing',
    'refunded',
    'completed',
    'cancelled'
  )),
  
  -- Notification settings
  notify_on_status_change BOOLEAN DEFAULT true,
  notify_on_approval BOOLEAN DEFAULT true,
  notify_on_refund BOOLEAN DEFAULT true,
  
  -- Notification channels
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  sms_sent BOOLEAN DEFAULT false,
  sms_sent_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les préférences de notifications utilisateur
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email preferences
  email_price_alerts BOOLEAN DEFAULT true,
  email_stock_alerts BOOLEAN DEFAULT true,
  email_promotion_alerts BOOLEAN DEFAULT true,
  email_shipment_updates BOOLEAN DEFAULT true,
  email_return_updates BOOLEAN DEFAULT true,
  email_order_updates BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,
  
  -- SMS preferences
  sms_price_alerts BOOLEAN DEFAULT false,
  sms_stock_alerts BOOLEAN DEFAULT false,
  sms_shipment_updates BOOLEAN DEFAULT true,
  sms_return_updates BOOLEAN DEFAULT false,
  sms_order_updates BOOLEAN DEFAULT false,
  
  -- Push preferences
  push_price_alerts BOOLEAN DEFAULT true,
  push_stock_alerts BOOLEAN DEFAULT true,
  push_promotion_alerts BOOLEAN DEFAULT true,
  push_shipment_updates BOOLEAN DEFAULT true,
  push_return_updates BOOLEAN DEFAULT true,
  
  -- Frequency
  notification_frequency TEXT CHECK (notification_frequency IN ('immediate', 'daily', 'weekly')) DEFAULT 'immediate',
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_product ON public.physical_product_price_alerts(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON public.physical_product_price_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_price_alerts_alert_sent_date ON public.physical_product_price_alerts(alert_sent_date);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_user_product ON public.physical_product_stock_alerts(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_active ON public.physical_product_stock_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_stock_alerts_stock_status ON public.physical_product_stock_alerts(stock_status);

CREATE INDEX IF NOT EXISTS idx_promotion_alerts_user_product ON public.physical_product_promotion_alerts(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_promotion_alerts_active ON public.physical_product_promotion_alerts(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_shipment_notifications_order ON public.physical_product_shipment_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_notifications_customer ON public.physical_product_shipment_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipment_notifications_status ON public.physical_product_shipment_notifications(shipment_status);

CREATE INDEX IF NOT EXISTS idx_return_notifications_return ON public.physical_product_return_notifications(return_id);
CREATE INDEX IF NOT EXISTS idx_return_notifications_customer ON public.physical_product_return_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_return_notifications_status ON public.physical_product_return_notifications(return_status);

-- Triggers
CREATE OR REPLACE FUNCTION update_alert_sent_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.alert_sent_at IS NOT NULL AND NEW.alert_sent_date IS NULL THEN
    NEW.alert_sent_date = CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_price_alert_sent_date ON public.physical_product_price_alerts;
CREATE TRIGGER trigger_update_price_alert_sent_date
  BEFORE INSERT OR UPDATE ON public.physical_product_price_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_sent_date();

DROP TRIGGER IF EXISTS trigger_update_stock_alert_sent_date ON public.physical_product_stock_alerts;
CREATE TRIGGER trigger_update_stock_alert_sent_date
  BEFORE INSERT OR UPDATE ON public.physical_product_stock_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_sent_date();

-- Fonction pour vérifier les changements de prix et déclencher les alertes
CREATE OR REPLACE FUNCTION check_price_changes()
RETURNS void AS $$
BEGIN
  -- Cette fonction sera appelée par un cron job ou trigger
  -- Elle vérifie les changements de prix et met à jour current_price
  -- Les alertes seront déclenchées par un service externe (Node.js)
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier les changements de stock et déclencher les alertes
CREATE OR REPLACE FUNCTION check_stock_changes()
RETURNS void AS $$
BEGIN
  -- Cette fonction sera appelée par un cron job ou trigger
  -- Elle vérifie les changements de stock et met à jour stock_status
  -- Les alertes seront déclenchées par un service externe (Node.js)
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE public.physical_product_price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_product_stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_product_promotion_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_product_shipment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_product_return_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies pour price_alerts
DROP POLICY IF EXISTS "Users manage their own price alerts" ON public.physical_product_price_alerts;
CREATE POLICY "Users manage their own price alerts"
  ON public.physical_product_price_alerts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies pour stock_alerts
DROP POLICY IF EXISTS "Users manage their own stock alerts" ON public.physical_product_stock_alerts;
CREATE POLICY "Users manage their own stock alerts"
  ON public.physical_product_stock_alerts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies pour promotion_alerts
DROP POLICY IF EXISTS "Users manage their own promotion alerts" ON public.physical_product_promotion_alerts;
CREATE POLICY "Users manage their own promotion alerts"
  ON public.physical_product_promotion_alerts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies pour shipment_notifications
DROP POLICY IF EXISTS "Customers view their own shipment notifications" ON public.physical_product_shipment_notifications;
CREATE POLICY "Customers view their own shipment notifications"
  ON public.physical_product_shipment_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      INNER JOIN auth.users u ON c.email = u.email
      WHERE c.id = physical_product_shipment_notifications.customer_id
        AND u.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can create shipment notifications" ON public.physical_product_shipment_notifications;
CREATE POLICY "System can create shipment notifications"
  ON public.physical_product_shipment_notifications
  FOR INSERT
  WITH CHECK (true); -- Le système peut créer des notifications

-- Policies pour return_notifications
DROP POLICY IF EXISTS "Customers view their own return notifications" ON public.physical_product_return_notifications;
CREATE POLICY "Customers view their own return notifications"
  ON public.physical_product_return_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      INNER JOIN auth.users u ON c.email = u.email
      WHERE c.id = physical_product_return_notifications.customer_id
        AND u.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can create return notifications" ON public.physical_product_return_notifications;
CREATE POLICY "System can create return notifications"
  ON public.physical_product_return_notifications
  FOR INSERT
  WITH CHECK (true); -- Le système peut créer des notifications

-- Policies pour notification_preferences
DROP POLICY IF EXISTS "Users manage their own notification preferences" ON public.user_notification_preferences;
CREATE POLICY "Users manage their own notification preferences"
  ON public.user_notification_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Commentaires
COMMENT ON TABLE public.physical_product_price_alerts IS 'Alertes de prix pour produits physiques (wishlist)';
COMMENT ON TABLE public.physical_product_stock_alerts IS 'Alertes de stock pour produits physiques (retour en stock)';
COMMENT ON TABLE public.physical_product_promotion_alerts IS 'Alertes de promotions pour produits physiques';
COMMENT ON TABLE public.physical_product_shipment_notifications IS 'Notifications d''expédition pour commandes produits physiques';
COMMENT ON TABLE public.physical_product_return_notifications IS 'Notifications de retours pour produits physiques';
COMMENT ON TABLE public.user_notification_preferences IS 'Préférences de notifications par utilisateur';

