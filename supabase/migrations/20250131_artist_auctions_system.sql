-- =========================================================
-- Migration : Système de Ventes aux Enchères pour Œuvres d'Artistes
-- Date : 31 Janvier 2025
-- Description : Système complet de ventes aux enchères pour produits artistes
-- =========================================================

-- ============================================================
-- 1. TABLE: artist_product_auctions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.artist_product_auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_product_id UUID NOT NULL REFERENCES public.artist_products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Informations enchère
  auction_title TEXT NOT NULL,
  auction_description TEXT,
  auction_slug TEXT UNIQUE NOT NULL,
  
  -- Dates et durée
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  extended_end_date TIMESTAMPTZ, -- Si prolongation
  
  -- Prix
  starting_price NUMERIC(10, 2) NOT NULL CHECK (starting_price >= 0),
  reserve_price NUMERIC(10, 2), -- Prix de réserve (optionnel)
  buy_now_price NUMERIC(10, 2), -- Prix d'achat immédiat (optionnel)
  current_bid NUMERIC(10, 2) DEFAULT 0,
  minimum_bid_increment NUMERIC(10, 2) DEFAULT 1000, -- Incrément minimum (XOF)
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',           -- Brouillon
    'scheduled',       -- Programmée
    'active',          -- En cours
    'paused',          -- En pause
    'ended',           -- Terminée
    'cancelled',       -- Annulée
    'sold'             -- Vendue
  )),
  
  -- Statistiques
  total_bids INTEGER DEFAULT 0,
  unique_bidders INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- Options
  allow_automatic_extension BOOLEAN DEFAULT true, -- Prolongation auto si offre dernière minute
  extension_minutes INTEGER DEFAULT 5, -- Minutes de prolongation
  require_verification BOOLEAN DEFAULT false, -- Vérification identité pour enchérir
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  CHECK (end_date > start_date),
  CHECK (reserve_price IS NULL OR reserve_price >= starting_price),
  CHECK (buy_now_price IS NULL OR buy_now_price >= starting_price)
);

-- ============================================================
-- 2. TABLE: auction_bids
-- ============================================================

CREATE TABLE IF NOT EXISTS public.auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.artist_product_auctions(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Montant
  bid_amount NUMERIC(10, 2) NOT NULL CHECK (bid_amount > 0),
  currency TEXT NOT NULL DEFAULT 'XOF',
  
  -- Type d'offre
  bid_type TEXT NOT NULL DEFAULT 'manual' CHECK (bid_type IN (
    'manual',          -- Offre manuelle
    'auto',            -- Offre automatique (proxy bidding)
    'buy_now'          -- Achat immédiat
  )),
  
  -- Proxy bidding (enchère automatique)
  max_bid_amount NUMERIC(10, 2), -- Montant maximum pour proxy bidding
  is_proxy_bid BOOLEAN DEFAULT false,
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',         -- En attente
    'active',          -- Active (meilleure offre)
    'outbid',          -- Dépassée
    'winning',         -- Gagnante
    'cancelled'        -- Annulée
  )),
  
  -- Métadonnées
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  UNIQUE(auction_id, bidder_id, bid_amount) -- Éviter doublons
);

-- ============================================================
-- 3. TABLE: auction_watchlist
-- ============================================================

CREATE TABLE IF NOT EXISTS public.auction_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.artist_product_auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notifications
  notify_on_new_bid BOOLEAN DEFAULT true,
  notify_on_ending_soon BOOLEAN DEFAULT true,
  notify_on_ending BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contrainte unique
  UNIQUE(auction_id, user_id)
);

