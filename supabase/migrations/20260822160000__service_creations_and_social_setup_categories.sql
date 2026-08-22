-- Add missing service subcategories used in the wizard:
--   Marketing → Créations
--   Marketing → Configuration des réseaux sociaux
-- Idempotent via ON CONFLICT (slug).

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

SELECT public._seed_svc_category(
  'svc-configuration-reseaux-sociaux',
  'Configuration des réseaux sociaux',
  'Mise en place des comptes, bios, Business Manager, pixel et catalogues',
  'Settings',
  'svc-marketing-communication',
  4
);

SELECT public._seed_svc_category(
  'svc-creations',
  'Créations',
  'Visuels pour les réseaux : posts, stories, carrousels, pubs et bannières',
  'Sparkles',
  'svc-marketing-communication',
  5
);

DROP FUNCTION IF EXISTS public._seed_svc_category(text, text, text, text, text, integer);
