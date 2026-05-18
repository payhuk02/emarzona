-- =============================================================================
-- Pay-balance / portail acheteur : 403 sur GET /orders?select=*,customers(...),order_items(...)
--
-- Si seules les politiques "store owners" subsistent (ex. chaîne 20260326), l'acheteur
-- ne peut pas lire ses commandes ni les order_items — PostgREST renvoie 403 sur tout le SELECT.
-- Cette migration ajoute des politiques permissives (OR avec les politiques existantes).
-- À appliquer sur Supabase (db push ou SQL Editor) en plus de
--   20260514120000__customers_select_for_buyers_embed.sql
-- =============================================================================

-- ORDERS : l'acheteur voit ses commandes (customer_id, email customer, metadata)
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

COMMENT ON POLICY "Buyers can select their orders" ON public.orders IS
  'Acheteur : SELECT sur ses commandes (customer_id, customers.email, metadata userId/customerId).';

-- ORDER_ITEMS : lignes des commandes accessibles à l'acheteur (nécessaire pour embed)
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

COMMENT ON POLICY "Buyers can select their order items" ON public.order_items IS
  'Acheteur : SELECT sur order_items des commandes visibles (embed PostgREST).';
