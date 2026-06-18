-- Engagement blog plateforme : likes, commentaires, partages

-- Compteurs dénormalisés sur les articles
ALTER TABLE public.platform_blog_posts
  ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_count INTEGER NOT NULL DEFAULT 0;

-- Likes (utilisateurs connectés)
CREATE TABLE IF NOT EXISTS public.platform_blog_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.platform_blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT platform_blog_likes_unique UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_platform_blog_likes_post
  ON public.platform_blog_likes(post_id);

-- Commentaires
CREATE TABLE IF NOT EXISTS public.platform_blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.platform_blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES public.platform_blog_comments(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT,
  body TEXT NOT NULL CHECK (char_length(trim(body)) >= 2),
  status TEXT NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending', 'approved', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_blog_comments_post_status
  ON public.platform_blog_comments(post_id, status, created_at DESC);

-- Événements de partage (analytics)
CREATE TABLE IF NOT EXISTS public.platform_blog_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.platform_blog_posts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL
    CHECK (channel IN ('copy', 'twitter', 'facebook', 'linkedin', 'whatsapp', 'native', 'email')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_blog_shares_post
  ON public.platform_blog_shares(post_id);

-- Sync compteurs likes
CREATE OR REPLACE FUNCTION public.sync_platform_blog_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.platform_blog_posts
    SET like_count = like_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.platform_blog_posts
    SET like_count = GREATEST(0, like_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS platform_blog_likes_count ON public.platform_blog_likes;
CREATE TRIGGER platform_blog_likes_count
  AFTER INSERT OR DELETE ON public.platform_blog_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_platform_blog_like_count();

-- Sync compteurs commentaires approuvés
CREATE OR REPLACE FUNCTION public.sync_platform_blog_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
    UPDATE public.platform_blog_posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
    UPDATE public.platform_blog_posts
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.post_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status <> 'approved' AND NEW.status = 'approved' THEN
      UPDATE public.platform_blog_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    ELSIF OLD.status = 'approved' AND NEW.status <> 'approved' THEN
      UPDATE public.platform_blog_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = NEW.post_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS platform_blog_comments_count ON public.platform_blog_comments;
CREATE TRIGGER platform_blog_comments_count
  AFTER INSERT OR UPDATE OR DELETE ON public.platform_blog_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_platform_blog_comment_count();

-- Sync compteurs partages
CREATE OR REPLACE FUNCTION public.sync_platform_blog_share_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.platform_blog_posts
    SET share_count = share_count + 1
    WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS platform_blog_shares_count ON public.platform_blog_shares;
CREATE TRIGGER platform_blog_shares_count
  AFTER INSERT ON public.platform_blog_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_platform_blog_share_count();

CREATE TRIGGER platform_blog_comments_updated_at
  BEFORE UPDATE ON public.platform_blog_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.platform_blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_blog_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_blog_likes_public_select
  ON public.platform_blog_likes FOR SELECT TO public USING (true);

CREATE POLICY platform_blog_likes_owner_delete
  ON public.platform_blog_likes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY platform_blog_comments_public_select
  ON public.platform_blog_comments FOR SELECT TO public
  USING (status = 'approved');

CREATE POLICY platform_blog_comments_admin_all
  ON public.platform_blog_comments FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY platform_blog_shares_insert_public
  ON public.platform_blog_shares FOR INSERT TO public WITH CHECK (true);

CREATE POLICY platform_blog_shares_admin_select
  ON public.platform_blog_shares FOR SELECT TO authenticated
  USING (public.is_platform_admin() OR user_id = auth.uid());

-- Article publié + commentaires autorisés
CREATE OR REPLACE FUNCTION public.platform_blog_post_allows_engagement(p_post_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_blog_posts p
    WHERE p.id = p_post_id
      AND p.status = 'published'
      AND (p.published_at IS NULL OR p.published_at <= now())
      AND (p.scheduled_at IS NULL OR p.scheduled_at <= now())
  );
$$;

CREATE OR REPLACE FUNCTION public.get_platform_blog_engagement(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_liked BOOLEAN := false;
  v_row public.platform_blog_posts%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.platform_blog_posts WHERE id = p_post_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_user IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.platform_blog_likes l
      WHERE l.post_id = p_post_id AND l.user_id = v_user
    ) INTO v_liked;
  END IF;

  RETURN jsonb_build_object(
    'like_count', COALESCE(v_row.like_count, 0),
    'comment_count', COALESCE(v_row.comment_count, 0),
    'share_count', COALESCE(v_row.share_count, 0),
    'view_count', COALESCE(v_row.view_count, 0),
    'allow_comments', COALESCE(v_row.allow_comments, false),
    'user_liked', v_liked
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_platform_blog_like(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_deleted INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Connexion requise pour aimer un article';
  END IF;

  IF NOT public.platform_blog_post_allows_engagement(p_post_id) THEN
    RAISE EXCEPTION 'Article indisponible';
  END IF;

  DELETE FROM public.platform_blog_likes
  WHERE post_id = p_post_id AND user_id = v_user;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted = 0 THEN
    INSERT INTO public.platform_blog_likes (post_id, user_id)
    VALUES (p_post_id, v_user);
  END IF;

  RETURN public.get_platform_blog_engagement(p_post_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_platform_blog_comments(
  p_post_id UUID,
  p_limit INTEGER DEFAULT 30,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'parent_id', c.parent_id,
        'author_name', c.author_name,
        'body', c.body,
        'created_at', c.created_at,
        'is_mine', (auth.uid() IS NOT NULL AND c.user_id = auth.uid())
      )
      ORDER BY c.created_at ASC
    ),
    '[]'::jsonb
  )
  FROM (
    SELECT *
    FROM public.platform_blog_comments
    WHERE post_id = p_post_id AND status = 'approved'
    ORDER BY created_at ASC
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 30), 100))
    OFFSET GREATEST(0, COALESCE(p_offset, 0))
  ) c;
$$;

CREATE OR REPLACE FUNCTION public.add_platform_blog_comment(
  p_post_id UUID,
  p_body TEXT,
  p_author_name TEXT DEFAULT NULL,
  p_parent_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_name TEXT;
  v_allow BOOLEAN;
  v_comment public.platform_blog_comments%ROWTYPE;
  v_status TEXT := 'approved';
BEGIN
  SELECT allow_comments INTO v_allow
  FROM public.platform_blog_posts
  WHERE id = p_post_id
    AND status = 'published'
    AND (published_at IS NULL OR published_at <= now());

  IF NOT COALESCE(v_allow, false) THEN
    RAISE EXCEPTION 'Les commentaires sont désactivés sur cet article';
  END IF;

  IF v_user IS NULL THEN
    v_name := NULLIF(trim(p_author_name), '');
    IF v_name IS NULL THEN
      RAISE EXCEPTION 'Nom requis pour commenter';
    END IF;
    v_status := 'pending';
  ELSE
    SELECT COALESCE(
      NULLIF(trim(p_author_name), ''),
      NULLIF(trim(pr.display_name), ''),
      NULLIF(trim(concat_ws(' ', pr.first_name, pr.last_name)), ''),
      split_part(u.email, '@', 1),
      'Utilisateur'
    )
    INTO v_name
    FROM auth.users u
    LEFT JOIN public.profiles pr ON pr.user_id = u.id
    WHERE u.id = v_user;
  END IF;

  IF p_parent_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.platform_blog_comments
      WHERE id = p_parent_id AND post_id = p_post_id AND status = 'approved'
    ) THEN
      RAISE EXCEPTION 'Commentaire parent invalide';
    END IF;
  END IF;

  INSERT INTO public.platform_blog_comments (
    post_id, user_id, parent_id, author_name, body, status
  )
  VALUES (
    p_post_id, v_user, p_parent_id, v_name, trim(p_body), v_status
  )
  RETURNING * INTO v_comment;

  RETURN jsonb_build_object(
    'comment', jsonb_build_object(
      'id', v_comment.id,
      'parent_id', v_comment.parent_id,
      'author_name', v_comment.author_name,
      'body', v_comment.body,
      'created_at', v_comment.created_at,
      'status', v_comment.status,
      'is_mine', true
    ),
    'engagement', public.get_platform_blog_engagement(p_post_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_platform_blog_share(
  p_post_id UUID,
  p_channel TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_channel TEXT := lower(trim(p_channel));
BEGIN
  IF NOT public.platform_blog_post_allows_engagement(p_post_id) THEN
    RAISE EXCEPTION 'Article indisponible';
  END IF;

  IF v_channel NOT IN ('copy', 'twitter', 'facebook', 'linkedin', 'whatsapp', 'native', 'email') THEN
    RAISE EXCEPTION 'Canal de partage invalide';
  END IF;

  INSERT INTO public.platform_blog_shares (post_id, channel, user_id, visitor_key)
  VALUES (p_post_id, v_channel, auth.uid(), NULL);

  RETURN public.get_platform_blog_engagement(p_post_id);
END;
$$;

-- Mise à jour lecture article : stats + vue
CREATE OR REPLACE FUNCTION public.get_public_platform_blog_post(
  p_slug TEXT,
  p_locale TEXT DEFAULT 'fr'
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_row public.platform_blog_posts%ROWTYPE;
  v_category public.platform_blog_categories%ROWTYPE;
  v_result JSONB;
BEGIN
  v_code := CASE WHEN lower(split_part(COALESCE(p_locale, 'fr'), '-', 1)) = 'en' THEN 'en' ELSE 'fr' END;

  SELECT * INTO v_row
  FROM public.platform_blog_posts
  WHERE slug = p_slug
    AND status = 'published'
    AND (published_at IS NULL OR published_at <= now())
    AND (scheduled_at IS NULL OR scheduled_at <= now())
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE public.platform_blog_posts
  SET view_count = view_count + 1
  WHERE id = v_row.id
  RETURNING * INTO v_row;

  IF v_row.category_id IS NOT NULL THEN
    SELECT * INTO v_category
    FROM public.platform_blog_categories
    WHERE id = v_row.category_id AND is_active = true;
  END IF;

  v_result := jsonb_build_object(
    'id', v_row.id,
    'slug', v_row.slug,
    'title', public.blog_pick_translation(v_row.translations, v_code, 'title', v_row.title),
    'excerpt', public.blog_pick_translation(v_row.translations, v_code, 'excerpt', v_row.excerpt),
    'content', public.blog_pick_translation(v_row.translations, v_code, 'content', v_row.content),
    'featured_image_url', COALESCE(v_row.og_image_url, v_row.featured_image_url),
    'featured_image_alt', v_row.featured_image_alt,
    'author_name', v_row.author_name,
    'author_bio', v_row.author_bio,
    'tags', v_row.tags,
    'is_featured', v_row.is_featured,
    'allow_comments', v_row.allow_comments,
    'reading_time_minutes', v_row.reading_time_minutes,
    'published_at', v_row.published_at,
    'updated_at', v_row.updated_at,
    'seo_title', COALESCE(v_row.seo_title, v_row.title),
    'seo_description', COALESCE(v_row.seo_description, v_row.excerpt),
    'seo_keywords', v_row.seo_keywords,
    'canonical_url', v_row.canonical_url,
    'og_image_url', v_row.og_image_url,
    'noindex', v_row.noindex,
    'like_count', COALESCE(v_row.like_count, 0),
    'comment_count', COALESCE(v_row.comment_count, 0),
    'share_count', COALESCE(v_row.share_count, 0),
    'view_count', COALESCE(v_row.view_count, 0),
    'category', CASE
      WHEN v_category.id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'slug', v_category.slug,
        'name', public.blog_pick_translation(v_category.translations, v_code, 'name', v_category.name)
      )
    END
  );

  RETURN v_result;
END;
$$;

-- Liste articles : inclure compteurs engagement
CREATE OR REPLACE FUNCTION public.get_public_platform_blog_posts(
  p_locale TEXT DEFAULT 'fr',
  p_category_slug TEXT DEFAULT NULL,
  p_tag TEXT DEFAULT NULL,
  p_featured_only BOOLEAN DEFAULT false,
  p_limit INTEGER DEFAULT 12,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH loc AS (
    SELECT CASE WHEN lower(split_part(COALESCE(p_locale, 'fr'), '-', 1)) = 'en' THEN 'en' ELSE 'fr' END AS code
  ),
  filtered AS (
    SELECT p.*
    FROM public.platform_blog_posts p
    LEFT JOIN public.platform_blog_categories c ON c.id = p.category_id
    WHERE p.status = 'published'
      AND (p.published_at IS NULL OR p.published_at <= now())
      AND (p.scheduled_at IS NULL OR p.scheduled_at <= now())
      AND (p_category_slug IS NULL OR c.slug = p_category_slug)
      AND (p_tag IS NULL OR p_tag = ANY(p.tags))
      AND (NOT p_featured_only OR p.is_featured = true)
    ORDER BY p.is_featured DESC, p.published_at DESC NULLS LAST, p.created_at DESC
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 12), 50))
    OFFSET GREATEST(0, COALESCE(p_offset, 0))
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'slug', p.slug,
        'title', public.blog_pick_translation(p.translations, (SELECT code FROM loc), 'title', p.title),
        'excerpt', public.blog_pick_translation(p.translations, (SELECT code FROM loc), 'excerpt', p.excerpt),
        'featured_image_url', COALESCE(p.og_image_url, p.featured_image_url),
        'featured_image_alt', p.featured_image_alt,
        'author_name', p.author_name,
        'tags', p.tags,
        'is_featured', p.is_featured,
        'reading_time_minutes', p.reading_time_minutes,
        'published_at', p.published_at,
        'like_count', COALESCE(p.like_count, 0),
        'comment_count', COALESCE(p.comment_count, 0),
        'share_count', COALESCE(p.share_count, 0),
        'view_count', COALESCE(p.view_count, 0),
        'category', CASE
          WHEN c.id IS NULL THEN NULL
          ELSE jsonb_build_object(
            'slug', c.slug,
            'name', public.blog_pick_translation(c.translations, (SELECT code FROM loc), 'name', c.name)
          )
        END
      )
      ORDER BY p.is_featured DESC, p.published_at DESC NULLS LAST
    ),
    '[]'::jsonb
  )
  FROM filtered p
  LEFT JOIN public.platform_blog_categories c ON c.id = p.category_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_blog_engagement(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_platform_blog_like(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_blog_comments(UUID, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_platform_blog_comment(UUID, TEXT, TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_platform_blog_share(UUID, TEXT) TO anon, authenticated;

-- Activer commentaires sur articles publiés existants
UPDATE public.platform_blog_posts
SET allow_comments = true
WHERE status = 'published' AND allow_comments = false;
