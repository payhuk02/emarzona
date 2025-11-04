-- =====================================================
-- PAYHUK PHYSICAL PRODUCTS NOTIFICATIONS SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système d'alertes et notifications pour produits physiques
--              Alertes stock, notifications commandes, etc.
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: physical_product_alerts
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'physical_product_alerts'
  ) THEN
    CREATE TABLE public.physical_product_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      
      -- Type d'alerte
      alert_type TEXT NOT NULL CHECK (alert_type IN (
        'low_stock',           -- Stock faible
        'out_of_stock',       -- Stock épuisé
        'reorder_needed',     -- Réapprovisionnement nécessaire
        'high_return_rate',   -- Taux de retour élevé
        'slow_moving',        -- Produit lent à vendre
        'overstock',          -- Surstock
        'expiring_soon',      -- Expiration proche (si applicable)
        'price_competition'   -- Concurrence prix
      )),
      
      -- Référence
      product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
      variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
      
      -- Sévérité
      severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
      
      -- Contenu
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      details JSONB DEFAULT '{}',
      
      -- Statut
      status TEXT NOT NULL CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')) DEFAULT 'active',
      
      -- Actions
      action_url TEXT, -- URL pour agir (ex: réapprovisionner)
      action_label TEXT, -- Label du bouton d'action
      
      -- Dates
      triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      acknowledged_at TIMESTAMPTZ,
      acknowledged_by UUID REFERENCES auth.users(id),
      resolved_at TIMESTAMPTZ,
      dismissed_at TIMESTAMPTZ,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour physical_product_alerts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_physical_alerts_store_id'
  ) THEN
    CREATE INDEX idx_physical_alerts_store_id ON public.physical_product_alerts(store_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_physical_alerts_product_id'
  ) THEN
    CREATE INDEX idx_physical_alerts_product_id ON public.physical_product_alerts(product_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_physical_alerts_type'
  ) THEN
    CREATE INDEX idx_physical_alerts_type ON public.physical_product_alerts(alert_type);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_physical_alerts_status'
  ) THEN
    CREATE INDEX idx_physical_alerts_status ON public.physical_product_alerts(status);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_physical_alerts_severity'
  ) THEN
    CREATE INDEX idx_physical_alerts_severity ON public.physical_product_alerts(severity);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_physical_alerts_updated_at'
  ) THEN
    CREATE TRIGGER update_physical_alerts_updated_at
      BEFORE UPDATE ON public.physical_product_alerts
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: notification_preferences
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification_preferences'
  ) THEN
    CREATE TABLE public.notification_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Types de notifications
      email_low_stock BOOLEAN DEFAULT true,
      email_out_of_stock BOOLEAN DEFAULT true,
      email_new_order BOOLEAN DEFAULT true,
      email_order_shipped BOOLEAN DEFAULT true,
      email_order_delivered BOOLEAN DEFAULT true,
      email_return_request BOOLEAN DEFAULT true,
      email_refund_processed BOOLEAN DEFAULT true,
      
      -- Push notifications (pour mobile app future)
      push_low_stock BOOLEAN DEFAULT false,
      push_new_order BOOLEAN DEFAULT true,
      push_return_request BOOLEAN DEFAULT true,
      
      -- Fréquence
      notification_frequency TEXT CHECK (notification_frequency IN ('realtime', 'daily', 'weekly')) DEFAULT 'realtime',
      
      -- Seuils personnalisés
      low_stock_threshold_override INTEGER, -- Override du seuil global
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(store_id, user_id)
    );
  END IF;
END $$;

-- Indexes pour notification_preferences
-- Vérifier et créer colonnes si nécessaire
DO $$ BEGIN
  -- S'assurer que store_id et user_id existent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notification_preferences' 
    AND column_name = 'store_id'
  ) THEN
    ALTER TABLE public.notification_preferences 
    ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notification_preferences' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.notification_preferences 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notification_preferences' 
    AND column_name = 'store_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notification_preferences' 
    AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notification_prefs_store_user'
  ) THEN
    CREATE INDEX idx_notification_prefs_store_user ON public.notification_preferences(store_id, user_id);
  END IF;
