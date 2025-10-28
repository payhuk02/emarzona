-- ============================================================
-- SHIPPING FEDEX SYSTEM - Complete Database Architecture
-- Date: 28 octobre 2025
-- Version: 1.0
-- ============================================================

-- ============================================================
-- 1. SHIPPING CARRIERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shipping_carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- === CARRIER INFO ===
  name TEXT NOT NULL, -- 'FedEx', 'DHL', 'UPS', 'Local'
  code TEXT NOT NULL UNIQUE, -- 'fedex', 'dhl', 'ups'
  logo_url TEXT,
  
  -- === API CONFIG ===
  api_enabled BOOLEAN DEFAULT FALSE,
  api_endpoint TEXT,
  api_key TEXT, -- Encrypted
  api_secret TEXT, -- Encrypted
  test_mode BOOLEAN DEFAULT TRUE,
  
  -- === CAPABILITIES ===
  supports_tracking BOOLEAN DEFAULT TRUE,
  supports_labels BOOLEAN DEFAULT TRUE,
  supports_rates BOOLEAN DEFAULT TRUE,
  supports_pickup BOOLEAN DEFAULT FALSE,
  
  -- === STATUS ===
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_carriers_code ON public.shipping_carriers(code);
CREATE INDEX IF NOT EXISTS idx_shipping_carriers_active ON public.shipping_carriers(is_active);

