-- =========================================================
-- Migration : Système de Templates de Produits
-- Date : 28/02/2025
-- Description : Permet de créer et utiliser des templates pour tous les types de produits
-- =========================================================

-- Table pour stocker les templates de produits
CREATE TABLE IF NOT EXISTS public.product_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations de base
  name TEXT NOT NULL,
  description TEXT,
  product_type TEXT NOT NULL CHECK (product_type IN ('digital', 'physical', 'service', 'course', 'artist')),
  category TEXT,
  icon TEXT, -- Emoji ou nom d'icône
  preview_image TEXT,
  
  -- Données du template (JSONB pour flexibilité)
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Métadonnées
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_templates_product_type ON public.product_templates(product_type);
CREATE INDEX IF NOT EXISTS idx_product_templates_is_public ON public.product_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_product_templates_created_by ON public.product_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_product_templates_usage_count ON public.product_templates(usage_count DESC);

-- Index GIN pour recherches dans template_data
CREATE INDEX IF NOT EXISTS idx_product_templates_template_data ON public.product_templates USING GIN(template_data);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_product_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_templates_updated_at
  BEFORE UPDATE ON public.product_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_product_templates_updated_at();

-- Function pour incrémenter le compteur d'utilisation
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.product_templates
  SET usage_count = usage_count + 1
  WHERE id = template_id;
END;
$$;

-- RLS (Row Level Security)
ALTER TABLE public.product_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Tous peuvent voir les templates publics
CREATE POLICY "Public can view public templates"
  ON public.product_templates
  FOR SELECT
  USING (is_public = true);

-- Policy: Les utilisateurs peuvent voir leurs propres templates
CREATE POLICY "Users can view their own templates"
  ON public.product_templates
  FOR SELECT
  USING (created_by = auth.uid());

-- Policy: Les utilisateurs peuvent créer des templates
CREATE POLICY "Users can create templates"
  ON public.product_templates
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Policy: Les utilisateurs peuvent modifier leurs propres templates
CREATE POLICY "Users can update their own templates"
  ON public.product_templates
  FOR UPDATE
  USING (created_by = auth.uid());

-- Policy: Les utilisateurs peuvent supprimer leurs propres templates
CREATE POLICY "Users can delete their own templates"
  ON public.product_templates
  FOR DELETE
  USING (created_by = auth.uid());

-- Table pour les mises à jour de produits digitaux
CREATE TABLE IF NOT EXISTS public.digital_product_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Informations de version
  version TEXT NOT NULL,
  version_notes TEXT,
  download_url TEXT NOT NULL,
  previous_version TEXT,
  is_major_update BOOLEAN DEFAULT false,
  
  -- Statistiques
  notified_count INTEGER DEFAULT 0,
  total_customers INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_digital_product_updates_product_id ON public.digital_product_updates(product_id);
CREATE INDEX IF NOT EXISTS idx_digital_product_updates_created_at ON public.digital_product_updates(created_at DESC);

-- RLS
ALTER TABLE public.digital_product_updates ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir les mises à jour de leurs produits
CREATE POLICY "Users can view updates of their products"
  ON public.digital_product_updates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = digital_product_updates.product_id
      AND products.store_id IN (
        SELECT id FROM public.stores WHERE user_id = auth.uid()
      )
    )
  );

-- Commentaires
COMMENT ON TABLE public.product_templates IS 'Templates de produits pour faciliter la création';
COMMENT ON TABLE public.digital_product_updates IS 'Historique des mises à jour de produits digitaux';

