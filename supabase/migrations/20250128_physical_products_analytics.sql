-- =====================================================
-- EMARZONA PHYSICAL PRODUCTS - ADVANCED ANALYTICS
-- Date: 28 Janvier 2025
-- Description: Système d'analytics et rapports avancés pour produits physiques
-- =====================================================

-- =====================================================
-- 1. TABLE: physical_product_analytics (Métriques agrégées)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.physical_product_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  physical_product_id UUID NOT NULL REFERENCES public.physical_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  
  -- === PERIOD ===
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')) DEFAULT 'daily',
  
  -- === SALES METRICS ===
  units_sold INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  average_order_value NUMERIC DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0, -- Percentage
  
  -- === INVENTORY METRICS ===
  average_stock_level INTEGER DEFAULT 0,
  stock_turnover_rate NUMERIC DEFAULT 0, -- How many times stock was sold and replaced
  days_of_inventory NUMERIC DEFAULT 0, -- Days of stock remaining at current sales rate
  
  -- === COST METRICS ===
  cost_of_goods_sold NUMERIC DEFAULT 0,
  gross_profit NUMERIC DEFAULT 0,
  gross_profit_margin NUMERIC DEFAULT 0, -- Percentage
  shipping_costs NUMERIC DEFAULT 0,
  total_costs NUMERIC DEFAULT 0,
  net_profit NUMERIC DEFAULT 0,
  net_profit_margin NUMERIC DEFAULT 0, -- Percentage
  
  -- === PERFORMANCE METRICS ===
  return_rate NUMERIC DEFAULT 0, -- Percentage of orders returned
  refund_rate NUMERIC DEFAULT 0, -- Percentage of orders refunded
  average_rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- === TIMESTAMPS ===
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one record per product/variant/warehouse/period
  UNIQUE(physical_product_id, variant_id, warehouse_id, period_start, period_end, period_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_physical_product_analytics_product_id ON public.physical_product_analytics(physical_product_id);
CREATE INDEX IF NOT EXISTS idx_physical_product_analytics_variant_id ON public.physical_product_analytics(variant_id);
CREATE INDEX IF NOT EXISTS idx_physical_product_analytics_warehouse_id ON public.physical_product_analytics(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_physical_product_analytics_period ON public.physical_product_analytics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_physical_product_analytics_type ON public.physical_product_analytics(period_type);

-- =====================================================
-- 2. TABLE: sales_forecasts (Prévisions de vente)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sales_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  physical_product_id UUID NOT NULL REFERENCES public.physical_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  
  -- === FORECAST INFO ===
  forecast_date DATE NOT NULL,
  forecast_type TEXT NOT NULL CHECK (forecast_type IN ('short_term', 'medium_term', 'long_term')) DEFAULT 'short_term',
  forecast_method TEXT NOT NULL CHECK (forecast_method IN ('moving_average', 'exponential_smoothing', 'linear_regression', 'seasonal', 'manual')) DEFAULT 'moving_average',
  
  -- === FORECAST VALUES ===
  predicted_units INTEGER NOT NULL,
  confidence_level NUMERIC DEFAULT 0, -- Percentage (0-100)
  lower_bound INTEGER, -- Minimum expected
  upper_bound INTEGER, -- Maximum expected
  
  -- === ACTUAL VALUES (for accuracy tracking) ===
  actual_units INTEGER,
  accuracy_percentage NUMERIC, -- Calculated after actual sales
  
  -- === METADATA ===
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one forecast per product/variant/warehouse/date/type
  UNIQUE(physical_product_id, variant_id, warehouse_id, forecast_date, forecast_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sales_forecasts_product_id ON public.sales_forecasts(physical_product_id);
CREATE INDEX IF NOT EXISTS idx_sales_forecasts_variant_id ON public.sales_forecasts(variant_id);
CREATE INDEX IF NOT EXISTS idx_sales_forecasts_warehouse_id ON public.sales_forecasts(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_sales_forecasts_date ON public.sales_forecasts(forecast_date);
CREATE INDEX IF NOT EXISTS idx_sales_forecasts_type ON public.sales_forecasts(forecast_type);

-- =====================================================
-- 3. TABLE: warehouse_performance (Performance par entrepôt)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.warehouse_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  
  -- === PERIOD ===
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')) DEFAULT 'daily',
  
  -- === OPERATIONAL METRICS ===
  total_orders_fulfilled INTEGER DEFAULT 0,
  total_units_shipped INTEGER DEFAULT 0,
  average_fulfillment_time_hours NUMERIC DEFAULT 0,
  on_time_delivery_rate NUMERIC DEFAULT 0, -- Percentage
  
  -- === INVENTORY METRICS ===
  total_inventory_value NUMERIC DEFAULT 0,
  average_stock_level INTEGER DEFAULT 0,
  stock_accuracy_rate NUMERIC DEFAULT 0, -- Percentage (physical count vs system)
  shrinkage_rate NUMERIC DEFAULT 0, -- Percentage of lost/damaged inventory
  
  -- === COST METRICS ===
  operational_costs NUMERIC DEFAULT 0,
  shipping_costs NUMERIC DEFAULT 0,
  storage_costs NUMERIC DEFAULT 0,
  labor_costs NUMERIC DEFAULT 0,
  total_costs NUMERIC DEFAULT 0,
  
  -- === REVENUE METRICS ===
  total_revenue NUMERIC DEFAULT 0,
  net_profit NUMERIC DEFAULT 0,
  profit_margin NUMERIC DEFAULT 0, -- Percentage
  
  -- === EFFICIENCY METRICS ===
  orders_per_hour NUMERIC DEFAULT 0,
  units_per_hour NUMERIC DEFAULT 0,
  cost_per_order NUMERIC DEFAULT 0,
  cost_per_unit NUMERIC DEFAULT 0,
  
  -- === TIMESTAMPS ===
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one record per warehouse/period
  UNIQUE(warehouse_id, period_start, period_end, period_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_warehouse_performance_warehouse_id ON public.warehouse_performance(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_performance_period ON public.warehouse_performance(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_warehouse_performance_type ON public.warehouse_performance(period_type);

-- =====================================================
-- 4. TABLE: geographic_sales_performance (Performance par zone géographique)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.geographic_sales_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- === GEOGRAPHIC INFO ===
  country TEXT NOT NULL,
  region TEXT, -- State/province
  city TEXT,
  postal_code TEXT,
  
  -- === PERIOD ===
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')) DEFAULT 'daily',
  
  -- === SALES METRICS ===
  total_orders INTEGER DEFAULT 0,
  total_units_sold INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  average_order_value NUMERIC DEFAULT 0,
  
  -- === CUSTOMER METRICS ===
  unique_customers INTEGER DEFAULT 0,
  repeat_customer_rate NUMERIC DEFAULT 0, -- Percentage
  customer_acquisition_cost NUMERIC DEFAULT 0,
  customer_lifetime_value NUMERIC DEFAULT 0,
  
  -- === PRODUCT METRICS ===
  top_selling_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  top_selling_variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  
  -- === TIMESTAMPS ===
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_geographic_sales_store_id ON public.geographic_sales_performance(store_id);
CREATE INDEX IF NOT EXISTS idx_geographic_sales_country ON public.geographic_sales_performance(country);
CREATE INDEX IF NOT EXISTS idx_geographic_sales_region ON public.geographic_sales_performance(region);
CREATE INDEX IF NOT EXISTS idx_geographic_sales_period ON public.geographic_sales_performance(period_start, period_end);

-- =====================================================
-- 5. TABLE: stock_rotation_reports (Rapports de rotation des stocks)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.stock_rotation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  physical_product_id UUID NOT NULL REFERENCES public.physical_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  
  -- === PERIOD ===
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- === ROTATION METRICS ===
  beginning_inventory INTEGER DEFAULT 0,
  ending_inventory INTEGER DEFAULT 0,
  average_inventory INTEGER DEFAULT 0, -- (beginning + ending) / 2
  units_sold INTEGER DEFAULT 0,
  cost_of_goods_sold NUMERIC DEFAULT 0,
  
  -- === CALCULATED METRICS ===
  inventory_turnover_ratio NUMERIC DEFAULT 0, -- COGS / Average Inventory
  days_sales_of_inventory NUMERIC DEFAULT 0, -- 365 / Turnover Ratio
  stock_velocity TEXT, -- 'fast', 'medium', 'slow', 'stagnant'
  
  -- === COMPARISON ===
  previous_period_turnover NUMERIC DEFAULT 0,
  turnover_change_percentage NUMERIC DEFAULT 0,
  
  -- === TIMESTAMPS ===
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one report per product/variant/warehouse/period
  UNIQUE(physical_product_id, variant_id, warehouse_id, period_start, period_end)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_rotation_product_id ON public.stock_rotation_reports(physical_product_id);
CREATE INDEX IF NOT EXISTS idx_stock_rotation_variant_id ON public.stock_rotation_reports(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_rotation_warehouse_id ON public.stock_rotation_reports(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_rotation_period ON public.stock_rotation_reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_stock_rotation_velocity ON public.stock_rotation_reports(stock_velocity);

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Update updated_at for new tables
DROP TRIGGER IF EXISTS update_physical_product_analytics_updated_at ON public.physical_product_analytics;
CREATE TRIGGER update_physical_product_analytics_updated_at
  BEFORE UPDATE ON public.physical_product_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_forecasts_updated_at ON public.sales_forecasts;
CREATE TRIGGER update_sales_forecasts_updated_at
  BEFORE UPDATE ON public.sales_forecasts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_warehouse_performance_updated_at ON public.warehouse_performance;
CREATE TRIGGER update_warehouse_performance_updated_at
  BEFORE UPDATE ON public.warehouse_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_geographic_sales_performance_updated_at ON public.geographic_sales_performance;
CREATE TRIGGER update_geographic_sales_performance_updated_at
  BEFORE UPDATE ON public.geographic_sales_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stock_rotation_reports_updated_at ON public.stock_rotation_reports;
CREATE TRIGGER update_stock_rotation_reports_updated_at
  BEFORE UPDATE ON public.stock_rotation_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. FUNCTIONS FOR ANALYTICS CALCULATION
-- =====================================================

-- Function to calculate product analytics for a period
CREATE OR REPLACE FUNCTION calculate_product_analytics(
  p_physical_product_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_variant_id UUID DEFAULT NULL,
  p_warehouse_id UUID DEFAULT NULL,
  p_period_type TEXT DEFAULT 'daily'
)
RETURNS UUID AS $$
DECLARE
  v_analytics_id UUID;
  v_units_sold INTEGER;
  v_revenue NUMERIC;
  v_cogs NUMERIC;
  v_orders_count INTEGER;
  v_returns_count INTEGER;
  v_refunds_count INTEGER;
BEGIN
  -- Calculate sales metrics
  SELECT 
    COALESCE(SUM(oi.quantity), 0),
    COALESCE(SUM(oi.price * oi.quantity), 0),
    COUNT(DISTINCT o.id),
    COALESCE(SUM(CASE WHEN oi.quantity * oi.unit_cost IS NOT NULL THEN oi.quantity * oi.unit_cost ELSE 0 END), 0)
  INTO v_units_sold, v_revenue, v_orders_count, v_cogs
  FROM public.order_items oi
  INNER JOIN public.orders o ON oi.order_id = o.id
  WHERE oi.physical_product_id = p_physical_product_id
    AND (p_variant_id IS NULL OR oi.variant_id = p_variant_id)
    AND o.created_at::DATE BETWEEN p_period_start AND p_period_end
    AND o.status IN ('completed', 'shipped', 'delivered');
  
  -- Calculate returns and refunds
  SELECT 
    COUNT(*) FILTER (WHERE pr.status IN ('approved', 'received', 'processing', 'refunded')),
    COUNT(*) FILTER (WHERE pr.status = 'refunded')
  INTO v_returns_count, v_refunds_count
  FROM public.product_returns pr
  INNER JOIN public.orders o ON pr.order_id = o.id
  INNER JOIN public.order_items oi ON pr.order_item_id = oi.id
  WHERE oi.physical_product_id = p_physical_product_id
    AND (p_variant_id IS NULL OR oi.variant_id = p_variant_id)
    AND o.created_at::DATE BETWEEN p_period_start AND p_period_end;
  
  -- Insert or update analytics record
  INSERT INTO public.physical_product_analytics (
    physical_product_id,
    variant_id,
    warehouse_id,
    period_start,
    period_end,
    period_type,
    units_sold,
    revenue,
    average_order_value,
    cost_of_goods_sold,
    gross_profit,
    gross_profit_margin,
    return_rate,
    refund_rate
  ) VALUES (
    p_physical_product_id,
    p_variant_id,
    p_warehouse_id,
    p_period_start,
    p_period_end,
    p_period_type,
    v_units_sold,
    v_revenue,
    CASE WHEN v_orders_count > 0 THEN v_revenue / v_orders_count ELSE 0 END,
    v_cogs,
    v_revenue - v_cogs,
    CASE WHEN v_revenue > 0 THEN ((v_revenue - v_cogs) / v_revenue) * 100 ELSE 0 END,
    CASE WHEN v_orders_count > 0 THEN (v_returns_count::NUMERIC / v_orders_count) * 100 ELSE 0 END,
    CASE WHEN v_orders_count > 0 THEN (v_refunds_count::NUMERIC / v_orders_count) * 100 ELSE 0 END
  )
  ON CONFLICT (physical_product_id, variant_id, warehouse_id, period_start, period_end, period_type)
  DO UPDATE SET
    units_sold = EXCLUDED.units_sold,
    revenue = EXCLUDED.revenue,
    average_order_value = EXCLUDED.average_order_value,
    cost_of_goods_sold = EXCLUDED.cost_of_goods_sold,
    gross_profit = EXCLUDED.gross_profit,
    gross_profit_margin = EXCLUDED.gross_profit_margin,
    return_rate = EXCLUDED.return_rate,
    refund_rate = EXCLUDED.refund_rate,
    calculated_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_analytics_id;
  
  RETURN v_analytics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate stock rotation
CREATE OR REPLACE FUNCTION calculate_stock_rotation(
  p_physical_product_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_variant_id UUID DEFAULT NULL,
  p_warehouse_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_report_id UUID;
  v_beginning_inventory INTEGER;
  v_ending_inventory INTEGER;
  v_average_inventory INTEGER;
  v_units_sold INTEGER;
  v_cogs NUMERIC;
  v_turnover_ratio NUMERIC;
  v_days_sales NUMERIC;
  v_velocity TEXT;
BEGIN
  -- Get beginning inventory (from warehouse_inventory or inventory_items)
  SELECT COALESCE(SUM(quantity_available), 0) INTO v_beginning_inventory
  FROM public.warehouse_inventory wi
  INNER JOIN public.inventory_items ii ON wi.inventory_item_id = ii.id
  WHERE ii.physical_product_id = p_physical_product_id
    AND (p_variant_id IS NULL OR ii.variant_id = p_variant_id)
    AND (p_warehouse_id IS NULL OR wi.warehouse_id = p_warehouse_id)
    AND wi.created_at::DATE <= p_period_start;
  
  -- Get ending inventory
  SELECT COALESCE(SUM(quantity_available), 0) INTO v_ending_inventory
  FROM public.warehouse_inventory wi
  INNER JOIN public.inventory_items ii ON wi.inventory_item_id = ii.id
  WHERE ii.physical_product_id = p_physical_product_id
    AND (p_variant_id IS NULL OR ii.variant_id = p_variant_id)
    AND (p_warehouse_id IS NULL OR wi.warehouse_id = p_warehouse_id)
    AND wi.updated_at::DATE <= p_period_end;
  
  -- Calculate average inventory
  v_average_inventory := (v_beginning_inventory + v_ending_inventory) / 2;
  
  -- Get units sold and COGS
  SELECT 
    COALESCE(SUM(oi.quantity), 0),
    COALESCE(SUM(oi.quantity * COALESCE(oi.unit_cost, 0)), 0)
  INTO v_units_sold, v_cogs
  FROM public.order_items oi
  INNER JOIN public.orders o ON oi.order_id = o.id
  WHERE oi.physical_product_id = p_physical_product_id
    AND (p_variant_id IS NULL OR oi.variant_id = p_variant_id)
    AND o.created_at::DATE BETWEEN p_period_start AND p_period_end
    AND o.status IN ('completed', 'shipped', 'delivered');
  
  -- Calculate turnover ratio
  IF v_average_inventory > 0 THEN
    v_turnover_ratio := v_cogs / v_average_inventory;
    v_days_sales := 365 / NULLIF(v_turnover_ratio, 0);
  ELSE
    v_turnover_ratio := 0;
    v_days_sales := 0;
  END IF;
  
  -- Determine velocity
  IF v_turnover_ratio >= 6 THEN
    v_velocity := 'fast';
  ELSIF v_turnover_ratio >= 3 THEN
    v_velocity := 'medium';
  ELSIF v_turnover_ratio >= 1 THEN
    v_velocity := 'slow';
  ELSE
    v_velocity := 'stagnant';
  END IF;
  
  -- Insert or update rotation report
  INSERT INTO public.stock_rotation_reports (
    physical_product_id,
    variant_id,
    warehouse_id,
    period_start,
    period_end,
    beginning_inventory,
    ending_inventory,
    average_inventory,
    units_sold,
    cost_of_goods_sold,
    inventory_turnover_ratio,
    days_sales_of_inventory,
    stock_velocity
  ) VALUES (
    p_physical_product_id,
    p_variant_id,
    p_warehouse_id,
    p_period_start,
    p_period_end,
    v_beginning_inventory,
    v_ending_inventory,
    v_average_inventory,
    v_units_sold,
    v_cogs,
    v_turnover_ratio,
    v_days_sales,
    v_velocity
  )
  ON CONFLICT (physical_product_id, variant_id, warehouse_id, period_start, period_end)
  DO UPDATE SET
    beginning_inventory = EXCLUDED.beginning_inventory,
    ending_inventory = EXCLUDED.ending_inventory,
    average_inventory = EXCLUDED.average_inventory,
    units_sold = EXCLUDED.units_sold,
    cost_of_goods_sold = EXCLUDED.cost_of_goods_sold,
    inventory_turnover_ratio = EXCLUDED.inventory_turnover_ratio,
    days_sales_of_inventory = EXCLUDED.days_sales_of_inventory,
    stock_velocity = EXCLUDED.stock_velocity,
    calculated_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_report_id;
  
  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.physical_product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geographic_sales_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_rotation_reports ENABLE ROW LEVEL SECURITY;

-- Policies: physical_product_analytics
DROP POLICY IF EXISTS "Store owners view product analytics" ON public.physical_product_analytics;
CREATE POLICY "Store owners view product analytics"
  ON public.physical_product_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.physical_products pp
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pp.id = physical_product_analytics.physical_product_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: sales_forecasts
DROP POLICY IF EXISTS "Store owners view sales forecasts" ON public.sales_forecasts;
CREATE POLICY "Store owners view sales forecasts"
  ON public.sales_forecasts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.physical_products pp
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pp.id = sales_forecasts.physical_product_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners manage sales forecasts" ON public.sales_forecasts;
CREATE POLICY "Store owners manage sales forecasts"
  ON public.sales_forecasts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.physical_products pp
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pp.id = sales_forecasts.physical_product_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: warehouse_performance
DROP POLICY IF EXISTS "Store owners view warehouse performance" ON public.warehouse_performance;
CREATE POLICY "Store owners view warehouse performance"
  ON public.warehouse_performance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.warehouses w
      INNER JOIN public.stores s ON w.store_id = s.id
      WHERE w.id = warehouse_performance.warehouse_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: geographic_sales_performance
DROP POLICY IF EXISTS "Store owners view geographic sales" ON public.geographic_sales_performance;
CREATE POLICY "Store owners view geographic sales"
  ON public.geographic_sales_performance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = geographic_sales_performance.store_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: stock_rotation_reports
DROP POLICY IF EXISTS "Store owners view stock rotation" ON public.stock_rotation_reports;
CREATE POLICY "Store owners view stock rotation"
  ON public.stock_rotation_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.physical_products pp
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pp.id = stock_rotation_reports.physical_product_id
        AND s.user_id = auth.uid()
    )
  );

-- =====================================================
-- VÉRIFICATION (Commentée pour éviter les erreurs de timeout)
-- =====================================================
-- Décommentez ces requêtes pour vérifier les tables après la migration
/*
SELECT
  'physical_product_analytics' as table_name,
  COUNT(*) as row_count
FROM public.physical_product_analytics
UNION ALL
SELECT
  'sales_forecasts' as table_name,
  COUNT(*) as row_count
FROM public.sales_forecasts
UNION ALL
SELECT
  'warehouse_performance' as table_name,
  COUNT(*) as row_count
FROM public.warehouse_performance
UNION ALL
SELECT
  'geographic_sales_performance' as table_name,
  COUNT(*) as row_count
FROM public.geographic_sales_performance
UNION ALL
SELECT
  'stock_rotation_reports' as table_name,
  COUNT(*) as row_count
FROM public.stock_rotation_reports;
*/

