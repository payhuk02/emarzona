-- =====================================================
-- EMARZONA WARRANTY SYSTEM
-- Date: 31 Janvier 2025
-- Description: Système complet de gestion des garanties pour produits physiques
--              Enregistrement, suivi, réclamations, expiration
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: product_warranties
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  
  -- Numéro de garantie
  warranty_number TEXT UNIQUE NOT NULL,
  
  -- Type de garantie
  warranty_type TEXT NOT NULL CHECK (warranty_type IN (
    'manufacturer',  -- Garantie constructeur
    'store',        -- Garantie boutique
    'extended',     -- Garantie étendue
    'insurance'     -- Assurance
  )) DEFAULT 'manufacturer',
  
  -- Durée
  duration_months INTEGER NOT NULL DEFAULT 12,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  
  -- Couverture
  coverage_description TEXT,
  coverage_items JSONB DEFAULT '[]'::jsonb, -- Liste des éléments couverts
  
  -- Conditions
  terms_and_conditions TEXT,
  exclusions TEXT[] DEFAULT '[]'::text[], -- Exclusions
  
  -- Statut
  status TEXT NOT NULL CHECK (status IN (
    'active',       -- Active
    'expired',      -- Expirée
    'voided',       -- Annulée
    'transferred'   -- Transférée
  )) DEFAULT 'active',
  
  -- Informations produit
  serial_number TEXT, -- Numéro de série si applicable
  purchase_date DATE NOT NULL,
  purchase_price NUMERIC NOT NULL,
  
  -- Documents
  warranty_document_url TEXT, -- PDF du document de garantie
  receipt_url TEXT, -- Reçu d'achat
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT valid_duration CHECK (duration_months > 0),
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_warranties_store_id ON public.product_warranties(store_id);
CREATE INDEX IF NOT EXISTS idx_warranties_user_id ON public.product_warranties(user_id);
CREATE INDEX IF NOT EXISTS idx_warranties_product_id ON public.product_warranties(product_id);
CREATE INDEX IF NOT EXISTS idx_warranties_order_id ON public.product_warranties(order_id);
CREATE INDEX IF NOT EXISTS idx_warranties_status ON public.product_warranties(status);
CREATE INDEX IF NOT EXISTS idx_warranties_end_date ON public.product_warranties(end_date);
CREATE INDEX IF NOT EXISTS idx_warranties_warranty_number ON public.product_warranties(warranty_number);

-- =====================================================
-- 2. TABLE: warranty_claims
-- =====================================================

