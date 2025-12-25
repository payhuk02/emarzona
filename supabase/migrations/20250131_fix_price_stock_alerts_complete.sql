-- Migration: Correction complète du système d'alertes prix et stock
-- Date: 31 Janvier 2025
-- Description: Supprime et recrée proprement les tables et fonctions

-- ============================================================
-- ÉTAPE 1: SUPPRIMER LES OBJETS EXISTANTS (si nécessaire)
-- ============================================================

-- Supprimer les triggers qui dépendent des fonctions
DROP TRIGGER IF EXISTS trigger_record_price_history ON public.products;

-- Supprimer les fonctions qui dépendent des tables
DROP FUNCTION IF EXISTS public.check_price_alerts() CASCADE;
DROP FUNCTION IF EXISTS public.check_stock_alerts() CASCADE;
DROP FUNCTION IF EXISTS public.create_price_alert(UUID, UUID, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.create_stock_alert(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.record_price_history() CASCADE;

-- Supprimer les politiques RLS
DROP POLICY IF EXISTS "Users can view their own price alerts" ON public.price_alerts;
DROP POLICY IF EXISTS "Users can create their own price alerts" ON public.price_alerts;
DROP POLICY IF EXISTS "Users can update their own price alerts" ON public.price_alerts;
DROP POLICY IF EXISTS "Users can delete their own price alerts" ON public.price_alerts;

DROP POLICY IF EXISTS "Users can view their own stock alerts" ON public.stock_alerts;
DROP POLICY IF EXISTS "Users can create their own stock alerts" ON public.stock_alerts;
DROP POLICY IF EXISTS "Users can update their own stock alerts" ON public.stock_alerts;
DROP POLICY IF EXISTS "Users can delete their own stock alerts" ON public.stock_alerts;

DROP POLICY IF EXISTS "Anyone can view price history" ON public.price_history;

-- Supprimer les tables (CASCADE supprime automatiquement les index et contraintes)
DROP TABLE IF EXISTS public.price_alerts CASCADE;
DROP TABLE IF EXISTS public.stock_alerts CASCADE;
DROP TABLE IF EXISTS public.price_history CASCADE;

-- ============================================================
-- ÉTAPE 2: CRÉER LES TABLES AVEC LA BONNE STRUCTURE
-- ============================================================

-- Table 1: PRICE_ALERTS
CREATE TABLE public.price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  target_price NUMERIC NOT NULL,
  current_price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  notified BOOLEAN DEFAULT false NOT NULL,
  notification_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, product_id)
);

-- Table 2: STOCK_ALERTS
CREATE TABLE public.stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  notified BOOLEAN DEFAULT false NOT NULL,
  notification_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, product_id)
);

-- Table 3: PRICE_HISTORY
CREATE TABLE public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  promotional_price NUMERIC,
  currency TEXT NOT NULL DEFAULT 'XOF',
  recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(product_id, recorded_at)
);

-- ============================================================
-- ÉTAPE 3: CRÉER LES INDEX
-- ============================================================

-- Index pour price_alerts
CREATE INDEX idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX idx_price_alerts_product_id ON public.price_alerts(product_id);
CREATE INDEX idx_price_alerts_notified ON public.price_alerts(notified) WHERE notified = false;
CREATE INDEX idx_price_alerts_created_at ON public.price_alerts(created_at);

-- Index pour stock_alerts
CREATE INDEX idx_stock_alerts_user_id ON public.stock_alerts(user_id);
CREATE INDEX idx_stock_alerts_product_id ON public.stock_alerts(product_id);
CREATE INDEX idx_stock_alerts_notified ON public.stock_alerts(notified) WHERE notified = false;
CREATE INDEX idx_stock_alerts_created_at ON public.stock_alerts(created_at);

-- Index pour price_history
CREATE INDEX idx_price_history_product_id ON public.price_history(product_id);
CREATE INDEX idx_price_history_recorded_at ON public.price_history(recorded_at DESC);

