-- =====================================================
-- EMARZONA PHYSICAL PRODUCTS - ADVANCED IMPROVEMENTS
-- Date: 28 Janvier 2025
-- Description: Améliorations avancées pour produits physiques
-- - Gestion multi-entrepôts
-- - Système de promotions et réductions
-- - Amélioration des variantes
-- =====================================================

-- =====================================================
-- 1. TABLE: warehouses (Multi-entrepôts)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- === WAREHOUSE INFO ===
  name TEXT NOT NULL,
  code TEXT NOT NULL, -- Short code for reference
  description TEXT,
  
  -- === ADDRESS ===
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'BF',
  phone TEXT,
  email TEXT,
  
  -- === SETTINGS ===
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE, -- Only one default per store
  priority INTEGER DEFAULT 0, -- For fulfillment priority
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique code per store
  UNIQUE(store_id, code)
);

-- Add missing columns if table already exists
DO $$ 
BEGIN
  -- Add is_default column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'warehouses' 
    AND column_name = 'is_default'
  ) THEN
    ALTER TABLE public.warehouses ADD COLUMN is_default BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add other columns that might be missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'warehouses' 
    AND column_name = 'priority'
  ) THEN
    ALTER TABLE public.warehouses ADD COLUMN priority INTEGER DEFAULT 0;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_warehouses_store_id ON public.warehouses(store_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_active ON public.warehouses(is_active);
CREATE INDEX IF NOT EXISTS idx_warehouses_default ON public.warehouses(is_default) WHERE is_default = TRUE;

-- =====================================================
-- 2. TABLE: warehouse_inventory (Stock par entrepôt)
-- =====================================================
-- Create warehouse_inventory table conditionally based on inventory_items existence
DO $$ 
BEGIN
  -- Only create warehouse_inventory if inventory_items exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'inventory_items'
  ) THEN
    -- Create table first without foreign key constraint
    CREATE TABLE IF NOT EXISTS public.warehouse_inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
      inventory_item_id UUID NOT NULL,
      
      quantity_available INTEGER DEFAULT 0,
      quantity_reserved INTEGER DEFAULT 0,
      quantity_committed INTEGER DEFAULT 0,
      
      bin_location TEXT,
      
      reorder_point INTEGER DEFAULT 10,
      reorder_quantity INTEGER DEFAULT 50,
      max_stock_level INTEGER,
      
      last_counted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      
      UNIQUE(warehouse_id, inventory_item_id)
    );
    
    -- Add inventory_item_id column if it doesn't exist (for existing tables)
    -- Allow NULL initially to avoid errors if table has existing data
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'warehouse_inventory' 
      AND column_name = 'inventory_item_id'
    ) THEN
      ALTER TABLE public.warehouse_inventory
        ADD COLUMN inventory_item_id UUID;
      
      -- Set NOT NULL constraint only if table is empty or after data migration
      -- For now, we'll leave it nullable to avoid errors
    END IF;
    
    -- Add foreign key constraint separately (only if column exists and constraint doesn't)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'warehouse_inventory' 
      AND column_name = 'inventory_item_id'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'warehouse_inventory' 
      AND constraint_name = 'warehouse_inventory_inventory_item_id_fkey'
    ) THEN
      ALTER TABLE public.warehouse_inventory
        ADD CONSTRAINT warehouse_inventory_inventory_item_id_fkey
        FOREIGN KEY (inventory_item_id) 
        REFERENCES public.inventory_items(id) 
        ON DELETE CASCADE;
    END IF;
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_warehouse_id ON public.warehouse_inventory(warehouse_id);
    CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_item_id ON public.warehouse_inventory(inventory_item_id);
    CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_quantity ON public.warehouse_inventory(quantity_available);
  END IF;
END $$;

