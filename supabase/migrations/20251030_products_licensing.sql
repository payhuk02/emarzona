-- =====================================================
-- Add licensing fields to products
-- Feature: Private Label Rights (PLR) and Copyrighted products
-- Date: 2025-10-30
-- =====================================================

BEGIN;

-- Add licensing_type with constrained values
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS licensing_type TEXT
  CHECK (licensing_type IN ('standard', 'plr', 'copyrighted'))
  DEFAULT 'standard';

-- Add optional license_terms (free text)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS license_terms TEXT;

-- Index to filter/sort by licensing type quickly
CREATE INDEX IF NOT EXISTS idx_products_licensing_type ON public.products(licensing_type);

COMMIT;

COMMENT ON COLUMN public.products.licensing_type IS 'Licensing type: standard | plr | copyrighted';
COMMENT ON COLUMN public.products.license_terms IS 'Human-readable license terms/notes visible to visitors';


