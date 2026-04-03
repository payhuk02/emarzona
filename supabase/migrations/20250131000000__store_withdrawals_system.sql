-- =========================================================
-- MIGRATION : Système de retrait pour vendeurs
-- Date : 2025-01-31
-- Description : Création du système complet de retrait pour les vendeurs (stores)
--               Support pour mobile money et carte bancaire
-- =========================================================

-- =========================================================
-- TABLE 1 : STORE_EARNINGS (Revenus et soldes des stores)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.store_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Revenus totaux
  total_revenue NUMERIC NOT NULL DEFAULT 0 CHECK (total_revenue >= 0),
  total_withdrawn NUMERIC NOT NULL DEFAULT 0 CHECK (total_withdrawn >= 0),
  available_balance NUMERIC NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  
  -- Commission plateforme
  platform_commission_rate NUMERIC NOT NULL DEFAULT 0.10 CHECK (platform_commission_rate >= 0 AND platform_commission_rate <= 1),
  total_platform_commission NUMERIC NOT NULL DEFAULT 0 CHECK (total_platform_commission >= 0),
  
  -- Métadonnées
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Contrainte unique : un seul enregistrement par store
  UNIQUE(store_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_store_earnings_store_id ON public.store_earnings(store_id);
CREATE INDEX IF NOT EXISTS idx_store_earnings_available_balance ON public.store_earnings(available_balance DESC);

-- Comments
COMMENT ON TABLE public.store_earnings IS 'Revenus et soldes disponibles pour retrait par les vendeurs';
COMMENT ON COLUMN public.store_earnings.total_revenue IS 'Revenus totaux générés par le store';
COMMENT ON COLUMN public.store_earnings.total_withdrawn IS 'Montant total déjà retiré';
COMMENT ON COLUMN public.store_earnings.available_balance IS 'Solde disponible pour retrait (total_revenue - total_platform_commission - total_withdrawn)';
COMMENT ON COLUMN public.store_earnings.platform_commission_rate IS 'Taux de commission de la plateforme (ex: 0.10 = 10%)';
COMMENT ON COLUMN public.store_earnings.total_platform_commission IS 'Total des commissions prélevées par la plateforme';

-- =========================================================
-- TABLE 2 : STORE_WITHDRAWALS (Demandes de retrait)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.store_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Montant
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'XOF',
  
  -- Méthode de paiement
  payment_method TEXT NOT NULL CHECK (
    payment_method IN ('mobile_money', 'bank_card', 'bank_transfer')
  ),
  payment_details JSONB NOT NULL,  -- {phone: "...", operator: "...", card_number: "...", etc}
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
  ),
  
  -- Approbation
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Traitement
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  transaction_reference TEXT,
  proof_url TEXT,
  
  -- Échec
  failed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  
  -- Métadonnées
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_store_withdrawals_store_id ON public.store_withdrawals(store_id);
CREATE INDEX IF NOT EXISTS idx_store_withdrawals_status ON public.store_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_store_withdrawals_created_at ON public.store_withdrawals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_withdrawals_payment_method ON public.store_withdrawals(payment_method);

-- Comments
COMMENT ON TABLE public.store_withdrawals IS 'Demandes de retrait des revenus par les vendeurs';
COMMENT ON COLUMN public.store_withdrawals.payment_method IS 'mobile_money, bank_card, ou bank_transfer';
COMMENT ON COLUMN public.store_withdrawals.payment_details IS 'Détails JSON selon la méthode: {phone, operator} pour mobile_money, {card_number, cardholder_name} pour bank_card, {account_number, bank_name, iban} pour bank_transfer';
COMMENT ON COLUMN public.store_withdrawals.status IS 'pending=en attente, processing=en cours, completed=complété, failed=échoué, cancelled=annulé';

-- =========================================================
-- FUNCTION : Calculer le solde disponible d'un store
-- =========================================================

