-- P0-1: MoneyFusion tokens are opaque strings (e.g. 24-char hex), not UUIDs.
-- transactions.payment_id was uuid → PostgREST update failed silently → status stuck pending,
-- payment_id NULL → webhooks cannot match → 0 completed payments.
-- GeniusPay UUIDs cast cleanly to text.

ALTER TABLE public.transactions
  ALTER COLUMN payment_id TYPE text
  USING payment_id::text;

COMMENT ON COLUMN public.transactions.payment_id IS
  'PSP payment token / id (MoneyFusion tokenPay, GeniusPay UUID, etc.) — text to accept non-UUID tokens.';

CREATE INDEX IF NOT EXISTS idx_transactions_payment_provider_payment_id
  ON public.transactions (payment_provider, payment_id)
  WHERE payment_id IS NOT NULL;
