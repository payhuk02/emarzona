-- Créer la table des commissions de la plateforme
CREATE TABLE public.platform_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  store_id UUID NOT NULL,
  order_id UUID,
  product_id UUID,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0.10,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  seller_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.platform_commissions ENABLE ROW LEVEL SECURITY;

-- Politique pour les admins
CREATE POLICY "Admins can view all commissions"
ON public.platform_commissions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage commissions"
ON public.platform_commissions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Politique pour les vendeurs (voir leurs propres commissions)
CREATE POLICY "Store owners can view their commissions"
ON public.platform_commissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = platform_commissions.store_id
    AND stores.user_id = auth.uid()
  )
);

-- Ajouter des colonnes à la table payments pour tracker les commissions
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS commission_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS seller_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0.10;

-- Fonction pour calculer automatiquement les commissions
CREATE OR REPLACE FUNCTION public.calculate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission_rate NUMERIC := 0.10;
  v_commission_amount NUMERIC;
  v_seller_amount NUMERIC;
  v_store_id UUID;
  v_product_id UUID;
BEGIN
  -- Calculer la commission (10%)
  v_commission_amount := NEW.amount * v_commission_rate;
  v_seller_amount := NEW.amount - v_commission_amount;
  
  -- Mettre à jour les colonnes du paiement
  NEW.commission_rate := v_commission_rate;
  NEW.commission_amount := v_commission_amount;
  NEW.seller_amount := v_seller_amount;
  
  -- Récupérer le store_id depuis le paiement
  v_store_id := NEW.store_id;
  
  -- Si le statut est 'completed', enregistrer la commission
  IF NEW.status = 'completed' THEN
    INSERT INTO public.platform_commissions (
      payment_id,
      store_id,
      order_id,
      total_amount,
      commission_rate,
      commission_amount,
      seller_amount,
      status
    ) VALUES (
      NEW.id,
      v_store_id,
      NEW.order_id,
      NEW.amount,
      v_commission_rate,
      v_commission_amount,
      v_seller_amount,
      'completed'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger pour calculer automatiquement les commissions sur les nouveaux paiements
CREATE TRIGGER calculate_payment_commission
BEFORE INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.calculate_commission();

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_platform_commissions_updated_at
BEFORE UPDATE ON public.platform_commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX idx_platform_commissions_store_id ON public.platform_commissions(store_id);
CREATE INDEX idx_platform_commissions_payment_id ON public.platform_commissions(payment_id);
CREATE INDEX idx_platform_commissions_created_at ON public.platform_commissions(created_at);
CREATE INDEX idx_platform_commissions_status ON public.platform_commissions(status);