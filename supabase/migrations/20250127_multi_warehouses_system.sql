-- =====================================================
-- PAYHUK MULTI-WAREHOUSE MANAGEMENT SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système de gestion multi-entrepôts avec allocations, transferts et inventaire par localisation
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: warehouses
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'warehouses'
  ) THEN
    CREATE TABLE public.warehouses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      
      -- Informations entrepôt
      name TEXT NOT NULL,
      code TEXT NOT NULL, -- Code unique (ex: 'WH-001')
      description TEXT,
      
      -- Contact
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      
      -- Adresse
      address_line1 TEXT NOT NULL,
      address_line2 TEXT,
      city TEXT NOT NULL,
      state TEXT,
      postal_code TEXT,
      country TEXT DEFAULT 'SN',
      
      -- Coordonnées (pour calcul distances)
      latitude NUMERIC,
      longitude NUMERIC,
      
      -- Configuration
      is_active BOOLEAN DEFAULT true,
      is_primary BOOLEAN DEFAULT false, -- Entrepôt principal
      is_fulfillment_center BOOLEAN DEFAULT true, -- Peut expédier commandes
      is_receiving_center BOOLEAN DEFAULT true, -- Peut recevoir stock
      
      -- Capacité (optionnel)
      max_capacity INTEGER, -- Nombre max d'unités
      current_capacity INTEGER DEFAULT 0, -- Unités actuelles
      capacity_unit TEXT DEFAULT 'units', -- 'units', 'cubic_meters', etc.
      
      -- Statut opérationnel
      operational_hours JSONB, -- {monday: {open: "08:00", close: "18:00"}, ...}
      timezone TEXT DEFAULT 'Africa/Dakar',
      
      -- Métadonnées
      notes TEXT,
      tags TEXT[] DEFAULT '{}',
      
      -- Statistiques
      total_products INTEGER DEFAULT 0,
      total_value NUMERIC DEFAULT 0, -- Valeur totale stock
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(store_id, code)
    );
  END IF;
END $$;

-- Indexes pour warehouses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warehouses_store_id'
  ) THEN
    CREATE INDEX idx_warehouses_store_id ON public.warehouses(store_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warehouses_code'
  ) THEN
    CREATE INDEX idx_warehouses_code ON public.warehouses(code);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warehouses_active'
  ) THEN
    CREATE INDEX idx_warehouses_active ON public.warehouses(is_active);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_warehouses_updated_at'
  ) THEN
    CREATE TRIGGER update_warehouses_updated_at
      BEFORE UPDATE ON public.warehouses
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: warehouse_locations
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'warehouse_locations'
  ) THEN
    CREATE TABLE public.warehouse_locations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
      
      -- Localisation
      location_code TEXT NOT NULL, -- Ex: 'A-1-2-3' (Zone-Aisle-Shelf-Bin)
      location_name TEXT, -- Nom lisible
      location_type TEXT DEFAULT 'bin' CHECK (location_type IN ('zone', 'aisle', 'shelf', 'bin', 'rack', 'pallet')),
      
      -- Position hiérarchique
      parent_location_id UUID REFERENCES public.warehouse_locations(id) ON DELETE CASCADE,
      
      -- Capacité
      max_capacity INTEGER,
      current_capacity INTEGER DEFAULT 0,
      
      -- Dimensions (pour optimisation placement)
      length NUMERIC,
      width NUMERIC,
      height NUMERIC,
      dimensions_unit TEXT DEFAULT 'cm',
      
      -- Statut
      is_active BOOLEAN DEFAULT true,
      is_reserved BOOLEAN DEFAULT false, -- Réservé pour usage spécial
      
      -- Métadonnées
      notes TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(warehouse_id, location_code)
    );
  END IF;
END $$;