-- ============================================================
-- ÉTAPE 4: CRÉER LES FONCTIONS
-- ============================================================

-- Fonction 1: Créer une alerte de prix
CREATE OR REPLACE FUNCTION public.create_price_alert(
  p_user_id UUID,
  p_product_id UUID,
  p_target_price NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_price NUMERIC;
  v_currency TEXT;
  v_alert_id UUID;
BEGIN
  -- Récupérer le prix actuel du produit
  SELECT 
    COALESCE(promotional_price, price),
    currency
  INTO v_current_price, v_currency
  FROM public.products
  WHERE id = p_product_id
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit non trouvé ou inactif';
  END IF;

  -- Vérifier si l'alerte existe déjà
  SELECT id INTO v_alert_id
  FROM public.price_alerts
  WHERE user_id = p_user_id
    AND product_id = p_product_id;

  IF v_alert_id IS NOT NULL THEN
    -- Mettre à jour l'alerte existante
    UPDATE public.price_alerts
    SET 
      target_price = p_target_price,
      current_price = v_current_price,
      currency = v_currency,
      notified = false,
      notification_sent_at = NULL,
      updated_at = NOW()
    WHERE id = v_alert_id;
    RETURN v_alert_id;
  ELSE
    -- Créer une nouvelle alerte
    INSERT INTO public.price_alerts (
      user_id,
      product_id,
      target_price,
      current_price,
      currency
    ) VALUES (
      p_user_id,
      p_product_id,
      p_target_price,
      v_current_price,
      v_currency
    )
    RETURNING id INTO v_alert_id;
    RETURN v_alert_id;
  END IF;
END;
$$;

-- Fonction 2: Créer une alerte de stock
CREATE OR REPLACE FUNCTION public.create_stock_alert(
  p_user_id UUID,
  p_product_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alert_id UUID;
  v_product_type TEXT;
  v_stock_quantity INTEGER;
BEGIN
  -- Vérifier le type de produit et le stock
  SELECT 
    product_type,
    stock_quantity
  INTO v_product_type, v_stock_quantity
  FROM public.products
  WHERE id = p_product_id
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit non trouvé ou inactif';
  END IF;

  -- Vérifier si le produit est physique et en rupture de stock
  IF v_product_type != 'physical' THEN
    RAISE EXCEPTION 'Les alertes de stock sont uniquement disponibles pour les produits physiques';
  END IF;

  IF v_stock_quantity IS NOT NULL AND v_stock_quantity > 0 THEN
    RAISE EXCEPTION 'Le produit est actuellement en stock';
  END IF;

  -- Vérifier si l'alerte existe déjà
  SELECT id INTO v_alert_id
  FROM public.stock_alerts
  WHERE user_id = p_user_id
    AND product_id = p_product_id;

  IF v_alert_id IS NOT NULL THEN
    -- Réinitialiser l'alerte existante
    UPDATE public.stock_alerts
    SET 
      notified = false,
      notification_sent_at = NULL,
      updated_at = NOW()
    WHERE id = v_alert_id;
    RETURN v_alert_id;
  ELSE
    -- Créer une nouvelle alerte
    INSERT INTO public.stock_alerts (
      user_id,
      product_id
    ) VALUES (
      p_user_id,
      p_product_id
    )
    RETURNING id INTO v_alert_id;
    RETURN v_alert_id;
  END IF;
END;
$$;

-- Fonction 3: Vérifier les alertes de prix
CREATE OR REPLACE FUNCTION public.check_price_alerts()
RETURNS TABLE (
  alert_id UUID,
  user_id UUID,
  product_id UUID,
  product_name TEXT,
  current_price NUMERIC,
  target_price NUMERIC,
  currency TEXT,
  price_drop NUMERIC,
  price_drop_percent NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mettre à jour les prix actuels des alertes
  UPDATE public.price_alerts pa
  SET 
    current_price = COALESCE(p.promotional_price, p.price),
    currency = p.currency
  FROM public.products p
  WHERE pa.product_id = p.id
    AND pa.notified = false;

  -- Retourner les alertes qui doivent être notifiées
  RETURN QUERY
  SELECT 
    pa.id AS alert_id,
    pa.user_id,
    pa.product_id,
    p.name AS product_name,
    COALESCE(p.promotional_price, p.price) AS current_price,
    pa.target_price,
    p.currency,
    (COALESCE(p.promotional_price, p.price) - pa.target_price) AS price_drop,
    ROUND(((COALESCE(p.promotional_price, p.price) - pa.target_price) / pa.target_price * 100)::NUMERIC, 2) AS price_drop_percent
  FROM public.price_alerts pa
  INNER JOIN public.products p ON p.id = pa.product_id
  WHERE pa.notified = false
    AND (
      COALESCE(p.promotional_price, p.price) <= pa.target_price
      OR
      COALESCE(p.promotional_price, p.price) < pa.current_price
    )
    AND p.is_active = true;
END;
$$;

-- Fonction 4: Vérifier les alertes de stock
CREATE OR REPLACE FUNCTION public.check_stock_alerts()
RETURNS TABLE (
  alert_id UUID,
  user_id UUID,
  product_id UUID,
  product_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id AS alert_id,
    sa.user_id,
    sa.product_id,
    p.name AS product_name
  FROM public.stock_alerts sa
  INNER JOIN public.products p ON p.id = sa.product_id
  WHERE sa.notified = false
    AND p.product_type = 'physical'
    AND p.is_active = true
    AND p.stock_quantity IS NOT NULL
    AND p.stock_quantity > 0;
END;
$$;

-- Fonction 5: Enregistrer l'historique des prix
CREATE OR REPLACE FUNCTION public.record_price_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (OLD.price IS DISTINCT FROM NEW.price) OR 
     (OLD.promotional_price IS DISTINCT FROM NEW.promotional_price) THEN
    INSERT INTO public.price_history (
      product_id,
      price,
      promotional_price,
      currency
    ) VALUES (
      NEW.id,
      NEW.price,
      NEW.promotional_price,
      NEW.currency
    )
    ON CONFLICT (product_id, recorded_at) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- ÉTAPE 5: CRÉER LES TRIGGERS
-- ============================================================

CREATE TRIGGER trigger_record_price_history
AFTER UPDATE OF price, promotional_price ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.record_price_history();

-- ============================================================
-- ÉTAPE 6: CRÉER LES POLITIQUES RLS
-- ============================================================

-- RLS pour price_alerts
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own price alerts"
  ON public.price_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own price alerts"
  ON public.price_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own price alerts"
  ON public.price_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price alerts"
  ON public.price_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS pour stock_alerts
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stock alerts"
  ON public.stock_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stock alerts"
  ON public.stock_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock alerts"
  ON public.stock_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock alerts"
  ON public.stock_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS pour price_history
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view price history"
  ON public.price_history FOR SELECT
  USING (true);

-- ============================================================
-- ÉTAPE 7: COMMENTAIRES
-- ============================================================

COMMENT ON TABLE public.price_alerts IS 'Alertes de prix créées par les utilisateurs';
COMMENT ON TABLE public.stock_alerts IS 'Alertes de stock créées par les utilisateurs';
COMMENT ON TABLE public.price_history IS 'Historique des prix des produits';
COMMENT ON FUNCTION public.create_price_alert(UUID, UUID, NUMERIC) IS 'Crée ou met à jour une alerte de prix';
COMMENT ON FUNCTION public.create_stock_alert(UUID, UUID) IS 'Crée ou met à jour une alerte de stock';
COMMENT ON FUNCTION public.check_price_alerts() IS 'Vérifie les alertes de prix et retourne celles qui doivent être notifiées';
COMMENT ON FUNCTION public.check_stock_alerts() IS 'Vérifie les alertes de stock et retourne celles qui doivent être notifiées';
COMMENT ON FUNCTION public.record_price_history() IS 'Enregistre l''historique des prix lors des changements';







