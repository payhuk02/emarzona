-- Priority 3–4 audit fixes:
-- 1) Team members with products.manage can create/update products via RPCs
-- 2) Allow Ubuntu / Nunito in sanitize_appearance_draft (UI already offers them)

CREATE OR REPLACE FUNCTION public.user_can_manage_store_products(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_store_permission(p_store_id, auth.uid(), 'products.manage');
$$;

REVOKE ALL ON FUNCTION public.user_can_manage_store_products(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_manage_store_products(uuid) TO authenticated;

COMMENT ON FUNCTION public.user_can_manage_store_products(uuid) IS
  'Owner or active store member with products.manage (product create/update RPCs)';

-- Patch product commerce RPCs: replace owner-only gate with products.manage
DO $$
DECLARE
  r RECORD;
  src TEXT;
  new_src TEXT;
BEGIN
  FOR r IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'create_physical_product_tx',
        'update_physical_product_tx',
        'create_digital_product_tx',
        'update_digital_product_tx',
        'create_service_product_tx',
        'update_service_product_tx',
        'create_artist_product_tx',
        'update_artist_product_tx',
        'update_full_course_tx',
        'create_full_course'
      )
  LOOP
    src := pg_get_functiondef(r.oid);
    new_src := replace(
      src,
      'IF NOT public.user_owns_store(p_store_id) THEN',
      'IF NOT public.user_can_manage_store_products(p_store_id) THEN'
    );
    new_src := replace(
      new_src,
      'IF NOT user_owns_store(p_store_id) THEN',
      'IF NOT public.user_can_manage_store_products(p_store_id) THEN'
    );
    IF new_src IS DISTINCT FROM src THEN
      EXECUTE new_src;
    END IF;
  END LOOP;
END $$;

-- Font allowlist: add Ubuntu / Nunito (already in StoreThemeSettings + templates)
CREATE OR REPLACE FUNCTION public.sanitize_appearance_draft(p_draft JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_result JSONB := '{}'::jsonb;
  v_key TEXT;
  v_int INTEGER;
  v_bool BOOLEAN;

  allowed_fonts TEXT[] := ARRAY[
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
    'Playfair Display', 'Merriweather', 'Source Sans Pro', 'Raleway',
    'Ubuntu', 'Nunito'
  ];
BEGIN
  IF p_draft IS NULL OR jsonb_typeof(p_draft) <> 'object' THEN
    RETURN NULL;
  END IF;

  FOREACH v_key IN ARRAY ARRAY[
    'logo_url', 'banner_url', 'favicon_url', 'apple_touch_icon_url',
    'watermark_url', 'placeholder_image_url'
  ] LOOP
    IF p_draft ? v_key
       AND length(COALESCE(p_draft->>v_key, '')) BETWEEN 1 AND 2048
       AND COALESCE(p_draft->>v_key, '') !~* '<script' THEN
      v_result := v_result || jsonb_build_object(v_key, p_draft->>v_key);
    END IF;
  END LOOP;

  FOREACH v_key IN ARRAY ARRAY[
    'primary_color', 'secondary_color', 'accent_color', 'background_color',
    'text_color', 'text_secondary_color', 'button_primary_color', 'button_primary_text',
    'button_secondary_color', 'button_secondary_text', 'link_color', 'link_hover_color'
  ] LOOP
    IF p_draft ? v_key AND (p_draft->>v_key) ~* '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' THEN
      v_result := v_result || jsonb_build_object(v_key, p_draft->>v_key);
    END IF;
  END LOOP;

  IF p_draft ? 'border_radius'
     AND (p_draft->>'border_radius') = ANY(ARRAY['none', 'sm', 'md', 'lg', 'xl', 'full']) THEN
    v_result := v_result || jsonb_build_object('border_radius', p_draft->>'border_radius');
  END IF;

  IF p_draft ? 'shadow_intensity'
     AND (p_draft->>'shadow_intensity') = ANY(ARRAY['none', 'sm', 'md', 'lg', 'xl']) THEN
    v_result := v_result || jsonb_build_object('shadow_intensity', p_draft->>'shadow_intensity');
  END IF;

  IF p_draft ? 'header_style'
     AND (p_draft->>'header_style') = ANY(ARRAY['minimal', 'standard', 'extended']) THEN
    v_result := v_result || jsonb_build_object('header_style', p_draft->>'header_style');
  END IF;

  IF p_draft ? 'footer_style'
     AND (p_draft->>'footer_style') = ANY(ARRAY['minimal', 'standard', 'extended']) THEN
    v_result := v_result || jsonb_build_object('footer_style', p_draft->>'footer_style');
  END IF;

  IF p_draft ? 'product_card_style'
     AND (p_draft->>'product_card_style') = ANY(ARRAY['minimal', 'standard', 'detailed']) THEN
    v_result := v_result || jsonb_build_object('product_card_style', p_draft->>'product_card_style');
  END IF;

  IF p_draft ? 'navigation_style'
     AND (p_draft->>'navigation_style') = ANY(ARRAY['horizontal', 'vertical', 'mega']) THEN
    v_result := v_result || jsonb_build_object('navigation_style', p_draft->>'navigation_style');
  END IF;

  IF p_draft ? 'sidebar_position'
     AND (p_draft->>'sidebar_position') = ANY(ARRAY['left', 'right']) THEN
    v_result := v_result || jsonb_build_object('sidebar_position', p_draft->>'sidebar_position');
  END IF;

  IF p_draft ? 'heading_font' AND (p_draft->>'heading_font') = ANY(allowed_fonts) THEN
    v_result := v_result || jsonb_build_object('heading_font', p_draft->>'heading_font');
  END IF;

  IF p_draft ? 'body_font' AND (p_draft->>'body_font') = ANY(allowed_fonts) THEN
    v_result := v_result || jsonb_build_object('body_font', p_draft->>'body_font');
  END IF;

  FOREACH v_key IN ARRAY ARRAY[
    'font_size_base', 'heading_size_h1', 'heading_size_h2', 'heading_size_h3',
    'line_height', 'letter_spacing'
  ] LOOP
    IF p_draft ? v_key AND (p_draft->>v_key) ~ '^([0-9.]+(px|rem|em|%)|normal)$' THEN
      v_result := v_result || jsonb_build_object(v_key, p_draft->>v_key);
    END IF;
  END LOOP;

  IF p_draft ? 'sidebar_enabled' THEN
    BEGIN
      v_bool := (p_draft->>'sidebar_enabled')::boolean;
      v_result := v_result || jsonb_build_object('sidebar_enabled', v_bool);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  IF p_draft ? 'product_grid_columns' THEN
    BEGIN
      v_int := (p_draft->>'product_grid_columns')::INTEGER;
      IF v_int BETWEEN 1 AND 6 THEN
        v_result := v_result || jsonb_build_object('product_grid_columns', v_int);
      END IF;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  IF v_result = '{}'::jsonb THEN
    RETURN NULL;
  END IF;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sanitize_appearance_draft(JSONB) TO authenticated;

NOTIFY pgrst, 'reload schema';
