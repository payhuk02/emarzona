# Plan d'implémentation global — Orchestration paiements multi-PSP (Emarzona)

**Version** : 1.0  
**Date** : 2026-05-23  
**Statut** : Plan de référence (pré-développement)  
**Documents liés** : [ARCHITECTURE.md](./ARCHITECTURE.md), [AUDIT_ECOMMERCE_2026.md](./AUDIT_ECOMMERCE_2026.md), [SECURE_DEPLOY_CHECKLIST.md](../SECURE_DEPLOY_CHECKLIST.md)

---

## 1. Résumé exécutif

### Vision

Permettre à chaque vendeur Emarzona de **connecter ses propres comptes de paiement internationaux** (Stripe Connect, PayPal Commerce Platform, puis extensions) tout en conservant **Moneroo** comme rail **plateforme** pour l'Afrique francophone (XOF, mobile money, simplicité).

L'acheteur paie via le PSP **optimal** selon boutique, devise, pays et disponibilité des connexions — sans jamais exposer de clés secrètes côté navigateur.

### Objectifs mesurables (12 mois)

| Objectif                          | Indicateur cible                                                 |
| --------------------------------- | ---------------------------------------------------------------- |
| Couverture géographique           | ≥ 80 % des pays « carte » couverts via Stripe ou PayPal connecté |
| Conversion checkout international | +20 % vs baseline Moneroo seul (stores avec Connect actif)       |
| Time-to-onboard paiement vendeur  | < 10 min (Stripe Express)                                        |
| Incidents double-fulfillment      | 0 (idempotence webhooks)                                         |
| Disponibilité orchestrateur       | 99,9 %                                                           |

### Non-objectifs (phase 1)

- Saisie manuelle de clés API secrètes par le vendeur (mode « legacy » désactivé par défaut).
- Crypto, BNPL locaux, 10+ PSP en parallèle.
- Remplacement immédiat de Moneroo sur le marché africain.
- Paiement unique fusionné pour paniers **multi-boutiques** multi-PSP (traité en phase 4).

---

## 2. État actuel (baseline technique)

### Ce qui existe

| Élément              | Emplacement                                                          | État                                                    |
| -------------------- | -------------------------------------------------------------------- | ------------------------------------------------------- |
| Rail production      | `src/lib/payment-service.ts`                                         | **Moneroo uniquement**                                  |
| Classes PSP          | `src/integrations/payments/stripe.ts`, `paypal.ts`, `flutterwave.ts` | Code présent, **non branché** au checkout               |
| Préférences boutique | `stores.enabled_payment_providers` (TEXT[])                          | Défaut `['moneroo']`                                    |
| Sélecteur checkout   | `src/components/checkout/PaymentProviderSelector.tsx`                | Type union = `'moneroo'` seul                           |
| Webhook production   | `supabase/functions/moneroo-webhook`                                 | Fulfillment riche (bookings, certificats artiste, etc.) |
| Transactions         | Table `transactions`                                                 | `payment_provider` + colonnes Moneroo/Paydunya legacy   |
| Commandes            | 5 hooks `useCreate*Order`                                            | Tous appellent `initiateMonerooPayment`                 |
| Checkout panier      | `src/pages/Checkout.tsx`                                             | `selectedPaymentProvider: 'moneroo'`                    |
| Fulfillment SQL      | Triggers digital / course enrollment                                 | Déclenchés sur `orders.payment_status`                  |

### Lacunes critiques

1. Pas de table **connexions OAuth** vendeur ↔ PSP.
2. Pas de **routage** par store / devise / pays.
3. Pas de webhooks Stripe / PayPal normalisés vers le même pipeline fulfillment.
4. Pas de gestion **commission plateforme** (`application_fee`) sur rails connectés.
5. Panier multi-store : un seul flux Moneroo aujourd'hui.

---

## 3. Architecture cible

### 3.1 Principes directeurs

1. **Server-only secrets** : toute création de session checkout et vérification webhook passe par **Supabase Edge Functions** (ou service backend dédié).
2. **Un événement canonique** : `PaymentEvent { type, orderId, provider, externalId, amount, currency, metadata }` — tous les PSP convergent ici.
3. **Un fulfillment** : réutiliser triggers SQL + logique `moneroo-webhook` via handler partagé, pas 3 copies.
4. **OAuth Connect** : Stripe Connect Express/Standard ; PayPal Partner Referrals — pas de `sk_live_` en base en clair.
5. **Moneroo = plateforme** : vendeur sans Connect utilise le rail Emarzona ; reversement via `store_withdrawals` existant.

