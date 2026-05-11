
-- ============================================================
-- Phase 2: Sécurisation des données sensibles
-- ============================================================

-- 1. Créer une vue publique pour les stores (exclut les champs sensibles)
CREATE OR REPLACE VIEW public.stores_public AS
  SELECT 
    id, name, slug, description, logo_url, banner_url, is_active,
    created_at, updated_at, about,
    -- Contact (intentionnellement public pour les vitrines)
    contact_email, contact_phone, support_email, sales_email, press_email, partnership_email,
    support_phone, sales_phone, whatsapp_number, telegram_username,
    -- Social
    facebook_url, instagram_url, twitter_url, linkedin_url, youtube_url,
    tiktok_url, pinterest_url, snapchat_url, discord_url, twitch_url,
    -- Theme & Design
    primary_color, secondary_color, accent_color, background_color,
    text_color, text_secondary_color, button_primary_color, button_primary_text,
    button_secondary_color, button_secondary_text, link_color, link_hover_color,
    border_radius, shadow_intensity, theme_color,
    -- Typography
    heading_font, body_font, font_size_base, heading_size_h1, heading_size_h2,
    heading_size_h3, line_height, letter_spacing,
    -- Layout
    header_style, footer_style, sidebar_enabled, sidebar_position,
    product_grid_columns, product_card_style, navigation_style,
    -- Images
    favicon_url, apple_touch_icon_url, watermark_url, placeholder_image_url,
    -- Location
    address_line1, address_line2, city, state_province, postal_code, country,
    latitude, longitude, timezone, opening_hours,
    -- Legal & Marketing
    legal_pages, marketing_content,
    -- SEO
    meta_title, meta_description, meta_keywords, og_image, seo_score,
    -- Analytics (public - injected in storefront HTML)
    google_analytics_id, google_analytics_enabled,
    facebook_pixel_id, facebook_pixel_enabled,
    google_tag_manager_id, google_tag_manager_enabled,
    tiktok_pixel_id, tiktok_pixel_enabled,
    custom_tracking_scripts, custom_scripts_enabled,
    -- Domain (public info only)
    custom_domain, domain_status, domain_verified_at,
    -- Misc
    default_currency, info_message, info_message_color, info_message_font
  FROM public.stores;
  -- EXCLUT: user_id, domain_verification_token, dns_records, domain_error_message,
  --         ssl_enabled, redirect_www, redirect_https

-- 2. Accorder les permissions sur la vue
GRANT SELECT ON public.stores_public TO anon, authenticated;

-- 3. Supprimer l'ancienne politique SELECT trop permissive
DROP POLICY IF EXISTS "Stores are viewable by everyone" ON public.stores;

-- 4. Ajouter une politique SELECT réservée aux propriétaires
DROP POLICY IF EXISTS "Store owners can view own stores" ON public.stores;
CREATE POLICY "Store owners can view own stores"
  ON public.stores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Créer une vue publique pour les reviews (exclut user_id)
CREATE OR REPLACE VIEW public.reviews_public AS
  SELECT 
    id, product_id, order_id, rating, title, content, product_type,
    quality_rating, value_rating, service_rating, delivery_rating,
    course_content_rating, instructor_rating,
    verified_purchase, is_featured, is_approved, is_flagged,
    helpful_count, not_helpful_count, reply_count,
    reviewer_name, reviewer_avatar,
    created_at, updated_at
  FROM public.reviews;
  -- EXCLUT: user_id

-- 6. Accorder les permissions sur la vue reviews
GRANT SELECT ON public.reviews_public TO anon, authenticated;
