-- =====================================================
-- PAYHUK PHYSICAL PRODUCTS SYSTEM - PROFESSIONAL GRADE
-- Date: 28 Octobre 2025
-- Inspiré de : Shopify, WooCommerce, BigCommerce
-- Description: Système complet pour produits physiques haut de gamme
-- Version: 1.0
-- =====================================================

-- Drop existing tables if any
DROP TABLE IF EXISTS public.stock_movements CASCADE;
DROP TABLE IF EXISTS public.shipping_rates CASCADE;
DROP TABLE IF EXISTS public.shipping_zones CASCADE;
DROP TABLE IF EXISTS public.inventory_items CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.physical_products CASCADE;

-- =====================================================
-- 1. TABLE: physical_products
-- =====================================================
CREATE TABLE public.physical_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- === INVENTORY MANAGEMENT ===
  track_inventory BOOLEAN DEFAULT TRUE,
  inventory_policy TEXT DEFAULT 'deny' CHECK (inventory_policy IN ('deny', 'continue')),
  -- 'deny' = stop selling when out of stock
  -- 'continue' = allow backorders/pre-orders
  
  continue_selling_when_out_of_stock BOOLEAN DEFAULT FALSE,
  low_stock_threshold INTEGER DEFAULT 10,
  
  -- === SKU & BARCODES ===
  sku TEXT,
  barcode TEXT,
  barcode_type TEXT CHECK (barcode_type IN ('UPC', 'EAN', 'ISBN', 'JAN', 'ITF')),
  
  -- === SHIPPING CONFIGURATION ===
  requires_shipping BOOLEAN DEFAULT TRUE,
  
  weight NUMERIC,
  weight_unit TEXT DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'g', 'lb', 'oz')),
  
  length NUMERIC,
  width NUMERIC,
  height NUMERIC,
  dimensions_unit TEXT DEFAULT 'cm' CHECK (dimensions_unit IN ('cm', 'in', 'm')),
  
  free_shipping BOOLEAN DEFAULT FALSE,
  shipping_class TEXT, -- 'standard', 'express', 'fragile', etc.
  
  -- === VARIANTS ===
  has_variants BOOLEAN DEFAULT FALSE,
  option1_name TEXT, -- Ex: 'Color'
  option2_name TEXT, -- Ex: 'Size'
  option3_name TEXT, -- Ex: 'Material'
  
  -- === PRODUCT ATTRIBUTES ===
  material TEXT,
  color TEXT,
  manufacturer TEXT,
  country_of_origin TEXT,
  
  -- === FULFILLMENT ===
  fulfillment_service TEXT DEFAULT 'manual' CHECK (fulfillment_service IN ('manual', 'amazon', 'shipstation', 'other')),
  
  -- === STATS & ANALYTICS ===
  total_quantity_sold INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  average_rating NUMERIC DEFAULT 0,
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_physical_products_product_id ON public.physical_products(product_id);
CREATE INDEX IF NOT EXISTS idx_physical_products_sku ON public.physical_products(sku);
CREATE INDEX IF NOT EXISTS idx_physical_products_barcode ON public.physical_products(barcode);
CREATE INDEX IF NOT EXISTS idx_physical_products_has_variants ON public.physical_products(has_variants);

