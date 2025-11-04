-- =====================================================
-- PAYHUK PHYSICAL PRODUCTS RETURNS SYSTEM (RMA)
-- Date: 27 Janvier 2025
-- Description: Système complet de gestion des retours (Returns Management Authorization)
--              Permet aux clients de demander des retours et aux admins de les gérer
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: product_returns
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_returns'
  ) THEN
    CREATE TABLE public.product_returns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
      order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE SET NULL,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Numéro de retour (RMA)
      return_number TEXT UNIQUE NOT NULL,
      
      -- Statut du retour
      status TEXT NOT NULL CHECK (status IN (
        'pending',           -- En attente d'approbation
        'approved',          -- Approuvé, en attente d'envoi
        'rejected',          -- Rejeté
        'return_shipped',    -- Retour expédié par client
        'return_received',   -- Retour reçu par le store
        'inspecting',        -- En inspection
        'refund_processing', -- Remboursement en cours
        'refunded',          -- Remboursé
        'store_credit_issued', -- Crédit store émis
        'exchange_processing', -- Échange en cours
        'exchanged',         -- Échangé
        'cancelled'          -- Annulé
      )) DEFAULT 'pending',
      
      -- Raison du retour
      return_reason TEXT NOT NULL CHECK (return_reason IN (
        'defective',         -- Produit défectueux
        'wrong_item',        -- Mauvais article
        'not_as_described',  -- Pas comme décrit
        'damaged',           -- Endommagé à la livraison
        'size_issue',        -- Problème de taille
        'color_issue',       -- Problème de couleur
        'changed_mind',       -- Changement d'avis
        'late_delivery',     -- Livraison tardive
        'other'              -- Autre
      )),
      return_reason_details TEXT,
      
      -- Informations produit retourné
      product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
      variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      
      -- Conditions du retour
      return_window_days INTEGER DEFAULT 30, -- Fenêtre de retour (jours)
      return_deadline_date TIMESTAMPTZ, -- Date limite calculée
      is_within_window BOOLEAN GENERATED ALWAYS AS (
        return_deadline_date IS NULL OR return_deadline_date >= now()
      ) STORED,
      
      -- Politique de retour
      refund_method TEXT NOT NULL CHECK (refund_method IN (
        'original_payment',  -- Remboursement méthode paiement originale
        'store_credit',     -- Crédit store
        'exchange'           -- Échange
      )) DEFAULT 'original_payment',
      
      -- Montants
      original_amount NUMERIC NOT NULL,
      refund_amount NUMERIC, -- Peut être différent (frais déduits)
      restocking_fee NUMERIC DEFAULT 0, -- Frais de réapprovisionnement
      return_shipping_cost NUMERIC DEFAULT 0, -- Coût expédition retour
      
      -- Photos obligatoires
      photos JSONB DEFAULT '[]', -- URLs des photos du produit retourné
      
      -- Adresse retour
      return_address JSONB, -- Adresse pour renvoyer le produit
      
      -- Tracking retour
      return_tracking_number TEXT,
      return_carrier TEXT,
      
      -- Dates importantes
      requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      approved_at TIMESTAMPTZ,
      approved_by UUID REFERENCES auth.users(id),
      rejected_at TIMESTAMPTZ,
      rejected_by UUID REFERENCES auth.users(id),
      rejection_reason TEXT,
      return_shipped_at TIMESTAMPTZ,
      return_received_at TIMESTAMPTZ,
      inspected_at TIMESTAMPTZ,
      refund_processed_at TIMESTAMPTZ,
      
      -- Notes
      customer_notes TEXT,
      admin_notes TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour product_returns
