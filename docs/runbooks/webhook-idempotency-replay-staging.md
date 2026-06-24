# Runbook — Idempotence webhooks & replay staging (Phase 0.4)

Objectif : **0 double fulfillment** sur rejeu webhook (Moneroo, Stripe Connect, PayPal).

## Mécanisme

| Couche      | Mécanisme                                                                   |
| ----------- | --------------------------------------------------------------------------- |
| DB          | `UNIQUE (provider, external_event_id)` sur `payment_webhook_events`         |
| RPC         | `process_payment_webhook_atomic` — insert + lock transaction + update order |
| Edge        | `completeTransactionAndOrder` avec `externalEventId` + `eventType`          |
| Fulfillment | `runPostOrderPaymentFulfillment` **uniquement si** `!alreadyCompleted`      |

## Migrations requises

```bash
supabase db push
# 20260523120000__payment_orchestration_v2_foundation.sql
# 20260620140000__strict_webhook_idempotency_rpc.sql
# 20260623190000__payment_webhook_atomic_alias_replay.sql
```

## Deploy edge functions

```bash
supabase functions deploy moneroo-webhook --project-ref hbdnzajbyjakdhuavrvb
supabase functions deploy stripe-connect-webhook --project-ref hbdnzajbyjakdhuavrvb
supabase functions deploy paypal-webhook --project-ref hbdnzajbyjakdhuavrvb
supabase functions deploy process-order-fulfillment-monitor --project-ref hbdnzajbyjakdhuavrvb
```

## Vérification staging

```bash
npm run verify:webhook-idempotency
```

```bash
# SQL (CI financial tests)
# tests/financial/e50-webhook-idempotency-replay.test.sql
```

Avec service role :

```bash
SUPABASE_SERVICE_ROLE_KEY=sb_secret_... node scripts/webhook-idempotency-replay-staging.mjs
# ou transaction précise :
TRANSACTION_ID=<uuid> SUPABASE_SERVICE_ROLE_KEY=... node scripts/webhook-idempotency-replay-staging.mjs
```

## Critères go / no-go

| #   | Test                                    | Attendu                                          |
| --- | --------------------------------------- | ------------------------------------------------ |
| 1   | `verify_webhook_idempotency_contract()` | `ok: true`                                       |
| 2   | 2× même `external_event_id`             | 2e = `duplicate_webhook`                         |
| 3   | 1 seule ligne `payment_webhook_events`  | count = 1                                        |
| 4   | Transaction déjà `completed`            | `already_completed: true`, pas de 2e fulfillment |
| 5   | Stripe replay même `event.id`           | HTTP 200 `{ duplicate: true }` ou idempotent log |
| 6   | PayPal 2 events différents, même tx     | 2e event = `alreadyCompleted`, 0 fulfillment     |

## Replay manuel Stripe (sandbox)

1. Stripe Dashboard → Webhooks → Send test webhook `checkout.session.completed`
2. Renvoyer **le même événement** (Replay)
3. Vérifier logs edge : `replay ignored (idempotent)`
4. SQL :

```sql
SELECT provider, external_event_id, processed_at, processing_error
FROM payment_webhook_events
WHERE transaction_id = '<tx_uuid>'
ORDER BY created_at DESC;
```

## Rollback

Pas de rollback DB nécessaire — les webhooks dupliqués sont ignorés. En cas de bug, désactiver temporairement le webhook PSP côté dashboard provider.

## Monitoring

```sql
SELECT get_payment_webhook_health(24);
-- ou
SELECT provider, count(*) FILTER (WHERE processing_error IS NOT NULL) AS errors
FROM payment_webhook_events
WHERE created_at >= now() - interval '24 hours'
GROUP BY provider;
```
