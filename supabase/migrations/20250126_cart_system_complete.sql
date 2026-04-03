-- Migration: Système de Panier Complet et Professionnel
-- Date: 26 Janvier 2025
-- Description: Panier multi-produits avec persistance base de données, support variants, coupons, calculs automatiques

-- ============================================================
-- TABLE: cart_items
-- Panier utilisateur avec persistance base de données
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Utilisateur (peut être NULL pour paniers anonymes)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Session ID pour paniers anonymes (cookie)
  session_id TEXT,
  
  -- Produit
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL CHECK (product_type IN ('digital', 'physical', 'service', 'course')),
  product_name TEXT NOT NULL,
  product_image_url TEXT,
  
  -- Variants (pour produits physiques)
  variant_id UUID REFERENCES public.physical_product_variants(id) ON DELETE SET NULL,
  variant_name TEXT,
  
  -- Quantité et prix
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  
  -- Remises et coupons
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  discount_percentage NUMERIC(5, 2) DEFAULT 0,
  coupon_code TEXT,
  
  -- Métadonnées additionnelles (JSONB pour flexibilité)
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Exemple: { "booking_date": "2025-02-01", "participants": 2, "staff_id": "xxx" }
  
  -- Dates
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  CHECK ((user_id IS NOT NULL) OR (session_id IS NOT NULL)),
  CONSTRAINT unique_user_product_variant UNIQUE (user_id, session_id, product_id, variant_id)
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON public.cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_added_at ON public.cart_items(added_at);

-- ============================================================
-- TABLE: abandoned_carts
-- Tracking paniers abandonnés pour recovery emails
-- ============================================================

CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Utilisateur
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  customer_email TEXT,
  
  -- Panier snapshot (JSONB pour flexibilité)
  cart_items JSONB NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  
  -- Recovery tracking
  reminder_sent_at TIMESTAMPTZ[], -- Array des dates d'envoi reminders
  recovery_attempts INTEGER DEFAULT 0,
  recovered_at TIMESTAMPTZ,
  
  -- Dates
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  CHECK ((user_id IS NOT NULL) OR (session_id IS NOT NULL))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_user_id ON public.abandoned_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_session_id ON public.abandoned_carts(session_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_created_at ON public.abandoned_carts(created_at);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovered_at ON public.abandoned_carts(recovered_at);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger pour updated_at sur cart_items
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_items_updated_at();

-- Trigger pour updated_at sur abandoned_carts
CREATE TRIGGER trigger_update_abandoned_carts_updated_at
  BEFORE UPDATE ON public.abandoned_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_items_updated_at();

-- ============================================================
-- FUNCTIONS RPC
-- ============================================================

-- Fonction pour calculer le total d'un panier
CREATE OR REPLACE FUNCTION calculate_cart_total(p_user_id UUID DEFAULT NULL, p_session_id TEXT DEFAULT NULL)
RETURNS TABLE (
  subtotal NUMERIC,
  discount_amount NUMERIC,
  tax_amount NUMERIC,
  shipping_amount NUMERIC,
  total NUMERIC,
  item_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subtotal NUMERIC := 0;
  v_discount NUMERIC := 0;
  v_item_count INTEGER := 0;
BEGIN
  SELECT 
    COALESCE(SUM((unit_price - discount_amount) * quantity), 0),
    COALESCE(SUM(discount_amount * quantity), 0),
    COUNT(*)
  INTO v_subtotal, v_discount, v_item_count
  FROM cart_items
  WHERE (p_user_id IS NOT NULL AND user_id = p_user_id)
     OR (p_session_id IS NOT NULL AND session_id = p_session_id);
  
  RETURN QUERY SELECT 
    v_subtotal,
    v_discount,
    0::NUMERIC AS tax_amount, -- Taxes calculées côté client selon pays
    0::NUMERIC AS shipping_amount, -- Shipping calculé selon adresse
    v_subtotal AS total,
    v_item_count;
END;
$$;

-- Fonction pour nettoyer les paniers anciens (30 jours)
CREATE OR REPLACE FUNCTION cleanup_old_carts()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cart_items
  WHERE updated_at < now() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Policies pour cart_items

-- Users peuvent voir leur propre panier
CREATE POLICY "Users can view their own cart"
  ON public.cart_items FOR SELECT
  USING (
    (user_id = auth.uid()) OR
    (session_id IS NOT NULL AND session_id = current_setting('app.session_id', TRUE))
  );

-- Users peuvent ajouter à leur panier
CREATE POLICY "Users can add to their cart"
  ON public.cart_items FOR INSERT
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid()) AND
    (session_id IS NOT NULL OR user_id IS NOT NULL)
  );

-- Users peuvent modifier leur panier
CREATE POLICY "Users can update their own cart"
  ON public.cart_items FOR UPDATE
  USING (
    (user_id = auth.uid()) OR
    (session_id IS NOT NULL AND session_id = current_setting('app.session_id', TRUE))
  );

-- Users peuvent supprimer de leur panier
CREATE POLICY "Users can delete from their own cart"
  ON public.cart_items FOR DELETE
  USING (
    (user_id = auth.uid()) OR
    (session_id IS NOT NULL AND session_id = current_setting('app.session_id', TRUE))
  );

-- Policies pour abandoned_carts

-- Users peuvent voir leurs propres paniers abandonnés
CREATE POLICY "Users can view their own abandoned carts"
  ON public.abandoned_carts FOR SELECT
  USING (
    (user_id = auth.uid()) OR
    (session_id IS NOT NULL AND session_id = current_setting('app.session_id', TRUE))
  );

-- Service peut créer des abandoned carts (via trigger/function)
CREATE POLICY "Service can create abandoned carts"
  ON public.abandoned_carts FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE public.cart_items IS 'Panier utilisateur avec support multi-produits, variants, et coupons';
COMMENT ON TABLE public.abandoned_carts IS 'Tracking paniers abandonnés pour recovery emails automatiques';
COMMENT ON FUNCTION calculate_cart_total IS 'Calcule le total d''un panier avec subtotal, remises, taxes et shipping';
COMMENT ON FUNCTION cleanup_old_carts IS 'Nettoie les paniers non mis à jour depuis 30 jours';

