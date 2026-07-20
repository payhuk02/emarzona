-- Sprint 2: retirer custom_tracking_scripts de la projection publique (XSS / fuite).

BEGIN;

DROP FUNCTION IF EXISTS public.get_store_by_subdomain(text);

DROP VIEW IF EXISTS public.stores_public;

CREATE VIEW public.stores_public
WITH (security_invoker = true) AS
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
  custom_domain,
  domain_status,
  domain_verified_at,
  default_currency,
  info_message,
  info_message_color,
  info_message_font,
  commerce_type,
  active_clients,
  metadata
FROM public.stores
WHERE COALESCE(is_active, true) = true;

GRANT SELECT ON public.stores_public TO anon, authenticated;

COMMENT ON VIEW public.stores_public IS
  'Public storefront projection (active stores). custom_tracking_scripts excluded for security.';

CREATE OR REPLACE FUNCTION public.get_store_by_subdomain(store_subdomain TEXT)
RETURNS SETOF public.stores_public
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sp.*
  FROM public.stores_public sp
  WHERE sp.subdomain = lower(trim(store_subdomain))
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_store_by_subdomain IS
  'Active store by subdomain with full public storefront projection (theme, commerce_type, etc.)';

COMMIT;