### 3.2 Diagramme logique

```
┌─────────────────────────────────────────────────────────────────┐
│                        COUCHE PRÉSENTATION                       │
│  Checkout.tsx │ checkout/Checkout.tsx │ useCreate*Order (×5)    │
│  PaymentProviderSelector │ Dashboard › Connexions paiement      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│              payment-orchestrator (src/lib + Edge)                 │
│  resolveProvider(storeId, currency, country, amount, cartContext) │
│  createCheckoutSession(provider, order, connection)              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Moneroo       │     │ Stripe Connect  │     │ PayPal Commerce │
│ (plateforme)  │     │ (compte vendeur)│     │ (merchant vend.)│
└───────┬───────┘     └────────┬────────┘     └────────┬────────┘
        │                      │                       │
        └──────────────────────┼───────────────────────┘
                               ▼
              ┌────────────────────────────────┐
              │ payment-events-processor       │
              │ (idempotent, order paid)       │
              └────────────────┬───────────────┘
                               ▼
              ┌────────────────────────────────┐
              │ orders.payment_status = paid   │
              │ + triggers SQL (5 verticaux)   │
              │ + webhook side-effects         │
              └────────────────────────────────┘
```

### 3.3 Modèle de responsabilité des fonds

| Rail               | Merchant of record                         | Commission Emarzona      | Reversement vendeur |
| ------------------ | ------------------------------------------ | ------------------------ | ------------------- |
| Moneroo plateforme | Emarzona (puis split manuel / withdrawals) | Config plateforme        | `store_withdrawals` |
| Stripe Connect     | Vendeur (connected account)                | `application_fee_amount` | Automatique Stripe  |
| PayPal Commerce    | Vendeur (merchant ID)                      | Platform fee sur capture | Automatique PayPal  |

---

## 4. Modèle de données

### 4.1 Nouvelle table : `store_payment_connections`

```sql
-- Migration conceptuelle (à affiner en revue sécurité)
CREATE TABLE public.store_payment_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN (
    'moneroo_platform',
    'stripe_connect',
    'paypal_commerce',
    'flutterwave_connect'
  )),
  connection_mode TEXT NOT NULL CHECK (connection_mode IN (
    'platform_default',   -- Moneroo géré par Emarzona
    'oauth_connected'     -- Compte connecté vendeur
  )),
  external_account_id TEXT,          -- acct_xxx / merchant_id
  external_account_status TEXT,      -- pending | active | restricted | disabled
  capabilities JSONB DEFAULT '{}',  -- card_payments, transfers, etc.
  default_currency TEXT,
  livemode BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (store_id, provider)
);
```

**Secrets** : ne pas stocker `sk_*` en clair. Options :

- **Recommandé** : Stripe/PayPal stockent les tokens côté provider ; Emarzona ne garde que `external_account_id` + refresh token chiffré dans **Supabase Vault** (`vault.secrets`) référencé par `connection_id`.
- **Interdit phase 1** : colonne `api_secret TEXT` non chiffrée.

### 4.2 Table : `payment_webhook_events` (idempotence)

```sql
CREATE TABLE public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  transaction_id UUID REFERENCES public.transactions(id),
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (provider, external_event_id)
);
```

### 4.3 Évolutions tables existantes

