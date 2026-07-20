-- Sprint 3: retirer les colonnes apparence de `stores` (lecture via store_appearance + stores_public).

BEGIN;

DROP FUNCTION IF EXISTS public.build_store_appearance_snapshot(public.stores);
DROP FUNCTION IF EXISTS public.sync_store_appearance_from_stores(public.stores);

-- Trigger UPDATE OF logo_url/primary_color bloque le DROP COLUMN
DROP TRIGGER IF EXISTS on_store_update_invalidate_cache ON public.stores;
CREATE TRIGGER on_store_update_invalidate_cache
AFTER UPDATE OF name, slug, custom_domain, is_active
ON public.stores
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION public.trigger_cache_invalidation();

-- Invalidvalider le cache quand l'apparence publiée change
DROP TRIGGER IF EXISTS on_store_appearance_update_invalidate_cache ON public.store_appearance;
CREATE TRIGGER on_store_appearance_update_invalidate_cache
AFTER UPDATE OF logo_url, primary_color, appearance_published_at
ON public.store_appearance
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION public.trigger_cache_invalidation();

-- Marketplace view dépendait de stores.logo_url
DROP VIEW IF EXISTS public.marketplace_products_optimized CASCADE;

CREATE VIEW public.marketplace_products_optimized AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.description,
  p.short_description,
  p.price,
  p.promotional_price,
  p.currency,
  p.category,
  p.product_type,
  p.licensing_type,
  p.license_terms,
  p.is_featured,
  p.is_active,
  p.rating,
  p.reviews_count,
  0::integer AS purchases_count,
  p.created_at,
  p.updated_at,
  p.image_url,
  p.tags,
  s.id AS store_id,
  s.name AS store_name,
  s.slug AS store_slug,
  sa.logo_url AS store_logo_url,
  pas.commission_rate,
  pas.affiliate_enabled,
  COALESCE(p.rating, 0) AS sort_rating,
  COALESCE(p.reviews_count, 0) AS sort_reviews,
  0::integer AS sort_purchases,
  CASE
    WHEN p.promotional_price IS NOT NULL AND p.promotional_price < p.price
    THEN p.promotional_price
    ELSE p.price
  END AS effective_price,
  p.payment_options
FROM public.products p
JOIN public.stores s ON p.store_id = s.id
LEFT JOIN public.store_appearance sa ON sa.store_id = s.id
LEFT JOIN public.product_affiliate_settings pas ON p.id = pas.product_id
WHERE p.is_active = true
  AND (p.is_draft IS NULL OR p.is_draft = false)
  AND s.is_active = true;

COMMENT ON VIEW public.marketplace_products_optimized IS
  'Vue optimisée marketplace ; store_logo_url depuis store_appearance';

