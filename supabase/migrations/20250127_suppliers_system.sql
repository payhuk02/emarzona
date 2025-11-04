-- =====================================================
-- PAYHUK SUPPLIERS MANAGEMENT SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système de gestion des fournisseurs et commandes automatiques
--              Réapprovisionnement automatique, gestion coûts, tracking
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: suppliers
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'suppliers'
  ) THEN
    CREATE TABLE public.suppliers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      
      -- Informations fournisseur
      name TEXT NOT NULL,
      company_name TEXT,
      contact_person TEXT,
      
      -- Contact
      email TEXT,
      phone TEXT,
      website TEXT,
      
      -- Adresse
      address_line1 TEXT,
      address_line2 TEXT,
      city TEXT,
      state TEXT,
      postal_code TEXT,
      country TEXT DEFAULT 'SN',
      
      -- Informations financières
      payment_terms TEXT, -- 'net_30', 'net_60', 'prepaid', etc.
      currency TEXT DEFAULT 'XOF',
      tax_id TEXT, -- Numéro d'identification fiscale
      
      -- Métadonnées
      notes TEXT,
      tags TEXT[] DEFAULT '{}',
      
      -- Statut
      is_active BOOLEAN DEFAULT true,
      is_preferred BOOLEAN DEFAULT false, -- Fournisseur préféré
      
      -- Statistiques
      total_orders INTEGER DEFAULT 0,
      total_spent NUMERIC DEFAULT 0,
      average_delivery_days INTEGER,
      rating NUMERIC DEFAULT 0, -- Note sur 5
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour suppliers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_suppliers_store_id'
  ) THEN
    CREATE INDEX idx_suppliers_store_id ON public.suppliers(store_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_suppliers_active'
  ) THEN
    CREATE INDEX idx_suppliers_active ON public.suppliers(is_active);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_suppliers_updated_at'
  ) THEN
    CREATE TRIGGER update_suppliers_updated_at
      BEFORE UPDATE ON public.suppliers
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: supplier_products
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'supplier_products'
  ) THEN
    CREATE TABLE public.supplier_products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
      product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
      variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
      
      -- Référence fournisseur
      supplier_sku TEXT, -- SKU du produit chez le fournisseur
      supplier_product_name TEXT, -- Nom du produit chez le fournisseur
      
      -- Coûts
      unit_cost NUMERIC NOT NULL, -- Coût unitaire d'achat
      currency TEXT DEFAULT 'XOF',
      minimum_order_quantity INTEGER DEFAULT 1, -- Quantité minimum à commander
      bulk_pricing JSONB DEFAULT '[]', -- [{quantity: 100, price: 500}, ...]
      
      -- Délais
      lead_time_days INTEGER DEFAULT 7, -- Délai de livraison moyen
      estimated_delivery_days INTEGER,
      
      -- Disponibilité
      is_available BOOLEAN DEFAULT true,
      stock_available BOOLEAN, -- Stock disponible chez fournisseur
      
      -- Métadonnées
      notes TEXT,
      catalog_url TEXT, -- URL du produit dans le catalogue fournisseur
      
      -- Statut
      is_active BOOLEAN DEFAULT true,
      is_preferred BOOLEAN DEFAULT false, -- Fournisseur préféré pour ce produit
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(supplier_id, product_id, variant_id)
    );
  END IF;
END $$;

-- Indexes pour supplier_products
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_supplier_products_supplier_id'
  ) THEN
    CREATE INDEX idx_supplier_products_supplier_id ON public.supplier_products(supplier_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_supplier_products_product_id'
  ) THEN
    CREATE INDEX idx_supplier_products_product_id ON public.supplier_products(product_id);
  END IF;
END $$;

