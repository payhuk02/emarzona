-- Brouillon apparence boutique + publication séparée du storefront public.

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS appearance_draft JSONB,
  ADD COLUMN IF NOT EXISTS appearance_published_at TIMESTAMPTZ;

COMMENT ON COLUMN public.stores.appearance_draft IS
  'Brouillon apparence (couleurs, images, layout) non visible sur le storefront public.';
COMMENT ON COLUMN public.stores.appearance_published_at IS
  'Horodatage de la dernière publication apparence sur le storefront public.';

UPDATE public.stores
SET appearance_published_at = COALESCE(updated_at, created_at, now())
WHERE appearance_published_at IS NULL;

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
  SELECT * INTO v_store FROM public.stores WHERE id = p_store_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  IF auth.uid() IS DISTINCT FROM v_store.user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  v_draft := v_store.appearance_draft;
  IF v_draft IS NULL THEN
    UPDATE public.stores
    SET appearance_published_at = now(), updated_at = now()
    WHERE id = p_store_id
    RETURNING * INTO v_store;
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

  RETURN v_store;
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_store_appearance(UUID) TO authenticated;
