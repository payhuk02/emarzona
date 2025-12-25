-- Migration: Analytics et Tracking pour les boutiques - Phase 2
-- Date: 2025-02-02
-- Description: Ajout des champs pour Google Analytics, Facebook Pixel et scripts personnalisés

-- ============================================================
-- ANALYTICS ET TRACKING
-- ============================================================
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS google_analytics_id TEXT,
ADD COLUMN IF NOT EXISTS google_analytics_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT,
ADD COLUMN IF NOT EXISTS facebook_pixel_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_tag_manager_id TEXT,
ADD COLUMN IF NOT EXISTS google_tag_manager_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tiktok_pixel_id TEXT,
ADD COLUMN IF NOT EXISTS tiktok_pixel_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_tracking_scripts TEXT, -- Scripts personnalisés (code HTML/JS)
ADD COLUMN IF NOT EXISTS custom_scripts_enabled BOOLEAN DEFAULT false;

-- Commentaires pour documentation
COMMENT ON COLUMN public.stores.google_analytics_id IS 'Google Analytics Tracking ID (G-XXXXXXXXXX ou UA-XXXXXXXXX-X)';
COMMENT ON COLUMN public.stores.google_analytics_enabled IS 'Active ou désactive le tracking Google Analytics';
COMMENT ON COLUMN public.stores.facebook_pixel_id IS 'Facebook Pixel ID';
COMMENT ON COLUMN public.stores.facebook_pixel_enabled IS 'Active ou désactive le tracking Facebook Pixel';
COMMENT ON COLUMN public.stores.google_tag_manager_id IS 'Google Tag Manager Container ID (GTM-XXXXXXX)';
COMMENT ON COLUMN public.stores.google_tag_manager_enabled IS 'Active ou désactive Google Tag Manager';
COMMENT ON COLUMN public.stores.tiktok_pixel_id IS 'TikTok Pixel ID';
COMMENT ON COLUMN public.stores.tiktok_pixel_enabled IS 'Active ou désactive le tracking TikTok Pixel';
COMMENT ON COLUMN public.stores.custom_tracking_scripts IS 'Scripts de tracking personnalisés (HTML/JavaScript)';
COMMENT ON COLUMN public.stores.custom_scripts_enabled IS 'Active ou désactive les scripts personnalisés';

