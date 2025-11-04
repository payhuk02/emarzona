-- =====================================================
-- PAYHUK PRODUCT KITS & ASSEMBLY SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système de kits produits et assemblage
--              Produits composés de plusieurs sous-produits
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: product_kits
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_kits'
  ) THEN
    CREATE TABLE public.product_kits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      kit_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE, -- Produit principal (kit)
      
      -- Configuration kit
      kit_name TEXT NOT NULL,
      kit_description TEXT,
      kit_type TEXT NOT NULL CHECK (kit_type IN (
        'fixed',         -- Kit fixe (produits prédéfinis)
        'flexible',      -- Kit flexible (choix parmi options)
        'bundle',        -- Bundle (produits groupés)
        'assembly'       -- Assemblage (produit final assemblé)
      )) DEFAULT 'fixed',
      
      -- Quantités
      min_items INTEGER DEFAULT 1, -- Minimum pour kit flexible
      max_items INTEGER, -- Maximum pour kit flexible
      
      -- Prix
      kit_price NUMERIC, -- Prix du kit (si différent de somme composants)
      discount_percentage NUMERIC DEFAULT 0, -- Pourcentage de réduction
      discount_amount NUMERIC DEFAULT 0, -- Montant de réduction fixe
      
      -- Inventaire
      track_kit_inventory BOOLEAN DEFAULT true, -- Suivre inventaire kit séparément
      track_components_inventory BOOLEAN DEFAULT true, -- Suivre inventaire composants
      auto_allocate BOOLEAN DEFAULT false, -- Allouer automatiquement composants
      
      -- Assemblage
      requires_assembly BOOLEAN DEFAULT false, -- Nécessite assemblage
      assembly_time_minutes INTEGER, -- Temps d'assemblage estimé
      assembly_instructions TEXT, -- Instructions d'assemblage
      assembly_required BOOLEAN DEFAULT false, -- Assemblage obligatoire avant vente
      
      -- Métadonnées
      is_active BOOLEAN DEFAULT true,
      display_order INTEGER DEFAULT 0,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(store_id, kit_product_id)
    );
  END IF;
END $$;

-- Indexes pour product_kits
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_kits_store_id'
  ) THEN
    CREATE INDEX idx_product_kits_store_id ON public.product_kits(store_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_kits_kit_product_id'
  ) THEN
    CREATE INDEX idx_product_kits_kit_product_id ON public.product_kits(kit_product_id);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_kits_updated_at'
  ) THEN
    CREATE TRIGGER update_product_kits_updated_at
      BEFORE UPDATE ON public.product_kits
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: kit_components
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kit_components'
  ) THEN
    CREATE TABLE public.kit_components (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      kit_id UUID NOT NULL REFERENCES public.product_kits(id) ON DELETE CASCADE,
      
      -- Composant
      component_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      component_variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
      
      -- Quantité
      quantity INTEGER NOT NULL DEFAULT 1,
      is_required BOOLEAN DEFAULT true, -- Obligatoire dans le kit
      is_option BOOLEAN DEFAULT false, -- Option pour kit flexible
      
      -- Prix
      price_override NUMERIC, -- Prix override (si différent du prix normal)
      use_component_price BOOLEAN DEFAULT true, -- Utiliser prix composant
      
      -- Position
      display_order INTEGER DEFAULT 0,
      
      -- Métadonnées
      notes TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(kit_id, component_product_id, component_variant_id)
    );
  END IF;
END $$;

