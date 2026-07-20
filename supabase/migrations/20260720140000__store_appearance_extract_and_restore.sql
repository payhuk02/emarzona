-- Sprint 3: table store_appearance (1:1) + RPC list/restore révisions.

BEGIN;

CREATE TABLE IF NOT EXISTS public.store_appearance (
  store_id UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  logo_url TEXT,
  banner_url TEXT,
  favicon_url TEXT,
  apple_touch_icon_url TEXT,
  watermark_url TEXT,
  placeholder_image_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  background_color TEXT,
  text_color TEXT,
  text_secondary_color TEXT,
  button_primary_color TEXT,
  button_primary_text TEXT,
  button_secondary_color TEXT,
  button_secondary_text TEXT,
  link_color TEXT,
  link_hover_color TEXT,
  border_radius TEXT,
  shadow_intensity TEXT,
  heading_font TEXT,
  body_font TEXT,
  font_size_base TEXT,
  heading_size_h1 TEXT,
  heading_size_h2 TEXT,
  heading_size_h3 TEXT,
  line_height TEXT,
  letter_spacing TEXT,
  header_style TEXT,
  footer_style TEXT,
  sidebar_enabled BOOLEAN,
  sidebar_position TEXT,
  product_grid_columns INTEGER,
  product_card_style TEXT,
  navigation_style TEXT,
  appearance_draft JSONB,
  appearance_published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.store_appearance IS
  'Apparence publiée + brouillon par boutique (extraction progressive depuis stores).';

INSERT INTO public.store_appearance (
  store_id,
  logo_url,
  banner_url,
  favicon_url,
  apple_touch_icon_url,
  watermark_url,
  placeholder_image_url,
  primary_color,
  secondary_color,
  accent_color,
  background_color,
  text_color,
  text_secondary_color,
  button_primary_color,
  button_primary_text,
  button_secondary_color,
  button_secondary_text,
  link_color,
  link_hover_color,
  border_radius,
  shadow_intensity,
  heading_font,
  body_font,
  font_size_base,
  heading_size_h1,
  heading_size_h2,
  heading_size_h3,
  line_height,
  letter_spacing,
  header_style,
  footer_style,
  sidebar_enabled,
  sidebar_position,
  product_grid_columns,
  product_card_style,
  navigation_style,
  appearance_draft,
  appearance_published_at,
  updated_at
)
SELECT
  id,
  logo_url,
  banner_url,
  favicon_url,
  apple_touch_icon_url,
  watermark_url,
  placeholder_image_url,
  primary_color,
  secondary_color,
  accent_color,
  background_color,
  text_color,
  text_secondary_color,
  button_primary_color,
  button_primary_text,
  button_secondary_color,
  button_secondary_text,
  link_color,
  link_hover_color,
  border_radius,
  shadow_intensity,
  heading_font,
  body_font,
  font_size_base,
  heading_size_h1,
  heading_size_h2,
  heading_size_h3,
  line_height,
  letter_spacing,
  header_style,
  footer_style,
  sidebar_enabled,
  sidebar_position,
  product_grid_columns,
  product_card_style,
  navigation_style,
  appearance_draft,
  appearance_published_at,
  COALESCE(updated_at, created_at, now())
FROM public.stores
ON CONFLICT (store_id) DO UPDATE SET
  logo_url = EXCLUDED.logo_url,
  banner_url = EXCLUDED.banner_url,
  favicon_url = EXCLUDED.favicon_url,
  apple_touch_icon_url = EXCLUDED.apple_touch_icon_url,
  watermark_url = EXCLUDED.watermark_url,
  placeholder_image_url = EXCLUDED.placeholder_image_url,
  primary_color = EXCLUDED.primary_color,
  secondary_color = EXCLUDED.secondary_color,
  accent_color = EXCLUDED.accent_color,
  background_color = EXCLUDED.background_color,
  text_color = EXCLUDED.text_color,
  text_secondary_color = EXCLUDED.text_secondary_color,
  button_primary_color = EXCLUDED.button_primary_color,
  button_primary_text = EXCLUDED.button_primary_text,
  button_secondary_color = EXCLUDED.button_secondary_color,
  button_secondary_text = EXCLUDED.button_secondary_text,
  link_color = EXCLUDED.link_color,
  link_hover_color = EXCLUDED.link_hover_color,
  border_radius = EXCLUDED.border_radius,
  shadow_intensity = EXCLUDED.shadow_intensity,
  heading_font = EXCLUDED.heading_font,
  body_font = EXCLUDED.body_font,
  font_size_base = EXCLUDED.font_size_base,
  heading_size_h1 = EXCLUDED.heading_size_h1,
  heading_size_h2 = EXCLUDED.heading_size_h2,
  heading_size_h3 = EXCLUDED.heading_size_h3,
  line_height = EXCLUDED.line_height,
  letter_spacing = EXCLUDED.letter_spacing,
  header_style = EXCLUDED.header_style,
  footer_style = EXCLUDED.footer_style,
  sidebar_enabled = EXCLUDED.sidebar_enabled,
  sidebar_position = EXCLUDED.sidebar_position,
  product_grid_columns = EXCLUDED.product_grid_columns,
  product_card_style = EXCLUDED.product_card_style,
  navigation_style = EXCLUDED.navigation_style,
  appearance_draft = EXCLUDED.appearance_draft,
  appearance_published_at = EXCLUDED.appearance_published_at,
  updated_at = EXCLUDED.updated_at;

ALTER TABLE public.store_appearance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_appearance_select ON public.store_appearance;
CREATE POLICY store_appearance_select
  ON public.store_appearance
  FOR SELECT
  TO authenticated
  USING (public.has_store_permission(store_id, auth.uid(), 'settings.manage'));

CREATE OR REPLACE FUNCTION public.sync_store_appearance_from_stores(p_store public.stores)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.store_appearance (
    store_id,
    logo_url,
    banner_url,
    favicon_url,
    apple_touch_icon_url,
    watermark_url,
    placeholder_image_url,
    primary_color,
    secondary_color,
    accent_color,
    background_color,
    text_color,
    text_secondary_color,
    button_primary_color,
    button_primary_text,
    button_secondary_color,
    button_secondary_text,
    link_color,
    link_hover_color,
    border_radius,
    shadow_intensity,
    heading_font,
    body_font,
    font_size_base,
    heading_size_h1,
    heading_size_h2,
    heading_size_h3,
    line_height,
    letter_spacing,
    header_style,
    footer_style,
    sidebar_enabled,
    sidebar_position,
    product_grid_columns,
    product_card_style,
    navigation_style,
    appearance_draft,
    appearance_published_at,
    updated_at
  )
  VALUES (
    p_store.id,
    p_store.logo_url,
    p_store.banner_url,
    p_store.favicon_url,
    p_store.apple_touch_icon_url,
    p_store.watermark_url,
    p_store.placeholder_image_url,
    p_store.primary_color,
    p_store.secondary_color,
    p_store.accent_color,
    p_store.background_color,
    p_store.text_color,
    p_store.text_secondary_color,
    p_store.button_primary_color,
    p_store.button_primary_text,
    p_store.button_secondary_color,
    p_store.button_secondary_text,
    p_store.link_color,
    p_store.link_hover_color,
    p_store.border_radius,
    p_store.shadow_intensity,
    p_store.heading_font,
    p_store.body_font,
    p_store.font_size_base,
    p_store.heading_size_h1,
    p_store.heading_size_h2,
    p_store.heading_size_h3,
    p_store.line_height,
    p_store.letter_spacing,
    p_store.header_style,
    p_store.footer_style,
    p_store.sidebar_enabled,
    p_store.sidebar_position,
    p_store.product_grid_columns,
    p_store.product_card_style,
    p_store.navigation_style,
    p_store.appearance_draft,
    p_store.appearance_published_at,
    now()
  )
  ON CONFLICT (store_id) DO UPDATE SET
    logo_url = EXCLUDED.logo_url,
    banner_url = EXCLUDED.banner_url,
    favicon_url = EXCLUDED.favicon_url,
    apple_touch_icon_url = EXCLUDED.apple_touch_icon_url,
    watermark_url = EXCLUDED.watermark_url,
    placeholder_image_url = EXCLUDED.placeholder_image_url,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    accent_color = EXCLUDED.accent_color,
    background_color = EXCLUDED.background_color,
    text_color = EXCLUDED.text_color,
    text_secondary_color = EXCLUDED.text_secondary_color,
    button_primary_color = EXCLUDED.button_primary_color,
    button_primary_text = EXCLUDED.button_primary_text,
    button_secondary_color = EXCLUDED.button_secondary_color,
    button_secondary_text = EXCLUDED.button_secondary_text,
    link_color = EXCLUDED.link_color,
    link_hover_color = EXCLUDED.link_hover_color,
    border_radius = EXCLUDED.border_radius,
    shadow_intensity = EXCLUDED.shadow_intensity,
    heading_font = EXCLUDED.heading_font,
    body_font = EXCLUDED.body_font,
    font_size_base = EXCLUDED.font_size_base,
    heading_size_h1 = EXCLUDED.heading_size_h1,
    heading_size_h2 = EXCLUDED.heading_size_h2,
    heading_size_h3 = EXCLUDED.heading_size_h3,
    line_height = EXCLUDED.line_height,
    letter_spacing = EXCLUDED.letter_spacing,
    header_style = EXCLUDED.header_style,
    footer_style = EXCLUDED.footer_style,
    sidebar_enabled = EXCLUDED.sidebar_enabled,
    sidebar_position = EXCLUDED.sidebar_position,
    product_grid_columns = EXCLUDED.product_grid_columns,
    product_card_style = EXCLUDED.product_card_style,
    navigation_style = EXCLUDED.navigation_style,
    appearance_draft = EXCLUDED.appearance_draft,
    appearance_published_at = EXCLUDED.appearance_published_at,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.list_store_appearance_revisions(
  p_store_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  revision_number INTEGER,
  published_at TIMESTAMPTZ,
  published_by UUID,
  primary_color TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_store_permission(p_store_id, auth.uid(), 'settings.manage') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    r.revision_number,
    r.published_at,
    r.published_by,
    NULLIF(r.snapshot->>'primary_color', '') AS primary_color
  FROM public.store_appearance_revisions r
  WHERE r.store_id = p_store_id
  ORDER BY r.revision_number DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 10), 50));
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_store_appearance_revision(
  p_store_id UUID,
  p_revision_number INTEGER
)
RETURNS public.stores
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot JSONB;
  v_store public.stores;
