
-- =====================================================
-- 1. PHYSICAL PRODUCTS: Add missing columns
-- =====================================================
ALTER TABLE public.physical_products
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'XOF',
  ADD COLUMN IF NOT EXISTS has_variants boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS track_inventory boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS total_quantity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
