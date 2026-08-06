-- Fix customer invoice visibility: customer_id references customers.id (not auth.users.id)

BEGIN;

DROP POLICY IF EXISTS "Customers can view their own invoices" ON public.invoices;
CREATE POLICY "Customers can view their own invoices"
  ON public.invoices FOR SELECT
  USING (
    customer_id IN (
      SELECT c.id
      FROM public.customers c
      WHERE c.user_id = auth.uid()
         OR lower(c.email) = lower(
           COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), '')
         )
    )
  );

DROP POLICY IF EXISTS "Users can view invoice items of accessible invoices" ON public.invoice_items;
CREATE POLICY "Users can view invoice items of accessible invoices"
  ON public.invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND (
          i.customer_id IN (
            SELECT c.id
            FROM public.customers c
            WHERE c.user_id = auth.uid()
               OR lower(c.email) = lower(
                 COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), '')
               )
          )
          OR EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = i.store_id AND s.user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
          )
        )
    )
  );

COMMIT;
