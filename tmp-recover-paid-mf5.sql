-- Direct recover (replica role) — PSP paid verified externally
BEGIN;

SET LOCAL session_replication_role = replica;

UPDATE public.transactions
SET
  status = 'completed',
  completed_at = COALESCE(completed_at, now()),
  provider_payment_intent_id = COALESCE(provider_payment_intent_id, payment_id),
  updated_at = now(),
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'manual_recover_at', now(),
    'manual_recover_reason', 'mf_paid_ssl_verify_blocked_plus_side_triggers',
    'psp_statut', 'paid',
    'psp_montant', 195.94,
    'psp_frais', 6.06
  )
WHERE id = '99dfe92c-abbd-4676-ac78-36ead1eddfdc'::uuid
  AND status IS DISTINCT FROM 'completed';

UPDATE public.orders
SET
  payment_status = 'paid',
  status = CASE
    WHEN status IN ('pending', 'awaiting_payment') THEN 'confirmed'
    ELSE status
  END,
  payment_provider_used = COALESCE(payment_provider_used, 'moneyfusion'),
  updated_at = now(),
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'manual_recover_at', now()
  )
WHERE id = '6bda23ac-0809-4600-b6d7-fc0e582c776a'::uuid
  AND payment_status IS DISTINCT FROM 'paid';

INSERT INTO public.payments (
  store_id, order_id, customer_id, amount, currency, status, payment_method, payment_type, transaction_id
)
SELECT
  t.store_id,
  t.order_id,
  t.customer_id,
  COALESCE(t.amount, 0),
  COALESCE(t.currency, 'XOF'),
  'completed',
  'moneyfusion',
  'full',
  t.id::text
FROM public.transactions t
WHERE t.id = '99dfe92c-abbd-4676-ac78-36ead1eddfdc'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM public.payments p
    WHERE p.transaction_id = t.id::text OR p.order_id = t.order_id
  );

SET LOCAL session_replication_role = DEFAULT;

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
