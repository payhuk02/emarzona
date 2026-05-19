-- RPC lecture commandes pour vendeurs (gestion paiements) + acheteurs, contourne 403 embed RLS.

GRANT SELECT ON TABLE public.orders TO authenticated;
GRANT SELECT ON TABLE public.order_items TO authenticated;
GRANT SELECT ON TABLE public.customers TO authenticated;

CREATE OR REPLACE FUNCTION public.list_store_payment_management_orders(p_store_id uuid DEFAULT NULL)
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
      WHERE
        (
          p_store_id IS NOT NULL
          AND o.store_id = p_store_id
          AND EXISTS (
            SELECT 1
            FROM public.stores s
            WHERE s.id = o.store_id
              AND s.user_id = uid
          )
        )
        OR (
          p_store_id IS NULL
          AND (
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
        )
    ) AS sub
  ), '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.list_store_payment_management_orders(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_store_payment_management_orders(uuid) TO authenticated;

COMMENT ON FUNCTION public.list_store_payment_management_orders(uuid) IS
  'Commandes boutique (vendeur) ou acheteur pour la page gestion des paiements. SECURITY DEFINER.';
