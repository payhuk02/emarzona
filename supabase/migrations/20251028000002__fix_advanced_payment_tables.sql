-- =====================================================================================
-- Migration: Fix Advanced Payment Tables
-- Date: 28 octobre 2025
-- Description: Crée les tables manquantes pour le système de paiements avancés
-- =====================================================================================

-- 1. Vérifier et créer la table secured_payments
CREATE TABLE IF NOT EXISTS public.secured_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  total_amount NUMERIC NOT NULL,
  held_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded', 'disputed')),
  hold_reason TEXT NOT NULL DEFAULT 'delivery_confirmation',
  release_conditions JSONB DEFAULT '{}'::jsonb,
  held_until TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  released_by UUID REFERENCES auth.users(id),
  dispute_opened_at TIMESTAMP WITH TIME ZONE,
  dispute_resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Créer les index pour secured_payments
CREATE INDEX IF NOT EXISTS idx_secured_payments_order_id ON public.secured_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_secured_payments_status ON public.secured_payments(status);
CREATE INDEX IF NOT EXISTS idx_secured_payments_payment_id ON public.secured_payments(payment_id);

-- 3. Ajouter les colonnes manquantes dans orders (si elles n'existent pas)
DO $$ 
BEGIN
    -- payment_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'payment_type'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN payment_type TEXT DEFAULT 'full' CHECK (payment_type IN ('full', 'percentage', 'delivery_secured'));
    END IF;

    -- percentage_paid
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'percentage_paid'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN percentage_paid NUMERIC DEFAULT 0;
    END IF;

    -- remaining_amount
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'remaining_amount'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN remaining_amount NUMERIC DEFAULT 0;
    END IF;

    -- delivery_status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'delivery_status'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN delivery_status TEXT DEFAULT 'pending' 
        CHECK (delivery_status IN ('pending', 'shipped', 'delivered', 'confirmed', 'disputed'));
    END IF;
END $$;

-- 4. Ajouter les colonnes manquantes dans payments (si elles n'existent pas)
DO $$ 
BEGIN
    -- payment_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'payment_type'
    ) THEN
        ALTER TABLE public.payments 
        ADD COLUMN payment_type TEXT DEFAULT 'full' CHECK (payment_type IN ('full', 'percentage', 'delivery_secured'));
    END IF;

    -- percentage_amount
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'percentage_amount'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN percentage_amount NUMERIC DEFAULT 0;
    END IF;

    -- percentage_rate
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'percentage_rate'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN percentage_rate NUMERIC DEFAULT 0;
    END IF;

    -- remaining_amount
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'remaining_amount'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN remaining_amount NUMERIC DEFAULT 0;
    END IF;

    -- is_held
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'is_held'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN is_held BOOLEAN DEFAULT FALSE;
    END IF;

    -- held_until
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'held_until'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN held_until TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 5. Créer les index pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_orders_payment_type ON public.orders(payment_type);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON public.payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_is_held ON public.payments(is_held);

-- 6. Activer RLS sur secured_payments
ALTER TABLE public.secured_payments ENABLE ROW LEVEL SECURITY;

-- 7. Politique RLS pour secured_payments
-- Les vendeurs peuvent voir leurs paiements sécurisés
DROP POLICY IF EXISTS "Vendors can view their secured payments" ON public.secured_payments;
CREATE POLICY "Vendors can view their secured payments"
ON public.secured_payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = secured_payments.order_id
    AND o.store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  )
);

-- Les clients peuvent voir leurs paiements sécurisés
DROP POLICY IF EXISTS "Customers can view their secured payments" ON public.secured_payments;
CREATE POLICY "Customers can view their secured payments"
ON public.secured_payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = secured_payments.order_id
    AND o.customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  )
);

-- Les admins peuvent tout voir
DROP POLICY IF EXISTS "Admins can view all secured payments" ON public.secured_payments;
CREATE POLICY "Admins can view all secured payments"
ON public.secured_payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Les vendeurs peuvent mettre à jour (release)
DROP POLICY IF EXISTS "Vendors can update their secured payments" ON public.secured_payments;
CREATE POLICY "Vendors can update their secured payments"
ON public.secured_payments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = secured_payments.order_id
    AND o.store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  )
);

-- 8. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_secured_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_secured_payments_updated_at ON public.secured_payments;
CREATE TRIGGER set_secured_payments_updated_at
  BEFORE UPDATE ON public.secured_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_secured_payments_updated_at();

-- 9. Commentaires
COMMENT ON TABLE public.secured_payments IS 'Paiements retenus en escrow jusqu''à confirmation de livraison/prestation';
COMMENT ON COLUMN public.secured_payments.hold_reason IS 'Raison de la rétention: delivery_confirmation ou service_completion';
COMMENT ON COLUMN public.secured_payments.release_conditions IS 'Conditions JSON pour la libération automatique';