END $$;

-- =====================================================
-- 3. TABLE: notification_logs
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification_logs'
  ) THEN
    CREATE TABLE public.notification_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      
      -- Type de notification
      notification_type TEXT NOT NULL CHECK (notification_type IN (
        'email', 'sms', 'push', 'in_app'
      )),
      
      -- Canal
      channel TEXT NOT NULL, -- 'order', 'stock', 'return', etc.
      
      -- Contenu
      recipient_email TEXT,
      recipient_phone TEXT,
      subject TEXT,
      message TEXT,
      template_id TEXT, -- ID du template utilisé
      
      -- Statut
      status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')) DEFAULT 'pending',
      
      -- Références
      related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
      related_return_id UUID REFERENCES public.product_returns(id) ON DELETE SET NULL,
      related_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
      
      -- Métadonnées
      metadata JSONB DEFAULT '{}',
      error_message TEXT,
      
      -- Dates
      sent_at TIMESTAMPTZ,
      delivered_at TIMESTAMPTZ,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour notification_logs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notification_logs_store_id'
  ) THEN
    CREATE INDEX idx_notification_logs_store_id ON public.notification_logs(store_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notification_logs_status'
  ) THEN
    CREATE INDEX idx_notification_logs_status ON public.notification_logs(status);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notification_logs_created_at'
  ) THEN
    CREATE INDEX idx_notification_logs_created_at ON public.notification_logs(created_at DESC);
  END IF;
END $$;

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.physical_product_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Policies pour physical_product_alerts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'physical_product_alerts' AND policyname = 'Store owners can manage alerts'
  ) THEN
    CREATE POLICY "Store owners can manage alerts" ON public.physical_product_alerts
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = physical_product_alerts.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour notification_preferences
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Users can manage own preferences'
  ) THEN
    CREATE POLICY "Users can manage own preferences" ON public.notification_preferences
      FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policies pour notification_logs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notification_logs' AND policyname = 'Store owners can view logs'
  ) THEN
    CREATE POLICY "Store owners can view logs" ON public.notification_logs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = notification_logs.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- 5. FUNCTIONS
-- =====================================================

-- Function: Check low stock and create alert
CREATE OR REPLACE FUNCTION public.check_low_stock_and_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_product RECORD;
  v_physical_product RECORD;
  v_inventory_item RECORD;
  v_threshold INTEGER;
  v_alert_exists BOOLEAN;
