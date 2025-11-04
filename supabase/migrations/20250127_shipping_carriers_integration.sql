-- =====================================================
-- PAYHUK SHIPPING CARRIERS INTEGRATION SYSTEM
-- Date: 27 Janvier 2025
-- Description: Intégration transporteurs réels (DHL, FedEx, UPS, Chronopost)
--              Calcul tarifs temps réel, génération étiquettes, tracking
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: shipping_carriers
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shipping_carriers'
  ) THEN
    CREATE TABLE public.shipping_carriers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      
      -- Informations transporteur
      carrier_name TEXT NOT NULL CHECK (carrier_name IN ('DHL', 'FedEx', 'UPS', 'Chronopost', 'DHL_Express', 'FedEx_Express', 'UPS_Express', 'Custom')),
      display_name TEXT NOT NULL,
      
      -- Configuration API
      api_key TEXT,
      api_secret TEXT,
      api_url TEXT,
      account_number TEXT, -- Numéro de compte transporteur
      meter_number TEXT, -- Pour FedEx
      
      -- Paramètres
      is_active BOOLEAN DEFAULT true,
      is_default BOOLEAN DEFAULT false,
      test_mode BOOLEAN DEFAULT true, -- Mode test pour développement
      
      -- Services disponibles
      available_services TEXT[] DEFAULT '{}', -- ['standard', 'express', 'overnight', 'economy']
      
      -- Options
      requires_signature BOOLEAN DEFAULT false,
      requires_insurance BOOLEAN DEFAULT false,
      requires_customs BOOLEAN DEFAULT false, -- Pour international
      
      -- Zones supportées
      supported_countries TEXT[] DEFAULT '{}', -- Codes ISO pays
      supported_states TEXT[] DEFAULT '{}',
      
      -- Métadonnées
      metadata JSONB DEFAULT '{}',
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(store_id, carrier_name)
    );
  END IF;
END $$;

-- Indexes pour shipping_carriers
-- Vérifier et créer colonne si nécessaire
DO $$ BEGIN
  -- S'assurer que store_id existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shipping_carriers' 
    AND column_name = 'store_id'
  ) THEN
    ALTER TABLE public.shipping_carriers 
    ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shipping_carriers' 
    AND column_name = 'store_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_shipping_carriers_store_id'
  ) THEN
    CREATE INDEX idx_shipping_carriers_store_id ON public.shipping_carriers(store_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_shipping_carriers_active'
  ) THEN
    CREATE INDEX idx_shipping_carriers_active ON public.shipping_carriers(is_active);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_shipping_carriers_updated_at'
  ) THEN
    CREATE TRIGGER update_shipping_carriers_updated_at
      BEFORE UPDATE ON public.shipping_carriers
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: shipping_labels
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shipping_labels'
  ) THEN
    CREATE TABLE public.shipping_labels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
      carrier_id UUID NOT NULL REFERENCES public.shipping_carriers(id) ON DELETE CASCADE,
      
      -- Informations étiquette
      label_number TEXT UNIQUE NOT NULL, -- Numéro d'étiquette unique
      tracking_number TEXT UNIQUE, -- Numéro de suivi
      
      -- Service utilisé
      service_type TEXT NOT NULL, -- 'standard', 'express', 'overnight', etc.
      service_name TEXT, -- Nom lisible du service
      
      -- Coûts
      shipping_cost NUMERIC NOT NULL,
      currency TEXT DEFAULT 'XOF',
      insurance_cost NUMERIC DEFAULT 0,
      total_cost NUMERIC GENERATED ALWAYS AS (shipping_cost + insurance_cost) STORED,
      
      -- Fichier étiquette
      label_url TEXT, -- URL du fichier PDF d'étiquette
      label_format TEXT DEFAULT 'PDF', -- 'PDF', 'PNG', 'ZPL'
      label_data BYTEA, -- Données binaires de l'étiquette (optionnel)
      
      -- Dimensions/Weight
      weight NUMERIC,
      weight_unit TEXT DEFAULT 'kg',
      dimensions JSONB, -- {length, width, height, unit}
      
      -- Adresses
      from_address JSONB NOT NULL, -- Adresse expéditeur
      to_address JSONB NOT NULL, -- Adresse destinataire
      
      -- Statut
      status TEXT NOT NULL CHECK (status IN (
        'pending',      -- En attente de génération
        'generated',    -- Générée
        'printed',      -- Imprimée
        'voided',       -- Annulée
        'error'         -- Erreur
      )) DEFAULT 'pending',
      
      -- Références API
      api_response JSONB, -- Réponse complète de l'API transporteur
      api_request_id TEXT, -- ID de la requête API
      
      -- Dates
      generated_at TIMESTAMPTZ,
      printed_at TIMESTAMPTZ,
      voided_at TIMESTAMPTZ,
      
      -- Notes
      notes TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour shipping_labels
