-- =====================================================
-- PAYHUK WARRANTIES & GUARANTEES SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système de gestion des garanties et warranties pour produits physiques
--              Suivi des réclamations, réparations et remplacements
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: product_warranties
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_warranties'
  ) THEN
    CREATE TABLE public.product_warranties (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
      
      -- Informations garantie
      warranty_type TEXT NOT NULL CHECK (warranty_type IN (
        'manufacturer',  -- Garantie constructeur
        'store',         -- Garantie magasin
        'extended',      -- Garantie étendue
        'international'  -- Garantie internationale
      )),
      warranty_name TEXT NOT NULL, -- Nom de la garantie
      description TEXT,
      
      -- Durée
      duration_months INTEGER NOT NULL, -- Durée en mois
      starts_from TEXT DEFAULT 'purchase' CHECK (starts_from IN ('purchase', 'manufacture', 'delivery')),
      
      -- Couverture
      coverage_type TEXT NOT NULL CHECK (coverage_type IN (
        'full',         -- Couverture complète
        'parts_only',   -- Pièces uniquement
        'labor_only',   -- Main d'œuvre uniquement
        'partial'       -- Partielle
      )),
      coverage_details JSONB DEFAULT '{}', -- Détails de couverture
      
      -- Conditions
      conditions TEXT, -- Conditions de la garantie
      exclusions TEXT, -- Exclusions
      requires_registration BOOLEAN DEFAULT false, -- Nécessite enregistrement
      requires_invoice BOOLEAN DEFAULT true, -- Nécessite facture
      
      -- Transfert
      transferable BOOLEAN DEFAULT false, -- Transférable
      transfer_fee NUMERIC DEFAULT 0, -- Frais de transfert
      
      -- Statut
      is_active BOOLEAN DEFAULT true,
      is_default BOOLEAN DEFAULT false, -- Garantie par défaut
      
      -- Métadonnées
      terms_url TEXT, -- URL des conditions générales
      support_contact TEXT, -- Contact support
      support_email TEXT,
      support_phone TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour product_warranties
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_warranties_store_id'
  ) THEN
    CREATE INDEX idx_product_warranties_store_id ON public.product_warranties(store_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_warranties_product_id'
  ) THEN
    CREATE INDEX idx_product_warranties_product_id ON public.product_warranties(product_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_warranties_active'
  ) THEN
    CREATE INDEX idx_product_warranties_active ON public.product_warranties(is_active);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_warranties_updated_at'
  ) THEN
    CREATE TRIGGER update_product_warranties_updated_at
      BEFORE UPDATE ON public.product_warranties
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: warranty_registrations
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'warranty_registrations'
  ) THEN
    CREATE TABLE public.warranty_registrations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      warranty_id UUID NOT NULL REFERENCES public.product_warranties(id) ON DELETE CASCADE,
      order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
      order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Informations produit
      product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
      
      -- Informations enregistrement
      registration_number TEXT UNIQUE NOT NULL, -- Numéro d'enregistrement
      serial_number TEXT, -- Numéro de série
      purchase_date TIMESTAMPTZ NOT NULL,
      purchase_price NUMERIC,
      invoice_url TEXT, -- URL de la facture
      
      -- Dates garantie
      warranty_start_date TIMESTAMPTZ NOT NULL,
      warranty_end_date TIMESTAMPTZ NOT NULL,
      is_expired BOOLEAN DEFAULT false,
      
      -- Statut
      status TEXT NOT NULL CHECK (status IN (
        'active',       -- Active
        'expired',      -- Expirée
        'cancelled',    -- Annulée
        'transferred'   -- Transférée
      )) DEFAULT 'active',
      
      -- Informations client
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      customer_address JSONB, -- Adresse complète
      
      -- Métadonnées
      registration_data JSONB DEFAULT '{}', -- Données supplémentaires
      notes TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour warranty_registrations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warranty_registrations_warranty_id'
  ) THEN
    CREATE INDEX idx_warranty_registrations_warranty_id ON public.warranty_registrations(warranty_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warranty_registrations_order_id'
  ) THEN
    CREATE INDEX idx_warranty_registrations_order_id ON public.warranty_registrations(order_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warranty_registrations_user_id'
  ) THEN
    CREATE INDEX idx_warranty_registrations_user_id ON public.warranty_registrations(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warranty_registrations_status'
  ) THEN
    CREATE INDEX idx_warranty_registrations_status ON public.warranty_registrations(status);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warranty_registrations_end_date'
  ) THEN
    CREATE INDEX idx_warranty_registrations_end_date ON public.warranty_registrations(warranty_end_date);
  END IF;
