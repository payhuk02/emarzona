# Runbook — Payment V2 rollout 100 %

**Prérequis** : phase 50 % stable ≥ 48 h, redeploy production actif avec `VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT=50`.

---

## Go / no-go (avant 100 %)

| #   | Critère                         | Commande / source                                                 | Cible                  |
| --- | ------------------------------- | ----------------------------------------------------------------- | ---------------------- |
| 1   | Canary 50 % actif ≥ 48 h        | Vercel env + date redeploy                                        | OK                     |
| 2   | Webhooks sans backlog           | `get_payment_webhook_health(24)`                                  | 0 erreurs non résolues |
| 3   | E2E financial CI                | `npm run test:e2e:financial`                                      | Vert                   |
| 4   | Feature flags                   | `npx vitest run src/lib/payments/__tests__/feature-flags.test.ts` | Vert                   |
| 5   | Réconciliation Moneroo          | cron / alertes Slack                                              | 0 écart > 1 XOF        |
| 6   | Double fulfillment              | replay webhook test staging                                       | Idempotent             |
| 7   | Smoke Stripe + PayPal + Moneroo | §7 runbook principal                                              | 3/3 OK                 |

---

## Activation 100 %

**Statut 2026-06-14** : variables Vercel production mises à jour (`VITE_PAYMENT_ORCHESTRATION_V2=true`, `VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT=100`). **Redeploy build requis** (Dashboard).

### Option A — Script (recommandé)

```powershell
# Token optionnel si `npx vercel login` actif
$env:VERCEL_TOKEN = "<token>"   # optionnel
.\scripts\enable-payment-v2-rollout-100.ps1
```

Sans redeploy CLI (quota upload) :

```powershell
.\scripts\enable-payment-v2-rollout-100.ps1 -SkipRedeploy
# Puis Vercel Dashboard → Deployments → Redeploy (Production)
```

### Option B — Dashboard Vercel

1. **Settings → Environment Variables → Production**
2. `VITE_PAYMENT_ORCHESTRATION_V2` = `true`
3. `VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT` = `100`
4. **Deployments → Redeploy** (branche `main`)

---

## Vérification post-déploiement

```bash
npx vitest run src/lib/payments/__tests__/feature-flags.test.ts
npx playwright test tests/e2e/payment-v2-rollout.spec.ts --project=chromium
node scripts/verify-payment-v2-remote.mjs
```

Contrôles manuels (30 min) :

- [ ] Checkout XOF boutique canary → Moneroo
- [ ] Checkout EUR boutique Connect → Stripe
- [ ] Checkout USD PayPal → capture OK
- [ ] Panier multi-boutiques → message garde Moneroo (si applicable)
- [ ] `/payment/success?order_id=` → statut `paid`

---

## Rollback (< 5 min)

```powershell
.\scripts\enable-payment-v2-rollout-vercel.ps1 -RolloutPercent 0 -SkipRedeploy
# ou ROLLOUT=10 pour retour canary partiel
```

Puis redeploy production. Aucune migration DB requise.

---

## Monitoring J+1 à J+7

- Latence webhooks P95 < 3 s
- Taux échec checkout < baseline + 2 %
- Tickets support « paiement bloqué » = 0 critique
- GMV perdu (accès non payé) = 0 signalé
