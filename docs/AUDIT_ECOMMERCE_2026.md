# Audit e-commerce Emarzona — 5 verticaux (2026)

Document de référence : audit bout en bout, checklist QA fichier par fichier, registre des risques et plan d'exécution 30/60/90 jours.

**Stack** : React (Vite) + TanStack Query + Supabase (PostgreSQL, RLS, Edge Functions) + Moneroo + FedEx — déployé sur Vercel.

Voir aussi : [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`SECURE_DEPLOY_CHECKLIST.md`](../SECURE_DEPLOY_CHECKLIST.md).

---

## Synthèse exécutive

| Verticale          | Score      | Position vs leaders                                         |
| ------------------ | ---------- | ----------------------------------------------------------- |
| Produits digitaux  | **8/10**   | Proche Gumroad / Shopify Digital                            |
| Produits physiques | **7/10**   | WMS fort ; vitrine acheteur à renforcer                     |
| Services           | **7,5/10** | Calendly/Acuity ; panier mixte avec réservation (Vague 2.1) |
| Cours en ligne     | **8/10**   | Teachable/Kajabi sur LMS                                    |
| Œuvres d'artiste   | **7/10**   | Enchères + certificats ; E2E payant CI en place             |

**Forces** : modèle unifié `products.product_type`, 5 hooks commande, checkout unifié, triggers SQL fulfillment, marketplace multi-facettes, ops physiques avancées, portails client segmentés.

**Freins scale mondiale** : Moneroo seul en production, FedEx mock sans credentials prod, Stripe/PayPal non branchés au checkout.

---

## Architecture transversale

```
Marketplace / Storefront → Fiche → Panier (sauf service) → Checkout.tsx
  → buildOrderItemRows → orders + order_items → Moneroo → moneroo-webhook
  → Triggers SQL + Edge Functions → /account/*
```

| Type       | Table extension     | Checkout                                               |
| ---------- | ------------------- | ------------------------------------------------------ |
| `digital`  | `digital_products`  | Panier ou `?productId=`                                |
| `physical` | `physical_products` | Panier                                                 |
| `service`  | `service_products`  | Réservation obligatoire → panier mixte (même boutique) |
| `course`   | `courses`           | Panier ou direct ; `/learn/:slug` si inscrit           |
| `artist`   | `artist_products`   | Panier                                                 |

**Fichiers pivots**

| Rôle              | Chemin                                                |
| ----------------- | ----------------------------------------------------- |
| Types             | `src/types/unified-product.ts`                        |
| Routeur commandes | `src/hooks/orders/useCreateOrder.ts`                  |
| Lignes panier     | `src/lib/checkout-order-items.ts`                     |
| Checkout          | `src/pages/checkout/CheckoutPage.tsx`, `Checkout.tsx` |
| Paiement prod     | `src/lib/payment-service.ts`                          |
| Webhook           | `supabase/functions/moneroo-webhook/index.ts`         |

---

## 1. Produits digitaux

### Parcours & fichiers clés

| Étape       | Fichiers                                                                             |
| ----------- | ------------------------------------------------------------------------------------ |
| Découverte  | `Marketplace.tsx`, `digital/DigitalProductsSearch.tsx`, `DigitalProductsCompare.tsx` |
| Fiche       | `digital/DigitalProductDetail.tsx`                                                   |
| Commande    | `hooks/orders/useCreateDigitalOrder.ts`, `checkout-order-items.ts`                   |
| Fulfillment | `migrations/20260519130000__fulfill_digital_licenses_on_order_paid.sql`              |
| Client      | `customer/CustomerDigitalPortal.tsx`, `digital/MyDownloads.tsx`, `MyLicenses.tsx`    |
| Vendeur     | `create/digital/CreateDigitalProductWizard_v2.tsx`, versions, bundles, webhooks      |

### Checklist QA (extrait)

