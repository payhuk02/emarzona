-- Country of origin on products (cards + marketplace).
-- Required in app for physical + artist; optional for other types.
-- Physical rows keep physical_products.country_of_origin; synced to products via trigger.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS country_of_origin TEXT;

COMMENT ON COLUMN public.products.country_of_origin IS
  'ISO 3166-1 alpha-2 country code (product origin). Required for physical & artist in the app.';

UPDATE public.products p
SET country_of_origin = NULLIF(pp.country_of_origin, '')
FROM public.physical_products pp
WHERE pp.product_id = p.id
  AND (p.country_of_origin IS NULL OR p.country_of_origin = '')
  AND NULLIF(pp.country_of_origin, '') IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_product_country_of_origin_from_physical()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET country_of_origin = NULLIF(NEW.country_of_origin, '')
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_physical_country_of_origin ON public.physical_products;
CREATE TRIGGER trg_sync_physical_country_of_origin
  AFTER INSERT OR UPDATE OF country_of_origin ON public.physical_products
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_product_country_of_origin_from_physical();

-- Artist create/update: persist products.country_of_origin
CREATE OR REPLACE FUNCTION public.create_artist_product_tx(
  p_store_id UUID,
  p_product JSONB,
  p_artist JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id UUID;
  v_error TEXT;
BEGIN
  IF NOT public.user_owns_store(p_store_id) THEN
    RAISE EXCEPTION 'Accès refusé à cette boutique';
  END IF;

  v_error := public.validate_artist_product(
    COALESCE(p_artist->>'artist_type', ''),
    COALESCE(p_artist->>'artist_name', ''),
    COALESCE(p_artist->>'artwork_title', ''),
    NULLIF(p_artist->>'artwork_year', '')::INTEGER,
    COALESCE(p_artist->'artwork_dimensions', '{}'::jsonb),
    COALESCE(p_artist->>'artwork_edition_type', p_artist->>'edition_type', 'original'),
    NULLIF(p_artist->>'edition_number', '')::INTEGER,
    NULLIF(p_artist->>'total_editions', '')::INTEGER,
    COALESCE((p_artist->>'requires_shipping')::BOOLEAN, false),
    NULLIF(p_artist->>'artwork_link_url', ''),
    COALESCE(NULLIF(p_artist->>'shipping_handling_time', '')::INTEGER, 7),
    COALESCE((p_artist->>'shipping_insurance_amount')::NUMERIC, 0)
  );

  IF v_error IS NOT NULL AND trim(v_error) <> '' THEN
    RAISE EXCEPTION '%', v_error;
  END IF;

  INSERT INTO public.products (
    store_id, name, slug, description, short_description, price, currency,
    product_type, category, category_id, country_of_origin, image_url, images, tags,
    meta_title, meta_description, og_image, faqs, payment_options,
    is_draft, is_active, compare_at_price, cost_per_item
  ) VALUES (
    p_store_id,
    COALESCE(p_product->>'name', p_artist->>'artwork_title'),
    p_product->>'slug',
    COALESCE(p_product->>'description', ''),
    p_product->>'short_description',
    COALESCE((p_product->>'price')::NUMERIC, 0),
    COALESCE(p_product->>'currency', 'XOF'),
    'artist',
    NULLIF(p_product->>'category', ''),
    NULLIF(p_product->>'category_id', '')::UUID,
    NULLIF(p_product->>'country_of_origin', ''),
    p_product->>'image_url',
    COALESCE(p_product->'images', '[]'::jsonb),
    CASE
      WHEN jsonb_typeof(p_product->'tags') = 'array' THEN
        ARRAY(SELECT jsonb_array_elements_text(p_product->'tags'))
      ELSE ARRAY[]::TEXT[]
    END,
    p_product->>'meta_title',
    p_product->>'meta_description',
    p_product->>'og_image',
    COALESCE(p_product->'faqs', '[]'::jsonb),
    COALESCE(p_product->'payment_options', '{"payment_type":"full","percentage_rate":30}'::jsonb),
    COALESCE((p_product->>'is_draft')::BOOLEAN, false),
    COALESCE((p_product->>'is_active')::BOOLEAN, true),
    NULLIF(p_product->>'compare_at_price', '')::NUMERIC,
    NULLIF(p_product->>'cost_per_item', '')::NUMERIC
  )
  RETURNING id INTO v_product_id;

  INSERT INTO public.artist_products (
    product_id, store_id, artist_type, artist_name, artist_bio, artist_website,
    artist_photo_url, artist_social_links, artwork_title, artwork_year, artwork_medium,
    artwork_dimensions, artwork_link_url, artwork_edition_type, edition_number, total_editions,
    writer_specific, musician_specific, visual_artist_specific, designer_specific, multimedia_specific,
    requires_shipping, shipping_handling_time, shipping_fragile, shipping_insurance_required,
    shipping_insurance_amount, certificate_of_authenticity, certificate_file_url,
    signature_authenticated, signature_location
  ) VALUES (
    v_product_id,
    p_store_id,
    p_artist->>'artist_type',
    p_artist->>'artist_name',
    p_artist->>'artist_bio',
    p_artist->>'artist_website',
    p_artist->>'artist_photo_url',
    COALESCE(p_artist->'artist_social_links', '{}'::jsonb),
    p_artist->>'artwork_title',
    NULLIF(p_artist->>'artwork_year', '')::INTEGER,
    p_artist->>'artwork_medium',
    COALESCE(p_artist->'artwork_dimensions', '{}'::jsonb),
    NULLIF(p_artist->>'artwork_link_url', ''),
    COALESCE(p_artist->>'artwork_edition_type', p_artist->>'edition_type', 'original'),
    NULLIF(p_artist->>'edition_number', '')::INTEGER,
    NULLIF(p_artist->>'total_editions', '')::INTEGER,
    p_artist->'writer_specific',
    p_artist->'musician_specific',
    p_artist->'visual_artist_specific',
    p_artist->'designer_specific',
    p_artist->'multimedia_specific',
    COALESCE((p_artist->>'requires_shipping')::BOOLEAN, false),
    COALESCE(NULLIF(p_artist->>'shipping_handling_time', '')::INTEGER, 7),
    COALESCE((p_artist->>'shipping_fragile')::BOOLEAN, false),
    COALESCE((p_artist->>'shipping_insurance_required')::BOOLEAN, false),
    COALESCE((p_artist->>'shipping_insurance_amount')::NUMERIC, 0),
    COALESCE((p_artist->>'certificate_of_authenticity')::BOOLEAN, false),
    p_artist->>'certificate_file_url',
    COALESCE((p_artist->>'signature_authenticated')::BOOLEAN, false),
    p_artist->>'signature_location'
  );

  RETURN jsonb_build_object('success', true, 'product_id', v_product_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_artist_product_tx(
  p_store_id UUID,
  p_product_id UUID,
  p_product JSONB,
  p_artist JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_error TEXT;
BEGIN
  IF NOT public.user_owns_store(p_store_id) THEN
    RAISE EXCEPTION 'Accès refusé à cette boutique';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.products
    WHERE id = p_product_id AND store_id = p_store_id AND product_type = 'artist'
  ) THEN
    RAISE EXCEPTION 'Œuvre artiste introuvable';
  END IF;

  v_error := public.validate_artist_product(
    COALESCE(p_artist->>'artist_type', ''),
    COALESCE(p_artist->>'artist_name', ''),
    COALESCE(p_artist->>'artwork_title', ''),
    NULLIF(p_artist->>'artwork_year', '')::INTEGER,
    COALESCE(p_artist->'artwork_dimensions', '{}'::jsonb),
    COALESCE(p_artist->>'artwork_edition_type', p_artist->>'edition_type', 'original'),
    NULLIF(p_artist->>'edition_number', '')::INTEGER,
    NULLIF(p_artist->>'total_editions', '')::INTEGER,
    COALESCE((p_artist->>'requires_shipping')::BOOLEAN, false),
    NULLIF(p_artist->>'artwork_link_url', ''),
    COALESCE(NULLIF(p_artist->>'shipping_handling_time', '')::INTEGER, 7),
    COALESCE((p_artist->>'shipping_insurance_amount')::NUMERIC, 0)
  );

  IF v_error IS NOT NULL AND trim(v_error) <> '' THEN
    RAISE EXCEPTION '%', v_error;
  END IF;

  UPDATE public.products SET
    name = COALESCE(p_product->>'name', p_artist->>'artwork_title', name),
    slug = COALESCE(p_product->>'slug', slug),
    description = COALESCE(p_product->>'description', description),
    short_description = COALESCE(p_product->>'short_description', short_description),
    price = COALESCE((p_product->>'price')::NUMERIC, price),
    compare_at_price = CASE
      WHEN p_product ? 'compare_at_price' THEN NULLIF(p_product->>'compare_at_price', '')::NUMERIC
      ELSE compare_at_price
    END,
    cost_per_item = CASE
      WHEN p_product ? 'cost_per_item' THEN NULLIF(p_product->>'cost_per_item', '')::NUMERIC
      ELSE cost_per_item
    END,
    category = CASE
      WHEN p_product ? 'category' THEN NULLIF(p_product->>'category', '')
      ELSE category
    END,
    category_id = CASE
      WHEN p_product ? 'category_id' THEN NULLIF(p_product->>'category_id', '')::UUID
      ELSE category_id
    END,
    country_of_origin = CASE
      WHEN p_product ? 'country_of_origin' THEN NULLIF(p_product->>'country_of_origin', '')
      ELSE country_of_origin
    END,
    image_url = COALESCE(p_product->>'image_url', image_url),
    images = COALESCE(p_product->'images', images),
    tags = CASE
      WHEN jsonb_typeof(p_product->'tags') = 'array' THEN
        ARRAY(SELECT jsonb_array_elements_text(p_product->'tags'))
      WHEN p_product ? 'tags' THEN ARRAY[]::TEXT[]
      ELSE tags
    END,
    meta_title = COALESCE(p_product->>'meta_title', meta_title),
    meta_description = COALESCE(p_product->>'meta_description', meta_description),
    og_image = COALESCE(p_product->>'og_image', og_image),
    faqs = COALESCE(p_product->'faqs', faqs),
    payment_options = COALESCE(p_product->'payment_options', payment_options),
    hide_purchase_count = COALESCE((p_product->>'hide_purchase_count')::BOOLEAN, hide_purchase_count),
    hide_likes_count = COALESCE((p_product->>'hide_likes_count')::BOOLEAN, hide_likes_count),
    hide_recommendations_count = COALESCE((p_product->>'hide_recommendations_count')::BOOLEAN, hide_recommendations_count),
    hide_downloads_count = COALESCE((p_product->>'hide_downloads_count')::BOOLEAN, hide_downloads_count),
    hide_reviews_count = COALESCE((p_product->>'hide_reviews_count')::BOOLEAN, hide_reviews_count),
    hide_rating = COALESCE((p_product->>'hide_rating')::BOOLEAN, hide_rating),
    is_draft = COALESCE((p_product->>'is_draft')::BOOLEAN, is_draft),
    is_active = COALESCE((p_product->>'is_active')::BOOLEAN, is_active),
    updated_at = now()
  WHERE id = p_product_id;

  IF EXISTS (SELECT 1 FROM public.artist_products WHERE product_id = p_product_id) THEN
    UPDATE public.artist_products SET
      artist_type = COALESCE(p_artist->>'artist_type', artist_type),
      artist_name = COALESCE(p_artist->>'artist_name', artist_name),
      artist_bio = COALESCE(p_artist->>'artist_bio', artist_bio),
      artist_website = COALESCE(p_artist->>'artist_website', artist_website),
      artist_photo_url = CASE WHEN p_artist ? 'artist_photo_url' THEN p_artist->>'artist_photo_url' ELSE artist_photo_url END,
      artist_social_links = COALESCE(p_artist->'artist_social_links', artist_social_links),
      artwork_title = COALESCE(p_artist->>'artwork_title', artwork_title),
      artwork_year = CASE WHEN p_artist ? 'artwork_year' THEN NULLIF(p_artist->>'artwork_year', '')::INTEGER ELSE artwork_year END,
      artwork_medium = COALESCE(p_artist->>'artwork_medium', artwork_medium),
      artwork_dimensions = COALESCE(p_artist->'artwork_dimensions', artwork_dimensions),
      artwork_link_url = CASE WHEN p_artist ? 'artwork_link_url' THEN NULLIF(p_artist->>'artwork_link_url', '') ELSE artwork_link_url END,
      artwork_edition_type = COALESCE(p_artist->>'artwork_edition_type', p_artist->>'edition_type', artwork_edition_type),
      edition_number = CASE WHEN p_artist ? 'edition_number' THEN NULLIF(p_artist->>'edition_number', '')::INTEGER ELSE edition_number END,
      total_editions = CASE WHEN p_artist ? 'total_editions' THEN NULLIF(p_artist->>'total_editions', '')::INTEGER ELSE total_editions END,
      writer_specific = COALESCE(p_artist->'writer_specific', writer_specific),
      musician_specific = COALESCE(p_artist->'musician_specific', musician_specific),
      visual_artist_specific = COALESCE(p_artist->'visual_artist_specific', visual_artist_specific),
      designer_specific = COALESCE(p_artist->'designer_specific', designer_specific),
      multimedia_specific = COALESCE(p_artist->'multimedia_specific', multimedia_specific),
      requires_shipping = COALESCE((p_artist->>'requires_shipping')::BOOLEAN, requires_shipping),
      shipping_handling_time = COALESCE(NULLIF(p_artist->>'shipping_handling_time', '')::INTEGER, shipping_handling_time),
      shipping_fragile = COALESCE((p_artist->>'shipping_fragile')::BOOLEAN, shipping_fragile),
      shipping_insurance_required = COALESCE((p_artist->>'shipping_insurance_required')::BOOLEAN, shipping_insurance_required),
      shipping_insurance_amount = COALESCE((p_artist->>'shipping_insurance_amount')::NUMERIC, shipping_insurance_amount),
      certificate_of_authenticity = COALESCE((p_artist->>'certificate_of_authenticity')::BOOLEAN, certificate_of_authenticity),
      certificate_file_url = CASE WHEN p_artist ? 'certificate_file_url' THEN p_artist->>'certificate_file_url' ELSE certificate_file_url END,
      signature_authenticated = COALESCE((p_artist->>'signature_authenticated')::BOOLEAN, signature_authenticated),
      signature_location = CASE WHEN p_artist ? 'signature_location' THEN p_artist->>'signature_location' ELSE signature_location END,
      updated_at = now()
    WHERE product_id = p_product_id;
  ELSE
    INSERT INTO public.artist_products (
      product_id, store_id, artist_type, artist_name, artist_bio, artist_website,
      artist_photo_url, artist_social_links, artwork_title, artwork_year, artwork_medium,
      artwork_dimensions, artwork_link_url, artwork_edition_type, edition_number, total_editions,
      writer_specific, musician_specific, visual_artist_specific, designer_specific, multimedia_specific,
      requires_shipping, shipping_handling_time, shipping_fragile, shipping_insurance_required,
      shipping_insurance_amount, certificate_of_authenticity, certificate_file_url,
      signature_authenticated, signature_location
    ) VALUES (
      p_product_id,
      p_store_id,
      p_artist->>'artist_type',
      p_artist->>'artist_name',
      p_artist->>'artist_bio',
      p_artist->>'artist_website',
      p_artist->>'artist_photo_url',
      COALESCE(p_artist->'artist_social_links', '{}'::jsonb),
      p_artist->>'artwork_title',
      NULLIF(p_artist->>'artwork_year', '')::INTEGER,
      p_artist->>'artwork_medium',
      COALESCE(p_artist->'artwork_dimensions', '{}'::jsonb),
      NULLIF(p_artist->>'artwork_link_url', ''),
      COALESCE(p_artist->>'artwork_edition_type', p_artist->>'edition_type', 'original'),
      NULLIF(p_artist->>'edition_number', '')::INTEGER,
      NULLIF(p_artist->>'total_editions', '')::INTEGER,
      p_artist->'writer_specific',
      p_artist->'musician_specific',
      p_artist->'visual_artist_specific',
      p_artist->'designer_specific',
      p_artist->'multimedia_specific',
      COALESCE((p_artist->>'requires_shipping')::BOOLEAN, false),
      COALESCE(NULLIF(p_artist->>'shipping_handling_time', '')::INTEGER, 7),
      COALESCE((p_artist->>'shipping_fragile')::BOOLEAN, false),
      COALESCE((p_artist->>'shipping_insurance_required')::BOOLEAN, false),
      COALESCE((p_artist->>'shipping_insurance_amount')::NUMERIC, 0),
      COALESCE((p_artist->>'certificate_of_authenticity')::BOOLEAN, false),
      p_artist->>'certificate_file_url',
      COALESCE((p_artist->>'signature_authenticated')::BOOLEAN, false),
      p_artist->>'signature_location'
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'product_id', p_product_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_artist_product_tx(UUID, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_artist_product_tx(UUID, UUID, JSONB, JSONB) TO authenticated;

-- DROP first: CREATE OR REPLACE VIEW cannot insert/rename columns mid-list
DROP FUNCTION IF EXISTS public.get_marketplace_products_filtered(
  INTEGER, INTEGER, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN
);

DROP VIEW IF EXISTS public.marketplace_products_optimized;

-- Marketplace view + RPC expose country_of_origin (appended before derived cols)
CREATE VIEW public.marketplace_products_optimized AS
SELECT
  src.*,
  COALESCE(src.package_starting_price, src.effective_price) AS listing_price,
  COALESCE(
    (
      SELECT sp.category_attributes
      FROM public.service_products sp
      WHERE sp.product_id = src.id
      LIMIT 1
    ),
    '{}'::jsonb
  ) AS category_attributes,
  (
    src.sponsored_until IS NOT NULL AND src.sponsored_until > now()
  ) AS is_sponsored
FROM (
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
    p.sponsored_until,
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
    p.payment_options,
    p.whatsapp_number,
    p.whatsapp_enabled,
    sp.pricing_type,
    sp.fulfillment_mode,
    sp.duration_minutes,
    EXISTS (
      SELECT 1 FROM public.service_availability_slots sas
      WHERE sas.service_product_id = sp.id
    ) AS calendar_available,
    COALESCE(sp.requires_staff, false) AS requires_staff,
    (
      SELECT MIN(COALESCE(NULLIF(pkg.price, 0), NULLIF(pkg.package_price, 0)))
      FROM public.service_packages pkg
      WHERE pkg.service_product_id = sp.id
        AND pkg.package_kind = 'delivery_tier'
        AND COALESCE(pkg.is_active, true) = true
    ) AS package_starting_price,
    p.country_of_origin
  FROM public.products p
  JOIN public.stores s ON p.store_id = s.id
  LEFT JOIN public.store_appearance sa ON sa.store_id = s.id
  LEFT JOIN public.product_affiliate_settings pas ON p.id = pas.product_id
  LEFT JOIN public.service_products sp ON sp.product_id = p.id AND p.product_type = 'service'
  WHERE p.is_active = true
    AND (p.is_draft IS NULL OR p.is_draft = false)
    AND s.is_active = true
) src;

GRANT SELECT ON public.marketplace_products_optimized TO anon, authenticated;

CREATE FUNCTION public.get_marketplace_products_filtered(
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
  p_featured_only BOOLEAN DEFAULT false,
  p_sponsored_only BOOLEAN DEFAULT false
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
  country_of_origin TEXT,
  licensing_type TEXT,
  license_terms TEXT,
  is_featured BOOLEAN,
  is_sponsored BOOLEAN,
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
  whatsapp_number TEXT,
  whatsapp_enabled BOOLEAN,
  pricing_type TEXT,
  fulfillment_mode TEXT,
  duration_minutes INTEGER,
  calendar_available BOOLEAN,
  requires_staff BOOLEAN,
  package_starting_price DECIMAL,
  category_attributes JSONB,
  active_sponsorship_id UUID,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.expire_marketplace_sponsorships();

  RETURN QUERY
  WITH filtered AS (
    SELECT
      m.*,
      (
        SELECT s.id
        FROM public.marketplace_sponsorships s
        WHERE s.product_id = m.id
          AND s.status = 'active'
          AND s.starts_at IS NOT NULL
          AND s.ends_at IS NOT NULL
          AND now() >= s.starts_at
          AND now() < s.ends_at
        ORDER BY s.starts_at ASC
        LIMIT 1
      ) AS active_sponsorship_id,
      (
        SELECT s.starts_at
        FROM public.marketplace_sponsorships s
        WHERE s.product_id = m.id
          AND s.status = 'active'
          AND s.starts_at IS NOT NULL
          AND s.ends_at IS NOT NULL
          AND now() >= s.starts_at
          AND now() < s.ends_at
        ORDER BY s.starts_at ASC
        LIMIT 1
      ) AS sponsored_at
    FROM marketplace_products_optimized m
    WHERE
      (p_product_type IS NULL OR p_product_type = 'all' OR m.product_type = p_product_type)
      AND (
        p_category IS NULL
        OR p_category = 'all'
        OR m.category = p_category
        OR EXISTS (
          SELECT 1
          FROM public.categories child
          JOIN public.categories parent ON child.parent_id = parent.id
          WHERE parent.slug = p_category
            AND child.slug = m.category
        )
      )
      AND (p_min_price IS NULL OR m.listing_price >= p_min_price)
      AND (p_max_price IS NULL OR m.listing_price <= p_max_price)
      AND (p_min_rating IS NULL OR m.sort_rating >= p_min_rating)
      AND (
        p_search_query IS NULL
        OR TRIM(p_search_query) = ''
        OR m.name ILIKE '%' || TRIM(p_search_query) || '%'
        OR m.description ILIKE '%' || TRIM(p_search_query) || '%'
      )
      AND (NOT p_featured_only OR m.is_featured = true)
      AND (
        NOT p_sponsored_only
        OR EXISTS (
          SELECT 1
          FROM public.marketplace_sponsorships s
          WHERE s.product_id = m.id
            AND s.status = 'active'
            AND s.starts_at IS NOT NULL
            AND s.ends_at IS NOT NULL
            AND now() >= s.starts_at
            AND now() < s.ends_at
        )
      )
  ),
  ranked AS (
    SELECT
      f.*,
      (f.active_sponsorship_id IS NOT NULL) AS feed_sponsored
    FROM filtered f
  ),
  counted AS (
    SELECT COUNT(*)::bigint AS cnt FROM ranked
  )
  SELECT
    r.id,
    r.name,
    r.slug,
    r.description,
    r.short_description,
    r.price,
    r.promotional_price,
    r.currency,
    r.category,
    r.product_type,
    r.country_of_origin,
    r.licensing_type,
    r.license_terms,
    r.is_featured,
    (r.active_sponsorship_id IS NOT NULL) AS is_sponsored,
    r.rating,
    r.reviews_count,
    r.purchases_count,
    r.created_at,
    r.updated_at,
    r.image_url,
    r.tags,
    r.store_id,
    r.store_name,
    r.store_slug,
    r.store_logo_url,
    r.commission_rate,
    r.affiliate_enabled,
    r.payment_options,
    r.whatsapp_number,
    r.whatsapp_enabled,
    r.pricing_type,
    r.fulfillment_mode,
    r.duration_minutes,
    r.calendar_available,
    r.requires_staff,
    r.package_starting_price,
    r.category_attributes,
    r.active_sponsorship_id,
    c.cnt AS total_count
  FROM ranked r
  CROSS JOIN counted c
  ORDER BY
    r.feed_sponsored DESC,
    CASE WHEN r.feed_sponsored THEN r.sponsored_at END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'price' AND UPPER(p_sort_order) = 'ASC' THEN r.listing_price END ASC,
    CASE WHEN p_sort_by = 'price' AND UPPER(p_sort_order) <> 'ASC' THEN r.listing_price END DESC,
    CASE WHEN p_sort_by = 'rating' AND UPPER(p_sort_order) = 'ASC' THEN r.sort_rating END ASC,
    CASE WHEN p_sort_by = 'rating' AND UPPER(p_sort_order) <> 'ASC' THEN r.sort_rating END DESC,
    CASE WHEN p_sort_by IN ('popular', 'sales_count') AND UPPER(p_sort_order) = 'ASC' THEN r.sort_purchases END ASC,
    CASE WHEN p_sort_by IN ('popular', 'sales_count') AND UPPER(p_sort_order) <> 'ASC' THEN r.sort_purchases END DESC,
    CASE WHEN p_sort_by = 'oldest' THEN r.created_at END ASC,
    CASE WHEN p_sort_by IN ('newest', 'created_at') OR p_sort_by IS NULL THEN r.created_at END DESC,
    r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_products_filtered(
  INTEGER, INTEGER, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN
) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
