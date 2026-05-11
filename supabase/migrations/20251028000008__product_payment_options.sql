-- =====================================================================================
-- Migration: Add payment_options to products table
-- Date: 28 octobre 2025
-- Description: Ajoute une colonne JSONB pour stocker les options de paiement
--              (complet, partiel, escrow) pour les produits physiques et services
-- =====================================================================================

-- Add payment_options column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS payment_options JSONB DEFAULT '{
  "payment_type": "full",
  "percentage_rate": 30
}'::jsonb;

-- Add comment
COMMENT ON COLUMN public.products.payment_options IS 'Options de paiement configurées pour le produit (full, percentage, delivery_secured)';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_payment_options ON public.products USING GIN (payment_options);

-- =====================================================================================
-- Structure attendue pour payment_options:
-- {
--   "payment_type": "full" | "percentage" | "delivery_secured",
--   "percentage_rate": 30 (pour les paiements partiels, entre 10 et 90)
-- }
-- =====================================================================================

