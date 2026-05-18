-- Contourne les 403 PostgREST sur orders quand les politiques RLS ne suffisent pas.
-- La fonction vérifie auth.uid() + email JWT avant de retourner les commandes.

GRANT SELECT ON TABLE public.orders TO authenticated;
GRANT SELECT ON TABLE public.order_items TO authenticated;
GRANT SELECT ON TABLE public.customers TO authenticated;

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
          (
            SELECT to_jsonb(c)
            FROM public.customers c
            WHERE c.id = o.customer_id
          )
        ) AS row_data
      FROM public.orders o
      WHERE (
        o.customer_id = uid
        OR EXISTS (
          SELECT 1
          FROM public.customers c
          WHERE c.id = o.customer_id
            AND user_email <> ''
            AND lower(btrim(c.email::text)) = user_email
        )
        OR (
          o.metadata IS NOT NULL
          AND jsonb_typeof(o.metadata) = 'object'
          AND (
            coalesce(o.metadata->>'userId', '') = uid::text
            OR coalesce(o.metadata->>'customerId', '') = uid::text
          )
        )
      )
      AND (
        coalesce(o.remaining_amount, 0) > 0
        OR coalesce(o.percentage_paid, 0) < 100
      )
    ) AS sub
  ), '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.list_my_pay_balance_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_my_pay_balance_orders() TO authenticated;

COMMENT ON FUNCTION public.list_my_pay_balance_orders() IS
  'Commandes acheteur avec solde restant (pay-balance). SECURITY DEFINER + contrôle auth.uid/email JWT.';
