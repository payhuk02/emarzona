BEGIN;

-- 2.1 Revoke PUBLIC on verify_api_key & create_api_key
DO $$ 
BEGIN
  EXECUTE 'REVOKE EXECUTE ON FUNCTION public.verify_api_key FROM PUBLIC, anon, authenticated';
  EXECUTE 'REVOKE EXECUTE ON FUNCTION public.create_api_key FROM PUBLIC, anon, authenticated';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 2.2 Extend RLS policies (is_store_member) for products, customers, orders

-- PRODUCTS
DROP POLICY IF EXISTS "Store owners can insert products" ON public.products;
CREATE POLICY "Store members can insert products" ON public.products FOR INSERT WITH CHECK (
  public.is_store_member(store_id, auth.uid())
);

DROP POLICY IF EXISTS "Store owners can update products" ON public.products;
CREATE POLICY "Store members can update products" ON public.products FOR UPDATE USING (
  public.is_store_member(store_id, auth.uid())
);

DROP POLICY IF EXISTS "Store owners can delete products" ON public.products;
CREATE POLICY "Store members can delete products" ON public.products FOR DELETE USING (
  public.is_store_member(store_id, auth.uid())
);

-- CUSTOMERS
DROP POLICY IF EXISTS "Store owners can view customers" ON public.customers;
CREATE POLICY "Store members can view customers" ON public.customers FOR SELECT USING (
  public.is_store_member(store_id, auth.uid())
);

DROP POLICY IF EXISTS "Store owners can insert customers" ON public.customers;
CREATE POLICY "Store members can insert customers" ON public.customers FOR INSERT WITH CHECK (
  public.is_store_member(store_id, auth.uid())
);

DROP POLICY IF EXISTS "Store owners can update customers" ON public.customers;
CREATE POLICY "Store members can update customers" ON public.customers FOR UPDATE USING (
  public.is_store_member(store_id, auth.uid())
);

-- ORDERS
DROP POLICY IF EXISTS "Store owners can view orders" ON public.orders;
CREATE POLICY "Store members can view orders" ON public.orders FOR SELECT USING (
  public.is_store_member(store_id, auth.uid())
);

DROP POLICY IF EXISTS "Store owners can insert orders" ON public.orders;
CREATE POLICY "Store members can insert orders" ON public.orders FOR INSERT WITH CHECK (
  public.is_store_member(store_id, auth.uid())
);

DROP POLICY IF EXISTS "Store owners can update orders" ON public.orders;
CREATE POLICY "Store members can update orders" ON public.orders FOR UPDATE USING (
  public.is_store_member(store_id, auth.uid())
);

COMMIT;