- [ ] Licence générée/activée sous 5 min après `payment_status = paid` (panier + achat direct)
- [ ] `download_limit` respecté sur `DigitalDownloadButton`
- [ ] Bundles et versions notifient les acheteurs
- [ ] Abonnements digitaux : renouvellement Moneroo documenté

### E2E

- `tests/e2e/digital-product-workflow.spec.ts` — **complet**

### Gaps P0–P2

| Gap                             | Priorité |
| ------------------------------- | -------- |
| PSP global (Stripe)             | P0       |
| Liens téléchargement signés TTL | P1       |
| DRM device binding              | P2       |

---

## 2. Produits physiques

### Parcours & fichiers clés

| Étape    | Fichiers                                                            |
| -------- | ------------------------------------------------------------------- |
| Fiche    | `physical/PhysicalProductDetail.tsx` (+ marketplace/storefront)     |
| Commande | `useCreatePhysicalOrder.ts` (réserve stock)                         |
| Shipping | `Checkout.tsx`, `services/fedex/FedexService.ts`, Edge `fedex-*`    |
| Ops      | `admin/PhysicalInventoryManagement`, lots, séries, préco, entrepôts |
| Client   | `CustomerPhysicalPortal.tsx`, retours, garanties                    |

### Checklist QA

- [ ] FedEx **réel** en staging/prod (pas `MOCK` tracking)
- [ ] Déduction stock après webhook paid
- [ ] Variantes + inventaire cohérents sur fiche
- [ ] ETA livraison affiché (pas seulement fallback XOF)

### E2E

- `tests/e2e/physical-product-workflow.spec.ts` — **complet**

### Gaps

| Gap                                  | Priorité |
| ------------------------------------ | -------- |
| Transporteurs multiples              | P0       |
| Refonte fiche produit (galerie, ETA) | P1       |
| ~122 composants vs 2 pages publiques | P1 UX    |

---

## 3. Services

### Parcours & fichiers clés

| Étape        | Fichiers                                                       |
| ------------ | -------------------------------------------------------------- |
| Fiche + résa | `service/ServiceDetail.tsx`, `useCreateServiceOrder.ts`        |
| Panier       | Réservation → `service-cart-policy.ts` + `useCart` guard       |
| Webhook      | `moneroo-webhook` → `service_bookings` confirmed               |
| Vendeur      | `BookingsManagement.tsx`, calendrier, staff, waitlist, rappels |
| Client       | `customer/CustomerMyBookings.tsx`                              |

### Checklist QA

- [ ] Validations : max participants, advance_booking_days, buffer, conflits staff
- [x] `service_availability_slots` utilisé partout (legacy `service_availability` non référencé côté app)
- [ ] Intégrations calendrier OAuth en prod

### E2E

- `tests/e2e/service-workflow.spec.ts` — **complet**

### Gaps

| Gap                            | Priorité                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------- |
| Panier mixte service + produit | P1 — amorcé (`mixed-cart-service-product.spec.ts`, `ServiceDetail` → panier) |
| Analytics vendeur non mockées  | P1                                                                           |

---

## 4. Cours en ligne

### Parcours & fichiers clés

| Étape     | Fichiers                                                      |
| --------- | ------------------------------------------------------------- |
| Vente     | `courses/CourseDetail.tsx`, `useCreateCourseOrder.ts`         |
| Accès     | `auto_enroll_course_on_payment` (migration 20260513)          |
| LMS       | `VideoPlayerWithNotes`, gamification, cohortes, devoirs, live |
| Apprenant | `/learn/:slug`, `customer/MyCourses.tsx`                      |
| Vendeur   | `CreateCourseWizard`, `CourseAnalytics.tsx`                   |

### Checklist QA

- [ ] Enrollment automatique à paid (régression critique)
- [ ] Progression leçon → certificat si seuil atteint
- [ ] Cohortes : dates et accès

### E2E

- `tests/e2e/course-enrollment-flow.spec.ts` — navigation + auth
- `tests/e2e/course-paid-enrollment.spec.ts` — **payant** (seed Supabase, `/learn/:slug`, checkout CTA) — CI `test-vertical-paid`

