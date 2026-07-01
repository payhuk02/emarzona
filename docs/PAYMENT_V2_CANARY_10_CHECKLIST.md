# Payment V2 — Checklist canary 10 %

Date cible : \***\*\_\_\*\***  
Owner : Lead Platform / Lead Infra

## Rollout canary 10 % — déployé (2026-07-01)

- [x] `VITE_PAYMENT_ORCHESTRATION_V2=true` + `ROLLOUT=10` sur Vercel production
- [x] Redéploiement production déclenché
- [x] Edge Function `stripe-tax-calculate` live
- [x] Migration SQL Stripe Tax (sans fallback 18 % global)
- [ ] Monitoring 48h (Sentry, fulfillment, webhooks) — en cours

## Pré-requis

- [ ] Migrations Payment V2 appliquées (`npm run verify:payment-v2-migrations`)
- [ ] Edge Functions PSP déployées (`npm run verify:payment-v2-edge-functions`)
- [ ] Secrets Supabase : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYPAL_*`, `MONEROO_*`
- [ ] `STRIPE_SECRET_KEY` actif (requis aussi pour Stripe Tax Phase 2.6)
- [ ] Tests unitaires paiements verts (`npm run test:unit:payments`)

## Préparation rollout

```bash
# Preflight (dry-run)
npm run prepare:payment-v2-rollout

# Option A — GitHub Actions + secrets repo
npm run prepare:payment-v2-rollout -- --execute

# Option B — Vercel API direct (.env)
npm run prepare:payment-v2-rollout -- --local
```

Secrets GitHub requis :

| Secret              | Source                                |
| ------------------- | ------------------------------------- |
| `VERCEL_TOKEN`      | https://vercel.com/account/tokens     |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings → General |
| `VERCEL_ORG_ID`     | Optionnel si projet team              |

## Variables production (post-rollout)

| Variable                                | Valeur canary 10 % |
| --------------------------------------- | ------------------ |
| `VITE_PAYMENT_ORCHESTRATION_V2`         | `true`             |
| `VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT` | `10`               |

## Monitoring 48h (canary 10 %)

- [ ] `npm run verify:payment-v2` — exit 0
- [ ] `npm run verify:webhook-idempotency` — exit 0
- [ ] `npm run verify:fulfillment-monitor` — exit 0
- [ ] Sentry : 0 double-fulfillment, error rate checkout < 0,1 %
- [ ] Test manuel : boutique dans les 10 % → Stripe Connect checkout EUR/USD
- [ ] Test manuel : boutique hors canary → Moneroo inchangé

## Escalade canary

| Étape | Commande                                                               | Délai min. |
| ----- | ---------------------------------------------------------------------- | ---------- |
| 10 %  | `npm run rollout:payment-v2:10`                                        | —          |
| 50 %  | `gh workflow run payment-v2-vercel-rollout.yml -f rollout_percent=50`  | 48h stable |
| 100 % | `gh workflow run payment-v2-vercel-rollout.yml -f rollout_percent=100` | 48h stable |

## Rollback

```bash
gh workflow run payment-v2-vercel-rollout.yml -f rollout_percent=0 -f redeploy=true
# ou
.\scripts\enable-payment-v2-rollout-vercel.ps1 -RolloutPercent 0 -SkipRedeploy
```

Puis redéployer production depuis Vercel Dashboard.

## Références

- [PAYMENT_ORCHESTRATION_V2_PROD_RUNBOOK.md](./PAYMENT_ORCHESTRATION_V2_PROD_RUNBOOK.md)
- [USER_GUIDE_PAYMENT_CONNECTIONS.md](./USER_GUIDE_PAYMENT_CONNECTIONS.md)
- Workflow : `.github/workflows/payment-v2-vercel-rollout.yml`