CREATE OR REPLACE FUNCTION public.calculate_store_earnings(p_store_id UUID)
RETURNS TABLE (
  total_revenue NUMERIC,
  total_platform_commission NUMERIC,
  total_withdrawn NUMERIC,
  available_balance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_revenue NUMERIC := 0;
  v_platform_commission_rate NUMERIC := 0.10; -- 10% par défaut
  v_total_platform_commission NUMERIC := 0;
  v_total_withdrawn NUMERIC := 0;
  v_available_balance NUMERIC := 0;
BEGIN
  -- Calculer le revenu total depuis les commandes complétées
  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_total_revenue
  FROM public.orders
  WHERE store_id = p_store_id
    AND status = 'completed'
    AND payment_status = 'paid';
  
  -- Récupérer le taux de commission depuis store_earnings ou utiliser la valeur par défaut
  SELECT COALESCE(platform_commission_rate, 0.10)
  INTO v_platform_commission_rate
  FROM public.store_earnings
  WHERE store_id = p_store_id;
  
  -- Calculer la commission plateforme
  v_total_platform_commission := v_total_revenue * v_platform_commission_rate;
  
  -- Calculer le total retiré
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_withdrawn
  FROM public.store_withdrawals
  WHERE store_id = p_store_id
    AND status IN ('completed', 'processing');
  
  -- Calculer le solde disponible
  v_available_balance := v_total_revenue - v_total_platform_commission - v_total_withdrawn;
  
  -- S'assurer que le solde n'est pas négatif
  IF v_available_balance < 0 THEN
    v_available_balance := 0;
  END IF;
  
  RETURN QUERY SELECT
    v_total_revenue,
    v_total_platform_commission,
    v_total_withdrawn,
    v_available_balance;
END;
$$;

COMMENT ON FUNCTION public.calculate_store_earnings IS 'Calcule le solde disponible d''un store (revenus - commission - retraits)';

-- =========================================================
-- FUNCTION : Mettre à jour automatiquement store_earnings
-- =========================================================

CREATE OR REPLACE FUNCTION public.update_store_earnings(p_store_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_earnings RECORD;
  v_total_revenue NUMERIC := 0;
  v_total_platform_commission NUMERIC := 0;
  v_total_withdrawn NUMERIC := 0;
  v_available_balance NUMERIC := 0;
BEGIN
  -- Calculer les revenus
  SELECT * INTO v_earnings
  FROM public.calculate_store_earnings(p_store_id);
  
  -- S'assurer que les valeurs ne sont pas NULL
  v_total_revenue := COALESCE(v_earnings.total_revenue, 0);
  v_total_platform_commission := COALESCE(v_earnings.total_platform_commission, 0);
  v_total_withdrawn := COALESCE(v_earnings.total_withdrawn, 0);
  v_available_balance := COALESCE(v_earnings.available_balance, 0);
  
  -- S'assurer que le solde n'est pas négatif
  IF v_available_balance < 0 THEN
    v_available_balance := 0;
  END IF;
  
  -- Insérer ou mettre à jour store_earnings
  INSERT INTO public.store_earnings (
    store_id,
    total_revenue,
    total_platform_commission,
    total_withdrawn,
    available_balance,
    platform_commission_rate,
    last_calculated_at,
    updated_at
  )
  VALUES (
    p_store_id,
    v_total_revenue,
    v_total_platform_commission,
    v_total_withdrawn,
    v_available_balance,
    0.10, -- Taux par défaut
    now(),
    now()
  )
  ON CONFLICT (store_id)
  DO UPDATE SET
    total_revenue = v_total_revenue,
    total_platform_commission = v_total_platform_commission,
    total_withdrawn = v_total_withdrawn,
    available_balance = v_available_balance,
    last_calculated_at = now(),
    updated_at = now();
END;
$$;

COMMENT ON FUNCTION public.update_store_earnings IS 'Met à jour automatiquement les revenus et le solde disponible d''un store';

-- =========================================================
-- TRIGGER : Mettre à jour store_earnings après changement de statut d'une commande
-- =========================================================

CREATE OR REPLACE FUNCTION public.trigger_update_store_earnings_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mettre à jour les revenus si la commande est complétée et payée
  IF NEW.status = 'completed' AND NEW.payment_status = 'paid' THEN
    PERFORM public.update_store_earnings(NEW.store_id);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_store_earnings_on_order ON public.orders;
CREATE TRIGGER update_store_earnings_on_order
  AFTER INSERT OR UPDATE OF status, payment_status ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.payment_status = 'paid')
  EXECUTE FUNCTION public.trigger_update_store_earnings_on_order();

-- =========================================================
-- TRIGGER : Mettre à jour store_earnings après changement de statut d'un retrait
-- =========================================================

CREATE OR REPLACE FUNCTION public.trigger_update_store_earnings_on_withdrawal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mettre à jour les revenus si le statut du retrait change
  IF NEW.status IN ('completed', 'processing', 'cancelled', 'failed') THEN
    PERFORM public.update_store_earnings(NEW.store_id);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_store_earnings_on_withdrawal ON public.store_withdrawals;
CREATE TRIGGER update_store_earnings_on_withdrawal
  AFTER INSERT OR UPDATE OF status ON public.store_withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_store_earnings_on_withdrawal();

-- =========================================================
-- TRIGGER : updated_at automatique
-- =========================================================

CREATE OR REPLACE FUNCTION public.update_store_earnings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_store_earnings_updated_at ON public.store_earnings;
CREATE TRIGGER update_store_earnings_updated_at
  BEFORE UPDATE ON public.store_earnings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_store_earnings_updated_at();

DROP TRIGGER IF EXISTS update_store_withdrawals_updated_at ON public.store_withdrawals;
CREATE TRIGGER update_store_withdrawals_updated_at
  BEFORE UPDATE ON public.store_withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- RLS POLICIES : Row Level Security
-- =========================================================

-- Store Earnings
ALTER TABLE public.store_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners can view their own earnings" ON public.store_earnings;
CREATE POLICY "Store owners can view their own earnings"
  ON public.store_earnings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_earnings.store_id
      AND stores.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all earnings" ON public.store_earnings;
CREATE POLICY "Admins can view all earnings"
  ON public.store_earnings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Store Withdrawals
ALTER TABLE public.store_withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners can view their own withdrawals" ON public.store_withdrawals;
CREATE POLICY "Store owners can view their own withdrawals"
  ON public.store_withdrawals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_withdrawals.store_id
      AND stores.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners can create their own withdrawals" ON public.store_withdrawals;
CREATE POLICY "Store owners can create their own withdrawals"
  ON public.store_withdrawals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_withdrawals.store_id
      AND stores.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners can cancel their pending withdrawals" ON public.store_withdrawals;
CREATE POLICY "Store owners can cancel their pending withdrawals"
  ON public.store_withdrawals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_withdrawals.store_id
      AND stores.user_id = auth.uid()
    )
    AND status = 'pending'
  )
  WITH CHECK (
    status = 'cancelled'
  );

DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.store_withdrawals;
CREATE POLICY "Admins can view all withdrawals"
  ON public.store_withdrawals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage all withdrawals" ON public.store_withdrawals;
CREATE POLICY "Admins can manage all withdrawals"
  ON public.store_withdrawals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =========================================================
-- FIN DE LA MIGRATION
-- =========================================================