-- Vérifier et créer colonne si nécessaire
DO $$ BEGIN
  -- S'assurer que store_id existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shipping_labels' 
    AND column_name = 'store_id'
  ) THEN
    ALTER TABLE public.shipping_labels 
    ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shipping_labels' 
    AND column_name = 'store_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_shipping_labels_store_id'
  ) THEN
    CREATE INDEX idx_shipping_labels_store_id ON public.shipping_labels(store_id);
  END IF;
END $$;

DO $$ BEGIN
  -- S'assurer que order_id existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shipping_labels' 
    AND column_name = 'order_id'
  ) THEN
    ALTER TABLE public.shipping_labels 
    ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shipping_labels' 
    AND column_name = 'order_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_shipping_labels_order_id'
  ) THEN
    CREATE INDEX idx_shipping_labels_order_id ON public.shipping_labels(order_id);
  END IF;
END $$;

DO $$ BEGIN
  -- Vérifier que tracking_number existe (c'est une colonne nullable donc peut ne pas exister)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shipping_labels' 
    AND column_name = 'tracking_number'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_shipping_labels_tracking_number'
  ) THEN
    CREATE INDEX idx_shipping_labels_tracking_number ON public.shipping_labels(tracking_number);
  END IF;
END $$;

DO $$ BEGIN
  -- Vérifier que carrier_id existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shipping_labels' 
    AND column_name = 'carrier_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_shipping_labels_carrier_id'
  ) THEN
    CREATE INDEX idx_shipping_labels_carrier_id ON public.shipping_labels(carrier_id);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_shipping_labels_updated_at'
  ) THEN
    CREATE TRIGGER update_shipping_labels_updated_at
      BEFORE UPDATE ON public.shipping_labels
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 3. TABLE: shipping_tracking_events
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shipping_tracking_events'
  ) THEN
    CREATE TABLE public.shipping_tracking_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      shipping_label_id UUID NOT NULL REFERENCES public.shipping_labels(id) ON DELETE CASCADE,
      tracking_number TEXT NOT NULL,
      
      -- Événement
      event_type TEXT NOT NULL, -- 'pickup', 'in_transit', 'out_for_delivery', 'delivered', 'exception', etc.
      event_description TEXT NOT NULL,
      event_location TEXT, -- Localisation de l'événement
      
      -- Coordonnées (si disponibles)
      latitude NUMERIC,
      longitude NUMERIC,
      
      -- Dates
      event_timestamp TIMESTAMPTZ NOT NULL,
      
      -- Métadonnées
      metadata JSONB DEFAULT '{}',
      
      -- Source
      source TEXT DEFAULT 'api', -- 'api', 'webhook', 'manual'
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(tracking_number, event_timestamp, event_type)
    );
  END IF;
END $$;

-- Indexes pour shipping_tracking_events
-- Vérifier et créer colonne si nécessaire
DO $$ BEGIN
  -- S'assurer que shipping_label_id existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shipping_tracking_events' 
    AND column_name = 'shipping_label_id'
  ) THEN
    ALTER TABLE public.shipping_tracking_events 
    ADD COLUMN IF NOT EXISTS shipping_label_id UUID REFERENCES public.shipping_labels(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shipping_tracking_events' 
    AND column_name = 'shipping_label_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tracking_events_label_id'
  ) THEN
    CREATE INDEX idx_tracking_events_label_id ON public.shipping_tracking_events(shipping_label_id);
  END IF;
END $$;

DO $$ BEGIN
  -- Vérifier que tracking_number existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shipping_tracking_events' 
    AND column_name = 'tracking_number'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tracking_events_tracking_number'
  ) THEN
    CREATE INDEX idx_tracking_events_tracking_number ON public.shipping_tracking_events(tracking_number);
  END IF;
END $$;

DO $$ BEGIN
  -- Vérifier que event_timestamp existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shipping_tracking_events' 
    AND column_name = 'event_timestamp'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tracking_events_timestamp'
  ) THEN
    CREATE INDEX idx_tracking_events_timestamp ON public.shipping_tracking_events(event_timestamp DESC);
  END IF;
END $$;