### Gaps

| Gap                                  | Priorité                                           |
| ------------------------------------ | -------------------------------------------------- |
| E2E paiement → `/learn` bout en bout | ~~P0 QA~~ **couvert** par `course-paid-enrollment` |
| SCORM / offline PWA                  | P2                                                 |
| Landing marketplace cours dédiée     | P1                                                 |

---

## 5. Œuvres d'artiste

### Parcours & fichiers clés

| Étape      | Fichiers                                                              |
| ---------- | --------------------------------------------------------------------- |
| Découverte | `/artist/:productId`, `/portfolio/:slug`, `/collections`, `/auctions` |
| Commande   | `useCreateArtistOrder.ts` (éditions limitées)                         |
| Post-achat | Webhook → `generate-artist-certificate`, provenance                   |
| Client     | `customer/CustomerArtistPortal.tsx`                                   |
| Vendeur    | `CreateArtistProductWizard`, `AuctionsManagementPage`                 |

### Checklist QA

- [ ] Édition limitée : décrément à la commande paid
- [ ] Certificat PDF accessible dans portail artiste
- [ ] Enchères : cycle enchère → paiement → certificat

### E2E

- `tests/e2e/artist-product-workflow.spec.ts` — navigation publique + auth
- `tests/e2e/artist-paid-purchase.spec.ts` — **payant** (portail, certificat, panier → checkout) — CI `test-vertical-paid`
- `tests/e2e/artist-sale-certificate.spec.ts` — verify + flux panier → checkout aligné

### Gaps

| Gap                            | Priorité                                         |
| ------------------------------ | ------------------------------------------------ |
| E2E achat complet              | ~~P0 QA~~ **couvert** par `artist-paid-purchase` |
| Assurance transport partenaire | P1                                               |
| Expertise tierce               | P2                                               |

---

## Registre des risques transversaux

| ID  | Risque                     | Priorité                              | Fichiers                 |
| --- | -------------------------- | ------------------------------------- | ------------------------ |
| R1  | Moneroo seul en prod       | P0                                    | `payment-service.ts`     |
| R2  | FedEx mock                 | P0                                    | `FedexService.ts`        |
| R3  | Services hors panier       | P1 — réservation → panier (Vague 2.1) | `service-cart-policy.ts` |
| R4  | Fallback TVA 18 %          | P1                                    | `Checkout.tsx`           |
| R5  | E2E artiste/cours faibles  | ~~P0 QA~~ **CI vertical-paid**        | `tests/e2e/*-paid-*`     |
| R6  | Stripe/PayPal non branchés | P1                                    | `integrations/payments/` |

---

## Matrice tests E2E

| Verticale   | Spec                                 | Profondeur                               |
| ----------- | ------------------------------------ | ---------------------------------------- |
| Digital     | `digital-product-workflow.spec.ts`   | Complète                                 |
| Physical    | `physical-product-workflow.spec.ts`  | Complète                                 |
| Service     | `service-workflow.spec.ts`           | Complète                                 |
| Course      | `course-enrollment-flow.spec.ts`     | Navigation + auth                        |
| Course      | `course-paid-enrollment.spec.ts`     | **Payant** (seed + learn + checkout)     |
| Artist      | `artist-product-workflow.spec.ts`    | Navigation publique + auth               |
| Artist      | `artist-paid-purchase.spec.ts`       | **Payant** (portail + certificat)        |
| Transversal | `cart-checkout-workflow.spec.ts`     | Routage checkout                         |
| Transversal | `mixed-cart-service-product.spec.ts` | Panier mixte service + produit (contrat) |

```bash
npm run test:e2e:vertical-paid
npm run test:e2e:vertical-paid:local   # .env.e2e.local (Vercel pull)
npm run test:e2e:commerce-gating
npm run test:production-truth
npm run typecheck:commerce-core
```

---

## Plan 30 / 60 / 90 jours

