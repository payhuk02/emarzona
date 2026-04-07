
-- =====================================================
-- MIGRATION 2: PRODUITS PHYSIQUES + INVENTAIRE
-- =====================================================

-- Produits physiques (extension de products)
CREATE TABLE IF NOT EXISTS public.physical_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  weight numeric,
  length numeric,
  width numeric,
  height numeric,
  dimension_unit text DEFAULT 'cm',
  weight_unit text DEFAULT 'kg',
  sku text,
  barcode text,
  requires_shipping boolean DEFAULT true,
  shipping_class text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Variantes de produits
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  price numeric,
  stock_quantity integer DEFAULT 0,
  attributes jsonb DEFAULT '{}',
  image_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Inventaire
CREATE TABLE IF NOT EXISTS public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  quantity integer DEFAULT 0,
  reserved_quantity integer DEFAULT 0,
  reorder_point integer DEFAULT 5,
  reorder_quantity integer DEFAULT 10,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Mouvements de stock
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  movement_type text NOT NULL, -- 'in', 'out', 'adjustment', 'return'
  reason text,
  reference_id uuid,
  reference_type text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Zones d'expédition
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  countries text[],
  regions text[],
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tarifs d'expédition
CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  rate_type text DEFAULT 'flat', -- flat, weight_based, price_based
  price numeric DEFAULT 0,
  min_weight numeric,
  max_weight numeric,
  min_order_amount numeric,
  max_order_amount numeric,
  estimated_days_min integer,
  estimated_days_max integer,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Expéditions
CREATE TABLE IF NOT EXISTS public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  tracking_number text,
  carrier text,
  status text DEFAULT 'pending',
  shipping_cost numeric DEFAULT 0,
  shipped_at timestamptz,
  delivered_at timestamptz,
  estimated_delivery timestamptz,
  shipping_address jsonb,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Alertes de stock
CREATE TABLE IF NOT EXISTS public.stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  alert_type text DEFAULT 'low_stock',
  threshold integer,
  is_active boolean DEFAULT true,
  last_triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.physical_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- Policies: physical_products
DROP POLICY IF EXISTS "Physical products viewable by everyone" ON public.physical_products;
CREATE POLICY "Physical products viewable by everyone" ON public.physical_products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Store owners can manage physical products" ON public.physical_products;
CREATE POLICY "Store owners can manage physical products" ON public.physical_products FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = physical_products.store_id AND stores.user_id = auth.uid()));

-- Policies: product_variants
DROP POLICY IF EXISTS "Variants viewable by everyone" ON public.product_variants;
CREATE POLICY "Variants viewable by everyone" ON public.product_variants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Store owners can manage variants" ON public.product_variants;
CREATE POLICY "Store owners can manage variants" ON public.product_variants FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = product_variants.store_id AND stores.user_id = auth.uid()));

-- Policies: inventory
DROP POLICY IF EXISTS "Store owners can manage inventory" ON public.inventory;
CREATE POLICY "Store owners can manage inventory" ON public.inventory FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = inventory.store_id AND stores.user_id = auth.uid()));

-- Policies: stock_movements
DROP POLICY IF EXISTS "Store owners can view stock movements" ON public.stock_movements;
CREATE POLICY "Store owners can view stock movements" ON public.stock_movements FOR SELECT USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = stock_movements.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners can insert stock movements" ON public.stock_movements;
CREATE POLICY "Store owners can insert stock movements" ON public.stock_movements FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = stock_movements.store_id AND stores.user_id = auth.uid()));

-- Policies: shipping_zones
DROP POLICY IF EXISTS "Store owners can manage shipping zones" ON public.shipping_zones;
CREATE POLICY "Store owners can manage shipping zones" ON public.shipping_zones FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = shipping_zones.store_id AND stores.user_id = auth.uid()));

-- Policies: shipping_rates
DROP POLICY IF EXISTS "Shipping rates viewable by everyone" ON public.shipping_rates;
CREATE POLICY "Shipping rates viewable by everyone" ON public.shipping_rates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Store owners can manage shipping rates" ON public.shipping_rates;
CREATE POLICY "Store owners can manage shipping rates" ON public.shipping_rates FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = shipping_rates.store_id AND stores.user_id = auth.uid()));

-- Policies: shipments
DROP POLICY IF EXISTS "Store owners can manage shipments" ON public.shipments;
CREATE POLICY "Store owners can manage shipments" ON public.shipments FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = shipments.store_id AND stores.user_id = auth.uid()));

-- Policies: stock_alerts
DROP POLICY IF EXISTS "Store owners can manage stock alerts" ON public.stock_alerts;
CREATE POLICY "Store owners can manage stock alerts" ON public.stock_alerts FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = stock_alerts.store_id AND stores.user_id = auth.uid()));

-- Index
CREATE INDEX IF NOT EXISTS idx_physical_products_product_id ON public.physical_products(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_store_id ON public.inventory(store_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory_id ON public.stock_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_store_id ON public.shipments(store_id);

-- Triggers
DROP TRIGGER IF EXISTS update_physical_products_updated_at ON public.physical_products;
CREATE TRIGGER update_physical_products_updated_at BEFORE UPDATE ON public.physical_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_inventory_updated_at ON public.inventory;
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_shipping_zones_updated_at ON public.shipping_zones;
CREATE TRIGGER update_shipping_zones_updated_at BEFORE UPDATE ON public.shipping_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_shipping_rates_updated_at ON public.shipping_rates;
CREATE TRIGGER update_shipping_rates_updated_at BEFORE UPDATE ON public.shipping_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_shipments_updated_at ON public.shipments;
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
