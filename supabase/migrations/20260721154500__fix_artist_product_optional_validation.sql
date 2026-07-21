-- Preserve NULL for optional artist fields before server-side validation.
-- The previous RPCs converted a missing year to 0 and a missing artwork URL
-- to an empty string, making otherwise valid physical artworks impossible to
-- create or update.

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
    product_type, category_id, image_url, images, tags,
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
    NULLIF(p_product->>'category_id', '')::UUID,
    p_product->>'image_url',
    COALESCE(p_product->'images', '[]'::jsonb),
    COALESCE(p_product->'tags', '[]'::jsonb),
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
    category_id = CASE
      WHEN p_product ? 'category_id' THEN NULLIF(p_product->>'category_id', '')::UUID
      ELSE category_id
    END,
    image_url = COALESCE(p_product->>'image_url', image_url),
    images = COALESCE(p_product->'images', images),
    tags = COALESCE(p_product->'tags', tags),
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

NOTIFY pgrst, 'reload schema';