| Table / colonne                        | Action                                                                                                                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stores.enabled_payment_providers`     | Étendre valeurs : `stripe_connect`, `paypal_commerce`, `flutterwave_connect` ; sync auto depuis `store_payment_connections` actives                                                                                       |
| `stores.platform_fee_percent`          | **Nouveau** — commission par défaut (NUMERIC), surcharge possible par store                                                                                                                                               |
| `transactions`                         | Colonnes génériques : `provider_checkout_url`, `provider_session_id`, `provider_payment_intent_id`, `connected_account_id`, `application_fee_amount` ; déprécier progressivement colonnes Moneroo-only dans nouveaux flux |
| `orders`                               | `payment_provider_used`, `payment_connection_id` pour audit                                                                                                                                                               |
| `profiles.payment_provider_preference` | Étendre CHECK ; préférence acheteur parmi PSP **disponibles pour la boutique**                                                                                                                                            |

### 4.4 RLS

- Vendeur : CRUD ses `store_payment_connections` pour `store_id` ∈ ses boutiques.
- Acheteur : aucune lecture des connexions.
- Service role : Edge Functions uniquement pour secrets et webhooks.

---

## 5. Moteur de routage (règles métier)

### 5.1 Fonction `resolvePaymentProvider(input)`

**Entrée** : `storeId`, `amount`, `currency`, `buyerCountry?`, `productTypes[]`, `isMultiStoreCart`, `buyerPreferredProvider?`

**Sortie** : `{ provider, connectionId, reason }` ou erreur explicite.

### 5.2 Priorité (ordre décroissant)

1. **Contrainte légale / admin** : store forcé Moneroo plateforme (flag `stores.force_platform_payments`).
2. **Connexion active** compatible devise + pays acheteur :
   - USD/EUR/GBP/… + carte → `stripe_connect` si `capabilities.card_payments`.
   - Préférence acheteur PayPal si les deux actifs → `paypal_commerce`.
3. **Moneroo plateforme** si devise ∈ XOF/XAF/etc. ou aucun Connect.
4. **Échec** : message vendeur « Configurez Stripe ou PayPal pour vendre en {currency} ».

### 5.3 Cas spéciaux par verticale

| Verticale            | Règle additionnelle                                                   |
| -------------------- | --------------------------------------------------------------------- |
| Service              | Pas de panier — provider résolu sur `useCreateServiceOrder`           |
| Digital subscription | Stripe Billing sur connected account si `license_type = subscription` |
| Artiste              | PayPal prioritaire si `payment_options` inclut PayPal et connecté     |
| Cours                | Stripe recommandé EU/US ; Moneroo Afrique                             |
| Physique             | Stripe/PayPal si international ; Moneroo + mobile money local         |

### 5.4 Multi-boutique (phase 4)

- **Phase 1–3** : un `store_id` par session checkout (déjà groupé dans `Checkout.tsx`).
- **Phase 4** : N sessions de paiement ou agrégation plateforme Moneroo + split ledger interne.

---

## 6. Plan de phases (global ~20 semaines)

### Phase 0 — Cadrage & fondations (Semaines 1–2)

**Livrables**

- [x] Spécification API interne `PaymentOrchestrator` (TypeScript interfaces) — `src/lib/payments/`
- [ ] Comptes Stripe Connect **plateforme** + PayPal Partner (sandbox).
- [ ] Matrice conformité (CGU vendeur, KYC, PCI SAQ-A).
- [x] ADR Destination Charge — [`docs/adr/ADR-001-stripe-connect-destination-charge.md`](./adr/ADR-001-stripe-connect-destination-charge.md)
- [x] Feature flag `PAYMENT_ORCHESTRATION_V2` — `VITE_PAYMENT_ORCHESTRATION_V2` + `platform_settings.payment_orchestration_v2`

**Owners** : Lead Platform + Legal/Product

**Critères de sortie** : ADR signés, comptes sandbox opérationnels, schéma SQL revu sécurité.

---

### Phase 1 — Données & orchestrateur cœur (Semaines 3–5)

**Livrables**

| #   | Tâche                                                                                                | Fichiers / zones                                                              | Statut                    |
| --- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------- |
| 1.1 | Migrations `store_payment_connections`, `payment_webhook_events`, colonnes `stores` / `transactions` | `supabase/migrations/20260523120000__payment_orchestration_v2_foundation.sql` | ✅                        |
| 1.2 | Module `src/lib/payments/orchestrator/` : `resolveProvider`, `createPayment`, types canoniques       | `src/lib/payments/`                                                           | ✅                        |
| 1.3 | Refactor `payment-service.ts` → délègue à l'orchestrateur ; Moneroo = adapter                        | `src/lib/payment-service.ts`                                                  | ✅ (flag off par défaut)  |
| 1.4 | Adapter pattern : `src/lib/payments/adapters/moneroo-adapter.ts`                                     | Nouveau                                                                       | ✅                        |
| 1.5 | RPC `get_store_payment_options(store_id, currency, country)`                                         | Migration SQL                                                                 | ✅                        |
| 1.6 | Régénération types `npm run supabase:types`                                                          | `types.ts`                                                                    | ⏳ après deploy migration |
| 1.7 | Tests unitaires routage (matrice devise/pays)                                                        | `src/lib/payments/__tests__/resolve-provider.test.ts`                         | ✅                        |

**Critères de sortie** : Moneroo inchangé en prod via adapter ; routage unitaire 100 % couvert ; zéro régression checkout.

---

### Phase 2 — Stripe Connect (Semaines 6–9)

**Livrables**

| #   | Tâche                               | Détail                                                       | Statut |
| --- | ----------------------------------- | ------------------------------------------------------------ | ------ |
| 2.1 | Edge `stripe-connect-onboard`       | Express Account + Account Link                               | ✅     |
| 2.2 | Edge `stripe-connect-webhook`       | `checkout.session.completed`, `account.updated`              | ✅     |
| 2.3 | Edge `stripe-create-checkout`       | Destination charge + `application_fee_amount`                | ✅     |
| 2.4 | UI vendeur `PaymentConnectionsPage` | `/dashboard/payment-connections`                             | ✅     |
| 2.5 | Orchestrateur + adapter Stripe      | `stripe-connect-adapter.ts`                                  | ✅     |
| 2.6 | `PaymentProviderSelector` dynamique | `useStorePaymentOptions` + RPC                               | ✅     |
| 2.7 | Handler fulfillment partagé         | `_shared/post-order-payment-fulfillment.ts` (Stripe webhook) | ✅     |
| 2.8 | Guide ops Stripe                    | `docs/STRIPE_CONNECT_SETUP.md`                               | ✅     |
| 2.8 | E2E Stripe test mode                | `tests/e2e/stripe-connect-checkout.spec.ts`                  | ⏳     |

**Modèle Stripe retenu (recommandé)** : **Destination Charge** — `payment_intent_data[transfer_data][destination] = connected_account_id`, `application_fee_amount = platform_fee`.

**Critères de sortie** : Vendeur sandbox connecté ; achat digital + physique test ; order `paid` ; licence / stock / enrollment OK.

---

### Phase 3 — PayPal Commerce Platform (Semaines 10–12)

**Livrables**

| #   | Tâche                                      | Détail                                                | Statut |
| --- | ------------------------------------------ | ----------------------------------------------------- | ------ |
| 3.1 | Edge `paypal-partner-onboard`              | Partner referral, merchant integration                | ✅     |
| 3.2 | Edge `paypal-create-order`                 | Checkout redirect + platform fee                      | ✅     |
| 3.3 | Edge `paypal-webhook`                      | Capture + `post-order-payment-fulfillment`            | ✅     |
| 3.4 | UI : bouton « Connecter PayPal »           | `PayPalConnectCard` + page connexions                 | ✅     |
| 3.5 | Checkout : orchestrateur `paypal_commerce` | Redirect PayPal (pas SDK inline)                      | ✅     |
| 3.6 | Remboursements PayPal + Stripe             | `paypal-refund`, `stripe-refund`, `refund-payment.ts` | ✅     |
| 3.7 | E2E PayPal sandbox                         | `tests/e2e/paypal-commerce-flow.spec.ts`              | ✅     |
| 3.8 | Guide ops                                  | `docs/PAYPAL_COMMERCE_SETUP.md`                       | ✅     |
| 3.9 | Refactor `moneroo-webhook`                 | `post-order-payment-fulfillment` partagé              | ✅     |

**Critères de sortie** : Parité fonctionnelle avec Stripe sur one-time ; commissions enregistrées en DB.

---

### Phase 4 — Consolidation & mondialisation (Semaines 13–16)

**Livrables**

| #   | Tâche                                        | Détail                                                          |
| --- | -------------------------------------------- | --------------------------------------------------------------- |
| 4.1 | Flutterwave Connect (optionnel P1)           | Adapter + onboarding                                            |
| 4.2 | Dashboard analytics PSP                      | GMV par provider, taux échec, comptes restricted                |
| 4.3 | Alerting                                     | Compte Stripe `restricted` → email vendeur + bannière dashboard |
| 4.4 | Multi-store checkout v2                      | Design N paiements ou ledger                                    |
| 4.5 | Abonnements digital/cours sur Stripe Billing | `digital_product_subscriptions`                                 |
| 4.6 | Documentation vendeur + aide in-app          | `/docs/payments`                                                |
| 4.7 | Migration données                            | Backfill `payment_provider` sur transactions historiques        |

**Critères de sortie** : 3 rails en prod (Moneroo + Stripe + PayPal) ; runbook incidents ; formation support.

---

### Phase 5 — Durcissement & scale (Semaines 17–20)

**Livrables**

- Load test webhooks (1000 events/min idempotents).
- Audit PCI / penetration test scope checkout.
- Rate limiting Edge Functions.
- Circuit breaker si API Stripe down → fallback Moneroo (configurable).
- Suppression code mort : appels directs `initiateMonerooPayment` hors orchestrateur.
- `lint:ci:critical` étendu aux nouveaux modules paiement.

---

## 7. Spécification Edge Functions

| Function                   | Méthode  | Rôle                                                   |
| -------------------------- | -------- | ------------------------------------------------------ |
| `payment-resolve-provider` | POST     | Résolution serveur (anti-tampering)                    |
| `payment-create-session`   | POST     | Crée session selon provider résolu                     |
| `stripe-connect-onboard`   | GET/POST | OAuth + création compte Express                        |
| `stripe-connect-webhook`   | POST     | Événements Stripe                                      |
| `paypal-partner-onboard`   | POST     | Onboarding vendeur                                     |
| `paypal-webhook`           | POST     | Événements PayPal                                      |
| `moneroo-webhook`          | POST     | **Existant** — refactor pour appeler processor partagé |
| `payment-events-processor` | internal | Idempotence + update order + side effects              |

**Variables d'environnement (plateforme)**

```
STRIPE_PLATFORM_SECRET_KEY
STRIPE_CONNECT_CLIENT_ID
STRIPE_WEBHOOK_SECRET
PAYPAL_PARTNER_CLIENT_ID
PAYPAL_PARTNER_SECRET
PAYPAL_WEBHOOK_ID
MONEROO_* (existant)
PAYMENT_ORCHESTRATION_V2=true
```

---

## 8. Modifications frontend (inventaire)

### 8.1 Vendeur (dashboard)

| Page / composant                                          | Action                    |
| --------------------------------------------------------- | ------------------------- |
| **Nouveau** `pages/dashboard/PaymentConnectionsPage.tsx`  | Hub connexions            |
| **Nouveau** `components/payments/StripeConnectButton.tsx` | OAuth                     |
| **Nouveau** `components/payments/PayPalConnectButton.tsx` | Partner flow              |
| `pages/Settings.tsx` ou `PaymentMethods.tsx`              | Lien vers connexions      |
| `SalesSidebar`                                            | Entrée menu « Paiements » |

### 8.2 Acheteur (checkout)

| Fichier                             | Action                                                        |
| ----------------------------------- | ------------------------------------------------------------- |
| `PaymentProviderSelector.tsx`       | Types union étendus ; fetch RPC options                       |
| `Checkout.tsx`                      | Appel `payment-create-session` ; gestion retour Stripe/PayPal |
| `checkout/Checkout.tsx` (buy-now)   | Même orchestrateur                                            |
| `pages/payments/PaymentSuccess.tsx` | Gérer `session_id` Stripe + token PayPal                      |
| `pages/payments/PaymentCancel.tsx`  | Provider-aware                                                |

### 8.3 Hooks commande (5 verticaux)

| Hook                        | Modification                                       |
| --------------------------- | -------------------------------------------------- |
| `useCreateDigitalOrder.ts`  | `initiatePayment({ storeId, provider: resolved })` |
| `useCreatePhysicalOrder.ts` | Idem                                               |
| `useCreateServiceOrder.ts`  | Idem                                               |
| `useCreateCourseOrder.ts`   | Idem                                               |
| `useCreateArtistOrder.ts`   | Idem                                               |
| `useCreateOrder.ts`         | Résolution centralisée avant switch                |

---

## 9. Processeur d'événements (fulfillment unifié)

### 9.1 Flux `onPaymentSucceeded(event)`

```
1. INSERT payment_webhook_events (ON CONFLICT DO NOTHING)
2. Si déjà processed_at → return 200
3. UPDATE transactions SET status = completed, ...
4. UPDATE orders SET payment_status = paid, payment_provider_used = ...
5. Side effects (ex-moneroowebhook) :
   - service_bookings → confirmed
   - artist certificates
   - emails SendGrid
