-- Promote « Créations » to a root category and seed per-network subcategories.
-- Remap any product that still pointed at the old Marketing leaf.

CREATE OR REPLACE FUNCTION public._seed_svc_category(
  p_slug text,
  p_name text,
  p_description text,
  p_icon text,
  p_parent_slug text,
  p_sort_order integer
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
  v_parent_id uuid;
BEGIN
  IF p_parent_slug IS NOT NULL THEN
    SELECT id INTO v_parent_id FROM public.categories WHERE slug = p_parent_slug;
    IF v_parent_id IS NULL THEN
      RAISE EXCEPTION 'Parent category % not found', p_parent_slug;
    END IF;
  END IF;

  INSERT INTO public.categories (
    name, slug, description, icon, parent_id, sort_order, is_active, product_types
  ) VALUES (
    p_name, p_slug, p_description, p_icon, v_parent_id, p_sort_order, true, ARRAY['service']::text[]
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    parent_id = EXCLUDED.parent_id,
    sort_order = EXCLUDED.sort_order,
    is_active = true,
    product_types = ARRAY['service']::text[],
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Root: Créations (was a Marketing leaf)
SELECT public._seed_svc_category(
  'svc-creations',
  'Créations',
  'Visuels et contenus par réseau social',
  'Sparkles',
  NULL,
  3
);

SELECT public._seed_svc_category('svc-creations-tiktok', 'TikTok monétisé', 'Vidéos, Shop et contenus pensés pour la monétisation TikTok', 'Video', 'svc-creations', 1);
SELECT public._seed_svc_category('svc-creations-facebook', 'Page Facebook professionnelle', 'Posts, Reels, couverture et visuels ads pour page pro', 'MessageSquare', 'svc-creations', 2);
SELECT public._seed_svc_category('svc-creations-instagram', 'Instagram professionnel', 'Feed, stories, Reels, carrousels et highlights', 'Camera', 'svc-creations', 3);
SELECT public._seed_svc_category('svc-creations-linkedin', 'LinkedIn professionnel', 'Page entreprise ou profil : posts, carrousels, bannière', 'Briefcase', 'svc-creations', 4);
SELECT public._seed_svc_category('svc-creations-youtube', 'YouTube', 'Shorts, miniatures, bannière et pack chaîne', 'Video', 'svc-creations', 5);
SELECT public._seed_svc_category('svc-creations-whatsapp', 'WhatsApp Business', 'Statuts, catalogue, canaux et visuels de diffusion', 'MessageSquare', 'svc-creations', 6);
SELECT public._seed_svc_category('svc-creations-x', 'X (Twitter)', 'Posts, threads, en-tête et cards', 'MessageSquare', 'svc-creations', 7);
SELECT public._seed_svc_category('svc-creations-snapchat', 'Snapchat', 'Stories, Spotlight, ads et filtres', 'Camera', 'svc-creations', 8);
SELECT public._seed_svc_category('svc-creations-pinterest', 'Pinterest', 'Épingles, Idea Pins et tableaux', 'Image', 'svc-creations', 9);
SELECT public._seed_svc_category('svc-creations-threads', 'Threads', 'Posts, carrousels et profil Threads', 'MessageSquare', 'svc-creations', 10);
SELECT public._seed_svc_category('svc-creations-telegram', 'Telegram', 'Canal, stickers, bannières et visuels bot', 'MessageSquare', 'svc-creations', 11);
SELECT public._seed_svc_category('svc-creations-kwai', 'Kwai', 'Vidéos, lives et vitrine Kwai', 'Video', 'svc-creations', 12);
SELECT public._seed_svc_category('svc-creations-google-business', 'Google Business', 'Posts, photos et fiches produits de la fiche d''établissement', 'Search', 'svc-creations', 13);
SELECT public._seed_svc_category('svc-creations-twitch', 'Twitch', 'Overlay, panneaux, emotes et écrans de stream', 'Video', 'svc-creations', 14);
SELECT public._seed_svc_category('svc-creations-discord', 'Discord', 'Bannière, icône, emojis et embeds', 'MessageSquare', 'svc-creations', 15);
SELECT public._seed_svc_category('svc-creations-multi-reseaux', 'Pack multi-réseaux', 'Même pack de visuels décliné sur plusieurs plateformes', 'Layers', 'svc-creations', 16);

-- Products that still pointed at the old leaf (now a parent) move to the multi-network pack
UPDATE public.products p
SET
  category_id = child.id,
  category = child.slug,
  updated_at = now()
FROM public.categories parent
JOIN public.categories child ON child.slug = 'svc-creations-multi-reseaux'
WHERE parent.slug = 'svc-creations'
  AND p.category_id = parent.id;

DROP FUNCTION IF EXISTS public._seed_svc_category(text, text, text, text, text, integer);