-- Indexes pour warehouse_locations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warehouse_locations_warehouse_id'
  ) THEN
    CREATE INDEX idx_warehouse_locations_warehouse_id ON public.warehouse_locations(warehouse_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warehouse_locations_parent'
  ) THEN
    CREATE INDEX idx_warehouse_locations_parent ON public.warehouse_locations(parent_location_id);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_warehouse_locations_updated_at'
  ) THEN
    CREATE TRIGGER update_warehouse_locations_updated_at
      BEFORE UPDATE ON public.warehouse_locations
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 3. TABLE: warehouse_inventory
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'warehouse_inventory'
  ) THEN
    CREATE TABLE public.warehouse_inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
      location_id UUID REFERENCES public.warehouse_locations(id) ON DELETE SET NULL,
      
      -- Référence produit
      product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
      variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
      
      -- Stock
      quantity_available INTEGER DEFAULT 0,
      quantity_reserved INTEGER DEFAULT 0, -- Réservé pour commandes
      quantity_allocated INTEGER DEFAULT 0, -- Alloué mais pas encore expédié
      quantity_on_hand INTEGER GENERATED ALWAYS AS (quantity_available + quantity_reserved + quantity_allocated) STORED,
      
      -- Coûts
      average_cost NUMERIC, -- Coût moyen unitaire
      total_value NUMERIC GENERATED ALWAYS AS (quantity_available * COALESCE(average_cost, 0)) STORED,
      
      -- Réapprovisionnement
      reorder_point INTEGER DEFAULT 10,
      reorder_quantity INTEGER DEFAULT 50,
      
      -- Dernière activité
      last_movement_at TIMESTAMPTZ,
      last_counted_at TIMESTAMPTZ,
      
      -- Métadonnées
      notes TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      -- Contrainte unique: un produit/variant par entrepôt
      UNIQUE(warehouse_id, product_id, variant_id)
    );
  END IF;
END $$;

-- Indexes pour warehouse_inventory
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warehouse_inventory_warehouse_id'
  ) THEN
    CREATE INDEX idx_warehouse_inventory_warehouse_id ON public.warehouse_inventory(warehouse_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warehouse_inventory_product_id'
  ) THEN
    CREATE INDEX idx_warehouse_inventory_product_id ON public.warehouse_inventory(product_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warehouse_inventory_variant_id'
  ) THEN
    CREATE INDEX idx_warehouse_inventory_variant_id ON public.warehouse_inventory(variant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warehouse_inventory_location_id'
  ) THEN
    CREATE INDEX idx_warehouse_inventory_location_id ON public.warehouse_inventory(location_id);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_warehouse_inventory_updated_at'
  ) THEN
    CREATE TRIGGER update_warehouse_inventory_updated_at
      BEFORE UPDATE ON public.warehouse_inventory
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 4. TABLE: warehouse_transfers
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'warehouse_transfers'
  ) THEN
    CREATE TABLE public.warehouse_transfers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      
      -- Transfert
      transfer_number TEXT UNIQUE NOT NULL,
      from_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
      to_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
      
      -- Statut
      status TEXT NOT NULL CHECK (status IN (
        'pending',        -- En attente
        'approved',       -- Approuvé
        'in_transit',     -- En transit
        'received',       -- Reçu
        'completed',      -- Terminé
        'cancelled'       -- Annulé
      )) DEFAULT 'pending',
      
      -- Dates
      requested_date TIMESTAMPTZ NOT NULL DEFAULT now(),
      approved_date TIMESTAMPTZ,
      shipped_date TIMESTAMPTZ,
      expected_delivery_date TIMESTAMPTZ,
      received_date TIMESTAMPTZ,
      completed_date TIMESTAMPTZ,
      
      -- Responsables
      requested_by UUID REFERENCES auth.users(id),
      approved_by UUID REFERENCES auth.users(id),
      received_by UUID REFERENCES auth.users(id),
      
      -- Transport
      shipping_method TEXT, -- 'internal', 'carrier', 'pickup'
      carrier_name TEXT,
      tracking_number TEXT,
      
      -- Métadonnées
      notes TEXT,
      reason TEXT, -- Raison du transfert
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      CHECK (from_warehouse_id != to_warehouse_id)
    );
  END IF;
END $$;

