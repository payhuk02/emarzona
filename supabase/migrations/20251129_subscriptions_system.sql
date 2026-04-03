-- =========================================================
-- Migration: Subscriptions System
-- Date: 29/11/2025
-- Description: Système d'abonnements pour les clients
-- =========================================================

-- Table principale des abonnements
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  
  -- Informations de l'abonnement
  name TEXT NOT NULL,
  description TEXT,
  
  -- Prix et facturation
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'XOF',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired', 'past_due')),
  
  -- Dates importantes
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  
  -- Paiement
  payment_method TEXT,
  payment_provider TEXT, -- ex: moneroo
  payment_reference TEXT,
  
  -- Compteurs
  billing_count INTEGER DEFAULT 0,
  failed_payments INTEGER DEFAULT 0,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_store_id ON public.subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON public.subscriptions(next_billing_date) WHERE status = 'active';

-- Historique des paiements d'abonnement
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  
  -- Montant et devise
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'XOF',
  
  -- Statut du paiement
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  
  -- Informations de paiement
  payment_provider TEXT,
  transaction_id TEXT,
  payment_method TEXT,
  
  -- Période couverte
  billing_period_start TIMESTAMP WITH TIME ZONE,
  billing_period_end TIMESTAMP WITH TIME ZONE,
  
  -- Erreur si échoué
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription ON public.subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON public.subscription_payments(status);

-- Plans d'abonnement (templates)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Informations du plan
  name TEXT NOT NULL,
  description TEXT,
  
  -- Prix
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'XOF',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  
  -- Période d'essai
  trial_days INTEGER DEFAULT 0,
  
  -- Limites et fonctionnalités
  features JSONB DEFAULT '[]',
  limits JSONB DEFAULT '{}',
  
  -- Statut
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Ordre d'affichage
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_subscription_plans_store ON public.subscription_plans(store_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour subscriptions

-- Les utilisateurs peuvent voir leurs propres abonnements
CREATE POLICY "Users can view own subscriptions"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Les propriétaires de store peuvent voir les abonnements de leur store
CREATE POLICY "Store owners can view store subscriptions"
ON public.subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = subscriptions.store_id
    AND s.user_id = auth.uid()
  )
);

-- Les propriétaires de store peuvent créer des abonnements
CREATE POLICY "Store owners can create subscriptions"
ON public.subscriptions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = store_id
    AND s.user_id = auth.uid()
  )
);

-- Les utilisateurs peuvent mettre à jour leurs propres abonnements (pause, cancel)
CREATE POLICY "Users can update own subscriptions"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies pour subscription_payments

-- Les utilisateurs peuvent voir les paiements de leurs abonnements
CREATE POLICY "Users can view own subscription payments"
ON public.subscription_payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.id = subscription_payments.subscription_id
    AND s.user_id = auth.uid()
  )
);

-- Les propriétaires de store peuvent voir les paiements
CREATE POLICY "Store owners can view subscription payments"
ON public.subscription_payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.subscriptions sub
    JOIN public.stores s ON s.id = sub.store_id
    WHERE sub.id = subscription_payments.subscription_id
    AND s.user_id = auth.uid()
  )
);

-- RLS Policies pour subscription_plans

-- Tout le monde peut voir les plans actifs
CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

-- Les propriétaires de store peuvent gérer leurs plans
CREATE POLICY "Store owners can manage plans"
ON public.subscription_plans FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = subscription_plans.store_id
    AND s.user_id = auth.uid()
  )
);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

CREATE TRIGGER update_subscription_payments_updated_at
  BEFORE UPDATE ON public.subscription_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- Fonction pour calculer la prochaine date de facturation
CREATE OR REPLACE FUNCTION calculate_next_billing_date(
  p_current_date TIMESTAMP WITH TIME ZONE,
  p_billing_cycle TEXT
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  RETURN CASE p_billing_cycle
    WHEN 'weekly' THEN p_current_date + INTERVAL '1 week'
    WHEN 'monthly' THEN p_current_date + INTERVAL '1 month'
    WHEN 'quarterly' THEN p_current_date + INTERVAL '3 months'
    WHEN 'yearly' THEN p_current_date + INTERVAL '1 year'
    ELSE p_current_date + INTERVAL '1 month'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour récupérer les statistiques d'abonnements d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_subscription_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_subscriptions', COUNT(*),
    'active_subscriptions', COUNT(*) FILTER (WHERE subscriptions.status = 'active'),
    'paused_subscriptions', COUNT(*) FILTER (WHERE subscriptions.status = 'paused'),
    'cancelled_subscriptions', COUNT(*) FILTER (WHERE subscriptions.status = 'cancelled'),
    'total_monthly_cost', COALESCE(SUM(
      CASE subscriptions.billing_cycle
        WHEN 'weekly' THEN subscriptions.amount * 4
        WHEN 'monthly' THEN subscriptions.amount
        WHEN 'quarterly' THEN subscriptions.amount / 3
        WHEN 'yearly' THEN subscriptions.amount / 12
        ELSE subscriptions.amount
      END
    ) FILTER (WHERE subscriptions.status = 'active'), 0)
  )
  INTO v_result
  FROM public.subscriptions
  WHERE subscriptions.user_id = p_user_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT SELECT ON public.subscription_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_plans TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription_stats(UUID) TO authenticated;

-- Comments
COMMENT ON TABLE public.subscriptions IS 'Abonnements des utilisateurs';
COMMENT ON TABLE public.subscription_payments IS 'Historique des paiements d''abonnements';
COMMENT ON TABLE public.subscription_plans IS 'Plans d''abonnement configurables par store';

