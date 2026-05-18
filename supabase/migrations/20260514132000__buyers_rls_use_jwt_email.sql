-- Remplace auth.users (souvent illisible en RLS) par l'email du JWT.
-- À exécuter si les politiques acheteur ne matchent jamais → 403 sur orders + embeds.

-- CUSTOMERS
DROP POLICY IF EXISTS "Customers can read own customer row by email" ON public.customers;
CREATE POLICY "Customers can read own customer row by email"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (
    email IS NOT NULL
    AND lower(btrim(email::text)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
    AND coalesce(auth.jwt() ->> 'email', '') <> ''
  );

-- ORDERS
DROP POLICY IF EXISTS "Buyers can select their orders" ON public.orders;
CREATE POLICY "Buyers can select their orders" ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND (
      customer_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = orders.customer_id
          AND c.email IS NOT NULL
          AND lower(btrim(c.email::text)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
          AND coalesce(auth.jwt() ->> 'email', '') <> ''
      )
      OR (
        orders.metadata IS NOT NULL
        AND jsonb_typeof(orders.metadata) = 'object'
        AND (
          (coalesce(orders.metadata->>'userId', '') <> ''
            AND orders.metadata->>'userId' = auth.uid()::text)
          OR (coalesce(orders.metadata->>'customerId', '') <> ''
            AND orders.metadata->>'customerId' = auth.uid()::text)
        )
      )
    )
  );

-- ORDER_ITEMS
DROP POLICY IF EXISTS "Buyers can select their order items" ON public.order_items;
CREATE POLICY "Buyers can select their order items" ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND auth.uid() IS NOT NULL
        AND (
          o.customer_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.customers c
            WHERE c.id = o.customer_id
              AND c.email IS NOT NULL
              AND lower(btrim(c.email::text)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
              AND coalesce(auth.jwt() ->> 'email', '') <> ''
          )
          OR (
            o.metadata IS NOT NULL
            AND jsonb_typeof(o.metadata) = 'object'
            AND (
              (coalesce(o.metadata->>'userId', '') <> ''
                AND o.metadata->>'userId' = auth.uid()::text)
              OR (coalesce(o.metadata->>'customerId', '') <> ''
                AND o.metadata->>'customerId' = auth.uid()::text)
            )
          )
        )
    )
  );