6. Triggers SQL automatiques :
   - fulfill_digital_order_items_on_paid
   - auto_enroll_course_on_payment
   - stock physical (si trigger existant)
7. SET processed_at
```

### 9.2 Idempotence

- Clé : `(provider, external_event_id)`.
- Replays Stripe : 3 jours — doit être safe.

---

## 10. Sécurité & conformité

| Exigence           | Mesure                                                                    |
| ------------------ | ------------------------------------------------------------------------- |
| PCI DSS            | SAQ-A — Checkout hébergé Stripe/PayPal, pas de carte sur serveur Emarzona |
| Secrets            | Vault / env Edge uniquement                                               |
| Webhook signatures | Vérification HMAC Stripe, certificat PayPal, Moneroo existant             |
| RLS                | Connexions isolées par `store_id`                                         |
| Audit              | Log `payment_provider_used`, `connected_account_id` sur chaque order      |
| KYC vendeur        | Conserver KYC Emarzona + KYC Stripe/PayPal connecté                       |
| RGPD               | DPA avec Stripe/PayPal ; sous-traitants documentés                        |
| AML                | Stripe/PayPal screening ; Emarzona monitoring GMV suspect                 |

---

## 11. Stratégie de tests

| Niveau      | Scope                                                     |
| ----------- | --------------------------------------------------------- |
| Unit        | `resolveProvider`, fee calculation, currency matrix       |
| Integration | Adapters mockés Stripe/PayPal                             |
| E2E         | Stripe test Connect ; PayPal sandbox ; régression Moneroo |
| Webhook     | Fixtures `checkout.session.completed` rejouées 2×         |
| Charge      | 500 webhooks/min sans double `paid`                       |

**Fichiers E2E cibles**

- `tests/e2e/stripe-connect-checkout.spec.ts` (nouveau)
- `tests/e2e/paypal-commerce-checkout.spec.ts` (nouveau)
- `tests/e2e/cart-checkout-workflow.spec.ts` (étendre multi-provider)
- Régression : 5 workflows verticaux existants

---

## 12. Déploiement & feature flags

| Étape | Action                                            |
| ----- | ------------------------------------------------- |
| 1     | Deploy migrations + Edge (dark)                   |
| 2     | Activer `PAYMENT_ORCHESTRATION_V2` staging        |
| 3     | Beta fermée : 10 vendeurs Stripe Connect          |
| 4     | Beta PayPal : 10 vendeurs                         |
| 5     | GA : flag ON par défaut ; opt-out Moneroo-only    |
| 6     | Communication : email vendeurs + guide onboarding |

**Rollback** : flag OFF → retour Moneroo pur via adapter sans migration destructive.

---

## 13. KPIs & monitoring

| KPI                              | Source                                    | Alerte          |
| -------------------------------- | ----------------------------------------- | --------------- |
| Taux succès paiement par PSP     | `transactions.status`                     | < 95 % / 1h     |
| Latence `payment-create-session` | Edge logs                                 | p95 > 3s        |
| Webhooks non traités             | `payment_webhook_events.processing_error` | > 0 / 15min     |
| Comptes Connect restricted       | Stripe API sync                           | email vendeur   |
| GMV par provider                 | Dashboard admin                           | reporting       |
| Double fulfillment               | orders paid count vs events               | > 1 event/order |

**Outils** : Supabase logs, Sentry (existant), dashboard SQL interne.

---

## 14. RACI simplifié

| Activité          | Lead Platform | Commerce | Infra | QA  | Legal |
| ----------------- | ------------- | -------- | ----- | --- | ----- |
| Schéma DB         | R/A           | C        | C     | I   | I     |
| Stripe Connect    | R/A           | C        | C     | C   | I     |
| PayPal Commerce   | R/A           | C        | C     | C   | I     |
| UI vendeur        | C             | R/A      | I     | C   | I     |
| Checkout acheteur | R             | A        | I     | R   | I     |
| Webhooks          | R/A           | I        | C     | R   | I     |
| CGU / conformité  | C             | C        | I     | I   | R/A   |

_R = Responsible, A = Accountable, C = Consulted, I = Informed_

---

## 15. Risques & mitigations

| Risque                     | Probabilité | Impact   | Mitigation                                  |
| -------------------------- | ----------- | -------- | ------------------------------------------- |
| Double fulfillment         | Moyenne     | Critique | `payment_webhook_events` UNIQUE             |
| Vendeur Connect restricted | Haute       | Moyen    | Monitoring + UI statut                      |
| Complexité support         | Haute       | Moyen    | Page diagnostic + logs transaction          |
| Régression Moneroo Afrique | Moyenne     | Critique | Adapter isolé ; tests régression            |
| Multi-store + multi-PSP    | Haute       | Moyen    | Phase 4 dédiée                              |
| Dette types `transactions` | Moyenne     | Faible   | Colonnes génériques + migration progressive |

---

## 16. Dépendances externes

| Dépendance                           | Délai typique | Bloquant   |
| ------------------------------------ | ------------- | ---------- |
| Compte Stripe Connect plateforme     | 1–2 semaines  | Phase 2    |
| PayPal Partner Program approval      | 2–6 semaines  | Phase 3    |
| Revue conformité marketplace Stripe  | Variable      | Phase 2 GA |
| Supabase Vault ou équivalent secrets | 1 semaine     | Phase 1    |

---

## 17. Estimation effort (ordre de grandeur)

| Phase     | Engineering (person-weeks) | Notes                                  |
| --------- | -------------------------- | -------------------------------------- |
| 0         | 2                          | Cadrage                                |
| 1         | 4                          | DB + orchestrateur                     |
| 2         | 6                          | Stripe bout en bout                    |
| 3         | 4                          | PayPal                                 |
| 4         | 5                          | Consolidation                          |
| 5         | 3                          | Durcissement                           |
| **Total** | **~24 person-weeks**       | 2 devs senior ≈ 12 semaines calendrier |

---

## 18. Checklist Definition of Done (release GA)

- [ ] Vendeur peut connecter Stripe Express en < 10 min
- [ ] Vendeur peut connecter PayPal Commerce
- [ ] Acheteur voit uniquement les PSP réellement connectés
- [ ] 5 verticaux passent par l'orchestrateur
- [ ] Webhooks idempotents (test replay)
- [ ] Commission plateforme enregistrée sur Stripe/PayPal
- [ ] Moneroo reste défaut Afrique sans régression E2E
- [ ] Documentation vendeur publiée
- [ ] Runbook incident paiement
- [ ] SECURE_DEPLOY_CHECKLIST mis à jour

---

## 19. Prochaines actions immédiates

1. **Valider** ce plan (Product + Legal + Tech).
2. **Ouvrir** comptes Stripe Connect plateforme + PayPal Partner (sandbox).
3. **Rédiger ADR** Destination Charge + structure `application_fee`.
4. **Créer ticket Epic** « Payment Orchestration V2 » découpé par phase 0–1.
5. **Démarrer Phase 1** : migration SQL + squelette `src/lib/payments/orchestrator/`.

---

## 20. Annexe — Mapping fichiers existants → cible

| Existant                                              | Rôle futur                                 |
| ----------------------------------------------------- | ------------------------------------------ |
| `src/lib/payment-service.ts`                          | Façade publique → orchestrateur            |
| `src/lib/moneroo-payment.ts`                          | Adapter Moneroo                            |
| `src/integrations/payments/stripe.ts`                 | Logique migrée vers Edge + adapter serveur |
| `src/integrations/payments/paypal.ts`                 | Idem                                       |
| `src/integrations/payments/base.ts`                   | Interface adapter                          |
| `supabase/functions/moneroo-webhook`                  | Appelle `payment-events-processor`         |
| `src/components/checkout/PaymentProviderSelector.tsx` | UI multi-PSP                               |
| `stores.enabled_payment_providers`                    | Cache dérivée des connexions actives       |

---

_Document maintenu par l'équipe Platform. Prochaine révision après validation stakeholders._
