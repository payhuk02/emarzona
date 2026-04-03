-- Migration: Système de Reviews & Ratings Universel
-- Date: 27 octobre 2025
-- Description: Reviews avancés pour tous types de produits (Digital, Physical, Service, Course)

-- ============================================================
-- TABLE: reviews (ENHANCED)
-- Stocke les avis clients avec rich features
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relations
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL, -- Vérification achat
  
  -- Contenu review
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  
  -- Type de produit (pour filtrage)
  product_type TEXT NOT NULL CHECK (product_type IN ('digital', 'physical', 'service', 'course')),
  
  -- Ratings détaillés (optionnels, selon le type de produit)
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5), -- Pour physical
  course_content_rating INTEGER CHECK (course_content_rating >= 1 AND course_content_rating <= 5), -- Pour courses
  instructor_rating INTEGER CHECK (instructor_rating >= 1 AND instructor_rating <= 5), -- Pour courses
  
  -- Metadata
  verified_purchase BOOLEAN DEFAULT FALSE, -- Si l'achat est vérifié
  is_featured BOOLEAN DEFAULT FALSE, -- Review mise en avant
  is_approved BOOLEAN DEFAULT TRUE, -- Modération
  is_flagged BOOLEAN DEFAULT FALSE,
  
  -- Stats (denormalized)
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  
  -- Informations acheteur (denormalized pour affichage)
  reviewer_name TEXT,
  reviewer_avatar TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte : un utilisateur ne peut laisser qu'un seul avis par produit
  UNIQUE(product_id, user_id)
);

-- Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_type ON public.reviews(product_type);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON public.reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_is_featured ON public.reviews(is_featured);
CREATE INDEX IF NOT EXISTS idx_reviews_verified_purchase ON public.reviews(verified_purchase);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Index composite pour recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved 
  ON public.reviews(product_id, is_approved, created_at DESC);

-- ============================================================
-- TABLE: review_replies
-- Réponses aux reviews (vendeur ou admin)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.review_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relations
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contenu
  content TEXT NOT NULL,
  
  -- Type de réponse
  reply_type TEXT DEFAULT 'seller' CHECK (reply_type IN ('seller', 'admin', 'customer')),
  
  -- Metadata
  is_official BOOLEAN DEFAULT FALSE, -- Réponse officielle du vendeur/admin
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON public.review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_user_id ON public.review_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_created_at ON public.review_replies(created_at DESC);

-- ============================================================
-- TABLE: review_votes
-- Votes "utile/pas utile" sur les reviews
-- ============================================================

