-- Fix /dashboard/advanced-orders : payments 500 (auth.users in RLS) + affiliates store_id

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) affiliates.store_id (legacy table sans colonne → filtres 400)
-- ---------------------------------------------------------------------------
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_affiliates_store_id ON public.affiliates(store_id);

DROP POLICY IF EXISTS "Store owners can view store affiliates" ON public.affiliates;
CREATE POLICY "Store owners can view store affiliates"
  ON public.affiliates
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    OR auth.uid() = user_id
    OR COALESCE(public.is_platform_admin(), false)
  );

-- ---------------------------------------------------------------------------
-- 2) payments — supprimer auth.users des policies (cause des 500 PostgREST)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "payments_select_policy" ON public.payments;
DROP POLICY IF EXISTS "Store owners can view payments" ON public.payments;
DROP POLICY IF EXISTS "Store owners can view their payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;

CREATE POLICY "payments_select_policy"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    OR COALESCE(public.is_platform_admin(), false)
    OR COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
    OR customer_id IN (
      SELECT c.id
      FROM public.customers c
      INNER JOIN public.stores s ON s.id = c.store_id
      WHERE s.user_id = auth.uid()
    )
    OR order_id IN (
      SELECT o.id
      FROM public.orders o
      INNER JOIN public.stores s ON s.id = o.store_id
      WHERE s.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "payments_select_policy" ON public.payments IS
  'Vendeurs via store_id ; sans accès auth.users (évite 500 PostgREST).';

-- ---------------------------------------------------------------------------
-- 3) transactions — SELECT par store_id (sans profiles.id incorrect)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "transactions_select_policy" ON public.transactions;
DROP POLICY IF EXISTS "Store owners can view transactions" ON public.transactions;

CREATE POLICY "transactions_select_policy"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    OR user_id = auth.uid()
    OR COALESCE(public.is_platform_admin(), false)
    OR COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
  );

COMMENT ON POLICY "transactions_select_policy" ON public.transactions IS
  'Vendeurs via store_id ; admin via is_platform_admin/has_role.';

COMMIT;
