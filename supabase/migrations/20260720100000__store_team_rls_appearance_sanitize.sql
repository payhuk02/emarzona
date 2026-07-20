-- Sprint 1.5: RLS team UPDATE, publish permission, sanitize appearance draft RPC.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. settings.manage pour managers + appearance.publish alias
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_store_permission(_store_id UUID, _user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role TEXT;
  _permissions JSONB;
  _has_permission BOOLEAN := false;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = _store_id AND user_id = _user_id
  ) THEN
    RETURN true;
  END IF;

  SELECT role, permissions INTO _role, _permissions
  FROM public.store_members
  WHERE store_id = _store_id
    AND user_id = _user_id
    AND status = 'active'
  LIMIT 1;

  IF _role IS NULL THEN
    RETURN false;
  END IF;

  IF _permissions ? _permission THEN
    _has_permission := (_permissions->>_permission)::boolean;
    IF _has_permission THEN
      RETURN true;
    END IF;
  END IF;

  CASE _role
    WHEN 'owner' THEN RETURN true;
    WHEN 'manager' THEN
      RETURN _permission IN (
        'products.manage', 'products.view', 'orders.manage', 'orders.view',
        'customers.manage', 'customers.view', 'analytics.view', 'team.manage',
        'tasks.assign', 'tasks.manage', 'settings.manage', 'appearance.publish'
      );
    WHEN 'staff' THEN
      RETURN _permission IN (
        'products.manage', 'products.view', 'orders.manage', 'orders.view',
        'customers.manage', 'customers.view', 'tasks.assign', 'tasks.manage'
      );
    WHEN 'support' THEN
      RETURN _permission IN (
        'products.view', 'orders.manage', 'orders.view',
        'customers.manage', 'customers.view'
      );
    WHEN 'viewer' THEN
      RETURN _permission IN (
        'products.view', 'orders.view', 'customers.view', 'analytics.view'
      );
    ELSE RETURN false;
  END CASE;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Team members with settings.manage can UPDATE stores
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "stores_team_update_policy" ON public.stores;

CREATE POLICY "stores_team_update_policy"
  ON public.stores
  FOR UPDATE
  TO authenticated
  USING (public.has_store_permission(id, auth.uid(), 'settings.manage'))
  WITH CHECK (public.has_store_permission(id, auth.uid(), 'settings.manage'));

-- ---------------------------------------------------------------------------
-- 3. Sanitize appearance draft JSONB (server-side)
-- ---------------------------------------------------------------------------
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
    'Playfair Display', 'Merriweather', 'Source Sans Pro', 'Raleway'
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
      v_int := (p_draft->>'product_grid_columns')::integer;
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

-- ---------------------------------------------------------------------------
-- 4. RPC save appearance draft (sanitized)
-- ---------------------------------------------------------------------------
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

GRANT EXECUTE ON FUNCTION public.save_store_appearance_draft(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sanitize_appearance_draft(JSONB) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. publish_store_appearance — team avec settings.manage + sanitize
-- ---------------------------------------------------------------------------
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

COMMIT;