GRANT SELECT ON public.marketplace_products_optimized TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_marketplace_products_filtered(
  p_limit INTEGER DEFAULT 24,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_product_type TEXT DEFAULT NULL,
  p_min_price DECIMAL DEFAULT NULL,
  p_max_price DECIMAL DEFAULT NULL,
  p_min_rating DECIMAL DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc',
  p_search_query TEXT DEFAULT NULL,
  p_featured_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  short_description TEXT,
  price DECIMAL,
  promotional_price DECIMAL,
  currency TEXT,
  category TEXT,
  product_type TEXT,
  licensing_type TEXT,
  license_terms TEXT,
  is_featured BOOLEAN,
  rating DECIMAL,
  reviews_count INTEGER,
  purchases_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  image_url TEXT,
  tags TEXT[],
  store_id UUID,
  store_name TEXT,
  store_slug TEXT,
  store_logo_url TEXT,
  commission_rate DECIMAL,
  affiliate_enabled BOOLEAN,
  payment_options JSONB,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT m.*
    FROM marketplace_products_optimized m
    WHERE
      (p_category IS NULL OR p_category = 'all' OR m.category = p_category)
      AND (p_product_type IS NULL OR p_product_type = 'all' OR m.product_type = p_product_type)
      AND (p_min_price IS NULL OR m.effective_price >= p_min_price)
      AND (p_max_price IS NULL OR m.effective_price <= p_max_price)
      AND (p_min_rating IS NULL OR m.sort_rating >= p_min_rating)
      AND (
        p_search_query IS NULL
        OR TRIM(p_search_query) = ''
        OR m.name ILIKE '%' || TRIM(p_search_query) || '%'
        OR m.description ILIKE '%' || TRIM(p_search_query) || '%'
      )
      AND (NOT p_featured_only OR m.is_featured = true)
  ),
  counted AS (
    SELECT COUNT(*)::bigint AS cnt FROM filtered
  )
  SELECT
    f.id,
    f.name,
    f.slug,
    f.description,
    f.short_description,
    f.price,
    f.promotional_price,
    f.currency,
    f.category,
    f.product_type,
    f.licensing_type,
    f.license_terms,
    f.is_featured,
    f.rating,
    f.reviews_count,
    f.purchases_count,
    f.created_at,
    f.updated_at,
    f.image_url,
    f.tags,
    f.store_id,
    f.store_name,
    f.store_slug,
    f.store_logo_url,
    f.commission_rate,
    f.affiliate_enabled,
    f.payment_options,
    c.cnt AS total_count
  FROM filtered f
  CROSS JOIN counted c
  ORDER BY
    CASE WHEN p_sort_by = 'price' AND UPPER(p_sort_order) = 'ASC' THEN f.effective_price END ASC,
    CASE WHEN p_sort_by = 'price' AND UPPER(p_sort_order) <> 'ASC' THEN f.effective_price END DESC,
    CASE WHEN p_sort_by = 'rating' AND UPPER(p_sort_order) = 'ASC' THEN f.sort_rating END ASC,
    CASE WHEN p_sort_by = 'rating' AND UPPER(p_sort_order) <> 'ASC' THEN f.sort_rating END DESC,
    CASE WHEN p_sort_by IN ('popular', 'sales_count') AND UPPER(p_sort_order) = 'ASC' THEN f.sort_purchases END ASC,
    CASE WHEN p_sort_by IN ('popular', 'sales_count') AND UPPER(p_sort_order) <> 'ASC' THEN f.sort_purchases END DESC,
    CASE WHEN p_sort_by = 'oldest' THEN f.created_at END ASC,
    CASE WHEN p_sort_by IN ('newest', 'created_at') OR p_sort_by IS NULL THEN f.created_at END DESC,
    f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_products_filtered(
  INTEGER, INTEGER, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, BOOLEAN
) TO anon, authenticated;

-- stores_public : apparence uniquement depuis store_appearance
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
  sa.logo_url,
  sa.banner_url,
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
  sa.primary_color,
  sa.secondary_color,
  sa.accent_color,
  sa.background_color,
  sa.text_color,
  sa.text_secondary_color,
  sa.button_primary_color,
  sa.button_primary_text,
  sa.button_secondary_color,
  sa.button_secondary_text,
  sa.link_color,
  sa.link_hover_color,
  sa.border_radius,
  sa.shadow_intensity,
  sa.heading_font,
  sa.body_font,
  sa.font_size_base,
  sa.heading_size_h1,
  sa.heading_size_h2,
  sa.heading_size_h3,
  sa.line_height,
  sa.letter_spacing,
  sa.header_style,
  sa.footer_style,
  sa.sidebar_enabled,
  sa.sidebar_position,
  sa.product_grid_columns,
  sa.product_card_style,
  sa.navigation_style,
  sa.favicon_url,
  sa.apple_touch_icon_url,
  sa.watermark_url,
  sa.placeholder_image_url,
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

