-- Migration: Fonctionnalités avancées de personnalisation de boutique - Phase 1
-- Date: 2025-01-28
-- Description: Ajout des champs pour thème, SEO, localisation, horaires et pages légales

-- ============================================================
-- 1. THÈME ET COULEURS
-- ============================================================
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS primary_color TEXT,
ADD COLUMN IF NOT EXISTS secondary_color TEXT,
ADD COLUMN IF NOT EXISTS accent_color TEXT,
ADD COLUMN IF NOT EXISTS background_color TEXT,
ADD COLUMN IF NOT EXISTS text_color TEXT,
ADD COLUMN IF NOT EXISTS text_secondary_color TEXT,
ADD COLUMN IF NOT EXISTS button_primary_color TEXT,
ADD COLUMN IF NOT EXISTS button_primary_text TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS button_secondary_color TEXT,
ADD COLUMN IF NOT EXISTS button_secondary_text TEXT,
ADD COLUMN IF NOT EXISTS link_color TEXT,
ADD COLUMN IF NOT EXISTS link_hover_color TEXT,
ADD COLUMN IF NOT EXISTS border_radius TEXT DEFAULT 'md' CHECK (border_radius IN ('none', 'sm', 'md', 'lg', 'xl', 'full')),
ADD COLUMN IF NOT EXISTS shadow_intensity TEXT DEFAULT 'md' CHECK (shadow_intensity IN ('none', 'sm', 'md', 'lg', 'xl'));

-- ============================================================
-- 2. TYPOGRAPHIE
-- ============================================================
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS heading_font TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS body_font TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS font_size_base TEXT DEFAULT '16px',
ADD COLUMN IF NOT EXISTS heading_size_h1 TEXT DEFAULT '2.5rem',
ADD COLUMN IF NOT EXISTS heading_size_h2 TEXT DEFAULT '2rem',
ADD COLUMN IF NOT EXISTS heading_size_h3 TEXT DEFAULT '1.5rem',
ADD COLUMN IF NOT EXISTS line_height TEXT DEFAULT '1.6',
ADD COLUMN IF NOT EXISTS letter_spacing TEXT DEFAULT 'normal';

-- ============================================================
-- 3. LAYOUT ET STRUCTURE
-- ============================================================
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS header_style TEXT DEFAULT 'standard' CHECK (header_style IN ('minimal', 'standard', 'extended')),
ADD COLUMN IF NOT EXISTS footer_style TEXT DEFAULT 'standard' CHECK (footer_style IN ('minimal', 'standard', 'extended')),
ADD COLUMN IF NOT EXISTS sidebar_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sidebar_position TEXT DEFAULT 'left' CHECK (sidebar_position IN ('left', 'right')),
ADD COLUMN IF NOT EXISTS product_grid_columns INTEGER DEFAULT 3 CHECK (product_grid_columns >= 2 AND product_grid_columns <= 6),
ADD COLUMN IF NOT EXISTS product_card_style TEXT DEFAULT 'standard' CHECK (product_card_style IN ('minimal', 'standard', 'detailed')),
ADD COLUMN IF NOT EXISTS navigation_style TEXT DEFAULT 'horizontal' CHECK (navigation_style IN ('horizontal', 'vertical', 'mega'));

-- ============================================================
-- 4. IMAGES ET MÉDIAS SUPPLÉMENTAIRES
-- ============================================================
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS favicon_url TEXT,
ADD COLUMN IF NOT EXISTS apple_touch_icon_url TEXT,
ADD COLUMN IF NOT EXISTS watermark_url TEXT,
ADD COLUMN IF NOT EXISTS placeholder_image_url TEXT;

-- ============================================================
-- 5. ADRESSE COMPLÈTE ET LOCALISATION
-- ============================================================
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS address_line1 TEXT,
ADD COLUMN IF NOT EXISTS address_line2 TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state_province TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Africa/Ouagadougou';

-- ============================================================
-- 6. HORAIRES D'OUVERTURE (JSONB pour flexibilité)
-- ============================================================
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{
  "monday": {"open": "09:00", "close": "18:00", "closed": false},
  "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
  "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
  "thursday": {"open": "09:00", "close": "18:00", "closed": false},
  "friday": {"open": "09:00", "close": "18:00", "closed": false},
  "saturday": {"open": "09:00", "close": "18:00", "closed": false},
  "sunday": {"open": "09:00", "close": "18:00", "closed": false},
  "timezone": "Africa/Ouagadougou",
  "special_hours": []
}'::jsonb;

-- ============================================================
-- 7. CONTACTS SUPPLÉMENTAIRES
-- ============================================================
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS support_email TEXT,
ADD COLUMN IF NOT EXISTS sales_email TEXT,
ADD COLUMN IF NOT EXISTS press_email TEXT,
ADD COLUMN IF NOT EXISTS partnership_email TEXT,
ADD COLUMN IF NOT EXISTS support_phone TEXT,
ADD COLUMN IF NOT EXISTS sales_phone TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS telegram_username TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
ADD COLUMN IF NOT EXISTS pinterest_url TEXT,
ADD COLUMN IF NOT EXISTS snapchat_url TEXT,
ADD COLUMN IF NOT EXISTS discord_url TEXT,
ADD COLUMN IF NOT EXISTS twitch_url TEXT;

-- ============================================================
-- 8. PAGES LÉGALES (JSONB pour flexibilité)
-- ============================================================
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS legal_pages JSONB DEFAULT '{
  "terms_of_service": "",
  "privacy_policy": "",
  "return_policy": "",
  "shipping_policy": "",
  "refund_policy": "",
  "cookie_policy": "",
  "disclaimer": "",
  "faq_content": ""
}'::jsonb;

-- ============================================================
-- 9. CONTENU MARKETING (JSONB pour flexibilité)
-- ============================================================
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS marketing_content JSONB DEFAULT '{
  "welcome_message": "",
  "mission_statement": "",
  "vision_statement": "",
  "values": [],
  "story": "",
  "team_section": [],
  "testimonials": [],
  "certifications": []
}'::jsonb;

-- ============================================================
-- 10. INDEXES POUR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_stores_country ON public.stores(country) WHERE country IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stores_city ON public.stores(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stores_timezone ON public.stores(timezone) WHERE timezone IS NOT NULL;

-- ============================================================
-- 11. COMMENTAIRES POUR DOCUMENTATION
-- ============================================================
COMMENT ON COLUMN public.stores.primary_color IS 'Couleur principale de la boutique (hex)';
COMMENT ON COLUMN public.stores.secondary_color IS 'Couleur secondaire de la boutique (hex)';
COMMENT ON COLUMN public.stores.opening_hours IS 'Horaires d''ouverture au format JSONB';
COMMENT ON COLUMN public.stores.legal_pages IS 'Pages légales au format JSONB';
COMMENT ON COLUMN public.stores.marketing_content IS 'Contenu marketing au format JSONB';