CREATE TABLE IF NOT EXISTS public.review_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relations
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Vote
  is_helpful BOOLEAN NOT NULL, -- true = utile, false = pas utile
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte : un utilisateur ne peut voter qu'une fois par review
  UNIQUE(review_id, user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON public.review_votes(user_id);

-- ============================================================
-- TABLE: review_media
-- Photos/vidéos attachées aux reviews
-- ============================================================

CREATE TABLE IF NOT EXISTS public.review_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relations
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  
  -- Media
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  media_thumbnail_url TEXT, -- Pour les vidéos
  
  -- Metadata
  file_size BIGINT,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  
  -- Order
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_review_media_review_id ON public.review_media(review_id);
CREATE INDEX IF NOT EXISTS idx_review_media_display_order ON public.review_media(display_order);

-- ============================================================
-- TABLE: product_review_stats
-- Statistiques agrégées des reviews par produit (denormalized pour performance)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_review_stats (
  product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Stats globales
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  
  -- Distribution des notes
  rating_5_count INTEGER DEFAULT 0,
  rating_4_count INTEGER DEFAULT 0,
  rating_3_count INTEGER DEFAULT 0,
  rating_2_count INTEGER DEFAULT 0,
  rating_1_count INTEGER DEFAULT 0,
  
  -- Ratings détaillés moyens (si disponibles)
  avg_quality_rating DECIMAL(3,2),
  avg_value_rating DECIMAL(3,2),
  avg_service_rating DECIMAL(3,2),
  avg_delivery_rating DECIMAL(3,2),
  avg_course_content_rating DECIMAL(3,2),
  avg_instructor_rating DECIMAL(3,2),
  
  -- Stats supplémentaires
  verified_purchases_count INTEGER DEFAULT 0,
  featured_reviews_count INTEGER DEFAULT 0,
  
  -- Timestamps
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_product_review_stats_average_rating 
  ON public.product_review_stats(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_product_review_stats_total_reviews 
  ON public.product_review_stats(total_reviews DESC);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function: update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS trigger_reviews_updated_at ON public.reviews;
CREATE TRIGGER trigger_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_review_replies_updated_at ON public.review_replies;
CREATE TRIGGER trigger_review_replies_updated_at
  BEFORE UPDATE ON public.review_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Function: update_review_reply_count
-- Met à jour le compteur de réponses d'une review
CREATE OR REPLACE FUNCTION public.update_review_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews
    SET reply_count = reply_count + 1
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews
    SET reply_count = reply_count - 1
    WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour compteur réponses
DROP TRIGGER IF EXISTS trigger_update_reply_count ON public.review_replies;
CREATE TRIGGER trigger_update_reply_count
  AFTER INSERT OR DELETE ON public.review_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_review_reply_count();

-- Function: update_review_vote_counts
-- Met à jour les compteurs de votes d'une review
CREATE OR REPLACE FUNCTION public.update_review_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_helpful THEN
      UPDATE public.reviews
      SET helpful_count = helpful_count + 1
      WHERE id = NEW.review_id;
    ELSE
      UPDATE public.reviews
      SET not_helpful_count = not_helpful_count + 1
      WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_helpful <> NEW.is_helpful THEN
      IF NEW.is_helpful THEN
        UPDATE public.reviews
        SET helpful_count = helpful_count + 1, not_helpful_count = not_helpful_count - 1
        WHERE id = NEW.review_id;
      ELSE
        UPDATE public.reviews
        SET helpful_count = helpful_count - 1, not_helpful_count = not_helpful_count + 1
        WHERE id = NEW.review_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_helpful THEN
      UPDATE public.reviews
      SET helpful_count = helpful_count - 1
      WHERE id = OLD.review_id;
    ELSE
      UPDATE public.reviews
      SET not_helpful_count = not_helpful_count - 1
      WHERE id = OLD.review_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour compteurs votes
DROP TRIGGER IF EXISTS trigger_update_vote_counts ON public.review_votes;
CREATE TRIGGER trigger_update_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.review_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_review_vote_counts();

-- Function: update_product_review_stats
-- Met à jour les statistiques agrégées d'un produit
CREATE OR REPLACE FUNCTION public.update_product_review_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id UUID;
BEGIN
  -- Déterminer le product_id
  IF TG_OP = 'DELETE' THEN
    v_product_id := OLD.product_id;
  ELSE
    v_product_id := NEW.product_id;
  END IF;

  -- Upsert des statistiques
  INSERT INTO public.product_review_stats (product_id)
  VALUES (v_product_id)
  ON CONFLICT (product_id) DO NOTHING;

  -- Calculer et mettre à jour les stats
  UPDATE public.product_review_stats
  SET
    total_reviews = (
      SELECT COUNT(*) FROM public.reviews 
      WHERE product_id = v_product_id AND is_approved = TRUE
    ),
    average_rating = (
      SELECT COALESCE(AVG(rating), 0) FROM public.reviews 
      WHERE product_id = v_product_id AND is_approved = TRUE
    ),
    rating_5_count = (
      SELECT COUNT(*) FROM public.reviews 
      WHERE product_id = v_product_id AND is_approved = TRUE AND rating = 5
    ),
    rating_4_count = (
      SELECT COUNT(*) FROM public.reviews 
      WHERE product_id = v_product_id AND is_approved = TRUE AND rating = 4
    ),
    rating_3_count = (
      SELECT COUNT(*) FROM public.reviews 
      WHERE product_id = v_product_id AND is_approved = TRUE AND rating = 3
    ),
    rating_2_count = (
      SELECT COUNT(*) FROM public.reviews 
      WHERE product_id = v_product_id AND is_approved = TRUE AND rating = 2
    ),
    rating_1_count = (
      SELECT COUNT(*) FROM public.reviews 
      WHERE product_id = v_product_id AND is_approved = TRUE AND rating = 1
    ),
    verified_purchases_count = (
      SELECT COUNT(*) FROM public.reviews 
      WHERE product_id = v_product_id AND is_approved = TRUE AND verified_purchase = TRUE
    ),
    featured_reviews_count = (
      SELECT COUNT(*) FROM public.reviews 
      WHERE product_id = v_product_id AND is_approved = TRUE AND is_featured = TRUE
    ),
    avg_quality_rating = (
      SELECT AVG(quality_rating) FROM public.reviews 
      WHERE product_id = v_product_id AND is_approved = TRUE AND quality_rating IS NOT NULL
    ),
    avg_value_rating = (
      SELECT AVG(value_rating) FROM public.reviews 
      WHERE product_id = v_product_id AND is_approved = TRUE AND value_rating IS NOT NULL
    ),
    avg_service_rating = (
      SELECT AVG(service_rating) FROM public.reviews 
      WHERE product_id = v_product_id AND is_approved = TRUE AND service_rating IS NOT NULL
    ),
    avg_delivery_rating = (
      SELECT AVG(delivery_rating) FROM public.reviews 
      WHERE product_id = v_product_id AND is_approved = TRUE AND delivery_rating IS NOT NULL
    ),
    avg_course_content_rating = (
      SELECT AVG(course_content_rating) FROM public.reviews 
      WHERE product_id = v_product_id AND is_approved = TRUE AND course_content_rating IS NOT NULL
    ),
    avg_instructor_rating = (
      SELECT AVG(instructor_rating) FROM public.reviews 
      WHERE product_id = v_product_id AND is_approved = TRUE AND instructor_rating IS NOT NULL
    ),
    last_updated = NOW()
  WHERE product_id = v_product_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour stats produit
DROP TRIGGER IF EXISTS trigger_update_product_stats ON public.reviews;
CREATE TRIGGER trigger_update_product_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_review_stats();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Activer RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_review_stats ENABLE ROW LEVEL SECURITY;

-- POLICIES: reviews

-- Tout le monde peut voir les reviews approuvées
CREATE POLICY "Anyone can view approved reviews"
  ON public.reviews
  FOR SELECT
  USING (is_approved = TRUE);

-- Users peuvent voir leurs propres reviews (même non approuvées)
CREATE POLICY "Users can view own reviews"
  ON public.reviews
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users peuvent créer des reviews s'ils ont acheté le produit
CREATE POLICY "Users can create reviews for purchased products"
  ON public.reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = reviews.order_id
      AND orders.user_id = auth.uid()
      AND orders.status = 'completed'
    )
  );

-- Users peuvent modifier leurs propres reviews
CREATE POLICY "Users can update own reviews"
  ON public.reviews
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users peuvent supprimer leurs propres reviews
CREATE POLICY "Users can delete own reviews"
  ON public.reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins/Staff peuvent tout faire
CREATE POLICY "Admins can manage all reviews"
  ON public.reviews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- POLICIES: review_replies

-- Tout le monde peut voir les réponses aux reviews approuvées
CREATE POLICY "Anyone can view replies"
  ON public.review_replies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id = review_replies.review_id
      AND reviews.is_approved = TRUE
    )
  );

