-- =====================================================
-- EMARZONA PHYSICAL PRODUCTS - LOT & EXPIRATION MANAGEMENT
-- Date: 28 Janvier 2025
-- Description: Système de gestion des lots et dates d'expiration avec FIFO/LIFO
-- =====================================================

-- =====================================================
-- 1. TABLE: product_lots (Lots de produits)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  physical_product_id UUID NOT NULL REFERENCES public.physical_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  
  -- === LOT INFO ===
  lot_number TEXT NOT NULL, -- Numéro de lot unique (ex: LOT-2025-001)
  batch_number TEXT, -- Numéro de batch (peut être différent du lot)
  serial_number TEXT, -- Numéro de série (pour produits individuels)
  
  -- === DATES ===
  manufacturing_date DATE,
  expiration_date DATE,
  best_before_date DATE,
  received_date DATE DEFAULT CURRENT_DATE,
  
  -- === QUANTITY ===
  initial_quantity INTEGER NOT NULL DEFAULT 0,
  current_quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  
  -- === COST ===
  unit_cost NUMERIC,
  total_cost NUMERIC GENERATED ALWAYS AS (initial_quantity * COALESCE(unit_cost, 0)) STORED,
  
  -- === STATUS ===
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'expiring_soon', 'depleted', 'damaged', 'quarantined')),
  rotation_method TEXT DEFAULT 'FIFO' CHECK (rotation_method IN ('FIFO', 'LIFO', 'FEFO', 'manual')),
  -- FIFO: First In First Out
  -- LIFO: Last In First Out
  -- FEFO: First Expired First Out
  -- manual: Sélection manuelle
  
  -- === QUALITY ===
  quality_status TEXT DEFAULT 'good' CHECK (quality_status IN ('good', 'acceptable', 'poor', 'rejected')),
  inspection_date DATE,
  inspection_notes TEXT,
  inspector_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- === LOCATION ===
  bin_location TEXT,
  shelf_location TEXT,
  
  -- === METADATA ===
  supplier_batch_number TEXT,
  certificate_of_analysis TEXT, -- URL ou référence
  notes TEXT,
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: lot number per product/variant/warehouse
  UNIQUE(physical_product_id, variant_id, warehouse_id, lot_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_lots_product_id ON public.product_lots(physical_product_id);
CREATE INDEX IF NOT EXISTS idx_product_lots_variant_id ON public.product_lots(variant_id);
CREATE INDEX IF NOT EXISTS idx_product_lots_warehouse_id ON public.product_lots(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_product_lots_lot_number ON public.product_lots(lot_number);
CREATE INDEX IF NOT EXISTS idx_product_lots_expiration_date ON public.product_lots(expiration_date);
CREATE INDEX IF NOT EXISTS idx_product_lots_status ON public.product_lots(status);
CREATE INDEX IF NOT EXISTS idx_product_lots_rotation_method ON public.product_lots(rotation_method);

-- =====================================================
-- 2. TABLE: lot_movements (Mouvements de lots)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.lot_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES public.product_lots(id) ON DELETE CASCADE,
  
  -- === MOVEMENT INFO ===
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'received',      -- Réception du lot
    'sold',          -- Vente
    'transferred',   -- Transfert entre entrepôts
    'adjusted',      -- Ajustement manuel
    'expired',       -- Expiration
    'damaged',       -- Dommage
    'returned',      -- Retour client
    'destroyed'      -- Destruction
  )),
  
  quantity INTEGER NOT NULL, -- Positive pour augmentation, négative pour diminution
  
  -- === REFERENCES ===
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  transfer_id UUID, -- Pour les transferts entre entrepôts
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- === DETAILS ===
  reason TEXT,
  notes TEXT,
  
  -- === TIMESTAMPS ===
  movement_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lot_movements_lot_id ON public.lot_movements(lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_movements_type ON public.lot_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_lot_movements_date ON public.lot_movements(movement_date DESC);
CREATE INDEX IF NOT EXISTS idx_lot_movements_order_id ON public.lot_movements(order_id);

-- =====================================================
-- 3. TABLE: expiration_alerts (Alertes d'expiration)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.expiration_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES public.product_lots(id) ON DELETE CASCADE,
  
  -- === ALERT INFO ===
  alert_type TEXT NOT NULL CHECK (alert_type IN ('expiring_soon', 'expired', 'expiring_today')),
  days_until_expiration INTEGER,
  
  -- === STATUS ===
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_action TEXT CHECK (resolution_action IN ('sold', 'discounted', 'returned', 'destroyed', 'transferred', 'other')),
  resolution_notes TEXT,
  
  -- === NOTIFICATION ===
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expiration_alerts_lot_id ON public.expiration_alerts(lot_id);
CREATE INDEX IF NOT EXISTS idx_expiration_alerts_type ON public.expiration_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_expiration_alerts_resolved ON public.expiration_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_expiration_alerts_created ON public.expiration_alerts(created_at DESC);

-- =====================================================
-- 4. TABLE: lot_transfers (Transferts de lots entre entrepôts)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.lot_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES public.product_lots(id) ON DELETE CASCADE,
  
  -- === TRANSFER INFO ===
  from_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  to_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  
  -- === STATUS ===
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'received', 'cancelled', 'failed')),
  
  -- === DATES ===
  transfer_date TIMESTAMPTZ,
  expected_arrival_date TIMESTAMPTZ,
  actual_arrival_date TIMESTAMPTZ,
  
  -- === REFERENCES ===
  initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  received_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- === DETAILS ===
  tracking_number TEXT,
  notes TEXT,
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lot_transfers_lot_id ON public.lot_transfers(lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_transfers_from_warehouse ON public.lot_transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_lot_transfers_to_warehouse ON public.lot_transfers(to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_lot_transfers_status ON public.lot_transfers(status);

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- Update updated_at for new tables
DROP TRIGGER IF EXISTS update_product_lots_updated_at ON public.product_lots;
CREATE TRIGGER update_product_lots_updated_at
  BEFORE UPDATE ON public.product_lots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expiration_alerts_updated_at ON public.expiration_alerts;
CREATE TRIGGER update_expiration_alerts_updated_at
  BEFORE UPDATE ON public.expiration_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lot_transfers_updated_at ON public.lot_transfers;
CREATE TRIGGER update_lot_transfers_updated_at
  BEFORE UPDATE ON public.lot_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update lot quantity when movement is created
CREATE OR REPLACE FUNCTION update_lot_quantity_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.movement_type IN ('received', 'returned') THEN
    -- Increase quantity
    UPDATE public.product_lots
    SET current_quantity = current_quantity + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.lot_id;
  ELSIF NEW.movement_type IN ('sold', 'transferred', 'adjusted', 'expired', 'damaged', 'destroyed') THEN
    -- Decrease quantity (quantity is negative)
    UPDATE public.product_lots
    SET current_quantity = current_quantity + NEW.quantity, -- NEW.quantity is already negative
        updated_at = NOW()
    WHERE id = NEW.lot_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_lot_quantity ON public.lot_movements;
CREATE TRIGGER trigger_update_lot_quantity
  AFTER INSERT ON public.lot_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_lot_quantity_on_movement();

-- Trigger to update lot status based on expiration date
CREATE OR REPLACE FUNCTION update_lot_status_on_expiration()
RETURNS TRIGGER AS $$
DECLARE
  v_days_until_expiration INTEGER;
BEGIN
  IF NEW.expiration_date IS NOT NULL THEN
    v_days_until_expiration := NEW.expiration_date - CURRENT_DATE;
    
    -- Update status based on expiration
    IF v_days_until_expiration < 0 THEN
      NEW.status := 'expired';
    ELSIF v_days_until_expiration <= 7 THEN
      NEW.status := 'expiring_soon';
    ELSE
      NEW.status := 'active';
    END IF;
    
    -- Create or update expiration alert
    IF v_days_until_expiration <= 30 AND v_days_until_expiration >= 0 THEN
      INSERT INTO public.expiration_alerts (
        lot_id,
        alert_type,
        days_until_expiration
      ) VALUES (
        NEW.id,
        CASE 
          WHEN v_days_until_expiration = 0 THEN 'expiring_today'
          WHEN v_days_until_expiration <= 7 THEN 'expiring_soon'
          ELSE 'expiring_soon'
        END,
        v_days_until_expiration
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_lot_status ON public.product_lots;
CREATE TRIGGER trigger_update_lot_status
  BEFORE INSERT OR UPDATE OF expiration_date ON public.product_lots
  FOR EACH ROW
  EXECUTE FUNCTION update_lot_status_on_expiration();

-- =====================================================
-- 6. FUNCTIONS FOR LOT MANAGEMENT
-- =====================================================

-- Function to get next lot for sale based on rotation method
CREATE OR REPLACE FUNCTION get_next_lot_for_sale(
  p_physical_product_id UUID,
  p_quantity INTEGER,
  p_variant_id UUID DEFAULT NULL,
  p_warehouse_id UUID DEFAULT NULL,
  p_rotation_method TEXT DEFAULT 'FIFO'
)
RETURNS TABLE (
  lot_id UUID,
  lot_number TEXT,
  available_quantity INTEGER,
  expiration_date DATE,
  days_until_expiration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pl.id,
    pl.lot_number,
    pl.current_quantity - pl.reserved_quantity as available_quantity,
    pl.expiration_date,
    CASE 
      WHEN pl.expiration_date IS NOT NULL THEN pl.expiration_date - CURRENT_DATE
      ELSE NULL
    END as days_until_expiration
  FROM public.product_lots pl
  WHERE pl.physical_product_id = p_physical_product_id
    AND (p_variant_id IS NULL OR pl.variant_id = p_variant_id)
    AND (p_warehouse_id IS NULL OR pl.warehouse_id = p_warehouse_id)
    AND pl.status = 'active'
    AND (pl.current_quantity - pl.reserved_quantity) > 0
  ORDER BY
    CASE 
      WHEN p_rotation_method = 'FIFO' THEN EXTRACT(EPOCH FROM pl.received_date)
      WHEN p_rotation_method = 'LIFO' THEN -EXTRACT(EPOCH FROM pl.received_date)
      WHEN p_rotation_method = 'FEFO' AND pl.expiration_date IS NOT NULL THEN EXTRACT(EPOCH FROM pl.expiration_date)
      WHEN p_rotation_method = 'FEFO' THEN EXTRACT(EPOCH FROM pl.received_date)
      ELSE EXTRACT(EPOCH FROM pl.created_at)
    END ASC,
    CASE 
      WHEN p_rotation_method = 'FIFO' THEN EXTRACT(EPOCH FROM pl.created_at)
      WHEN p_rotation_method = 'LIFO' THEN -EXTRACT(EPOCH FROM pl.created_at)
      ELSE EXTRACT(EPOCH FROM pl.created_at)
    END ASC
  LIMIT 10; -- Return up to 10 lots to choose from
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to allocate lot for order
CREATE OR REPLACE FUNCTION allocate_lot_for_order(
  p_order_item_id UUID,
  p_quantity INTEGER,
  p_rotation_method TEXT DEFAULT 'FIFO'
)
RETURNS UUID AS $$
DECLARE
  v_lot_id UUID;
  v_physical_product_id UUID;
  v_variant_id UUID;
  v_warehouse_id UUID;
  v_remaining_quantity INTEGER;
  v_lot_quantity INTEGER;
  v_allocated_quantity INTEGER;
BEGIN
  -- Get order item details
  SELECT 
    oi.physical_product_id,
    oi.variant_id,
    o.warehouse_id
  INTO v_physical_product_id, v_variant_id, v_warehouse_id
  FROM public.order_items oi
  INNER JOIN public.orders o ON oi.order_id = o.id
  WHERE oi.id = p_order_item_id;
  
  IF v_physical_product_id IS NULL THEN
    RAISE EXCEPTION 'Order item not found or not a physical product';
  END IF;
  
  v_remaining_quantity := p_quantity;
  
  -- Allocate from lots based on rotation method
  FOR v_lot_id, v_lot_quantity IN
    SELECT 
      lot_id,
      available_quantity
    FROM get_next_lot_for_sale(
      v_physical_product_id,
      v_variant_id,
      v_warehouse_id,
      v_remaining_quantity,
      p_rotation_method
    )
    WHERE available_quantity > 0
  LOOP
    v_allocated_quantity := LEAST(v_lot_quantity, v_remaining_quantity);
    
    -- Reserve quantity in lot
    UPDATE public.product_lots
    SET reserved_quantity = reserved_quantity + v_allocated_quantity
    WHERE id = v_lot_id;
    
    -- Create lot movement
    INSERT INTO public.lot_movements (
      lot_id,
      movement_type,
      quantity,
      order_item_id,
      reason
    ) VALUES (
      v_lot_id,
      'sold',
      -v_allocated_quantity,
      p_order_item_id,
      'Order allocation'
    );
    
    v_remaining_quantity := v_remaining_quantity - v_allocated_quantity;
    
    IF v_remaining_quantity <= 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  IF v_remaining_quantity > 0 THEN
    RAISE EXCEPTION 'Insufficient stock in lots. Remaining: %', v_remaining_quantity;
  END IF;
  
  RETURN v_lot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.product_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lot_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expiration_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lot_transfers ENABLE ROW LEVEL SECURITY;

-- Policies: product_lots
DROP POLICY IF EXISTS "Store owners view product lots" ON public.product_lots;
CREATE POLICY "Store owners view product lots"
  ON public.product_lots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.physical_products pp
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pp.id = product_lots.physical_product_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners manage product lots" ON public.product_lots;
CREATE POLICY "Store owners manage product lots"
  ON public.product_lots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.physical_products pp
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pp.id = product_lots.physical_product_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: lot_movements
DROP POLICY IF EXISTS "Store owners view lot movements" ON public.lot_movements;
CREATE POLICY "Store owners view lot movements"
  ON public.lot_movements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_lots pl
      INNER JOIN public.physical_products pp ON pl.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pl.id = lot_movements.lot_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: expiration_alerts
DROP POLICY IF EXISTS "Store owners view expiration alerts" ON public.expiration_alerts;
CREATE POLICY "Store owners view expiration alerts"
  ON public.expiration_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_lots pl
      INNER JOIN public.physical_products pp ON pl.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pl.id = expiration_alerts.lot_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners manage expiration alerts" ON public.expiration_alerts;
CREATE POLICY "Store owners manage expiration alerts"
  ON public.expiration_alerts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.product_lots pl
      INNER JOIN public.physical_products pp ON pl.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pl.id = expiration_alerts.lot_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: lot_transfers
DROP POLICY IF EXISTS "Store owners view lot transfers" ON public.lot_transfers;
CREATE POLICY "Store owners view lot transfers"
  ON public.lot_transfers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_lots pl
      INNER JOIN public.physical_products pp ON pl.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pl.id = lot_transfers.lot_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners manage lot transfers" ON public.lot_transfers;
CREATE POLICY "Store owners manage lot transfers"
  ON public.lot_transfers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.product_lots pl
      INNER JOIN public.physical_products pp ON pl.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pl.id = lot_transfers.lot_id
        AND s.user_id = auth.uid()
    )
  );

-- =====================================================
-- VÉRIFICATION
-- =====================================================
-- Décommentez pour vérifier les tables créées
/*
SELECT
  'product_lots' as table_name,
  COUNT(*) as row_count
FROM public.product_lots
UNION ALL
SELECT
  'lot_movements' as table_name,
  COUNT(*) as row_count
FROM public.lot_movements
UNION ALL
SELECT
  'expiration_alerts' as table_name,
  COUNT(*) as row_count
FROM public.expiration_alerts
UNION ALL
SELECT
  'lot_transfers' as table_name,
  COUNT(*) as row_count
FROM public.lot_transfers;
*/

