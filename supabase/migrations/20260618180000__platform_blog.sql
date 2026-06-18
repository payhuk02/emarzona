-- Blog plateforme Emarzona : catégories, articles, lecture publique et gestion admin

CREATE TABLE IF NOT EXISTS public.platform_blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  category_id UUID REFERENCES public.platform_blog_categories(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Emarzona',
  author_bio TEXT,
  featured_image_url TEXT,
  featured_image_alt TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  allow_comments BOOLEAN NOT NULL DEFAULT false,
  reading_time_minutes INTEGER NOT NULL DEFAULT 1,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  canonical_url TEXT,
  og_image_url TEXT,
  noindex BOOLEAN NOT NULL DEFAULT false,
  translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT platform_blog_posts_published_at_check
    CHECK (status <> 'published' OR published_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_platform_blog_posts_status_published
  ON public.platform_blog_posts(status, published_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_platform_blog_posts_category
  ON public.platform_blog_posts(category_id);

CREATE INDEX IF NOT EXISTS idx_platform_blog_posts_featured
  ON public.platform_blog_posts(is_featured)
  WHERE is_featured = true AND status = 'published';

CREATE INDEX IF NOT EXISTS idx_platform_blog_posts_tags
  ON public.platform_blog_posts USING GIN (tags);

ALTER TABLE public.platform_blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_blog_categories_public_select
  ON public.platform_blog_categories
  FOR SELECT
  USING (is_active = true);

CREATE POLICY platform_blog_posts_public_select
  ON public.platform_blog_posts
  FOR SELECT
  USING (
    status = 'published'
    AND (published_at IS NULL OR published_at <= now())
    AND (scheduled_at IS NULL OR scheduled_at <= now())
  );

CREATE POLICY platform_blog_categories_admin_all
  ON public.platform_blog_categories
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY platform_blog_posts_admin_all
  ON public.platform_blog_posts
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE TRIGGER platform_blog_categories_updated_at
  BEFORE UPDATE ON public.platform_blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER platform_blog_posts_updated_at
  BEFORE UPDATE ON public.platform_blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.blog_pick_translation(
  p_translations JSONB,
  p_locale TEXT,
  p_field TEXT,
  p_fallback TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    NULLIF(TRIM(p_translations -> p_locale ->> p_field), ''),
    p_fallback
  );
$$;

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
        'category', CASE
          WHEN c.id IS NULL THEN NULL
          ELSE jsonb_build_object(
            'slug', c.slug,
            'name', public.blog_pick_translation(c.translations, (SELECT code FROM loc), 'name', c.name)
          )
        END
      )
    ),
    '[]'::jsonb
  )
  FROM filtered p
  LEFT JOIN public.platform_blog_categories c ON c.id = p.category_id;
$$;

