-- Sprint 3: historique des publications apparence (rollback / audit).

BEGIN;

CREATE TABLE IF NOT EXISTS public.store_appearance_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL CHECK (revision_number > 0),
  snapshot JSONB NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_by UUID REFERENCES auth.users(id),
  UNIQUE (store_id, revision_number)
);

CREATE INDEX IF NOT EXISTS idx_store_appearance_revisions_store_published
  ON public.store_appearance_revisions (store_id, revision_number DESC);

COMMENT ON TABLE public.store_appearance_revisions IS
  'Snapshots apparence publiée à chaque publish_store_appearance (Sprint 3 rollback).';

ALTER TABLE public.store_appearance_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_appearance_revisions_select ON public.store_appearance_revisions;
CREATE POLICY store_appearance_revisions_select
  ON public.store_appearance_revisions
  FOR SELECT
  TO authenticated
  USING (public.has_store_permission(store_id, auth.uid(), 'settings.manage'));

CREATE OR REPLACE FUNCTION public.build_store_appearance_snapshot(p_store public.stores)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_strip_nulls(
    jsonb_build_object(
      'logo_url', p_store.logo_url,
      'banner_url', p_store.banner_url,
      'favicon_url', p_store.favicon_url,
      'apple_touch_icon_url', p_store.apple_touch_icon_url,
      'watermark_url', p_store.watermark_url,
      'placeholder_image_url', p_store.placeholder_image_url,
      'primary_color', p_store.primary_color,
      'secondary_color', p_store.secondary_color,
      'accent_color', p_store.accent_color,
      'background_color', p_store.background_color,
      'text_color', p_store.text_color,
      'text_secondary_color', p_store.text_secondary_color,
      'button_primary_color', p_store.button_primary_color,
      'button_primary_text', p_store.button_primary_text,
      'button_secondary_color', p_store.button_secondary_color,
      'button_secondary_text', p_store.button_secondary_text,
      'link_color', p_store.link_color,
      'link_hover_color', p_store.link_hover_color,
      'border_radius', p_store.border_radius,
      'shadow_intensity', p_store.shadow_intensity,
      'heading_font', p_store.heading_font,
      'body_font', p_store.body_font,
      'font_size_base', p_store.font_size_base,
      'heading_size_h1', p_store.heading_size_h1,
      'heading_size_h2', p_store.heading_size_h2,
      'heading_size_h3', p_store.heading_size_h3,
      'line_height', p_store.line_height,
      'letter_spacing', p_store.letter_spacing,
      'header_style', p_store.header_style,
      'footer_style', p_store.footer_style,
      'sidebar_enabled', p_store.sidebar_enabled,
      'sidebar_position', p_store.sidebar_position,
      'product_grid_columns', p_store.product_grid_columns,
      'product_card_style', p_store.product_card_style,
      'navigation_style', p_store.navigation_style
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.record_store_appearance_revision(
  p_store_id UUID,
  p_store public.stores
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next INTEGER;
BEGIN
  SELECT COALESCE(MAX(revision_number), 0) + 1
  INTO v_next
  FROM public.store_appearance_revisions
  WHERE store_id = p_store_id;

  INSERT INTO public.store_appearance_revisions (
    store_id,
    revision_number,
    snapshot,
    published_by
  )
  VALUES (
    p_store_id,
    v_next,
    public.build_store_appearance_snapshot(p_store),
    auth.uid()
  );
END;
$$;

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
  RETURN v_store;
END;
$$;

GRANT SELECT ON public.store_appearance_revisions TO authenticated;

COMMIT;
