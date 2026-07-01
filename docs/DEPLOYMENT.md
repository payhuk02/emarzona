# Guide de déploiement — Emarzona

## Architecture de déploiement

```
Vercel (SPA + crons + middleware)
    ↕
Supabase (PostgreSQL, Auth, Storage, 92 Edge Functions)
    ↕
PSP externes (Moneroo, Stripe, PayPal), FedEx, Resend, Sentry
```

## Frontend (Vercel)

1. Connectez le dépôt GitHub à Vercel.
2. Variables d'environnement production :

| Variable                                | Obligatoire | Notes                         |
| --------------------------------------- | ----------- | ----------------------------- |
| `VITE_SUPABASE_URL`                     | Oui         | URL projet prod               |
| `VITE_SUPABASE_ANON_KEY`                | Oui         | Clé publishable               |
| `VITE_PAYMENT_ORCHESTRATION_V2`         | Canary      | `true` pour activer multi-PSP |
| `VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT` | Canary      | `10` → `50` → `100`           |
| `VITE_SUPABASE_READ_URL`                | Optionnel   | Read replica                  |
| `VITE_VAPID_PUBLIC_KEY`                 | Optionnel   | Push PWA                      |

3. Déployez : push sur `main` ou `npm run rollout:payment-v2:local` pour canary ciblé.

Voir [DEPLOIEMENT_FRONT_SUPABASE_KEYS.md](./DEPLOIEMENT_FRONT_SUPABASE_KEYS.md).

## Backend (Supabase)

### Migrations

```bash
npx supabase db push --linked
npm run verify:payment-v2-migrations
```

Ordre Payment V2 : [PAYMENT_ORCHESTRATION_V2_PROD_RUNBOOK.md](./PAYMENT_ORCHESTRATION_V2_PROD_RUNBOOK.md) §2.

### Stripe Tax (Phase 2.6)

```bash
npx supabase functions deploy stripe-tax-calculate --linked
npx supabase db push --linked   # migration 20260701120000 (supprime fallback 18 % global)
```

Requiert `STRIPE_SECRET_KEY` avec Stripe Tax activé sur le compte plateforme.

### Edge Functions

```bash
npx supabase functions deploy --linked
npm run verify:payment-v2-edge-functions
```

### Secrets Edge (Dashboard → Edge Functions → Secrets)

- `EDGE_INTERNAL_SECRET`, `ALLOWED_ORIGINS`
- `STRIPE_*`, `PAYPAL_*`, `MONEROO_*`
- `FEDEX_*` (sinon mock shipping hors prod)
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (push)

## Gates pré-production

Exécutez avant tout go-live :

```powershell
npm run verify:phase0:signoff
npm run verify:phase1
npm run verify:phase2:fast
```

Signez [SECURE_DEPLOY_CHECKLIST.md](../SECURE_DEPLOY_CHECKLIST.md) §6 lorsque tous les checks requis sont ✅.

## Rollout Payment V2 (canary)

```bash
npm run setup:payment-v2-github-secrets   # une fois
npm run rollout:payment-v2:10             # 10 %
# monitoring 48h → 50 % → 100 %
```

Workflow CI : `.github/workflows/payment-v2-vercel-rollout.yml`

## Rollback

1. `VITE_PAYMENT_ORCHESTRATION_V2=false` sur Vercel.
2. Redéployer le dernier build stable.
3. Vérifier `npm run verify:fulfillment-monitor` et webhooks Sentry.
