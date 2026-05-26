# Audit technique détaillé — Système Œuvre d'artiste

**Date :** 26 mai 2026  
**Référence exécutive :** [AUDIT_OEUVRE_ARTISTE_EXECUTIF.md](./AUDIT_OEUVRE_ARTISTE_EXECUTIF.md)

---

## Table des matières

1. [Architecture & inventaire](#1-architecture--inventaire)
2. [Flux E2E détaillés](#2-flux-e2e-détaillés)
3. [Findings Critical / High / Medium](#3-findings-critical--high--medium)
4. [Sécurité & RLS](#4-sécurité--rls)
5. [Intégrité des données & concurrence](#5-intégrité-des-données--concurrence)
6. [UX, conversion, SEO, accessibilité](#6-ux-conversion-seo-accessibilité)
7. [Performance & observabilité](#7-performance--observabilité)
8. [Couverture de tests & scénarios manquants](#8-couverture-de-tests--scénarios-manquants)
9. [Plan de remédiation technique](#9-plan-de-remédiation-technique)

---

## 1. Architecture & inventaire

### 1.1 Modèle de données (Supabase)

| Table                             | Migration                                          | Rôle                                              |
| --------------------------------- | -------------------------------------------------- | ------------------------------------------------- |
| `artist_products`                 | `20250228000005__artist_products_system.sql`       | Extension métier par `product_id`                 |
| `artist_product_certificates`     | `20250128000005__artist_product_certificates.sql`  | Certificats post-achat acheteur                   |
| `artwork_provenance`              | `20250201000012__artist_3d_gallery_provenance.sql` | Historique propriété                              |
| `artwork_certificates`            | idem                                               | Certificats « catalogue » (pré-vente / expertise) |
| `artist_3d_models`                | idem                                               | Viewer 3D                                         |
| `artist_product_auctions`         | `20250131000010__artist_auctions_system.sql`       | Enchères                                          |
| `auction_bids`                    | idem                                               | Offres                                            |
| `auction_watchlist`               | idem                                               | Alertes                                           |
| `artist_portfolios` / collections | `20250204000000`, `20250128000004`                 | Galeries                                          |

`products.product_type` inclut `'artist'` (contrainte CHECK mise à jour dans la migration système).

### 1.2 Frontend — modules principaux

| Zone              | Fichiers clés                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------- |
| Types             | `src/types/artist-product.ts`                                                               |
| Hooks CRUD        | `src/hooks/artist/useArtistProducts.ts`                                                     |
| Commande dédiée   | `src/hooks/orders/useCreateArtistOrder.ts`                                                  |
| Commande unifiée  | `src/hooks/orders/useCreateOrder.ts` (case `artist`)                                        |
| Panier / checkout | `src/pages/Checkout.tsx`, `src/lib/checkout-order-items.ts`, `src/lib/checkout-shipping.ts` |
| Fiche produit     | `src/pages/artist/ArtistProductDetail.tsx`                                                  |
| Création          | `src/components/products/create/artist/CreateArtistProductWizard.tsx`                       |
| Certificats       | `src/hooks/artist/useArtistCertificates.ts`, `src/lib/artist-certificate-generator.ts`      |
| Enchères          | `src/hooks/artist/useArtistAuctions.ts`, pages `src/pages/artist/Auction*.tsx`              |
| Portail acheteur  | `src/pages/customer/CustomerArtistPortal.tsx`                                               |
| Shipping          | `src/lib/shipping/artist-shipping.ts`                                                       |

### 1.3 Routes publiques

Définies dans `src/routes/publicRoutes.tsx` :

- `/artist/:productId` — fiche œuvre
- `/portfolio/:slug` — portfolio artiste
- `/collections`, `/collections/:collectionSlug`
- `/auctions`, `/auctions/:slug`

Dashboard vendeur : `/dashboard/auctions`, `/dashboard/auctions/watchlist` (`dashboardRoutes.tsx`).

Portail client : `/account/artist` (`customerRoutes.tsx`).

### 1.4 Edge Functions & post-paiement

- `supabase/functions/generate-artist-certificate/index.ts` — création enregistrement certificat (auth `x-internal-secret`)
- `supabase/functions/_shared/post-order-payment-fulfillment.ts` — fulfillment unifié (certificat + provenance)

---

## 2. Flux E2E détaillés

### 2.1 Création vendeur (wizard 8 étapes)

```
CreateArtistProductWizard
  → validateStep (client)
  → validateAndSanitizeArtistProduct / validateArtistProduct
  → insert products (product_type: 'artist')
  → insert artist_products
  → saveDraftHybrid (local + serveur)
```

**Points positifs :** lazy-loading des étapes, brouillon hybride, messages d'erreur métier (`artist-product-error-messages.ts`), sanitization (`artist-product-sanitizer.ts`).

**Points faibles :** `validationErrors` state jamais alimenté (grille d'étapes avec `hasErrors` inactif) ; pas de validation serveur atomique produit + extension en une transaction côté FE.

### 2.2 Découverte & fiche produit

```
Marketplace (filtres artist_products join)
  → /artist/:productId
  → useQuery products + artist_products (join)
  → useArtwork3DModel / useArtworkProvenanceHistory / useArtworkCertificates
  → addItem (useCart) avec metadata.artist_product_id
```

**Tracking :** `useAnalyticsTracking`, pixels gtag/fbq/ttq sur `view_item`.

### 2.3 Achat — chemin A (direct)

```
useCreateOrder (productType: 'artist')
  → useCreateArtistOrder
      1. fetch products + artist_products
      2. RPC check_and_increment_artist_product_version (si limited_edition)
      3. customer upsert
      4. insert orders + order_items
      5. initiatePayment (Moneroo)
      6. rollback delete si paiement échoue
```

### 2.4 Achat — chemin B (panier) — **écart majeur**

```
ArtistProductDetail → useCart.addItem
  → Checkout.tsx → buildOrderItemRows → insert orders/order_items
  → initiatePayment (par store)
```

**Aucun appel** à `check_and_increment_artist_product_version` dans `Checkout.tsx` ni `buildOrderItemRows`.

### 2.5 Post-paiement

```
post-order-payment-fulfillment (Stripe / webhooks alignés)
  → pour chaque order_item artist:
      → fetch artist_products
      → POST generate-artist-certificate  ⚠ auth incorrecte (voir C-01)
      → insert artwork_provenance (ownership)
```

### 2.6 Enchères — **flux incomplet**

```
AuctionDetailPage → usePlaceBid → RPC place_auction_bid
  → end_auction (SQL) — pas de lien automatique vers orders/Moneroo
```

---

## 3. Findings Critical / High / Medium

### C-01 — Certificat post-paiement : auth Edge Function incorrecte

**Sévérité :** Critical  
**Fichiers :**

- `supabase/functions/_shared/post-order-payment-fulfillment.ts` (l.188-204)
- `supabase/functions/generate-artist-certificate/index.ts` (l.51-65)

**Constat :** Le fulfillment appelle l'Edge Function avec `Authorization: Bearer ${supabaseServiceKey}` uniquement. La fonction **rejette** toute requête sans `x-internal-secret` valide (`EDGE_INTERNAL_SECRET`).

```typescript
// post-order-payment-fulfillment.ts — appel actuel
headers: {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${supabaseServiceKey}`,
},

// generate-artist-certificate/index.ts — garde
if (!internalSecret || internalSecret.trim() !== expectedInternalSecret.trim()) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}
```

**Impact :** Certificats non créés après paiement ; promesse « certificat d'authenticité » non honorée.

**Remédiation :**

```typescript
headers: {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${supabaseServiceKey}`,
  'x-internal-secret': Deno.env.get('EDGE_INTERNAL_SECRET') ?? '',
},
```

Ajouter test d'intégration + alerte si `certResponse.status !== 200`.

---

### C-02 — Survente éditions limitées via panier

**Sévérité :** Critical  
**Fichiers :** `src/pages/Checkout.tsx`, `src/lib/checkout-order-items.ts`  
**Référence correcte :** `src/hooks/orders/useCreateArtistOrder.ts` (l.173-210)

**Constat :** Le verrou inventaire n'est invoqué que dans `useCreateArtistOrder`. Le flux panier majoritaire (`Checkout.tsx`) insère directement `order_items` sans RPC.

**Scénario :** Deux acheteurs ajoutent la dernière édition au panier et paient — les deux commandes peuvent passer (sold_count ne compte que `payment_status = completed`, sans réservation).

**Remédiation :**

- Avant `insert order_items` pour chaque ligne `product_type = 'artist'` + `limited_edition`, appeler `check_and_increment_artist_product_version`.
- Ou trigger DB `BEFORE INSERT` sur `order_items` pour artist + limited_edition.
- Idéal : fonction SQL `reserve_artist_edition(product_id, qty)` avec release sur annulation/expiration.

---

### C-03 — Placement d'offres enchère : mismatch paramètres

**Sévérité :** Critical  
**Fichiers :**

- `src/pages/artist/AuctionDetailPage.tsx` (l.98-101)
- `src/hooks/artist/useArtistAuctions.ts` (l.342-354)

**Constat :** La page passe `auctionId` / `bidAmount` ; le hook attend `auction_id` / `bid_amount`.

```typescript
// AuctionDetailPage.tsx
await placeBid.mutateAsync({ auctionId: auction.id, bidAmount: amount });

// useArtistAuctions.ts
mutationFn: async (bidData: { auction_id: string; bid_amount: number; ... }) => {
  await supabase.rpc('place_auction_bid', {
    p_auction_id: bidData.auction_id,  // undefined
    p_bid_amount: bidData.bid_amount,  // undefined
```

**Remédiation :** Aligner les noms (camelCase dans le hook avec mapping, ou corriger la page).

---

### H-01 — Version incrémentée avant paiement confirmé

**Sévérité :** High  
**Fichier :** `useCreateArtistOrder.ts` + `check_and_increment_artist_product_version`

**Constat :** La RPC incrémente `artist_products.version` lors de la création de commande `pending`, pas à `payment_status = completed`. Si paiement échoue et commande supprimée, la version reste incrémentée alors que `sold_count` (basé sur commandes payées) ne change pas.

**Effets :** Conflits de version artificiels ; pression psychologique « presque épuisé » sans vente réelle.

**Remédiation :** Réserver à la commande pending avec colonne `reserved_until` + job release ; ou déplacer l'incrément dans un trigger `orders` AFTER UPDATE WHEN payment_status → completed.

---

### H-02 — Certificat : deux chemins, PDF incomplet côté serveur

**Sévérité :** High  
**Fichiers :**

- `generate-artist-certificate/index.ts` (l.202-204 : « PDF lors du premier téléchargement »)
- `src/lib/artist-certificate-generator.ts` (jsPDF côté client)
- `src/lib/artist-certificate-auto-generator.ts` (chemin client alternatif)

**Constat :** L'Edge Function insère `is_generated: false` sans PDF. Le générateur client (`generateAndUploadCertificate`) utilise jsPDF — **ne peut pas tourner** dans Deno Edge. Risque de certificats « coquilles » en base sans PDF jusqu'à action manuelle.

**Remédiation :** Génération PDF serveur (Puppeteer/playwright headless, ou `@react-pdf/renderer` en Edge) ; un seul pipeline post-paiement.

---

### H-03 — Enchère gagnante non convertie en commande

**Sévérité :** High  
**Fichiers :** `place_auction_bid`, `end_auction` (migration enchères), absence de hook order

**Constat :** `end_auction` marque `status = 'sold'` mais aucun code FE/Edge ne crée `orders` + lien Moneroo pour le gagnant.

**Remédiation :** Job `end_auction` → notification → `useCreateArtistOrder` avec prix = `current_bid` + token paiement limité dans le temps.

---

### H-04 — Shipping artiste heuristique

**Sévérité :** High  
**Fichier :** `src/lib/shipping/artist-shipping.ts`

**Constat :** Barèmes pays codés en dur (`baseRates`), assurance 2 %, emballage par paliers. Pas d'API transporteur contrairement au physique (FedEx via `fetchCheapestFedexShippingCost`).

**Remédiation :** Intégrer devis réels pour œuvres fragiles ; exposer breakdown dans checkout (déjà partiellement via `ArtistShippingCalculator`).

---

### M-01 — Fiche produit publique avec sidebar vendeur

**Sévérité :** Medium  
**Fichier :** `src/pages/artist/ArtistProductDetail.tsx`

**Constat :** Layout `SidebarProvider` + `AppSidebar` sur route publique `/artist/:id` — navigation dashboard visible aux acheteurs.

**Remédiation :** Layout storefront public (comme `PhysicalProductDetail`) sans `AppSidebar`.

---

### M-02 — Double modèle certificats

**Sévérité :** Medium  
**Tables :** `artist_product_certificates` vs `artwork_certificates`  
**Hooks :** `useArtistCertificates` vs `useArtworkCertificates` (provenance)

**Constat :** Deux sources de vérité ; fiche produit affiche `artwork_certificates`, portail acheteur `artist_product_certificates`.

**Remédiation :** Documenter la séparation (catalogue vs achat) ou fusionner avec `certificate_scope`.

---

### M-03 — `useEditionTracking` : requête orders inefficace

**Sévérité :** Medium  
**Fichier :** `src/hooks/artist/useEditionTracking.ts` (l.48-52)

**Constat :** Charge **toutes** les commandes payées de la plateforme puis filtre — ne scale pas.

**Remédiation :** RPC `get_edition_tracking(p_product_id)` avec agrégation SQL.

---

### M-04 — Policy INSERT certificats trop permissive

**Sévérité :** Medium  
**Fichier :** `20250128000005__artist_product_certificates.sql` (l.163-166)

```sql
CREATE POLICY "System can create certificates"
  ON public.artist_product_certificates FOR INSERT
  WITH CHECK (TRUE);
```

**Constat :** Tout utilisateur authentifié pourrait insérer via client anon si policy mal combinée avec GRANT. En pratique, l'Edge utilise service_role, mais la policy ouvre une surface.

**Remédiation :** `WITH CHECK (false)` pour rôles anon/authenticated + inserts uniquement via service_role / SECURITY DEFINER.

---

### M-05 — Cron enchères non branché

**Sévérité :** Medium  
**Fichier :** `20250131000010__artist_auctions_system.sql` (l.353-354)

**Commentaire migration :** « Pour un vrai système, utiliser pg_cron ou un job scheduler » — `update_auction_statuses()` existe mais pas de scheduler confirmé dans le repo.

---

## 4. Sécurité & RLS

### 4.1 `artist_products`

Policies dans `20250228000005__artist_products_system.sql` :

- Vendeur : CRUD via `stores.user_id = auth.uid()`
- Public : SELECT si `products.is_active = true`

**OK** pour catalogue public.

### 4.2 Enchères

- SELECT public sur enchères `active|scheduled|ended|sold`
- INSERT bids : `bidder_id = auth.uid()`
- RPC `place_auction_bid` : `SECURITY DEFINER` — correct pour logique métier centralisée

**Risque :** Pas de rate limiting offres ; pas de vérification `require_verification` implémentée côté SQL malgré la colonne.

### 4.3 Certificats acheteur

- SELECT : propriétaire `user_id = auth.uid()` + certificats publics `is_public`
- INSERT policy `WITH CHECK (TRUE)` — voir M-04

### 4.4 Validation serveur

Migration `20250301000002__artist_products_validation.sql` : triggers `validate_artwork_dimensions`, `validate_edition_info`, etc. — **bonne défense en profondeur**.

---

## 5. Intégrité des données & concurrence

### 5.1 RPC optimistic locking

`check_and_increment_artist_product_version` :

- `SELECT FOR UPDATE` sur `artist_products`
- Compte vendus via `order_items` + `orders.payment_status = 'completed'`
- Incrémente `version` si OK

**Limite :** Ne compte pas les commandes `pending` comme réservations → race entre pending orders (surtout panier).

### 5.2 Rollback commande

`useCreateArtistOrder` supprime `orders` + `order_items` si Moneroo échoue — **ne restaure pas** la version `artist_products` incrémentée.

### 5.3 Métadonnées panier

`ArtistProductDetail` passe `artist_product_id` dans metadata — `buildOrderItemRows` complète si absent. **OK**.

### 5.4 Provenance auto

Insert ownership dans `post-order-payment-fulfillment` avec `is_verified: true` — acceptable si déclenché uniquement après paiement confirmé.

---

## 6. UX, conversion, SEO, accessibilité

### 6.1 Points forts

| Élément                                | Fichier                                    | Effet conversion          |
| -------------------------------------- | ------------------------------------------ | ------------------------- |
| SEOMeta + ProductSchema                | `ArtistProductDetail.tsx`                  | Rich snippets, partage    |
| Onglets certificat / provenance / avis | idem                                       | Confiance                 |
| Wishlist + partage natif               | `useWishlistToggle`, `navigator.share`     | Engagement                |
| Badge édition limitée                  | `EditionLimitedBadge`, `ArtistProductCard` | Urgence                   |
| Wizard 8 étapes guidé                  | `CreateArtistProductWizard`                | Qualité catalogue vendeur |
| Utilitaires WCAG                       | `artist-product-accessibility.ts`          | Conformité formulaires    |

### 6.2 Frictions identifiées

| Friction                                                        | Impact               | Fichier                    |
| --------------------------------------------------------------- | -------------------- | -------------------------- |
| Sidebar vendeur sur page achat                                  | Confiance ↓          | `ArtistProductDetail.tsx`  |
| Shipping affiché tard (après adresse)                           | Abandon checkout     | `Checkout.tsx`             |
| Pas de CTA « Acheter maintenant » distinct du panier sur mobile | Friction             | fiche produit              |
| Enchères cassées (C-03)                                         | Feature inutilisable | `AuctionDetailPage.tsx`    |
| Certificat absent post-achat (C-01)                             | Confiance ↓↓         | fulfillment                |
| `payment_status` brut affiché au portail                        | UX amateur           | `CustomerArtistPortal.tsx` |

### 6.3 SEO

- URL canonique `/artist/:productId` (UUID, pas slug SEO) — **amélioration** : redirect slug artiste + œuvre
- `ArtGallerySection` sur marketplace — bon maillage interne
- Filtres `artist_type`, `edition_type` dans `useMarketplaceProducts` — discoverability OK

### 6.4 Accessibilité

- Wizard : attributs ARIA via `artist-product-accessibility.ts`
- Fiche : labels sur badges, bouton retour avec `aria-label`
- 3D viewer : dépend du composant `Artwork3DViewer` — vérifier alternative 2D si WebGL indisponible (non audité en runtime)

---

## 7. Performance & observabilité

### 7.1 Optimisations présentes

- Lazy import : `Artwork3DViewer`, `ArtistCertificateDisplay`, reviews (`ArtistProductDetail`)
- `staleTime: 5min` sur fetch fiche produit
- Requête unique products + artist_products (évite N+1 fiche)
- Index GIN sur JSONB `artist_products` (migration système)

### 7.2 Goulots

| Zone              | Problème                                     | Fichier                    |
| ----------------- | -------------------------------------------- | -------------------------- |
| Liste vendeur     | Stats ventes = 2 requêtes + scan order_items | `useArtistProducts.ts`     |
| Edition tracking  | Scan toutes commandes payées                 | `useEditionTracking.ts`    |
| Popular products  | Multi-requêtes                               | `usePopularArtistProducts` |
| Checkout shipping | 1 RPC shipping par ligne artiste             | `checkout-shipping.ts`     |

### 7.3 Observabilité

- `logger` utilisé dans hooks — **OK**
- Pas de métrique dédiée « certificat_generated », « edition_lock_conflict », « auction_bid_failed »
- Notifications types définis (`unified-notifications.ts`) : `artist_product_certificate_ready`, `artist_product_edition_sold_out` — vérifier déclenchement effectif après fix C-01

---

## 8. Couverture de tests & scénarios manquants

### 8.1 État actuel

| Type            | Fichier                                                    | Couverture                   |
| --------------- | ---------------------------------------------------------- | ---------------------------- |
| E2E smoke       | `tests/e2e/artist-product-workflow.spec.ts`                | Pages chargent ; pas d'achat |
| Unit            | **Aucun** `*artist*.test.*` dans `src/`                    | 0 %                          |
| Intégration RPC | Migrations `20250301000001__artist_products_rls_tests.sql` | RLS seulement                |

### 8.2 Scénarios manquants (priorité QA)

| ID  | Scénario                                                                      | Priorité |
| --- | ----------------------------------------------------------------------------- | -------- |
| T1  | Deux sessions achètent dernière édition limitée (panier) — une seule réussite | P0       |
| T2  | Paiement sandbox → certificat PDF dans `/account/artist`                      | P0       |
| T3  | `place_auction_bid` via UI avec montant valide                                | P0       |
| T4  | Commande directe `useCreateArtistOrder` + échec paiement → stock non consommé | P1       |
| T5  | Shipping artiste fragile + assurance reflétés dans total checkout             | P1       |
| T6  | Wizard création → publication → visible marketplace filtre artiste            | P1       |
| T7  | Vérification code certificat public (quand page /verify existante)            | P2       |

### 8.3 Données de test E2E recommandées

```env
E2E_ARTIST_PRODUCT_ID=<uuid produit artist actif>
E2E_ARTIST_LIMITED_EDITION_ID=<uuid édition 1/1>
E2E_RUN_AUTH_TESTS=1
E2E_TEST_EMAIL=...
E2E_TEST_PASSWORD=...
```

---

## 9. Plan de remédiation technique

### Phase 0 — Bloquants (ordre strict)

| #   | Tâche                                            | Fichiers                            | Est. |
| --- | ------------------------------------------------ | ----------------------------------- | ---- |
| 1   | Ajouter `x-internal-secret` à l'appel certificat | `post-order-payment-fulfillment.ts` | 2h   |
| 2   | Verrou inventaire dans checkout panier           | `Checkout.tsx`, évent. RPC wrapper  | 1-2j |
| 3   | Fix paramètres `usePlaceBid`                     | `AuctionDetailPage.tsx` ou hook     | 1h   |
| 4   | E2E T1-T3                                        | `tests/e2e/artist-*.spec.ts`        | 2-3j |

### Phase 1 — Intégrité & confiance

| #   | Tâche                                                      | Est. |
| --- | ---------------------------------------------------------- | ---- |
| 5   | Déplacer réservation version à paiement confirmé + release | 3-5j |
| 6   | PDF certificat 100 % serveur                               | 5-8j |
| 7   | Layout public fiche artiste                                | 0.5j |
| 8   | RPC `get_edition_tracking`                                 | 1j   |

### Phase 2 — Enchères & shipping

| #   | Tâche                                                         | Est.    |
| --- | ------------------------------------------------------------- | ------- |
| 9   | Scheduler `update_auction_statuses` (pg_cron / GitHub Action) | 1-2j    |
| 10  | Flux enchère → order → Moneroo                                | 2-3 sem |
| 11  | Devis shipping art réel                                       | 3-4 sem |

### Phase 3 — Scale & polish

| #   | Tâche                             | Est.  |
| --- | --------------------------------- | ----- |
| 12  | Page `/verify/:verification_code` | 1 sem |
| 13  | Consolidation modèle certificats  | 2 sem |
| 14  | URLs SEO slug œuvre               | 1 sem |

---

## Annexe — Matrice fichiers ↔ responsabilités

```
src/hooks/artist/
  useArtistProducts.ts      CRUD + stats ventes
  useArtistCertificates.ts  Certificats acheteur
  useArtworkProvenance.ts   Provenance + 3D + certificats catalogue
  useArtistAuctions.ts      Enchères
  useEditionTracking.ts     Stock éditions limitées (affichage)
  useArtistShipping.ts      Wrapper shipping

src/hooks/orders/
  useCreateArtistOrder.ts   Commande mono-œuvre + lock + Moneroo
  useCreateOrder.ts         Routeur par product_type

src/lib/
  artist-certificate-generator.ts   PDF jsPDF (client)
  artist-certificate-auto-generator.ts
  shipping/artist-shipping.ts       Calcul frais
  checkout-order-items.ts           Métadonnées order_items
  checkout-shipping.ts              Agrégation checkout

supabase/migrations/
  20250228000005  Schéma artist_products
  20250131000011  Optimistic locking
  20250131000010  Enchères
  20250128000005  Certificats acheteur
  20250301000002  Validations triggers
```

---

_Fin du rapport technique — généré dans le cadre de l'audit planifié mai 2026._
