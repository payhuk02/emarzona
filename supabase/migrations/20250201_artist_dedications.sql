-- =====================================================
-- Migration: Système de Dédicaces Artistes
-- Date: 1 Février 2025
-- Description: Dédicaces personnalisées pour œuvres d'artistes
-- =====================================================

-- Table pour dédicaces
CREATE TABLE IF NOT EXISTS public.artist_product_dedications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_product_id UUID NOT NULL REFERENCES public.artist_products(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- Dédicace
  dedication_text TEXT NOT NULL, -- Texte de la dédicace
  recipient_name TEXT, -- Nom du destinataire (optionnel)
  
  -- Personnalisation
  font_style TEXT DEFAULT 'standard' CHECK (font_style IN ('standard', 'elegant', 'casual', 'formal')),
  text_position TEXT DEFAULT 'center' CHECK (text_position IN ('top', 'center', 'bottom')),
  
  -- Statut
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  
  -- Métadonnées
  notes TEXT, -- Notes additionnelles pour l'artiste
  preview_image_url TEXT, -- Image preview de la dédicace
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour templates de dédicaces
CREATE TABLE IF NOT EXISTS public.artist_dedication_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_product_id UUID NOT NULL REFERENCES public.artist_products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Template
  name TEXT NOT NULL,
  template_text TEXT NOT NULL, -- Template avec placeholders (ex: "Pour {recipient_name}, avec mes meilleurs vœux")
  font_style TEXT DEFAULT 'standard',
  text_position TEXT DEFAULT 'center',
  
  -- Statut
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dedications_artist_product_id ON public.artist_product_dedications(artist_product_id);
CREATE INDEX IF NOT EXISTS idx_dedications_product_id ON public.artist_product_dedications(product_id);
CREATE INDEX IF NOT EXISTS idx_dedications_order_id ON public.artist_product_dedications(order_id);
CREATE INDEX IF NOT EXISTS idx_dedications_status ON public.artist_product_dedications(status);

CREATE INDEX IF NOT EXISTS idx_dedication_templates_artist_product_id ON public.artist_dedication_templates(artist_product_id);
CREATE INDEX IF NOT EXISTS idx_dedication_templates_store_id ON public.artist_dedication_templates(store_id);
CREATE INDEX IF NOT EXISTS idx_dedication_templates_active ON public.artist_dedication_templates(is_active) WHERE is_active = TRUE;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_artist_dedications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_artist_dedications_updated_at
  BEFORE UPDATE ON public.artist_product_dedications
  FOR EACH ROW
  EXECUTE FUNCTION update_artist_dedications_updated_at();

-- RLS Policies
ALTER TABLE public.artist_product_dedications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_dedication_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Clients peuvent voir leurs dédicaces
CREATE POLICY "dedications_select_own"
  ON public.artist_product_dedications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = artist_product_dedications.order_id
      AND o.user_id = auth.uid()
    )
  );

-- Policy: Propriétaires peuvent gérer dédicaces de leurs produits
CREATE POLICY "dedications_manage_owners"
  ON public.artist_product_dedications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = artist_product_dedications.product_id
      AND (s.user_id = auth.uid() OR s.owner_id = auth.uid())
    )
  );

-- Policy: Propriétaires peuvent gérer leurs templates
CREATE POLICY "dedication_templates_manage_owners"
  ON public.artist_dedication_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = artist_dedication_templates.store_id
      AND (s.user_id = auth.uid() OR s.owner_id = auth.uid())
    )
  );

-- Commentaires
COMMENT ON TABLE public.artist_product_dedications IS 'Dédicaces personnalisées pour œuvres d''artistes';
COMMENT ON TABLE public.artist_dedication_templates IS 'Templates de dédicaces réutilisables';

