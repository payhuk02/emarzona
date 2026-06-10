-- C4: Restore strict RLS on products, stores, and product extension tables
-- Reverts permissive USING(true) policies from March 2026 bootstrap migrations.

BEGIN;

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "products_select_policy" ON public.products;

CREATE POLICY "products_select_policy"
  ON public.products FOR SELECT
  USING (
    (is_active = true AND (hide_from_store IS NULL OR hide_from_store = false))
    OR store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- stores (owners + admins only; public reads via stores_public view)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Stores are viewable by everyone" ON public.stores;

DROP POLICY IF EXISTS "stores_owner_select_policy" ON public.stores;
CREATE POLICY "stores_owner_select_policy"
  ON public.stores FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- Extension tables: visible only when parent product is visible
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Digital products viewable by everyone" ON public.digital_products;
DROP POLICY IF EXISTS "digital_products_select_policy" ON public.digital_products;
CREATE POLICY "digital_products_select_policy"
  ON public.digital_products FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM public.products
      WHERE (is_active = true AND (hide_from_store IS NULL OR hide_from_store = false))
         OR store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

DROP POLICY IF EXISTS "Physical products viewable by everyone" ON public.physical_products;
DROP POLICY IF EXISTS "physical_products_select_policy" ON public.physical_products;
CREATE POLICY "physical_products_select_policy"
  ON public.physical_products FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM public.products
      WHERE (is_active = true AND (hide_from_store IS NULL OR hide_from_store = false))
         OR store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

DROP POLICY IF EXISTS "Service products viewable by everyone" ON public.service_products;
DROP POLICY IF EXISTS "service_products_select_policy" ON public.service_products;
CREATE POLICY "service_products_select_policy"
  ON public.service_products FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM public.products
      WHERE (is_active = true AND (hide_from_store IS NULL OR hide_from_store = false))
         OR store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

DROP POLICY IF EXISTS "Artist products viewable by everyone" ON public.artist_products;
DROP POLICY IF EXISTS "artist_products_select_policy" ON public.artist_products;
CREATE POLICY "artist_products_select_policy"
  ON public.artist_products FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM public.products
      WHERE (is_active = true AND (hide_from_store IS NULL OR hide_from_store = false))
         OR store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

COMMIT;
