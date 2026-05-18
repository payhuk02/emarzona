-- =============================================================================
-- Script unique à coller dans Supabase SQL Editor (tout le fichier, puis Run).
-- Corrige le 403 sur /dashboard/pay-balance
-- =============================================================================

GRANT SELECT ON TABLE public.orders TO authenticated;
GRANT SELECT ON TABLE public.order_items TO authenticated;
GRANT SELECT ON TABLE public.customers TO authenticated;

-- 1) CUSTOMERS — lecture par email JWT (pas auth.users)
DROP POLICY IF EXISTS "Customers can read own customer row by email" ON public.customers;
CREATE POLICY "Customers can read own customer row by email"
  ON public.customers FOR SELECT TO authenticated
  USING (
    email IS NOT NULL
    AND lower(btrim(email::text)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
    AND coalesce(auth.jwt() ->> 'email', '') <> ''
  );

-- 2) ORDERS — acheteur
DROP POLICY IF EXISTS "Buyers can select their orders" ON public.orders;
CREATE POLICY "Buyers can select their orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND (
      customer_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = orders.customer_id
          AND c.email IS NOT NULL
          AND lower(btrim(c.email::text)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
          AND coalesce(auth.jwt() ->> 'email', '') <> ''
      )
      OR (
        orders.metadata IS NOT NULL
        AND jsonb_typeof(orders.metadata) = 'object'
        AND (
          (coalesce(orders.metadata->>'userId', '') <> '' AND orders.metadata->>'userId' = auth.uid()::text)
          OR (coalesce(orders.metadata->>'customerId', '') <> '' AND orders.metadata->>'customerId' = auth.uid()::text)
        )
      )
    )
  );

-- 3) ORDER_ITEMS — acheteur
DROP POLICY IF EXISTS "Buyers can select their order items" ON public.order_items;
CREATE POLICY "Buyers can select their order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND auth.uid() IS NOT NULL
        AND (
          o.customer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.customers c
            WHERE c.id = o.customer_id
              AND c.email IS NOT NULL
              AND lower(btrim(c.email::text)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
              AND coalesce(auth.jwt() ->> 'email', '') <> ''
          )
          OR (
            o.metadata IS NOT NULL AND jsonb_typeof(o.metadata) = 'object'
            AND (
              (coalesce(o.metadata->>'userId', '') <> '' AND o.metadata->>'userId' = auth.uid()::text)
              OR (coalesce(o.metadata->>'customerId', '') <> '' AND o.metadata->>'customerId' = auth.uid()::text)
            )
          )
        )
    )
  );

-- 4) RPC — lecture fiable même si PostgREST renvoie encore 403 sur orders
CREATE OR REPLACE FUNCTION public.list_my_pay_balance_orders()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  user_email text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
BEGIN
  IF uid IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_data ORDER BY sort_at DESC)
    FROM (
      SELECT
        o.created_at AS sort_at,
        to_jsonb(o) || jsonb_build_object(
          'order_items',
          COALESCE((
            SELECT jsonb_agg(to_jsonb(oi))
            FROM public.order_items oi
            WHERE oi.order_id = o.id
          ), '[]'::jsonb),
          'customers',
          (SELECT to_jsonb(c) FROM public.customers c WHERE c.id = o.customer_id)
        ) AS row_data
      FROM public.orders o
      WHERE (
        o.customer_id = uid
        OR EXISTS (
          SELECT 1 FROM public.customers c
          WHERE c.id = o.customer_id
            AND user_email <> ''
            AND lower(btrim(c.email::text)) = user_email
        )
        OR (
          o.metadata IS NOT NULL AND jsonb_typeof(o.metadata) = 'object'
          AND (
            coalesce(o.metadata->>'userId', '') = uid::text
            OR coalesce(o.metadata->>'customerId', '') = uid::text
          )
        )
      )
      AND (coalesce(o.remaining_amount, 0) > 0 OR coalesce(o.percentage_paid, 0) < 100)
    ) AS sub
  ), '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.list_my_pay_balance_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_my_pay_balance_orders() TO authenticated;
