-- ================================================================
-- Améliorations Wishlist : Alertes prix et partage
-- ================================================================
-- Ajoute les fonctionnalités avancées à la wishlist :
-- - Alertes prix (notification quand prix baisse)
-- - Partage de wishlist (lien public)
-- - Suivi des prix historiques
-- ================================================================

-- Ajouter colonnes à user_favorites pour les alertes prix
ALTER TABLE public.user_favorites
ADD COLUMN IF NOT EXISTS price_when_added NUMERIC,
ADD COLUMN IF NOT EXISTS price_drop_alert_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS price_drop_threshold NUMERIC DEFAULT 0, -- Pourcentage minimum de baisse
ADD COLUMN IF NOT EXISTS last_price_check TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS price_drop_notified BOOLEAN DEFAULT false;

-- Table pour les liens de partage de wishlist
CREATE TABLE IF NOT EXISTS public.wishlist_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour wishlist_shares
CREATE INDEX IF NOT EXISTS idx_wishlist_shares_user_id ON public.wishlist_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_shares_token ON public.wishlist_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_wishlist_shares_active ON public.wishlist_shares(is_active, expires_at);

-- Table pour les alertes prix envoyées (historique)
CREATE TABLE IF NOT EXISTS public.price_drop_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  old_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  price_drop_percentage NUMERIC NOT NULL,
  alert_sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  alert_sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
  email_sent BOOLEAN DEFAULT false
);

-- Index pour price_drop_alerts
CREATE INDEX IF NOT EXISTS idx_price_drop_alerts_user_id ON public.price_drop_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_drop_alerts_product_id ON public.price_drop_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_price_drop_alerts_sent_at ON public.price_drop_alerts(alert_sent_at DESC);

-- Index unique pour empêcher plusieurs alertes par jour pour le même user/product
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_drop_alerts_unique_daily 
ON public.price_drop_alerts(user_id, product_id, alert_sent_date);