-- ============================================================
-- 2. SHIPMENTS (Tracking Info)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- === RELATIONS ===
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES public.shipping_carriers(id) ON DELETE SET NULL,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- === TRACKING ===
  tracking_number TEXT UNIQUE,
  tracking_url TEXT,
  
  -- === SHIPMENT INFO ===
  service_type TEXT, -- 'FEDEX_GROUND', 'FEDEX_2DAY', etc.
  package_type TEXT, -- 'FEDEX_PAK', 'YOUR_PACKAGING', etc.
  
  -- === DIMENSIONS ===
  weight_value NUMERIC, -- in kg
  weight_unit TEXT DEFAULT 'kg',
  length NUMERIC,
  width NUMERIC,
  height NUMERIC,
  dimension_unit TEXT DEFAULT 'cm',
  
  -- === ADDRESSES ===
  ship_from JSONB, -- { name, address, city, state, zip, country, phone }
  ship_to JSONB, -- { name, address, city, state, zip, country, phone }
  
  -- === COSTS ===
  shipping_cost NUMERIC DEFAULT 0,
  insurance_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'XOF',
  
  -- === STATUS ===
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'pending',        -- En attente
      'label_created',  -- Étiquette créée
      'picked_up',      -- Ramassé
      'in_transit',     -- En transit
      'out_for_delivery', -- En livraison
      'delivered',      -- Livré
      'failed',         -- Échec
      'returned',       -- Retourné
      'cancelled'       -- Annulé
    )
  ),
  
  -- === DATES ===
  shipped_date TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ,
  actual_delivery TIMESTAMPTZ,
  
  -- === TRACKING EVENTS ===
  last_tracking_update TIMESTAMPTZ,
  tracking_events JSONB DEFAULT '[]'::jsonb, -- Array of events
  
  -- === NOTES ===
  customer_notes TEXT,
  internal_notes TEXT,
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier_id ON public.shipments(carrier_id);
CREATE INDEX IF NOT EXISTS idx_shipments_store_id ON public.shipments(store_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON public.shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments(created_at DESC);

-- ============================================================
-- 3. SHIPPING LABELS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shipping_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- === RELATIONS ===
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  
  -- === LABEL INFO ===
  label_format TEXT DEFAULT 'PDF', -- 'PDF', 'PNG', 'ZPL'
  label_url TEXT, -- Supabase Storage URL
  label_data TEXT, -- Base64 encoded label
  
  -- === BARCODE ===
  barcode_data TEXT,
  barcode_url TEXT,
  
  -- === STATUS ===
  is_printed BOOLEAN DEFAULT FALSE,
  printed_at TIMESTAMPTZ,
  printed_by UUID REFERENCES auth.users(id),
  
  -- === METADATA ===
  page_size TEXT DEFAULT 'A4', -- 'A4', '4x6', etc.
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_labels_shipment_id ON public.shipping_labels(shipment_id);

-- ============================================================
-- 4. SHIPPING TRACKING EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shipping_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- === RELATIONS ===
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  
  -- === EVENT INFO ===
  event_type TEXT NOT NULL, -- 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', etc.
  event_code TEXT, -- Carrier-specific code
  description TEXT NOT NULL,
  
  -- === LOCATION ===
  location JSONB, -- { city, state, country, coordinates }
  
  -- === TIMING ===
  event_timestamp TIMESTAMPTZ NOT NULL,
  
  -- === RAW DATA ===
  raw_data JSONB, -- Original carrier response
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_id ON public.shipping_tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_timestamp ON public.shipping_tracking_events(event_timestamp DESC);

-- ============================================================
-- 5. SHIPPING PICKUP REQUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shipping_pickup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- === RELATIONS ===
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES public.shipping_carriers(id) ON DELETE SET NULL,
  
  -- === PICKUP INFO ===
  confirmation_number TEXT,
  
  -- === LOCATION ===
  pickup_address JSONB NOT NULL,
  
  -- === TIMING ===
  pickup_date DATE NOT NULL,
  ready_time TIME,
  close_time TIME,
  
  -- === PACKAGE INFO ===
  package_count INTEGER DEFAULT 1,
  total_weight NUMERIC,
  
  -- === STATUS ===
  status TEXT NOT NULL DEFAULT 'requested' CHECK (
    status IN ('requested', 'scheduled', 'completed', 'cancelled', 'failed')
  ),
  
  -- === NOTES ===
  special_instructions TEXT,
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pickup_requests_store_id ON public.shipping_pickup_requests(store_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_status ON public.shipping_pickup_requests(status);

-- ============================================================
-- 6. TRIGGERS
-- ============================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_shipping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shipping_carriers_timestamp
  BEFORE UPDATE ON public.shipping_carriers
  FOR EACH ROW EXECUTE FUNCTION update_shipping_updated_at();

CREATE TRIGGER update_shipments_timestamp
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION update_shipping_updated_at();

CREATE TRIGGER update_shipping_labels_timestamp
  BEFORE UPDATE ON public.shipping_labels
  FOR EACH ROW EXECUTE FUNCTION update_shipping_updated_at();

CREATE TRIGGER update_pickup_requests_timestamp
  BEFORE UPDATE ON public.shipping_pickup_requests
  FOR EACH ROW EXECUTE FUNCTION update_shipping_updated_at();

-- ============================================================
-- 7. SEED DATA - Default Carriers
-- ============================================================

INSERT INTO public.shipping_carriers (
  name, code, logo_url, api_enabled, test_mode,
  supports_tracking, supports_labels, supports_rates, is_active, priority
) VALUES
  (
    'FedEx',
    'fedex',
    'https://logos-world.net/wp-content/uploads/2020/04/FedEx-Logo.png',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    1
  ),
  (
    'DHL',
    'dhl',
    'https://logos-world.net/wp-content/uploads/2020/04/DHL-Logo.png',
    FALSE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    2
  ),
  (
    'UPS',
    'ups',
    'https://logos-world.net/wp-content/uploads/2020/04/UPS-Logo.png',
    FALSE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    3
  ),
  (
    'Local Delivery',
    'local',
    NULL,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    TRUE,
    TRUE,
    4
  )
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 8. RLS POLICIES
-- ============================================================

ALTER TABLE public.shipping_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_pickup_requests ENABLE ROW LEVEL SECURITY;

-- Carriers: Public read, admin write
CREATE POLICY "Anyone can view active carriers"
  ON public.shipping_carriers FOR SELECT
  USING (is_active = TRUE);

-- Shipments: Store owners can manage their shipments
CREATE POLICY "Store owners can view their shipments"
  ON public.shipments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = shipments.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can create shipments"
  ON public.shipments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = shipments.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can update their shipments"
  ON public.shipments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = shipments.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Labels: Follow shipment permissions
CREATE POLICY "Store owners can view their labels"
  ON public.shipping_labels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shipments
      JOIN public.stores ON stores.id = shipments.store_id
      WHERE shipments.id = shipping_labels.shipment_id
      AND stores.user_id = auth.uid()
    )
  );

-- Tracking events: Public read for customer tracking
CREATE POLICY "Anyone can view tracking events"
  ON public.shipping_tracking_events FOR SELECT
  USING (TRUE);

-- Pickup requests: Store owners only
CREATE POLICY "Store owners can manage pickup requests"
  ON public.shipping_pickup_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = shipping_pickup_requests.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- ============================================================
-- 9. VERIFICATION
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Shipping Fedex System Created Successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📦 Tables created:';
  RAISE NOTICE '  - shipping_carriers (4 carriers seeded)';
  RAISE NOTICE '  - shipments';
  RAISE NOTICE '  - shipping_labels';
  RAISE NOTICE '  - shipping_tracking_events';
  RAISE NOTICE '  - shipping_pickup_requests';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '⚡ Triggers configured';
END $$;

-- Display carriers
SELECT 
  '📋 Available Carriers' AS info,
  name,
  code,
  CASE WHEN api_enabled THEN '✅ API' ELSE '❌ API' END AS api_status,
  CASE WHEN is_active THEN '✅ Active' ELSE '❌ Inactive' END AS status,
  priority
FROM public.shipping_carriers
ORDER BY priority;