CREATE OR REPLACE FUNCTION public.get_public_platform_blog_post(
  p_slug TEXT,
  p_locale TEXT DEFAULT 'fr'
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
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

GRANT EXECUTE ON FUNCTION public.get_public_platform_blog_posts(TEXT, TEXT, TEXT, BOOLEAN, INTEGER, INTEGER)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_platform_blog_post(TEXT, TEXT) TO anon, authenticated;

-- Seed catégories
INSERT INTO public.platform_blog_categories (slug, name, description, sort_order, translations)
VALUES
  (
    'ecommerce',
    'E-commerce',
    'Conseils pour vendre et développer votre boutique en ligne.',
    10,
    '{"en":{"name":"E-commerce","description":"Tips to sell and grow your online store."}}'::jsonb
  ),
  (
    'product',
    'Produit & nouveautés',
    'Annonces fonctionnalités et feuille de route Emarzona.',
    20,
    '{"en":{"name":"Product & updates","description":"Emarzona feature announcements and roadmap."}}'::jsonb
  ),
  (
    'guides',
    'Guides pratiques',
    'Tutoriels pas à pas pour vendeurs et acheteurs.',
    30,
    '{"en":{"name":"How-to guides","description":"Step-by-step tutorials for sellers and buyers."}}'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;

-- Seed articles (publiés)
INSERT INTO public.platform_blog_posts (
  slug, title, excerpt, content, status, category_id, author_name, author_bio,
  featured_image_url, featured_image_alt, tags, is_featured, reading_time_minutes,
  published_at, seo_title, seo_description, seo_keywords, translations
)
SELECT
  v.slug,
  v.title,
  v.excerpt,
  v.content,
  'published',
  c.id,
  'Équipe Emarzona',
  'Conseils e-commerce, produit et croissance pour la communauté Emarzona.',
  v.featured_image_url,
  v.featured_image_alt,
  v.tags,
  v.is_featured,
  v.reading_time,
  now() - (v.days_ago || ' days')::interval,
  v.seo_title,
  v.seo_description,
  v.seo_keywords,
  v.translations::jsonb
FROM (
  VALUES
    (
      'lancer-boutique-emarzona-2026',
      'Comment lancer sa boutique Emarzona en 2026',
      'De l''inscription à la première vente : les étapes clés pour démarrer sur Emarzona avec les cinq verticaux produits.',
      '<h2>Pourquoi Emarzona ?</h2><p>Emarzona réunit boutique, paiements, logistique et marketing dans une seule plateforme pensée pour l''Afrique et l''international.</p><h2>Étapes essentielles</h2><ol><li>Créez votre compte vendeur</li><li>Choisissez votre type de commerce</li><li>Ajoutez vos premiers produits</li><li>Configurez Moneroo et vos zones de livraison</li><li>Publiez et partagez votre boutique</li></ol><p>Besoin d''aide ? Consultez la <a href="/faq">FAQ</a> ou le <a href="/help">centre d''aide</a>.</p>',
      'ecommerce',
      'https://www.emarzona.com/og-image.png',
      'Lancer une boutique Emarzona',
      ARRAY['e-commerce', 'onboarding', 'boutique', 'vendeur'],
      true,
      6,
      3,
      'Lancer sa boutique Emarzona en 2026 | Blog',
      'Guide complet pour créer et publier votre boutique Emarzona : verticaux, paiements Moneroo et premières ventes.',
      'Emarzona, boutique en ligne, e-commerce Afrique, guide vendeur',
      '{"en":{"title":"How to launch your Emarzona store in 2026","excerpt":"From signup to first sale: key steps across Emarzona''s five product verticals.","content":"<h2>Why Emarzona?</h2><p>Emarzona combines store, payments, logistics and marketing in one platform built for Africa and global markets.</p><h2>Essential steps</h2><ol><li>Create your seller account</li><li>Choose your commerce type</li><li>Add your first products</li><li>Configure Moneroo and shipping zones</li><li>Publish and share your store</li></ol><p>Need help? See the <a href=\"/faq\">FAQ</a> or <a href=\"/help\">help center</a>.</p>"}}'
    ),
    (
      'panier-multi-types-checkout-emarzona',
      'Panier multi-types : digital, physique, services et cours',
      'Comment Emarzona gère un panier mixte et ce que les vendeurs doivent configurer pour un checkout fluide.',
      '<h2>Un seul panier, plusieurs verticaux</h2><p>Les acheteurs peuvent combiner produits digitaux, physiques, services et cours selon les règles de votre boutique.</p><h2>Bonnes pratiques vendeur</h2><ul><li>Clarifiez les délais de livraison physique</li><li>Validez les créneaux de services réservés</li><li>Indiquez les limites de téléchargement digital</li></ul>',
      'guides',
      'https://www.emarzona.com/og-image.png',
      'Panier multi-types Emarzona',
      ARRAY['panier', 'checkout', 'multi-type', 'UX'],
      false,
      5,
      7,
      'Panier multi-types sur Emarzona | Blog',
      'Comprendre le panier mixte Emarzona : digital, physique, services, cours et bonnes pratiques checkout.',
      'panier Emarzona, checkout, e-commerce multi-vertical',
      '{"en":{"title":"Multi-type cart: digital, physical, services and courses","excerpt":"How Emarzona handles mixed carts and what sellers should configure for smooth checkout.","content":"<h2>One cart, multiple verticals</h2><p>Buyers can combine digital, physical, service and course items depending on your store rules.</p><h2>Seller best practices</h2><ul><li>Clarify physical delivery timelines</li><li>Validate reserved service slots</li><li>State digital download limits</li></ul>"}}'
    ),
    (
      'seo-boutique-emarzona-checklist',
      'Checklist SEO pour votre boutique Emarzona',
      'Titres, descriptions, images et structure : optimisez la visibilité de vos fiches produits et de votre vitrine.',
      '<h2>SEO produit</h2><p>Utilisez des titres uniques, des descriptions complètes et des images avec attribut <code>alt</code>.</p><h2>SEO boutique</h2><p>Personnalisez le pied de page, les pages légales et partagez votre URL myemarzona.shop.</p><h2>Performance</h2><p>Des images compressées et un catalogue à jour améliorent l''expérience acheteur et le référencement.</p>',
      'ecommerce',
      'https://www.emarzona.com/og-image.png',
      'SEO boutique Emarzona',
      ARRAY['seo', 'référencement', 'boutique', 'marketing'],
      false,
      4,
      14,
      'Checklist SEO boutique Emarzona | Blog',
      'Optimisez le référencement de votre boutique et de vos produits sur Emarzona.',
      'SEO e-commerce, référencement, Emarzona boutique',
      '{"en":{"title":"SEO checklist for your Emarzona store","excerpt":"Titles, descriptions, images and structure to improve product and storefront visibility.","content":"<h2>Product SEO</h2><p>Use unique titles, rich descriptions and images with <code>alt</code> text.</p><h2>Store SEO</h2><p>Customize footer, legal pages and share your myemarzona.shop URL.</p><h2>Performance</h2><p>Compressed images and an up-to-date catalog improve buyer experience and discoverability.</p>"}}'
    )
) AS v(
  slug, title, excerpt, content, cat_slug, featured_image_url, featured_image_alt,
  tags, is_featured, reading_time, days_ago, seo_title, seo_description, seo_keywords, translations
)
JOIN public.platform_blog_categories c ON c.slug = v.cat_slug
WHERE NOT EXISTS (SELECT 1 FROM public.platform_blog_posts LIMIT 1);