-- =====================================================
-- 3. TABLE: stock_alerts (Alertes de réapprovisionnement)
-- =====================================================
-- Create stock_alerts table only if warehouse_inventory exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'warehouse_inventory'
  ) THEN
    -- Create table first without foreign key constraint
    CREATE TABLE IF NOT EXISTS public.stock_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      warehouse_inventory_id UUID NOT NULL,
      
      -- === ALERT INFO ===
      alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'overstock', 'reorder')),
      severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
      
      -- === STATUS ===
      is_resolved BOOLEAN DEFAULT FALSE,
      resolved_at TIMESTAMPTZ,
      resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      resolution_notes TEXT,
      
      -- === METRICS ===
      current_quantity INTEGER NOT NULL,
      threshold_quantity INTEGER NOT NULL,
      
      -- === TIMESTAMPS ===
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Add warehouse_inventory_id column if it doesn't exist (for existing tables)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'stock_alerts' 
      AND column_name = 'warehouse_inventory_id'
    ) THEN
      ALTER TABLE public.stock_alerts
        ADD COLUMN warehouse_inventory_id UUID;
    END IF;
    
    -- Add foreign key constraint separately (only if column exists and constraint doesn't)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'stock_alerts' 
      AND column_name = 'warehouse_inventory_id'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'stock_alerts' 
      AND constraint_name = 'stock_alerts_warehouse_inventory_id_fkey'
    ) THEN
      ALTER TABLE public.stock_alerts
        ADD CONSTRAINT stock_alerts_warehouse_inventory_id_fkey
        FOREIGN KEY (warehouse_inventory_id) 
        REFERENCES public.warehouse_inventory(id) 
        ON DELETE CASCADE;
    END IF;
    
    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_stock_alerts_warehouse_inventory_id ON public.stock_alerts(warehouse_inventory_id);
    CREATE INDEX IF NOT EXISTS idx_stock_alerts_type ON public.stock_alerts(alert_type);
    CREATE INDEX IF NOT EXISTS idx_stock_alerts_resolved ON public.stock_alerts(is_resolved);
    CREATE INDEX IF NOT EXISTS idx_stock_alerts_created ON public.stock_alerts(created_at DESC);
  END IF;
END $$;

