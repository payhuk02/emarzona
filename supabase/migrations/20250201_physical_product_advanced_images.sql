-- =====================================================
-- Migration: Images Produits Avancées (360°, Zoom, Vidéos)
-- Date: 1 Février 2025
-- Description: Ajout support images 360°, zoom interactif, vidéos produits
-- =====================================================

-- Table pour métadonnées images avancées
CREATE TABLE IF NOT EXISTS public.physical_product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  physical_product_id UUID NOT NULL REFERENCES public.physical_products(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Image standard
  image_url TEXT NOT NULL,
  image_type TEXT DEFAULT 'standard' CHECK (image_type IN ('standard', '360', 'video', 'zoom')),
  
  -- Images 360° (série d'images pour rotation)
  is_360 BOOLEAN DEFAULT FALSE,
  images_360_urls JSONB DEFAULT '[]', -- Array d'URLs pour rotation 360°
  rotation_steps INTEGER DEFAULT 36, -- Nombre d'images pour rotation complète
  
  -- Zoom interactif
  supports_zoom BOOLEAN DEFAULT FALSE,
  zoom_image_url TEXT, -- Image haute résolution pour zoom
  zoom_levels INTEGER DEFAULT 3, -- Niveaux de zoom (1-5)
  
  -- Vidéo produit
  is_video BOOLEAN DEFAULT FALSE,
  video_url TEXT,
  video_thumbnail_url TEXT,
  video_duration_seconds INTEGER,
  video_provider TEXT CHECK (video_provider IN ('youtube', 'vimeo', 'direct', 'self-hosted')),
  
  -- Variant association (optionnel)
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  
  -- Ordre d'affichage
  display_order INTEGER DEFAULT 0,
  
  -- Métadonnées
  alt_text TEXT,
  caption TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_physical_product_images_product_id ON public.physical_product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_physical_product_images_physical_product_id ON public.physical_product_images(physical_product_id);
CREATE INDEX IF NOT EXISTS idx_physical_product_images_variant_id ON public.physical_product_images(variant_id);
CREATE INDEX IF NOT EXISTS idx_physical_product_images_type ON public.physical_product_images(image_type);
CREATE INDEX IF NOT EXISTS idx_physical_product_images_360 ON public.physical_product_images(is_360) WHERE is_360 = TRUE;
CREATE INDEX IF NOT EXISTS idx_physical_product_images_zoom ON public.physical_product_images(supports_zoom) WHERE supports_zoom = TRUE;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_physical_product_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_physical_product_images_updated_at
  BEFORE UPDATE ON public.physical_product_images
  FOR EACH ROW
  EXECUTE FUNCTION update_physical_product_images_updated_at();

-- RLS Policies
ALTER TABLE public.physical_product_images ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture publique des images
CREATE POLICY "physical_product_images_select_public"
  ON public.physical_product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = physical_product_images.product_id
      AND p.is_active = TRUE
      AND p.is_draft = FALSE
    )
  );

-- Policy: Propriétaires peuvent gérer leurs images
CREATE POLICY "physical_product_images_manage_owners"
  ON public.physical_product_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = physical_product_images.product_id
      AND s.user_id = auth.uid()
    )
  );

-- Policy: Admins peuvent tout gérer
CREATE POLICY "physical_product_images_manage_admins"
  ON public.physical_product_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- Fonction pour obtenir images avec métadonnées avancées
CREATE OR REPLACE FUNCTION get_physical_product_images_with_metadata(
  p_product_id UUID
)
RETURNS TABLE (
  id UUID,
  image_url TEXT,
  image_type TEXT,
  is_360 BOOLEAN,
  images_360_urls JSONB,
  supports_zoom BOOLEAN,
  zoom_image_url TEXT,
  is_video BOOLEAN,
  video_url TEXT,
  video_thumbnail_url TEXT,
  variant_id UUID,
  display_order INTEGER,
  alt_text TEXT,
  caption TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pi.id,
    pi.image_url,
    pi.image_type,
    pi.is_360,
    pi.images_360_urls,
    pi.supports_zoom,
    pi.zoom_image_url,
    pi.is_video,
    pi.video_url,
    pi.video_thumbnail_url,
    pi.variant_id,
    pi.display_order,
    pi.alt_text,
    pi.caption
  FROM public.physical_product_images pi
  WHERE pi.product_id = p_product_id
  ORDER BY pi.display_order ASC, pi.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON TABLE public.physical_product_images IS 'Métadonnées images avancées pour produits physiques (360°, zoom, vidéos)';
COMMENT ON COLUMN public.physical_product_images.images_360_urls IS 'Array JSON d''URLs d''images pour rotation 360°';
COMMENT ON COLUMN public.physical_product_images.zoom_image_url IS 'Image haute résolution pour zoom interactif';
COMMENT ON COLUMN public.physical_product_images.rotation_steps IS 'Nombre d''images pour rotation 360° complète (recommandé: 36 ou 72)';

