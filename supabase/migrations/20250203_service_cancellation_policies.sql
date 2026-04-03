-- =====================================================
-- EMARZONA SERVICE CANCELLATION POLICIES
-- Date: 3 Février 2025
-- Description: Système de politiques d'annulation et remboursements automatiques pour services
-- =====================================================

-- =====================================================
-- 1. TABLE: service_cancellation_policies
-- =====================================================
CREATE TABLE IF NOT EXISTS public.service_cancellation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  store_id UUID NOT NULL,
  
  -- Nom de la politique
  policy_name TEXT NOT NULL DEFAULT 'Politique d''annulation par défaut',
  
  -- Règles de remboursement par timing
  -- Structure JSONB: [{hours_before: 48, refund_percentage: 100}, ...]
  refund_rules JSONB NOT NULL DEFAULT '[
    {"hours_before": 48, "refund_percentage": 100, "description": "Remboursement complet si annulation plus de 48h avant"},
    {"hours_before": 24, "refund_percentage": 50, "description": "Remboursement 50% si annulation entre 24h et 48h avant"},
    {"hours_before": 0, "refund_percentage": 0, "description": "Pas de remboursement si annulation moins de 24h avant"}
  ]'::jsonb,
  
  -- Règles spéciales
  allow_same_day_cancellation BOOLEAN DEFAULT false,
  same_day_refund_percentage NUMERIC DEFAULT 0,
  
  allow_emergency_cancellation BOOLEAN DEFAULT true,
  emergency_refund_percentage NUMERIC DEFAULT 100,
  emergency_reasons TEXT[], -- ['medical', 'death', 'accident', 'other']
  
  -- Frais d'annulation
  cancellation_fee_enabled BOOLEAN DEFAULT false,
  cancellation_fee_amount NUMERIC DEFAULT 0,
  cancellation_fee_percentage NUMERIC DEFAULT 0,
  
  -- Crédit store au lieu de remboursement
  allow_store_credit BOOLEAN DEFAULT true,
  store_credit_bonus_percentage NUMERIC DEFAULT 0, -- Bonus si crédit store choisi
  
  -- Délai de traitement
  refund_processing_days INTEGER DEFAULT 5, -- Jours pour traiter le remboursement
  
  -- Auto-refund
  auto_refund_enabled BOOLEAN DEFAULT false, -- Remboursement automatique si conditions remplies
  auto_refund_minimum_hours INTEGER DEFAULT 48, -- Heures minimum pour auto-refund
  
  -- Statut
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(product_id)
);

-- Ajouter les foreign keys si les tables existent
DO $$ 
BEGIN
  -- Foreign key vers products
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'service_cancellation_policies'
      AND constraint_name = 'fk_service_cancellation_policies_product_id'
    ) THEN
      ALTER TABLE public.service_cancellation_policies
      ADD CONSTRAINT fk_service_cancellation_policies_product_id 
        FOREIGN KEY (product_id) 
        REFERENCES public.products(id) 
        ON DELETE CASCADE;
    END IF;
  END IF;
  
  -- Foreign key vers stores
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stores') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'service_cancellation_policies'
      AND constraint_name = 'fk_service_cancellation_policies_store_id'
    ) THEN
      ALTER TABLE public.service_cancellation_policies
      ADD CONSTRAINT fk_service_cancellation_policies_store_id 
        FOREIGN KEY (store_id) 
        REFERENCES public.stores(id) 
        ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_cancellation_policies_product_id ON public.service_cancellation_policies(product_id);
CREATE INDEX IF NOT EXISTS idx_service_cancellation_policies_store_id ON public.service_cancellation_policies(store_id);
CREATE INDEX IF NOT EXISTS idx_service_cancellation_policies_active ON public.service_cancellation_policies(is_active);

-- =====================================================
-- 2. TABLE: service_cancellation_refunds
-- =====================================================
CREATE TABLE IF NOT EXISTS public.service_cancellation_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  policy_id UUID,
  
  -- Calculs
  original_amount NUMERIC NOT NULL,
  refund_percentage NUMERIC NOT NULL,
  refund_amount NUMERIC NOT NULL,
  cancellation_fee NUMERIC DEFAULT 0,
  net_refund_amount NUMERIC NOT NULL, -- Montant final après frais
  
  -- Méthode de remboursement
  refund_method TEXT NOT NULL CHECK (refund_method IN (
    'original_payment',  -- Méthode paiement originale
    'store_credit',      -- Crédit store
    'bank_transfer',     -- Virement bancaire
    'check'              -- Chèque
  )) DEFAULT 'original_payment',
  
  -- Timing
  hours_before_service NUMERIC NOT NULL, -- Heures avant le service
  cancellation_reason TEXT,
  is_emergency BOOLEAN DEFAULT false,
  emergency_reason TEXT,
  
  -- Références paiement
  original_order_id UUID,
  original_payment_id TEXT,
  refund_transaction_id TEXT,
  
  -- Statut
  status TEXT NOT NULL CHECK (status IN (
    'pending',       -- En attente
    'processing',    -- En traitement
    'completed',     -- Complété
    'failed',        -- Échoué
    'cancelled'      -- Annulé
  )) DEFAULT 'pending',
  
  -- Dates
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Notes
  admin_notes TEXT,
  customer_notes TEXT,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_cancellation_refunds_booking_id ON public.service_cancellation_refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_service_cancellation_refunds_status ON public.service_cancellation_refunds(status);