BEGIN
  IF NOT public.has_store_permission(p_store_id, auth.uid(), 'settings.manage') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT snapshot INTO v_snapshot
  FROM public.store_appearance_revisions
  WHERE store_id = p_store_id AND revision_number = p_revision_number;

  IF v_snapshot IS NULL THEN
    RAISE EXCEPTION 'Revision not found';
  END IF;

  v_snapshot := public.sanitize_appearance_draft(v_snapshot);
  IF v_snapshot IS NULL THEN
    RAISE EXCEPTION 'Invalid appearance snapshot';
  END IF;

  UPDATE public.stores
  SET appearance_draft = v_snapshot, updated_at = now()
  WHERE id = p_store_id
  RETURNING * INTO v_store;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  RETURN public.publish_store_appearance(p_store_id);
END;
$$;

GRANT SELECT ON public.store_appearance TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_store_appearance_revisions(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_store_appearance_revision(UUID, INTEGER) TO authenticated;

-- Dual-write store_appearance après chaque publish (patch publish si 20260720130000 déjà appliquée).
CREATE OR REPLACE FUNCTION public.publish_store_appearance(p_store_id UUID)
RETURNS public.stores
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store public.stores;
  v_draft JSONB;
BEGIN
  IF NOT public.has_store_permission(p_store_id, auth.uid(), 'settings.manage') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_store FROM public.stores WHERE id = p_store_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  v_draft := public.sanitize_appearance_draft(v_store.appearance_draft);
  IF v_draft IS NULL THEN
    UPDATE public.stores
    SET appearance_published_at = now(), updated_at = now()
    WHERE id = p_store_id
    RETURNING * INTO v_store;

    PERFORM public.record_store_appearance_revision(p_store_id, v_store);
    PERFORM public.sync_store_appearance_from_stores(v_store);
    RETURN v_store;
  END IF;

  UPDATE public.stores
  SET
    logo_url = NULLIF(v_draft->>'logo_url', ''),
    banner_url = NULLIF(v_draft->>'banner_url', ''),
    favicon_url = NULLIF(v_draft->>'favicon_url', ''),
    apple_touch_icon_url = NULLIF(v_draft->>'apple_touch_icon_url', ''),
    watermark_url = NULLIF(v_draft->>'watermark_url', ''),
    placeholder_image_url = NULLIF(v_draft->>'placeholder_image_url', ''),
    primary_color = NULLIF(v_draft->>'primary_color', ''),
    secondary_color = NULLIF(v_draft->>'secondary_color', ''),
    accent_color = NULLIF(v_draft->>'accent_color', ''),
    background_color = NULLIF(v_draft->>'background_color', ''),
    text_color = NULLIF(v_draft->>'text_color', ''),
    text_secondary_color = NULLIF(v_draft->>'text_secondary_color', ''),
    button_primary_color = NULLIF(v_draft->>'button_primary_color', ''),
    button_primary_text = NULLIF(v_draft->>'button_primary_text', ''),
    button_secondary_color = NULLIF(v_draft->>'button_secondary_color', ''),
    button_secondary_text = NULLIF(v_draft->>'button_secondary_text', ''),
    link_color = NULLIF(v_draft->>'link_color', ''),
    link_hover_color = NULLIF(v_draft->>'link_hover_color', ''),
    border_radius = NULLIF(v_draft->>'border_radius', ''),
    shadow_intensity = NULLIF(v_draft->>'shadow_intensity', ''),
    heading_font = NULLIF(v_draft->>'heading_font', ''),
    body_font = NULLIF(v_draft->>'body_font', ''),
    font_size_base = NULLIF(v_draft->>'font_size_base', ''),
    heading_size_h1 = NULLIF(v_draft->>'heading_size_h1', ''),
    heading_size_h2 = NULLIF(v_draft->>'heading_size_h2', ''),
    heading_size_h3 = NULLIF(v_draft->>'heading_size_h3', ''),
    line_height = NULLIF(v_draft->>'line_height', ''),
    letter_spacing = NULLIF(v_draft->>'letter_spacing', ''),
    header_style = NULLIF(v_draft->>'header_style', ''),
    footer_style = NULLIF(v_draft->>'footer_style', ''),
    sidebar_enabled = COALESCE((v_draft->>'sidebar_enabled')::boolean, sidebar_enabled),
    sidebar_position = COALESCE(NULLIF(v_draft->>'sidebar_position', ''), sidebar_position),
    product_grid_columns = COALESCE((v_draft->>'product_grid_columns')::integer, product_grid_columns),
    product_card_style = COALESCE(NULLIF(v_draft->>'product_card_style', ''), product_card_style),
    navigation_style = COALESCE(NULLIF(v_draft->>'navigation_style', ''), navigation_style),
    appearance_draft = NULL,
    appearance_published_at = now(),
    updated_at = now()
  WHERE id = p_store_id
  RETURNING * INTO v_store;

  PERFORM public.record_store_appearance_revision(p_store_id, v_store);
  PERFORM public.sync_store_appearance_from_stores(v_store);
  RETURN v_store;
END;
$$;

COMMIT;
