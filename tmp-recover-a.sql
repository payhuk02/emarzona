-- Step A: mark paid (replica) — commit even if invoice fails later
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
  customer_id = CASE
    WHEN customer_id IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = orders.customer_id)
      THEN customer_id
    ELSE NULL
  END,
  updated_at = now(),
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'manual_recover_at', now(),
    'cleared_invalid_customer_id', true
  )
WHERE id = '6bda23ac-0809-4600-b6d7-fc0e582c776a'::uuid;

INSERT INTO public.payments (
  store_id, order_id, customer_id, amount, currency, status, payment_method, payment_type, transaction_id
)
SELECT
  t.store_id,
  t.order_id,
  NULL,
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
COMMIT;
