
-- Fix security definer views by recreating with security_invoker=on
DROP VIEW IF EXISTS public.stores_public;
DROP VIEW IF EXISTS public.reviews_public;

CREATE VIEW public.stores_public
WITH (security_invoker=on) AS
  SELECT 
    id, name, slug, description, logo_url, banner_url, is_active,
    created_at, updated_at, about,
    contact_email, contact_phone, support_email, sales_email, press_email, partnership_email,
    support_phone, sales_phone, whatsapp_number, telegram_username,
    facebook_url, instagram_url, twitter_url, linkedin_url, youtube_url,
    tiktok_url, pinterest_url, snapchat_url, discord_url, twitch_url,
    primary_color, secondary_color, accent_color, background_color,
    text_color, text_secondary_color, button_primary_color, button_primary_text,
    button_secondary_color, button_secondary_text, link_color, link_hover_color,
    border_radius, shadow_intensity, theme_color,
    heading_font, body_font, font_size_base, heading_size_h1, heading_size_h2,
    heading_size_h3, line_height, letter_spacing,
    header_style, footer_style, sidebar_enabled, sidebar_position,
    product_grid_columns, product_card_style, navigation_style,
    favicon_url, apple_touch_icon_url, watermark_url, placeholder_image_url,
    address_line1, address_line2, city, state_province, postal_code, country,
    latitude, longitude, timezone, opening_hours,
    legal_pages, marketing_content,
    meta_title, meta_description, meta_keywords, og_image, seo_score,
    google_analytics_id, google_analytics_enabled,
    facebook_pixel_id, facebook_pixel_enabled,
    google_tag_manager_id, google_tag_manager_enabled,
    tiktok_pixel_id, tiktok_pixel_enabled,
    custom_tracking_scripts, custom_scripts_enabled,
    custom_domain, domain_status, domain_verified_at,
    default_currency, info_message, info_message_color, info_message_font
  FROM public.stores;

CREATE VIEW public.reviews_public
WITH (security_invoker=on) AS
  SELECT 
    id, product_id, order_id, rating, title, content, product_type,
    quality_rating, value_rating, service_rating, delivery_rating,
    course_content_rating, instructor_rating,
    verified_purchase, is_featured, is_approved, is_flagged,
    helpful_count, not_helpful_count, reply_count,
    reviewer_name, reviewer_avatar,
    created_at, updated_at
  FROM public.reviews;

GRANT SELECT ON public.stores_public TO anon, authenticated;
GRANT SELECT ON public.reviews_public TO anon, authenticated;