-- Users peuvent créer des réponses
CREATE POLICY "Users can create replies"
  ON public.review_replies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users peuvent modifier/supprimer leurs propres réponses
CREATE POLICY "Users can update own replies"
  ON public.review_replies
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own replies"
  ON public.review_replies
  FOR DELETE
  USING (auth.uid() = user_id);

-- POLICIES: review_votes

-- Users peuvent voter
CREATE POLICY "Users can vote on reviews"
  ON public.review_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users peuvent modifier leurs votes
CREATE POLICY "Users can update own votes"
  ON public.review_votes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users peuvent supprimer leurs votes
CREATE POLICY "Users can delete own votes"
  ON public.review_votes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Users peuvent voir les votes (pour savoir s'ils ont déjà voté)
CREATE POLICY "Users can view own votes"
  ON public.review_votes
  FOR SELECT
  USING (auth.uid() = user_id);

-- POLICIES: review_media

-- Tout le monde peut voir les media des reviews approuvées
CREATE POLICY "Anyone can view media"
  ON public.review_media
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id = review_media.review_id
      AND reviews.is_approved = TRUE
    )
  );

-- Users peuvent ajouter des media à leurs reviews
CREATE POLICY "Users can add media to own reviews"
  ON public.review_media
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id = review_media.review_id
      AND reviews.user_id = auth.uid()
    )
  );

-- POLICIES: product_review_stats

-- Tout le monde peut voir les stats
CREATE POLICY "Anyone can view review stats"
  ON public.product_review_stats
  FOR SELECT
  USING (true);

COMMENT ON TABLE public.reviews IS 'Avis et notes des clients pour tous types de produits';
COMMENT ON TABLE public.review_replies IS 'Réponses aux avis (vendeur, admin, client)';
COMMENT ON TABLE public.review_votes IS 'Votes utile/pas utile sur les avis';
COMMENT ON TABLE public.review_media IS 'Photos et vidéos attachées aux avis';
COMMENT ON TABLE public.product_review_stats IS 'Statistiques agrégées des avis par produit (denormalized)';

