SELECT public.update_store_earnings(o.store_id)
FROM public.orders o
WHERE o.id = '6bda23ac-0809-4600-b6d7-fc0e582c776a'::uuid;

-- Invoice may still fail if FK is strict; try with null customer
SELECT public.ensure_order_invoice_paid('6bda23ac-0809-4600-b6d7-fc0e582c776a'::uuid) AS invoice_ok;

SELECT jsonb_build_object(
  'tx_status', t.status,
  'order_payment', o.payment_status,
  'order_status', o.status,
  'payments_completed', (SELECT count(*) FROM payments p WHERE p.order_id = o.id AND p.status = 'completed'),
  'earnings', (
    SELECT jsonb_build_object(
      'total_revenue', se.total_revenue,
      'available_balance', se.available_balance,
      'commission', se.total_platform_commission
    )
    FROM store_earnings se WHERE se.store_id = o.store_id
  )
) AS after_recover
FROM transactions t
JOIN orders o ON o.id = t.order_id
WHERE t.id = '99dfe92c-abbd-4676-ac78-36ead1eddfdc'::uuid;