-- RPC brouillon : store_appearance uniquement
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

  UPDATE public.stores SET updated_at = now()
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

  v_draft := public.sanitize_appearance_draft(v_draft);
  IF v_draft IS NULL THEN
    UPDATE public.store_appearance
    SET appearance_published_at = now(), updated_at = now()
    WHERE store_id = p_store_id;

    UPDATE public.stores SET updated_at = now()
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

  UPDATE public.stores SET updated_at = now()
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

  UPDATE public.stores SET updated_at = now()
  WHERE id = p_store_id
  RETURNING * INTO v_store;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  RETURN public.publish_store_appearance(p_store_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.build_store_appearance_snapshot(p_store_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_strip_nulls(
    jsonb_build_object(
      'logo_url', sa.logo_url,
      'banner_url', sa.banner_url,
      'favicon_url', sa.favicon_url,
      'apple_touch_icon_url', sa.apple_touch_icon_url,
      'watermark_url', sa.watermark_url,
      'placeholder_image_url', sa.placeholder_image_url,
      'primary_color', sa.primary_color,
      'secondary_color', sa.secondary_color,
      'accent_color', sa.accent_color,
      'background_color', sa.background_color,
      'text_color', sa.text_color,
      'text_secondary_color', sa.text_secondary_color,
      'button_primary_color', sa.button_primary_color,
      'button_primary_text', sa.button_primary_text,
      'button_secondary_color', sa.button_secondary_color,
      'button_secondary_text', sa.button_secondary_text,
      'link_color', sa.link_color,
      'link_hover_color', sa.link_hover_color,
      'border_radius', sa.border_radius,
      'shadow_intensity', sa.shadow_intensity,
      'heading_font', sa.heading_font,
      'body_font', sa.body_font,
      'font_size_base', sa.font_size_base,
      'heading_size_h1', sa.heading_size_h1,
      'heading_size_h2', sa.heading_size_h2,
      'heading_size_h3', sa.heading_size_h3,
      'line_height', sa.line_height,
      'letter_spacing', sa.letter_spacing,
      'header_style', sa.header_style,
      'footer_style', sa.footer_style,
      'sidebar_enabled', sa.sidebar_enabled,
      'sidebar_position', sa.sidebar_position,
      'product_grid_columns', sa.product_grid_columns,
      'product_card_style', sa.product_card_style,
      'navigation_style', sa.navigation_style
    )
  )
  FROM public.store_appearance sa
  WHERE sa.store_id = p_store_id;
$$;

ALTER TABLE public.stores
  DROP COLUMN IF EXISTS logo_url,
  DROP COLUMN IF EXISTS banner_url,
  DROP COLUMN IF EXISTS favicon_url,
  DROP COLUMN IF EXISTS apple_touch_icon_url,
  DROP COLUMN IF EXISTS watermark_url,
  DROP COLUMN IF EXISTS placeholder_image_url,
  DROP COLUMN IF EXISTS primary_color,
  DROP COLUMN IF EXISTS secondary_color,
  DROP COLUMN IF EXISTS accent_color,
  DROP COLUMN IF EXISTS background_color,
  DROP COLUMN IF EXISTS text_color,
  DROP COLUMN IF EXISTS text_secondary_color,
  DROP COLUMN IF EXISTS button_primary_color,
  DROP COLUMN IF EXISTS button_primary_text,
  DROP COLUMN IF EXISTS button_secondary_color,
  DROP COLUMN IF EXISTS button_secondary_text,
  DROP COLUMN IF EXISTS link_color,
  DROP COLUMN IF EXISTS link_hover_color,
  DROP COLUMN IF EXISTS border_radius,
  DROP COLUMN IF EXISTS shadow_intensity,
  DROP COLUMN IF EXISTS heading_font,
  DROP COLUMN IF EXISTS body_font,
  DROP COLUMN IF EXISTS font_size_base,
  DROP COLUMN IF EXISTS heading_size_h1,
  DROP COLUMN IF EXISTS heading_size_h2,
  DROP COLUMN IF EXISTS heading_size_h3,
  DROP COLUMN IF EXISTS line_height,
  DROP COLUMN IF EXISTS letter_spacing,
  DROP COLUMN IF EXISTS header_style,
  DROP COLUMN IF EXISTS footer_style,
  DROP COLUMN IF EXISTS sidebar_enabled,
  DROP COLUMN IF EXISTS sidebar_position,
  DROP COLUMN IF EXISTS product_grid_columns,
  DROP COLUMN IF EXISTS product_card_style,
  DROP COLUMN IF EXISTS navigation_style,
  DROP COLUMN IF EXISTS appearance_draft,
  DROP COLUMN IF EXISTS appearance_published_at;

GRANT INSERT, UPDATE ON public.store_appearance TO authenticated;

DROP POLICY IF EXISTS store_appearance_manage ON public.store_appearance;
CREATE POLICY store_appearance_manage
  ON public.store_appearance
  FOR ALL
  TO authenticated
  USING (public.has_store_permission(store_id, auth.uid(), 'settings.manage'))
  WITH CHECK (public.has_store_permission(store_id, auth.uid(), 'settings.manage'));

COMMIT;
