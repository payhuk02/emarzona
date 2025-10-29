-- =====================================================
-- PAYHUK PHYSICAL PRODUCTS - ADVANCED FEATURES
-- Date: 29 Octobre 2025
-- Description: Tables pour Pre-orders, Backorders, Alerts, Size Charts, Bundles
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. PRE-ORDERS SYSTEM
-- =====================================================

-- Pre-orders table
CREATE TABLE IF NOT EXISTS public.pre_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_arrival', 'arrived', 'fulfilled', 'cancelled')),
  is_enabled BOOLEAN DEFAULT TRUE,
  
  -- Dates
  expected_availability_date TIMESTAMPTZ,
  
  -- Quantities
  pre_order_limit INTEGER,
  current_pre_orders INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  
  -- Pricing
  deposit_required BOOLEAN DEFAULT FALSE,
  deposit_amount NUMERIC,
  deposit_percentage INTEGER CHECK (deposit_percentage >= 0 AND deposit_percentage <= 100),
  
  -- Settings
  auto_charge_on_arrival BOOLEAN DEFAULT TRUE,
  notification_sent BOOLEAN DEFAULT FALSE,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pre_orders_store ON public.pre_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_pre_orders_product ON public.pre_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_pre_orders_status ON public.pre_orders(status);

-- Pre-order customers table
CREATE TABLE IF NOT EXISTS public.pre_order_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_order_id UUID NOT NULL REFERENCES public.pre_orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  quantity INTEGER NOT NULL DEFAULT 1,
  
  deposit_paid BOOLEAN DEFAULT FALSE,
  deposit_amount NUMERIC,
  
  notified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pre_order_customers_pre_order ON public.pre_order_customers(pre_order_id);
CREATE INDEX IF NOT EXISTS idx_pre_order_customers_customer ON public.pre_order_customers(customer_id);

-- =====================================================
-- 2. BACKORDERS SYSTEM
-- =====================================================

-- Backorders table
CREATE TABLE IF NOT EXISTS public.backorders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  
  -- Status & Priority
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'in_transit', 'partially_received', 'received', 'fulfilled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_enabled BOOLEAN DEFAULT TRUE,
  
  -- Quantities
  customer_demand INTEGER DEFAULT 0,
  ordered_quantity INTEGER DEFAULT 0,
  received_quantity INTEGER DEFAULT 0,
  pending_quantity INTEGER DEFAULT 0,
  
  -- Dates
  first_request_date TIMESTAMPTZ DEFAULT NOW(),
  expected_restock_date TIMESTAMPTZ,
  supplier_order_date TIMESTAMPTZ,
  last_received_date TIMESTAMPTZ,
  
  -- Supplier info
  supplier_id UUID,
  supplier_name TEXT,
  purchase_order_id TEXT,
  
  -- Customer management
  total_customers INTEGER DEFAULT 0,
  notified_customers INTEGER DEFAULT 0,
  auto_fulfill_on_arrival BOOLEAN DEFAULT TRUE,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backorders_store ON public.backorders(store_id);
CREATE INDEX IF NOT EXISTS idx_backorders_product ON public.backorders(product_id);
CREATE INDEX IF NOT EXISTS idx_backorders_status ON public.backorders(status);
CREATE INDEX IF NOT EXISTS idx_backorders_priority ON public.backorders(priority);

-- Backorder customers table
CREATE TABLE IF NOT EXISTS public.backorder_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backorder_id UUID NOT NULL REFERENCES public.backorders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  quantity_requested INTEGER NOT NULL DEFAULT 1,
  quantity_fulfilled INTEGER DEFAULT 0,
  
  is_notified BOOLEAN DEFAULT FALSE,
  is_fulfilled BOOLEAN DEFAULT FALSE,
  
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_backorder_customers_backorder ON public.backorder_customers(backorder_id);
CREATE INDEX IF NOT EXISTS idx_backorder_customers_customer ON public.backorder_customers(customer_id);