-- =====================================================
-- 3. TABLE: supplier_orders
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'supplier_orders'
  ) THEN
    CREATE TABLE public.supplier_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
      
      -- Numéro de commande
      order_number TEXT UNIQUE NOT NULL,
      supplier_order_number TEXT, -- Numéro de commande chez le fournisseur
      
      -- Statut
      status TEXT NOT NULL CHECK (status IN (
        'draft',           -- Brouillon
        'pending',         -- En attente d'envoi
        'sent',            -- Envoyée au fournisseur
        'confirmed',       -- Confirmée par le fournisseur
        'processing',      -- En traitement
        'shipped',         -- Expédiée
        'partially_received', -- Partiellement reçue
        'received',        -- Reçue
        'cancelled',       -- Annulée
        'completed'        -- Complétée
      )) DEFAULT 'draft',
      
      -- Montants
      subtotal NUMERIC NOT NULL DEFAULT 0,
      tax_amount NUMERIC DEFAULT 0,
      shipping_cost NUMERIC DEFAULT 0,
      discount_amount NUMERIC DEFAULT 0,
      total_amount NUMERIC NOT NULL DEFAULT 0,
      currency TEXT DEFAULT 'XOF',
      
      -- Dates
      order_date DATE NOT NULL DEFAULT CURRENT_DATE,
      expected_delivery_date DATE,
      confirmed_date TIMESTAMPTZ,
      shipped_date TIMESTAMPTZ,
      received_date TIMESTAMPTZ,
      
      -- Métadonnées
      notes TEXT,
      terms TEXT, -- Conditions de commande
      
      -- Références
      created_by UUID REFERENCES auth.users(id),
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour supplier_orders
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_supplier_orders_store_id'
  ) THEN
    CREATE INDEX idx_supplier_orders_store_id ON public.supplier_orders(store_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_supplier_orders_supplier_id'
  ) THEN
    CREATE INDEX idx_supplier_orders_supplier_id ON public.supplier_orders(supplier_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_supplier_orders_status'
  ) THEN
    CREATE INDEX idx_supplier_orders_status ON public.supplier_orders(status);
  END IF;
END $$;

-- =====================================================
-- 4. TABLE: supplier_order_items
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'supplier_order_items'
  ) THEN
    CREATE TABLE public.supplier_order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_order_id UUID NOT NULL REFERENCES public.supplier_orders(id) ON DELETE CASCADE,
      supplier_product_id UUID REFERENCES public.supplier_products(id) ON DELETE SET NULL,
      
      -- Produit
      product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
      variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
      
      -- Référence fournisseur
      supplier_sku TEXT,
      supplier_product_name TEXT,
      
      -- Quantités
      quantity_ordered INTEGER NOT NULL,
      quantity_received INTEGER DEFAULT 0,
      quantity_pending INTEGER GENERATED ALWAYS AS (quantity_ordered - COALESCE(quantity_received, 0)) STORED,
      
      -- Coûts
      unit_cost NUMERIC NOT NULL,
      total_cost NUMERIC GENERATED ALWAYS AS (quantity_ordered * unit_cost) STORED,
      
      -- Statut
      status TEXT NOT NULL CHECK (status IN (
        'pending',
        'received',
        'partially_received',
        'cancelled'
      )) DEFAULT 'pending',
      
      -- Dates
      received_at TIMESTAMPTZ,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour supplier_order_items
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_supplier_order_items_order_id'
  ) THEN
    CREATE INDEX idx_supplier_order_items_order_id ON public.supplier_order_items(supplier_order_id);
  END IF;
END $$;

-- =====================================================
-- 5. TABLE: auto_reorder_rules
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'auto_reorder_rules'
  ) THEN
    CREATE TABLE public.auto_reorder_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
      variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
      supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
      
      -- Règle de réapprovisionnement
      reorder_point INTEGER NOT NULL, -- Seuil de déclenchement
      reorder_quantity INTEGER NOT NULL, -- Quantité à commander
      max_stock_level INTEGER, -- Niveau maximum de stock
      
      -- Paramètres
      is_active BOOLEAN DEFAULT true,
      auto_create_order BOOLEAN DEFAULT false, -- Créer commande automatiquement
      require_approval BOOLEAN DEFAULT true, -- Nécessite approbation avant création
      
      -- Notifications
      notify_on_reorder BOOLEAN DEFAULT true,
      notify_email TEXT[], -- Emails à notifier
      
      -- Métadonnées
      notes TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour auto_reorder_rules
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_auto_reorder_rules_store_id'
  ) THEN
    CREATE INDEX idx_auto_reorder_rules_store_id ON public.auto_reorder_rules(store_id);
  END IF;
END $$;

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_reorder_rules ENABLE ROW LEVEL SECURITY;