-- Indexes pour warehouse_transfers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warehouse_transfers_store_id'
  ) THEN
    CREATE INDEX idx_warehouse_transfers_store_id ON public.warehouse_transfers(store_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warehouse_transfers_from_warehouse'
  ) THEN
    CREATE INDEX idx_warehouse_transfers_from_warehouse ON public.warehouse_transfers(from_warehouse_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warehouse_transfers_to_warehouse'
  ) THEN
    CREATE INDEX idx_warehouse_transfers_to_warehouse ON public.warehouse_transfers(to_warehouse_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warehouse_transfers_status'
  ) THEN
    CREATE INDEX idx_warehouse_transfers_status ON public.warehouse_transfers(status);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_warehouse_transfers_updated_at'
  ) THEN
    CREATE TRIGGER update_warehouse_transfers_updated_at
      BEFORE UPDATE ON public.warehouse_transfers
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 5. TABLE: warehouse_transfer_items
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'warehouse_transfer_items'
  ) THEN
    CREATE TABLE public.warehouse_transfer_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      transfer_id UUID NOT NULL REFERENCES public.warehouse_transfers(id) ON DELETE CASCADE,
      
      -- Produit
      product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
      
      -- Quantités
      quantity_requested INTEGER NOT NULL,
      quantity_shipped INTEGER DEFAULT 0,
      quantity_received INTEGER DEFAULT 0,
      
      -- Localisations
      from_location_id UUID REFERENCES public.warehouse_locations(id),
      to_location_id UUID REFERENCES public.warehouse_locations(id),
      
      -- Coût
      unit_cost NUMERIC,
      total_cost NUMERIC GENERATED ALWAYS AS (quantity_requested * COALESCE(unit_cost, 0)) STORED,
      
      -- Notes
      notes TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour warehouse_transfer_items
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_transfer_items_transfer_id'
  ) THEN
    CREATE INDEX idx_transfer_items_transfer_id ON public.warehouse_transfer_items(transfer_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_transfer_items_product_id'
  ) THEN
    CREATE INDEX idx_transfer_items_product_id ON public.warehouse_transfer_items(product_id);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_transfer_items_updated_at'
  ) THEN
    CREATE TRIGGER update_transfer_items_updated_at
      BEFORE UPDATE ON public.warehouse_transfer_items
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 6. TABLE: warehouse_allocations
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'warehouse_allocations'
  ) THEN
    CREATE TABLE public.warehouse_allocations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
      order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
      order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
      
      -- Produit
      product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
      
      -- Quantité
      quantity_allocated INTEGER NOT NULL,
      
      -- Statut
      status TEXT NOT NULL CHECK (status IN (
        'allocated',   -- Alloué
        'picked',      -- Préparé
        'packed',      -- Emballé
        'shipped',     -- Expédié
        'cancelled'    -- Annulé
      )) DEFAULT 'allocated',
      
      -- Localisation
      location_id UUID REFERENCES public.warehouse_locations(id),
      
      -- Dates
      allocated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      picked_at TIMESTAMPTZ,
      packed_at TIMESTAMPTZ,
      shipped_at TIMESTAMPTZ,
      
      -- Responsables
      allocated_by UUID REFERENCES auth.users(id),
      picked_by UUID REFERENCES auth.users(id),
      packed_by UUID REFERENCES auth.users(id),
      
      -- Métadonnées
      notes TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour warehouse_allocations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warehouse_allocations_warehouse_id'
  ) THEN
    CREATE INDEX idx_warehouse_allocations_warehouse_id ON public.warehouse_allocations(warehouse_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warehouse_allocations_order_id'
  ) THEN
    CREATE INDEX idx_warehouse_allocations_order_id ON public.warehouse_allocations(order_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warehouse_allocations_status'
  ) THEN
    CREATE INDEX idx_warehouse_allocations_status ON public.warehouse_allocations(status);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_warehouse_allocations_updated_at'
  ) THEN
    CREATE TRIGGER update_warehouse_allocations_updated_at
      BEFORE UPDATE ON public.warehouse_allocations
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 7. FUNCTIONS
-- =====================================================

-- Fonction pour générer numéro de transfert
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'generate_warehouse_transfer_number'
  ) THEN
    DROP FUNCTION public.generate_warehouse_transfer_number();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.generate_warehouse_transfer_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_number TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_number := 'TRF-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    SELECT EXISTS(SELECT 1 FROM public.warehouse_transfers WHERE transfer_number = v_number) INTO v_exists;
    
    IF NOT v_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_number;
END;
$$;

