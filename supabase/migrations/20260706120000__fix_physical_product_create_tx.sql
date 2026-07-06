-- Align create_physical_product_tx with physical_products schema
-- (length/width/height/dimensions_unit — not a JSONB "dimensions" column)

CREATE OR REPLACE FUNCTION public.create_physical_product_tx(
  p_store_id UUID,
  p_product JSONB,
  p_physical JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id UUID;
  v_physical_id UUID;
  v_dims JSONB;
BEGIN
  IF NOT public.user_owns_store(p_store_id) THEN
    RAISE EXCEPTION 'Accès refusé à cette boutique';
  END IF;

  v_dims := COALESCE(p_physical->'dimensions', '{}'::jsonb);

  INSERT INTO public.products (
    store_id, name, slug, description, short_description, price, currency,
    promotional_price, product_type, category_id, image_url, images,
    meta_title, meta_description, og_image, faqs, payment_options,
    is_draft, is_active
  ) VALUES (
    p_store_id,
    p_product->>'name',
    p_product->>'slug',
    COALESCE(p_product->>'description', ''),
    p_product->>'short_description',
    COALESCE((p_product->>'price')::NUMERIC, 0),
    COALESCE(p_product->>'currency', 'XOF'),
    NULLIF(p_product->>'promotional_price', '')::NUMERIC,
    'physical',
    NULLIF(p_product->>'category_id', '')::UUID,
    p_product->>'image_url',
    COALESCE(p_product->'images', '[]'::jsonb),
    p_product->>'meta_title',
    p_product->>'meta_description',
    p_product->>'og_image',
    COALESCE(p_product->'faqs', '[]'::jsonb),
    COALESCE(p_product->'payment_options', '{}'::jsonb),
    COALESCE((p_product->>'is_draft')::BOOLEAN, false),
    COALESCE((p_product->>'is_active')::BOOLEAN, true)
  )
  RETURNING id INTO v_product_id;

  INSERT INTO public.physical_products (
    product_id,
    sku,
    barcode,
    weight,
    weight_unit,
    length,
    width,
    height,
    dimensions_unit,
    track_inventory,
    low_stock_threshold,
    requires_shipping,
    free_shipping,
    inventory_policy,
    continue_selling_when_out_of_stock,
    country_of_origin
  ) VALUES (
    v_product_id,
    NULLIF(p_physical->>'sku', ''),
    NULLIF(p_physical->>'barcode', ''),
    NULLIF(COALESCE(p_physical->>'weight', ''), '')::NUMERIC,
    COALESCE(p_physical->>'weight_unit', 'kg'),
    NULLIF(COALESCE(p_physical->>'length', v_dims->>'length', ''), '')::NUMERIC,
    NULLIF(COALESCE(p_physical->>'width', v_dims->>'width', ''), '')::NUMERIC,
    NULLIF(COALESCE(p_physical->>'height', v_dims->>'height', ''), '')::NUMERIC,
    COALESCE(
      NULLIF(p_physical->>'dimensions_unit', ''),
      NULLIF(v_dims->>'unit', ''),
      'cm'
    ),
    COALESCE((p_physical->>'track_inventory')::BOOLEAN, true),
    COALESCE((p_physical->>'low_stock_threshold')::INTEGER, 5),
    COALESCE((p_physical->>'requires_shipping')::BOOLEAN, true),
    COALESCE((p_physical->>'free_shipping')::BOOLEAN, false),
    COALESCE(NULLIF(p_physical->>'inventory_policy', ''), 'deny'),
    COALESCE((p_physical->>'continue_selling_when_out_of_stock')::BOOLEAN, false),
    NULLIF(p_physical->>'country_of_origin', '')
  )
  RETURNING id INTO v_physical_id;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', v_product_id,
    'physical_product_id', v_physical_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_physical_product_tx(UUID, JSONB, JSONB) TO authenticated;
