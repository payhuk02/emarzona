-- invoices.customer_id must reference public.customers (not auth.users)
BEGIN;

UPDATE public.invoices
SET customer_id = NULL
WHERE customer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.customers c WHERE c.id = invoices.customer_id
  );

ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_customer_id_fkey;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_customer_id_fkey
  FOREIGN KEY (customer_id)
  REFERENCES public.customers(id)
  ON DELETE SET NULL;

COMMIT;
