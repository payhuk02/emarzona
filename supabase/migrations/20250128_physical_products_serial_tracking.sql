-- =====================================================
-- EMARZONA PHYSICAL PRODUCTS - SERIAL NUMBERS & TRACKING
-- Date: 28 Janvier 2025
-- Description: Système de numéros de série et traçabilité complète
-- =====================================================

-- =====================================================
-- 1. TABLE: serial_numbers (Numéros de série)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.serial_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  physical_product_id UUID NOT NULL REFERENCES public.physical_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  lot_id UUID REFERENCES public.product_lots(id) ON DELETE SET NULL,
  
  -- === SERIAL INFO ===
  serial_number TEXT NOT NULL UNIQUE, -- Numéro de série unique
  imei TEXT, -- Pour appareils mobiles
  mac_address TEXT, -- Pour équipements réseau
  barcode TEXT, -- Code-barres associé
  qr_code TEXT, -- QR code associé
  
  -- === STATUS ===
  status TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN (
    'manufactured',    -- Fabriqué
    'in_stock',        -- En stock
    'reserved',        -- Réservé
    'sold',            -- Vendu
    'shipped',         -- Expédié
    'delivered',       -- Livré
    'returned',        -- Retourné
    'refurbished',     -- Reconditionné
    'warranty_repair', -- En réparation garantie
    'damaged',         -- Endommagé
    'scrapped'         -- Mis au rebut
  )),
  
  -- === LOCATION ===
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  bin_location TEXT,
  current_location TEXT, -- Emplacement actuel (peut être différent du warehouse)
  
  -- === OWNERSHIP ===
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  
  -- === MANUFACTURING ===
  manufacturing_date DATE,
  manufacturing_location TEXT,
  batch_number TEXT,
  
  -- === WARRANTY ===
  warranty_start_date DATE,
  warranty_end_date DATE,
  warranty_duration_months INTEGER,
  warranty_type TEXT, -- 'manufacturer', 'extended', 'store'
  
  -- === METADATA ===
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: serial number must be unique globally
  CONSTRAINT unique_serial_number UNIQUE (serial_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_serial_numbers_product_id ON public.serial_numbers(physical_product_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_variant_id ON public.serial_numbers(variant_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_lot_id ON public.serial_numbers(lot_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_serial_number ON public.serial_numbers(serial_number);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_status ON public.serial_numbers(status);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_order_id ON public.serial_numbers(order_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_customer_id ON public.serial_numbers(customer_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_warehouse_id ON public.serial_numbers(warehouse_id);

-- =====================================================
-- 2. TABLE: serial_number_history (Historique de traçabilité)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.serial_number_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number_id UUID NOT NULL REFERENCES public.serial_numbers(id) ON DELETE CASCADE,
  
  -- === EVENT INFO ===
  event_type TEXT NOT NULL CHECK (event_type IN (
    'manufactured',      -- Fabrication
    'received',          -- Réception en stock
    'reserved',          -- Réservation
    'sold',              -- Vente
    'shipped',           -- Expédition
    'delivered',         -- Livraison
    'returned',          -- Retour
    'refurbished',       -- Reconditionnement
    'warranty_claim',    -- Réclamation garantie
    'repair_started',    -- Début réparation
    'repair_completed',  -- Fin réparation
    'transferred',       -- Transfert entre entrepôts
    'damaged',           -- Dommage
    'scrapped',          -- Mise au rebut
    'status_changed'     -- Changement de statut
  )),
  
  -- === LOCATION CHANGES ===
  from_location TEXT,
  to_location TEXT,
  from_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  to_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  
  -- === OWNERSHIP CHANGES ===
  from_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  to_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  
  -- === REFERENCES ===
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  return_id UUID REFERENCES public.product_returns(id) ON DELETE SET NULL,
  warranty_claim_id UUID, -- Référence à une table de réclamations garantie
  repair_id UUID, -- Référence à une table de réparations
  
  -- === DETAILS ===
  description TEXT,
  notes TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- === METADATA ===
  metadata JSONB DEFAULT '{}'::jsonb, -- Données supplémentaires flexibles
  
  -- === TIMESTAMPS ===
  event_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_serial_history_serial_id ON public.serial_number_history(serial_number_id);
CREATE INDEX IF NOT EXISTS idx_serial_history_event_type ON public.serial_number_history(event_type);
CREATE INDEX IF NOT EXISTS idx_serial_history_event_date ON public.serial_number_history(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_serial_history_order_id ON public.serial_number_history(order_id);

-- =====================================================
-- 3. TABLE: warranty_claims (Réclamations garantie)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.warranty_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number_id UUID NOT NULL REFERENCES public.serial_numbers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- === CLAIM INFO ===
  claim_number TEXT NOT NULL UNIQUE, -- Numéro de réclamation unique
  claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
  issue_description TEXT NOT NULL,
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- === STATUS ===
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',          -- En attente
    'under_review',     -- En cours d'examen
    'approved',         -- Approuvée
    'rejected',         -- Rejetée
    'repair_in_progress', -- Réparation en cours
    'repaired',         -- Réparée
    'replacement_sent', -- Remplacement envoyé
    'refunded',         -- Remboursée
    'resolved',         -- Résolue
    'cancelled'         -- Annulée
  )),
  
  -- === RESOLUTION ===
  resolution_type TEXT CHECK (resolution_type IN (
    'repair',           -- Réparation
    'replacement',      -- Remplacement
    'refund',           -- Remboursement
    'credit',           -- Crédit
    'denied'            -- Refusé
  )),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  
  -- === COSTS ===
  repair_cost NUMERIC DEFAULT 0,
  shipping_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_warranty_claims_serial_id ON public.warranty_claims(serial_number_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_customer_id ON public.warranty_claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_status ON public.warranty_claims(status);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_claim_number ON public.warranty_claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_claim_date ON public.warranty_claims(claim_date DESC);

-- =====================================================
-- 4. TABLE: repairs (Réparations)
-- =====================================================
-- Check if repairs table exists and add serial_number_id if missing
DO $$ 
BEGIN
  -- First, ensure serial_numbers table exists (it should be created earlier in this migration)
  -- If repairs table doesn't exist, create it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'repairs'
  ) THEN
    -- Only create if serial_numbers table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'serial_numbers'
    ) THEN
      CREATE TABLE public.repairs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        serial_number_id UUID NOT NULL REFERENCES public.serial_numbers(id) ON DELETE CASCADE,
        warranty_claim_id UUID REFERENCES public.warranty_claims(id) ON DELETE SET NULL,
        
        -- === REPAIR INFO ===
        repair_number TEXT NOT NULL UNIQUE,
        repair_type TEXT NOT NULL CHECK (repair_type IN (
          'warranty',         -- Sous garantie
          'out_of_warranty',  -- Hors garantie
          'customer_paid'     -- Payé par le client
        )),
        
        -- === STATUS ===
        status TEXT NOT NULL DEFAULT 'received' CHECK (status IN (
          'received',         -- Reçu
          'diagnosed',        -- Diagnostiqué
          'in_progress',      -- En cours
          'waiting_parts',    -- En attente de pièces
          'completed',        -- Terminée
          'returned',         -- Retourné au client
          'cancelled'         -- Annulée
        )),
        
        -- === DETAILS ===
        issue_description TEXT NOT NULL,
        diagnosis TEXT,
        repair_description TEXT,
        parts_used JSONB DEFAULT '[]'::jsonb, -- Liste des pièces utilisées
        labor_hours NUMERIC DEFAULT 0,
        
        -- === COSTS ===
        parts_cost NUMERIC DEFAULT 0,
        labor_cost NUMERIC DEFAULT 0,
        shipping_cost NUMERIC DEFAULT 0,
        total_cost NUMERIC DEFAULT 0,
        
        -- === DATES ===
        received_date DATE NOT NULL DEFAULT CURRENT_DATE,
        started_date DATE,
        completed_date DATE,
        returned_date DATE,
        
        -- === REFERENCES ===
        technician_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        repair_center_id UUID, -- Référence à un centre de réparation
        
        -- === NOTES ===
        internal_notes TEXT,
        customer_notes TEXT,
        
        -- === TIMESTAMPS ===
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    END IF;
  END IF;
  
  -- If repairs table exists, add serial_number_id column if missing
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'repairs'
  ) THEN
    -- Add serial_number_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'repairs' 
      AND column_name = 'serial_number_id'
    ) THEN
      -- First add column without NOT NULL constraint
      ALTER TABLE public.repairs
        ADD COLUMN serial_number_id UUID;
      
      -- If serial_numbers table exists, add FK constraint
      IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'serial_numbers'
      ) THEN
        -- Add foreign key constraint only if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE table_schema = 'public' 
          AND table_name = 'repairs' 
          AND constraint_name = 'repairs_serial_number_id_fkey'
        ) THEN
          ALTER TABLE public.repairs
            ADD CONSTRAINT repairs_serial_number_id_fkey 
            FOREIGN KEY (serial_number_id) 
            REFERENCES public.serial_numbers(id) 
            ON DELETE CASCADE;
        END IF;
      END IF;
    END IF;
    
    -- Create indexes if table exists
    CREATE INDEX IF NOT EXISTS idx_repairs_serial_id ON public.repairs(serial_number_id) WHERE serial_number_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_repairs_warranty_claim_id ON public.repairs(warranty_claim_id) WHERE warranty_claim_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_repairs_status ON public.repairs(status);
    CREATE INDEX IF NOT EXISTS idx_repairs_repair_number ON public.repairs(repair_number);
  END IF;