-- Fonction pour mettre à jour capacité entrepôt
CREATE OR REPLACE FUNCTION public.update_warehouse_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.warehouses
  SET 
    current_capacity = (
      SELECT COALESCE(SUM(quantity_available + quantity_reserved + quantity_allocated), 0)
      FROM public.warehouse_inventory
      WHERE warehouse_id = COALESCE(NEW.warehouse_id, OLD.warehouse_id)
    ),
    total_products = (
      SELECT COUNT(DISTINCT product_id)
      FROM public.warehouse_inventory
      WHERE warehouse_id = COALESCE(NEW.warehouse_id, OLD.warehouse_id)
        AND quantity_available > 0
    ),
    total_value = (
      SELECT COALESCE(SUM(total_value), 0)
      FROM public.warehouse_inventory
      WHERE warehouse_id = COALESCE(NEW.warehouse_id, OLD.warehouse_id)
    )
  WHERE id = COALESCE(NEW.warehouse_id, OLD.warehouse_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger pour mettre à jour capacité
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_warehouse_capacity'
  ) THEN
    CREATE TRIGGER trigger_update_warehouse_capacity
      AFTER INSERT OR UPDATE OR DELETE ON public.warehouse_inventory
      FOR EACH ROW
      EXECUTE FUNCTION public.update_warehouse_capacity();
  END IF;
END $$;

-- Fonction pour ajuster l'inventaire d'un entrepôt
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'adjust_warehouse_inventory'
  ) THEN
    DROP FUNCTION public.adjust_warehouse_inventory(UUID, UUID, UUID, INTEGER, UUID);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.adjust_warehouse_inventory(
  p_warehouse_id UUID,
  p_product_id UUID,
  p_quantity_change INTEGER,
  p_variant_id UUID DEFAULT NULL,
  p_location_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_inventory_id UUID;
BEGIN
  -- Chercher ou créer l'entrée d'inventaire
  SELECT id INTO v_inventory_id
  FROM public.warehouse_inventory
  WHERE warehouse_id = p_warehouse_id
    AND product_id = p_product_id
    AND (p_variant_id IS NULL OR variant_id = p_variant_id)
    AND (p_variant_id IS NOT NULL OR variant_id IS NULL);

  IF v_inventory_id IS NULL THEN
    -- Créer nouvelle entrée
    INSERT INTO public.warehouse_inventory (
      warehouse_id,
      product_id,
      variant_id,
      location_id,
      quantity_available,
      quantity_reserved,
      quantity_allocated
    )
    VALUES (
      p_warehouse_id,
      p_product_id,
      p_variant_id,
      p_location_id,
      GREATEST(0, p_quantity_change),
      0,
      0
    )
    RETURNING id INTO v_inventory_id;
  ELSE
    -- Mettre à jour l'existante
    UPDATE public.warehouse_inventory
    SET 
      quantity_available = GREATEST(0, quantity_available + p_quantity_change),
      location_id = COALESCE(p_location_id, location_id),
      last_movement_at = now(),
      updated_at = now()
    WHERE id = v_inventory_id;
  END IF;

  RETURN v_inventory_id;
END;
$$;

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_allocations ENABLE ROW LEVEL SECURITY;

-- Policies pour warehouses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'warehouses' AND policyname = 'Store owners can manage warehouses'
  ) THEN
    CREATE POLICY "Store owners can manage warehouses" ON public.warehouses
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = warehouses.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour warehouse_locations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'warehouse_locations' AND policyname = 'Store owners can manage locations'
  ) THEN
    CREATE POLICY "Store owners can manage locations" ON public.warehouse_locations
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.warehouses w
          JOIN public.stores s ON s.id = w.store_id
          WHERE w.id = warehouse_locations.warehouse_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour warehouse_inventory
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'warehouse_inventory' AND policyname = 'Store owners can manage inventory'
  ) THEN
    CREATE POLICY "Store owners can manage inventory" ON public.warehouse_inventory
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.warehouses w
          JOIN public.stores s ON s.id = w.store_id
          WHERE w.id = warehouse_inventory.warehouse_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour warehouse_transfers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'warehouse_transfers' AND policyname = 'Store owners can manage transfers'
  ) THEN
    CREATE POLICY "Store owners can manage transfers" ON public.warehouse_transfers
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = warehouse_transfers.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour warehouse_allocations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'warehouse_allocations' AND policyname = 'Store owners can manage allocations'
  ) THEN
    CREATE POLICY "Store owners can manage allocations" ON public.warehouse_allocations
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.warehouses w
          JOIN public.stores s ON s.id = w.store_id
          WHERE w.id = warehouse_allocations.warehouse_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