-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_auctions_artist_product_id ON public.artist_product_auctions(artist_product_id);
CREATE INDEX IF NOT EXISTS idx_auctions_store_id ON public.artist_product_auctions(store_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON public.artist_product_auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_start_date ON public.artist_product_auctions(start_date);
CREATE INDEX IF NOT EXISTS idx_auctions_end_date ON public.artist_product_auctions(end_date);
CREATE INDEX IF NOT EXISTS idx_auctions_slug ON public.artist_product_auctions(auction_slug);

CREATE INDEX IF NOT EXISTS idx_bids_auction_id ON public.auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder_id ON public.auction_bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON public.auction_bids(status);
CREATE INDEX IF NOT EXISTS idx_bids_created_at ON public.auction_bids(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_amount ON public.auction_bids(bid_amount DESC);

CREATE INDEX IF NOT EXISTS idx_watchlist_auction_id ON public.auction_watchlist(auction_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON public.auction_watchlist(user_id);

-- ============================================================
-- 5. FUNCTIONS
-- ============================================================

-- Fonction pour générer un slug unique
CREATE OR REPLACE FUNCTION generate_auction_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Normaliser le titre en slug
  base_slug := lower(regexp_replace(title, '[^a-z0-9]+', '-', 'gi'));
  base_slug := trim(both '-' from base_slug);
  
  -- Vérifier l'unicité
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.artist_product_auctions WHERE auction_slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour placer une enchère
CREATE OR REPLACE FUNCTION place_auction_bid(
  p_auction_id UUID,
  p_bidder_id UUID,
  p_bid_amount NUMERIC,
  p_bid_type TEXT DEFAULT 'manual',
  p_max_bid_amount NUMERIC DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_auction public.artist_product_auctions%ROWTYPE;
  v_current_bid NUMERIC;
  v_min_increment NUMERIC;
  v_bid_id UUID;
BEGIN
  -- Récupérer l'enchère
  SELECT * INTO v_auction
  FROM public.artist_product_auctions
  WHERE id = p_auction_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enchère non trouvée';
  END IF;
  
  -- Vérifier que l'enchère est active
  IF v_auction.status != 'active' THEN
    RAISE EXCEPTION 'L''enchère n''est pas active';
  END IF;
  
  -- Vérifier que l'enchère n'est pas terminée
  IF v_auction.end_date < NOW() THEN
    RAISE EXCEPTION 'L''enchère est terminée';
  END IF;
  
  -- Récupérer la meilleure offre actuelle
  SELECT COALESCE(MAX(bid_amount), v_auction.starting_price)
  INTO v_current_bid
  FROM public.auction_bids
  WHERE auction_id = p_auction_id
  AND status IN ('active', 'winning');
  
  -- Calculer l'incrément minimum
  v_min_increment := v_auction.minimum_bid_increment;
  
  -- Vérifier que l'offre est suffisante
  IF p_bid_amount < v_current_bid + v_min_increment THEN
    RAISE EXCEPTION 'L''offre doit être d''au moins % XOF', (v_current_bid + v_min_increment);
  END IF;
  
  -- Marquer les anciennes offres comme "outbid"
  UPDATE public.auction_bids
  SET status = 'outbid'
  WHERE auction_id = p_auction_id
  AND status IN ('active', 'winning')
  AND bidder_id != p_bidder_id;
  
  -- Créer la nouvelle offre
  INSERT INTO public.auction_bids (
    auction_id,
    bidder_id,
    bid_amount,
    bid_type,
    max_bid_amount,
    is_proxy_bid,
    status
  ) VALUES (
    p_auction_id,
    p_bidder_id,
    p_bid_amount,
    p_bid_type,
    p_max_bid_amount,
    (p_max_bid_amount IS NOT NULL AND p_bid_amount < p_max_bid_amount),
    'active'
  )
  RETURNING id INTO v_bid_id;
  
  -- Mettre à jour l'enchère
  UPDATE public.artist_product_auctions
  SET 
    current_bid = p_bid_amount,
    total_bids = total_bids + 1,
    unique_bidders = (
      SELECT COUNT(DISTINCT bidder_id)
      FROM public.auction_bids
      WHERE auction_id = p_auction_id
    ),
    updated_at = NOW()
  WHERE id = p_auction_id;
  
  -- Prolongation automatique si dernière minute
  IF v_auction.allow_automatic_extension AND 
     (v_auction.end_date - NOW()) < INTERVAL '5 minutes' THEN
    UPDATE public.artist_product_auctions
    SET end_date = end_date + (v_auction.extension_minutes || ' minutes')::INTERVAL
    WHERE id = p_auction_id;
  END IF;
  
  RETURN v_bid_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour terminer une enchère
CREATE OR REPLACE FUNCTION end_auction(p_auction_id UUID)
RETURNS UUID AS $$
DECLARE
  v_winning_bid_id UUID;
  v_winning_bidder_id UUID;
BEGIN
  -- Trouver l'offre gagnante
  SELECT id, bidder_id INTO v_winning_bid_id, v_winning_bidder_id
  FROM public.auction_bids
  WHERE auction_id = p_auction_id
  AND status = 'active'
  ORDER BY bid_amount DESC, created_at ASC
  LIMIT 1;
  
  -- Marquer l'offre comme gagnante
  IF v_winning_bid_id IS NOT NULL THEN
    UPDATE public.auction_bids
    SET status = 'winning'
    WHERE id = v_winning_bid_id;
    
    -- Mettre à jour le statut de l'enchère
    UPDATE public.artist_product_auctions
    SET 
      status = 'sold',
      updated_at = NOW()
    WHERE id = p_auction_id;
  ELSE
    -- Pas d'offre gagnante, enchère terminée sans vente
    UPDATE public.artist_product_auctions
    SET 
      status = 'ended',
      updated_at = NOW()
    WHERE id = p_auction_id;
  END IF;
  
  RETURN v_winning_bid_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier et mettre à jour le statut des enchères
CREATE OR REPLACE FUNCTION update_auction_statuses()
RETURNS void AS $$
BEGIN
  -- Activer les enchères programmées
  UPDATE public.artist_product_auctions
  SET status = 'active'
  WHERE status = 'scheduled'
  AND start_date <= NOW()
  AND end_date > NOW();
  
  -- Terminer les enchères expirées
  UPDATE public.artist_product_auctions
  SET status = 'ended'
  WHERE status = 'active'
  AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. TRIGGERS
-- ============================================================

-- Trigger pour updated_at
CREATE TRIGGER update_auctions_updated_at
  BEFORE UPDATE ON public.artist_product_auctions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour mettre à jour automatiquement les statuts
CREATE OR REPLACE FUNCTION trigger_update_auction_statuses()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_auction_statuses();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Créer un trigger qui s'exécute périodiquement (via pg_cron ou application)
-- Note: Pour un vrai système, utiliser pg_cron ou un job scheduler

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================

ALTER TABLE public.artist_product_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_watchlist ENABLE ROW LEVEL SECURITY;

-- Enchères : Lecture publique pour les enchères actives
CREATE POLICY "Public can view active auctions"
ON public.artist_product_auctions FOR SELECT
USING (status IN ('active', 'scheduled', 'ended', 'sold'));

-- Enchères : Propriétaires peuvent gérer leurs enchères
CREATE POLICY "Store owners can manage their auctions"
ON public.artist_product_auctions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = artist_product_auctions.store_id
    AND stores.user_id = auth.uid()
  )
);

-- Offres : Utilisateurs peuvent voir leurs offres et les offres publiques
CREATE POLICY "Users can view their bids and public bids"
ON public.auction_bids FOR SELECT
USING (
  bidder_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.artist_product_auctions
    WHERE artist_product_auctions.id = auction_bids.auction_id
    AND artist_product_auctions.status IN ('active', 'ended', 'sold')
  )
);

-- Offres : Utilisateurs peuvent placer des offres
CREATE POLICY "Users can place bids"
ON public.auction_bids FOR INSERT
WITH CHECK (bidder_id = auth.uid());

-- Offres : Utilisateurs peuvent modifier leurs offres (annulation)
CREATE POLICY "Users can update their bids"
ON public.auction_bids FOR UPDATE
USING (bidder_id = auth.uid())
WITH CHECK (bidder_id = auth.uid());

-- Watchlist : Utilisateurs peuvent gérer leur watchlist
CREATE POLICY "Users can manage their watchlist"
ON public.auction_watchlist FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 8. COMMENTS
-- ============================================================

COMMENT ON TABLE public.artist_product_auctions IS 'Enchères pour œuvres d''artistes';
COMMENT ON TABLE public.auction_bids IS 'Offres sur les enchères';
COMMENT ON TABLE public.auction_watchlist IS 'Liste de surveillance des enchères';