CREATE INDEX IF NOT EXISTS idx_service_cancellation_refunds_original_order_id ON public.service_cancellation_refunds(original_order_id);

-- Ajouter les foreign keys si les tables existent
DO $$ 
BEGIN
  -- Foreign key vers service_bookings
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_bookings') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'service_cancellation_refunds'
      AND constraint_name = 'fk_service_cancellation_refunds_booking_id'
    ) THEN
      ALTER TABLE public.service_cancellation_refunds
      ADD CONSTRAINT fk_service_cancellation_refunds_booking_id 
        FOREIGN KEY (booking_id) 
        REFERENCES public.service_bookings(id) 
        ON DELETE CASCADE;
    END IF;
  END IF;
  
  -- Foreign key vers service_cancellation_policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_cancellation_policies') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'service_cancellation_refunds'
      AND constraint_name = 'fk_service_cancellation_refunds_policy_id'
    ) THEN
      ALTER TABLE public.service_cancellation_refunds
      ADD CONSTRAINT fk_service_cancellation_refunds_policy_id 
        FOREIGN KEY (policy_id) 
        REFERENCES public.service_cancellation_policies(id) 
        ON DELETE SET NULL;
    END IF;
  END IF;
  
  -- Foreign key vers orders
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'service_cancellation_refunds'
      AND constraint_name = 'fk_service_cancellation_refunds_order_id'
    ) THEN
      ALTER TABLE public.service_cancellation_refunds
      ADD CONSTRAINT fk_service_cancellation_refunds_order_id 
        FOREIGN KEY (original_order_id) 
        REFERENCES public.orders(id) 
        ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- =====================================================
-- 3. FUNCTIONS
-- =====================================================

-- Fonction pour calculer le remboursement automatique
CREATE OR REPLACE FUNCTION calculate_service_refund(
  p_booking_id UUID,
  p_cancellation_reason TEXT DEFAULT NULL,
  p_is_emergency BOOLEAN DEFAULT false
)
RETURNS TABLE (
  refund_percentage NUMERIC,
  refund_amount NUMERIC,
  cancellation_fee NUMERIC,
  net_refund_amount NUMERIC,
  hours_before_service NUMERIC,
  applicable_rule JSONB
) AS $$
DECLARE
  v_booking RECORD;
  v_policy RECORD;
  v_service_datetime TIMESTAMPTZ;
  v_hours_before NUMERIC;
  v_refund_rule JSONB;
  v_refund_percentage NUMERIC := 0;
  v_refund_amount NUMERIC := 0;
  v_cancellation_fee NUMERIC := 0;
  v_net_refund_amount NUMERIC := 0;
  v_original_amount NUMERIC;
  v_service_price NUMERIC := 0;
  v_order_amount NUMERIC := 0;
