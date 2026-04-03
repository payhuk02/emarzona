-- =====================================================
-- FIX: Renommer product_variants en physical_product_variants
-- Date: 28 Octobre 2025
-- Raison: Cohérence avec digital_product_*, service_product_*
-- =====================================================

-- 1. Renommer la table
ALTER TABLE IF EXISTS public.product_variants 
RENAME TO physical_product_variants;

-- 2. Recréer les indexes avec les bons noms
DROP INDEX IF EXISTS idx_product_variants_physical_product_id;
DROP INDEX IF EXISTS idx_product_variants_sku;
DROP INDEX IF EXISTS idx_product_variants_quantity;
DROP INDEX IF EXISTS idx_product_variants_available;

CREATE INDEX IF NOT EXISTS idx_physical_product_variants_physical_product_id 
  ON public.physical_product_variants(physical_product_id);
CREATE INDEX IF NOT EXISTS idx_physical_product_variants_sku 
  ON public.physical_product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_physical_product_variants_quantity 
  ON public.physical_product_variants(quantity);
CREATE INDEX IF NOT EXISTS idx_physical_product_variants_available 
  ON public.physical_product_variants(is_available);

-- 3. Recréer le trigger avec le bon nom
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON public.physical_product_variants;
CREATE TRIGGER update_physical_product_variants_updated_at
  BEFORE UPDATE ON public.physical_product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Recréer le trigger de création d'inventaire
DROP TRIGGER IF EXISTS create_inventory_on_variant ON public.physical_product_variants;
CREATE TRIGGER create_inventory_on_variant
  AFTER INSERT ON public.physical_product_variants
  FOR EACH ROW
  EXECUTE FUNCTION create_inventory_item_for_variant();

-- 5. Mettre à jour la foreign key dans inventory_items
ALTER TABLE IF EXISTS public.inventory_items
DROP CONSTRAINT IF EXISTS inventory_items_variant_id_fkey;

ALTER TABLE IF EXISTS public.inventory_items
ADD CONSTRAINT inventory_items_variant_id_fkey 
FOREIGN KEY (variant_id) 
REFERENCES public.physical_product_variants(id) 
ON DELETE CASCADE;

-- 6. Recréer les RLS policies avec les bons noms
DROP POLICY IF EXISTS "Anyone can view variants" ON public.physical_product_variants;
CREATE POLICY "Anyone can view physical_product_variants"
  ON public.physical_product_variants
  FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Store owners manage variants" ON public.physical_product_variants;
CREATE POLICY "Store owners manage physical_product_variants"
  ON public.physical_product_variants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.physical_products pp
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pp.id = physical_product_variants.physical_product_id
        AND s.user_id = auth.uid()
    )
  );

-- 7. Mettre à jour les policies sur inventory_items pour refléter le nouveau nom
DROP POLICY IF EXISTS "Store owners view inventory" ON public.inventory_items;
CREATE POLICY "Store owners view inventory"
  ON public.inventory_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.physical_products pp
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pp.id = inventory_items.physical_product_id
        AND s.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.physical_product_variants pv
      INNER JOIN public.physical_products pp ON pv.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pv.id = inventory_items.variant_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners manage inventory" ON public.inventory_items;
CREATE POLICY "Store owners manage inventory"
  ON public.inventory_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.physical_products pp
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pp.id = inventory_items.physical_product_id
        AND s.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.physical_product_variants pv
      INNER JOIN public.physical_products pp ON pv.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE pv.id = inventory_items.variant_id
        AND s.user_id = auth.uid()
    )
  );

-- 8. Mettre à jour les policies sur stock_movements
DROP POLICY IF EXISTS "Store owners view stock movements" ON public.stock_movements;
CREATE POLICY "Store owners view stock movements"
  ON public.stock_movements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inventory_items ii
      INNER JOIN public.physical_products pp ON ii.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE ii.id = stock_movements.inventory_item_id
        AND s.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.inventory_items ii
      INNER JOIN public.physical_product_variants pv ON ii.variant_id = pv.id
      INNER JOIN public.physical_products pp ON pv.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE ii.id = stock_movements.inventory_item_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners create stock movements" ON public.stock_movements;
CREATE POLICY "Store owners create stock movements"
  ON public.stock_movements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inventory_items ii
      INNER JOIN public.physical_products pp ON ii.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE ii.id = stock_movements.inventory_item_id
        AND s.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.inventory_items ii
      INNER JOIN public.physical_product_variants pv ON ii.variant_id = pv.id
      INNER JOIN public.physical_products pp ON pv.physical_product_id = pp.id
      INNER JOIN public.products p ON pp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE ii.id = stock_movements.inventory_item_id
        AND s.user_id = auth.uid()
    )
  );

-- =====================================================
-- VÉRIFICATION
-- =====================================================

SELECT 
  'physical_product_variants' as table_name,
  COUNT(*) as row_count
FROM public.physical_product_variants;

-- Afficher les indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'physical_product_variants';

-- Afficher les policies
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'physical_product_variants';

