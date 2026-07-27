-- Recover paid MF tx bypassing loyalty FK (guest customer_id not in auth.users)

BEGIN;

-- Soft-clear invalid loyalty customer so paid trigger can succeed
UPDATE public.orders
SET customer_id = NULL
WHERE id = '6bda23ac-0809-4600-b6d7-fc0e582c776a'::uuid
  AND customer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = orders.customer_id
  );

SELECT public.process_payment_webhook_atomic(
  p_provider := 'moneyfusion',
  p_external_event_id := 'manual-recover:6a6102a6a26ff341bb014b72:20260723b',
  p_event_type := 'payin.session.completed',
  p_transaction_id := '99dfe92c-abbd-4676-ac78-36ead1eddfdc'::uuid,
  p_payload := jsonb_build_object(
    'source', 'manual_recover_ssl_blocked_verify',
    'tokenPay', '6a6102a6a26ff341bb014b72',
    'statut', 'paid',
    'Montant', 195.94,
    'frais', 6.06,
    'verified_paid_amount', 202
  ),
  p_mapped_status := 'completed',
  p_provider_session_id := NULL,
  p_provider_payment_intent_id := '6a6102a6a26ff341bb014b72',
  p_connected_account_id := NULL,
  p_application_fee_amount := NULL
) AS atomic_result;

SELECT public.sync_payment_row_from_transaction('99dfe92c-abbd-4676-ac78-36ead1eddfdc'::uuid) AS payment_id;
SELECT public.ensure_order_invoice_paid('6bda23ac-0809-4600-b6d7-fc0e582c776a'::uuid) AS invoice_ok;

SELECT public.update_store_earnings(o.store_id)
FROM public.orders o
WHERE o.id = '6bda23ac-0809-4600-b6d7-fc0e582c776a'::uuid;

COMMIT;

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
