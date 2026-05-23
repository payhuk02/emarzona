# Configuration PayPal Commerce — Emarzona

Guide équipe pour activer **PayPal Commerce Platform** (onboarding vendeur + checkout + webhooks).

**Projet Supabase :** `hbdnzajbyjakdhuavrvb`  
**Plan global :** [PAYMENT_ORCHESTRATION_IMPLEMENTATION_PLAN.md](./PAYMENT_ORCHESTRATION_IMPLEMENTATION_PLAN.md)

---

## Prérequis

- [ ] Migration `20260523120000__payment_orchestration_v2_foundation.sql` appliquée
- [ ] Compte **PayPal Developer** avec application **Partner** (Commerce Platform)
- [ ] `VITE_PAYMENT_ORCHESTRATION_V2=true` en frontend
- [ ] Edge Functions déployées : `paypal-partner-onboard`, `paypal-create-order`, `paypal-webhook`, `paypal-refund`

---

## 1. Credentials PayPal

1. [developer.paypal.com](https://developer.paypal.com) → **Apps & Credentials**
2. Créer / ouvrir l’app **Partner** (sandbox pour les tests)
3. Noter **Client ID** et **Secret**

| Secret Supabase                                   | Description                                                  |
| ------------------------------------------------- | ------------------------------------------------------------ |
| `PAYPAL_CLIENT_ID` ou `PAYPAL_PARTNER_CLIENT_ID`  | Client ID partenaire                                         |
| `PAYPAL_CLIENT_SECRET` ou `PAYPAL_PARTNER_SECRET` | Secret partenaire                                            |
| `PAYPAL_MODE`                                     | `sandbox` (défaut) ou `live`                                 |
| `PAYPAL_PARTNER_ID`                               | Merchant ID de la plateforme Emarzona (pour sync onboarding) |
| `PAYPAL_WEBHOOK_ID`                               | ID du webhook créé dans le dashboard PayPal                  |
| `PAYPAL_BN_CODE`                                  | (Optionnel) BN code partenaire PayPal                        |
| `SITE_URL`                                        | URL canonique du site                                        |
| `ALLOWED_ORIGINS`                                 | Origines CORS autorisées                                     |

```bash
npx supabase secrets set PAYPAL_CLIENT_ID=VOTRE_CLIENT_ID
npx supabase secrets set PAYPAL_CLIENT_SECRET=VOTRE_SECRET
npx supabase secrets set PAYPAL_MODE=sandbox
npx supabase secrets set PAYPAL_PARTNER_ID=VOTRE_MERCHANT_ID_PLATEFORME
npx supabase secrets set PAYPAL_WEBHOOK_ID=VOTRE_WEBHOOK_ID
npx supabase secrets set SITE_URL=https://www.emarzona.com
```

---

## 2. Webhook PayPal

1. Dashboard PayPal → **Webhooks** → **Add webhook**
2. URL :

```
https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/paypal-webhook
```

3. Événements recommandés :
   - `MERCHANT.ONBOARDING.COMPLETED`
   - `CUSTOMER.MERCHANT-INTEGRATION.COMPLETED`
   - `CHECKOUT.ORDER.APPROVED`
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.REFUNDED`
   - `MERCHANT.PARTNER-CONSENT.REVOKED`

4. Copier l’**Webhook ID** → `PAYPAL_WEBHOOK_ID`

---

## 3. Déploiement Edge Functions

```bash
npx supabase functions deploy paypal-partner-onboard --no-verify-jwt
npx supabase functions deploy paypal-create-order --no-verify-jwt
npx supabase functions deploy paypal-webhook --no-verify-jwt
npx supabase functions deploy paypal-refund --no-verify-jwt
npx supabase functions deploy stripe-refund --no-verify-jwt
```

`paypal-webhook` : JWT désactivé (signature PayPal uniquement).

---

## 4. Parcours vendeur

1. **Dashboard → Connexions paiement**
2. **Connecter PayPal** → onboarding PayPal Partner Referrals
3. Retour `?paypal=return` → sync automatique du statut
4. Statut **Actif** = checkout PayPal disponible (USD/EUR/GBP…)

---

## 5. Parcours acheteur

1. Boutique avec PayPal actif, produit en EUR/USD
2. Checkout → **PayPal**
3. Redirection PayPal → approbation → capture automatique (webhook)
4. Succès → `/payment/success?token=...&order_id=...&provider=paypal`

Fulfillment unifié via [`post-order-payment-fulfillment.ts`](../supabase/functions/_shared/post-order-payment-fulfillment.ts) (bookings, certificats artiste, emails).

---

## 6. Architecture

```
Vendeur → paypal-partner-onboard → Partner Referral
Acheteur → paypal-create-order → Order PayPal (payee + platform_fees)
PayPal  → paypal-webhook → capture + completeTransactionAndOrder + fulfillment
```

---

## 7. Remboursements

Côté vendeur (dashboard / admin), appeler le service unifié :

```typescript
import { refundPayment } from '@/lib/payments/refund-payment';

await refundPayment({
  transactionId: '...',
  amount: 50, // optionnel — total si omis
  reason: 'Demande client',
});
```

- **PayPal** : Edge `paypal-refund` → `POST /v2/payments/captures/{id}/refund`
- **Stripe** : Edge `stripe-refund` → Refund API
- **Moneroo** : `refundMonerooPayment` (existant)

Webhook `PAYMENT.CAPTURE.REFUNDED` synchronise aussi la DB.

---

## 8. Tests E2E

```bash
E2E_VENDOR_EMAIL=... E2E_VENDOR_PASSWORD=... npx playwright test tests/e2e/paypal-commerce-flow.spec.ts
```

---

## 9. Dépannage

| Symptôme                        | Solution                                              |
| ------------------------------- | ----------------------------------------------------- |
| Pas d’option PayPal au checkout | Connexion **active** + devise USD/EUR + flag V2       |
| Onboarding bloqué               | Vérifier `PAYPAL_PARTNER_ID` + compte Partner validé  |
| Webhook 400                     | `PAYPAL_WEBHOOK_ID` + événements corrects             |
| Commande non `paid`             | Logs `paypal-webhook`, `custom_id` = `transaction_id` |

---

_Dernière mise à jour : 2026-05-23_