### Owners

| Rôle               | Périmètre                    |
| ------------------ | ---------------------------- |
| Lead Platform      | Checkout, PSP, webhooks, SQL |
| Lead Commerce (×5) | Une verticale chacun         |
| Lead Infra         | Supabase, Edge, secrets      |
| Lead QA            | E2E, release criteria        |
| Lead Growth        | Marketplace, SEO             |
| Lead Trust         | KYC, litiges                 |

### J+30 — Production truth

| Livrable                               | Owner    | Statut                                                                    |
| -------------------------------------- | -------- | ------------------------------------------------------------------------- |
| FedEx 100 % réel staging/prod          | Infra    | Code prêt ; secrets `FEDEX_*` à poser                                     |
| E2E artiste + cours renforcés          | QA       | **Fait** — `test-vertical-paid` (5 specs)                                 |
| Fix `service_availability` query/types | Platform | **Fait** — app sur `service_availability_slots`                           |
| Régression panier multi-type (4 types) | QA       | Contrat Vitest + `mixed-cart-service-product`                             |
| Monitoring fulfillment post-paid       | Platform | **Fait** — cron `order-fulfillment-monitor`, `verify:fulfillment-monitor` |
| Billing → orchestrateur                | Platform | **Fait** — `initiate-billing-payment.ts`                                  |
| Idempotence webhooks multi-PSP         | Platform | **Fait** — `process_payment_webhook_atomic`, `verify:webhook-idempotency` |

**KPIs** : fulfillment < 5 min ≥ 99 % ; 5/5 E2E verts chemin critique ; 0 % shipping mock en prod.

### J+60 — Conversion globale

> Plan détaillé multi-PSP (Stripe Connect, PayPal Commerce) : [`PAYMENT_ORCHESTRATION_IMPLEMENTATION_PLAN.md`](./PAYMENT_ORCHESTRATION_IMPLEMENTATION_PLAN.md)

| Livrable                        | Owner             |
| ------------------------------- | ----------------- |
| Stripe + routage région         | Platform          |
| Refonte `PhysicalProductDetail` | Commerce Physical |
| Landings `/courses` et art SEO  | Growth            |
| Analytics services réelles      | Commerce Service  |
| Emarzona Protect v1             | Trust             |

**KPIs** : conversion checkout +15 % ; abandon panier −10 %.

### J+90 — Différenciation

| Livrable                      | Owner            |
| ----------------------------- | ---------------- |
| Bundle cross-type checkout    | Platform         |
| Service + addon produit       | Commerce Service |
| DRM digital v2 (URLs signées) | Commerce Digital |
| Enchère → certificat E2E      | Commerce Artist  |
| API vendeur v1                | Platform         |

**KPIs** : NPS ≥ 40 ; GMV multi-type +25 % stores actifs ; LCP marketplace < 2,5 s mobile.

---

## Definition of Done (release majeure)

- [x] E2E chemin payant vert sur CI (`test-vertical-paid` dans `playwright.yml`)
- [x] Trigger fulfillment vérifié staging (`verify:fulfillment-monitor`)
- [x] Webhook idempotent (pas double fulfillment) — contrat `verify_webhook_idempotency_contract`
- [ ] RLS portails client validé
- [ ] `typecheck:commerce-core` + `lint:ci:critical` verts — `npm run verify:phase1`
- [ ] Pas de mock FedEx/analytics sur métriques vendeur affichées
- [ ] `SECURE_DEPLOY_CHECKLIST.md` signé — `npm run verify:phase0` + sign-off section 6

---

## Historique document

| Date       | Action                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------ |
| 2026-05-23 | Création audit + sprint 1 (doc, E2E, fix availabilities)                                   |
| 2026-06-24 | Phase 0 : fulfillment monitor, idempotence webhooks, scripts `verify:phase0`               |
| 2026-06-26 | Phase 1 : pagination `AdminProducts`, `ShippingDashboard` données réelles, `verify:phase1` |
