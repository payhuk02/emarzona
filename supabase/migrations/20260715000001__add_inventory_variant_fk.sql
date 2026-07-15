-- =====================================================
-- FIX: physical_product_inventory missing variant_id foreign key
-- Date: 2026-07-15
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'physical_product_inventory_variant_id_fkey'
  ) THEN
    ALTER TABLE public.physical_product_inventory 
      ADD CONSTRAINT physical_product_inventory_variant_id_fkey 
      FOREIGN KEY (variant_id) 
      REFERENCES public.physical_product_variants(id) 
      ON DELETE CASCADE;
  END IF;
END $$;
