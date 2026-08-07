-- Licences acheteur : prod n'a pas customers.user_id — accès par user_id, email, customer_id

BEGIN;

DROP POLICY IF EXISTS "Customers can view own licenses" ON public.digital_licenses;

CREATE POLICY "Customers can view own licenses"
  ON public.digital_licenses FOR SELECT
  USING (
    user_id = auth.uid()
    OR customer_id = auth.uid()
    OR (
      customer_email IS NOT NULL
      AND lower(trim(customer_email)) = lower(trim(
        COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), '')
      ))
    )
    OR customer_id IN (
      SELECT c.id
      FROM public.customers c
      WHERE lower(trim(c.email)) = lower(trim(
        COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), '')
      ))
    )
  );

COMMIT;

NOTIFY pgrst, 'reload schema';