CREATE TABLE IF NOT EXISTS public.warranty_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_id UUID NOT NULL REFERENCES public.product_warranties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Numéro de réclamation
  claim_number TEXT UNIQUE NOT NULL,
  
  -- Type de réclamation
  claim_type TEXT NOT NULL CHECK (claim_type IN (
    'repair',       -- Réparation
    'replacement', -- Remplacement
    'refund'        -- Remboursement
  )),
  
  -- Description
  description TEXT NOT NULL,
  issue_details TEXT,
  
  -- Photos/Preuves
  photos TEXT[] DEFAULT '[]'::text[],
  documents TEXT[] DEFAULT '[]'::text[],
  
  -- Statut
  status TEXT NOT NULL CHECK (status IN (
    'submitted',    -- Soumise
    'under_review', -- En révision
    'approved',     -- Approuvée
    'rejected',     -- Rejetée
    'in_progress',  -- En cours
    'completed',    -- Complétée
    'cancelled'     -- Annulée
  )) DEFAULT 'submitted',
  
  -- Résolution
  resolution_type TEXT CHECK (resolution_type IN (
    'repaired',
    'replaced',
    'refunded',
    'denied'
  )),
  resolution_notes TEXT,
  resolution_date TIMESTAMPTZ,
  
  -- Coûts
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  customer_paid NUMERIC DEFAULT 0,
  
  -- Dates
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_warranty_claims_warranty_id ON public.warranty_claims(warranty_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_user_id ON public.warranty_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_status ON public.warranty_claims(status);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_claim_number ON public.warranty_claims(claim_number);

-- =====================================================
-- 3. TABLE: warranty_history
-- =====================================================

CREATE TABLE IF NOT EXISTS public.warranty_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_id UUID NOT NULL REFERENCES public.product_warranties(id) ON DELETE CASCADE,
  
  -- Action
  action TEXT NOT NULL CHECK (action IN (
    'created',
    'activated',
    'extended',
    'transferred',
    'expired',
    'voided',
    'claim_submitted',
    'claim_approved',
    'claim_rejected',
    'claim_completed'
  )),
  
  -- Détails
  description TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_warranty_history_warranty_id ON public.warranty_history(warranty_id);
CREATE INDEX IF NOT EXISTS idx_warranty_history_action ON public.warranty_history(action);

-- =====================================================
-- 4. FUNCTIONS
-- =====================================================

-- Fonction pour générer un numéro de garantie
CREATE OR REPLACE FUNCTION generate_warranty_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'WAR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
         UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer la date de fin
CREATE OR REPLACE FUNCTION calculate_warranty_end_date(
  p_start_date DATE,
  p_duration_months INTEGER
)
RETURNS DATE AS $$
BEGIN
  RETURN p_start_date + (p_duration_months || ' months')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si une garantie est active
CREATE OR REPLACE FUNCTION is_warranty_active(p_warranty_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_status TEXT;
  v_end_date DATE;
BEGIN
  SELECT status, end_date INTO v_status, v_end_date
  FROM public.product_warranties
  WHERE id = p_warranty_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  RETURN v_status = 'active' AND v_end_date >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer un numéro de réclamation
CREATE OR REPLACE FUNCTION generate_claim_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'CLM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
         UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement end_date
CREATE OR REPLACE FUNCTION set_warranty_end_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date IS NULL OR NEW.end_date = OLD.end_date THEN
    NEW.end_date := calculate_warranty_end_date(
      COALESCE(NEW.start_date, CURRENT_DATE),
      NEW.duration_months
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_warranty_end_date
  BEFORE INSERT OR UPDATE ON public.product_warranties
  FOR EACH ROW
  EXECUTE FUNCTION set_warranty_end_date();

-- Trigger pour updated_at
CREATE TRIGGER update_product_warranties_updated_at
  BEFORE UPDATE ON public.product_warranties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warranty_claims_updated_at
  BEFORE UPDATE ON public.warranty_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour créer historique
CREATE OR REPLACE FUNCTION create_warranty_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.warranty_history (
    warranty_id,
    action,
    description,
    performed_by,
    metadata
  )
  VALUES (
    NEW.id,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN NEW.status = 'expired' THEN 'expired'
      WHEN NEW.status = 'voided' THEN 'voided'
      WHEN NEW.status = 'transferred' THEN 'transferred'
      ELSE 'activated'
    END,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'Garantie créée'
      WHEN NEW.status = 'expired' THEN 'Garantie expirée'
      WHEN NEW.status = 'voided' THEN 'Garantie annulée'
      WHEN NEW.status = 'transferred' THEN 'Garantie transférée'
      ELSE 'Garantie activée'
    END,
    auth.uid(),
    jsonb_build_object(
      'warranty_number', NEW.warranty_number,
      'status', NEW.status,
      'duration_months', NEW.duration_months
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_warranty_history
  AFTER INSERT OR UPDATE ON public.product_warranties
  FOR EACH ROW
  EXECUTE FUNCTION create_warranty_history();

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

ALTER TABLE public.product_warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_history ENABLE ROW LEVEL SECURITY;

-- Clients peuvent voir leurs propres garanties
DROP POLICY IF EXISTS "Customers can view own warranties" ON public.product_warranties;
CREATE POLICY "Customers can view own warranties"
ON public.product_warranties FOR SELECT
USING (auth.uid() = user_id);

-- Clients peuvent créer leurs propres garanties
DROP POLICY IF EXISTS "Customers can create own warranties" ON public.product_warranties;
CREATE POLICY "Customers can create own warranties"
ON public.product_warranties FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Vendeurs peuvent voir les garanties de leurs produits
DROP POLICY IF EXISTS "Store owners can view their warranties" ON public.product_warranties;
CREATE POLICY "Store owners can view their warranties"
ON public.product_warranties FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = product_warranties.store_id
    AND stores.user_id = auth.uid()
  )
);

-- Clients peuvent voir leurs propres réclamations
DROP POLICY IF EXISTS "Customers can view own claims" ON public.warranty_claims;
CREATE POLICY "Customers can view own claims"
ON public.warranty_claims FOR SELECT
USING (auth.uid() = user_id);

-- Clients peuvent créer leurs propres réclamations
DROP POLICY IF EXISTS "Customers can create own claims" ON public.warranty_claims;
CREATE POLICY "Customers can create own claims"
ON public.warranty_claims FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Vendeurs peuvent voir les réclamations de leurs garanties
DROP POLICY IF EXISTS "Store owners can view their warranty claims" ON public.warranty_claims;
CREATE POLICY "Store owners can view their warranty claims"
ON public.warranty_claims FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.product_warranties
    WHERE product_warranties.id = warranty_claims.warranty_id
    AND EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = product_warranties.store_id
      AND stores.user_id = auth.uid()
    )
  )
);

-- Historique visible selon les mêmes règles que les garanties
DROP POLICY IF EXISTS "Users can view warranty history" ON public.warranty_history;
CREATE POLICY "Users can view warranty history"
ON public.warranty_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.product_warranties
    WHERE product_warranties.id = warranty_history.warranty_id
    AND (
      (product_warranties.user_id IS NOT NULL AND product_warranties.user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = product_warranties.store_id
        AND stores.user_id = auth.uid()
      )
    )
  )
);

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE public.product_warranties IS 'Garanties produits physiques';
COMMENT ON TABLE public.warranty_claims IS 'Réclamations de garantie';
COMMENT ON TABLE public.warranty_history IS 'Historique des garanties';