BEGIN
  -- Vérifier si les tables nécessaires existent
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_bookings') THEN
    RAISE EXCEPTION 'Table service_bookings does not exist';
  END IF;
  
  -- Récupérer la réservation
  SELECT sb.* INTO v_booking
  FROM public.service_bookings sb
  WHERE sb.id = p_booking_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  
  -- Récupérer le prix du service si la table products existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    SELECT COALESCE(price, 0) INTO v_service_price
    FROM public.products
    WHERE id = v_booking.product_id
    LIMIT 1;
  END IF;
  
  -- Récupérer le montant de la commande si les tables existent
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    SELECT COALESCE(o.total_amount, 0) INTO v_order_amount
    FROM public.orders o
    INNER JOIN public.order_items oi ON oi.order_id = o.id
    WHERE oi.product_id = v_booking.product_id 
    AND oi.product_type = 'service'
    LIMIT 1;
  END IF;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  
  -- Récupérer la politique d'annulation
  SELECT * INTO v_policy
  FROM public.service_cancellation_policies
  WHERE product_id = v_booking.product_id
    AND is_active = true
  ORDER BY is_default DESC, created_at DESC
  LIMIT 1;
  
  -- Si pas de politique, utiliser les valeurs par défaut
  IF NOT FOUND THEN
    v_policy.refund_rules := '[
      {"hours_before": 48, "refund_percentage": 100},
      {"hours_before": 24, "refund_percentage": 50},
      {"hours_before": 0, "refund_percentage": 0}
    ]'::jsonb;
    v_policy.cancellation_fee_enabled := false;
    v_policy.cancellation_fee_amount := 0;
    v_policy.cancellation_fee_percentage := 0;
  END IF;
  
  -- Calculer les heures avant le service
  v_service_datetime := (v_booking.scheduled_date || ' ' || v_booking.scheduled_start_time)::TIMESTAMPTZ;
  v_hours_before := EXTRACT(EPOCH FROM (v_service_datetime - NOW())) / 3600;
  
  -- Vérifier si annulation d'urgence
  IF p_is_emergency AND v_policy.allow_emergency_cancellation THEN
    v_refund_percentage := v_policy.emergency_refund_percentage;
    v_refund_rule := jsonb_build_object(
      'type', 'emergency',
      'refund_percentage', v_refund_percentage,
      'description', 'Annulation d''urgence'
    );
  ELSE
    -- Trouver la règle applicable
    SELECT rule INTO v_refund_rule
    FROM jsonb_array_elements(v_policy.refund_rules) AS rule
    WHERE (rule->>'hours_before')::NUMERIC <= v_hours_before
    ORDER BY (rule->>'hours_before')::NUMERIC DESC
    LIMIT 1;
    
    IF v_refund_rule IS NOT NULL THEN
      v_refund_percentage := (v_refund_rule->>'refund_percentage')::NUMERIC;
    END IF;
  END IF;
  
  -- Calculer le montant original
  v_original_amount := COALESCE(v_order_amount, v_service_price, 0);
  
  -- Calculer le remboursement
  v_refund_amount := v_original_amount * (v_refund_percentage / 100);
  
  -- Calculer les frais d'annulation
  IF v_policy.cancellation_fee_enabled THEN
    IF v_policy.cancellation_fee_amount > 0 THEN
      v_cancellation_fee := v_policy.cancellation_fee_amount;
    ELSIF v_policy.cancellation_fee_percentage > 0 THEN
      v_cancellation_fee := v_original_amount * (v_policy.cancellation_fee_percentage / 100);
    END IF;
  END IF;
  
  -- Montant net après frais
  v_net_refund_amount := GREATEST(0, v_refund_amount - v_cancellation_fee);
  
  RETURN QUERY SELECT
    v_refund_percentage,
    v_refund_amount,
    v_cancellation_fee,
    v_net_refund_amount,
    v_hours_before,
    v_refund_rule;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER update_service_cancellation_policies_updated_at
  BEFORE UPDATE ON public.service_cancellation_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_cancellation_refunds_updated_at
  BEFORE UPDATE ON public.service_cancellation_refunds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

ALTER TABLE public.service_cancellation_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_cancellation_refunds ENABLE ROW LEVEL SECURITY;

-- Créer les RLS policies seulement si les tables nécessaires existent
DO $$ 
BEGIN
  -- Store owners can manage their cancellation policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stores') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'service_cancellation_policies'
      AND policyname = 'Store owners can manage cancellation policies'
    ) THEN
      EXECUTE '
        CREATE POLICY "Store owners can manage cancellation policies"
          ON public.service_cancellation_policies
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM public.stores
              WHERE stores.id = service_cancellation_policies.store_id
              AND (stores.user_id = auth.uid() OR stores.owner_id = auth.uid())
            )
          )';
    END IF;
  END IF;

  -- Users can view their own refunds
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_bookings') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'service_cancellation_refunds'
      AND policyname = 'Users can view their own refunds'
    ) THEN
      EXECUTE '
        CREATE POLICY "Users can view their own refunds"
          ON public.service_cancellation_refunds
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM public.service_bookings
              WHERE service_bookings.id = service_cancellation_refunds.booking_id
              AND service_bookings.user_id = auth.uid()
            )
          )';
    END IF;
  END IF;

  -- Store owners can manage refunds for their services
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stores')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_bookings') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'service_cancellation_refunds'
      AND policyname = 'Store owners can manage refunds'
    ) THEN
      EXECUTE '
        CREATE POLICY "Store owners can manage refunds"
          ON public.service_cancellation_refunds
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM public.service_bookings sb
              INNER JOIN public.products p ON p.id = sb.product_id
              INNER JOIN public.stores s ON s.id = p.store_id
              WHERE sb.id = service_cancellation_refunds.booking_id
              AND (s.user_id = auth.uid() OR s.owner_id = auth.uid())
            )
          )';
    END IF;
  END IF;
END $$;

-- =====================================================
-- 5. COMMENTS
-- =====================================================

COMMENT ON TABLE public.service_cancellation_policies IS 'Politiques d''annulation configurable par service';
COMMENT ON TABLE public.service_cancellation_refunds IS 'Historique des remboursements pour annulations de services';
COMMENT ON FUNCTION calculate_service_refund IS 'Calcule automatiquement le montant de remboursement selon la politique et le timing';

