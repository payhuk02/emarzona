-- Recover ORD-202607230012 / tx edd8ffee — MF verified paid (Montant 195.94 + frais 6.06 = 202)
BEGIN;

UPDATE public.transactions
SET
  status = 'completed',
  completed_at = COALESCE(completed_at, now()),
  provider_payment_intent_id = COALESCE(provider_payment_intent_id, payment_id),
  webhook_processed_at = COALESCE(webhook_processed_at, now()),
  updated_at = now(),
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'manual_recover_at', now(),
    'manual_recover_reason', 'mf_paid_verified_via_status_proxy_webhook_missed',
    'psp_statut', 'paid',
    'psp_montant', 195.94,
    'psp_frais', 6.06,
    'psp_moyen', 'orange_money_bf'
  )
WHERE id = 'edd8ffee-86d5-41d6-a496-5736b0f8bc5a'::uuid
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
    'manual_recover_at', now(),
    'manual_recover_reason', 'mf_paid_verified'
  )
WHERE id = '6f36a592-1a04-4832-a4c6-ca3234016eb9'::uuid
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
WHERE t.id = 'edd8ffee-86d5-41d6-a496-5736b0f8bc5a'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM public.payments p
    WHERE p.transaction_id = t.id::text OR p.order_id = t.order_id
  );

SELECT public.update_store_earnings('667f45e0-1402-47a8-976b-8114f517a967'::uuid);

COMMIT;