-- =====================================================
-- 4. TABLE: product_promotions (Promotions et réductions)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- === PROMOTION INFO ===
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE, -- Promo code (optional)
  
  -- === DISCOUNT TYPE ===
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping')),
  discount_value NUMERIC NOT NULL, -- Percentage or amount
  
  -- === SCOPE ===
  applies_to TEXT NOT NULL CHECK (applies_to IN ('all_products', 'specific_products', 'categories', 'collections')) DEFAULT 'all_products',
  product_ids UUID[], -- For specific_products
  category_ids UUID[], -- For categories
  collection_ids UUID[], -- For collections (if exists)
  
  -- === VARIANTS ===
  applies_to_variants BOOLEAN DEFAULT TRUE,
  variant_ids UUID[], -- Specific variants (optional)
  
  -- === CONDITIONS ===
  min_purchase_amount NUMERIC, -- Minimum order amount
  min_quantity INTEGER, -- Minimum quantity
  max_uses INTEGER, -- Maximum number of uses (null = unlimited)
  max_uses_per_customer INTEGER, -- Per customer limit
  current_uses INTEGER DEFAULT 0,
  
  -- === DATES ===
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  
  -- === STATUS ===
  is_active BOOLEAN DEFAULT TRUE,
  is_automatic BOOLEAN DEFAULT FALSE, -- Auto-apply or requires code
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_promotions_store_id ON public.product_promotions(store_id);
CREATE INDEX IF NOT EXISTS idx_product_promotions_code ON public.product_promotions(code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_promotions_active ON public.product_promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_product_promotions_dates ON public.product_promotions(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_product_promotions_product_ids ON public.product_promotions USING GIN(product_ids);

-- =====================================================
-- 5. TABLE: promotion_usage (Suivi d'utilisation)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.promotion_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES public.product_promotions(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- === USAGE INFO ===
  discount_amount NUMERIC NOT NULL,
  order_total_before_discount NUMERIC NOT NULL,
  order_total_after_discount NUMERIC NOT NULL,
  
  -- === TIMESTAMPS ===
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promotion_usage_promotion_id ON public.promotion_usage(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_order_id ON public.promotion_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_customer_id ON public.promotion_usage(customer_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_used_at ON public.promotion_usage(used_at DESC);

-- =====================================================
-- 6. TABLE: variant_attributes (Attributs personnalisés pour variantes)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.variant_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  
  -- === ATTRIBUTE INFO ===
  attribute_name TEXT NOT NULL, -- Ex: 'Material', 'Pattern', 'Finish'
  attribute_value TEXT NOT NULL, -- Ex: 'Cotton', 'Striped', 'Matte'
  
  -- === DISPLAY ===
  display_order INTEGER DEFAULT 0,
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique attribute per variant
  UNIQUE(variant_id, attribute_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_variant_attributes_variant_id ON public.variant_attributes(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_attributes_name ON public.variant_attributes(attribute_name);

-- =====================================================
-- 7. ENHANCEMENT: Add columns to existing tables
-- =====================================================

-- Add warehouse support to inventory_items (only if table exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'inventory_items'
  ) THEN
    ALTER TABLE public.inventory_items
      ADD COLUMN IF NOT EXISTS default_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add promotion tracking to product_variants
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS promotional_price NUMERIC,
  ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES public.product_promotions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS promotion_starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS promotion_ends_at TIMESTAMPTZ;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Update updated_at for new tables
DROP TRIGGER IF EXISTS update_warehouses_updated_at ON public.warehouses;
CREATE TRIGGER update_warehouses_updated_at
  BEFORE UPDATE ON public.warehouses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_warehouse_inventory_updated_at ON public.warehouse_inventory;
CREATE TRIGGER update_warehouse_inventory_updated_at
  BEFORE UPDATE ON public.warehouse_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stock_alerts_updated_at ON public.stock_alerts;
CREATE TRIGGER update_stock_alerts_updated_at
  BEFORE UPDATE ON public.stock_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_promotions_updated_at ON public.product_promotions;
CREATE TRIGGER update_product_promotions_updated_at
  BEFORE UPDATE ON public.product_promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure only one default warehouse per store
CREATE OR REPLACE FUNCTION ensure_single_default_warehouse()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE public.warehouses
    SET is_default = FALSE
    WHERE store_id = NEW.store_id
      AND id != NEW.id
      AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_default_warehouse_trigger ON public.warehouses;
CREATE TRIGGER ensure_single_default_warehouse_trigger
  BEFORE INSERT OR UPDATE ON public.warehouses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_warehouse();

-- Auto-create warehouse inventory when inventory_item is created
-- Only create if inventory_items table exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'inventory_items'
  ) THEN
    EXECUTE format('
    CREATE OR REPLACE FUNCTION create_warehouse_inventory_for_item()
    RETURNS TRIGGER AS $func$
    DECLARE
      v_default_warehouse_id UUID;
      v_physical_product_id UUID;
      v_store_id UUID;
    BEGIN
      IF NEW.physical_product_id IS NOT NULL THEN
        SELECT p.store_id INTO v_store_id
        FROM public.physical_products pp
        INNER JOIN public.products p ON pp.product_id = p.id
        WHERE pp.id = NEW.physical_product_id;
      ELSIF NEW.variant_id IS NOT NULL THEN
        SELECT p.store_id INTO v_store_id
        FROM public.product_variants pv
        INNER JOIN public.physical_products pp ON pv.physical_product_id = pp.id
        INNER JOIN public.products p ON pp.product_id = p.id
        WHERE pv.id = NEW.variant_id;
      END IF;
      
      IF v_store_id IS NOT NULL THEN
        SELECT id INTO v_default_warehouse_id
        FROM public.warehouses
        WHERE store_id = v_store_id
          AND is_default = TRUE
          AND is_active = TRUE
        LIMIT 1;
        
        IF v_default_warehouse_id IS NOT NULL THEN
          INSERT INTO public.warehouse_inventory (
            warehouse_id,
            inventory_item_id,
            quantity_available,
            quantity_reserved,
            quantity_committed
          ) VALUES (
            v_default_warehouse_id,
            NEW.id,
            NEW.quantity_available,
            NEW.quantity_reserved,
            NEW.quantity_committed
          );
        END IF;
      END IF;
      
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS create_warehouse_inventory_on_item ON public.inventory_items;
    CREATE TRIGGER create_warehouse_inventory_on_item
      AFTER INSERT ON public.inventory_items
      FOR EACH ROW
      EXECUTE FUNCTION create_warehouse_inventory_for_item();
    ');
  END IF;
END $$;

-- Auto-create stock alerts when quantity is low
-- Only create if inventory_items table exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'inventory_items'
  ) THEN
    EXECUTE format('
    CREATE OR REPLACE FUNCTION check_and_create_stock_alerts()
    RETURNS TRIGGER AS $func$
    DECLARE
      v_reorder_point INTEGER;
      v_alert_type TEXT;
      v_severity TEXT;
    BEGIN
      IF OLD.quantity_available = NEW.quantity_available THEN
        RETURN NEW;
      END IF;
      
      v_reorder_point := COALESCE(NEW.reorder_point, 10);
      
      IF NEW.quantity_available = 0 THEN
        v_alert_type := ''out_of_stock'';
        v_severity := ''critical'';
      ELSIF NEW.quantity_available <= v_reorder_point THEN
        v_alert_type := ''low_stock'';
        IF NEW.quantity_available <= (v_reorder_point * 0.5) THEN
          v_severity := ''high'';
        ELSE
          v_severity := ''medium'';
        END IF;
      ELSE
        RETURN NEW;
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM public.stock_alerts sa
        INNER JOIN public.warehouse_inventory wi ON sa.warehouse_inventory_id = wi.id
        WHERE wi.inventory_item_id = NEW.id
          AND sa.alert_type = v_alert_type
          AND sa.is_resolved = FALSE
      ) THEN
        INSERT INTO public.stock_alerts (
          warehouse_inventory_id,
          alert_type,
          severity,
          current_quantity,
          threshold_quantity
        )
        SELECT 
          wi.id,
          v_alert_type,
          v_severity,
          NEW.quantity_available,
          v_reorder_point
        FROM public.warehouse_inventory wi
        WHERE wi.inventory_item_id = NEW.id;
      END IF;
      
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS check_stock_alerts_on_inventory ON public.inventory_items;
    CREATE TRIGGER check_stock_alerts_on_inventory
      AFTER UPDATE OF quantity_available ON public.inventory_items
      FOR EACH ROW
      EXECUTE FUNCTION check_and_create_stock_alerts();
    ');
  END IF;
END $$;

-- Update promotion usage count
CREATE OR REPLACE FUNCTION update_promotion_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.product_promotions
    SET current_uses = current_uses + 1
    WHERE id = NEW.promotion_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_promotion_usage_on_insert ON public.promotion_usage;
CREATE TRIGGER update_promotion_usage_on_insert
  AFTER INSERT ON public.promotion_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_promotion_usage_count();

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_attributes ENABLE ROW LEVEL SECURITY;

-- Policies: warehouses
DROP POLICY IF EXISTS "Store owners manage warehouses" ON public.warehouses;
CREATE POLICY "Store owners manage warehouses"
  ON public.warehouses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = warehouses.store_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: warehouse_inventory
DROP POLICY IF EXISTS "Store owners view warehouse inventory" ON public.warehouse_inventory;
CREATE POLICY "Store owners view warehouse inventory"
  ON public.warehouse_inventory
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.warehouses w
      INNER JOIN public.stores s ON w.store_id = s.id
      WHERE w.id = warehouse_inventory.warehouse_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners manage warehouse inventory" ON public.warehouse_inventory;
CREATE POLICY "Store owners manage warehouse inventory"
  ON public.warehouse_inventory
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.warehouses w
      INNER JOIN public.stores s ON w.store_id = s.id
      WHERE w.id = warehouse_inventory.warehouse_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: stock_alerts
DROP POLICY IF EXISTS "Store owners view stock alerts" ON public.stock_alerts;
CREATE POLICY "Store owners view stock alerts"
  ON public.stock_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.warehouse_inventory wi
      INNER JOIN public.warehouses w ON wi.warehouse_id = w.id
      INNER JOIN public.stores s ON w.store_id = s.id
      WHERE wi.id = stock_alerts.warehouse_inventory_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners manage stock alerts" ON public.stock_alerts;
CREATE POLICY "Store owners manage stock alerts"
  ON public.stock_alerts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.warehouse_inventory wi
      INNER JOIN public.warehouses w ON wi.warehouse_id = w.id
      INNER JOIN public.stores s ON w.store_id = s.id
      WHERE wi.id = stock_alerts.warehouse_inventory_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: product_promotions
DROP POLICY IF EXISTS "Anyone can view active promotions" ON public.product_promotions;
CREATE POLICY "Anyone can view active promotions"
  ON public.product_promotions
  FOR SELECT
  USING (
    is_active = TRUE
    AND starts_at <= NOW()
    AND (ends_at IS NULL OR ends_at >= NOW())
  );

DROP POLICY IF EXISTS "Store owners manage promotions" ON public.product_promotions;
CREATE POLICY "Store owners manage promotions"
  ON public.product_promotions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = product_promotions.store_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: promotion_usage
DROP POLICY IF EXISTS "Store owners view promotion usage" ON public.promotion_usage;
CREATE POLICY "Store owners view promotion usage"
  ON public.promotion_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_promotions pp
      INNER JOIN public.stores s ON pp.store_id = s.id
      WHERE pp.id = promotion_usage.promotion_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: variant_attributes
DROP POLICY IF EXISTS "Anyone can view variant attributes" ON public.variant_attributes;
CREATE POLICY "Anyone can view variant attributes"
  ON public.variant_attributes
  FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Store owners manage variant attributes" ON public.variant_attributes;
CREATE POLICY "Store owners manage variant attributes"
  ON public.variant_attributes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.product_variants pv
      INNER JOIN public.physical_products pp ON pv.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pv.id = variant_attributes.variant_id
        AND s.user_id = auth.uid()
    )
  );

-- =====================================================
-- 10. UTILITY FUNCTIONS
-- =====================================================

-- Function to get total stock across all warehouses
-- Only create if warehouse_inventory table exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'warehouse_inventory'
  ) THEN
    EXECUTE format('
    CREATE OR REPLACE FUNCTION get_total_warehouse_stock(
      p_inventory_item_id UUID
    )
    RETURNS INTEGER AS $func$
    DECLARE
      v_total INTEGER;
    BEGIN
      SELECT COALESCE(SUM(quantity_available), 0) INTO v_total
      FROM public.warehouse_inventory
      WHERE inventory_item_id = p_inventory_item_id;
      
      RETURN v_total;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;
    ');
  END IF;
END $$;

-- Function to check if promotion is valid
CREATE OR REPLACE FUNCTION is_promotion_valid(
  p_promotion_id UUID,
  p_customer_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_promotion RECORD;
  v_usage_count INTEGER;
BEGIN
  SELECT * INTO v_promotion
  FROM public.product_promotions
  WHERE id = p_promotion_id;
  
  -- Check if promotion exists and is active
  IF NOT FOUND OR NOT v_promotion.is_active THEN
    RETURN FALSE;
  END IF;
  
  -- Check dates
  IF v_promotion.starts_at > NOW() OR (v_promotion.ends_at IS NOT NULL AND v_promotion.ends_at < NOW()) THEN
    RETURN FALSE;
  END IF;
  
  -- Check max uses
  IF v_promotion.max_uses IS NOT NULL AND v_promotion.current_uses >= v_promotion.max_uses THEN
    RETURN FALSE;
  END IF;
  
  -- Check per customer limit
  IF p_customer_id IS NOT NULL AND v_promotion.max_uses_per_customer IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM public.promotion_usage
    WHERE promotion_id = p_promotion_id
      AND customer_id = p_customer_id;
    
    IF v_usage_count >= v_promotion.max_uses_per_customer THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VÉRIFICATION
-- =====================================================

SELECT
  'warehouses' as table_name,
  COUNT(*) as row_count
FROM public.warehouses
UNION ALL
SELECT
  'warehouse_inventory' as table_name,
  COUNT(*) as row_count
FROM public.warehouse_inventory
UNION ALL
SELECT
  'stock_alerts' as table_name,
  COUNT(*) as row_count
FROM public.stock_alerts
UNION ALL
SELECT
  'product_promotions' as table_name,
  COUNT(*) as row_count
FROM public.product_promotions
UNION ALL
SELECT
  'promotion_usage' as table_name,
  COUNT(*) as row_count
FROM public.promotion_usage
UNION ALL
SELECT
  'variant_attributes' as table_name,
  COUNT(*) as row_count
FROM public.variant_attributes;