-- =====================================================
-- 4. TABLE: shipping_rate_requests
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shipping_rate_requests'
  ) THEN
    CREATE TABLE public.shipping_rate_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      carrier_id UUID REFERENCES public.shipping_carriers(id) ON DELETE SET NULL,
      
      -- Paramètres requête
      from_country TEXT NOT NULL,
      from_postal_code TEXT,
      to_country TEXT NOT NULL,
      to_postal_code TEXT,
      
      -- Dimensions
      weight NUMERIC NOT NULL,
      weight_unit TEXT DEFAULT 'kg',
      dimensions JSONB, -- {length, width, height, unit}
      
      -- Options
      service_type TEXT,
      delivery_date DATE, -- Date de livraison souhaitée
      
      -- Résultats
      rates JSONB DEFAULT '[]', -- Array de rates retournés
      fastest_rate NUMERIC,
      cheapest_rate NUMERIC,
      
      -- Métadonnées
      request_data JSONB, -- Données de la requête
      response_data JSONB, -- Réponse complète de l'API
      error_message TEXT,
      
      -- Cache
      is_cached BOOLEAN DEFAULT false,
      cache_expires_at TIMESTAMPTZ,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour shipping_rate_requests
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rate_requests_store_id'
  ) THEN
    CREATE INDEX idx_rate_requests_store_id ON public.shipping_rate_requests(store_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rate_requests_cache'
  ) THEN
    CREATE INDEX idx_rate_requests_cache ON public.shipping_rate_requests(cache_expires_at) 
    WHERE is_cached = true;
  END IF;
END $$;

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.shipping_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rate_requests ENABLE ROW LEVEL SECURITY;

-- Policies pour shipping_carriers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shipping_carriers' AND policyname = 'Store owners can manage carriers'
  ) THEN
    CREATE POLICY "Store owners can manage carriers" ON public.shipping_carriers
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = shipping_carriers.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour shipping_labels
-- S'assurer que store_id existe avant de créer les politiques
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shipping_labels'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shipping_labels' 
    AND column_name = 'store_id'
  ) THEN
    ALTER TABLE public.shipping_labels 
    ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shipping_labels' 
    AND column_name = 'store_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shipping_labels' AND policyname = 'Store owners can manage labels'
  ) THEN
    CREATE POLICY "Store owners can manage labels" ON public.shipping_labels
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = shipping_labels.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shipping_labels' 
    AND column_name = 'order_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shipping_labels' AND policyname = 'Customers can view own labels'
  ) THEN
    CREATE POLICY "Customers can view own labels" ON public.shipping_labels
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = shipping_labels.order_id
          AND o.customer_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour shipping_tracking_events
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shipping_tracking_events' AND policyname = 'Anyone can view tracking events'
  ) THEN
    CREATE POLICY "Anyone can view tracking events" ON public.shipping_tracking_events
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Policies pour shipping_rate_requests
-- S'assurer que store_id existe avant de créer les politiques
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shipping_rate_requests'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shipping_rate_requests' 
    AND column_name = 'store_id'
  ) THEN
    ALTER TABLE public.shipping_rate_requests 
    ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shipping_rate_requests' 
    AND column_name = 'store_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shipping_rate_requests' AND policyname = 'Store owners can view requests'
  ) THEN
    CREATE POLICY "Store owners can view requests" ON public.shipping_rate_requests
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = shipping_rate_requests.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- 6. FUNCTIONS
-- =====================================================

-- Function: Generate label number
CREATE OR REPLACE FUNCTION public.generate_shipping_label_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_number TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_number := 'LABEL-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    SELECT EXISTS(SELECT 1 FROM public.shipping_labels WHERE label_number = v_number) INTO v_exists;
    
    IF NOT v_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_number;
END;
$$;

-- Function: Get latest tracking status
CREATE OR REPLACE FUNCTION public.get_latest_tracking_status(
  p_tracking_number TEXT
)
RETURNS TABLE (
  latest_event RECORD,
  is_delivered BOOLEAN,
  estimated_delivery TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_latest RECORD;
BEGIN
  SELECT * INTO v_latest
  FROM public.shipping_tracking_events
  WHERE tracking_number = p_tracking_number
  ORDER BY event_timestamp DESC
  LIMIT 1;
  
  RETURN QUERY SELECT 
    v_latest,
    v_latest.event_type = 'delivered',
    NULL::TIMESTAMPTZ; -- TODO: Calculer estimation basée sur historique
END;
$$;

-- =====================================================
-- 7. COMMENTS
-- =====================================================
COMMENT ON TABLE public.shipping_carriers IS 'Configuration transporteurs (DHL, FedEx, UPS, etc.)';
COMMENT ON TABLE public.shipping_labels IS 'Étiquettes d''expédition générées';
COMMENT ON TABLE public.shipping_tracking_events IS 'Événements de suivi colis';
COMMENT ON TABLE public.shipping_rate_requests IS 'Requêtes de calcul tarifs (cache)';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