END $$;

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- Update updated_at for new tables
DROP TRIGGER IF EXISTS update_serial_numbers_updated_at ON public.serial_numbers;
CREATE TRIGGER update_serial_numbers_updated_at
  BEFORE UPDATE ON public.serial_numbers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_warranty_claims_updated_at ON public.warranty_claims;
CREATE TRIGGER update_warranty_claims_updated_at
  BEFORE UPDATE ON public.warranty_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_repairs_updated_at ON public.repairs;
CREATE TRIGGER update_repairs_updated_at
  BEFORE UPDATE ON public.repairs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create history entry when serial number status changes
CREATE OR REPLACE FUNCTION create_serial_history_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create history if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.serial_number_history (
      serial_number_id,
      event_type,
      from_location,
      to_location,
      from_warehouse_id,
      to_warehouse_id,
      from_customer_id,
      to_customer_id,
      order_id,
      order_item_id,
      description,
      performed_by
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.status = 'sold' THEN 'sold'
        WHEN NEW.status = 'shipped' THEN 'shipped'
        WHEN NEW.status = 'delivered' THEN 'delivered'
        WHEN NEW.status = 'returned' THEN 'returned'
        WHEN NEW.status = 'warranty_repair' THEN 'warranty_claim'
        WHEN NEW.status = 'damaged' THEN 'damaged'
        WHEN NEW.status = 'scrapped' THEN 'scrapped'
        ELSE 'status_changed'
      END,
      OLD.current_location,
      NEW.current_location,
      OLD.warehouse_id,
      NEW.warehouse_id,
      OLD.customer_id,
      NEW.customer_id,
      NEW.order_id,
      NEW.order_item_id,
      'Status changed from ' || COALESCE(OLD.status, 'NULL') || ' to ' || NEW.status,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_serial_history_status ON public.serial_numbers;
CREATE TRIGGER trigger_serial_history_status
  AFTER UPDATE OF status, warehouse_id, customer_id, order_id ON public.serial_numbers
  FOR EACH ROW
  EXECUTE FUNCTION create_serial_history_on_status_change();

-- Trigger to create history entry when warranty claim is created
CREATE OR REPLACE FUNCTION create_serial_history_on_warranty_claim()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.serial_number_history (
    serial_number_id,
    event_type,
    warranty_claim_id,
    description,
    notes
  ) VALUES (
    NEW.serial_number_id,
    'warranty_claim',
    NEW.id,
    'Warranty claim created: ' || NEW.claim_number,
    NEW.issue_description
  );
  
  -- Update serial number status
  UPDATE public.serial_numbers
  SET status = 'warranty_repair'
  WHERE id = NEW.serial_number_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_serial_history_warranty ON public.warranty_claims;
CREATE TRIGGER trigger_serial_history_warranty
  AFTER INSERT ON public.warranty_claims
  FOR EACH ROW
  EXECUTE FUNCTION create_serial_history_on_warranty_claim();

-- =====================================================
-- 6. FUNCTIONS FOR SERIAL TRACKING
-- =====================================================

-- Function to get complete traceability for a serial number
CREATE OR REPLACE FUNCTION get_serial_traceability(
  p_serial_number_id UUID
)
RETURNS TABLE (
  event_type TEXT,
  event_date TIMESTAMPTZ,
  description TEXT,
  location TEXT,
  customer_name TEXT,
  order_number TEXT,
  performed_by_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.event_type,
    h.event_date,
    h.description,
    COALESCE(h.to_location, h.from_location) as location,
    COALESCE(
      (SELECT name FROM public.customers WHERE id = h.to_customer_id),
      (SELECT name FROM public.customers WHERE id = h.from_customer_id)
    ) as customer_name,
    (SELECT order_number FROM public.orders WHERE id = h.order_id) as order_number,
    (SELECT email FROM auth.users WHERE id = h.performed_by) as performed_by_name
  FROM public.serial_number_history h
  WHERE h.serial_number_id = p_serial_number_id
  ORDER BY h.event_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if serial number is available for sale
CREATE OR REPLACE FUNCTION is_serial_available_for_sale(
  p_serial_number TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT status INTO v_status
  FROM public.serial_numbers
  WHERE serial_number = p_serial_number;
  
  IF v_status IS NULL THEN
    RETURN FALSE; -- Serial number doesn't exist
  END IF;
  
  RETURN v_status IN ('in_stock', 'manufactured');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.serial_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serial_number_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;

-- Policies: serial_numbers
DROP POLICY IF EXISTS "Store owners view serial numbers" ON public.serial_numbers;
CREATE POLICY "Store owners view serial numbers"
  ON public.serial_numbers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.physical_products pp
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pp.id = serial_numbers.physical_product_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners manage serial numbers" ON public.serial_numbers;
CREATE POLICY "Store owners manage serial numbers"
  ON public.serial_numbers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.physical_products pp
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pp.id = serial_numbers.physical_product_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: Customers can view their own serial numbers
DROP POLICY IF EXISTS "Customers view own serial numbers" ON public.serial_numbers;
CREATE POLICY "Customers view own serial numbers"
  ON public.serial_numbers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = serial_numbers.customer_id
        AND c.user_id = auth.uid()
    )
  );

-- Policies: serial_number_history
DROP POLICY IF EXISTS "Store owners view serial history" ON public.serial_number_history;
CREATE POLICY "Store owners view serial history"
  ON public.serial_number_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.serial_numbers sn
      INNER JOIN public.physical_products pp ON sn.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE sn.id = serial_number_history.serial_number_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: Customers can view history of their own serial numbers
DROP POLICY IF EXISTS "Customers view own serial history" ON public.serial_number_history;
CREATE POLICY "Customers view own serial history"
  ON public.serial_number_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.serial_numbers sn
      INNER JOIN public.customers c ON sn.customer_id = c.id
      WHERE sn.id = serial_number_history.serial_number_id
        AND c.user_id = auth.uid()
    )
  );

