# Rapport d'exécution — REF-DUAL-01 staging

**Date** : 2026-06-03  
**Projet** : `hbdnzajbyjakdhuavrvb` (Supabase linked)  
**Checklist** : [QA_STRIPE_REFUND_SANDBOX_CHECKLIST.md](./QA_STRIPE_REFUND_SANDBOX_CHECKLIST.md) §7

---

## Verdict

| Résultat                  | Détail                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------- |
| **REF-DUAL-01**           | **NON EXÉCUTÉ** (bloqué prérequis PAY-01 / PF-01)                                   |
| **Déploiement correctif** | **FAIT** — `stripe-connect-webhook` + `stripe-refund` déployés avec fix REF-DUAL-01 |
| **PR #21**                | Ouverte (correctif pas encore sur `main` au moment du run)                          |

---

## Actions réalisées

1. **Deploy Edge** (branche `fix/audit-r1-ref-dual-01-qa-checklist`) :
   - `stripe-connect-webhook` — skip `charge.refunded` si déjà `refunded` + lookup `re_...`
   - `stripe-refund`
2. **Audit données staging** (`npx supabase db query --linked`) :
   - Connexions PSP : **11× `moneroo_platform` active**, **0× `stripe_connect`**
   - Transactions : **0× `stripe_connect`** (uniquement Moneroo pending/processing)
   - Utilisateurs E2E `vendor-test@emarzona.com` / `buyer-test@emarzona.com` : **absents**
3. **Secrets Supabase** : `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` **non listés** dans les secrets projet
4. **Script automatisé** : `scripts/qa-ref-dual-01-staging.mjs` (réexécution après déblocage)

---

## Bloqueurs (ordre de résolution)

### B1 — Stripe Connect non configuré sur staging

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

Voir [STRIPE_CONNECT_SETUP.md](./STRIPE_CONNECT_SETUP.md) §2–3.

### B2 — Aucun vendeur Connect actif

1. Vendeur → `/dashboard/payment-connections` → **Connecter Stripe** (mode test)
2. Vérifier :

```bash
npx supabase db query --linked "SELECT store_id, provider, external_account_status FROM store_payment_connections WHERE provider = 'stripe_connect';"
```

### B3 — Aucune transaction payée Stripe (PAY-01)

1. Produit digital **EUR** publié
2. Checkout **Carte bancaire (Stripe)** — carte `4242 4242 4242 4242`
3. Noter `transaction_id` / `order_id`

### B4 — Compte vendeur pour `stripe-refund`

Créer ou utiliser un compte dont `stores.user_id` = propriétaire de la transaction, puis :

```bash
# sb_secret service role (pas legacy JWT — désactivé sur ce projet)
set SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
set STRIPE_SECRET_KEY=sk_test_...
set VENDOR_EMAIL=...
set VENDOR_PASSWORD=...
node scripts/qa-ref-dual-01-staging.mjs
```

---

## Critères REF-DUAL-01 (à valider après déblocage)

- [ ] UI remboursement → `transactions.status = refunded`, `metadata.refund.refund_id` = `re_...`
- [ ] Webhook `charge.refunded` → `payment_webhook_events.processing_error` IS NULL
- [ ] Logs : `charge.refunded skipped: transaction already refunded`
- [ ] `transaction_logs` : **1** seul `refund_completed`

```sql
SELECT external_event_id, processing_error, processed_at
FROM payment_webhook_events
WHERE provider = 'stripe_connect' AND event_type = 'charge.refunded'
ORDER BY created_at DESC LIMIT 5;
```

---

## Prochaine exécution (commande unique)

```bash
cd c:\emarzona
npx supabase functions deploy stripe-connect-webhook --no-verify-jwt
npx supabase functions deploy stripe-refund
# Après B1–B3 :
node scripts/qa-ref-dual-01-staging.mjs
# exit 0 = PASS
```

---

_Signé QA automatisé — re-run après merge PR #21 + secrets Stripe + PAY-01._
