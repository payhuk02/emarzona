# Configuration Stripe Connect — Emarzona

Guide équipe pour activer les paiements **Stripe Connect** (vendeurs + checkout international).

**Projet Supabase :** `hbdnzajbyjakdhuavrvb`  
**Plan global :** [PAYMENT_ORCHESTRATION_IMPLEMENTATION_PLAN.md](./PAYMENT_ORCHESTRATION_IMPLEMENTATION_PLAN.md)  
**ADR technique :** [adr/ADR-001-stripe-connect-destination-charge.md](./adr/ADR-001-stripe-connect-destination-charge.md)

---

## Prérequis

- [ ] Migration SQL appliquée : `supabase/migrations/20260523120000__payment_orchestration_v2_foundation.sql`
- [ ] Edge Functions déployées : `stripe-connect-onboard`, `stripe-create-checkout`, `stripe-connect-webhook`
- [ ] Compte [Stripe Dashboard](https://dashboard.stripe.com) avec **Connect** activé (Express)
- [ ] Variable frontend : `VITE_PAYMENT_ORCHESTRATION_V2=true`

---

## 1. Clés API Stripe

1. [Stripe Dashboard](https://dashboard.stripe.com) → mode **Test** pour commencer.
2. **Developers → API keys**.
3. Copier la **Secret key** → `sk_test_...` (secret `STRIPE_SECRET_KEY`).

### Connect plateforme

1. **Settings → Connect** — compléter le profil plateforme (nom, URL, branding).
2. Emarzona utilise des comptes **Express** (onboarding via Account Links).

---

## 2. Webhook Stripe

1. **Developers → Webhooks** → **Add endpoint**.
2. **Endpoint URL** :

```
https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/stripe-connect-webhook
```

3. Événements à sélectionner :
   - `checkout.session.completed`
   - `account.updated`

4. Créer l’endpoint → **Signing secret** → **Reveal** → copier `whsec_...`  
   → secret Supabase **`STRIPE_WEBHOOK_SECRET`**.

### Test avec Stripe CLI (optionnel)

```bash
stripe listen --forward-to https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/stripe-connect-webhook
```

Utiliser le `whsec_...` affiché par la CLI **uniquement** en développement local.

---

## 3. Secrets Supabase

**Dashboard :** [Project Settings → Edge Functions → Secrets](https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/settings/functions)

| Secret                  | Exemple                                          | Description                    |
| ----------------------- | ------------------------------------------------ | ------------------------------ |
| `STRIPE_SECRET_KEY`     | `sk_test_...`                                    | Clé secrète API Stripe         |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...`                                      | Signature du webhook ci-dessus |
| `SITE_URL`              | `https://www.emarzona.com`                       | URL canonique du site          |
| `ALLOWED_ORIGINS`       | `https://www.emarzona.com,http://localhost:8080` | CORS checkout / onboarding     |

**Développement local :**

```
SITE_URL=http://localhost:8080
ALLOWED_ORIGINS=http://localhost:8080,https://www.emarzona.com
```

### Ligne de commande

```bash
cd c:\emarzona
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_VOTRE_CLE
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET
npx supabase secrets set SITE_URL=https://www.emarzona.com
npx supabase secrets set ALLOWED_ORIGINS=https://www.emarzona.com,http://localhost:8080
```

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis automatiquement aux Edge Functions.

---

## 4. Application frontend

Fichier `.env` :

```env
VITE_PAYMENT_ORCHESTRATION_V2=true
```

Redémarrer : `npm run dev`.

---

## 5. Parcours vendeur

1. Connexion vendeur → **Dashboard → Connexions paiement** (`/dashboard/payment-connections`).
2. **Connecter Stripe** → formulaire Stripe → retour sur `?stripe=return`.
3. Statut **Actif** = prêt pour encaisser en EUR/USD/GBP, etc.

---

## 6. Parcours acheteur

1. Boutique avec Stripe actif.
2. Produit en devise supportée (ex. EUR).
3. Checkout → **Carte bancaire (Stripe)**.
4. Carte test : `4242 4242 4242 4242`, date future, CVC quelconque.
5. Succès → `/payment/success?session_id=...&order_id=...&provider=stripe`

---

## 7. Vérifications

| Test                | Attendu                                                                               |
| ------------------- | ------------------------------------------------------------------------------------- |
| Webhook test Stripe | HTTP **200** (pas 400 signature)                                                      |
| Connect vendeur     | Redirection Stripe OK, statut Actif                                                   |
| Paiement test       | Commande `payment_status = paid`, fulfillment (cours, digital, bookings, certificats) |
| Logs Edge           | `stripe-connect-webhook` sans `processing_error` dans `payment_webhook_events`        |

---

## 8. Production

| Élément    | Test                  | Production                                     |
| ---------- | --------------------- | ---------------------------------------------- |
| Clé API    | `sk_test_...`         | `sk_live_...`                                  |
| Webhook    | Endpoint test ou live | Nouvel endpoint **Live** + nouveau `whsec_...` |
| `SITE_URL` | localhost             | `https://www.emarzona.com`                     |
| Connect    | Profil test           | Validation Stripe Connect live si requise      |

Mettre à jour les secrets Supabase, puis valider un paiement réel minimal.

---

## 9. Dépannage

| Symptôme                              | Solution                                                                                |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY is not configured` | Ajouter le secret Supabase (nom exact)                                                  |
| Webhook **400** Invalid signature     | Recopier `STRIPE_WEBHOOK_SECRET` depuis le bon endpoint Stripe                          |
| Pas d’option Stripe au checkout       | Vendeur Connect **Actif** + devise EUR/USD + `VITE_PAYMENT_ORCHESTRATION_V2=true`       |
| Commande non passée en `paid`         | Vérifier `transaction_id` dans metadata session Stripe + logs webhook                   |
| Certificat artiste absent             | Vérifier `certificate_of_authenticity` sur l’œuvre + logs `generate-artist-certificate` |
| Réservation service non confirmée     | Vérifier `booking_id` sur `order_items` + logs fulfillment                              |

---

## 10. Architecture (rappel)

```
Vendeur → stripe-connect-onboard → Compte Express Stripe
Acheteur → stripe-create-checkout → Checkout Stripe (destination charge + commission)
Stripe  → stripe-connect-webhook → paid + fulfillment (_shared/post-order-payment-fulfillment)
```

Le module `supabase/functions/_shared/post-order-payment-fulfillment.ts` assure la parité avec Moneroo :

- Confirmation des réservations service (`service_bookings` pending → confirmed)
- Certificats artiste (`generate-artist-certificate`) + provenance `artwork_provenance`
- Email `send-order-confirmation-email`
- Webhooks store `order.completed` / `payment.completed` / `service.booking_confirmed`

Après modification du webhook ou du module partagé :

```bash
npx supabase functions deploy stripe-connect-webhook --no-verify-jwt
npx supabase functions deploy stripe-refund --no-verify-jwt
```

Remboursements vendeur : `refundPayment()` depuis `@/lib/payments/refund-payment` (délègue à `stripe-refund`).

---

_Dernière mise à jour : 2026-05-23_
