-- ============================================================
-- Migration: Tables pour la Communauté
-- Date: 31 Janvier 2025
-- Description: Création des tables pour la gestion de la communauté
-- ============================================================

-- Table: community_members
-- Stocke les informations des membres de la communauté
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  profession TEXT,
  company TEXT,
  bio TEXT,
  profile_image_url TEXT,
  country TEXT NOT NULL DEFAULT 'BF',
  city TEXT,
  website TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  github_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  badges TEXT[] DEFAULT ARRAY[]::TEXT[],
  join_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Table: community_posts
-- Stocke les posts/messages de la communauté
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.community_members(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'markdown', 'html')),
  category TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived', 'deleted', 'moderated')),
  is_pinned BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Table: community_comments
-- Stocke les commentaires sur les posts
CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.community_members(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'deleted', 'moderated')),
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Table: community_reactions
-- Stocke les réactions (likes, etc.) sur les posts et commentaires
CREATE TABLE IF NOT EXISTS public.community_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.community_members(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry', 'support')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  CONSTRAINT unique_reaction UNIQUE (member_id, post_id, comment_id, reaction_type)
);

-- Table: community_follows
-- Stocke les relations de suivi entre membres
CREATE TABLE IF NOT EXISTS public.community_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.community_members(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.community_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_self_follow CHECK (follower_id != following_id),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Table: community_notifications
-- Stocke les notifications pour les membres
CREATE TABLE IF NOT EXISTS public.community_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.community_members(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('post_like', 'post_comment', 'comment_reply', 'new_follower', 'post_mention', 'post_approved', 'post_rejected')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_status ON public.community_members(status);
CREATE INDEX IF NOT EXISTS idx_community_members_role ON public.community_members(role);
CREATE INDEX IF NOT EXISTS idx_community_members_country ON public.community_members(country);

CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON public.community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_status ON public.community_posts(status);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON public.community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_pinned ON public.community_posts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_community_posts_tags ON public.community_posts USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_author_id ON public.community_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent_id ON public.community_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_created_at ON public.community_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_reactions_post_id ON public.community_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_comment_id ON public.community_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_member_id ON public.community_reactions(member_id);

CREATE INDEX IF NOT EXISTS idx_community_follows_follower ON public.community_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_community_follows_following ON public.community_follows(following_id);

CREATE INDEX IF NOT EXISTS idx_community_notifications_member_id ON public.community_notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_community_notifications_is_read ON public.community_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_community_notifications_created_at ON public.community_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour community_members
CREATE POLICY "Users can view approved members"
  ON public.community_members
  FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "Users can insert their own member profile"
  ON public.community_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own member profile"
  ON public.community_members
  FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ));

-- RLS Policies pour community_posts
CREATE POLICY "Anyone can view published posts"
  ON public.community_posts
  FOR SELECT
  USING (status = 'published' OR auth.uid() IN (
    SELECT user_id FROM public.community_members WHERE id = author_id
  ) OR EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "Members can create posts"
  ON public.community_posts
  FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.community_members WHERE id = author_id AND status = 'approved'
  ));

CREATE POLICY "Authors can update their own posts"
  ON public.community_posts
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM public.community_members WHERE id = author_id
  ) OR EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ));

-- RLS Policies pour community_comments
CREATE POLICY "Anyone can view published comments"
  ON public.community_comments
  FOR SELECT
  USING (status = 'published' OR auth.uid() IN (
    SELECT user_id FROM public.community_members WHERE id = author_id
  ) OR EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "Members can create comments"
  ON public.community_comments
  FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.community_members WHERE id = author_id AND status = 'approved'
  ));

CREATE POLICY "Authors can update their own comments"
  ON public.community_comments
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM public.community_members WHERE id = author_id
  ) OR EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ));

-- RLS Policies pour community_reactions
CREATE POLICY "Anyone can view reactions"
  ON public.community_reactions
  FOR SELECT
  USING (true);

CREATE POLICY "Members can create reactions"
  ON public.community_reactions
  FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.community_members WHERE id = member_id AND status = 'approved'
  ));

CREATE POLICY "Members can delete their own reactions"
  ON public.community_reactions
  FOR DELETE
  USING (auth.uid() IN (
    SELECT user_id FROM public.community_members WHERE id = member_id
  ));

-- RLS Policies pour community_follows
CREATE POLICY "Anyone can view follows"
  ON public.community_follows
  FOR SELECT
  USING (true);

CREATE POLICY "Members can create follows"
  ON public.community_follows
  FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.community_members WHERE id = follower_id AND status = 'approved'
  ));

CREATE POLICY "Members can delete their own follows"
  ON public.community_follows
  FOR DELETE
  USING (auth.uid() IN (
    SELECT user_id FROM public.community_members WHERE id = follower_id
  ));

-- RLS Policies pour community_notifications
CREATE POLICY "Members can view their own notifications"
  ON public.community_notifications
  FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM public.community_members WHERE id = member_id
  ));

CREATE POLICY "System can create notifications"
  ON public.community_notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Members can update their own notifications"
  ON public.community_notifications
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM public.community_members WHERE id = member_id
  ));

-- Function pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_community_members_updated_at
  BEFORE UPDATE ON public.community_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_comments_updated_at
  BEFORE UPDATE ON public.community_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function pour mettre à jour les compteurs de posts
CREATE OR REPLACE FUNCTION public.update_post_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE public.community_posts
      SET comments_count = comments_count + 1
      WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      UPDATE public.community_posts
      SET comments_count = GREATEST(comments_count - 1, 0)
      WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour comments_count
CREATE TRIGGER update_post_comments_count
  AFTER INSERT OR DELETE ON public.community_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_counters();

-- Function pour mettre à jour les compteurs de réactions
CREATE OR REPLACE FUNCTION public.update_reaction_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE public.community_posts
      SET likes_count = (
        SELECT COUNT(*) FROM public.community_reactions
        WHERE post_id = NEW.post_id AND reaction_type = 'like'
      )
      WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      UPDATE public.community_posts
      SET likes_count = (
        SELECT COUNT(*) FROM public.community_reactions
        WHERE post_id = OLD.post_id AND reaction_type = 'like'
      )
      WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour likes_count
CREATE TRIGGER update_post_likes_count
  AFTER INSERT OR DELETE ON public.community_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reaction_counters();

-- Function pour incrémenter le compteur de vues d'un post
CREATE OR REPLACE FUNCTION public.increment_post_views(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.community_posts
  SET views_count = views_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