BEGIN
  -- Récupérer le produit physique
  IF NEW.variant_id IS NOT NULL THEN
    SELECT pp.*, p.store_id, p.name as product_name
    INTO v_physical_product
    FROM public.product_variants pv
    JOIN public.physical_products pp ON pp.id = pv.physical_product_id
    JOIN public.products p ON p.id = pp.product_id
    WHERE pv.id = NEW.variant_id;
  ELSIF NEW.physical_product_id IS NOT NULL THEN
    SELECT pp.*, p.store_id, p.name as product_name
    INTO v_physical_product
    FROM public.physical_products pp
    JOIN public.products p ON p.id = pp.product_id
    WHERE pp.id = NEW.physical_product_id;
  ELSE
    RETURN NEW;
  END IF;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer le seuil
  v_threshold := COALESCE(v_physical_product.low_stock_threshold, 10);
  
  -- Vérifier si stock faible
  IF NEW.quantity_available <= v_threshold AND NEW.quantity_available > 0 THEN
    -- Vérifier si alerte existe déjà
    SELECT EXISTS(
      SELECT 1 FROM public.physical_product_alerts
      WHERE store_id = v_physical_product.store_id
      AND product_id = (
        SELECT id FROM public.products WHERE id IN (
          SELECT product_id FROM public.physical_products WHERE id = COALESCE(NEW.physical_product_id, (
            SELECT physical_product_id FROM public.product_variants WHERE id = NEW.variant_id
          ))
        )
      )
      AND variant_id = NEW.variant_id
      AND alert_type = 'low_stock'
      AND status = 'active'
    ) INTO v_alert_exists;
    
    -- Créer alerte si n'existe pas
    IF NOT v_alert_exists THEN
      INSERT INTO public.physical_product_alerts (
        store_id,
        product_id,
        variant_id,
        alert_type,
        severity,
        title,
        message,
        details
      ) VALUES (
        v_physical_product.store_id,
        (SELECT id FROM public.products WHERE id IN (
          SELECT product_id FROM public.physical_products WHERE id = COALESCE(NEW.physical_product_id, (
            SELECT physical_product_id FROM public.product_variants WHERE id = NEW.variant_id
          ))
        )),
        NEW.variant_id,
        'low_stock',
        CASE 
          WHEN NEW.quantity_available = 0 THEN 'critical'
          WHEN NEW.quantity_available <= (v_threshold * 0.3) THEN 'high'
          WHEN NEW.quantity_available <= (v_threshold * 0.6) THEN 'medium'
          ELSE 'low'
        END,
        'Stock faible: ' || v_physical_product.product_name,
        'Le stock est faible (' || NEW.quantity_available || ' unités restantes). Seuil: ' || v_threshold,
        jsonb_build_object(
          'current_stock', NEW.quantity_available,
          'threshold', v_threshold,
          'product_name', v_physical_product.product_name
        )
      );
    END IF;
  END IF;
  
  -- Vérifier si stock épuisé
  IF NEW.quantity_available = 0 THEN
    SELECT EXISTS(
      SELECT 1 FROM public.physical_product_alerts
      WHERE store_id = v_physical_product.store_id
      AND product_id = (
        SELECT id FROM public.products WHERE id IN (
          SELECT product_id FROM public.physical_products WHERE id = COALESCE(NEW.physical_product_id, (
            SELECT physical_product_id FROM public.product_variants WHERE id = NEW.variant_id
          ))
        )
      )
      AND variant_id = NEW.variant_id
      AND alert_type = 'out_of_stock'
      AND status = 'active'
    ) INTO v_alert_exists;
    
    IF NOT v_alert_exists THEN
      INSERT INTO public.physical_product_alerts (
        store_id,
        product_id,
        variant_id,
        alert_type,
        severity,
        title,
        message,
        details
      ) VALUES (
        v_physical_product.store_id,
        (SELECT id FROM public.products WHERE id IN (
          SELECT product_id FROM public.physical_products WHERE id = COALESCE(NEW.physical_product_id, (
            SELECT physical_product_id FROM public.product_variants WHERE id = NEW.variant_id
          ))
        )),
        NEW.variant_id,
        'out_of_stock',
        'critical',
        'Stock épuisé: ' || v_physical_product.product_name,
        'Le stock est épuisé pour ce produit.',
        jsonb_build_object(
          'product_name', v_physical_product.product_name
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger pour vérifier stock faible
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_check_low_stock_alert'
  ) THEN
    CREATE TRIGGER trigger_check_low_stock_alert
      AFTER UPDATE OF quantity_available ON public.inventory_items
      FOR EACH ROW
      WHEN (OLD.quantity_available IS DISTINCT FROM NEW.quantity_available)
      EXECUTE FUNCTION public.check_low_stock_and_alert();
  END IF;
END $$;

-- =====================================================
-- 6. COMMENTS
-- =====================================================
COMMENT ON TABLE public.physical_product_alerts IS 'Alertes produits physiques (stock, etc.)';
COMMENT ON TABLE public.notification_preferences IS 'Préférences de notifications par utilisateur/store';
COMMENT ON TABLE public.notification_logs IS 'Logs des notifications envoyées';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