END $$;

-- Fonction pour mettre à jour is_expired (doit être créée avant le trigger)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_warranty_expired_status'
  ) THEN
    DROP FUNCTION public.update_warranty_expired_status();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_warranty_expired_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_expired := NEW.warranty_end_date < now();
  RETURN NEW;
END;
$$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_warranty_registrations_updated_at'
  ) THEN
    CREATE TRIGGER update_warranty_registrations_updated_at
      BEFORE UPDATE ON public.warranty_registrations
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Trigger pour mettre à jour is_expired
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_warranty_registrations_expired'
  ) THEN
    CREATE TRIGGER update_warranty_registrations_expired
      BEFORE INSERT OR UPDATE ON public.warranty_registrations
      FOR EACH ROW
      EXECUTE FUNCTION public.update_warranty_expired_status();
  END IF;
END $$;

-- =====================================================
-- 3. TABLE: warranty_claims
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'warranty_claims'
  ) THEN
    CREATE TABLE public.warranty_claims (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      registration_id UUID NOT NULL REFERENCES public.warranty_registrations(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      
      -- Réclamation
      claim_number TEXT UNIQUE NOT NULL, -- Numéro de réclamation
      claim_type TEXT NOT NULL CHECK (claim_type IN (
        'repair',       -- Réparation
        'replacement',  -- Remplacement
        'refund',       -- Remboursement
        'credit'        -- Crédit store
      )),
      description TEXT NOT NULL, -- Description du problème
      issue_category TEXT, -- Catégorie du problème
      
      -- Statut
      status TEXT NOT NULL CHECK (status IN (
        'submitted',      -- Soumis
        'under_review',   -- En révision
        'approved',       -- Approuvé
        'rejected',       -- Rejeté
        'in_progress',    -- En cours
        'completed',      -- Terminé
        'cancelled'       -- Annulé
      )) DEFAULT 'submitted',
      
      -- Dates
      submitted_date TIMESTAMPTZ NOT NULL DEFAULT now(),
      review_date TIMESTAMPTZ,
      approved_date TIMESTAMPTZ,
      completed_date TIMESTAMPTZ,
      
      -- Responsables
      reviewed_by UUID REFERENCES auth.users(id),
      approved_by UUID REFERENCES auth.users(id),
      
      -- Résolution
      resolution TEXT, -- Résolution appliquée
      resolution_notes TEXT, -- Notes sur la résolution
      cost_covered NUMERIC DEFAULT 0, -- Coût couvert
      customer_cost NUMERIC DEFAULT 0, -- Coût client
      
      -- Preuves
      photos TEXT[], -- URLs des photos
      documents TEXT[], -- URLs des documents
      
      -- Métadonnées
      priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
      notes TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour warranty_claims
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warranty_claims_registration_id'
  ) THEN
    CREATE INDEX idx_warranty_claims_registration_id ON public.warranty_claims(registration_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warranty_claims_user_id'
  ) THEN
    CREATE INDEX idx_warranty_claims_user_id ON public.warranty_claims(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warranty_claims_status'
  ) THEN
    CREATE INDEX idx_warranty_claims_status ON public.warranty_claims(status);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_warranty_claims_updated_at'
  ) THEN
    CREATE TRIGGER update_warranty_claims_updated_at
      BEFORE UPDATE ON public.warranty_claims
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 4. TABLE: warranty_repairs
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'warranty_repairs'
  ) THEN
    CREATE TABLE public.warranty_repairs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      claim_id UUID NOT NULL REFERENCES public.warranty_claims(id) ON DELETE CASCADE,
      
      -- Réparation
      repair_type TEXT NOT NULL CHECK (repair_type IN (
        'in_house',     -- Réparation interne
        'authorized',  -- Réparation autorisée
        'third_party'  -- Réparation tiers
      )),
      repair_center TEXT, -- Centre de réparation
      
      -- Statut
      status TEXT NOT NULL CHECK (status IN (
        'scheduled',   -- Programmée
        'in_progress', -- En cours
        'completed',   -- Terminée
        'failed'       -- Échouée
      )) DEFAULT 'scheduled',
      
      -- Dates
      scheduled_date TIMESTAMPTZ,
      started_date TIMESTAMPTZ,
      completed_date TIMESTAMPTZ,
      estimated_completion_date TIMESTAMPTZ,
      
      -- Coûts
      estimated_cost NUMERIC,
      actual_cost NUMERIC,
      parts_cost NUMERIC,
      labor_cost NUMERIC,
      
      -- Détails
      work_description TEXT, -- Description des travaux
      parts_used JSONB DEFAULT '[]', -- Pièces utilisées
      technician_notes TEXT,
      
      -- Métadonnées
      tracking_number TEXT, -- Numéro de suivi
      notes TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour warranty_repairs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_warranty_repairs_claim_id'
  ) THEN
    CREATE INDEX idx_warranty_repairs_claim_id ON public.warranty_repairs(claim_id);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_warranty_repairs_updated_at'
  ) THEN
    CREATE TRIGGER update_warranty_repairs_updated_at
      BEFORE UPDATE ON public.warranty_repairs
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 5. FUNCTIONS
-- =====================================================