-- Indexes pour kit_components
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_kit_components_kit_id'
  ) THEN
    CREATE INDEX idx_kit_components_kit_id ON public.kit_components(kit_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_kit_components_component_product_id'
  ) THEN
    CREATE INDEX idx_kit_components_component_product_id ON public.kit_components(component_product_id);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_kit_components_updated_at'
  ) THEN
    CREATE TRIGGER update_kit_components_updated_at
      BEFORE UPDATE ON public.kit_components
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 3. TABLE: kit_assemblies
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kit_assemblies'
  ) THEN
    CREATE TABLE public.kit_assemblies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      kit_id UUID NOT NULL REFERENCES public.product_kits(id) ON DELETE CASCADE,
      order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
      order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
      
      -- Assemblage
      assembly_number TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL CHECK (status IN (
        'pending',      -- En attente
        'in_progress',  -- En cours
        'completed',    -- Terminé
        'cancelled'     -- Annulé
      )) DEFAULT 'pending',
      
      -- Dates
      scheduled_date TIMESTAMPTZ,
      started_date TIMESTAMPTZ,
      completed_date TIMESTAMPTZ,
      estimated_completion_date TIMESTAMPTZ,
      
      -- Responsables
      assigned_to UUID REFERENCES auth.users(id),
      assembled_by UUID REFERENCES auth.users(id),
      
      -- Composants utilisés
      components_used JSONB DEFAULT '[]', -- [{component_id, quantity, serial_number}]
      
      -- Métadonnées
      notes TEXT,
      quality_check_passed BOOLEAN,
      quality_check_notes TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour kit_assemblies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_kit_assemblies_kit_id'
  ) THEN
    CREATE INDEX idx_kit_assemblies_kit_id ON public.kit_assemblies(kit_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_kit_assemblies_order_id'
  ) THEN
    CREATE INDEX idx_kit_assemblies_order_id ON public.kit_assemblies(order_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_kit_assemblies_status'
  ) THEN
    CREATE INDEX idx_kit_assemblies_status ON public.kit_assemblies(status);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_kit_assemblies_updated_at'
  ) THEN
    CREATE TRIGGER update_kit_assemblies_updated_at
      BEFORE UPDATE ON public.kit_assemblies
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 4. FUNCTIONS
-- =====================================================

-- Fonction pour générer numéro d'assemblage
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'generate_kit_assembly_number'
  ) THEN
    DROP FUNCTION public.generate_kit_assembly_number();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.generate_kit_assembly_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_number TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_number := 'ASM-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    SELECT EXISTS(SELECT 1 FROM public.kit_assemblies WHERE assembly_number = v_number) INTO v_exists;
    
    IF NOT v_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_number;
END;
$$;

-- Fonction pour calculer le prix d'un kit
CREATE OR REPLACE FUNCTION public.calculate_kit_price(p_kit_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_kit_price NUMERIC;
  v_components_total NUMERIC := 0;
  v_component RECORD;
BEGIN
  -- Récupérer prix kit si défini
  SELECT kit_price INTO v_kit_price
  FROM public.product_kits
  WHERE id = p_kit_id;
  
  -- Si prix kit défini, le retourner
  IF v_kit_price IS NOT NULL THEN
    RETURN v_kit_price;
  END IF;
  
  -- Sinon, calculer somme des composants
  FOR v_component IN
    SELECT 
      kc.quantity,
      COALESCE(kc.price_override, p.price) as component_price
    FROM public.kit_components kc
    JOIN public.products p ON p.id = kc.component_product_id
    WHERE kc.kit_id = p_kit_id
      AND kc.is_required = true
  LOOP
    v_components_total := v_components_total + (v_component.quantity * v_component.component_price);
  END LOOP;
  
  RETURN v_components_total;
END;
$$;

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS
ALTER TABLE public.product_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_assemblies ENABLE ROW LEVEL SECURITY;

-- Policies pour product_kits
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_kits' AND policyname = 'Store owners can manage kits'
  ) THEN
    CREATE POLICY "Store owners can manage kits" ON public.product_kits
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = product_kits.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_kits' AND policyname = 'Anyone can view active kits'
  ) THEN
    CREATE POLICY "Anyone can view active kits" ON public.product_kits
      FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

-- Policies pour kit_components
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kit_components' AND policyname = 'Store owners can manage components'
  ) THEN
    CREATE POLICY "Store owners can manage components" ON public.kit_components
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.product_kits pk
          JOIN public.stores s ON s.id = pk.store_id
          WHERE pk.id = kit_components.kit_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour kit_assemblies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kit_assemblies' AND policyname = 'Store owners can manage assemblies'
  ) THEN
    CREATE POLICY "Store owners can manage assemblies" ON public.kit_assemblies
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.product_kits pk
          JOIN public.stores s ON s.id = pk.store_id
          WHERE pk.id = kit_assemblies.kit_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kit_assemblies' AND policyname = 'Users can view own assemblies'
  ) THEN
    CREATE POLICY "Users can view own assemblies" ON public.kit_assemblies
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = kit_assemblies.order_id
          AND o.customer_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

