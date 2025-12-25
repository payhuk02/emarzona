-- =====================================================
-- EMARZONA PORTFOLIO COMMENTS SYSTEM
-- Date: 28 Janvier 2025
-- Description: Système de commentaires pour portfolios d'artistes
-- Version: 1.0
-- =====================================================

-- =====================================================
-- TABLE: portfolio_comments
-- Commentaires sur les portfolios
-- =====================================================

CREATE TABLE IF NOT EXISTS public.portfolio_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.artist_portfolios(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_comment_id UUID REFERENCES public.portfolio_comments(id) ON DELETE CASCADE, -- Pour les réponses
  
  -- Contenu
  content TEXT NOT NULL,
  
  -- Statut
  is_approved BOOLEAN DEFAULT TRUE, -- Modération
  is_pinned BOOLEAN DEFAULT FALSE, -- Commentaire épinglé
  is_edited BOOLEAN DEFAULT FALSE,
  
  -- Métadonnées
  author_name TEXT, -- Pour les commentaires anonymes
  author_email TEXT, -- Pour les commentaires anonymes
  ip_address INET,
  user_agent TEXT,
  
  -- Statistiques
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  
  -- Modération
  reported_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  moderation_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  
  -- Contraintes
  CHECK (
    (user_id IS NOT NULL) OR 
    (author_name IS NOT NULL AND author_email IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_comments_portfolio_id ON public.portfolio_comments(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_comments_user_id ON public.portfolio_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_comments_parent_id ON public.portfolio_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_comments_created_at ON public.portfolio_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_comments_approved ON public.portfolio_comments(is_approved) WHERE is_approved = TRUE;

-- =====================================================
-- TABLE: portfolio_comment_likes
-- Likes sur les commentaires
-- =====================================================

CREATE TABLE IF NOT EXISTS public.portfolio_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.portfolio_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(comment_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.portfolio_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.portfolio_comment_likes(user_id);

-- =====================================================
-- TABLE: portfolio_comment_reports
-- Signalements de commentaires
-- =====================================================

CREATE TABLE IF NOT EXISTS public.portfolio_comment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.portfolio_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_email TEXT, -- Pour signalements anonymes
  
  -- Raison
  reason TEXT NOT NULL CHECK (reason IN (
    'spam',
    'inappropriate',
    'harassment',
    'hate_speech',
    'false_information',
    'other'
  )),
  details TEXT, -- Détails supplémentaires
  
  -- Statut
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  CHECK (
    (user_id IS NOT NULL) OR 
    (reporter_email IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comment_reports_comment_id ON public.portfolio_comment_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_status ON public.portfolio_comment_reports(status);
CREATE INDEX IF NOT EXISTS idx_comment_reports_created_at ON public.portfolio_comment_reports(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_portfolio_comments_updated_at
  BEFORE UPDATE ON public.portfolio_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour mettre à jour edited_at
CREATE OR REPLACE FUNCTION update_comment_edited_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    NEW.is_edited = TRUE;
    NEW.edited_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_edited_at_trigger
  BEFORE UPDATE ON public.portfolio_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_edited_at();

-- Trigger pour mettre à jour le compteur de likes
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.portfolio_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.portfolio_comments
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_likes_count_trigger
  AFTER INSERT OR DELETE ON public.portfolio_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

-- Trigger pour mettre à jour le compteur de réponses
CREATE OR REPLACE FUNCTION update_comment_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    UPDATE public.portfolio_comments
    SET replies_count = replies_count + 1
    WHERE id = NEW.parent_comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
    UPDATE public.portfolio_comments
    SET replies_count = GREATEST(0, replies_count - 1)
    WHERE id = OLD.parent_comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_replies_count_trigger
  AFTER INSERT OR DELETE ON public.portfolio_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_replies_count();

-- Trigger pour mettre à jour le compteur de signalements
CREATE OR REPLACE FUNCTION update_comment_reported_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.portfolio_comments
    SET reported_count = reported_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.portfolio_comments
    SET reported_count = GREATEST(0, reported_count - 1)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_reported_count_trigger
  AFTER INSERT OR DELETE ON public.portfolio_comment_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_reported_count();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

-- Portfolio Comments
ALTER TABLE public.portfolio_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved comments" ON public.portfolio_comments;
CREATE POLICY "Public can view approved comments"
  ON public.portfolio_comments FOR SELECT
  USING (
    is_approved = TRUE 
    AND is_hidden = FALSE
    AND EXISTS (
      SELECT 1 FROM public.artist_portfolios
      WHERE artist_portfolios.id = portfolio_comments.portfolio_id
      AND artist_portfolios.is_public = TRUE
    )
  );

DROP POLICY IF EXISTS "Users can create comments" ON public.portfolio_comments;
CREATE POLICY "Users can create comments"
  ON public.portfolio_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.artist_portfolios
      WHERE artist_portfolios.id = portfolio_comments.portfolio_id
      AND artist_portfolios.is_public = TRUE
    )
  );

DROP POLICY IF EXISTS "Users can update their own comments" ON public.portfolio_comments;
CREATE POLICY "Users can update their own comments"
  ON public.portfolio_comments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.portfolio_comments;
CREATE POLICY "Users can delete their own comments"
  ON public.portfolio_comments FOR DELETE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Store owners can moderate comments" ON public.portfolio_comments;
CREATE POLICY "Store owners can moderate comments"
  ON public.portfolio_comments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.artist_portfolios ap
      INNER JOIN public.stores s ON ap.store_id = s.id
      WHERE ap.id = portfolio_comments.portfolio_id
      AND s.user_id = auth.uid()
    )
  );

-- Comment Likes
ALTER TABLE public.portfolio_comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can like comments" ON public.portfolio_comment_likes;
CREATE POLICY "Authenticated users can like comments"
  ON public.portfolio_comment_likes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view comment likes" ON public.portfolio_comment_likes;
CREATE POLICY "Public can view comment likes"
  ON public.portfolio_comment_likes FOR SELECT
  USING (TRUE);

-- Comment Reports
ALTER TABLE public.portfolio_comment_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can report comments" ON public.portfolio_comment_reports;
CREATE POLICY "Anyone can report comments"
  ON public.portfolio_comment_reports FOR INSERT
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can view their own reports" ON public.portfolio_comment_reports;
CREATE POLICY "Users can view their own reports"
  ON public.portfolio_comment_reports FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Store owners can view reports" ON public.portfolio_comment_reports;
CREATE POLICY "Store owners can view reports"
  ON public.portfolio_comment_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolio_comments pc
      INNER JOIN public.artist_portfolios ap ON pc.portfolio_id = ap.id
      INNER JOIN public.stores s ON ap.store_id = s.id
      WHERE pc.id = portfolio_comment_reports.comment_id
      AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners can update reports" ON public.portfolio_comment_reports;
CREATE POLICY "Store owners can update reports"
  ON public.portfolio_comment_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolio_comments pc
      INNER JOIN public.artist_portfolios ap ON pc.portfolio_id = ap.id
      INNER JOIN public.stores s ON ap.store_id = s.id
      WHERE pc.id = portfolio_comment_reports.comment_id
      AND s.user_id = auth.uid()
    )
  );

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour obtenir le nombre total de commentaires d'un portfolio
CREATE OR REPLACE FUNCTION get_portfolio_comments_count(portfolio_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.portfolio_comments
    WHERE portfolio_id = portfolio_id_param
      AND is_approved = TRUE
      AND is_hidden = FALSE
      AND parent_comment_id IS NULL -- Seulement les commentaires principaux
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON TABLE public.portfolio_comments IS 'Commentaires sur les portfolios d''artistes';
COMMENT ON TABLE public.portfolio_comment_likes IS 'Likes sur les commentaires de portfolios';
COMMENT ON TABLE public.portfolio_comment_reports IS 'Signalements de commentaires';

