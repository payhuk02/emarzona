-- Admin panel security hardening
-- - Remove overly permissive stores SELECT policy (USING true)
-- - Public storefront reads via stores_public (active stores only)
-- - Restrict admin_config SELECT to admins
-- - RLS on platform_roles (admin read/write)

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) stores: remove public read-all policy
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view stores by slug" ON public.stores;
DROP POLICY IF EXISTS "Public can view stores by slug" ON public.stores;

-- ---------------------------------------------------------------------------
-- 2) stores_public: active stores only, invoker bypasses broad stores RLS
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.stores_public;

CREATE VIEW public.stores_public
WITH (security_invoker = false) AS
  SELECT
    id,
    name,
    slug,
    subdomain,
    description,
    logo_url,
    banner_url,
    is_active,
    created_at,
    updated_at,
    about,
    contact_email,
    contact_phone,
    support_email,
    sales_email,
    press_email,
    partnership_email,
    support_phone,
    sales_phone,
    whatsapp_number,
    telegram_username,
    facebook_url,
    instagram_url,
    twitter_url,
    linkedin_url,
    youtube_url,
    tiktok_url,
    pinterest_url,
    snapchat_url,
    discord_url,
    twitch_url,
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
    favicon_url,
    apple_touch_icon_url,
    watermark_url,
    placeholder_image_url,
    address_line1,
    address_line2,
    city,
    state_province,
    postal_code,
    country,
    latitude,
    longitude,
    timezone,
    opening_hours,
    legal_pages,
    marketing_content,
    google_analytics_id,
    google_analytics_enabled,
    facebook_pixel_id,
    facebook_pixel_enabled,
    google_tag_manager_id,
    google_tag_manager_enabled,
    tiktok_pixel_id,
    tiktok_pixel_enabled,
    custom_tracking_scripts,
    custom_scripts_enabled,
    custom_domain,
    domain_status,
    domain_verified_at,
    default_currency,
    info_message,
    info_message_color,
    info_message_font
  FROM public.stores
  WHERE COALESCE(is_active, true) = true;

GRANT SELECT ON public.stores_public TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3) admin_config: restrict SELECT (remove authenticated read-all)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow select to authenticated" ON public.admin_config;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_config'
      AND policyname = 'Admins can read admin_config'
  ) THEN
    CREATE POLICY "Admins can read admin_config"
      ON public.admin_config
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR COALESCE(p.is_super_admin, false) = true)
        )
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4) platform_roles: admin-only management
-- ---------------------------------------------------------------------------
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read platform_roles" ON public.platform_roles;
CREATE POLICY "Admins can read platform_roles"
  ON public.platform_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'admin' OR COALESCE(p.is_super_admin, false) = true)
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "Admins can update platform_roles" ON public.platform_roles;
CREATE POLICY "Admins can update platform_roles"
  ON public.platform_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'admin' OR COALESCE(p.is_super_admin, false) = true)
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'admin' OR COALESCE(p.is_super_admin, false) = true)
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

COMMIT;
