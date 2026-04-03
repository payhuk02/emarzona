-- ============================================================
-- Correction des politiques RLS pour la communauté
-- Date: 31 Janvier 2025
-- Description: Permet l'accès public aux posts et membres approuvés
-- ============================================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view approved members" ON public.community_members;
DROP POLICY IF EXISTS "Users can insert their own member profile" ON public.community_members;
DROP POLICY IF EXISTS "Users can update their own member profile" ON public.community_members;

DROP POLICY IF EXISTS "Anyone can view published posts" ON public.community_posts;
DROP POLICY IF EXISTS "Members can create posts" ON public.community_posts;
DROP POLICY IF EXISTS "Authors can update their own posts" ON public.community_posts;

-- ============================================================
-- NOUVELLES POLITIQUES RLS POUR community_members
-- ============================================================

-- SELECT: Permettre à tous (authentifiés ou non) de voir les membres approuvés
-- Permettre aux utilisateurs authentifiés de voir leur propre profil même s'il n'est pas approuvé
-- Permettre aux admins de voir tous les membres
CREATE POLICY "Public can view approved members"
  ON public.community_members
  FOR SELECT
  USING (
    -- Membres approuvés visibles par tous
    status = 'approved'
    OR
    -- Utilisateur authentifié peut voir son propre profil
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Admins peuvent voir tous les membres (via profiles.role)
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT: Permettre aux utilisateurs authentifiés de créer leur profil
CREATE POLICY "Authenticated users can create member profile"
  ON public.community_members
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
  );

-- UPDATE: Permettre aux utilisateurs de mettre à jour leur propre profil
-- Permettre aux admins de mettre à jour n'importe quel profil
CREATE POLICY "Users can update own profile, admins can update any"
  ON public.community_members
  FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- NOUVELLES POLITIQUES RLS POUR community_posts
-- ============================================================

-- SELECT: Permettre à tous (authentifiés ou non) de voir les posts publiés
-- Permettre aux auteurs de voir leurs propres posts même s'ils ne sont pas publiés
-- Permettre aux admins de voir tous les posts
CREATE POLICY "Public can view published posts"
  ON public.community_posts
  FOR SELECT
  USING (
    -- Posts publiés visibles par tous
    status = 'published'
    OR
    -- Auteur authentifié peut voir ses propres posts
    (auth.uid() IS NOT NULL AND auth.uid() IN (
      SELECT user_id FROM public.community_members WHERE id = author_id
    ))
    OR
    -- Admins peuvent voir tous les posts
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT: Permettre aux membres approuvés de créer des posts
CREATE POLICY "Approved members can create posts"
  ON public.community_posts
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() IN (
      SELECT user_id FROM public.community_members
      WHERE id = author_id AND status = 'approved'
    )
  );

-- UPDATE: Permettre aux auteurs de mettre à jour leurs propres posts
-- Permettre aux admins de mettre à jour n'importe quel post
CREATE POLICY "Authors can update own posts, admins can update any"
  ON public.community_posts
  FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() IN (
      SELECT user_id FROM public.community_members WHERE id = author_id
    ))
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- NOUVELLES POLITIQUES RLS POUR community_comments
-- ============================================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Anyone can view published comments" ON public.community_comments;
DROP POLICY IF EXISTS "Members can create comments" ON public.community_comments;
DROP POLICY IF EXISTS "Authors can update their own comments" ON public.community_comments;

-- SELECT: Permettre à tous de voir les commentaires publiés
CREATE POLICY "Public can view published comments"
  ON public.community_comments
  FOR SELECT
  USING (
    status = 'published'
    OR
    (auth.uid() IS NOT NULL AND auth.uid() IN (
      SELECT user_id FROM public.community_members WHERE id = author_id
    ))
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT: Permettre aux membres approuvés de créer des commentaires
CREATE POLICY "Approved members can create comments"
  ON public.community_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() IN (
      SELECT user_id FROM public.community_members
      WHERE id = author_id AND status = 'approved'
    )
  );

-- UPDATE: Permettre aux auteurs de mettre à jour leurs propres commentaires
CREATE POLICY "Authors can update own comments, admins can update any"
  ON public.community_comments
  FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() IN (
      SELECT user_id FROM public.community_members WHERE id = author_id
    ))
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

