# Stripe Connect — Edge Functions

## Functions

| Function                 | Rôle                                   |
| ------------------------ | -------------------------------------- |
| `stripe-connect-onboard` | Création compte Express + Account Link |
| `stripe-create-checkout` | Checkout Session (destination charge)  |
| `stripe-connect-webhook` | Webhooks Stripe                        |

## Secrets Supabase (Dashboard → Edge Functions → Secrets)

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SITE_URL=https://www.emarzona.com
ALLOWED_ORIGINS=https://www.emarzona.com,http://localhost:8080
```

## Webhook Stripe Dashboard

URL : `https://<project-ref>.supabase.co/functions/v1/stripe-connect-webhook`

Événements :

- `checkout.session.completed`
- `account.updated`

## Déploiement

```bash
supabase functions deploy stripe-connect-onboard
supabase functions deploy stripe-create-checkout
supabase functions deploy stripe-connect-webhook
```

## Client

`VITE_PAYMENT_ORCHESTRATION_V2=true` pour router le checkout vers Stripe quand connecté.

## Documentation équipe

Configuration détaillée : [docs/STRIPE_CONNECT_SETUP.md](../../../docs/STRIPE_CONNECT_SETUP.md)