-- Vérifier et créer colonnes si nécessaire
DO $$ BEGIN
  -- S'assurer que user_id existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'product_returns' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.product_returns 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_returns_store_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'product_returns' 
    AND column_name = 'store_id'
  ) THEN
    CREATE INDEX idx_product_returns_store_id ON public.product_returns(store_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_returns_order_id'
  ) THEN
    CREATE INDEX idx_product_returns_order_id ON public.product_returns(order_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'product_returns' 
    AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_returns_user_id'
  ) THEN
    CREATE INDEX idx_product_returns_user_id ON public.product_returns(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_returns_status'
  ) THEN
    CREATE INDEX idx_product_returns_status ON public.product_returns(status);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_returns_return_number'
  ) THEN
    CREATE INDEX idx_product_returns_return_number ON public.product_returns(return_number);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_returns_updated_at'
  ) THEN
    CREATE TRIGGER update_product_returns_updated_at
      BEFORE UPDATE ON public.product_returns
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: return_policies
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'return_policies'
  ) THEN
    CREATE TABLE public.return_policies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      
      -- Nom de la politique
      name TEXT NOT NULL,
      description TEXT,
      
      -- Fenêtre de retour
      return_window_days INTEGER DEFAULT 30,
      
      -- Conditions
      requires_receipt BOOLEAN DEFAULT true,
      requires_photos BOOLEAN DEFAULT true,
      requires_original_packaging BOOLEAN DEFAULT false,
      requires_tags BOOLEAN DEFAULT false, -- Pour vêtements
      
      -- États acceptés
      accepted_conditions TEXT[] DEFAULT ARRAY['new', 'like_new', 'used']::TEXT[],
      
      -- Frais
      restocking_fee_percentage NUMERIC DEFAULT 0 CHECK (restocking_fee_percentage >= 0 AND restocking_fee_percentage <= 100),
      restocking_fee_fixed NUMERIC DEFAULT 0,
      return_shipping_paid_by TEXT CHECK (return_shipping_paid_by IN ('customer', 'store')) DEFAULT 'customer',
      
      -- Raisons acceptées
      accepted_reasons TEXT[] DEFAULT ARRAY[
        'defective', 'wrong_item', 'not_as_described', 
        'damaged', 'size_issue', 'color_issue', 
        'changed_mind', 'late_delivery', 'other'
      ]::TEXT[],
      
      -- Méthodes de remboursement
      allowed_refund_methods TEXT[] DEFAULT ARRAY['original_payment', 'store_credit', 'exchange']::TEXT[],
      
      -- Produits exclus
      excluded_product_ids UUID[] DEFAULT '{}',
      excluded_category_ids UUID[] DEFAULT '{}',
      
      -- Produits spécifiques
      applies_to_all_products BOOLEAN DEFAULT true,
      specific_product_ids UUID[] DEFAULT '{}',
      
      -- Statut
      is_active BOOLEAN DEFAULT true,
      is_default BOOLEAN DEFAULT false,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour return_policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_return_policies_store_id'
  ) THEN
    CREATE INDEX idx_return_policies_store_id ON public.return_policies(store_id);
  END IF;
END $$;

-- =====================================================
-- 3. TABLE: return_refunds
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'return_refunds'
  ) THEN
    CREATE TABLE public.return_refunds (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      return_id UUID NOT NULL REFERENCES public.product_returns(id) ON DELETE CASCADE,
      
      -- Type de remboursement
      refund_type TEXT NOT NULL CHECK (refund_type IN (
        'full',           -- Remboursement total
        'partial',        -- Remboursement partiel
        'store_credit'    -- Crédit store
      )),
      
      -- Montants
      refund_amount NUMERIC NOT NULL,
      currency TEXT DEFAULT 'XOF',
      
      -- Méthode
      refund_method TEXT NOT NULL CHECK (refund_method IN (
        'original_payment',  -- Méthode paiement originale
        'store_credit',     -- Crédit store
        'bank_transfer',    -- Virement bancaire
        'check'             -- Chèque
      )),
      
      -- Références
      original_payment_id UUID, -- ID paiement original
      refund_transaction_id TEXT, -- ID transaction remboursement
      
      -- Statut
      status TEXT NOT NULL CHECK (status IN (
        'pending',       -- En attente
        'processing',   -- En traitement
        'completed',    -- Complété
        'failed',       -- Échoué
        'cancelled'     -- Annulé
      )) DEFAULT 'pending',
      
      -- Dates
      processed_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      
      -- Notes
      notes TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour return_refunds
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_return_refunds_return_id'
  ) THEN
    CREATE INDEX idx_return_refunds_return_id ON public.return_refunds(return_id);
  END IF;
END $$;

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.product_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_refunds ENABLE ROW LEVEL SECURITY;

-- Policies pour product_returns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_returns' AND policyname = 'Users can view own returns'
  ) THEN
    CREATE POLICY "Users can view own returns" ON public.product_returns
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_returns' AND policyname = 'Users can create own returns'
  ) THEN
    CREATE POLICY "Users can create own returns" ON public.product_returns
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_returns' AND policyname = 'Store owners can manage returns'
  ) THEN
    CREATE POLICY "Store owners can manage returns" ON public.product_returns
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = product_returns.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour return_policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'return_policies' AND policyname = 'Anyone can view active policies'
  ) THEN
    CREATE POLICY "Anyone can view active policies" ON public.return_policies
      FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'return_policies' AND policyname = 'Store owners can manage policies'
  ) THEN
    CREATE POLICY "Store owners can manage policies" ON public.return_policies
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = return_policies.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour return_refunds
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'return_refunds' AND policyname = 'Users can view own refunds'
  ) THEN
    CREATE POLICY "Users can view own refunds" ON public.return_refunds
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.product_returns pr
          WHERE pr.id = return_refunds.return_id
          AND pr.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'return_refunds' AND policyname = 'Store owners can manage refunds'
  ) THEN
    CREATE POLICY "Store owners can manage refunds" ON public.return_refunds
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.product_returns pr
          JOIN public.stores s ON s.id = pr.store_id
          WHERE pr.id = return_refunds.return_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- 5. FUNCTIONS
