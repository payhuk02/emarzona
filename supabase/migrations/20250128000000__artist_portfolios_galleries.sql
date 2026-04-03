-- =====================================================
-- EMARZONA ARTIST PORTFOLIOS & GALLERIES SYSTEM
-- Date: 28 Janvier 2025
-- Description: Système complet de portfolios et galeries virtuelles pour artistes
-- Version: 1.0
-- =====================================================

-- =====================================================
-- TABLE: artist_portfolios
-- Portfolio principal de l'artiste
-- =====================================================

CREATE TABLE IF NOT EXISTS public.artist_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_product_id UUID NOT NULL REFERENCES public.artist_products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Informations portfolio
  portfolio_name TEXT NOT NULL,
  portfolio_slug TEXT NOT NULL,
  portfolio_description TEXT,
  portfolio_bio TEXT, -- Biographie étendue de l'artiste
  portfolio_image_url TEXT, -- Image de couverture du portfolio
  
  -- Réseaux sociaux et liens
  portfolio_links JSONB DEFAULT '{}'::jsonb, -- {website, instagram, facebook, twitter, youtube, tiktok, linkedin}
  
  -- Paramètres d'affichage
  is_public BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE, -- Portfolio mis en avant
  display_order INTEGER DEFAULT 0, -- Ordre d'affichage
  
  -- Statistiques
  total_artworks INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(artist_product_id),
  UNIQUE(store_id, portfolio_slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_artist_portfolios_artist_product_id ON public.artist_portfolios(artist_product_id);
CREATE INDEX IF NOT EXISTS idx_artist_portfolios_store_id ON public.artist_portfolios(store_id);
CREATE INDEX IF NOT EXISTS idx_artist_portfolios_slug ON public.artist_portfolios(portfolio_slug);
CREATE INDEX IF NOT EXISTS idx_artist_portfolios_public ON public.artist_portfolios(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_artist_portfolios_featured ON public.artist_portfolios(is_featured) WHERE is_featured = TRUE;

-- =====================================================
-- TABLE: artist_galleries
-- Galeries d'œuvres dans le portfolio
-- =====================================================

CREATE TABLE IF NOT EXISTS public.artist_galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.artist_portfolios(id) ON DELETE CASCADE,
  
  -- Informations galerie
  gallery_name TEXT NOT NULL,
  gallery_slug TEXT NOT NULL,
  gallery_description TEXT,
  gallery_cover_image_url TEXT, -- Image de couverture de la galerie
  
  -- Catégorisation
  gallery_category TEXT, -- 'recent', 'featured', 'series', 'exhibitions', 'commissions', 'custom'
  gallery_tags TEXT[], -- Tags pour recherche et filtrage
  
  -- Paramètres
  is_public BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  
  -- Statistiques
  total_artworks INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(portfolio_id, gallery_slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_artist_galleries_portfolio_id ON public.artist_galleries(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_artist_galleries_category ON public.artist_galleries(gallery_category);
CREATE INDEX IF NOT EXISTS idx_artist_galleries_public ON public.artist_galleries(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_artist_galleries_tags ON public.artist_galleries USING GIN(gallery_tags);

-- =====================================================
-- TABLE: artist_gallery_artworks
-- Liaison entre galeries et œuvres (produits artistes)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.artist_gallery_artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES public.artist_galleries(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  artist_product_id UUID NOT NULL REFERENCES public.artist_products(id) ON DELETE CASCADE,
  
  -- Informations d'affichage
  artwork_title TEXT, -- Titre personnalisé pour cette galerie (peut différer du titre produit)
  artwork_description TEXT, -- Description personnalisée
  artwork_image_url TEXT, -- Image principale pour cette galerie
  
  -- Paramètres
  is_featured BOOLEAN DEFAULT FALSE, -- Œuvre mise en avant dans la galerie
  display_order INTEGER DEFAULT 0,
  
  -- Métadonnées
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(gallery_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gallery_artworks_gallery_id ON public.artist_gallery_artworks(gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_artworks_product_id ON public.artist_gallery_artworks(product_id);
CREATE INDEX IF NOT EXISTS idx_gallery_artworks_artist_product_id ON public.artist_gallery_artworks(artist_product_id);
CREATE INDEX IF NOT EXISTS idx_gallery_artworks_featured ON public.artist_gallery_artworks(is_featured) WHERE is_featured = TRUE;

-- =====================================================
-- TABLE: artist_portfolio_views
-- Tracking des vues de portfolio
-- =====================================================

CREATE TABLE IF NOT EXISTS public.artist_portfolio_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.artist_portfolios(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT, -- Pour les visiteurs anonymes
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_views_portfolio_id ON public.artist_portfolio_views(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_views_viewed_at ON public.artist_portfolio_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_views_user_id ON public.artist_portfolio_views(user_id);

-- =====================================================
-- TABLE: artist_portfolio_likes
-- Système de likes pour portfolios
-- =====================================================

CREATE TABLE IF NOT EXISTS public.artist_portfolio_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.artist_portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(portfolio_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_likes_portfolio_id ON public.artist_portfolio_likes(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_likes_user_id ON public.artist_portfolio_likes(user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_artist_portfolios_updated_at
  BEFORE UPDATE ON public.artist_portfolios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_artist_galleries_updated_at
  BEFORE UPDATE ON public.artist_galleries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour mettre à jour le compteur d'œuvres dans les galeries
CREATE OR REPLACE FUNCTION update_gallery_artwork_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.artist_galleries
    SET total_artworks = total_artworks + 1
    WHERE id = NEW.gallery_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.artist_galleries
    SET total_artworks = GREATEST(0, total_artworks - 1)
    WHERE id = OLD.gallery_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gallery_artwork_count_trigger
  AFTER INSERT OR DELETE ON public.artist_gallery_artworks
  FOR EACH ROW
  EXECUTE FUNCTION update_gallery_artwork_count();

-- Trigger pour mettre à jour le compteur d'œuvres dans les portfolios
CREATE OR REPLACE FUNCTION update_portfolio_artwork_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.artist_portfolios
    SET total_artworks = (
      SELECT COUNT(DISTINCT aga.product_id)
      FROM public.artist_gallery_artworks aga
      INNER JOIN public.artist_galleries ag ON aga.gallery_id = ag.id
      WHERE ag.portfolio_id = (SELECT portfolio_id FROM public.artist_galleries WHERE id = NEW.gallery_id)
    )
    WHERE id = (SELECT portfolio_id FROM public.artist_galleries WHERE id = NEW.gallery_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.artist_portfolios
    SET total_artworks = (
      SELECT COUNT(DISTINCT aga.product_id)
      FROM public.artist_gallery_artworks aga
      INNER JOIN public.artist_galleries ag ON aga.gallery_id = ag.id
      WHERE ag.portfolio_id = (SELECT portfolio_id FROM public.artist_galleries WHERE id = OLD.gallery_id)
    )
    WHERE id = (SELECT portfolio_id FROM public.artist_galleries WHERE id = OLD.gallery_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_portfolio_artwork_count_trigger
  AFTER INSERT OR DELETE ON public.artist_gallery_artworks
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_artwork_count();

-- Trigger pour mettre à jour le compteur de vues
CREATE OR REPLACE FUNCTION update_portfolio_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.artist_portfolios
  SET total_views = total_views + 1
  WHERE id = NEW.portfolio_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_portfolio_view_count_trigger
  AFTER INSERT ON public.artist_portfolio_views
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_view_count();

-- Trigger pour mettre à jour le compteur de likes
CREATE OR REPLACE FUNCTION update_portfolio_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.artist_portfolios
    SET total_likes = total_likes + 1
    WHERE id = NEW.portfolio_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.artist_portfolios
    SET total_likes = GREATEST(0, total_likes - 1)
    WHERE id = OLD.portfolio_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_portfolio_like_count_trigger
  AFTER INSERT OR DELETE ON public.artist_portfolio_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_like_count();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

-- Portfolios
ALTER TABLE public.artist_portfolios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view public portfolios" ON public.artist_portfolios;
CREATE POLICY "Public can view public portfolios"
  ON public.artist_portfolios FOR SELECT
  USING (is_public = TRUE);

DROP POLICY IF EXISTS "Store owners can manage their portfolios" ON public.artist_portfolios;
CREATE POLICY "Store owners can manage their portfolios"
  ON public.artist_portfolios FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = artist_portfolios.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Galeries
ALTER TABLE public.artist_galleries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view public galleries" ON public.artist_galleries;
CREATE POLICY "Public can view public galleries"
  ON public.artist_galleries FOR SELECT
  USING (
    is_public = TRUE AND
    EXISTS (
      SELECT 1 FROM public.artist_portfolios
      WHERE artist_portfolios.id = artist_galleries.portfolio_id
      AND artist_portfolios.is_public = TRUE
    )
  );

DROP POLICY IF EXISTS "Store owners can manage their galleries" ON public.artist_galleries;
CREATE POLICY "Store owners can manage their galleries"
  ON public.artist_galleries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.artist_portfolios ap
      INNER JOIN public.stores s ON ap.store_id = s.id
      WHERE ap.id = artist_galleries.portfolio_id
      AND s.user_id = auth.uid()
    )
  );

-- Gallery Artworks
ALTER TABLE public.artist_gallery_artworks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view gallery artworks" ON public.artist_gallery_artworks;
CREATE POLICY "Public can view gallery artworks"
  ON public.artist_gallery_artworks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.artist_galleries ag
      INNER JOIN public.artist_portfolios ap ON ag.portfolio_id = ap.id
      WHERE ag.id = artist_gallery_artworks.gallery_id
      AND ag.is_public = TRUE
      AND ap.is_public = TRUE
    )
  );

DROP POLICY IF EXISTS "Store owners can manage gallery artworks" ON public.artist_gallery_artworks;
CREATE POLICY "Store owners can manage gallery artworks"
  ON public.artist_gallery_artworks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.artist_galleries ag
      INNER JOIN public.artist_portfolios ap ON ag.portfolio_id = ap.id
      INNER JOIN public.stores s ON ap.store_id = s.id
      WHERE ag.id = artist_gallery_artworks.gallery_id
      AND s.user_id = auth.uid()
    )
  );

-- Portfolio Views
ALTER TABLE public.artist_portfolio_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create portfolio views" ON public.artist_portfolio_views;
CREATE POLICY "Anyone can create portfolio views"
  ON public.artist_portfolio_views FOR INSERT
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Store owners can view their portfolio stats" ON public.artist_portfolio_views;
CREATE POLICY "Store owners can view their portfolio stats"
  ON public.artist_portfolio_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.artist_portfolios ap
      INNER JOIN public.stores s ON ap.store_id = s.id
      WHERE ap.id = artist_portfolio_views.portfolio_id
      AND s.user_id = auth.uid()
    )
  );

-- Portfolio Likes
ALTER TABLE public.artist_portfolio_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can like portfolios" ON public.artist_portfolio_likes;
CREATE POLICY "Authenticated users can like portfolios"
  ON public.artist_portfolio_likes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view portfolio likes" ON public.artist_portfolio_likes;
CREATE POLICY "Public can view portfolio likes"
  ON public.artist_portfolio_likes FOR SELECT
  USING (TRUE);

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour générer un slug unique
CREATE OR REPLACE FUNCTION generate_portfolio_slug(portfolio_name TEXT, store_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Créer le slug de base
  base_slug := lower(regexp_replace(portfolio_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  -- Vérifier l'unicité
  WHILE EXISTS (
    SELECT 1 FROM public.artist_portfolios
    WHERE portfolio_slug = final_slug AND artist_portfolios.store_id = generate_portfolio_slug.store_id
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer un slug de galerie unique
CREATE OR REPLACE FUNCTION generate_gallery_slug(gallery_name TEXT, portfolio_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(gallery_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  WHILE EXISTS (
    SELECT 1 FROM public.artist_galleries
    WHERE gallery_slug = final_slug AND artist_galleries.portfolio_id = generate_gallery_slug.portfolio_id
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON TABLE public.artist_portfolios IS 'Portfolios principaux des artistes';
COMMENT ON TABLE public.artist_galleries IS 'Galeries d''œuvres dans les portfolios';
COMMENT ON TABLE public.artist_gallery_artworks IS 'Liaison entre galeries et œuvres';
COMMENT ON TABLE public.artist_portfolio_views IS 'Tracking des vues de portfolios';
COMMENT ON TABLE public.artist_portfolio_likes IS 'Système de likes pour portfolios';