-- Fonction pour générer un token de partage unique
CREATE OR REPLACE FUNCTION public.generate_wishlist_share_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  -- Générer un token aléatoire de 32 caractères
  token := encode(gen_random_bytes(16), 'hex');
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Fonction RPC pour créer un lien de partage
CREATE OR REPLACE FUNCTION public.create_wishlist_share(
  p_expires_in_days INTEGER DEFAULT 30
)
RETURNS TEXT AS $$
DECLARE
  v_user_id UUID;
  v_token TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Récupérer l'utilisateur actuel
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Générer un token unique
  v_token := public.generate_wishlist_share_token();
  
  -- Calculer la date d'expiration
  v_expires_at := now() + (p_expires_in_days || ' days')::INTERVAL;
  
  -- Désactiver les anciens liens de partage
  UPDATE public.wishlist_shares
  SET is_active = false
  WHERE user_id = v_user_id AND is_active = true;
  
  -- Créer le nouveau lien
  INSERT INTO public.wishlist_shares (user_id, share_token, expires_at)
  VALUES (v_user_id, v_token, v_expires_at)
  ON CONFLICT (share_token) DO NOTHING;
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction RPC pour vérifier les baisses de prix
CREATE OR REPLACE FUNCTION public.check_price_drops()
RETURNS TABLE (
  user_id UUID,
  product_id UUID,
  old_price NUMERIC,
  new_price NUMERIC,
  price_drop_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH current_prices AS (
    SELECT 
      uf.user_id,
      uf.product_id,
      uf.price_when_added AS old_price,
      p.price AS new_price,
      p.promotional_price,
      uf.price_drop_threshold,
      uf.price_drop_notified
    FROM public.user_favorites uf
    INNER JOIN public.products p ON uf.product_id = p.id
    WHERE 
      uf.price_drop_alert_enabled = true
      AND uf.price_when_added IS NOT NULL
      AND p.is_active = true
      AND (uf.price_drop_notified = false OR uf.last_price_check < p.updated_at)
  ),
  price_changes AS (
    SELECT 
      cp.user_id,
      cp.product_id,
      cp.old_price,
      COALESCE(cp.promotional_price, cp.new_price) AS new_price,
      CASE 
        WHEN cp.old_price > 0 THEN 
          ((cp.old_price - COALESCE(cp.promotional_price, cp.new_price)) / cp.old_price * 100)
        ELSE 0
      END AS price_drop_percentage
    FROM current_prices cp
    WHERE 
      COALESCE(cp.promotional_price, cp.new_price) < cp.old_price
      AND (
        cp.price_drop_threshold = 0 OR
        ((cp.old_price - COALESCE(cp.promotional_price, cp.new_price)) / cp.old_price * 100) >= cp.price_drop_threshold
      )
  )
  SELECT 
    pc.user_id,
    pc.product_id,
    pc.old_price,
    pc.new_price,
    pc.price_drop_percentage
  FROM price_changes pc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction RPC pour mettre à jour le prix lors de l'ajout
CREATE OR REPLACE FUNCTION public.update_favorite_price_when_added()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le prix au moment de l'ajout si pas déjà défini
  IF NEW.price_when_added IS NULL THEN
    SELECT price INTO NEW.price_when_added
    FROM public.products
    WHERE id = NEW.product_id;
  END IF;
  
  -- Mettre à jour last_price_check
  NEW.last_price_check = now();
  NEW.price_drop_notified = false;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le prix lors de l'ajout
DROP TRIGGER IF EXISTS trigger_update_favorite_price ON public.user_favorites;
CREATE TRIGGER trigger_update_favorite_price
  BEFORE INSERT ON public.user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_favorite_price_when_added();

-- Fonction pour mettre à jour alert_sent_date automatiquement
CREATE OR REPLACE FUNCTION public.update_alert_sent_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour alert_sent_date basé sur alert_sent_at
  NEW.alert_sent_date := DATE(NEW.alert_sent_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour alert_sent_date lors de l'insertion/mise à jour
DROP TRIGGER IF EXISTS trigger_update_alert_sent_date ON public.price_drop_alerts;
CREATE TRIGGER trigger_update_alert_sent_date
  BEFORE INSERT OR UPDATE OF alert_sent_at ON public.price_drop_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_alert_sent_date();

-- ================================================================
-- Row Level Security (RLS)
-- ================================================================

-- RLS pour wishlist_shares
ALTER TABLE public.wishlist_shares ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own wishlist shares" ON public.wishlist_shares;
DROP POLICY IF EXISTS "Users can create their own wishlist shares" ON public.wishlist_shares;
DROP POLICY IF EXISTS "Users can update their own wishlist shares" ON public.wishlist_shares;
DROP POLICY IF EXISTS "Public can view active shared wishlists" ON public.wishlist_shares;

-- Politique : Les utilisateurs peuvent voir leurs propres liens
CREATE POLICY "Users can view their own wishlist shares"
  ON public.wishlist_shares
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent créer leurs propres liens
CREATE POLICY "Users can create their own wishlist shares"
  ON public.wishlist_shares
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres liens
CREATE POLICY "Users can update their own wishlist shares"
  ON public.wishlist_shares
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Politique : Lecture publique des liens actifs (pour partage)
-- Note: now() dans RLS est acceptable car évalué au moment de la requête
CREATE POLICY "Public can view active shared wishlists"
  ON public.wishlist_shares
  FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP));

-- RLS pour price_drop_alerts
ALTER TABLE public.price_drop_alerts ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own price alerts" ON public.price_drop_alerts;
DROP POLICY IF EXISTS "System can create price alerts" ON public.price_drop_alerts;

-- Politique : Les utilisateurs peuvent voir leurs propres alertes
CREATE POLICY "Users can view their own price alerts"
  ON public.price_drop_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Système peut créer des alertes (via trigger/fonction)
CREATE POLICY "System can create price alerts"
  ON public.price_drop_alerts
  FOR INSERT
  WITH CHECK (true);

-- Commentaires
COMMENT ON COLUMN public.user_favorites.price_when_added IS 'Prix du produit au moment de l''ajout à la wishlist';
COMMENT ON COLUMN public.user_favorites.price_drop_alert_enabled IS 'Activer les notifications de baisse de prix';
COMMENT ON COLUMN public.user_favorites.price_drop_threshold IS 'Pourcentage minimum de baisse pour déclencher une alerte (0 = toute baisse)';
COMMENT ON TABLE public.wishlist_shares IS 'Liens de partage de wishlist avec expiration';
COMMENT ON TABLE public.price_drop_alerts IS 'Historique des alertes de baisse de prix envoyées';