-- =====================================================

-- Function: Generate return number
CREATE OR REPLACE FUNCTION public.generate_return_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_number TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_number := 'RMA-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    SELECT EXISTS(SELECT 1 FROM public.product_returns WHERE return_number = v_number) INTO v_exists;
    
    IF NOT v_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_number;
END;
$$;

-- Function: Check if return is within window
CREATE OR REPLACE FUNCTION public.check_return_window(
  p_order_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_policy RECORD;
  v_deadline TIMESTAMPTZ;
BEGIN
  -- Récupérer la commande
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Récupérer la politique de retour par défaut
  SELECT * INTO v_policy
  FROM public.return_policies
  WHERE store_id = v_order.store_id
  AND is_active = true
  AND (is_default = true OR id = (
    SELECT id FROM public.return_policies
    WHERE store_id = v_order.store_id
    AND is_active = true
    ORDER BY is_default DESC, created_at DESC
    LIMIT 1
  ))
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Politique par défaut : 30 jours
    v_deadline := v_order.delivered_at + INTERVAL '30 days';
  ELSE
    v_deadline := v_order.delivered_at + (v_policy.return_window_days || ' days')::INTERVAL;
  END IF;
  
  RETURN v_deadline >= now();
END;
$$;

-- Function: Calculate return deadline
CREATE OR REPLACE FUNCTION public.calculate_return_deadline(
  p_order_id UUID,
  p_store_id UUID
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_policy RECORD;
  v_deadline TIMESTAMPTZ;
BEGIN
  -- Récupérer la commande
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Si pas encore livré, retourner NULL
  IF v_order.delivered_at IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Récupérer la politique
  SELECT * INTO v_policy
  FROM public.return_policies
  WHERE store_id = p_store_id
  AND is_active = true
  AND (is_default = true OR id = (
    SELECT id FROM public.return_policies
    WHERE store_id = p_store_id
    AND is_active = true
    ORDER BY is_default DESC, created_at DESC
    LIMIT 1
  ))
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Par défaut : 30 jours
    v_deadline := v_order.delivered_at + INTERVAL '30 days';
  ELSE
    v_deadline := v_order.delivered_at + (v_policy.return_window_days || ' days')::INTERVAL;
  END IF;
  
  RETURN v_deadline;
END;
$$;

-- Function: Auto-update stock on return received
CREATE OR REPLACE FUNCTION public.auto_update_stock_on_return_received()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_return RECORD;
  v_inventory_item RECORD;
BEGIN
  -- Si le statut passe à 'return_received'
  IF NEW.status = 'return_received' AND OLD.status != 'return_received' THEN
    -- Trouver l'item d'inventaire
    IF NEW.variant_id IS NOT NULL THEN
      SELECT * INTO v_inventory_item
      FROM public.inventory_items
      WHERE variant_id = NEW.variant_id
      LIMIT 1;
    ELSIF NEW.product_id IS NOT NULL THEN
      SELECT * INTO v_inventory_item
      FROM public.inventory_items
      WHERE physical_product_id IN (
        SELECT id FROM public.physical_products WHERE product_id = NEW.product_id
      )
      LIMIT 1;
    END IF;
    
    -- Réintégrer le stock
    IF v_inventory_item IS NOT NULL THEN
      UPDATE public.inventory_items
      SET quantity_available = quantity_available + NEW.quantity,
          updated_at = now()
      WHERE id = v_inventory_item.id;
      
      -- Créer un mouvement de stock
      INSERT INTO public.stock_movements (
        inventory_item_id,
        movement_type,
        quantity,
        reason,
        notes
      ) VALUES (
        v_inventory_item.id,
        'return',
        NEW.quantity,
        'Return received',
        'Auto-generated from return ' || NEW.return_number
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger pour auto-update stock
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_auto_update_stock_on_return'
  ) THEN
    CREATE TRIGGER trigger_auto_update_stock_on_return
      AFTER UPDATE OF status ON public.product_returns
      FOR EACH ROW
      EXECUTE FUNCTION public.auto_update_stock_on_return_received();
  END IF;
END $$;

-- =====================================================
-- 6. COMMENTS
-- =====================================================
COMMENT ON TABLE public.product_returns IS 'Demandes de retour produits physiques (RMA)';
COMMENT ON TABLE public.return_policies IS 'Politiques de retour configurables par store';
COMMENT ON TABLE public.return_refunds IS 'Remboursements liés aux retours';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

