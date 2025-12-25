-- =========================================================
-- Migration: Table pour les méthodes de paiement sauvegardées des vendeurs
-- Date: 2025-02-03
-- Description: Permet aux vendeurs de sauvegarder leurs numéros de mobile money
--              et cartes bancaires pour faciliter les retraits
-- =========================================================

-- Table pour les méthodes de paiement sauvegardées
CREATE TABLE IF NOT EXISTS public.store_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Type de méthode
  payment_method TEXT NOT NULL CHECK (payment_method IN ('mobile_money', 'bank_card', 'bank_transfer')),
  
  -- Nom/label pour identifier cette méthode (ex: "Orange Money Principal")
  label TEXT NOT NULL,
  
  -- Détails de paiement (JSONB pour flexibilité)
  payment_details JSONB NOT NULL,
  
  -- Méthode par défaut pour ce type
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  -- Statut (actif/inactif)
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Métadonnées
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Contrainte : un seul default par type de méthode et par store
  CONSTRAINT unique_default_per_method UNIQUE (store_id, payment_method, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_store_payment_methods_store_id ON public.store_payment_methods(store_id);
CREATE INDEX IF NOT EXISTS idx_store_payment_methods_payment_method ON public.store_payment_methods(payment_method);
CREATE INDEX IF NOT EXISTS idx_store_payment_methods_is_active ON public.store_payment_methods(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_store_payment_methods_is_default ON public.store_payment_methods(is_default) WHERE is_default = true;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_store_payment_methods_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_store_payment_methods_updated_at ON public.store_payment_methods;
CREATE TRIGGER update_store_payment_methods_updated_at
  BEFORE UPDATE ON public.store_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_store_payment_methods_updated_at();

-- Fonction pour s'assurer qu'il n'y a qu'un seul default par type
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si on définit cette méthode comme default
  IF NEW.is_default = true THEN
    -- Désactiver les autres defaults du même type pour ce store
    UPDATE public.store_payment_methods
    SET is_default = false
    WHERE store_id = NEW.store_id
      AND payment_method = NEW.payment_method
      AND id != NEW.id
      AND is_default = true;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_single_default_payment_method_trigger ON public.store_payment_methods;
CREATE TRIGGER ensure_single_default_payment_method_trigger
  BEFORE INSERT OR UPDATE ON public.store_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- RLS Policies
ALTER TABLE public.store_payment_methods ENABLE ROW LEVEL SECURITY;

-- Les propriétaires de store peuvent voir leurs méthodes de paiement
DROP POLICY IF EXISTS "Store owners can view their payment methods" ON public.store_payment_methods;
CREATE POLICY "Store owners can view their payment methods"
  ON public.store_payment_methods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_payment_methods.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Les propriétaires de store peuvent créer leurs méthodes de paiement
DROP POLICY IF EXISTS "Store owners can create their payment methods" ON public.store_payment_methods;
CREATE POLICY "Store owners can create their payment methods"
  ON public.store_payment_methods FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_payment_methods.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Les propriétaires de store peuvent mettre à jour leurs méthodes de paiement
DROP POLICY IF EXISTS "Store owners can update their payment methods" ON public.store_payment_methods;
CREATE POLICY "Store owners can update their payment methods"
  ON public.store_payment_methods FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_payment_methods.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Les propriétaires de store peuvent supprimer leurs méthodes de paiement
DROP POLICY IF EXISTS "Store owners can delete their payment methods" ON public.store_payment_methods;
CREATE POLICY "Store owners can delete their payment methods"
  ON public.store_payment_methods FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_payment_methods.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Commentaires
COMMENT ON TABLE public.store_payment_methods IS 'Méthodes de paiement sauvegardées par les vendeurs pour faciliter les retraits';
COMMENT ON COLUMN public.store_payment_methods.label IS 'Nom/label pour identifier cette méthode (ex: "Orange Money Principal", "Carte UBA")';
COMMENT ON COLUMN public.store_payment_methods.payment_details IS 'Détails de paiement en JSONB (phone, operator pour mobile_money, card_number, etc.)';
COMMENT ON COLUMN public.store_payment_methods.is_default IS 'Méthode par défaut pour ce type de paiement (un seul default par type)';
COMMENT ON COLUMN public.store_payment_methods.is_active IS 'Si false, la méthode est désactivée mais conservée pour l''historique';

