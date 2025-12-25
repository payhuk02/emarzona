-- Migration: Table pour les paiements de commissions de parrainage
-- Date: 31 Janvier 2025
-- Description: Crée la table pour gérer les paiements de commissions de parrainage
--              (Les paiements d'affiliation sont déjà dans affiliate_withdrawals)

-- Table pour les paiements de commissions de parrainage
CREATE TABLE IF NOT EXISTS public.commission_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Commissions associées (tableau d'IDs)
  commission_ids UUID[] NOT NULL,
  
  -- Montant
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'XOF',
  
  -- Méthode de paiement
  payment_method TEXT NOT NULL CHECK (payment_method IN ('mobile_money', 'bank_transfer', 'paypal')),
  payment_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Approbation
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  
  -- Traitement
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  transaction_reference TEXT,
  
  -- Échec
  failed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  
  -- Notes
  notes TEXT,
  admin_notes TEXT,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Contrainte : montant minimum
  CONSTRAINT min_amount_check CHECK (amount >= 1000) -- Minimum 1000 XOF
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_commission_payments_referrer_id ON public.commission_payments(referrer_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_status ON public.commission_payments(status);
CREATE INDEX IF NOT EXISTS idx_commission_payments_created_at ON public.commission_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commission_payments_commission_ids ON public.commission_payments USING GIN(commission_ids);

-- RLS Policies
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own commission payments"
  ON public.commission_payments FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create their own commission payment requests"
  ON public.commission_payments FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all commission payments"
  ON public.commission_payments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all commission payments"
  ON public.commission_payments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger pour updated_at
CREATE TRIGGER update_commission_payments_updated_at
  BEFORE UPDATE ON public.commission_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour calculer le montant total des commissions en attente
CREATE OR REPLACE FUNCTION public.get_pending_commission_total(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(commission_amount), 0)
  INTO v_total
  FROM public.referral_commissions
  WHERE referrer_id = p_user_id
    AND status = 'completed'
    AND id NOT IN (
      SELECT UNNEST(commission_ids)
      FROM public.commission_payments
      WHERE referrer_id = p_user_id
        AND status IN ('pending', 'approved', 'processing', 'completed')
    );
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON TABLE public.commission_payments IS 'Paiements de commissions de parrainage';
COMMENT ON FUNCTION public.get_pending_commission_total(UUID) IS 'Calcule le montant total des commissions en attente de paiement pour un utilisateur';