-- Fonction pour générer numéro d'enregistrement garantie
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'generate_warranty_registration_number'
  ) THEN
    DROP FUNCTION public.generate_warranty_registration_number();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.generate_warranty_registration_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_number TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_number := 'WRN-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    SELECT EXISTS(SELECT 1 FROM public.warranty_registrations WHERE registration_number = v_number) INTO v_exists;
    
    IF NOT v_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_number;
END;
$$;

-- Fonction pour générer numéro de réclamation
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'generate_warranty_claim_number'
  ) THEN
    DROP FUNCTION public.generate_warranty_claim_number();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.generate_warranty_claim_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_number TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_number := 'WCL-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    SELECT EXISTS(SELECT 1 FROM public.warranty_claims WHERE claim_number = v_number) INTO v_exists;
    
    IF NOT v_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_number;
END;
$$;

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS
ALTER TABLE public.product_warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_repairs ENABLE ROW LEVEL SECURITY;

-- Policies pour product_warranties
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_warranties' AND policyname = 'Store owners can manage warranties'
  ) THEN
    CREATE POLICY "Store owners can manage warranties" ON public.product_warranties
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = product_warranties.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_warranties' AND policyname = 'Anyone can view active warranties'
  ) THEN
    CREATE POLICY "Anyone can view active warranties" ON public.product_warranties
      FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

-- Policies pour warranty_registrations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'warranty_registrations' AND policyname = 'Users can manage own registrations'
  ) THEN
    CREATE POLICY "Users can manage own registrations" ON public.warranty_registrations
      FOR ALL
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'warranty_registrations' AND policyname = 'Store owners can view registrations'
  ) THEN
    CREATE POLICY "Store owners can view registrations" ON public.warranty_registrations
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          JOIN public.product_warranties pw ON pw.store_id = s.id
          WHERE pw.id = warranty_registrations.warranty_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour warranty_claims
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'warranty_claims' AND policyname = 'Users can manage own claims'
  ) THEN
    CREATE POLICY "Users can manage own claims" ON public.warranty_claims
      FOR ALL
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'warranty_claims' AND policyname = 'Store owners can manage claims'
  ) THEN
    CREATE POLICY "Store owners can manage claims" ON public.warranty_claims
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = warranty_claims.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour warranty_repairs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'warranty_repairs' AND policyname = 'Store owners can manage repairs'
  ) THEN
    CREATE POLICY "Store owners can manage repairs" ON public.warranty_repairs
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.warranty_claims wc
          JOIN public.stores s ON s.id = wc.store_id
          WHERE wc.id = warranty_repairs.claim_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'warranty_repairs' AND policyname = 'Users can view own repairs'
  ) THEN
    CREATE POLICY "Users can view own repairs" ON public.warranty_repairs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.warranty_claims wc
          WHERE wc.id = warranty_repairs.claim_id
          AND wc.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