-- Policies pour suppliers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'Store owners can manage suppliers'
  ) THEN
    CREATE POLICY "Store owners can manage suppliers" ON public.suppliers
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = suppliers.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour supplier_products
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'supplier_products' AND policyname = 'Store owners can manage supplier products'
  ) THEN
    CREATE POLICY "Store owners can manage supplier products" ON public.supplier_products
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.suppliers s
          JOIN public.stores st ON st.id = s.store_id
          WHERE s.id = supplier_products.supplier_id
          AND st.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour supplier_orders
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'supplier_orders' AND policyname = 'Store owners can manage supplier orders'
  ) THEN
    CREATE POLICY "Store owners can manage supplier orders" ON public.supplier_orders
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = supplier_orders.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour supplier_order_items
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'supplier_order_items' AND policyname = 'Store owners can view items'
  ) THEN
    CREATE POLICY "Store owners can view items" ON public.supplier_order_items
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.supplier_orders so
          JOIN public.stores s ON s.id = so.store_id
          WHERE so.id = supplier_order_items.supplier_order_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour auto_reorder_rules
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'auto_reorder_rules' AND policyname = 'Store owners can manage rules'
  ) THEN
    CREATE POLICY "Store owners can manage rules" ON public.auto_reorder_rules
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = auto_reorder_rules.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- 7. FUNCTIONS
-- =====================================================

-- Function: Generate supplier order number
CREATE OR REPLACE FUNCTION public.generate_supplier_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_number TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_number := 'PO-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    SELECT EXISTS(SELECT 1 FROM public.supplier_orders WHERE order_number = v_number) INTO v_exists;
    
    IF NOT v_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_number;
END;
$$;

-- Function: Check reorder triggers
CREATE OR REPLACE FUNCTION public.check_reorder_triggers()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_rule RECORD;
  v_current_stock INTEGER;
BEGIN
  -- Récupérer le stock actuel
  SELECT quantity_available INTO v_current_stock
  FROM public.inventory_items
  WHERE (physical_product_id = NEW.physical_product_id AND NEW.variant_id IS NULL)
     OR (variant_id = NEW.variant_id AND NEW.variant_id IS NOT NULL);
  
  -- Vérifier les règles de réapprovisionnement
  FOR v_rule IN
    SELECT * FROM public.auto_reorder_rules
    WHERE is_active = true
      AND (
        (product_id IN (SELECT product_id FROM public.physical_products WHERE id = NEW.physical_product_id) AND NEW.variant_id IS NULL)
        OR (variant_id = NEW.variant_id AND NEW.variant_id IS NOT NULL)
      )
      AND v_current_stock <= reorder_point
  LOOP
    -- Créer alerte ou commande selon configuration
    IF v_rule.auto_create_order AND NOT v_rule.require_approval THEN
      -- TODO: Créer commande automatiquement
      PERFORM public.create_auto_supplier_order(v_rule);
    ELSE
      -- Créer alerte
      INSERT INTO public.physical_product_alerts (
        store_id,
        product_id,
        variant_id,
        alert_type,
        severity,
        title,
        message,
        details,
        action_url,
        action_label
      ) VALUES (
        v_rule.store_id,
        v_rule.product_id,
        v_rule.variant_id,
        'reorder_needed',
        'high',
        'Réapprovisionnement nécessaire',
        'Le stock est en dessous du seuil. Quantité à commander: ' || v_rule.reorder_quantity,
        jsonb_build_object(
          'current_stock', v_current_stock,
          'reorder_point', v_rule.reorder_point,
          'reorder_quantity', v_rule.reorder_quantity,
          'supplier_id', v_rule.supplier_id
        ),
        '/dashboard/suppliers/orders/create',
        'Créer commande'
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger pour vérifier réapprovisionnement
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_check_reorder'
  ) THEN
    CREATE TRIGGER trigger_check_reorder
      AFTER UPDATE OF quantity_available ON public.inventory_items
      FOR EACH ROW
      WHEN (OLD.quantity_available IS DISTINCT FROM NEW.quantity_available)
      EXECUTE FUNCTION public.check_reorder_triggers();
  END IF;
END $$;

-- =====================================================
-- 8. COMMENTS
-- =====================================================
COMMENT ON TABLE public.suppliers IS 'Fournisseurs de produits';
COMMENT ON TABLE public.supplier_products IS 'Produits disponibles auprès des fournisseurs';
COMMENT ON TABLE public.supplier_orders IS 'Commandes aux fournisseurs';
COMMENT ON TABLE public.supplier_order_items IS 'Items des commandes fournisseurs';
COMMENT ON TABLE public.auto_reorder_rules IS 'Règles de réapprovisionnement automatique';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