-- =====================================================
-- 2. TABLE: product_variants
-- =====================================================
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  physical_product_id UUID NOT NULL REFERENCES public.physical_products(id) ON DELETE CASCADE,
  
  -- === VARIANT OPTIONS ===
  option1_value TEXT NOT NULL, -- Ex: 'Red'
  option2_value TEXT,          -- Ex: 'Large'
  option3_value TEXT,          -- Ex: 'Cotton'
  
  -- === PRICING ===
  price NUMERIC NOT NULL,
  compare_at_price NUMERIC, -- Original price for discounts
  cost_per_item NUMERIC,    -- For profit calculations
  
  -- === INVENTORY ===
  sku TEXT UNIQUE,
  barcode TEXT,
  quantity INTEGER DEFAULT 0,
  
  -- === WEIGHT & DIMENSIONS (can override product defaults) ===
  weight NUMERIC,
  length NUMERIC,
  width NUMERIC,
  height NUMERIC,
  
  -- === VARIANT SPECIFICS ===
  image_url TEXT,
  position INTEGER DEFAULT 0, -- Display order
  
  -- === STATUS ===
  is_available BOOLEAN DEFAULT TRUE,
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint for variant combinations
  UNIQUE(physical_product_id, option1_value, option2_value, option3_value)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_physical_product_id ON public.product_variants(physical_product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_quantity ON public.product_variants(quantity);
CREATE INDEX IF NOT EXISTS idx_product_variants_available ON public.product_variants(is_available);

-- =====================================================
-- 3. TABLE: inventory_items
-- =====================================================
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to either product or variant
  physical_product_id UUID REFERENCES public.physical_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  
  -- === INVENTORY TRACKING ===
  sku TEXT NOT NULL,
  quantity_available INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0, -- For pending orders
  quantity_committed INTEGER DEFAULT 0, -- For confirmed orders
  
  -- === LOCATIONS ===
  warehouse_location TEXT,
  bin_location TEXT,
  
  -- === REORDERING ===
  reorder_point INTEGER DEFAULT 10,
  reorder_quantity INTEGER DEFAULT 50,
  supplier_id UUID, -- Could reference a suppliers table
  
  -- === COST TRACKING ===
  unit_cost NUMERIC,
  total_value NUMERIC GENERATED ALWAYS AS (quantity_available * unit_cost) STORED,
  
  -- === TIMESTAMPS ===
  last_counted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Either product or variant, not both
  CHECK (
    (physical_product_id IS NOT NULL AND variant_id IS NULL) OR
    (physical_product_id IS NULL AND variant_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_product_id ON public.inventory_items(physical_product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_variant_id ON public.inventory_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON public.inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_items_quantity ON public.inventory_items(quantity_available);

-- =====================================================
-- 4. TABLE: stock_movements
-- =====================================================
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  
  -- === MOVEMENT INFO ===
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'purchase',      -- Stock purchased from supplier
    'sale',          -- Stock sold to customer
    'adjustment',    -- Manual inventory adjustment
    'return',        -- Customer return
    'damage',        -- Damaged goods
    'transfer',      -- Transfer between locations
    'recount'        -- Physical inventory count
  )),
  
  quantity INTEGER NOT NULL, -- Positive for increase, negative for decrease
  
  -- === REFERENCES ===
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- === DETAILS ===
  reason TEXT,
  notes TEXT,
  
  -- === COST ===
  unit_cost NUMERIC,
  total_cost NUMERIC GENERATED ALWAYS AS (ABS(quantity) * COALESCE(unit_cost, 0)) STORED,
  
  -- === TIMESTAMPS ===
  movement_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory_item_id ON public.stock_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON public.stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON public.stock_movements(movement_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_order_id ON public.stock_movements(order_id);

-- =====================================================
-- 5. TABLE: shipping_zones
-- =====================================================
CREATE TABLE public.shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- === ZONE INFO ===
  name TEXT NOT NULL,
  countries TEXT[] DEFAULT '{}', -- ISO country codes
  states TEXT[] DEFAULT '{}',    -- State/province codes
  zip_codes TEXT[] DEFAULT '{}', -- Postal codes or ranges
  
  -- === SETTINGS ===
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0, -- For overlapping zones
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shipping_zones_store_id ON public.shipping_zones(store_id);
CREATE INDEX IF NOT EXISTS idx_shipping_zones_active ON public.shipping_zones(is_active);

-- =====================================================
-- 6. TABLE: shipping_rates
-- =====================================================
CREATE TABLE public.shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipping_zone_id UUID NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  
  -- === RATE INFO ===
  name TEXT NOT NULL, -- Ex: 'Standard Shipping', 'Express'
  description TEXT,
  
  -- === PRICING ===
  rate_type TEXT NOT NULL CHECK (rate_type IN ('flat', 'weight_based', 'price_based', 'free')),
  
  base_price NUMERIC DEFAULT 0,
  
  -- Weight-based
  price_per_kg NUMERIC,
  min_weight NUMERIC,
  max_weight NUMERIC,
  
  -- Price-based
  min_order_amount NUMERIC,
  max_order_amount NUMERIC,
  
  -- === DELIVERY ===
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  
  -- === SETTINGS ===
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shipping_rates_zone_id ON public.shipping_rates(shipping_zone_id);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_type ON public.shipping_rates(rate_type);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_active ON public.shipping_rates(is_active);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_physical_products_updated_at ON public.physical_products;
CREATE TRIGGER update_physical_products_updated_at
  BEFORE UPDATE ON public.physical_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON public.inventory_items;
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create inventory item when product/variant is created
CREATE OR REPLACE FUNCTION create_inventory_item_for_product()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.track_inventory = TRUE AND NEW.has_variants = FALSE THEN
    INSERT INTO public.inventory_items (
      physical_product_id,
      sku,
      quantity_available
    ) VALUES (
      NEW.id,
      NEW.sku,
      0
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS create_inventory_on_physical_product ON public.physical_products;
CREATE TRIGGER create_inventory_on_physical_product
  AFTER INSERT ON public.physical_products
  FOR EACH ROW
  EXECUTE FUNCTION create_inventory_item_for_product();

-- Auto-create inventory item for variants
CREATE OR REPLACE FUNCTION create_inventory_item_for_variant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.inventory_items (
    variant_id,
    sku,
    quantity_available
  ) VALUES (
    NEW.id,
    NEW.sku,
    NEW.quantity
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS create_inventory_on_variant ON public.product_variants;
CREATE TRIGGER create_inventory_on_variant
  AFTER INSERT ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION create_inventory_item_for_variant();

-- Update inventory when stock movement is created
CREATE OR REPLACE FUNCTION update_inventory_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.inventory_items
  SET quantity_available = quantity_available + NEW.quantity
  WHERE id = NEW.inventory_item_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_inventory_on_stock_movement ON public.stock_movements;
CREATE TRIGGER update_inventory_on_stock_movement
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_movement();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.physical_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

-- Policies: physical_products
DROP POLICY IF EXISTS "Anyone can view physical products" ON public.physical_products;
CREATE POLICY "Anyone can view physical products"
  ON public.physical_products
  FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Store owners manage their physical products" ON public.physical_products;
CREATE POLICY "Store owners manage their physical products"
  ON public.physical_products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE p.id = physical_products.product_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: product_variants
DROP POLICY IF EXISTS "Anyone can view variants" ON public.product_variants;
CREATE POLICY "Anyone can view variants"
  ON public.product_variants
  FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Store owners manage variants" ON public.product_variants;
CREATE POLICY "Store owners manage variants"
  ON public.product_variants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.physical_products pp
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pp.id = product_variants.physical_product_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: inventory_items
DROP POLICY IF EXISTS "Store owners view inventory" ON public.inventory_items;
CREATE POLICY "Store owners view inventory"
  ON public.inventory_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.physical_products pp
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pp.id = inventory_items.physical_product_id
        AND s.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.product_variants pv
      INNER JOIN public.physical_products pp ON pv.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pv.id = inventory_items.variant_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners manage inventory" ON public.inventory_items;
CREATE POLICY "Store owners manage inventory"
  ON public.inventory_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.physical_products pp
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pp.id = inventory_items.physical_product_id
        AND s.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.product_variants pv
      INNER JOIN public.physical_products pp ON pv.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pv.id = inventory_items.variant_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: stock_movements
DROP POLICY IF EXISTS "Store owners view stock movements" ON public.stock_movements;
CREATE POLICY "Store owners view stock movements"
  ON public.stock_movements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inventory_items ii
      INNER JOIN public.physical_products pp ON ii.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE ii.id = stock_movements.inventory_item_id
        AND s.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.inventory_items ii
      INNER JOIN public.product_variants pv ON ii.variant_id = pv.id
      INNER JOIN public.physical_products pp ON pv.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE ii.id = stock_movements.inventory_item_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners create stock movements" ON public.stock_movements;
CREATE POLICY "Store owners create stock movements"
  ON public.stock_movements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inventory_items ii
      INNER JOIN public.physical_products pp ON ii.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE ii.id = stock_movements.inventory_item_id
        AND s.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.inventory_items ii
      INNER JOIN public.product_variants pv ON ii.variant_id = pv.id
      INNER JOIN public.physical_products pp ON pv.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE ii.id = stock_movements.inventory_item_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: shipping_zones
DROP POLICY IF EXISTS "Store owners manage shipping zones" ON public.shipping_zones;
CREATE POLICY "Store owners manage shipping zones"
  ON public.shipping_zones
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = shipping_zones.store_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: shipping_rates
DROP POLICY IF EXISTS "Anyone can view shipping rates" ON public.shipping_rates;
CREATE POLICY "Anyone can view shipping rates"
  ON public.shipping_rates
  FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Store owners manage shipping rates" ON public.shipping_rates;
CREATE POLICY "Store owners manage shipping rates"
  ON public.shipping_rates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shipping_zones sz
      INNER JOIN public.stores s ON sz.store_id = s.id
      WHERE sz.id = shipping_rates.shipping_zone_id
        AND s.user_id = auth.uid()
    )
  );

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get available quantity for a product/variant
CREATE OR REPLACE FUNCTION get_available_quantity(
  p_physical_product_id UUID DEFAULT NULL,
  p_variant_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_quantity INTEGER;
BEGIN
  SELECT quantity_available INTO v_quantity
  FROM public.inventory_items
  WHERE (physical_product_id = p_physical_product_id AND p_physical_product_id IS NOT NULL)
     OR (variant_id = p_variant_id AND p_variant_id IS NOT NULL);
  
  RETURN COALESCE(v_quantity, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reserve inventory for an order
CREATE OR REPLACE FUNCTION reserve_inventory(
  p_inventory_item_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available INTEGER;
BEGIN
  SELECT quantity_available INTO v_available
  FROM public.inventory_items
  WHERE id = p_inventory_item_id;
  
  IF v_available >= p_quantity THEN
    UPDATE public.inventory_items
    SET quantity_reserved = quantity_reserved + p_quantity
    WHERE id = p_inventory_item_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VÉRIFICATION
-- =====================================================

SELECT
  'physical_products' as table_name,
  COUNT(*) as row_count
FROM public.physical_products
UNION ALL
SELECT
  'product_variants' as table_name,
  COUNT(*) as row_count
FROM public.product_variants
UNION ALL
SELECT
  'inventory_items' as table_name,
  COUNT(*) as row_count
FROM public.inventory_items
UNION ALL
SELECT
  'stock_movements' as table_name,
  COUNT(*) as row_count
FROM public.stock_movements
UNION ALL
SELECT
  'shipping_zones' as table_name,
  COUNT(*) as row_count
FROM public.shipping_zones
UNION ALL
SELECT
  'shipping_rates' as table_name,
  COUNT(*) as row_count
FROM public.shipping_rates;

