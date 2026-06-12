# Runbook — Activation production Orchestration Paiements V2

**Version** : 1.0 · **Date** : 2026-06-03  
**Référence consolidation** : PR [#19](https://github.com/payhuk02/emarzona/pull/19) (absorbe #15–#18)  
**Plans liés** : [PAYMENT_ORCHESTRATION_IMPLEMENTATION_PLAN.md](./PAYMENT_ORCHESTRATION_IMPLEMENTATION_PLAN.md), [STRIPE_CONNECT_SETUP.md](./STRIPE_CONNECT_SETUP.md), [PAYPAL_COMMERCE_SETUP.md](./PAYPAL_COMMERCE_SETUP.md)

---

## 1. Vue d’ensemble

| Rail                   | Rôle                                   | Merchant of record                               |
| ---------------------- | -------------------------------------- | ------------------------------------------------ |
| **Moneroo plateforme** | Afrique francophone, XOF, mobile money | Emarzona → reversement wallet                    |
| **Stripe Connect**     | Cartes internationales EUR/USD/GBP     | Vendeur (destination charge + `application_fee`) |
| **PayPal Commerce**    | PayPal + cartes via PayPal             | Vendeur (platform fee)                           |

**Feature flag frontend** : `VITE_PAYMENT_ORCHESTRATION_V2=true`  
**Preview Vercel** : V2 activé automatiquement si la variable n’est pas définie (voir `src/lib/payments/feature-flags.ts`).

---

## 2. Prérequis migrations SQL (ordre)

Appliquer sur **staging puis prod** :

| Ordre | Migration                                                         | Rôle                                                             |
| ----- | ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1     | `20260523120000__payment_orchestration_v2_foundation.sql`         | Connexions PSP, RPC `get_store_payment_options`, webhooks events |
| 2     | `20250603120000__fix_order_status_paid_revenue_eligibility.sql`   | Revenus vendeur + statuts paid                                   |
| 3     | `20250603120100__hotfix_store_earnings_trigger_pg42p17.sql`       | Si échec trigger 42P17                                           |
| 4     | `20250603130000__affiliate_paid_trigger_and_connect_earnings.sql` | Affiliés au paiement, wallet sans Connect                        |
| 5     | `20250603140000__audit_p1_security_refunds_downloads.sql`         | Tokens download, révocation digital                              |
| 6     | `20250603150000__audit_p2_checkout_rls_subscriptions.sql`         | RLS fichiers, cron abo plateforme                                |
| 7     | `20250603160000__physical_product_subscription_lifecycle.sql`     | Cron abo produit physique                                        |

Vérification :

```bash
node scripts/verify-payment-v2-remote.mjs
```

---

## 3. Edge Functions à déployer

```bash
cd c:\emarzona

# Orchestration checkout
npx supabase functions deploy stripe-connect-onboard --no-verify-jwt
npx supabase functions deploy stripe-create-checkout
npx supabase functions deploy stripe-connect-webhook --no-verify-jwt
npx supabase functions deploy stripe-refund

npx supabase functions deploy paypal-partner-onboard --no-verify-jwt
npx supabase functions deploy paypal-create-order
npx supabase functions deploy paypal-webhook --no-verify-jwt
npx supabase functions deploy paypal-refund

# Rail plateforme (existant)
npx supabase functions deploy moneroo-webhook --no-verify-jwt
npx supabase functions deploy moneroo
```

---

## 4. Secrets Supabase (prod)

| Secret                                      | PSP        | Obligatoire                         |
| ------------------------------------------- | ---------- | ----------------------------------- |
| `STRIPE_SECRET_KEY`                         | Stripe     | Oui si Connect                      |
| `STRIPE_WEBHOOK_SECRET`                     | Stripe     | Oui                                 |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | PayPal     | Oui si Commerce                     |
| `PAYPAL_WEBHOOK_ID`                         | PayPal     | Oui                                 |
| `MONEROO_*`                                 | Moneroo    | Oui (rail principal)                |
| `SITE_URL`                                  | CORS       | `https://www.emarzona.com`          |
| `ALLOWED_ORIGINS`                           | CORS       | Domaine prod + admin                |
| `FEDEX_*`                                   | Shipping   | Prod sans mock (voir runbook FedEx) |
| `ENVIRONMENT=production`                    | FedEx Edge | Désactive mock shipping             |

**Stripe webhook events** : `checkout.session.completed`, `charge.refunded`, `account.updated`  
**PayPal webhook events** : capture completed, `PAYMENT.CAPTURE.REFUNDED`, onboarding

---

## 5. Activation frontend (Vercel)

1. **Project → Settings → Environment Variables**
2. Production :

```
VITE_PAYMENT_ORCHESTRATION_V2=true
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

3. Redéployer production.
4. **Staging / Preview** : laisser non défini pour auto-V2, ou `true` explicitement.

### Rollout canary (50 % → 100 %)

Phase recommandée après smoke QA §7 :

| Phase | `VITE_PAYMENT_ORCHESTRATION_V2` | `VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT` | Critère go/no-go                                            |
| ----- | ------------------------------- | --------------------------------------- | ----------------------------------------------------------- |
| 1     | `true`                          | `10`                                    | 48 h sans incident webhook / double fulfillment             |
| 2     | `true`                          | `50`                                    | `get_payment_webhook_health(24)` OK, E2E financial CI verte |
| 3     | `true`                          | `100`                                   | Stripe + PayPal + Moneroo smoke prod                        |

**Statut 2026-06-12** : phase **2 active** — `VITE_PAYMENT_ORCHESTRATION_V2=true`, `VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT=50` en production Vercel (variables confirmées via `vercel env ls production`).

> **Redeploy requis** : les `VITE_*` ne sont lues qu’au build. Si le CLI local échoue (`api-upload-free`), redéployer depuis **Vercel Dashboard → Deployments → Redeploy** (branche `main`, environnement Production). Surveiller 48 h avant passage à 100 %.

Script Vercel (production) :

```powershell
$env:VERCEL_TOKEN = "<token>"   # optionnel si vercel login
.\scripts\enable-payment-v2-rollout-vercel.ps1 -RolloutPercent 50
.\scripts\enable-payment-v2-rollout-100.ps1   # checklist go/no-go intégrée
# Voir docs/runbooks/payment-v2-rollout-100.md
```

Tests contrat rollout :

```bash
npx vitest run src/lib/payments/__tests__/feature-flags.test.ts
npx playwright test tests/e2e/payment-v2-rollout.spec.ts --project=chromium
```

Le bucket canary est **déterministe par `storeId`** (`fnv1aHash` dans `feature-flags.ts`) : une boutique reste dans le même groupe entre les déploiements.

---

## 6. Checklist vendeur (onboarding)

- [ ] Dashboard → **Connexions paiement**
- [ ] Stripe Connect : onboarding Express → statut **Actif**
- [ ] PayPal Commerce : partner onboarding → merchant **Actif**
- [ ] Devise boutique compatible (EUR/USD pour Connect, XOF pour Moneroo)
- [ ] Test commande 1 € / 1 $ sur staging

---

## 7. Checklist QA go-live (smoke prod)

| #   | Scénario                    | Critère succès                                                                  |
| --- | --------------------------- | ------------------------------------------------------------------------------- |
| 1   | Digital XOF Moneroo         | `orders.payment_status=paid`, `status=completed`, download OK                   |
| 2   | Physique XOF                | `status=confirmed`, `store_earnings` créé                                       |
| 3   | Stripe EUR boutique Connect | Redirect Stripe → `/payment/success` → order paid                               |
| 4   | PayPal USD                  | Capture webhook → fulfillment                                                   |
| 5   | Remboursement digital       | `payment_status=refunded`, licence révoquée (`revoke_digital_access_for_order`) |
| 6   | Panier 2 boutiques + Stripe | Message « Moneroo requis » (garde multi-store)                                  |
| 7   | Idempotence webhook         | Rejouer event → `payment_webhook_events` duplicate, pas double fulfillment      |

Commandes :

```bash
npx vitest run src/lib/payments/__tests__/
VITE_PAYMENT_ORCHESTRATION_V2=true npx playwright test tests/e2e/checkout-multi-psp.spec.ts
npx playwright test tests/e2e/order-paid-fulfillment.spec.ts
```

---

## 8. Pipeline remboursements unifié (phase 3)

Tous les PSP convergent vers `apply-payment-refund.ts` :

| PSP             | Déclencheur                | Révocation digital                    |
| --------------- | -------------------------- | ------------------------------------- |
| Moneroo         | Webhook `refunded`         | RPC `revoke_digital_access_for_order` |
| Stripe Connect  | `charge.refunded`          | Idem                                  |
| PayPal Commerce | `PAYMENT.CAPTURE.REFUNDED` | Idem                                  |

Idempotence : `payment_webhook_events.external_event_id` (unique par provider) + `applyPaymentRefund` skip si `transaction.status=refunded`.

**Checklist QA sandbox Stripe** : [QA_STRIPE_REFUND_SANDBOX_CHECKLIST.md](./QA_STRIPE_REFUND_SANDBOX_CHECKLIST.md)

Monitoring :

```sql
SELECT provider, event_type, processing_error, created_at
FROM payment_webhook_events
WHERE processing_error IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- Gate P1 rollout V2 (p95 latence + backlog)
SELECT public.get_payment_webhook_health(24);
```

---

## 9. Rollback

1. Vercel : `VITE_PAYMENT_ORCHESTRATION_V2=false` → checkout Moneroo seul (comportement legacy).
2. Ne pas supprimer les connexions vendeur en base.
3. Webhooks Stripe/PayPal peuvent rester actifs (events ignorés côté checkout si V2 off).

---

## 10. Consolidation PR audit

| PR      | Statut     | Contenu                                                              |
| ------- | ---------- | -------------------------------------------------------------------- |
| #15     | Mergée     | P0 statuts commande, revenus, E2E fulfillment                        |
| #16     | Mergée     | P1 sécurité, P2 checkout/taxes/RLS                                   |
| #17     | Mergée     | P0 FedEx prod, services, abo physique                                |
| #18     | Mergée     | Orchestration V2 routing (inclus dans #19)                           |
| **#19** | **Mergée** | V2 + fulfillment unifié Moneroo + multi-store guard + PaymentSuccess |

**Ne pas rouvrir** #15–#18 : tout est sur `main` via la séquence ci-dessus.

---

## 11. Contacts & escalade

| Incident                             | Action                                              |
| ------------------------------------ | --------------------------------------------------- |
| Double paiement / double fulfillment | Vérifier `payment_webhook_events`, logs Edge        |
| Montant webhook ≠ commande           | `transaction_logs` event `webhook_amount_mismatch`  |
| Connect inactif au checkout          | `store_payment_connections.external_account_status` |
| Pas d’option Stripe au checkout      | Devise + V2 flag + connexion active                 |
