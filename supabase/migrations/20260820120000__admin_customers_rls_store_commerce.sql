-- Admin RLS: allow platform admins to view all customers (consistent with orders/transactions)
-- Required for /admin/store-commerce page

DROP POLICY IF EXISTS "Admins can view all customers" ON public.customers;
CREATE POLICY "Admins can view all customers"
  ON public.customers
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

COMMENT ON POLICY "Admins can view all customers" ON public.customers IS
  'Platform admins can inspect customer records for any store (store commerce admin page).';

-- Performance indexes for store-scoped admin queries
CREATE INDEX IF NOT EXISTS idx_customers_store_id_created_at
  ON public.customers (store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_store_id_created_at
  ON public.transactions (store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_store_id_payment_status
  ON public.orders (store_id, payment_status, created_at DESC);
