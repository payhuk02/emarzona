# API Emarzona — Référence vendeur

## API REST v1 (vendeurs enterprise)

**Base URL** : `https://<project-ref>.supabase.co/functions/v1/api-v1`

Authentification : clé API vendeur (Bearer) générée depuis le tableau de bord.

### Ressources principales

| Méthode | Endpoint      | Description                  |
| ------- | ------------- | ---------------------------- |
| `GET`   | `/products`   | Liste produits boutique      |
| `POST`  | `/products`   | Créer un produit             |
| `GET`   | `/orders`     | Commandes                    |
| `GET`   | `/orders/:id` | Détail commande              |
| `POST`  | `/webhooks`   | Configurer webhooks sortants |

Client TypeScript interne : `src/lib/vendor/api-v1-client.ts`

Tests : `npm run test:unit -- src/lib/vendor/__tests__/api-v1-client.test.ts`

## Webhooks entrants (plateforme)

| Provider        | Edge Function            | Vérification          |
| --------------- | ------------------------ | --------------------- |
| Moneroo         | `moneroo-webhook`        | HMAC signature        |
| Stripe Connect  | `stripe-connect-webhook` | Stripe signing secret |
| PayPal Commerce | `paypal-webhook`         | PayPal verification   |
| Resend          | `resend-webhook`         | Svix                  |

Idempotence : RPC `process_payment_webhook_atomic` — vérifier avec `npm run verify:webhook-idempotency`.

## Webhooks sortants (vendeur)

Configurés via Epic 4.7 — événements `order.paid`, `order.fulfilled`, `refund.created`, etc.

Livraison via Edge Function `webhook-delivery` (header `x-internal-secret` requis).

## RPC Supabase (lecture acheteur / checkout)

Exemples utilisés par le frontend :

- `get_store_payment_options(store_id, currency, buyer_country)` — PSP disponibles
- `calculate_checkout_taxes(...)` — TVA / taxes checkout
- `get_platform_admin_analytics(...)` — métriques admin

Contrats RLS portails client : `src/lib/security/client-portal-rls-contract.ts`

## Limites & plans

Rate limits par plan vendeur — voir migrations `seller_api_rate_limits`.

## Documentation complémentaire

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [PAYMENT_ORCHESTRATION_V2_PROD_RUNBOOK.md](./PAYMENT_ORCHESTRATION_V2_PROD_RUNBOOK.md)
- [FINANCIAL_RECONCILIATION.md](./FINANCIAL_RECONCILIATION.md)
