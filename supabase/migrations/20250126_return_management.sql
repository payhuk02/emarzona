-- ================================================================
-- Return Management System - Système de Gestion des Retours
-- Date: 26 Janvier 2025
-- Description: Système complet pour gérer les retours et remboursements
-- ================================================================

-- Table principale des retours
CREATE TABLE IF NOT EXISTS public.product_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Informations retour
  return_number TEXT UNIQUE NOT NULL, -- Numéro unique de retour (ex: RET-2025-001)
  return_reason TEXT NOT NULL CHECK (return_reason IN (
    'defective',          -- Produit défectueux
    'wrong_item',        -- Mauvais article reçu
    'not_as_described',  -- Ne correspond pas à la description
    'damaged',           -- Produit endommagé
    'size_fit',          -- Problème de taille/ajustement
    'quality',           -- Problème de qualité
    'duplicate',         -- Commande dupliquée
    'changed_mind',      -- Changement d'avis
    'other'              -- Autre raison
  )),
  return_reason_details TEXT, -- Détails supplémentaires
  
  -- Statut
  status TEXT NOT NULL CHECK (status IN (
    'requested',         -- Retour demandé (en attente validation)
    'approved',          -- Approuvé par le vendeur
    'rejected',          -- Rejeté par le vendeur
    'pending_pickup',    -- En attente de récupération
    'in_transit',        -- En transit vers le vendeur
    'received',          -- Reçu par le vendeur
    'inspecting',        -- En inspection
    'refunded',          -- Remboursé
    'exchanged',         -- Échangé
    'replaced',          -- Remplacé
    'cancelled'          -- Annulé
  )) DEFAULT 'requested',
  
  -- Informations retour physique
  return_shipping_address JSONB, -- Adresse de retour
  return_tracking_number TEXT,
  return_carrier TEXT,
  return_shipping_cost NUMERIC DEFAULT 0,
  return_shipping_paid_by TEXT CHECK (return_shipping_paid_by IN ('customer', 'store', 'platform')) DEFAULT 'customer',
  
  -- Quantité
  quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Montants
  item_price NUMERIC NOT NULL, -- Prix unitaire au moment de l'achat
  total_amount NUMERIC NOT NULL, -- Montant total (item_price * quantity)
  refund_amount NUMERIC, -- Montant remboursé (peut être différent si partiel)
  refund_type TEXT CHECK (refund_type IN ('full', 'partial', 'store_credit', 'exchange')) DEFAULT 'full',
  
  -- Remboursement
  refund_method TEXT CHECK (refund_method IN ('original_payment', 'store_credit', 'bank_transfer', 'cash')) DEFAULT 'original_payment',
  refund_transaction_id UUID,
  refund_status TEXT CHECK (refund_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  refunded_at TIMESTAMPTZ,
  
  -- Actions du vendeur
  action_taken TEXT CHECK (action_taken IN ('refund', 'exchange', 'replace', 'repair', 'none')) DEFAULT 'refund',
  action_description TEXT,
  
  -- Inspection
  inspection_notes TEXT,
  inspection_result TEXT CHECK (inspection_result IN ('approved', 'rejected', 'partial')) DEFAULT NULL,
  inspected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  inspected_at TIMESTAMPTZ,
  
  -- Dates importantes
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  received_at TIMESTAMPTZ,
  
  -- Pièces jointes
  customer_photos TEXT[], -- URLs des photos du client
  store_photos TEXT[], -- URLs des photos du vendeur
  
  -- Métadonnées
  customer_notes TEXT,
  store_notes TEXT,
  internal_notes TEXT,
  
  -- Notifications
  customer_notified BOOLEAN DEFAULT false,
  store_notified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour product_returns
CREATE INDEX IF NOT EXISTS idx_product_returns_order_id ON public.product_returns(order_id);
CREATE INDEX IF NOT EXISTS idx_product_returns_customer_id ON public.product_returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_returns_store_id ON public.product_returns(store_id);
CREATE INDEX IF NOT EXISTS idx_product_returns_product_id ON public.product_returns(product_id);
CREATE INDEX IF NOT EXISTS idx_product_returns_status ON public.product_returns(status);
CREATE INDEX IF NOT EXISTS idx_product_returns_return_number ON public.product_returns(return_number);
CREATE INDEX IF NOT EXISTS idx_product_returns_created_at ON public.product_returns(created_at DESC);

-- Table pour l'historique des retours (audit trail)
CREATE TABLE IF NOT EXISTS public.return_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES public.product_returns(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL, -- 'created', 'status_changed', 'note_added', 'refund_processed', etc.
  status_from TEXT,
  status_to TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_return_history_return_id ON public.return_history(return_id);
CREATE INDEX IF NOT EXISTS idx_return_history_created_at ON public.return_history(created_at DESC);

-- Fonction pour générer un numéro de retour unique
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
  v_return_number TEXT;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Récupérer le dernier numéro pour cette année
  SELECT COALESCE(MAX(CAST(SUBSTRING(return_number FROM '\d+$') AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM public.product_returns
  WHERE return_number LIKE 'RET-' || v_year || '-%';
  
  v_return_number := 'RET-' || v_year || '-' || LPAD(v_sequence::TEXT, 6, '0');
  
  RETURN v_return_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement le numéro de retour
CREATE OR REPLACE FUNCTION set_return_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.return_number IS NULL OR NEW.return_number = '' THEN
    NEW.return_number := generate_return_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_return_number_trigger
  BEFORE INSERT ON public.product_returns
  FOR EACH ROW
  EXECUTE FUNCTION set_return_number();

-- Fonction pour calculer le montant de remboursement
CREATE OR REPLACE FUNCTION calculate_refund_amount(
  p_return_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_return RECORD;
  v_refund_amount NUMERIC;
BEGIN
  SELECT * INTO v_return
  FROM public.product_returns
  WHERE id = p_return_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Return not found';
  END IF;
  
  -- Calcul selon le type de remboursement
  CASE v_return.refund_type
    WHEN 'full' THEN
      v_refund_amount := v_return.total_amount;
    WHEN 'partial' THEN
      -- Pour l'instant, utiliser 50% (peut être configuré)
      v_refund_amount := v_return.total_amount * 0.5;
    WHEN 'store_credit' THEN
      v_refund_amount := v_return.total_amount;
    WHEN 'exchange' THEN
      v_refund_amount := 0; -- Pas de remboursement pour échange
    ELSE
      v_refund_amount := v_return.total_amount;
  END CASE;
  
  RETURN v_refund_amount;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le statut et créer un historique
CREATE OR REPLACE FUNCTION update_return_status(
  p_return_id UUID,
  p_new_status TEXT,
  p_performed_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_old_status TEXT;
BEGIN
  -- Récupérer l'ancien statut
  SELECT status INTO v_old_status
  FROM public.product_returns
  WHERE id = p_return_id;
  
  -- Mettre à jour le statut
  UPDATE public.product_returns
  SET 
    status = p_new_status,
    updated_at = now(),
    -- Mettre à jour les dates selon le nouveau statut
    approved_at = CASE WHEN p_new_status = 'approved' AND v_old_status != 'approved' THEN now() ELSE approved_at END,
    rejected_at = CASE WHEN p_new_status = 'rejected' AND v_old_status != 'rejected' THEN now() ELSE rejected_at END,
    received_at = CASE WHEN p_new_status = 'received' AND v_old_status != 'received' THEN now() ELSE received_at END,
    refunded_at = CASE WHEN p_new_status = 'refunded' AND v_old_status != 'refunded' THEN now() ELSE refunded_at END
  WHERE id = p_return_id;
  
  -- Créer une entrée dans l'historique
  INSERT INTO public.return_history (
    return_id,
    action,
    status_from,
    status_to,
    performed_by,
    notes
  )
  VALUES (
    p_return_id,
    'status_changed',
    v_old_status,
    p_new_status,
    p_performed_by,
    p_notes
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour traiter un remboursement
CREATE OR REPLACE FUNCTION process_refund(
  p_return_id UUID,
  p_refund_amount NUMERIC,
  p_refund_method TEXT,
  p_performed_by UUID,
  p_refund_transaction_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Mettre à jour le retour
  UPDATE public.product_returns
  SET 
    refund_amount = p_refund_amount,
    refund_method = p_refund_method,
    refund_transaction_id = p_refund_transaction_id,
    refund_status = 'processing',
    updated_at = now()
  WHERE id = p_return_id;
  
  -- Créer une entrée dans l'historique
  INSERT INTO public.return_history (
    return_id,
    action,
    performed_by,
    notes,
    metadata
  )
  VALUES (
    p_return_id,
    'refund_processed',
    p_performed_by,
    'Remboursement de ' || p_refund_amount || ' ' || p_refund_method,
    jsonb_build_object(
      'refund_amount', p_refund_amount,
      'refund_method', p_refund_method,
      'refund_transaction_id', p_refund_transaction_id
    )
  );
  
  -- Mettre à jour le statut
  PERFORM update_return_status(p_return_id, 'refunded', p_performed_by, 'Remboursement traité');
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER update_product_returns_updated_at
  BEFORE UPDATE ON public.product_returns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.product_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_history ENABLE ROW LEVEL SECURITY;

-- Clients peuvent voir leurs propres retours
CREATE POLICY "Customers can view own returns"
ON public.product_returns FOR SELECT
USING (auth.uid() = customer_id);

-- Clients peuvent créer leurs propres retours
CREATE POLICY "Customers can create own returns"
ON public.product_returns FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Clients peuvent mettre à jour leurs propres retours (notes, photos)
CREATE POLICY "Customers can update own returns"
ON public.product_returns FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

-- Vendeurs peuvent voir les retours de leurs produits
CREATE POLICY "Store owners can view their returns"
ON public.product_returns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = product_returns.store_id
    AND stores.user_id = auth.uid()
  )
);

-- Vendeurs peuvent mettre à jour les retours de leurs produits
CREATE POLICY "Store owners can update their returns"
ON public.product_returns FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = product_returns.store_id
    AND stores.user_id = auth.uid()
  )
);

-- Policies pour l'historique
CREATE POLICY "Users can view return history for accessible returns"
ON public.return_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.product_returns
    WHERE product_returns.id = return_history.return_id
    AND (
      product_returns.customer_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = product_returns.store_id
        AND stores.user_id = auth.uid()
      )
    )
  )
);

-- Commentaires
COMMENT ON TABLE public.product_returns IS 'Système de gestion des retours de produits';
COMMENT ON TABLE public.return_history IS 'Historique et audit trail des retours';
COMMENT ON FUNCTION generate_return_number IS 'Génère un numéro unique de retour (RET-YYYY-NNNNNN)';
COMMENT ON FUNCTION calculate_refund_amount IS 'Calcule le montant de remboursement selon le type';
COMMENT ON FUNCTION update_return_status IS 'Met à jour le statut d''un retour et crée un historique';
COMMENT ON FUNCTION process_refund IS 'Traite un remboursement pour un retour';

