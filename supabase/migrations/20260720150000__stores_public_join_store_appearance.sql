-- Sprint 3: stores_public lit store_appearance ; RPCs écrivent dans store_appearance (source de vérité).

BEGIN;

-- Garantir une ligne store_appearance à chaque nouvelle boutique
CREATE OR REPLACE FUNCTION public.ensure_store_appearance_on_store_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.store_appearance (store_id)
  VALUES (NEW.id)
  ON CONFLICT (store_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stores_ensure_appearance ON public.stores;
CREATE TRIGGER trg_stores_ensure_appearance
  AFTER INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_store_appearance_on_store_insert();

-- Backfill lignes manquantes
INSERT INTO public.store_appearance (store_id)
SELECT s.id FROM public.stores s
WHERE NOT EXISTS (SELECT 1 FROM public.store_appearance sa WHERE sa.store_id = s.id)
ON CONFLICT (store_id) DO NOTHING;

-- Snapshot depuis store_appearance (fallback stores pendant transition)
DROP FUNCTION IF EXISTS public.build_store_appearance_snapshot(public.stores);

CREATE OR REPLACE FUNCTION public.build_store_appearance_snapshot(p_store_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_strip_nulls(
    jsonb_build_object(
      'logo_url', COALESCE(sa.logo_url, s.logo_url),
      'banner_url', COALESCE(sa.banner_url, s.banner_url),
      'favicon_url', COALESCE(sa.favicon_url, s.favicon_url),
      'apple_touch_icon_url', COALESCE(sa.apple_touch_icon_url, s.apple_touch_icon_url),
      'watermark_url', COALESCE(sa.watermark_url, s.watermark_url),
      'placeholder_image_url', COALESCE(sa.placeholder_image_url, s.placeholder_image_url),
      'primary_color', COALESCE(sa.primary_color, s.primary_color),
      'secondary_color', COALESCE(sa.secondary_color, s.secondary_color),
      'accent_color', COALESCE(sa.accent_color, s.accent_color),
      'background_color', COALESCE(sa.background_color, s.background_color),
      'text_color', COALESCE(sa.text_color, s.text_color),
      'text_secondary_color', COALESCE(sa.text_secondary_color, s.text_secondary_color),
      'button_primary_color', COALESCE(sa.button_primary_color, s.button_primary_color),
      'button_primary_text', COALESCE(sa.button_primary_text, s.button_primary_text),
      'button_secondary_color', COALESCE(sa.button_secondary_color, s.button_secondary_color),
      'button_secondary_text', COALESCE(sa.button_secondary_text, s.button_secondary_text),
      'link_color', COALESCE(sa.link_color, s.link_color),
      'link_hover_color', COALESCE(sa.link_hover_color, s.link_hover_color),
      'border_radius', COALESCE(sa.border_radius, s.border_radius),
      'shadow_intensity', COALESCE(sa.shadow_intensity, s.shadow_intensity),
      'heading_font', COALESCE(sa.heading_font, s.heading_font),
      'body_font', COALESCE(sa.body_font, s.body_font),
      'font_size_base', COALESCE(sa.font_size_base, s.font_size_base),
      'heading_size_h1', COALESCE(sa.heading_size_h1, s.heading_size_h1),
      'heading_size_h2', COALESCE(sa.heading_size_h2, s.heading_size_h2),
      'heading_size_h3', COALESCE(sa.heading_size_h3, s.heading_size_h3),
      'line_height', COALESCE(sa.line_height, s.line_height),
      'letter_spacing', COALESCE(sa.letter_spacing, s.letter_spacing),
      'header_style', COALESCE(sa.header_style, s.header_style),
      'footer_style', COALESCE(sa.footer_style, s.footer_style),
      'sidebar_enabled', COALESCE(sa.sidebar_enabled, s.sidebar_enabled),
      'sidebar_position', COALESCE(sa.sidebar_position, s.sidebar_position),
      'product_grid_columns', COALESCE(sa.product_grid_columns, s.product_grid_columns),
      'product_card_style', COALESCE(sa.product_card_style, s.product_card_style),
      'navigation_style', COALESCE(sa.navigation_style, s.navigation_style)
    )
  )
  FROM public.stores s
  LEFT JOIN public.store_appearance sa ON sa.store_id = s.id
  WHERE s.id = p_store_id;
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
  v_snapshot JSONB;
BEGIN
  v_snapshot := public.build_store_appearance_snapshot(p_store_id);

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
    v_snapshot,
    auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.save_store_appearance_draft(
  p_store_id UUID,
  p_draft JSONB
)
RETURNS public.stores
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store public.stores;
  v_clean JSONB;
BEGIN
  IF NOT public.has_store_permission(p_store_id, auth.uid(), 'settings.manage') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  v_clean := public.sanitize_appearance_draft(p_draft);

  INSERT INTO public.store_appearance (store_id, appearance_draft, updated_at)
  VALUES (p_store_id, v_clean, now())
  ON CONFLICT (store_id) DO UPDATE SET
    appearance_draft = EXCLUDED.appearance_draft,
    updated_at = now();

  UPDATE public.stores
  SET appearance_draft = v_clean, updated_at = now()
  WHERE id = p_store_id
  RETURNING * INTO v_store;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  RETURN v_store;
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

  INSERT INTO public.store_appearance (store_id)
  VALUES (p_store_id)
  ON CONFLICT (store_id) DO NOTHING;

  SELECT appearance_draft INTO v_draft
  FROM public.store_appearance
  WHERE store_id = p_store_id
  FOR UPDATE;

  IF v_draft IS NULL THEN
    v_draft := v_store.appearance_draft;
  END IF;

  v_draft := public.sanitize_appearance_draft(v_draft);
  IF v_draft IS NULL THEN
    UPDATE public.store_appearance
    SET appearance_published_at = now(), updated_at = now()
    WHERE store_id = p_store_id;

    UPDATE public.stores
    SET appearance_published_at = now(), updated_at = now()
    WHERE id = p_store_id
    RETURNING * INTO v_store;

    PERFORM public.record_store_appearance_revision(p_store_id, v_store);
    RETURN v_store;
  END IF;

  UPDATE public.store_appearance sa
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
    sidebar_enabled = COALESCE((v_draft->>'sidebar_enabled')::boolean, sa.sidebar_enabled),
    sidebar_position = COALESCE(NULLIF(v_draft->>'sidebar_position', ''), sa.sidebar_position),
    product_grid_columns = COALESCE((v_draft->>'product_grid_columns')::integer, sa.product_grid_columns),
    product_card_style = COALESCE(NULLIF(v_draft->>'product_card_style', ''), sa.product_card_style),
    navigation_style = COALESCE(NULLIF(v_draft->>'navigation_style', ''), sa.navigation_style),
    appearance_draft = NULL,
    appearance_published_at = now(),
    updated_at = now()
  WHERE sa.store_id = p_store_id;

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

  INSERT INTO public.store_appearance (store_id, appearance_draft, updated_at)
  VALUES (p_store_id, v_snapshot, now())
  ON CONFLICT (store_id) DO UPDATE SET
    appearance_draft = EXCLUDED.appearance_draft,
    updated_at = now();

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

-- stores_public : projection apparence depuis store_appearance (fallback stores)
DROP FUNCTION IF EXISTS public.get_store_by_subdomain(text);
DROP VIEW IF EXISTS public.stores_public;

CREATE VIEW public.stores_public
WITH (security_invoker = true) AS
SELECT
  s.id,
  s.name,
  s.slug,
  s.subdomain,
  s.description,
  COALESCE(sa.logo_url, s.logo_url) AS logo_url,
  COALESCE(sa.banner_url, s.banner_url) AS banner_url,
  s.is_active,
  s.created_at,
  s.updated_at,
  s.about,
  s.contact_email,
  s.contact_phone,
  s.support_email,
  s.sales_email,
  s.press_email,
  s.partnership_email,
  s.support_phone,
  s.sales_phone,
  s.whatsapp_number,
  s.telegram_username,
  s.facebook_url,
  s.instagram_url,
  s.twitter_url,
  s.linkedin_url,
  s.youtube_url,
  s.tiktok_url,
  s.pinterest_url,
  s.snapchat_url,
  s.discord_url,
  s.twitch_url,
  COALESCE(sa.primary_color, s.primary_color) AS primary_color,
  COALESCE(sa.secondary_color, s.secondary_color) AS secondary_color,
  COALESCE(sa.accent_color, s.accent_color) AS accent_color,
  COALESCE(sa.background_color, s.background_color) AS background_color,
  COALESCE(sa.text_color, s.text_color) AS text_color,
  COALESCE(sa.text_secondary_color, s.text_secondary_color) AS text_secondary_color,
  COALESCE(sa.button_primary_color, s.button_primary_color) AS button_primary_color,
  COALESCE(sa.button_primary_text, s.button_primary_text) AS button_primary_text,
  COALESCE(sa.button_secondary_color, s.button_secondary_color) AS button_secondary_color,
  COALESCE(sa.button_secondary_text, s.button_secondary_text) AS button_secondary_text,
  COALESCE(sa.link_color, s.link_color) AS link_color,
  COALESCE(sa.link_hover_color, s.link_hover_color) AS link_hover_color,
  COALESCE(sa.border_radius, s.border_radius) AS border_radius,
  COALESCE(sa.shadow_intensity, s.shadow_intensity) AS shadow_intensity,
  COALESCE(sa.heading_font, s.heading_font) AS heading_font,
  COALESCE(sa.body_font, s.body_font) AS body_font,
  COALESCE(sa.font_size_base, s.font_size_base) AS font_size_base,
  COALESCE(sa.heading_size_h1, s.heading_size_h1) AS heading_size_h1,
  COALESCE(sa.heading_size_h2, s.heading_size_h2) AS heading_size_h2,
  COALESCE(sa.heading_size_h3, s.heading_size_h3) AS heading_size_h3,
  COALESCE(sa.line_height, s.line_height) AS line_height,
  COALESCE(sa.letter_spacing, s.letter_spacing) AS letter_spacing,
  COALESCE(sa.header_style, s.header_style) AS header_style,
  COALESCE(sa.footer_style, s.footer_style) AS footer_style,
  COALESCE(sa.sidebar_enabled, s.sidebar_enabled) AS sidebar_enabled,
  COALESCE(sa.sidebar_position, s.sidebar_position) AS sidebar_position,
  COALESCE(sa.product_grid_columns, s.product_grid_columns) AS product_grid_columns,
  COALESCE(sa.product_card_style, s.product_card_style) AS product_card_style,
  COALESCE(sa.navigation_style, s.navigation_style) AS navigation_style,
  COALESCE(sa.favicon_url, s.favicon_url) AS favicon_url,
  COALESCE(sa.apple_touch_icon_url, s.apple_touch_icon_url) AS apple_touch_icon_url,
  COALESCE(sa.watermark_url, s.watermark_url) AS watermark_url,
  COALESCE(sa.placeholder_image_url, s.placeholder_image_url) AS placeholder_image_url,
  s.address_line1,
  s.address_line2,
  s.city,
  s.state_province,
  s.postal_code,
  s.country,
  s.latitude,
  s.longitude,
  s.timezone,
  s.opening_hours,
  s.legal_pages,
  s.marketing_content,
  s.google_analytics_id,
  s.google_analytics_enabled,
  s.facebook_pixel_id,
  s.facebook_pixel_enabled,
  s.google_tag_manager_id,
  s.google_tag_manager_enabled,
  s.tiktok_pixel_id,
  s.tiktok_pixel_enabled,
  s.custom_domain,
  s.domain_status,
  s.domain_verified_at,
  s.default_currency,
  s.info_message,
  s.info_message_color,
  s.info_message_font,
  s.commerce_type,
  s.active_clients,
  s.metadata
FROM public.stores s
LEFT JOIN public.store_appearance sa ON sa.store_id = s.id
WHERE COALESCE(s.is_active, true) = true;

GRANT SELECT ON public.stores_public TO anon, authenticated;

COMMENT ON VIEW public.stores_public IS
  'Public storefront projection. Appearance columns sourced from store_appearance (JOIN).';

CREATE OR REPLACE FUNCTION public.get_store_by_subdomain(store_subdomain TEXT)
RETURNS SETOF public.stores_public
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sp.*
  FROM public.stores_public sp
  WHERE sp.subdomain = store_subdomain
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_by_subdomain(TEXT) TO anon, authenticated;

COMMIT;
