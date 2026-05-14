-- Permet aux acheteurs authentifiés de lire leur(s) ligne(s) `customers` quand l'email
-- correspond à auth.users. Nécessaire pour les requêtes PostgREST du type
--   GET /orders?select=*,customers(...),order_items(...)
-- sans quoi RLS sur `customers` (réservée aux vendeurs) provoque un 403 sur tout le SELECT.

DROP POLICY IF EXISTS "Customers can read own customer row by email" ON public.customers;
CREATE POLICY "Customers can read own customer row by email"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (
    email IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM auth.users au
      WHERE au.id = auth.uid()
        AND lower(trim(au.email)) = lower(trim(customers.email))
    )
  );

COMMENT ON POLICY "Customers can read own customer row by email" ON public.customers IS
  'Acheteur : lecture de sa fiche customer pour embeds orders (ex. pay-balance, paiements).';
