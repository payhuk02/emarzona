# Checklist QA — Remboursements Stripe Connect (sandbox test mode)

**Version** : 1.0 · **Date** : 2026-06-03  
**Scope** : remboursements `stripe_connect` via UI vendeur (`stripe-refund`) et webhook `charge.refunded`  
**Références** : [STRIPE_CONNECT_SETUP.md](./STRIPE_CONNECT_SETUP.md) · [PAYMENT_ORCHESTRATION_V2_PROD_RUNBOOK.md](./PAYMENT_ORCHESTRATION_V2_PROD_RUNBOOK.md) · PR [#20](https://github.com/payhuk02/emarzona/pull/20) (phase 3)

**Environnements cibles** : preview Vercel ou staging Supabase (`hbdnzajbyjakdhuavrvb`) — **jamais prod live** pour cette checklist.

---

## 0. Matrice de couverture

| ID              | Scénario                                  | Voie             | Priorité |
| --------------- | ----------------------------------------- | ---------------- | -------- |
| **PF-01**       | Prérequis infra                           | —                | Bloquant |
| **PAY-01**      | Paiement test Connect (setup)             | Checkout         | Bloquant |
| **REF-VUI-01**  | Remboursement total via UI vendeur        | `stripe-refund`  | P0       |
| **REF-VUI-02**  | Remboursement partiel via UI              | `stripe-refund`  | P1       |
| **REF-WH-01**   | Remboursement depuis Stripe Dashboard     | Webhook seul     | P0       |
| **REF-IDEM-01** | Rejeu webhook (idempotence event)         | Webhook          | P0       |
| **REF-DUAL-01** | UI vendeur puis webhook `charge.refunded` | Double voie      | P0       |
| **REF-DIG-01**  | Révocation accès digital                  | DB trigger + RPC | P0       |
| **REF-REV-01**  | Recalcul `store_earnings`                 | Trigger SQL      | P1       |
| **REF-SEC-01**  | Non-propriétaire ne peut pas rembourser   | AuthZ            | P0       |
| **REF-UX-01**   | UX bouton + toasts + état commande        | Frontend         | P1       |
| **REF-AFF-01**  | Commission affilié post-remboursement     | Gap connu        | P2       |

---

## 1. Pré-vol (PF-01) — à cocher avant tout test

### 1.1 Stripe Dashboard (mode **Test**)

- [ ] Connect activé (comptes Express)
- [ ] Webhook endpoint configuré :
  ```
  https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/stripe-connect-webhook
  ```
- [ ] Événements abonnés : `checkout.session.completed`, **`charge.refunded`**, `account.updated`
- [ ] Clé secrète test `sk_test_...` disponible

### 1.2 Supabase Edge (staging / preview)

- [ ] Secrets : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SITE_URL`, `ALLOWED_ORIGINS`
- [ ] Functions déployées :
  ```bash
  npx supabase functions deploy stripe-connect-webhook --no-verify-jwt
  npx supabase functions deploy stripe-refund
  npx supabase functions deploy stripe-create-checkout
  npx supabase functions deploy stripe-connect-onboard --no-verify-jwt
  ```
- [ ] PR #20 mergée (pipeline `apply-payment-refund.ts` unifié)

### 1.3 Migrations SQL appliquées

Minimum pour remboursements :

- [ ] `20260523120000__payment_orchestration_v2_foundation.sql` (`payment_webhook_events`)
- [ ] `20250603120000__fix_order_status_paid_revenue_eligibility.sql` (trigger earnings refund)
- [ ] `20250603140000__audit_p1_security_refunds_downloads.sql` (`revoke_digital_access_for_order`)

Vérification rapide :

```bash
node scripts/verify-payment-v2-remote.mjs
```

### 1.4 Frontend

- [ ] `VITE_PAYMENT_ORCHESTRATION_V2=true` (ou preview Vercel sans override)
- [ ] Compte **vendeur A** : Stripe Connect statut **Actif** (`/dashboard/payment-connections`)
- [ ] Compte **acheteur B** (client)
- [ ] Compte **vendeur C** (pour test AuthZ, autre boutique)

### 1.5 Données de test à préparer

| Artefact             | Détail                                                                            |
| -------------------- | --------------------------------------------------------------------------------- |
| Produit digital EUR  | Prix fixe ex. 29,00 € — pour REF-DIG-01                                           |
| Produit physique EUR | Optionnel — fulfillment non révoqué, mais `payment_status` doit passer `refunded` |
| Carte test Stripe    | `4242 4242 4242 4242` · exp future · CVC `123` · ZIP `75001`                      |

Conserver dans un tableur : `order_id`, `transaction_id`, `payment_intent_id` (`pi_...`), montant, timestamp.

---

## 2. Setup paiement (PAY-01)

**Objectif** : créer une transaction `completed` remboursable.

### Étapes

1. Acheteur B → boutique vendeur A → produit digital EUR → checkout **Carte bancaire (Stripe)**.
2. Payer avec `4242 4242 4242 4242`.
3. Attendre redirection `/payment/success?...&provider=stripe`.
4. Vendeur A → commandes → ouvrir la commande → onglet paiements.

### Critères PASS

| Contrôle                                  | Attendu                                           |
| ----------------------------------------- | ------------------------------------------------- |
| `orders.payment_status`                   | `paid`                                            |
| `orders.status`                           | `completed` ou `confirmed`                        |
| `transactions.status`                     | `completed`                                       |
| `transactions.payment_provider`           | `stripe_connect`                                  |
| `transactions.provider_payment_intent_id` | `pi_...` non null                                 |
| Webhook `checkout.session.completed`      | `payment_webhook_events.processing_error` IS NULL |
| Accès digital                             | Licence `active`, token download valide           |

### SQL de capture (remplacer `:order_id`)

```sql
SELECT
  o.id AS order_id,
  o.payment_status,
  o.status AS order_status,
  t.id AS transaction_id,
  t.status AS tx_status,
  t.amount,
  t.currency,
  t.provider_payment_intent_id,
  t.payment_provider
FROM orders o
JOIN transactions t ON t.order_id = o.id
WHERE o.id = ':order_id';

SELECT provider, event_type, external_event_id, processing_error, processed_at
FROM payment_webhook_events
WHERE provider = 'stripe_connect'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 3. Remboursement total via UI vendeur (REF-VUI-01) — P0

**Voie** : `OrderDetailDialog` → `RefundTransactionButton` → `refundPayment()` → Edge `stripe-refund` → Stripe API + `applyPaymentRefund`.

### Étapes

1. Vendeur A connecté → détail commande PAY-01.
2. Cliquer **Rembourser** → montant = total → motif « Test QA sandbox » → **Confirmer**.
3. Attendre toast **Remboursement effectué** avec réf. `re_...`.

### Critères PASS — UX

- [ ] Toast succès avec `refund_id` (`re_...`), montant et devise
- [ ] Bouton **Rembourser** disparaît (`transaction.status !== 'completed'`)
- [ ] Badge commande / paiement affiche remboursé (si applicable UI)

### Critères PASS — Stripe Dashboard

- [ ] Payment → Remboursement `re_...` statut **Succeeded**
- [ ] Destination charge : montant reversé au compte Connect vendeur
- [ ] `application_fee` : commission plateforme remboursée proportionnellement (Connect)

### Critères PASS — Base de données

```sql
-- Transaction
SELECT id, status, refunded_at, metadata->'refund' AS refund_meta
FROM transactions
WHERE id = ':transaction_id';
-- Attendu: status = 'refunded', refunded_at NOT NULL,
-- metadata.refund.refund_id commence par 're_'

-- Commande
SELECT id, payment_status, updated_at
FROM orders
WHERE id = ':order_id';
-- Attendu: payment_status = 'refunded'

-- Journal
SELECT event_type, status, response_data, created_at
FROM transaction_logs
WHERE transaction_id = ':transaction_id'
ORDER BY created_at DESC;
-- Attendu: 1 ligne event_type = 'refund_completed'
```

### Critères PASS — Digital (REF-DIG-01 inclus)

```sql
SELECT id, status FROM digital_licenses WHERE order_id = ':order_id';
-- Attendu: status = 'revoked'

SELECT dt.id, dt.expires_at
FROM download_tokens dt
JOIN order_items oi ON oi.order_id = ':order_id'
JOIN digital_products dp ON dp.id = oi.digital_product_id
WHERE dt.product_id = dp.product_id;
-- Attendu: expires_at <= now()

SELECT id, expires_at FROM customer_downloads WHERE order_id = ':order_id';
-- Attendu: expires_at <= now()
```

### Critères PASS — Revenus vendeur (REF-REV-01)

```sql
SELECT store_id, total_revenue, total_orders, updated_at
FROM store_earnings
WHERE store_id = ':store_id';
-- Attendu: total_revenue EXCLUT la commande remboursée vs snapshot avant PAY-01
```

### Test négatif UX

- [ ] Acheteur B tente d’accéder au fichier digital → **403 / lien expiré**

---

## 4. Remboursement partiel (REF-VUI-02) — P1

**Prérequis** : nouvelle commande PAY-01 (montant ex. 40,00 €).

### Étapes

1. Rembourser **15,00 €** via UI (montant < total).

### Critères PASS

| Contrôle                 | Attendu actuel (documenter)                                             |
| ------------------------ | ----------------------------------------------------------------------- |
| Stripe                   | Remboursement partiel `re_...` succeeded                                |
| `transactions.status`    | `refunded` _(comportement actuel : pas de statut `partially_refunded`)_ |
| `metadata.refund.amount` | `15`                                                                    |
| Accès digital            | **Révoqué** _(comportement actuel : révocation totale même si partiel)_ |

> **Note produit** : valider avec le PO si un remboursement partiel doit conserver l’accès digital. Si non, le comportement actuel est cohérent. Sinon → backlog.

---

## 5. Remboursement via Stripe Dashboard uniquement (REF-WH-01) — P0

**Objectif** : valider la voie webhook sans passer par `stripe-refund`.

### Étapes

1. Créer une **nouvelle** commande payée (PAY-01).
2. **Ne pas** utiliser le bouton Rembourser Emarzona.
3. Stripe Dashboard → Payments → sélectionner le PaymentIntent → **Refund** → total.
4. Attendre 5–30 s (webhook).

### Critères PASS

- [ ] `payment_webhook_events` : event `charge.refunded`, `processing_error` IS NULL
- [ ] `transactions.status = 'refunded'`, `orders.payment_status = 'refunded'`
- [ ] Une seule entrée `transaction_logs.refund_completed`
- [ ] Révocation digital OK (mêmes requêtes REF-DIG-01)

### SQL monitoring webhook

```sql
SELECT
  external_event_id,
  event_type,
  processing_error,
  processed_at,
  payload->>'type' AS stripe_type
FROM payment_webhook_events
WHERE provider = 'stripe_connect'
  AND event_type = 'charge.refunded'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 6. Idempotence webhook (REF-IDEM-01) — P0

### Option A — Stripe CLI

```bash
stripe login
stripe listen --forward-to https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/stripe-connect-webhook

# Dans un autre terminal, rejouer un event charge.refunded capturé
stripe events resend evt_XXXXX
```

### Option B — Dashboard

Stripe → Webhooks → endpoint → event `charge.refunded` → **Resend**.

### Critères PASS

- [ ] 2e delivery HTTP **200** avec body `duplicate: true` OU event ignoré sans double side-effect
- [ ] Toujours **1 seul** `transaction_logs` `refund_completed` pour la transaction
- [ ] Pas de double révocation (licences déjà `revoked` — idempotent)

```sql
SELECT COUNT(*) AS refund_log_count
FROM transaction_logs
WHERE transaction_id = ':transaction_id'
  AND event_type = 'refund_completed';
-- Attendu: 1
```

---

## 7. Double voie UI + webhook (REF-DUAL-01) — P0

**Scénario réel** : le vendeur rembourse via Emarzona (`stripe-refund` applique la DB **avant** l’arrivée du webhook).

### Étapes

1. Nouvelle commande payée.
2. Rembourser via **UI vendeur** (REF-VUI-01).
3. Surveiller l’arrivée du webhook `charge.refunded` (Stripe Dashboard → Webhooks → logs).

### Critères PASS

- [ ] État DB après UI : `refunded` (`metadata.refund.refund_id` = `re_...`)
- [ ] Webhook `charge.refunded` post-UI : HTTP **200**, `processing_error` IS NULL
- [ ] Logs Edge : `charge.refunded skipped: transaction already refunded`
- [ ] Toujours **1 seul** `transaction_logs.refund_completed`

**Requête de validation** :

```sql
SELECT external_event_id, event_type, processing_error, created_at
FROM payment_webhook_events
WHERE provider = 'stripe_connect'
  AND event_type = 'charge.refunded'
ORDER BY created_at DESC
LIMIT 5;
-- Attendu: processing_error IS NULL pour l'event post-UI
```

> **Corrigé 2026-06-03** : skip webhook si `transactions.status = refunded` ; voie Dashboard seule résout `re_...` via `charge.refunds` ou `GET /v1/refunds?charge=ch_...`.

---

## 8. Sécurité (REF-SEC-01) — P0

### 8.1 AuthZ vendeur

1. Vendeur C (autre boutique) ou acheteur B ouvre DevTools.
2. Appeler Edge `stripe-refund` avec `transactionId` de vendeur A :

```bash
curl -X POST "https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/stripe-refund" \
  -H "Authorization: Bearer <JWT_non_proprietaire>" \
  -H "Content-Type: application/json" \
  -d "{\"transactionId\": \"<transaction_id_vendeur_A>\"}"
```

- [ ] Réponse **403/401** — pas de remboursement Stripe
- [ ] `transactions.status` reste `completed`

### 8.2 Provider mismatch

- [ ] Rembourser une transaction `moneroo_platform` via `stripe-refund` → erreur « Not a Stripe Connect transaction »

### 8.3 Webhook signature

```bash
curl -X POST "https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/stripe-connect-webhook" \
  -H "Content-Type: application/json" \
  -d "{}"
```

- [ ] HTTP **400** Invalid signature

---

## 9. UX / régression (REF-UX-01) — P1

- [ ] Bouton **Rembourser** visible uniquement si `transaction.status === 'completed'`
- [ ] Montant max = montant transaction (validation input)
- [ ] Loading spinner pendant mutation (`useRefundTransaction`)
- [ ] Échec Stripe (ex. remboursement double) → toast destructif, pas de crash page
- [ ] Notification client (`notifyPaymentRefunded`) — email/in-app si configuré staging
- [ ] Webhook store `payment.refunded` émis (`trigger_webhook`) — vérifier logs si intégration active

---

## 10. Affiliés (REF-AFF-01) — P2 / gap connu

- [ ] Commande avec cookie affilié → commission créée au paiement
- [ ] Après remboursement : **vérifier manuellement** si `affiliate_commissions` est annulée

```sql
SELECT id, status, commission_amount, order_id
FROM affiliate_commissions
WHERE order_id = ':order_id';
```

> **Gap audit** : pas de trigger SQL « refund → reverse affiliate » identifié. Documenter le statut commission post-remboursement pour le PO (backlog phase 4).

---

## 11. Outils & commandes utiles

### Stripe CLI — refund manuel (debug)

```bash
stripe refunds create --payment-intent pi_XXXXX
```

### Logs Edge Function

Supabase Dashboard → Edge Functions → `stripe-connect-webhook` / `stripe-refund` → Logs (filtrer `applyPaymentRefund`, `charge.refunded`).

### Tests unitaires locaux

```bash
npx vitest run src/lib/payments/__tests__/refund-payment.test.ts
```

---

## 12. Grille de sign-off

| ID          | Exécuté par | Date | Env | Résultat              | Notes     |
| ----------- | ----------- | ---- | --- | --------------------- | --------- |
| PF-01       |             |      |     | ☐ PASS ☐ FAIL         |           |
| PAY-01      |             |      |     | ☐ PASS ☐ FAIL         | order_id: |
| REF-VUI-01  |             |      |     | ☐ PASS ☐ FAIL         | re_id:    |
| REF-VUI-02  |             |      |     | ☐ PASS ☐ FAIL ☐ N/A   |           |
| REF-WH-01   |             |      |     | ☐ PASS ☐ FAIL         | evt_id:   |
| REF-IDEM-01 |             |      |     | ☐ PASS ☐ FAIL         |           |
| REF-DUAL-01 |             |      |     | ☐ PASS ☐ FAIL ☐ KNOWN |           |
| REF-DIG-01  |             |      |     | ☐ PASS ☐ FAIL         |           |
| REF-REV-01  |             |      |     | ☐ PASS ☐ FAIL         |           |
| REF-SEC-01  |             |      |     | ☐ PASS ☐ FAIL         |           |
| REF-UX-01   |             |      |     | ☐ PASS ☐ FAIL         |           |
| REF-AFF-01  |             |      |     | ☐ PASS ☐ FAIL ☐ GAP   |           |

**Décision release prod V2 remboursements Stripe** :

- [ ] Tous P0 PASS (REF-DUAL-01 inclus)
- [ ] PO signe comportement remboursement partiel + digital
- [ ] Runbook section 8 cochée

**Signataires** : QA ******\_\_****** · Tech lead ******\_\_****** · Produit ******\_\_******

---

## 13. Annexe — cartes & cas Stripe test mode

| Cas         | Carte / action        | Usage                                     |
| ----------- | --------------------- | ----------------------------------------- |
| Paiement OK | `4242 4242 4242 4242` | PAY-01                                    |
| 3DS         | `4000 0025 0000 3155` | Optionnel — checkout puis refund          |
| Refus       | `4000 0000 0000 0002` | Hors scope refund (pas de tx `completed`) |

Documentation Stripe : [Testing](https://docs.stripe.com/testing) · [Connect refunds](https://docs.stripe.com/connect/charges#refunds)

---

_Dernière mise à jour : 2026-06-03 — alignée sur `apply-payment-refund.ts`, `stripe-refund`, `stripe-connect-webhook` (PR #20)._
