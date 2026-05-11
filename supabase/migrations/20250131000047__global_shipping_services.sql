-- =====================================================
-- GLOBAL SHIPPING SERVICES
-- Date: 31 Janvier 2025
-- Description: Services de livraison globaux gérés par l'admin
--              Disponibles pour tous les vendeurs
-- =====================================================

-- Table: global_shipping_services
CREATE TABLE IF NOT EXISTS public.global_shipping_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- === SERVICE INFO ===
  name TEXT NOT NULL,
  description TEXT,
  carrier_type TEXT NOT NULL CHECK (carrier_type IN ('DHL', 'FedEx', 'UPS', 'Chronopost', 'Custom', 'Local')),
  
  -- === CONTACT INFO ===
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  website_url TEXT,
  
  -- === API INFO ===
  api_available BOOLEAN DEFAULT FALSE,
  api_documentation_url TEXT,
  
  -- === COVERAGE ===
  supported_countries TEXT[] DEFAULT '{}', -- ISO country codes
  supported_regions TEXT[] DEFAULT '{}',  -- Regions like "Afrique de l'Ouest"
  
  -- === STATUS ===
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE, -- Mis en avant pour les vendeurs
  priority INTEGER DEFAULT 0, -- Ordre d'affichage
  
  -- === METADATA ===
  metadata JSONB DEFAULT '{}',
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_global_shipping_services_active ON public.global_shipping_services(is_active);
CREATE INDEX IF NOT EXISTS idx_global_shipping_services_featured ON public.global_shipping_services(is_featured);
CREATE INDEX IF NOT EXISTS idx_global_shipping_services_priority ON public.global_shipping_services(priority DESC);
CREATE INDEX IF NOT EXISTS idx_global_shipping_services_carrier_type ON public.global_shipping_services(carrier_type);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_global_shipping_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_global_shipping_services_updated_at ON public.global_shipping_services;
CREATE TRIGGER update_global_shipping_services_updated_at
  BEFORE UPDATE ON public.global_shipping_services
  FOR EACH ROW
  EXECUTE FUNCTION update_global_shipping_services_updated_at();

-- RLS Policies
ALTER TABLE public.global_shipping_services ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire les services actifs
DROP POLICY IF EXISTS "Anyone can view active global shipping services" ON public.global_shipping_services;
CREATE POLICY "Anyone can view active global shipping services"
  ON public.global_shipping_services
  FOR SELECT
  USING (is_active = true);

-- Policy: Seuls les admins peuvent tout voir
DROP POLICY IF EXISTS "Admins can view all global shipping services" ON public.global_shipping_services;
CREATE POLICY "Admins can view all global shipping services"
  ON public.global_shipping_services
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Seuls les admins peuvent créer
DROP POLICY IF EXISTS "Admins can create global shipping services" ON public.global_shipping_services;
CREATE POLICY "Admins can create global shipping services"
  ON public.global_shipping_services
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Seuls les admins peuvent modifier
DROP POLICY IF EXISTS "Admins can update global shipping services" ON public.global_shipping_services;
CREATE POLICY "Admins can update global shipping services"
  ON public.global_shipping_services
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Seuls les admins peuvent supprimer
DROP POLICY IF EXISTS "Admins can delete global shipping services" ON public.global_shipping_services;
CREATE POLICY "Admins can delete global shipping services"
  ON public.global_shipping_services
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Commentaires
COMMENT ON TABLE public.global_shipping_services IS 'Services de livraison globaux gérés par l''administrateur et disponibles pour tous les vendeurs';
COMMENT ON COLUMN public.global_shipping_services.is_featured IS 'Service mis en avant pour être affiché en priorité aux vendeurs';
COMMENT ON COLUMN public.global_shipping_services.priority IS 'Ordre d''affichage (plus élevé = affiché en premier)';