-- =====================================================
-- 3. STOCK ALERTS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'overstock', 'expiring_soon', 'damaged', 'threshold_reached')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  
  current_quantity INTEGER NOT NULL,
  threshold_quantity INTEGER,
  
  message TEXT NOT NULL,
  
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_store ON public.stock_alerts(store_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_product ON public.stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_type ON public.stock_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_severity ON public.stock_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_resolved ON public.stock_alerts(is_resolved);

-- =====================================================
-- 4. SIZE CHARTS SYSTEM
-- =====================================================

-- Size charts table
CREATE TABLE IF NOT EXISTS public.size_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  system TEXT DEFAULT 'universal' CHECK (system IN ('eu', 'us', 'uk', 'asia', 'universal')),
  sizes JSONB NOT NULL DEFAULT '[]'::JSONB, -- Array of size names
  
  notes TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_size_charts_store ON public.size_charts(store_id);
CREATE INDEX IF NOT EXISTS idx_size_charts_default ON public.size_charts(is_default);

-- Size chart measurements table
CREATE TABLE IF NOT EXISTS public.size_chart_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size_chart_id UUID NOT NULL REFERENCES public.size_charts(id) ON DELETE CASCADE,
  
  label TEXT NOT NULL,
  unit TEXT DEFAULT 'cm' CHECK (unit IN ('cm', 'inch', 'mm')),
  values JSONB NOT NULL DEFAULT '{}'::JSONB, -- Object with size -> value mapping
  description TEXT,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_size_chart_measurements_chart ON public.size_chart_measurements(size_chart_id);

-- Product to size chart mapping
CREATE TABLE IF NOT EXISTS public.product_size_charts (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size_chart_id UUID NOT NULL REFERENCES public.size_charts(id) ON DELETE CASCADE,
  
  PRIMARY KEY (product_id, size_chart_id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. PRODUCT BUNDLES SYSTEM
-- =====================================================

-- Product bundles table
CREATE TABLE IF NOT EXISTS public.product_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'fixed' CHECK (type IN ('fixed', 'flexible', 'mix_and_match')),
  
  image_url TEXT,
  
  -- Pricing
  original_price NUMERIC NOT NULL DEFAULT 0,
  bundle_price NUMERIC NOT NULL DEFAULT 0,
  discount_percentage NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  
  -- Flexible bundle settings
  min_products INTEGER,
  max_products INTEGER,
  
  -- Inventory
  track_inventory BOOLEAN DEFAULT FALSE,
  total_quantity INTEGER,
  
  -- Display
  is_active BOOLEAN DEFAULT TRUE,
  show_savings BOOLEAN DEFAULT TRUE,
  show_individual_prices BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_bundles_store ON public.product_bundles(store_id);
CREATE INDEX IF NOT EXISTS idx_product_bundles_active ON public.product_bundles(is_active);

-- Bundle items table
CREATE TABLE IF NOT EXISTS public.bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES public.product_bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON public.bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_items_product ON public.bundle_items(product_id);

-- =====================================================
-- 6. VARIANT IMAGES SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.variant_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  
  url TEXT NOT NULL,
  alt_text TEXT,
  
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  
  -- Image metadata
  file_size INTEGER, -- in bytes
  width INTEGER,
  height INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variant_images_variant ON public.variant_images(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_images_primary ON public.variant_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_variant_images_order ON public.variant_images(display_order);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.pre_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_order_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backorders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backorder_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_chart_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_size_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_images ENABLE ROW LEVEL SECURITY;

-- Pre-orders policies
CREATE POLICY "Users can view pre-orders from their stores"
  ON public.pre_orders FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM public.stores
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage pre-orders in their stores"
  ON public.pre_orders FOR ALL
  USING (
    store_id IN (
      SELECT id FROM public.stores
      WHERE user_id = auth.uid()
    )
  );

-- Pre-order customers policies
CREATE POLICY "Users can view pre-order customers"
  ON public.pre_order_customers FOR SELECT
  USING (
    pre_order_id IN (
      SELECT id FROM public.pre_orders
      WHERE store_id IN (
        SELECT id FROM public.stores
        WHERE user_id = auth.uid()
      )
    )
  );

-- Backorders policies
CREATE POLICY "Users can view backorders from their stores"
  ON public.backorders FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM public.stores
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage backorders in their stores"
  ON public.backorders FOR ALL
  USING (
    store_id IN (
      SELECT id FROM public.stores
      WHERE user_id = auth.uid()
    )
  );

-- Stock alerts policies
CREATE POLICY "Users can view stock alerts from their stores"
  ON public.stock_alerts FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM public.stores
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage stock alerts in their stores"
  ON public.stock_alerts FOR ALL
  USING (
    store_id IN (
      SELECT id FROM public.stores
      WHERE user_id = auth.uid()
    )
  );

-- Size charts policies
CREATE POLICY "Users can view size charts from their stores"
  ON public.size_charts FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM public.stores
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage size charts in their stores"
  ON public.size_charts FOR ALL
  USING (
    store_id IN (
      SELECT id FROM public.stores
      WHERE user_id = auth.uid()
    )
  );

-- Size chart measurements policies
CREATE POLICY "Users can view size chart measurements"
  ON public.size_chart_measurements FOR SELECT
  USING (
    size_chart_id IN (
      SELECT id FROM public.size_charts
      WHERE store_id IN (
        SELECT id FROM public.stores
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage size chart measurements"
  ON public.size_chart_measurements FOR ALL
  USING (
    size_chart_id IN (
      SELECT id FROM public.size_charts
      WHERE store_id IN (
        SELECT id FROM public.stores
        WHERE user_id = auth.uid()
      )
    )
  );

-- Product bundles policies
CREATE POLICY "Users can view bundles from their stores"
  ON public.product_bundles FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM public.stores
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage bundles in their stores"
  ON public.product_bundles FOR ALL
  USING (
    store_id IN (
      SELECT id FROM public.stores
      WHERE user_id = auth.uid()
    )
  );

-- Bundle items policies
CREATE POLICY "Users can view bundle items"
  ON public.bundle_items FOR SELECT
  USING (
    bundle_id IN (
      SELECT id FROM public.product_bundles
      WHERE store_id IN (
        SELECT id FROM public.stores
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage bundle items"
  ON public.bundle_items FOR ALL
  USING (
    bundle_id IN (
      SELECT id FROM public.product_bundles
      WHERE store_id IN (
        SELECT id FROM public.stores
        WHERE user_id = auth.uid()
      )
    )
  );

-- Variant images policies
CREATE POLICY "Users can view variant images"
  ON public.variant_images FOR SELECT
  USING (true); -- Public read

CREATE POLICY "Users can manage variant images for their products"
  ON public.variant_images FOR ALL
  USING (
    variant_id IN (
      SELECT pv.id FROM public.product_variants pv
      JOIN public.physical_products pp ON pv.physical_product_id = pp.id
      JOIN public.products p ON pp.product_id = p.id
      JOIN public.stores s ON p.store_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_pre_orders_updated_at
    BEFORE UPDATE ON public.pre_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backorders_updated_at
    BEFORE UPDATE ON public.backorders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_alerts_updated_at
    BEFORE UPDATE ON public.stock_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_size_charts_updated_at
    BEFORE UPDATE ON public.size_charts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_bundles_updated_at
    BEFORE UPDATE ON public.product_bundles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. COMMENTS
-- =====================================================

COMMENT ON TABLE public.pre_orders IS 'Pre-order management for products not yet in stock';
COMMENT ON TABLE public.backorders IS 'Backorder management for products out of stock';
COMMENT ON TABLE public.stock_alerts IS 'Stock level alerts and notifications';
COMMENT ON TABLE public.size_charts IS 'Size guides for physical products';
COMMENT ON TABLE public.product_bundles IS 'Product bundles/packs with special pricing';
COMMENT ON TABLE public.variant_images IS 'Images specific to product variants';