-- Policies: warranty_claims
DROP POLICY IF EXISTS "Store owners view warranty claims" ON public.warranty_claims;
CREATE POLICY "Store owners view warranty claims"
  ON public.warranty_claims
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.serial_numbers sn
      INNER JOIN public.physical_products pp ON sn.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE sn.id = warranty_claims.serial_number_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners manage warranty claims" ON public.warranty_claims;
CREATE POLICY "Store owners manage warranty claims"
  ON public.warranty_claims
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.serial_numbers sn
      INNER JOIN public.physical_products pp ON sn.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE sn.id = warranty_claims.serial_number_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: Customers can view and create their own warranty claims
DROP POLICY IF EXISTS "Customers view own warranty claims" ON public.warranty_claims;
CREATE POLICY "Customers view own warranty claims"
  ON public.warranty_claims
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = warranty_claims.customer_id
        AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Customers create own warranty claims" ON public.warranty_claims;
CREATE POLICY "Customers create own warranty claims"
  ON public.warranty_claims
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = warranty_claims.customer_id
        AND c.user_id = auth.uid()
    )
  );

-- Policies: repairs
DROP POLICY IF EXISTS "Store owners view repairs" ON public.repairs;
CREATE POLICY "Store owners view repairs"
  ON public.repairs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.serial_numbers sn
      INNER JOIN public.physical_products pp ON sn.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE sn.id = repairs.serial_number_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners manage repairs" ON public.repairs;
CREATE POLICY "Store owners manage repairs"
  ON public.repairs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.serial_numbers sn
      INNER JOIN public.physical_products pp ON sn.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE sn.id = repairs.serial_number_id
        AND s.user_id = auth.uid()
    )
  );

-- =====================================================
-- VÉRIFICATION
-- =====================================================
-- Décommentez pour vérifier les tables créées
/*
SELECT
  'serial_numbers' as table_name,
  COUNT(*) as row_count
FROM public.serial_numbers
UNION ALL
SELECT
  'serial_number_history' as table_name,
  COUNT(*) as row_count
FROM public.serial_number_history
UNION ALL
SELECT
  'warranty_claims' as table_name,
  COUNT(*) as row_count
FROM public.warranty_claims
UNION ALL
SELECT
  'repairs' as table_name,
  COUNT(*) as row_count
FROM public.repairs;
*/

