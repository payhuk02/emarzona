# 🎯 PLAN D'ACTION - PRIORITÉS HAUTE
## Implémentation des 3 Recommandations Prioritaires

**Date** : 2025-01-30  
**Objectif** : Améliorer Tests, Performance et Nettoyer TODO/FIXME

---

## 📋 PRIORITÉ 1 : AMÉLIORER COUVERTURE TESTS (Objectif 80%+)

### État Actuel
- **Couverture estimée** : ~40%
- **Tests existants** : 79 fichiers de tests
- **Tests E2E** : 50+ tests Playwright
- **Objectif** : 80%+ de couverture

### Plan d'Action

#### Phase 1 : Configuration Coverage ✅
- [x] Vitest configuré avec coverage v8
- [ ] Ajouter script `npm run test:coverage` avec seuil minimum
- [ ] Configurer CI pour bloquer si coverage < 80%

#### Phase 2 : Tests Hooks Critiques 🔴
**Priorité** : Composants sans tests

1. **Hooks Auth & Sécurité** (5 hooks)
   - [ ] `useAuth` - Tests authentification
   - [ ] `useRequire2FA` - Tests 2FA
   - [ ] `usePermissions` - Tests permissions
   - [ ] `useAdmin` - Tests admin
   - [ ] `useKYC` - Tests KYC

2. **Hooks Payments** (8 hooks)
   - [ ] `usePayments` - Tests paiements
   - [ ] `useMoneroo` - Tests Moneroo
   - [ ] `useAdvancedPayments` - Tests paiements avancés
   - [ ] `useWithdrawals` - Tests retraits
   - [ ] `useTransactions` - Tests transactions
   - [ ] `useDisputes` - Tests litiges
   - [ ] `useAffiliateCommissions` - Tests commissions
   - [ ] `usePlatformCommissions` - Tests commissions plateforme

3. **Hooks Products** (10 hooks)
   - [ ] `useProducts` - Tests produits
   - [ ] `useProductManagement` - Tests gestion produits
   - [ ] `useDigitalProducts` - Tests produits digitaux
   - [ ] `usePhysicalProducts` - Tests produits physiques
   - [ ] `useProductSearch` - Tests recherche
   - [ ] `useProductRecommendations` - Tests recommandations
   - [ ] `useProductAnalytics` - Tests analytics
   - [ ] `useReviews` - Tests avis
   - [ ] `useWishlist` - Tests wishlist
   - [ ] `useCart` - Tests panier

4. **Hooks Orders** (6 hooks)
   - [ ] `useOrders` - Tests commandes
   - [ ] `useCreateOrder` - Tests création commande
   - [ ] `useOrderMessaging` - Tests messaging commande
   - [ ] `useShipping` - Tests shipping
   - [ ] `useReturns` - Tests retours
   - [ ] `useOrderTracking` - Tests tracking

#### Phase 3 : Tests Composants Critiques 🔴
**Priorité** : Composants sans tests

1. **Composants Auth** (3 composants)
   - [ ] `ProtectedRoute` - Tests protection routes
   - [ ] `AdminRoute` - Tests routes admin
   - [ ] `Require2FABanner` - Tests banner 2FA

2. **Composants Payments** (5 composants)
   - [ ] `PaymentProviderSelector` - Tests sélection provider
   - [ ] `PaymentForm` - Tests formulaire paiement
   - [ ] `PaymentStatus` - Tests statut paiement
   - [ ] `WithdrawalForm` - Tests formulaire retrait
   - [ ] `DisputeForm` - Tests formulaire litige

3. **Composants Products** (8 composants)
   - [ ] `ProductCard` - Tests carte produit
   - [ ] `ProductDetail` - Tests détail produit
   - [ ] `ProductForm` - Tests formulaire produit
   - [ ] `ProductVariantSelector` - Tests sélection variant
   - [ ] `ProductReviews` - Tests avis produits
   - [ ] `ProductImageGallery` - Tests galerie images
   - [ ] `ProductRecommendations` - Tests recommandations
   - [ ] `WishlistButton` - Tests bouton wishlist

4. **Composants Checkout** (4 composants)
   - [ ] `CheckoutForm` - Tests formulaire checkout
   - [ ] `CartSummary` - Tests résumé panier
   - [ ] `CouponInput` - Tests input coupon
   - [ ] `GiftCardInput` - Tests input carte cadeau

#### Phase 4 : Tests Utilitaires 🔴
**Priorité** : Utilitaires critiques

1. **Lib Utilitaires** (10 fichiers)
   - [ ] `lib/utils.ts` - Tests utilitaires généraux
   - [ ] `lib/validation-utils.ts` - Tests validation
   - [ ] `lib/error-handling.ts` - Tests gestion erreurs
   - [ ] `lib/cache-optimization.ts` - Tests cache
   - [ ] `lib/html-sanitizer.ts` - Tests sanitization
   - [ ] `lib/product-helpers.ts` - Tests helpers produits
   - [ ] `lib/currency-converter.ts` - Tests conversion devise
   - [ ] `lib/date-utils.ts` - Tests utilitaires dates
   - [ ] `lib/format-utils.ts` - Tests formatage
   - [ ] `lib/url-validator.ts` - Tests validation URLs

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **Coverage Total** | ~40% | 80%+ | 🔴 |
| **Tests Hooks** | ~20% | 80%+ | 🔴 |
| **Tests Composants** | ~30% | 80%+ | 🔴 |
| **Tests Utilitaires** | ~50% | 80%+ | 🟡 |

---

## ⚡ PRIORITÉ 2 : OPTIMISER PERFORMANCE

### État Actuel
- **FCP** : ~2s (Objectif : < 1.5s)
- **LCP** : ~4s (Objectif : < 2.5s)
- **TTFB** : Variable (Objectif : < 600ms)

### Plan d'Action

#### Phase 1 : Optimiser FCP (First Contentful Paint) 🔴

1. **CSS Critique** ✅ Partiellement fait
   - [x] `critical-css.ts` existe
   - [ ] Analyser CSS critique réellement utilisé
   - [ ] Inline CSS critique dans `<head>`
   - [ ] Différer CSS non-critique
   - [ ] Réduire taille CSS initial (< 50KB)

2. **JavaScript Initial**
   - [ ] Analyser bundle initial avec `rollup-plugin-visualizer`
   - [ ] Réduire imports non-critiques dans `main.tsx`
   - [ ] Lazy load i18n (déjà fait partiellement)
   - [ ] Lazy load Sentry (déjà fait)
   - [ ] Optimiser imports React Query

3. **Fonts**
   - [ ] Preload fonts critiques
   - [ ] Utiliser `font-display: swap`
   - [ ] Subset fonts (seulement caractères utilisés)
   - [ ] Utiliser `preconnect` pour Google Fonts

#### Phase 2 : Optimiser LCP (Largest Contentful Paint) 🔴

1. **Images Hero**
   - [ ] Identifier images LCP (hero images)
   - [ ] Preload images LCP avec `<link rel="preload">`
   - [ ] Utiliser formats modernes (WebP/AVIF)
   - [ ] Optimiser taille images (< 200KB)
   - [ ] Lazy load images non-LCP

2. **Rendu Initial**
   - [ ] Server-Side Rendering (SSR) pour pages critiques
   - [ ] Ou Static Site Generation (SSG) pour landing
   - [ ] Hydration progressive
   - [ ] Réduire JavaScript blocking

3. **Ressources Critiques**
   - [ ] Preload ressources critiques (CSS, JS, fonts)
   - [ ] Utiliser `resource hints` (preconnect, dns-prefetch)
   - [ ] Optimiser ordre chargement ressources

#### Phase 3 : Optimiser TTFB (Time to First Byte) 🟡

1. **CDN & Edge**
   - [ ] Utiliser Vercel Edge Functions pour routes critiques
   - [ ] CDN pour assets statiques
   - [ ] Cache headers optimisés

2. **Base de Données**
   - [ ] Optimiser requêtes Supabase
   - [ ] Utiliser RPC functions pour requêtes complexes
   - [ ] Cache côté serveur (Supabase Edge Functions)

3. **API Calls**
   - [ ] Réduire nombre requêtes initiales
   - [ ] Combiner requêtes multiples
   - [ ] Utiliser GraphQL si possible

#### Phase 4 : Optimisations Supplémentaires 🟡

1. **Code Splitting**
   - [ ] Analyser chunks avec visualizer
   - [ ] Optimiser taille chunks (< 200KB)
   - [ ] Preload chunks critiques

2. **Cache**
   - [ ] Service Worker pour cache assets
   - [ ] Cache stratégique avec React Query
   - [ ] LocalStorage pour données fréquentes

3. **Monitoring**
   - [ ] Web Vitals monitoring avec Sentry
   - [ ] Alertes si métriques dégradées
   - [ ] Dashboard performance

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **FCP** | ~2s | < 1.5s | 🔴 |
| **LCP** | ~4s | < 2.5s | 🔴 |
| **TTFB** | Variable | < 600ms | 🟡 |
| **Bundle Initial** | Optimisé | < 200KB | 🟡 |

---

## 🧹 PRIORITÉ 3 : NETTOYER TODO/FIXME

### État Actuel
- **Occurrences trouvées** : 385 (beaucoup faux positifs)
- **Vrais TODO/FIXME** : ~30-40 estimés
- **Types** : TODO, FIXME, XXX, HACK, BUG

### Plan d'Action

#### Phase 1 : Audit & Catégorisation 🔴

1. **Filtrer Vrais TODO/FIXME**
   - [ ] Exclure `logger.debug` (faux positifs)
   - [ ] Exclure commentaires CSS debug
   - [ ] Exclure traductions i18n
   - [ ] Lister vrais TODO/FIXME critiques

2. **Catégoriser par Priorité**
   - [ ] 🔴 **Critique** : Bugs, sécurité, fonctionnalités bloquantes
   - [ ] 🟡 **Moyenne** : Améliorations, optimisations
   - [ ] 🟢 **Basse** : Nice-to-have, documentation

3. **Créer Issues GitHub**
   - [ ] Créer issue pour chaque TODO critique
   - [ ] Ajouter labels (bug, enhancement, etc.)
   - [ ] Assigner priorité

#### Phase 2 : Traiter TODO Critiques 🔴

**TODO Critiques Identifiés** :

1. **`src/pages/Marketplace.tsx:384`**
   ```typescript
   // TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter RPC function Supabase
   - [ ] Créer fonction RPC `filter_marketplace_products`
   - [ ] Modifier hook `useMarketplaceProducts`
   - [ ] Tester performance

2. **`src/hooks/useMarketplaceProducts.ts:220`**
   ```typescript
   // TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter filtre variants
   - [ ] Ajouter jointure avec variants
   - [ ] Tester filtrage

3. **`src/lib/files/digital-file-processing.ts:246`**
   ```typescript
   // TODO: Implémenter avec JSZip ou Edge Function
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression ZIP
   - [ ] Ajouter JSZip pour compression
   - [ ] Ou créer Edge Function Supabase

4. **`src/lib/notifications/service-booking-notifications.ts:180`**
   ```typescript
   // TODO: Récupérer le user_id depuis le booking
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Corriger récupération user_id
   - [ ] Modifier requête pour inclure user_id
   - [ ] Tester notifications

5. **`src/hooks/physical/useStockOptimization.ts:291`**
   ```typescript
   // TODO: Calculer depuis l'historique des ventes
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter calcul historique
   - [ ] Créer fonction calcul moyenne ventes
   - [ ] Intégrer dans hook

6. **`src/pages/courses/CourseDetail.tsx:190`**
   ```typescript
   // TODO: Implémenter le paiement et l'inscription
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Implémenter paiement cours
   - [ ] Créer hook `useCoursePayment`
   - [ ] Intégrer dans page

7. **`src/lib/image-upload.ts:99`**
   ```typescript
   // TODO: Implémenter la compression avec canvas ou une librairie
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression images
   - [ ] Utiliser `browser-image-compression` (déjà installé)
   - [ ] Intégrer dans upload

8. **`src/lib/marketing/automation.ts`** (plusieurs TODO)
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter fonctionnalités automation
   - [ ] Vérification schedule
   - [ ] Vérification condition
   - [ ] Envoi SMS
   - [ ] Ajout segment
   - [ ] Appel webhook

#### Phase 3 : Nettoyer Code 🟡

1. **Supprimer TODO Résolus**
   - [ ] Vérifier si certains TODO sont déjà implémentés
   - [ ] Supprimer commentaires obsolètes

2. **Documenter TODO Restants**
   - [ ] Ajouter contexte pour chaque TODO
   - [ ] Ajouter lien vers issue GitHub
   - [ ] Ajouter estimation effort

3. **Créer Template TODO**
   - [ ] Template standardisé pour nouveaux TODO
   - [ ] Format : `// TODO: [PRIORITY] Description - Issue #XXX`

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **TODO Critiques** | ~8 | 0 | 🔴 |
| **TODO Moyennes** | ~15 | < 5 | 🟡 |
| **TODO Basses** | ~10 | < 10 | 🟢 |
| **Issues GitHub** | 0 | 20+ | 🔴 |

---

## 📅 CALENDRIER D'IMPLÉMENTATION

### Semaine 1 : Tests & TODO
- **Jour 1-2** : Configuration coverage + Tests hooks Auth
- **Jour 3-4** : Tests hooks Payments
- **Jour 5** : Audit TODO + Création issues GitHub

### Semaine 2 : Performance & Tests
- **Jour 1-2** : Optimiser FCP (CSS critique, JS initial)
- **Jour 3-4** : Optimiser LCP (images hero, preload)
- **Jour 5** : Tests composants critiques

### Semaine 3 : Finalisation
- **Jour 1-2** : Traiter TODO critiques
- **Jour 3-4** : Tests utilitaires + Coverage final
- **Jour 5** : Optimisations finales + Monitoring

---

## ✅ CHECKLIST PROGRESSION

### Priorité 1 : Tests
- [ ] Configuration coverage complète
- [ ] Tests hooks Auth (5 hooks)
- [ ] Tests hooks Payments (8 hooks)
- [ ] Tests hooks Products (10 hooks)
- [ ] Tests hooks Orders (6 hooks)
- [ ] Tests composants Auth (3 composants)
- [ ] Tests composants Payments (5 composants)
- [ ] Tests composants Products (8 composants)
- [ ] Tests composants Checkout (4 composants)
- [ ] Tests utilitaires (10 fichiers)
- [ ] Coverage 80%+ atteint

### Priorité 2 : Performance
- [ ] CSS critique optimisé (< 50KB)
- [ ] JS initial réduit (< 200KB)
- [ ] Fonts optimisées (preload, subset)
- [ ] Images LCP optimisées (preload, WebP)
- [ ] TTFB optimisé (< 600ms)
- [ ] FCP < 1.5s atteint
- [ ] LCP < 2.5s atteint

### Priorité 3 : TODO/FIXME
- [ ] Audit TODO complet
- [ ] Issues GitHub créées (20+)
- [ ] TODO critiques traités (8)
- [ ] TODO moyennes traitées (15)
- [ ] Code nettoyé et documenté

---

**Prochaine Révision** : 2025-02-07  
**Responsable** : Équipe Développement

## Implémentation des 3 Recommandations Prioritaires

**Date** : 2025-01-30  
**Objectif** : Améliorer Tests, Performance et Nettoyer TODO/FIXME

---

## 📋 PRIORITÉ 1 : AMÉLIORER COUVERTURE TESTS (Objectif 80%+)

### État Actuel
- **Couverture estimée** : ~40%
- **Tests existants** : 79 fichiers de tests
- **Tests E2E** : 50+ tests Playwright
- **Objectif** : 80%+ de couverture

### Plan d'Action

#### Phase 1 : Configuration Coverage ✅
- [x] Vitest configuré avec coverage v8
- [ ] Ajouter script `npm run test:coverage` avec seuil minimum
- [ ] Configurer CI pour bloquer si coverage < 80%

#### Phase 2 : Tests Hooks Critiques 🔴
**Priorité** : Composants sans tests

1. **Hooks Auth & Sécurité** (5 hooks)
   - [ ] `useAuth` - Tests authentification
   - [ ] `useRequire2FA` - Tests 2FA
   - [ ] `usePermissions` - Tests permissions
   - [ ] `useAdmin` - Tests admin
   - [ ] `useKYC` - Tests KYC

2. **Hooks Payments** (8 hooks)
   - [ ] `usePayments` - Tests paiements
   - [ ] `useMoneroo` - Tests Moneroo
   - [ ] `useAdvancedPayments` - Tests paiements avancés
   - [ ] `useWithdrawals` - Tests retraits
   - [ ] `useTransactions` - Tests transactions
   - [ ] `useDisputes` - Tests litiges
   - [ ] `useAffiliateCommissions` - Tests commissions
   - [ ] `usePlatformCommissions` - Tests commissions plateforme

3. **Hooks Products** (10 hooks)
   - [ ] `useProducts` - Tests produits
   - [ ] `useProductManagement` - Tests gestion produits
   - [ ] `useDigitalProducts` - Tests produits digitaux
   - [ ] `usePhysicalProducts` - Tests produits physiques
   - [ ] `useProductSearch` - Tests recherche
   - [ ] `useProductRecommendations` - Tests recommandations
   - [ ] `useProductAnalytics` - Tests analytics
   - [ ] `useReviews` - Tests avis
   - [ ] `useWishlist` - Tests wishlist
   - [ ] `useCart` - Tests panier

4. **Hooks Orders** (6 hooks)
   - [ ] `useOrders` - Tests commandes
   - [ ] `useCreateOrder` - Tests création commande
   - [ ] `useOrderMessaging` - Tests messaging commande
   - [ ] `useShipping` - Tests shipping
   - [ ] `useReturns` - Tests retours
   - [ ] `useOrderTracking` - Tests tracking

#### Phase 3 : Tests Composants Critiques 🔴
**Priorité** : Composants sans tests

1. **Composants Auth** (3 composants)
   - [ ] `ProtectedRoute` - Tests protection routes
   - [ ] `AdminRoute` - Tests routes admin
   - [ ] `Require2FABanner` - Tests banner 2FA

2. **Composants Payments** (5 composants)
   - [ ] `PaymentProviderSelector` - Tests sélection provider
   - [ ] `PaymentForm` - Tests formulaire paiement
   - [ ] `PaymentStatus` - Tests statut paiement
   - [ ] `WithdrawalForm` - Tests formulaire retrait
   - [ ] `DisputeForm` - Tests formulaire litige

3. **Composants Products** (8 composants)
   - [ ] `ProductCard` - Tests carte produit
   - [ ] `ProductDetail` - Tests détail produit
   - [ ] `ProductForm` - Tests formulaire produit
   - [ ] `ProductVariantSelector` - Tests sélection variant
   - [ ] `ProductReviews` - Tests avis produits
   - [ ] `ProductImageGallery` - Tests galerie images
   - [ ] `ProductRecommendations` - Tests recommandations
   - [ ] `WishlistButton` - Tests bouton wishlist

4. **Composants Checkout** (4 composants)
   - [ ] `CheckoutForm` - Tests formulaire checkout
   - [ ] `CartSummary` - Tests résumé panier
   - [ ] `CouponInput` - Tests input coupon
   - [ ] `GiftCardInput` - Tests input carte cadeau

#### Phase 4 : Tests Utilitaires 🔴
**Priorité** : Utilitaires critiques

1. **Lib Utilitaires** (10 fichiers)
   - [ ] `lib/utils.ts` - Tests utilitaires généraux
   - [ ] `lib/validation-utils.ts` - Tests validation
   - [ ] `lib/error-handling.ts` - Tests gestion erreurs
   - [ ] `lib/cache-optimization.ts` - Tests cache
   - [ ] `lib/html-sanitizer.ts` - Tests sanitization
   - [ ] `lib/product-helpers.ts` - Tests helpers produits
   - [ ] `lib/currency-converter.ts` - Tests conversion devise
   - [ ] `lib/date-utils.ts` - Tests utilitaires dates
   - [ ] `lib/format-utils.ts` - Tests formatage
   - [ ] `lib/url-validator.ts` - Tests validation URLs

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **Coverage Total** | ~40% | 80%+ | 🔴 |
| **Tests Hooks** | ~20% | 80%+ | 🔴 |
| **Tests Composants** | ~30% | 80%+ | 🔴 |
| **Tests Utilitaires** | ~50% | 80%+ | 🟡 |

---

## ⚡ PRIORITÉ 2 : OPTIMISER PERFORMANCE

### État Actuel
- **FCP** : ~2s (Objectif : < 1.5s)
- **LCP** : ~4s (Objectif : < 2.5s)
- **TTFB** : Variable (Objectif : < 600ms)

### Plan d'Action

#### Phase 1 : Optimiser FCP (First Contentful Paint) 🔴

1. **CSS Critique** ✅ Partiellement fait
   - [x] `critical-css.ts` existe
   - [ ] Analyser CSS critique réellement utilisé
   - [ ] Inline CSS critique dans `<head>`
   - [ ] Différer CSS non-critique
   - [ ] Réduire taille CSS initial (< 50KB)

2. **JavaScript Initial**
   - [ ] Analyser bundle initial avec `rollup-plugin-visualizer`
   - [ ] Réduire imports non-critiques dans `main.tsx`
   - [ ] Lazy load i18n (déjà fait partiellement)
   - [ ] Lazy load Sentry (déjà fait)
   - [ ] Optimiser imports React Query

3. **Fonts**
   - [ ] Preload fonts critiques
   - [ ] Utiliser `font-display: swap`
   - [ ] Subset fonts (seulement caractères utilisés)
   - [ ] Utiliser `preconnect` pour Google Fonts

#### Phase 2 : Optimiser LCP (Largest Contentful Paint) 🔴

1. **Images Hero**
   - [ ] Identifier images LCP (hero images)
   - [ ] Preload images LCP avec `<link rel="preload">`
   - [ ] Utiliser formats modernes (WebP/AVIF)
   - [ ] Optimiser taille images (< 200KB)
   - [ ] Lazy load images non-LCP

2. **Rendu Initial**
   - [ ] Server-Side Rendering (SSR) pour pages critiques
   - [ ] Ou Static Site Generation (SSG) pour landing
   - [ ] Hydration progressive
   - [ ] Réduire JavaScript blocking

3. **Ressources Critiques**
   - [ ] Preload ressources critiques (CSS, JS, fonts)
   - [ ] Utiliser `resource hints` (preconnect, dns-prefetch)
   - [ ] Optimiser ordre chargement ressources

#### Phase 3 : Optimiser TTFB (Time to First Byte) 🟡

1. **CDN & Edge**
   - [ ] Utiliser Vercel Edge Functions pour routes critiques
   - [ ] CDN pour assets statiques
   - [ ] Cache headers optimisés

2. **Base de Données**
   - [ ] Optimiser requêtes Supabase
   - [ ] Utiliser RPC functions pour requêtes complexes
   - [ ] Cache côté serveur (Supabase Edge Functions)

3. **API Calls**
   - [ ] Réduire nombre requêtes initiales
   - [ ] Combiner requêtes multiples
   - [ ] Utiliser GraphQL si possible

#### Phase 4 : Optimisations Supplémentaires 🟡

1. **Code Splitting**
   - [ ] Analyser chunks avec visualizer
   - [ ] Optimiser taille chunks (< 200KB)
   - [ ] Preload chunks critiques

2. **Cache**
   - [ ] Service Worker pour cache assets
   - [ ] Cache stratégique avec React Query
   - [ ] LocalStorage pour données fréquentes

3. **Monitoring**
   - [ ] Web Vitals monitoring avec Sentry
   - [ ] Alertes si métriques dégradées
   - [ ] Dashboard performance

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **FCP** | ~2s | < 1.5s | 🔴 |
| **LCP** | ~4s | < 2.5s | 🔴 |
| **TTFB** | Variable | < 600ms | 🟡 |
| **Bundle Initial** | Optimisé | < 200KB | 🟡 |

---

## 🧹 PRIORITÉ 3 : NETTOYER TODO/FIXME

### État Actuel
- **Occurrences trouvées** : 385 (beaucoup faux positifs)
- **Vrais TODO/FIXME** : ~30-40 estimés
- **Types** : TODO, FIXME, XXX, HACK, BUG

### Plan d'Action

#### Phase 1 : Audit & Catégorisation 🔴

1. **Filtrer Vrais TODO/FIXME**
   - [ ] Exclure `logger.debug` (faux positifs)
   - [ ] Exclure commentaires CSS debug
   - [ ] Exclure traductions i18n
   - [ ] Lister vrais TODO/FIXME critiques

2. **Catégoriser par Priorité**
   - [ ] 🔴 **Critique** : Bugs, sécurité, fonctionnalités bloquantes
   - [ ] 🟡 **Moyenne** : Améliorations, optimisations
   - [ ] 🟢 **Basse** : Nice-to-have, documentation

3. **Créer Issues GitHub**
   - [ ] Créer issue pour chaque TODO critique
   - [ ] Ajouter labels (bug, enhancement, etc.)
   - [ ] Assigner priorité

#### Phase 2 : Traiter TODO Critiques 🔴

**TODO Critiques Identifiés** :

1. **`src/pages/Marketplace.tsx:384`**
   ```typescript
   // TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter RPC function Supabase
   - [ ] Créer fonction RPC `filter_marketplace_products`
   - [ ] Modifier hook `useMarketplaceProducts`
   - [ ] Tester performance

2. **`src/hooks/useMarketplaceProducts.ts:220`**
   ```typescript
   // TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter filtre variants
   - [ ] Ajouter jointure avec variants
   - [ ] Tester filtrage

3. **`src/lib/files/digital-file-processing.ts:246`**
   ```typescript
   // TODO: Implémenter avec JSZip ou Edge Function
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression ZIP
   - [ ] Ajouter JSZip pour compression
   - [ ] Ou créer Edge Function Supabase

4. **`src/lib/notifications/service-booking-notifications.ts:180`**
   ```typescript
   // TODO: Récupérer le user_id depuis le booking
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Corriger récupération user_id
   - [ ] Modifier requête pour inclure user_id
   - [ ] Tester notifications

5. **`src/hooks/physical/useStockOptimization.ts:291`**
   ```typescript
   // TODO: Calculer depuis l'historique des ventes
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter calcul historique
   - [ ] Créer fonction calcul moyenne ventes
   - [ ] Intégrer dans hook

6. **`src/pages/courses/CourseDetail.tsx:190`**
   ```typescript
   // TODO: Implémenter le paiement et l'inscription
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Implémenter paiement cours
   - [ ] Créer hook `useCoursePayment`
   - [ ] Intégrer dans page

7. **`src/lib/image-upload.ts:99`**
   ```typescript
   // TODO: Implémenter la compression avec canvas ou une librairie
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression images
   - [ ] Utiliser `browser-image-compression` (déjà installé)
   - [ ] Intégrer dans upload

8. **`src/lib/marketing/automation.ts`** (plusieurs TODO)
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter fonctionnalités automation
   - [ ] Vérification schedule
   - [ ] Vérification condition
   - [ ] Envoi SMS
   - [ ] Ajout segment
   - [ ] Appel webhook

#### Phase 3 : Nettoyer Code 🟡

1. **Supprimer TODO Résolus**
   - [ ] Vérifier si certains TODO sont déjà implémentés
   - [ ] Supprimer commentaires obsolètes

2. **Documenter TODO Restants**
   - [ ] Ajouter contexte pour chaque TODO
   - [ ] Ajouter lien vers issue GitHub
   - [ ] Ajouter estimation effort

3. **Créer Template TODO**
   - [ ] Template standardisé pour nouveaux TODO
   - [ ] Format : `// TODO: [PRIORITY] Description - Issue #XXX`

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **TODO Critiques** | ~8 | 0 | 🔴 |
| **TODO Moyennes** | ~15 | < 5 | 🟡 |
| **TODO Basses** | ~10 | < 10 | 🟢 |
| **Issues GitHub** | 0 | 20+ | 🔴 |

---

## 📅 CALENDRIER D'IMPLÉMENTATION

### Semaine 1 : Tests & TODO
- **Jour 1-2** : Configuration coverage + Tests hooks Auth
- **Jour 3-4** : Tests hooks Payments
- **Jour 5** : Audit TODO + Création issues GitHub

### Semaine 2 : Performance & Tests
- **Jour 1-2** : Optimiser FCP (CSS critique, JS initial)
- **Jour 3-4** : Optimiser LCP (images hero, preload)
- **Jour 5** : Tests composants critiques

### Semaine 3 : Finalisation
- **Jour 1-2** : Traiter TODO critiques
- **Jour 3-4** : Tests utilitaires + Coverage final
- **Jour 5** : Optimisations finales + Monitoring

---

## ✅ CHECKLIST PROGRESSION

### Priorité 1 : Tests
- [ ] Configuration coverage complète
- [ ] Tests hooks Auth (5 hooks)
- [ ] Tests hooks Payments (8 hooks)
- [ ] Tests hooks Products (10 hooks)
- [ ] Tests hooks Orders (6 hooks)
- [ ] Tests composants Auth (3 composants)
- [ ] Tests composants Payments (5 composants)
- [ ] Tests composants Products (8 composants)
- [ ] Tests composants Checkout (4 composants)
- [ ] Tests utilitaires (10 fichiers)
- [ ] Coverage 80%+ atteint

### Priorité 2 : Performance
- [ ] CSS critique optimisé (< 50KB)
- [ ] JS initial réduit (< 200KB)
- [ ] Fonts optimisées (preload, subset)
- [ ] Images LCP optimisées (preload, WebP)
- [ ] TTFB optimisé (< 600ms)
- [ ] FCP < 1.5s atteint
- [ ] LCP < 2.5s atteint

### Priorité 3 : TODO/FIXME
- [ ] Audit TODO complet
- [ ] Issues GitHub créées (20+)
- [ ] TODO critiques traités (8)
- [ ] TODO moyennes traitées (15)
- [ ] Code nettoyé et documenté

---

**Prochaine Révision** : 2025-02-07  
**Responsable** : Équipe Développement

## Implémentation des 3 Recommandations Prioritaires

**Date** : 2025-01-30  
**Objectif** : Améliorer Tests, Performance et Nettoyer TODO/FIXME

---

## 📋 PRIORITÉ 1 : AMÉLIORER COUVERTURE TESTS (Objectif 80%+)

### État Actuel
- **Couverture estimée** : ~40%
- **Tests existants** : 79 fichiers de tests
- **Tests E2E** : 50+ tests Playwright
- **Objectif** : 80%+ de couverture

### Plan d'Action

#### Phase 1 : Configuration Coverage ✅
- [x] Vitest configuré avec coverage v8
- [ ] Ajouter script `npm run test:coverage` avec seuil minimum
- [ ] Configurer CI pour bloquer si coverage < 80%

#### Phase 2 : Tests Hooks Critiques 🔴
**Priorité** : Composants sans tests

1. **Hooks Auth & Sécurité** (5 hooks)
   - [ ] `useAuth` - Tests authentification
   - [ ] `useRequire2FA` - Tests 2FA
   - [ ] `usePermissions` - Tests permissions
   - [ ] `useAdmin` - Tests admin
   - [ ] `useKYC` - Tests KYC

2. **Hooks Payments** (8 hooks)
   - [ ] `usePayments` - Tests paiements
   - [ ] `useMoneroo` - Tests Moneroo
   - [ ] `useAdvancedPayments` - Tests paiements avancés
   - [ ] `useWithdrawals` - Tests retraits
   - [ ] `useTransactions` - Tests transactions
   - [ ] `useDisputes` - Tests litiges
   - [ ] `useAffiliateCommissions` - Tests commissions
   - [ ] `usePlatformCommissions` - Tests commissions plateforme

3. **Hooks Products** (10 hooks)
   - [ ] `useProducts` - Tests produits
   - [ ] `useProductManagement` - Tests gestion produits
   - [ ] `useDigitalProducts` - Tests produits digitaux
   - [ ] `usePhysicalProducts` - Tests produits physiques
   - [ ] `useProductSearch` - Tests recherche
   - [ ] `useProductRecommendations` - Tests recommandations
   - [ ] `useProductAnalytics` - Tests analytics
   - [ ] `useReviews` - Tests avis
   - [ ] `useWishlist` - Tests wishlist
   - [ ] `useCart` - Tests panier

4. **Hooks Orders** (6 hooks)
   - [ ] `useOrders` - Tests commandes
   - [ ] `useCreateOrder` - Tests création commande
   - [ ] `useOrderMessaging` - Tests messaging commande
   - [ ] `useShipping` - Tests shipping
   - [ ] `useReturns` - Tests retours
   - [ ] `useOrderTracking` - Tests tracking

#### Phase 3 : Tests Composants Critiques 🔴
**Priorité** : Composants sans tests

1. **Composants Auth** (3 composants)
   - [ ] `ProtectedRoute` - Tests protection routes
   - [ ] `AdminRoute` - Tests routes admin
   - [ ] `Require2FABanner` - Tests banner 2FA

2. **Composants Payments** (5 composants)
   - [ ] `PaymentProviderSelector` - Tests sélection provider
   - [ ] `PaymentForm` - Tests formulaire paiement
   - [ ] `PaymentStatus` - Tests statut paiement
   - [ ] `WithdrawalForm` - Tests formulaire retrait
   - [ ] `DisputeForm` - Tests formulaire litige

3. **Composants Products** (8 composants)
   - [ ] `ProductCard` - Tests carte produit
   - [ ] `ProductDetail` - Tests détail produit
   - [ ] `ProductForm` - Tests formulaire produit
   - [ ] `ProductVariantSelector` - Tests sélection variant
   - [ ] `ProductReviews` - Tests avis produits
   - [ ] `ProductImageGallery` - Tests galerie images
   - [ ] `ProductRecommendations` - Tests recommandations
   - [ ] `WishlistButton` - Tests bouton wishlist

4. **Composants Checkout** (4 composants)
   - [ ] `CheckoutForm` - Tests formulaire checkout
   - [ ] `CartSummary` - Tests résumé panier
   - [ ] `CouponInput` - Tests input coupon
   - [ ] `GiftCardInput` - Tests input carte cadeau

#### Phase 4 : Tests Utilitaires 🔴
**Priorité** : Utilitaires critiques

1. **Lib Utilitaires** (10 fichiers)
   - [ ] `lib/utils.ts` - Tests utilitaires généraux
   - [ ] `lib/validation-utils.ts` - Tests validation
   - [ ] `lib/error-handling.ts` - Tests gestion erreurs
   - [ ] `lib/cache-optimization.ts` - Tests cache
   - [ ] `lib/html-sanitizer.ts` - Tests sanitization
   - [ ] `lib/product-helpers.ts` - Tests helpers produits
   - [ ] `lib/currency-converter.ts` - Tests conversion devise
   - [ ] `lib/date-utils.ts` - Tests utilitaires dates
   - [ ] `lib/format-utils.ts` - Tests formatage
   - [ ] `lib/url-validator.ts` - Tests validation URLs

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **Coverage Total** | ~40% | 80%+ | 🔴 |
| **Tests Hooks** | ~20% | 80%+ | 🔴 |
| **Tests Composants** | ~30% | 80%+ | 🔴 |
| **Tests Utilitaires** | ~50% | 80%+ | 🟡 |

---

## ⚡ PRIORITÉ 2 : OPTIMISER PERFORMANCE

### État Actuel
- **FCP** : ~2s (Objectif : < 1.5s)
- **LCP** : ~4s (Objectif : < 2.5s)
- **TTFB** : Variable (Objectif : < 600ms)

### Plan d'Action

#### Phase 1 : Optimiser FCP (First Contentful Paint) 🔴

1. **CSS Critique** ✅ Partiellement fait
   - [x] `critical-css.ts` existe
   - [ ] Analyser CSS critique réellement utilisé
   - [ ] Inline CSS critique dans `<head>`
   - [ ] Différer CSS non-critique
   - [ ] Réduire taille CSS initial (< 50KB)

2. **JavaScript Initial**
   - [ ] Analyser bundle initial avec `rollup-plugin-visualizer`
   - [ ] Réduire imports non-critiques dans `main.tsx`
   - [ ] Lazy load i18n (déjà fait partiellement)
   - [ ] Lazy load Sentry (déjà fait)
   - [ ] Optimiser imports React Query

3. **Fonts**
   - [ ] Preload fonts critiques
   - [ ] Utiliser `font-display: swap`
   - [ ] Subset fonts (seulement caractères utilisés)
   - [ ] Utiliser `preconnect` pour Google Fonts

#### Phase 2 : Optimiser LCP (Largest Contentful Paint) 🔴

1. **Images Hero**
   - [ ] Identifier images LCP (hero images)
   - [ ] Preload images LCP avec `<link rel="preload">`
   - [ ] Utiliser formats modernes (WebP/AVIF)
   - [ ] Optimiser taille images (< 200KB)
   - [ ] Lazy load images non-LCP

2. **Rendu Initial**
   - [ ] Server-Side Rendering (SSR) pour pages critiques
   - [ ] Ou Static Site Generation (SSG) pour landing
   - [ ] Hydration progressive
   - [ ] Réduire JavaScript blocking

3. **Ressources Critiques**
   - [ ] Preload ressources critiques (CSS, JS, fonts)
   - [ ] Utiliser `resource hints` (preconnect, dns-prefetch)
   - [ ] Optimiser ordre chargement ressources

#### Phase 3 : Optimiser TTFB (Time to First Byte) 🟡

1. **CDN & Edge**
   - [ ] Utiliser Vercel Edge Functions pour routes critiques
   - [ ] CDN pour assets statiques
   - [ ] Cache headers optimisés

2. **Base de Données**
   - [ ] Optimiser requêtes Supabase
   - [ ] Utiliser RPC functions pour requêtes complexes
   - [ ] Cache côté serveur (Supabase Edge Functions)

3. **API Calls**
   - [ ] Réduire nombre requêtes initiales
   - [ ] Combiner requêtes multiples
   - [ ] Utiliser GraphQL si possible

#### Phase 4 : Optimisations Supplémentaires 🟡

1. **Code Splitting**
   - [ ] Analyser chunks avec visualizer
   - [ ] Optimiser taille chunks (< 200KB)
   - [ ] Preload chunks critiques

2. **Cache**
   - [ ] Service Worker pour cache assets
   - [ ] Cache stratégique avec React Query
   - [ ] LocalStorage pour données fréquentes

3. **Monitoring**
   - [ ] Web Vitals monitoring avec Sentry
   - [ ] Alertes si métriques dégradées
   - [ ] Dashboard performance

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **FCP** | ~2s | < 1.5s | 🔴 |
| **LCP** | ~4s | < 2.5s | 🔴 |
| **TTFB** | Variable | < 600ms | 🟡 |
| **Bundle Initial** | Optimisé | < 200KB | 🟡 |

---

## 🧹 PRIORITÉ 3 : NETTOYER TODO/FIXME

### État Actuel
- **Occurrences trouvées** : 385 (beaucoup faux positifs)
- **Vrais TODO/FIXME** : ~30-40 estimés
- **Types** : TODO, FIXME, XXX, HACK, BUG

### Plan d'Action

#### Phase 1 : Audit & Catégorisation 🔴

1. **Filtrer Vrais TODO/FIXME**
   - [ ] Exclure `logger.debug` (faux positifs)
   - [ ] Exclure commentaires CSS debug
   - [ ] Exclure traductions i18n
   - [ ] Lister vrais TODO/FIXME critiques

2. **Catégoriser par Priorité**
   - [ ] 🔴 **Critique** : Bugs, sécurité, fonctionnalités bloquantes
   - [ ] 🟡 **Moyenne** : Améliorations, optimisations
   - [ ] 🟢 **Basse** : Nice-to-have, documentation

3. **Créer Issues GitHub**
   - [ ] Créer issue pour chaque TODO critique
   - [ ] Ajouter labels (bug, enhancement, etc.)
   - [ ] Assigner priorité

#### Phase 2 : Traiter TODO Critiques 🔴

**TODO Critiques Identifiés** :

1. **`src/pages/Marketplace.tsx:384`**
   ```typescript
   // TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter RPC function Supabase
   - [ ] Créer fonction RPC `filter_marketplace_products`
   - [ ] Modifier hook `useMarketplaceProducts`
   - [ ] Tester performance

2. **`src/hooks/useMarketplaceProducts.ts:220`**
   ```typescript
   // TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter filtre variants
   - [ ] Ajouter jointure avec variants
   - [ ] Tester filtrage

3. **`src/lib/files/digital-file-processing.ts:246`**
   ```typescript
   // TODO: Implémenter avec JSZip ou Edge Function
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression ZIP
   - [ ] Ajouter JSZip pour compression
   - [ ] Ou créer Edge Function Supabase

4. **`src/lib/notifications/service-booking-notifications.ts:180`**
   ```typescript
   // TODO: Récupérer le user_id depuis le booking
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Corriger récupération user_id
   - [ ] Modifier requête pour inclure user_id
   - [ ] Tester notifications

5. **`src/hooks/physical/useStockOptimization.ts:291`**
   ```typescript
   // TODO: Calculer depuis l'historique des ventes
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter calcul historique
   - [ ] Créer fonction calcul moyenne ventes
   - [ ] Intégrer dans hook

6. **`src/pages/courses/CourseDetail.tsx:190`**
   ```typescript
   // TODO: Implémenter le paiement et l'inscription
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Implémenter paiement cours
   - [ ] Créer hook `useCoursePayment`
   - [ ] Intégrer dans page

7. **`src/lib/image-upload.ts:99`**
   ```typescript
   // TODO: Implémenter la compression avec canvas ou une librairie
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression images
   - [ ] Utiliser `browser-image-compression` (déjà installé)
   - [ ] Intégrer dans upload

8. **`src/lib/marketing/automation.ts`** (plusieurs TODO)
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter fonctionnalités automation
   - [ ] Vérification schedule
   - [ ] Vérification condition
   - [ ] Envoi SMS
   - [ ] Ajout segment
   - [ ] Appel webhook

#### Phase 3 : Nettoyer Code 🟡

1. **Supprimer TODO Résolus**
   - [ ] Vérifier si certains TODO sont déjà implémentés
   - [ ] Supprimer commentaires obsolètes

2. **Documenter TODO Restants**
   - [ ] Ajouter contexte pour chaque TODO
   - [ ] Ajouter lien vers issue GitHub
   - [ ] Ajouter estimation effort

3. **Créer Template TODO**
   - [ ] Template standardisé pour nouveaux TODO
   - [ ] Format : `// TODO: [PRIORITY] Description - Issue #XXX`

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **TODO Critiques** | ~8 | 0 | 🔴 |
| **TODO Moyennes** | ~15 | < 5 | 🟡 |
| **TODO Basses** | ~10 | < 10 | 🟢 |
| **Issues GitHub** | 0 | 20+ | 🔴 |

---

## 📅 CALENDRIER D'IMPLÉMENTATION

### Semaine 1 : Tests & TODO
- **Jour 1-2** : Configuration coverage + Tests hooks Auth
- **Jour 3-4** : Tests hooks Payments
- **Jour 5** : Audit TODO + Création issues GitHub

### Semaine 2 : Performance & Tests
- **Jour 1-2** : Optimiser FCP (CSS critique, JS initial)
- **Jour 3-4** : Optimiser LCP (images hero, preload)
- **Jour 5** : Tests composants critiques

### Semaine 3 : Finalisation
- **Jour 1-2** : Traiter TODO critiques
- **Jour 3-4** : Tests utilitaires + Coverage final
- **Jour 5** : Optimisations finales + Monitoring

---

## ✅ CHECKLIST PROGRESSION

### Priorité 1 : Tests
- [ ] Configuration coverage complète
- [ ] Tests hooks Auth (5 hooks)
- [ ] Tests hooks Payments (8 hooks)
- [ ] Tests hooks Products (10 hooks)
- [ ] Tests hooks Orders (6 hooks)
- [ ] Tests composants Auth (3 composants)
- [ ] Tests composants Payments (5 composants)
- [ ] Tests composants Products (8 composants)
- [ ] Tests composants Checkout (4 composants)
- [ ] Tests utilitaires (10 fichiers)
- [ ] Coverage 80%+ atteint

### Priorité 2 : Performance
- [ ] CSS critique optimisé (< 50KB)
- [ ] JS initial réduit (< 200KB)
- [ ] Fonts optimisées (preload, subset)
- [ ] Images LCP optimisées (preload, WebP)
- [ ] TTFB optimisé (< 600ms)
- [ ] FCP < 1.5s atteint
- [ ] LCP < 2.5s atteint

### Priorité 3 : TODO/FIXME
- [ ] Audit TODO complet
- [ ] Issues GitHub créées (20+)
- [ ] TODO critiques traités (8)
- [ ] TODO moyennes traitées (15)
- [ ] Code nettoyé et documenté

---

**Prochaine Révision** : 2025-02-07  
**Responsable** : Équipe Développement

## Implémentation des 3 Recommandations Prioritaires

**Date** : 2025-01-30  
**Objectif** : Améliorer Tests, Performance et Nettoyer TODO/FIXME

---

## 📋 PRIORITÉ 1 : AMÉLIORER COUVERTURE TESTS (Objectif 80%+)

### État Actuel
- **Couverture estimée** : ~40%
- **Tests existants** : 79 fichiers de tests
- **Tests E2E** : 50+ tests Playwright
- **Objectif** : 80%+ de couverture

### Plan d'Action

#### Phase 1 : Configuration Coverage ✅
- [x] Vitest configuré avec coverage v8
- [ ] Ajouter script `npm run test:coverage` avec seuil minimum
- [ ] Configurer CI pour bloquer si coverage < 80%

#### Phase 2 : Tests Hooks Critiques 🔴
**Priorité** : Composants sans tests

1. **Hooks Auth & Sécurité** (5 hooks)
   - [ ] `useAuth` - Tests authentification
   - [ ] `useRequire2FA` - Tests 2FA
   - [ ] `usePermissions` - Tests permissions
   - [ ] `useAdmin` - Tests admin
   - [ ] `useKYC` - Tests KYC

2. **Hooks Payments** (8 hooks)
   - [ ] `usePayments` - Tests paiements
   - [ ] `useMoneroo` - Tests Moneroo
   - [ ] `useAdvancedPayments` - Tests paiements avancés
   - [ ] `useWithdrawals` - Tests retraits
   - [ ] `useTransactions` - Tests transactions
   - [ ] `useDisputes` - Tests litiges
   - [ ] `useAffiliateCommissions` - Tests commissions
   - [ ] `usePlatformCommissions` - Tests commissions plateforme

3. **Hooks Products** (10 hooks)
   - [ ] `useProducts` - Tests produits
   - [ ] `useProductManagement` - Tests gestion produits
   - [ ] `useDigitalProducts` - Tests produits digitaux
   - [ ] `usePhysicalProducts` - Tests produits physiques
   - [ ] `useProductSearch` - Tests recherche
   - [ ] `useProductRecommendations` - Tests recommandations
   - [ ] `useProductAnalytics` - Tests analytics
   - [ ] `useReviews` - Tests avis
   - [ ] `useWishlist` - Tests wishlist
   - [ ] `useCart` - Tests panier

4. **Hooks Orders** (6 hooks)
   - [ ] `useOrders` - Tests commandes
   - [ ] `useCreateOrder` - Tests création commande
   - [ ] `useOrderMessaging` - Tests messaging commande
   - [ ] `useShipping` - Tests shipping
   - [ ] `useReturns` - Tests retours
   - [ ] `useOrderTracking` - Tests tracking

#### Phase 3 : Tests Composants Critiques 🔴
**Priorité** : Composants sans tests

1. **Composants Auth** (3 composants)
   - [ ] `ProtectedRoute` - Tests protection routes
   - [ ] `AdminRoute` - Tests routes admin
   - [ ] `Require2FABanner` - Tests banner 2FA

2. **Composants Payments** (5 composants)
   - [ ] `PaymentProviderSelector` - Tests sélection provider
   - [ ] `PaymentForm` - Tests formulaire paiement
   - [ ] `PaymentStatus` - Tests statut paiement
   - [ ] `WithdrawalForm` - Tests formulaire retrait
   - [ ] `DisputeForm` - Tests formulaire litige

3. **Composants Products** (8 composants)
   - [ ] `ProductCard` - Tests carte produit
   - [ ] `ProductDetail` - Tests détail produit
   - [ ] `ProductForm` - Tests formulaire produit
   - [ ] `ProductVariantSelector` - Tests sélection variant
   - [ ] `ProductReviews` - Tests avis produits
   - [ ] `ProductImageGallery` - Tests galerie images
   - [ ] `ProductRecommendations` - Tests recommandations
   - [ ] `WishlistButton` - Tests bouton wishlist

4. **Composants Checkout** (4 composants)
   - [ ] `CheckoutForm` - Tests formulaire checkout
   - [ ] `CartSummary` - Tests résumé panier
   - [ ] `CouponInput` - Tests input coupon
   - [ ] `GiftCardInput` - Tests input carte cadeau

#### Phase 4 : Tests Utilitaires 🔴
**Priorité** : Utilitaires critiques

1. **Lib Utilitaires** (10 fichiers)
   - [ ] `lib/utils.ts` - Tests utilitaires généraux
   - [ ] `lib/validation-utils.ts` - Tests validation
   - [ ] `lib/error-handling.ts` - Tests gestion erreurs
   - [ ] `lib/cache-optimization.ts` - Tests cache
   - [ ] `lib/html-sanitizer.ts` - Tests sanitization
   - [ ] `lib/product-helpers.ts` - Tests helpers produits
   - [ ] `lib/currency-converter.ts` - Tests conversion devise
   - [ ] `lib/date-utils.ts` - Tests utilitaires dates
   - [ ] `lib/format-utils.ts` - Tests formatage
   - [ ] `lib/url-validator.ts` - Tests validation URLs

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **Coverage Total** | ~40% | 80%+ | 🔴 |
| **Tests Hooks** | ~20% | 80%+ | 🔴 |
| **Tests Composants** | ~30% | 80%+ | 🔴 |
| **Tests Utilitaires** | ~50% | 80%+ | 🟡 |

---

## ⚡ PRIORITÉ 2 : OPTIMISER PERFORMANCE

### État Actuel
- **FCP** : ~2s (Objectif : < 1.5s)
- **LCP** : ~4s (Objectif : < 2.5s)
- **TTFB** : Variable (Objectif : < 600ms)

### Plan d'Action

#### Phase 1 : Optimiser FCP (First Contentful Paint) 🔴

1. **CSS Critique** ✅ Partiellement fait
   - [x] `critical-css.ts` existe
   - [ ] Analyser CSS critique réellement utilisé
   - [ ] Inline CSS critique dans `<head>`
   - [ ] Différer CSS non-critique
   - [ ] Réduire taille CSS initial (< 50KB)

2. **JavaScript Initial**
   - [ ] Analyser bundle initial avec `rollup-plugin-visualizer`
   - [ ] Réduire imports non-critiques dans `main.tsx`
   - [ ] Lazy load i18n (déjà fait partiellement)
   - [ ] Lazy load Sentry (déjà fait)
   - [ ] Optimiser imports React Query

3. **Fonts**
   - [ ] Preload fonts critiques
   - [ ] Utiliser `font-display: swap`
   - [ ] Subset fonts (seulement caractères utilisés)
   - [ ] Utiliser `preconnect` pour Google Fonts

#### Phase 2 : Optimiser LCP (Largest Contentful Paint) 🔴

1. **Images Hero**
   - [ ] Identifier images LCP (hero images)
   - [ ] Preload images LCP avec `<link rel="preload">`
   - [ ] Utiliser formats modernes (WebP/AVIF)
   - [ ] Optimiser taille images (< 200KB)
   - [ ] Lazy load images non-LCP

2. **Rendu Initial**
   - [ ] Server-Side Rendering (SSR) pour pages critiques
   - [ ] Ou Static Site Generation (SSG) pour landing
   - [ ] Hydration progressive
   - [ ] Réduire JavaScript blocking

3. **Ressources Critiques**
   - [ ] Preload ressources critiques (CSS, JS, fonts)
   - [ ] Utiliser `resource hints` (preconnect, dns-prefetch)
   - [ ] Optimiser ordre chargement ressources

#### Phase 3 : Optimiser TTFB (Time to First Byte) 🟡

1. **CDN & Edge**
   - [ ] Utiliser Vercel Edge Functions pour routes critiques
   - [ ] CDN pour assets statiques
   - [ ] Cache headers optimisés

2. **Base de Données**
   - [ ] Optimiser requêtes Supabase
   - [ ] Utiliser RPC functions pour requêtes complexes
   - [ ] Cache côté serveur (Supabase Edge Functions)

3. **API Calls**
   - [ ] Réduire nombre requêtes initiales
   - [ ] Combiner requêtes multiples
   - [ ] Utiliser GraphQL si possible

#### Phase 4 : Optimisations Supplémentaires 🟡

1. **Code Splitting**
   - [ ] Analyser chunks avec visualizer
   - [ ] Optimiser taille chunks (< 200KB)
   - [ ] Preload chunks critiques

2. **Cache**
   - [ ] Service Worker pour cache assets
   - [ ] Cache stratégique avec React Query
   - [ ] LocalStorage pour données fréquentes

3. **Monitoring**
   - [ ] Web Vitals monitoring avec Sentry
   - [ ] Alertes si métriques dégradées
   - [ ] Dashboard performance

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **FCP** | ~2s | < 1.5s | 🔴 |
| **LCP** | ~4s | < 2.5s | 🔴 |
| **TTFB** | Variable | < 600ms | 🟡 |
| **Bundle Initial** | Optimisé | < 200KB | 🟡 |

---

## 🧹 PRIORITÉ 3 : NETTOYER TODO/FIXME

### État Actuel
- **Occurrences trouvées** : 385 (beaucoup faux positifs)
- **Vrais TODO/FIXME** : ~30-40 estimés
- **Types** : TODO, FIXME, XXX, HACK, BUG

### Plan d'Action

#### Phase 1 : Audit & Catégorisation 🔴

1. **Filtrer Vrais TODO/FIXME**
   - [ ] Exclure `logger.debug` (faux positifs)
   - [ ] Exclure commentaires CSS debug
   - [ ] Exclure traductions i18n
   - [ ] Lister vrais TODO/FIXME critiques

2. **Catégoriser par Priorité**
   - [ ] 🔴 **Critique** : Bugs, sécurité, fonctionnalités bloquantes
   - [ ] 🟡 **Moyenne** : Améliorations, optimisations
   - [ ] 🟢 **Basse** : Nice-to-have, documentation

3. **Créer Issues GitHub**
   - [ ] Créer issue pour chaque TODO critique
   - [ ] Ajouter labels (bug, enhancement, etc.)
   - [ ] Assigner priorité

#### Phase 2 : Traiter TODO Critiques 🔴

**TODO Critiques Identifiés** :

1. **`src/pages/Marketplace.tsx:384`**
   ```typescript
   // TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter RPC function Supabase
   - [ ] Créer fonction RPC `filter_marketplace_products`
   - [ ] Modifier hook `useMarketplaceProducts`
   - [ ] Tester performance

2. **`src/hooks/useMarketplaceProducts.ts:220`**
   ```typescript
   // TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter filtre variants
   - [ ] Ajouter jointure avec variants
   - [ ] Tester filtrage

3. **`src/lib/files/digital-file-processing.ts:246`**
   ```typescript
   // TODO: Implémenter avec JSZip ou Edge Function
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression ZIP
   - [ ] Ajouter JSZip pour compression
   - [ ] Ou créer Edge Function Supabase

4. **`src/lib/notifications/service-booking-notifications.ts:180`**
   ```typescript
   // TODO: Récupérer le user_id depuis le booking
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Corriger récupération user_id
   - [ ] Modifier requête pour inclure user_id
   - [ ] Tester notifications

5. **`src/hooks/physical/useStockOptimization.ts:291`**
   ```typescript
   // TODO: Calculer depuis l'historique des ventes
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter calcul historique
   - [ ] Créer fonction calcul moyenne ventes
   - [ ] Intégrer dans hook

6. **`src/pages/courses/CourseDetail.tsx:190`**
   ```typescript
   // TODO: Implémenter le paiement et l'inscription
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Implémenter paiement cours
   - [ ] Créer hook `useCoursePayment`
   - [ ] Intégrer dans page

7. **`src/lib/image-upload.ts:99`**
   ```typescript
   // TODO: Implémenter la compression avec canvas ou une librairie
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression images
   - [ ] Utiliser `browser-image-compression` (déjà installé)
   - [ ] Intégrer dans upload

8. **`src/lib/marketing/automation.ts`** (plusieurs TODO)
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter fonctionnalités automation
   - [ ] Vérification schedule
   - [ ] Vérification condition
   - [ ] Envoi SMS
   - [ ] Ajout segment
   - [ ] Appel webhook

#### Phase 3 : Nettoyer Code 🟡

1. **Supprimer TODO Résolus**
   - [ ] Vérifier si certains TODO sont déjà implémentés
   - [ ] Supprimer commentaires obsolètes

2. **Documenter TODO Restants**
   - [ ] Ajouter contexte pour chaque TODO
   - [ ] Ajouter lien vers issue GitHub
   - [ ] Ajouter estimation effort

3. **Créer Template TODO**
   - [ ] Template standardisé pour nouveaux TODO
   - [ ] Format : `// TODO: [PRIORITY] Description - Issue #XXX`

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **TODO Critiques** | ~8 | 0 | 🔴 |
| **TODO Moyennes** | ~15 | < 5 | 🟡 |
| **TODO Basses** | ~10 | < 10 | 🟢 |
| **Issues GitHub** | 0 | 20+ | 🔴 |

---

## 📅 CALENDRIER D'IMPLÉMENTATION

### Semaine 1 : Tests & TODO
- **Jour 1-2** : Configuration coverage + Tests hooks Auth
- **Jour 3-4** : Tests hooks Payments
- **Jour 5** : Audit TODO + Création issues GitHub

### Semaine 2 : Performance & Tests
- **Jour 1-2** : Optimiser FCP (CSS critique, JS initial)
- **Jour 3-4** : Optimiser LCP (images hero, preload)
- **Jour 5** : Tests composants critiques

### Semaine 3 : Finalisation
- **Jour 1-2** : Traiter TODO critiques
- **Jour 3-4** : Tests utilitaires + Coverage final
- **Jour 5** : Optimisations finales + Monitoring

---

## ✅ CHECKLIST PROGRESSION

### Priorité 1 : Tests
- [ ] Configuration coverage complète
- [ ] Tests hooks Auth (5 hooks)
- [ ] Tests hooks Payments (8 hooks)
- [ ] Tests hooks Products (10 hooks)
- [ ] Tests hooks Orders (6 hooks)
- [ ] Tests composants Auth (3 composants)
- [ ] Tests composants Payments (5 composants)
- [ ] Tests composants Products (8 composants)
- [ ] Tests composants Checkout (4 composants)
- [ ] Tests utilitaires (10 fichiers)
- [ ] Coverage 80%+ atteint

### Priorité 2 : Performance
- [ ] CSS critique optimisé (< 50KB)
- [ ] JS initial réduit (< 200KB)
- [ ] Fonts optimisées (preload, subset)
- [ ] Images LCP optimisées (preload, WebP)
- [ ] TTFB optimisé (< 600ms)
- [ ] FCP < 1.5s atteint
- [ ] LCP < 2.5s atteint

### Priorité 3 : TODO/FIXME
- [ ] Audit TODO complet
- [ ] Issues GitHub créées (20+)
- [ ] TODO critiques traités (8)
- [ ] TODO moyennes traitées (15)
- [ ] Code nettoyé et documenté

---

**Prochaine Révision** : 2025-02-07  
**Responsable** : Équipe Développement

## Implémentation des 3 Recommandations Prioritaires

**Date** : 2025-01-30  
**Objectif** : Améliorer Tests, Performance et Nettoyer TODO/FIXME

---

## 📋 PRIORITÉ 1 : AMÉLIORER COUVERTURE TESTS (Objectif 80%+)

### État Actuel
- **Couverture estimée** : ~40%
- **Tests existants** : 79 fichiers de tests
- **Tests E2E** : 50+ tests Playwright
- **Objectif** : 80%+ de couverture

### Plan d'Action

#### Phase 1 : Configuration Coverage ✅
- [x] Vitest configuré avec coverage v8
- [ ] Ajouter script `npm run test:coverage` avec seuil minimum
- [ ] Configurer CI pour bloquer si coverage < 80%

#### Phase 2 : Tests Hooks Critiques 🔴
**Priorité** : Composants sans tests

1. **Hooks Auth & Sécurité** (5 hooks)
   - [ ] `useAuth` - Tests authentification
   - [ ] `useRequire2FA` - Tests 2FA
   - [ ] `usePermissions` - Tests permissions
   - [ ] `useAdmin` - Tests admin
   - [ ] `useKYC` - Tests KYC

2. **Hooks Payments** (8 hooks)
   - [ ] `usePayments` - Tests paiements
   - [ ] `useMoneroo` - Tests Moneroo
   - [ ] `useAdvancedPayments` - Tests paiements avancés
   - [ ] `useWithdrawals` - Tests retraits
   - [ ] `useTransactions` - Tests transactions
   - [ ] `useDisputes` - Tests litiges
   - [ ] `useAffiliateCommissions` - Tests commissions
   - [ ] `usePlatformCommissions` - Tests commissions plateforme

3. **Hooks Products** (10 hooks)
   - [ ] `useProducts` - Tests produits
   - [ ] `useProductManagement` - Tests gestion produits
   - [ ] `useDigitalProducts` - Tests produits digitaux
   - [ ] `usePhysicalProducts` - Tests produits physiques
   - [ ] `useProductSearch` - Tests recherche
   - [ ] `useProductRecommendations` - Tests recommandations
   - [ ] `useProductAnalytics` - Tests analytics
   - [ ] `useReviews` - Tests avis
   - [ ] `useWishlist` - Tests wishlist
   - [ ] `useCart` - Tests panier

4. **Hooks Orders** (6 hooks)
   - [ ] `useOrders` - Tests commandes
   - [ ] `useCreateOrder` - Tests création commande
   - [ ] `useOrderMessaging` - Tests messaging commande
   - [ ] `useShipping` - Tests shipping
   - [ ] `useReturns` - Tests retours
   - [ ] `useOrderTracking` - Tests tracking

#### Phase 3 : Tests Composants Critiques 🔴
**Priorité** : Composants sans tests

1. **Composants Auth** (3 composants)
   - [ ] `ProtectedRoute` - Tests protection routes
   - [ ] `AdminRoute` - Tests routes admin
   - [ ] `Require2FABanner` - Tests banner 2FA

2. **Composants Payments** (5 composants)
   - [ ] `PaymentProviderSelector` - Tests sélection provider
   - [ ] `PaymentForm` - Tests formulaire paiement
   - [ ] `PaymentStatus` - Tests statut paiement
   - [ ] `WithdrawalForm` - Tests formulaire retrait
   - [ ] `DisputeForm` - Tests formulaire litige

3. **Composants Products** (8 composants)
   - [ ] `ProductCard` - Tests carte produit
   - [ ] `ProductDetail` - Tests détail produit
   - [ ] `ProductForm` - Tests formulaire produit
   - [ ] `ProductVariantSelector` - Tests sélection variant
   - [ ] `ProductReviews` - Tests avis produits
   - [ ] `ProductImageGallery` - Tests galerie images
   - [ ] `ProductRecommendations` - Tests recommandations
   - [ ] `WishlistButton` - Tests bouton wishlist

4. **Composants Checkout** (4 composants)
   - [ ] `CheckoutForm` - Tests formulaire checkout
   - [ ] `CartSummary` - Tests résumé panier
   - [ ] `CouponInput` - Tests input coupon
   - [ ] `GiftCardInput` - Tests input carte cadeau

#### Phase 4 : Tests Utilitaires 🔴
**Priorité** : Utilitaires critiques

1. **Lib Utilitaires** (10 fichiers)
   - [ ] `lib/utils.ts` - Tests utilitaires généraux
   - [ ] `lib/validation-utils.ts` - Tests validation
   - [ ] `lib/error-handling.ts` - Tests gestion erreurs
   - [ ] `lib/cache-optimization.ts` - Tests cache
   - [ ] `lib/html-sanitizer.ts` - Tests sanitization
   - [ ] `lib/product-helpers.ts` - Tests helpers produits
   - [ ] `lib/currency-converter.ts` - Tests conversion devise
   - [ ] `lib/date-utils.ts` - Tests utilitaires dates
   - [ ] `lib/format-utils.ts` - Tests formatage
   - [ ] `lib/url-validator.ts` - Tests validation URLs

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **Coverage Total** | ~40% | 80%+ | 🔴 |
| **Tests Hooks** | ~20% | 80%+ | 🔴 |
| **Tests Composants** | ~30% | 80%+ | 🔴 |
| **Tests Utilitaires** | ~50% | 80%+ | 🟡 |

---

## ⚡ PRIORITÉ 2 : OPTIMISER PERFORMANCE

### État Actuel
- **FCP** : ~2s (Objectif : < 1.5s)
- **LCP** : ~4s (Objectif : < 2.5s)
- **TTFB** : Variable (Objectif : < 600ms)

### Plan d'Action

#### Phase 1 : Optimiser FCP (First Contentful Paint) 🔴

1. **CSS Critique** ✅ Partiellement fait
   - [x] `critical-css.ts` existe
   - [ ] Analyser CSS critique réellement utilisé
   - [ ] Inline CSS critique dans `<head>`
   - [ ] Différer CSS non-critique
   - [ ] Réduire taille CSS initial (< 50KB)

2. **JavaScript Initial**
   - [ ] Analyser bundle initial avec `rollup-plugin-visualizer`
   - [ ] Réduire imports non-critiques dans `main.tsx`
   - [ ] Lazy load i18n (déjà fait partiellement)
   - [ ] Lazy load Sentry (déjà fait)
   - [ ] Optimiser imports React Query

3. **Fonts**
   - [ ] Preload fonts critiques
   - [ ] Utiliser `font-display: swap`
   - [ ] Subset fonts (seulement caractères utilisés)
   - [ ] Utiliser `preconnect` pour Google Fonts

#### Phase 2 : Optimiser LCP (Largest Contentful Paint) 🔴

1. **Images Hero**
   - [ ] Identifier images LCP (hero images)
   - [ ] Preload images LCP avec `<link rel="preload">`
   - [ ] Utiliser formats modernes (WebP/AVIF)
   - [ ] Optimiser taille images (< 200KB)
   - [ ] Lazy load images non-LCP

2. **Rendu Initial**
   - [ ] Server-Side Rendering (SSR) pour pages critiques
   - [ ] Ou Static Site Generation (SSG) pour landing
   - [ ] Hydration progressive
   - [ ] Réduire JavaScript blocking

3. **Ressources Critiques**
   - [ ] Preload ressources critiques (CSS, JS, fonts)
   - [ ] Utiliser `resource hints` (preconnect, dns-prefetch)
   - [ ] Optimiser ordre chargement ressources

#### Phase 3 : Optimiser TTFB (Time to First Byte) 🟡

1. **CDN & Edge**
   - [ ] Utiliser Vercel Edge Functions pour routes critiques
   - [ ] CDN pour assets statiques
   - [ ] Cache headers optimisés

2. **Base de Données**
   - [ ] Optimiser requêtes Supabase
   - [ ] Utiliser RPC functions pour requêtes complexes
   - [ ] Cache côté serveur (Supabase Edge Functions)

3. **API Calls**
   - [ ] Réduire nombre requêtes initiales
   - [ ] Combiner requêtes multiples
   - [ ] Utiliser GraphQL si possible

#### Phase 4 : Optimisations Supplémentaires 🟡

1. **Code Splitting**
   - [ ] Analyser chunks avec visualizer
   - [ ] Optimiser taille chunks (< 200KB)
   - [ ] Preload chunks critiques

2. **Cache**
   - [ ] Service Worker pour cache assets
   - [ ] Cache stratégique avec React Query
   - [ ] LocalStorage pour données fréquentes

3. **Monitoring**
   - [ ] Web Vitals monitoring avec Sentry
   - [ ] Alertes si métriques dégradées
   - [ ] Dashboard performance

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **FCP** | ~2s | < 1.5s | 🔴 |
| **LCP** | ~4s | < 2.5s | 🔴 |
| **TTFB** | Variable | < 600ms | 🟡 |
| **Bundle Initial** | Optimisé | < 200KB | 🟡 |

---

## 🧹 PRIORITÉ 3 : NETTOYER TODO/FIXME

### État Actuel
- **Occurrences trouvées** : 385 (beaucoup faux positifs)
- **Vrais TODO/FIXME** : ~30-40 estimés
- **Types** : TODO, FIXME, XXX, HACK, BUG

### Plan d'Action

#### Phase 1 : Audit & Catégorisation 🔴

1. **Filtrer Vrais TODO/FIXME**
   - [ ] Exclure `logger.debug` (faux positifs)
   - [ ] Exclure commentaires CSS debug
   - [ ] Exclure traductions i18n
   - [ ] Lister vrais TODO/FIXME critiques

2. **Catégoriser par Priorité**
   - [ ] 🔴 **Critique** : Bugs, sécurité, fonctionnalités bloquantes
   - [ ] 🟡 **Moyenne** : Améliorations, optimisations
   - [ ] 🟢 **Basse** : Nice-to-have, documentation

3. **Créer Issues GitHub**
   - [ ] Créer issue pour chaque TODO critique
   - [ ] Ajouter labels (bug, enhancement, etc.)
   - [ ] Assigner priorité

#### Phase 2 : Traiter TODO Critiques 🔴

**TODO Critiques Identifiés** :

1. **`src/pages/Marketplace.tsx:384`**
   ```typescript
   // TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter RPC function Supabase
   - [ ] Créer fonction RPC `filter_marketplace_products`
   - [ ] Modifier hook `useMarketplaceProducts`
   - [ ] Tester performance

2. **`src/hooks/useMarketplaceProducts.ts:220`**
   ```typescript
   // TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter filtre variants
   - [ ] Ajouter jointure avec variants
   - [ ] Tester filtrage

3. **`src/lib/files/digital-file-processing.ts:246`**
   ```typescript
   // TODO: Implémenter avec JSZip ou Edge Function
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression ZIP
   - [ ] Ajouter JSZip pour compression
   - [ ] Ou créer Edge Function Supabase

4. **`src/lib/notifications/service-booking-notifications.ts:180`**
   ```typescript
   // TODO: Récupérer le user_id depuis le booking
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Corriger récupération user_id
   - [ ] Modifier requête pour inclure user_id
   - [ ] Tester notifications

5. **`src/hooks/physical/useStockOptimization.ts:291`**
   ```typescript
   // TODO: Calculer depuis l'historique des ventes
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter calcul historique
   - [ ] Créer fonction calcul moyenne ventes
   - [ ] Intégrer dans hook

6. **`src/pages/courses/CourseDetail.tsx:190`**
   ```typescript
   // TODO: Implémenter le paiement et l'inscription
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Implémenter paiement cours
   - [ ] Créer hook `useCoursePayment`
   - [ ] Intégrer dans page

7. **`src/lib/image-upload.ts:99`**
   ```typescript
   // TODO: Implémenter la compression avec canvas ou une librairie
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression images
   - [ ] Utiliser `browser-image-compression` (déjà installé)
   - [ ] Intégrer dans upload

8. **`src/lib/marketing/automation.ts`** (plusieurs TODO)
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter fonctionnalités automation
   - [ ] Vérification schedule
   - [ ] Vérification condition
   - [ ] Envoi SMS
   - [ ] Ajout segment
   - [ ] Appel webhook

#### Phase 3 : Nettoyer Code 🟡

1. **Supprimer TODO Résolus**
   - [ ] Vérifier si certains TODO sont déjà implémentés
   - [ ] Supprimer commentaires obsolètes

2. **Documenter TODO Restants**
   - [ ] Ajouter contexte pour chaque TODO
   - [ ] Ajouter lien vers issue GitHub
   - [ ] Ajouter estimation effort

3. **Créer Template TODO**
   - [ ] Template standardisé pour nouveaux TODO
   - [ ] Format : `// TODO: [PRIORITY] Description - Issue #XXX`

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **TODO Critiques** | ~8 | 0 | 🔴 |
| **TODO Moyennes** | ~15 | < 5 | 🟡 |
| **TODO Basses** | ~10 | < 10 | 🟢 |
| **Issues GitHub** | 0 | 20+ | 🔴 |

---

## 📅 CALENDRIER D'IMPLÉMENTATION

### Semaine 1 : Tests & TODO
- **Jour 1-2** : Configuration coverage + Tests hooks Auth
- **Jour 3-4** : Tests hooks Payments
- **Jour 5** : Audit TODO + Création issues GitHub

### Semaine 2 : Performance & Tests
- **Jour 1-2** : Optimiser FCP (CSS critique, JS initial)
- **Jour 3-4** : Optimiser LCP (images hero, preload)
- **Jour 5** : Tests composants critiques

### Semaine 3 : Finalisation
- **Jour 1-2** : Traiter TODO critiques
- **Jour 3-4** : Tests utilitaires + Coverage final
- **Jour 5** : Optimisations finales + Monitoring

---

## ✅ CHECKLIST PROGRESSION

### Priorité 1 : Tests
- [ ] Configuration coverage complète
- [ ] Tests hooks Auth (5 hooks)
- [ ] Tests hooks Payments (8 hooks)
- [ ] Tests hooks Products (10 hooks)
- [ ] Tests hooks Orders (6 hooks)
- [ ] Tests composants Auth (3 composants)
- [ ] Tests composants Payments (5 composants)
- [ ] Tests composants Products (8 composants)
- [ ] Tests composants Checkout (4 composants)
- [ ] Tests utilitaires (10 fichiers)
- [ ] Coverage 80%+ atteint

### Priorité 2 : Performance
- [ ] CSS critique optimisé (< 50KB)
- [ ] JS initial réduit (< 200KB)
- [ ] Fonts optimisées (preload, subset)
- [ ] Images LCP optimisées (preload, WebP)
- [ ] TTFB optimisé (< 600ms)
- [ ] FCP < 1.5s atteint
- [ ] LCP < 2.5s atteint

### Priorité 3 : TODO/FIXME
- [ ] Audit TODO complet
- [ ] Issues GitHub créées (20+)
- [ ] TODO critiques traités (8)
- [ ] TODO moyennes traitées (15)
- [ ] Code nettoyé et documenté

---

**Prochaine Révision** : 2025-02-07  
**Responsable** : Équipe Développement

## Implémentation des 3 Recommandations Prioritaires

**Date** : 2025-01-30  
**Objectif** : Améliorer Tests, Performance et Nettoyer TODO/FIXME

---

## 📋 PRIORITÉ 1 : AMÉLIORER COUVERTURE TESTS (Objectif 80%+)

### État Actuel
- **Couverture estimée** : ~40%
- **Tests existants** : 79 fichiers de tests
- **Tests E2E** : 50+ tests Playwright
- **Objectif** : 80%+ de couverture

### Plan d'Action

#### Phase 1 : Configuration Coverage ✅
- [x] Vitest configuré avec coverage v8
- [ ] Ajouter script `npm run test:coverage` avec seuil minimum
- [ ] Configurer CI pour bloquer si coverage < 80%

#### Phase 2 : Tests Hooks Critiques 🔴
**Priorité** : Composants sans tests

1. **Hooks Auth & Sécurité** (5 hooks)
   - [ ] `useAuth` - Tests authentification
   - [ ] `useRequire2FA` - Tests 2FA
   - [ ] `usePermissions` - Tests permissions
   - [ ] `useAdmin` - Tests admin
   - [ ] `useKYC` - Tests KYC

2. **Hooks Payments** (8 hooks)
   - [ ] `usePayments` - Tests paiements
   - [ ] `useMoneroo` - Tests Moneroo
   - [ ] `useAdvancedPayments` - Tests paiements avancés
   - [ ] `useWithdrawals` - Tests retraits
   - [ ] `useTransactions` - Tests transactions
   - [ ] `useDisputes` - Tests litiges
   - [ ] `useAffiliateCommissions` - Tests commissions
   - [ ] `usePlatformCommissions` - Tests commissions plateforme

3. **Hooks Products** (10 hooks)
   - [ ] `useProducts` - Tests produits
   - [ ] `useProductManagement` - Tests gestion produits
   - [ ] `useDigitalProducts` - Tests produits digitaux
   - [ ] `usePhysicalProducts` - Tests produits physiques
   - [ ] `useProductSearch` - Tests recherche
   - [ ] `useProductRecommendations` - Tests recommandations
   - [ ] `useProductAnalytics` - Tests analytics
   - [ ] `useReviews` - Tests avis
   - [ ] `useWishlist` - Tests wishlist
   - [ ] `useCart` - Tests panier

4. **Hooks Orders** (6 hooks)
   - [ ] `useOrders` - Tests commandes
   - [ ] `useCreateOrder` - Tests création commande
   - [ ] `useOrderMessaging` - Tests messaging commande
   - [ ] `useShipping` - Tests shipping
   - [ ] `useReturns` - Tests retours
   - [ ] `useOrderTracking` - Tests tracking

#### Phase 3 : Tests Composants Critiques 🔴
**Priorité** : Composants sans tests

1. **Composants Auth** (3 composants)
   - [ ] `ProtectedRoute` - Tests protection routes
   - [ ] `AdminRoute` - Tests routes admin
   - [ ] `Require2FABanner` - Tests banner 2FA

2. **Composants Payments** (5 composants)
   - [ ] `PaymentProviderSelector` - Tests sélection provider
   - [ ] `PaymentForm` - Tests formulaire paiement
   - [ ] `PaymentStatus` - Tests statut paiement
   - [ ] `WithdrawalForm` - Tests formulaire retrait
   - [ ] `DisputeForm` - Tests formulaire litige

3. **Composants Products** (8 composants)
   - [ ] `ProductCard` - Tests carte produit
   - [ ] `ProductDetail` - Tests détail produit
   - [ ] `ProductForm` - Tests formulaire produit
   - [ ] `ProductVariantSelector` - Tests sélection variant
   - [ ] `ProductReviews` - Tests avis produits
   - [ ] `ProductImageGallery` - Tests galerie images
   - [ ] `ProductRecommendations` - Tests recommandations
   - [ ] `WishlistButton` - Tests bouton wishlist

4. **Composants Checkout** (4 composants)
   - [ ] `CheckoutForm` - Tests formulaire checkout
   - [ ] `CartSummary` - Tests résumé panier
   - [ ] `CouponInput` - Tests input coupon
   - [ ] `GiftCardInput` - Tests input carte cadeau

#### Phase 4 : Tests Utilitaires 🔴
**Priorité** : Utilitaires critiques

1. **Lib Utilitaires** (10 fichiers)
   - [ ] `lib/utils.ts` - Tests utilitaires généraux
   - [ ] `lib/validation-utils.ts` - Tests validation
   - [ ] `lib/error-handling.ts` - Tests gestion erreurs
   - [ ] `lib/cache-optimization.ts` - Tests cache
   - [ ] `lib/html-sanitizer.ts` - Tests sanitization
   - [ ] `lib/product-helpers.ts` - Tests helpers produits
   - [ ] `lib/currency-converter.ts` - Tests conversion devise
   - [ ] `lib/date-utils.ts` - Tests utilitaires dates
   - [ ] `lib/format-utils.ts` - Tests formatage
   - [ ] `lib/url-validator.ts` - Tests validation URLs

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **Coverage Total** | ~40% | 80%+ | 🔴 |
| **Tests Hooks** | ~20% | 80%+ | 🔴 |
| **Tests Composants** | ~30% | 80%+ | 🔴 |
| **Tests Utilitaires** | ~50% | 80%+ | 🟡 |

---

## ⚡ PRIORITÉ 2 : OPTIMISER PERFORMANCE

### État Actuel
- **FCP** : ~2s (Objectif : < 1.5s)
- **LCP** : ~4s (Objectif : < 2.5s)
- **TTFB** : Variable (Objectif : < 600ms)

### Plan d'Action

#### Phase 1 : Optimiser FCP (First Contentful Paint) 🔴

1. **CSS Critique** ✅ Partiellement fait
   - [x] `critical-css.ts` existe
   - [ ] Analyser CSS critique réellement utilisé
   - [ ] Inline CSS critique dans `<head>`
   - [ ] Différer CSS non-critique
   - [ ] Réduire taille CSS initial (< 50KB)

2. **JavaScript Initial**
   - [ ] Analyser bundle initial avec `rollup-plugin-visualizer`
   - [ ] Réduire imports non-critiques dans `main.tsx`
   - [ ] Lazy load i18n (déjà fait partiellement)
   - [ ] Lazy load Sentry (déjà fait)
   - [ ] Optimiser imports React Query

3. **Fonts**
   - [ ] Preload fonts critiques
   - [ ] Utiliser `font-display: swap`
   - [ ] Subset fonts (seulement caractères utilisés)
   - [ ] Utiliser `preconnect` pour Google Fonts

#### Phase 2 : Optimiser LCP (Largest Contentful Paint) 🔴

1. **Images Hero**
   - [ ] Identifier images LCP (hero images)
   - [ ] Preload images LCP avec `<link rel="preload">`
   - [ ] Utiliser formats modernes (WebP/AVIF)
   - [ ] Optimiser taille images (< 200KB)
   - [ ] Lazy load images non-LCP

2. **Rendu Initial**
   - [ ] Server-Side Rendering (SSR) pour pages critiques
   - [ ] Ou Static Site Generation (SSG) pour landing
   - [ ] Hydration progressive
   - [ ] Réduire JavaScript blocking

3. **Ressources Critiques**
   - [ ] Preload ressources critiques (CSS, JS, fonts)
   - [ ] Utiliser `resource hints` (preconnect, dns-prefetch)
   - [ ] Optimiser ordre chargement ressources

#### Phase 3 : Optimiser TTFB (Time to First Byte) 🟡

1. **CDN & Edge**
   - [ ] Utiliser Vercel Edge Functions pour routes critiques
   - [ ] CDN pour assets statiques
   - [ ] Cache headers optimisés

2. **Base de Données**
   - [ ] Optimiser requêtes Supabase
   - [ ] Utiliser RPC functions pour requêtes complexes
   - [ ] Cache côté serveur (Supabase Edge Functions)

3. **API Calls**
   - [ ] Réduire nombre requêtes initiales
   - [ ] Combiner requêtes multiples
   - [ ] Utiliser GraphQL si possible

#### Phase 4 : Optimisations Supplémentaires 🟡

1. **Code Splitting**
   - [ ] Analyser chunks avec visualizer
   - [ ] Optimiser taille chunks (< 200KB)
   - [ ] Preload chunks critiques

2. **Cache**
   - [ ] Service Worker pour cache assets
   - [ ] Cache stratégique avec React Query
   - [ ] LocalStorage pour données fréquentes

3. **Monitoring**
   - [ ] Web Vitals monitoring avec Sentry
   - [ ] Alertes si métriques dégradées
   - [ ] Dashboard performance

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **FCP** | ~2s | < 1.5s | 🔴 |
| **LCP** | ~4s | < 2.5s | 🔴 |
| **TTFB** | Variable | < 600ms | 🟡 |
| **Bundle Initial** | Optimisé | < 200KB | 🟡 |

---

## 🧹 PRIORITÉ 3 : NETTOYER TODO/FIXME

### État Actuel
- **Occurrences trouvées** : 385 (beaucoup faux positifs)
- **Vrais TODO/FIXME** : ~30-40 estimés
- **Types** : TODO, FIXME, XXX, HACK, BUG

### Plan d'Action

#### Phase 1 : Audit & Catégorisation 🔴

1. **Filtrer Vrais TODO/FIXME**
   - [ ] Exclure `logger.debug` (faux positifs)
   - [ ] Exclure commentaires CSS debug
   - [ ] Exclure traductions i18n
   - [ ] Lister vrais TODO/FIXME critiques

2. **Catégoriser par Priorité**
   - [ ] 🔴 **Critique** : Bugs, sécurité, fonctionnalités bloquantes
   - [ ] 🟡 **Moyenne** : Améliorations, optimisations
   - [ ] 🟢 **Basse** : Nice-to-have, documentation

3. **Créer Issues GitHub**
   - [ ] Créer issue pour chaque TODO critique
   - [ ] Ajouter labels (bug, enhancement, etc.)
   - [ ] Assigner priorité

#### Phase 2 : Traiter TODO Critiques 🔴

**TODO Critiques Identifiés** :

1. **`src/pages/Marketplace.tsx:384`**
   ```typescript
   // TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter RPC function Supabase
   - [ ] Créer fonction RPC `filter_marketplace_products`
   - [ ] Modifier hook `useMarketplaceProducts`
   - [ ] Tester performance

2. **`src/hooks/useMarketplaceProducts.ts:220`**
   ```typescript
   // TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter filtre variants
   - [ ] Ajouter jointure avec variants
   - [ ] Tester filtrage

3. **`src/lib/files/digital-file-processing.ts:246`**
   ```typescript
   // TODO: Implémenter avec JSZip ou Edge Function
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression ZIP
   - [ ] Ajouter JSZip pour compression
   - [ ] Ou créer Edge Function Supabase

4. **`src/lib/notifications/service-booking-notifications.ts:180`**
   ```typescript
   // TODO: Récupérer le user_id depuis le booking
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Corriger récupération user_id
   - [ ] Modifier requête pour inclure user_id
   - [ ] Tester notifications

5. **`src/hooks/physical/useStockOptimization.ts:291`**
   ```typescript
   // TODO: Calculer depuis l'historique des ventes
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter calcul historique
   - [ ] Créer fonction calcul moyenne ventes
   - [ ] Intégrer dans hook

6. **`src/pages/courses/CourseDetail.tsx:190`**
   ```typescript
   // TODO: Implémenter le paiement et l'inscription
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Implémenter paiement cours
   - [ ] Créer hook `useCoursePayment`
   - [ ] Intégrer dans page

7. **`src/lib/image-upload.ts:99`**
   ```typescript
   // TODO: Implémenter la compression avec canvas ou une librairie
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression images
   - [ ] Utiliser `browser-image-compression` (déjà installé)
   - [ ] Intégrer dans upload

8. **`src/lib/marketing/automation.ts`** (plusieurs TODO)
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter fonctionnalités automation
   - [ ] Vérification schedule
   - [ ] Vérification condition
   - [ ] Envoi SMS
   - [ ] Ajout segment
   - [ ] Appel webhook

#### Phase 3 : Nettoyer Code 🟡

1. **Supprimer TODO Résolus**
   - [ ] Vérifier si certains TODO sont déjà implémentés
   - [ ] Supprimer commentaires obsolètes

2. **Documenter TODO Restants**
   - [ ] Ajouter contexte pour chaque TODO
   - [ ] Ajouter lien vers issue GitHub
   - [ ] Ajouter estimation effort

3. **Créer Template TODO**
   - [ ] Template standardisé pour nouveaux TODO
   - [ ] Format : `// TODO: [PRIORITY] Description - Issue #XXX`

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **TODO Critiques** | ~8 | 0 | 🔴 |
| **TODO Moyennes** | ~15 | < 5 | 🟡 |
| **TODO Basses** | ~10 | < 10 | 🟢 |
| **Issues GitHub** | 0 | 20+ | 🔴 |

---

## 📅 CALENDRIER D'IMPLÉMENTATION

### Semaine 1 : Tests & TODO
- **Jour 1-2** : Configuration coverage + Tests hooks Auth
- **Jour 3-4** : Tests hooks Payments
- **Jour 5** : Audit TODO + Création issues GitHub

### Semaine 2 : Performance & Tests
- **Jour 1-2** : Optimiser FCP (CSS critique, JS initial)
- **Jour 3-4** : Optimiser LCP (images hero, preload)
- **Jour 5** : Tests composants critiques

### Semaine 3 : Finalisation
- **Jour 1-2** : Traiter TODO critiques
- **Jour 3-4** : Tests utilitaires + Coverage final
- **Jour 5** : Optimisations finales + Monitoring

---

## ✅ CHECKLIST PROGRESSION

### Priorité 1 : Tests
- [ ] Configuration coverage complète
- [ ] Tests hooks Auth (5 hooks)
- [ ] Tests hooks Payments (8 hooks)
- [ ] Tests hooks Products (10 hooks)
- [ ] Tests hooks Orders (6 hooks)
- [ ] Tests composants Auth (3 composants)
- [ ] Tests composants Payments (5 composants)
- [ ] Tests composants Products (8 composants)
- [ ] Tests composants Checkout (4 composants)
- [ ] Tests utilitaires (10 fichiers)
- [ ] Coverage 80%+ atteint

### Priorité 2 : Performance
- [ ] CSS critique optimisé (< 50KB)
- [ ] JS initial réduit (< 200KB)
- [ ] Fonts optimisées (preload, subset)
- [ ] Images LCP optimisées (preload, WebP)
- [ ] TTFB optimisé (< 600ms)
- [ ] FCP < 1.5s atteint
- [ ] LCP < 2.5s atteint

### Priorité 3 : TODO/FIXME
- [ ] Audit TODO complet
- [ ] Issues GitHub créées (20+)
- [ ] TODO critiques traités (8)
- [ ] TODO moyennes traitées (15)
- [ ] Code nettoyé et documenté

---

**Prochaine Révision** : 2025-02-07  
**Responsable** : Équipe Développement

## Implémentation des 3 Recommandations Prioritaires

**Date** : 2025-01-30  
**Objectif** : Améliorer Tests, Performance et Nettoyer TODO/FIXME

---

## 📋 PRIORITÉ 1 : AMÉLIORER COUVERTURE TESTS (Objectif 80%+)

### État Actuel
- **Couverture estimée** : ~40%
- **Tests existants** : 79 fichiers de tests
- **Tests E2E** : 50+ tests Playwright
- **Objectif** : 80%+ de couverture

### Plan d'Action

#### Phase 1 : Configuration Coverage ✅
- [x] Vitest configuré avec coverage v8
- [ ] Ajouter script `npm run test:coverage` avec seuil minimum
- [ ] Configurer CI pour bloquer si coverage < 80%

#### Phase 2 : Tests Hooks Critiques 🔴
**Priorité** : Composants sans tests

1. **Hooks Auth & Sécurité** (5 hooks)
   - [ ] `useAuth` - Tests authentification
   - [ ] `useRequire2FA` - Tests 2FA
   - [ ] `usePermissions` - Tests permissions
   - [ ] `useAdmin` - Tests admin
   - [ ] `useKYC` - Tests KYC

2. **Hooks Payments** (8 hooks)
   - [ ] `usePayments` - Tests paiements
   - [ ] `useMoneroo` - Tests Moneroo
   - [ ] `useAdvancedPayments` - Tests paiements avancés
   - [ ] `useWithdrawals` - Tests retraits
   - [ ] `useTransactions` - Tests transactions
   - [ ] `useDisputes` - Tests litiges
   - [ ] `useAffiliateCommissions` - Tests commissions
   - [ ] `usePlatformCommissions` - Tests commissions plateforme

3. **Hooks Products** (10 hooks)
   - [ ] `useProducts` - Tests produits
   - [ ] `useProductManagement` - Tests gestion produits
   - [ ] `useDigitalProducts` - Tests produits digitaux
   - [ ] `usePhysicalProducts` - Tests produits physiques
   - [ ] `useProductSearch` - Tests recherche
   - [ ] `useProductRecommendations` - Tests recommandations
   - [ ] `useProductAnalytics` - Tests analytics
   - [ ] `useReviews` - Tests avis
   - [ ] `useWishlist` - Tests wishlist
   - [ ] `useCart` - Tests panier

4. **Hooks Orders** (6 hooks)
   - [ ] `useOrders` - Tests commandes
   - [ ] `useCreateOrder` - Tests création commande
   - [ ] `useOrderMessaging` - Tests messaging commande
   - [ ] `useShipping` - Tests shipping
   - [ ] `useReturns` - Tests retours
   - [ ] `useOrderTracking` - Tests tracking

#### Phase 3 : Tests Composants Critiques 🔴
**Priorité** : Composants sans tests

1. **Composants Auth** (3 composants)
   - [ ] `ProtectedRoute` - Tests protection routes
   - [ ] `AdminRoute` - Tests routes admin
   - [ ] `Require2FABanner` - Tests banner 2FA

2. **Composants Payments** (5 composants)
   - [ ] `PaymentProviderSelector` - Tests sélection provider
   - [ ] `PaymentForm` - Tests formulaire paiement
   - [ ] `PaymentStatus` - Tests statut paiement
   - [ ] `WithdrawalForm` - Tests formulaire retrait
   - [ ] `DisputeForm` - Tests formulaire litige

3. **Composants Products** (8 composants)
   - [ ] `ProductCard` - Tests carte produit
   - [ ] `ProductDetail` - Tests détail produit
   - [ ] `ProductForm` - Tests formulaire produit
   - [ ] `ProductVariantSelector` - Tests sélection variant
   - [ ] `ProductReviews` - Tests avis produits
   - [ ] `ProductImageGallery` - Tests galerie images
   - [ ] `ProductRecommendations` - Tests recommandations
   - [ ] `WishlistButton` - Tests bouton wishlist

4. **Composants Checkout** (4 composants)
   - [ ] `CheckoutForm` - Tests formulaire checkout
   - [ ] `CartSummary` - Tests résumé panier
   - [ ] `CouponInput` - Tests input coupon
   - [ ] `GiftCardInput` - Tests input carte cadeau

#### Phase 4 : Tests Utilitaires 🔴
**Priorité** : Utilitaires critiques

1. **Lib Utilitaires** (10 fichiers)
   - [ ] `lib/utils.ts` - Tests utilitaires généraux
   - [ ] `lib/validation-utils.ts` - Tests validation
   - [ ] `lib/error-handling.ts` - Tests gestion erreurs
   - [ ] `lib/cache-optimization.ts` - Tests cache
   - [ ] `lib/html-sanitizer.ts` - Tests sanitization
   - [ ] `lib/product-helpers.ts` - Tests helpers produits
   - [ ] `lib/currency-converter.ts` - Tests conversion devise
   - [ ] `lib/date-utils.ts` - Tests utilitaires dates
   - [ ] `lib/format-utils.ts` - Tests formatage
   - [ ] `lib/url-validator.ts` - Tests validation URLs

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **Coverage Total** | ~40% | 80%+ | 🔴 |
| **Tests Hooks** | ~20% | 80%+ | 🔴 |
| **Tests Composants** | ~30% | 80%+ | 🔴 |
| **Tests Utilitaires** | ~50% | 80%+ | 🟡 |

---

## ⚡ PRIORITÉ 2 : OPTIMISER PERFORMANCE

### État Actuel
- **FCP** : ~2s (Objectif : < 1.5s)
- **LCP** : ~4s (Objectif : < 2.5s)
- **TTFB** : Variable (Objectif : < 600ms)

### Plan d'Action

#### Phase 1 : Optimiser FCP (First Contentful Paint) 🔴

1. **CSS Critique** ✅ Partiellement fait
   - [x] `critical-css.ts` existe
   - [ ] Analyser CSS critique réellement utilisé
   - [ ] Inline CSS critique dans `<head>`
   - [ ] Différer CSS non-critique
   - [ ] Réduire taille CSS initial (< 50KB)

2. **JavaScript Initial**
   - [ ] Analyser bundle initial avec `rollup-plugin-visualizer`
   - [ ] Réduire imports non-critiques dans `main.tsx`
   - [ ] Lazy load i18n (déjà fait partiellement)
   - [ ] Lazy load Sentry (déjà fait)
   - [ ] Optimiser imports React Query

3. **Fonts**
   - [ ] Preload fonts critiques
   - [ ] Utiliser `font-display: swap`
   - [ ] Subset fonts (seulement caractères utilisés)
   - [ ] Utiliser `preconnect` pour Google Fonts

#### Phase 2 : Optimiser LCP (Largest Contentful Paint) 🔴

1. **Images Hero**
   - [ ] Identifier images LCP (hero images)
   - [ ] Preload images LCP avec `<link rel="preload">`
   - [ ] Utiliser formats modernes (WebP/AVIF)
   - [ ] Optimiser taille images (< 200KB)
   - [ ] Lazy load images non-LCP

2. **Rendu Initial**
   - [ ] Server-Side Rendering (SSR) pour pages critiques
   - [ ] Ou Static Site Generation (SSG) pour landing
   - [ ] Hydration progressive
   - [ ] Réduire JavaScript blocking

3. **Ressources Critiques**
   - [ ] Preload ressources critiques (CSS, JS, fonts)
   - [ ] Utiliser `resource hints` (preconnect, dns-prefetch)
   - [ ] Optimiser ordre chargement ressources

#### Phase 3 : Optimiser TTFB (Time to First Byte) 🟡

1. **CDN & Edge**
   - [ ] Utiliser Vercel Edge Functions pour routes critiques
   - [ ] CDN pour assets statiques
   - [ ] Cache headers optimisés

2. **Base de Données**
   - [ ] Optimiser requêtes Supabase
   - [ ] Utiliser RPC functions pour requêtes complexes
   - [ ] Cache côté serveur (Supabase Edge Functions)

3. **API Calls**
   - [ ] Réduire nombre requêtes initiales
   - [ ] Combiner requêtes multiples
   - [ ] Utiliser GraphQL si possible

#### Phase 4 : Optimisations Supplémentaires 🟡

1. **Code Splitting**
   - [ ] Analyser chunks avec visualizer
   - [ ] Optimiser taille chunks (< 200KB)
   - [ ] Preload chunks critiques

2. **Cache**
   - [ ] Service Worker pour cache assets
   - [ ] Cache stratégique avec React Query
   - [ ] LocalStorage pour données fréquentes

3. **Monitoring**
   - [ ] Web Vitals monitoring avec Sentry
   - [ ] Alertes si métriques dégradées
   - [ ] Dashboard performance

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **FCP** | ~2s | < 1.5s | 🔴 |
| **LCP** | ~4s | < 2.5s | 🔴 |
| **TTFB** | Variable | < 600ms | 🟡 |
| **Bundle Initial** | Optimisé | < 200KB | 🟡 |

---

## 🧹 PRIORITÉ 3 : NETTOYER TODO/FIXME

### État Actuel
- **Occurrences trouvées** : 385 (beaucoup faux positifs)
- **Vrais TODO/FIXME** : ~30-40 estimés
- **Types** : TODO, FIXME, XXX, HACK, BUG

### Plan d'Action

#### Phase 1 : Audit & Catégorisation 🔴

1. **Filtrer Vrais TODO/FIXME**
   - [ ] Exclure `logger.debug` (faux positifs)
   - [ ] Exclure commentaires CSS debug
   - [ ] Exclure traductions i18n
   - [ ] Lister vrais TODO/FIXME critiques

2. **Catégoriser par Priorité**
   - [ ] 🔴 **Critique** : Bugs, sécurité, fonctionnalités bloquantes
   - [ ] 🟡 **Moyenne** : Améliorations, optimisations
   - [ ] 🟢 **Basse** : Nice-to-have, documentation

3. **Créer Issues GitHub**
   - [ ] Créer issue pour chaque TODO critique
   - [ ] Ajouter labels (bug, enhancement, etc.)
   - [ ] Assigner priorité

#### Phase 2 : Traiter TODO Critiques 🔴

**TODO Critiques Identifiés** :

1. **`src/pages/Marketplace.tsx:384`**
   ```typescript
   // TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter RPC function Supabase
   - [ ] Créer fonction RPC `filter_marketplace_products`
   - [ ] Modifier hook `useMarketplaceProducts`
   - [ ] Tester performance

2. **`src/hooks/useMarketplaceProducts.ts:220`**
   ```typescript
   // TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter filtre variants
   - [ ] Ajouter jointure avec variants
   - [ ] Tester filtrage

3. **`src/lib/files/digital-file-processing.ts:246`**
   ```typescript
   // TODO: Implémenter avec JSZip ou Edge Function
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression ZIP
   - [ ] Ajouter JSZip pour compression
   - [ ] Ou créer Edge Function Supabase

4. **`src/lib/notifications/service-booking-notifications.ts:180`**
   ```typescript
   // TODO: Récupérer le user_id depuis le booking
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Corriger récupération user_id
   - [ ] Modifier requête pour inclure user_id
   - [ ] Tester notifications

5. **`src/hooks/physical/useStockOptimization.ts:291`**
   ```typescript
   // TODO: Calculer depuis l'historique des ventes
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter calcul historique
   - [ ] Créer fonction calcul moyenne ventes
   - [ ] Intégrer dans hook

6. **`src/pages/courses/CourseDetail.tsx:190`**
   ```typescript
   // TODO: Implémenter le paiement et l'inscription
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Implémenter paiement cours
   - [ ] Créer hook `useCoursePayment`
   - [ ] Intégrer dans page

7. **`src/lib/image-upload.ts:99`**
   ```typescript
   // TODO: Implémenter la compression avec canvas ou une librairie
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression images
   - [ ] Utiliser `browser-image-compression` (déjà installé)
   - [ ] Intégrer dans upload

8. **`src/lib/marketing/automation.ts`** (plusieurs TODO)
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter fonctionnalités automation
   - [ ] Vérification schedule
   - [ ] Vérification condition
   - [ ] Envoi SMS
   - [ ] Ajout segment
   - [ ] Appel webhook

#### Phase 3 : Nettoyer Code 🟡

1. **Supprimer TODO Résolus**
   - [ ] Vérifier si certains TODO sont déjà implémentés
   - [ ] Supprimer commentaires obsolètes

2. **Documenter TODO Restants**
   - [ ] Ajouter contexte pour chaque TODO
   - [ ] Ajouter lien vers issue GitHub
   - [ ] Ajouter estimation effort

3. **Créer Template TODO**
   - [ ] Template standardisé pour nouveaux TODO
   - [ ] Format : `// TODO: [PRIORITY] Description - Issue #XXX`

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **TODO Critiques** | ~8 | 0 | 🔴 |
| **TODO Moyennes** | ~15 | < 5 | 🟡 |
| **TODO Basses** | ~10 | < 10 | 🟢 |
| **Issues GitHub** | 0 | 20+ | 🔴 |

---

## 📅 CALENDRIER D'IMPLÉMENTATION

### Semaine 1 : Tests & TODO
- **Jour 1-2** : Configuration coverage + Tests hooks Auth
- **Jour 3-4** : Tests hooks Payments
- **Jour 5** : Audit TODO + Création issues GitHub

### Semaine 2 : Performance & Tests
- **Jour 1-2** : Optimiser FCP (CSS critique, JS initial)
- **Jour 3-4** : Optimiser LCP (images hero, preload)
- **Jour 5** : Tests composants critiques

### Semaine 3 : Finalisation
- **Jour 1-2** : Traiter TODO critiques
- **Jour 3-4** : Tests utilitaires + Coverage final
- **Jour 5** : Optimisations finales + Monitoring

---

## ✅ CHECKLIST PROGRESSION

### Priorité 1 : Tests
- [ ] Configuration coverage complète
- [ ] Tests hooks Auth (5 hooks)
- [ ] Tests hooks Payments (8 hooks)
- [ ] Tests hooks Products (10 hooks)
- [ ] Tests hooks Orders (6 hooks)
- [ ] Tests composants Auth (3 composants)
- [ ] Tests composants Payments (5 composants)
- [ ] Tests composants Products (8 composants)
- [ ] Tests composants Checkout (4 composants)
- [ ] Tests utilitaires (10 fichiers)
- [ ] Coverage 80%+ atteint

### Priorité 2 : Performance
- [ ] CSS critique optimisé (< 50KB)
- [ ] JS initial réduit (< 200KB)
- [ ] Fonts optimisées (preload, subset)
- [ ] Images LCP optimisées (preload, WebP)
- [ ] TTFB optimisé (< 600ms)
- [ ] FCP < 1.5s atteint
- [ ] LCP < 2.5s atteint

### Priorité 3 : TODO/FIXME
- [ ] Audit TODO complet
- [ ] Issues GitHub créées (20+)
- [ ] TODO critiques traités (8)
- [ ] TODO moyennes traitées (15)
- [ ] Code nettoyé et documenté

---

**Prochaine Révision** : 2025-02-07  
**Responsable** : Équipe Développement

## Implémentation des 3 Recommandations Prioritaires

**Date** : 2025-01-30  
**Objectif** : Améliorer Tests, Performance et Nettoyer TODO/FIXME

---

## 📋 PRIORITÉ 1 : AMÉLIORER COUVERTURE TESTS (Objectif 80%+)

### État Actuel
- **Couverture estimée** : ~40%
- **Tests existants** : 79 fichiers de tests
- **Tests E2E** : 50+ tests Playwright
- **Objectif** : 80%+ de couverture

### Plan d'Action

#### Phase 1 : Configuration Coverage ✅
- [x] Vitest configuré avec coverage v8
- [ ] Ajouter script `npm run test:coverage` avec seuil minimum
- [ ] Configurer CI pour bloquer si coverage < 80%

#### Phase 2 : Tests Hooks Critiques 🔴
**Priorité** : Composants sans tests

1. **Hooks Auth & Sécurité** (5 hooks)
   - [ ] `useAuth` - Tests authentification
   - [ ] `useRequire2FA` - Tests 2FA
   - [ ] `usePermissions` - Tests permissions
   - [ ] `useAdmin` - Tests admin
   - [ ] `useKYC` - Tests KYC

2. **Hooks Payments** (8 hooks)
   - [ ] `usePayments` - Tests paiements
   - [ ] `useMoneroo` - Tests Moneroo
   - [ ] `useAdvancedPayments` - Tests paiements avancés
   - [ ] `useWithdrawals` - Tests retraits
   - [ ] `useTransactions` - Tests transactions
   - [ ] `useDisputes` - Tests litiges
   - [ ] `useAffiliateCommissions` - Tests commissions
   - [ ] `usePlatformCommissions` - Tests commissions plateforme

3. **Hooks Products** (10 hooks)
   - [ ] `useProducts` - Tests produits
   - [ ] `useProductManagement` - Tests gestion produits
   - [ ] `useDigitalProducts` - Tests produits digitaux
   - [ ] `usePhysicalProducts` - Tests produits physiques
   - [ ] `useProductSearch` - Tests recherche
   - [ ] `useProductRecommendations` - Tests recommandations
   - [ ] `useProductAnalytics` - Tests analytics
   - [ ] `useReviews` - Tests avis
   - [ ] `useWishlist` - Tests wishlist
   - [ ] `useCart` - Tests panier

4. **Hooks Orders** (6 hooks)
   - [ ] `useOrders` - Tests commandes
   - [ ] `useCreateOrder` - Tests création commande
   - [ ] `useOrderMessaging` - Tests messaging commande
   - [ ] `useShipping` - Tests shipping
   - [ ] `useReturns` - Tests retours
   - [ ] `useOrderTracking` - Tests tracking

#### Phase 3 : Tests Composants Critiques 🔴
**Priorité** : Composants sans tests

1. **Composants Auth** (3 composants)
   - [ ] `ProtectedRoute` - Tests protection routes
   - [ ] `AdminRoute` - Tests routes admin
   - [ ] `Require2FABanner` - Tests banner 2FA

2. **Composants Payments** (5 composants)
   - [ ] `PaymentProviderSelector` - Tests sélection provider
   - [ ] `PaymentForm` - Tests formulaire paiement
   - [ ] `PaymentStatus` - Tests statut paiement
   - [ ] `WithdrawalForm` - Tests formulaire retrait
   - [ ] `DisputeForm` - Tests formulaire litige

3. **Composants Products** (8 composants)
   - [ ] `ProductCard` - Tests carte produit
   - [ ] `ProductDetail` - Tests détail produit
   - [ ] `ProductForm` - Tests formulaire produit
   - [ ] `ProductVariantSelector` - Tests sélection variant
   - [ ] `ProductReviews` - Tests avis produits
   - [ ] `ProductImageGallery` - Tests galerie images
   - [ ] `ProductRecommendations` - Tests recommandations
   - [ ] `WishlistButton` - Tests bouton wishlist

4. **Composants Checkout** (4 composants)
   - [ ] `CheckoutForm` - Tests formulaire checkout
   - [ ] `CartSummary` - Tests résumé panier
   - [ ] `CouponInput` - Tests input coupon
   - [ ] `GiftCardInput` - Tests input carte cadeau

#### Phase 4 : Tests Utilitaires 🔴
**Priorité** : Utilitaires critiques

1. **Lib Utilitaires** (10 fichiers)
   - [ ] `lib/utils.ts` - Tests utilitaires généraux
   - [ ] `lib/validation-utils.ts` - Tests validation
   - [ ] `lib/error-handling.ts` - Tests gestion erreurs
   - [ ] `lib/cache-optimization.ts` - Tests cache
   - [ ] `lib/html-sanitizer.ts` - Tests sanitization
   - [ ] `lib/product-helpers.ts` - Tests helpers produits
   - [ ] `lib/currency-converter.ts` - Tests conversion devise
   - [ ] `lib/date-utils.ts` - Tests utilitaires dates
   - [ ] `lib/format-utils.ts` - Tests formatage
   - [ ] `lib/url-validator.ts` - Tests validation URLs

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **Coverage Total** | ~40% | 80%+ | 🔴 |
| **Tests Hooks** | ~20% | 80%+ | 🔴 |
| **Tests Composants** | ~30% | 80%+ | 🔴 |
| **Tests Utilitaires** | ~50% | 80%+ | 🟡 |

---

## ⚡ PRIORITÉ 2 : OPTIMISER PERFORMANCE

### État Actuel
- **FCP** : ~2s (Objectif : < 1.5s)
- **LCP** : ~4s (Objectif : < 2.5s)
- **TTFB** : Variable (Objectif : < 600ms)

### Plan d'Action

#### Phase 1 : Optimiser FCP (First Contentful Paint) 🔴

1. **CSS Critique** ✅ Partiellement fait
   - [x] `critical-css.ts` existe
   - [ ] Analyser CSS critique réellement utilisé
   - [ ] Inline CSS critique dans `<head>`
   - [ ] Différer CSS non-critique
   - [ ] Réduire taille CSS initial (< 50KB)

2. **JavaScript Initial**
   - [ ] Analyser bundle initial avec `rollup-plugin-visualizer`
   - [ ] Réduire imports non-critiques dans `main.tsx`
   - [ ] Lazy load i18n (déjà fait partiellement)
   - [ ] Lazy load Sentry (déjà fait)
   - [ ] Optimiser imports React Query

3. **Fonts**
   - [ ] Preload fonts critiques
   - [ ] Utiliser `font-display: swap`
   - [ ] Subset fonts (seulement caractères utilisés)
   - [ ] Utiliser `preconnect` pour Google Fonts

#### Phase 2 : Optimiser LCP (Largest Contentful Paint) 🔴

1. **Images Hero**
   - [ ] Identifier images LCP (hero images)
   - [ ] Preload images LCP avec `<link rel="preload">`
   - [ ] Utiliser formats modernes (WebP/AVIF)
   - [ ] Optimiser taille images (< 200KB)
   - [ ] Lazy load images non-LCP

2. **Rendu Initial**
   - [ ] Server-Side Rendering (SSR) pour pages critiques
   - [ ] Ou Static Site Generation (SSG) pour landing
   - [ ] Hydration progressive
   - [ ] Réduire JavaScript blocking

3. **Ressources Critiques**
   - [ ] Preload ressources critiques (CSS, JS, fonts)
   - [ ] Utiliser `resource hints` (preconnect, dns-prefetch)
   - [ ] Optimiser ordre chargement ressources

#### Phase 3 : Optimiser TTFB (Time to First Byte) 🟡

1. **CDN & Edge**
   - [ ] Utiliser Vercel Edge Functions pour routes critiques
   - [ ] CDN pour assets statiques
   - [ ] Cache headers optimisés

2. **Base de Données**
   - [ ] Optimiser requêtes Supabase
   - [ ] Utiliser RPC functions pour requêtes complexes
   - [ ] Cache côté serveur (Supabase Edge Functions)

3. **API Calls**
   - [ ] Réduire nombre requêtes initiales
   - [ ] Combiner requêtes multiples
   - [ ] Utiliser GraphQL si possible

#### Phase 4 : Optimisations Supplémentaires 🟡

1. **Code Splitting**
   - [ ] Analyser chunks avec visualizer
   - [ ] Optimiser taille chunks (< 200KB)
   - [ ] Preload chunks critiques

2. **Cache**
   - [ ] Service Worker pour cache assets
   - [ ] Cache stratégique avec React Query
   - [ ] LocalStorage pour données fréquentes

3. **Monitoring**
   - [ ] Web Vitals monitoring avec Sentry
   - [ ] Alertes si métriques dégradées
   - [ ] Dashboard performance

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **FCP** | ~2s | < 1.5s | 🔴 |
| **LCP** | ~4s | < 2.5s | 🔴 |
| **TTFB** | Variable | < 600ms | 🟡 |
| **Bundle Initial** | Optimisé | < 200KB | 🟡 |

---

## 🧹 PRIORITÉ 3 : NETTOYER TODO/FIXME

### État Actuel
- **Occurrences trouvées** : 385 (beaucoup faux positifs)
- **Vrais TODO/FIXME** : ~30-40 estimés
- **Types** : TODO, FIXME, XXX, HACK, BUG

### Plan d'Action

#### Phase 1 : Audit & Catégorisation 🔴

1. **Filtrer Vrais TODO/FIXME**
   - [ ] Exclure `logger.debug` (faux positifs)
   - [ ] Exclure commentaires CSS debug
   - [ ] Exclure traductions i18n
   - [ ] Lister vrais TODO/FIXME critiques

2. **Catégoriser par Priorité**
   - [ ] 🔴 **Critique** : Bugs, sécurité, fonctionnalités bloquantes
   - [ ] 🟡 **Moyenne** : Améliorations, optimisations
   - [ ] 🟢 **Basse** : Nice-to-have, documentation

3. **Créer Issues GitHub**
   - [ ] Créer issue pour chaque TODO critique
   - [ ] Ajouter labels (bug, enhancement, etc.)
   - [ ] Assigner priorité

#### Phase 2 : Traiter TODO Critiques 🔴

**TODO Critiques Identifiés** :

1. **`src/pages/Marketplace.tsx:384`**
   ```typescript
   // TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter RPC function Supabase
   - [ ] Créer fonction RPC `filter_marketplace_products`
   - [ ] Modifier hook `useMarketplaceProducts`
   - [ ] Tester performance

2. **`src/hooks/useMarketplaceProducts.ts:220`**
   ```typescript
   // TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter filtre variants
   - [ ] Ajouter jointure avec variants
   - [ ] Tester filtrage

3. **`src/lib/files/digital-file-processing.ts:246`**
   ```typescript
   // TODO: Implémenter avec JSZip ou Edge Function
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression ZIP
   - [ ] Ajouter JSZip pour compression
   - [ ] Ou créer Edge Function Supabase

4. **`src/lib/notifications/service-booking-notifications.ts:180`**
   ```typescript
   // TODO: Récupérer le user_id depuis le booking
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Corriger récupération user_id
   - [ ] Modifier requête pour inclure user_id
   - [ ] Tester notifications

5. **`src/hooks/physical/useStockOptimization.ts:291`**
   ```typescript
   // TODO: Calculer depuis l'historique des ventes
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter calcul historique
   - [ ] Créer fonction calcul moyenne ventes
   - [ ] Intégrer dans hook

6. **`src/pages/courses/CourseDetail.tsx:190`**
   ```typescript
   // TODO: Implémenter le paiement et l'inscription
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Implémenter paiement cours
   - [ ] Créer hook `useCoursePayment`
   - [ ] Intégrer dans page

7. **`src/lib/image-upload.ts:99`**
   ```typescript
   // TODO: Implémenter la compression avec canvas ou une librairie
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression images
   - [ ] Utiliser `browser-image-compression` (déjà installé)
   - [ ] Intégrer dans upload

8. **`src/lib/marketing/automation.ts`** (plusieurs TODO)
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter fonctionnalités automation
   - [ ] Vérification schedule
   - [ ] Vérification condition
   - [ ] Envoi SMS
   - [ ] Ajout segment
   - [ ] Appel webhook

#### Phase 3 : Nettoyer Code 🟡

1. **Supprimer TODO Résolus**
   - [ ] Vérifier si certains TODO sont déjà implémentés
   - [ ] Supprimer commentaires obsolètes

2. **Documenter TODO Restants**
   - [ ] Ajouter contexte pour chaque TODO
   - [ ] Ajouter lien vers issue GitHub
   - [ ] Ajouter estimation effort

3. **Créer Template TODO**
   - [ ] Template standardisé pour nouveaux TODO
   - [ ] Format : `// TODO: [PRIORITY] Description - Issue #XXX`

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **TODO Critiques** | ~8 | 0 | 🔴 |
| **TODO Moyennes** | ~15 | < 5 | 🟡 |
| **TODO Basses** | ~10 | < 10 | 🟢 |
| **Issues GitHub** | 0 | 20+ | 🔴 |

---

## 📅 CALENDRIER D'IMPLÉMENTATION

### Semaine 1 : Tests & TODO
- **Jour 1-2** : Configuration coverage + Tests hooks Auth
- **Jour 3-4** : Tests hooks Payments
- **Jour 5** : Audit TODO + Création issues GitHub

### Semaine 2 : Performance & Tests
- **Jour 1-2** : Optimiser FCP (CSS critique, JS initial)
- **Jour 3-4** : Optimiser LCP (images hero, preload)
- **Jour 5** : Tests composants critiques

### Semaine 3 : Finalisation
- **Jour 1-2** : Traiter TODO critiques
- **Jour 3-4** : Tests utilitaires + Coverage final
- **Jour 5** : Optimisations finales + Monitoring

---

## ✅ CHECKLIST PROGRESSION

### Priorité 1 : Tests
- [ ] Configuration coverage complète
- [ ] Tests hooks Auth (5 hooks)
- [ ] Tests hooks Payments (8 hooks)
- [ ] Tests hooks Products (10 hooks)
- [ ] Tests hooks Orders (6 hooks)
- [ ] Tests composants Auth (3 composants)
- [ ] Tests composants Payments (5 composants)
- [ ] Tests composants Products (8 composants)
- [ ] Tests composants Checkout (4 composants)
- [ ] Tests utilitaires (10 fichiers)
- [ ] Coverage 80%+ atteint

### Priorité 2 : Performance
- [ ] CSS critique optimisé (< 50KB)
- [ ] JS initial réduit (< 200KB)
- [ ] Fonts optimisées (preload, subset)
- [ ] Images LCP optimisées (preload, WebP)
- [ ] TTFB optimisé (< 600ms)
- [ ] FCP < 1.5s atteint
- [ ] LCP < 2.5s atteint

### Priorité 3 : TODO/FIXME
- [ ] Audit TODO complet
- [ ] Issues GitHub créées (20+)
- [ ] TODO critiques traités (8)
- [ ] TODO moyennes traitées (15)
- [ ] Code nettoyé et documenté

---

**Prochaine Révision** : 2025-02-07  
**Responsable** : Équipe Développement

## Implémentation des 3 Recommandations Prioritaires

**Date** : 2025-01-30  
**Objectif** : Améliorer Tests, Performance et Nettoyer TODO/FIXME

---

## 📋 PRIORITÉ 1 : AMÉLIORER COUVERTURE TESTS (Objectif 80%+)

### État Actuel
- **Couverture estimée** : ~40%
- **Tests existants** : 79 fichiers de tests
- **Tests E2E** : 50+ tests Playwright
- **Objectif** : 80%+ de couverture

### Plan d'Action

#### Phase 1 : Configuration Coverage ✅
- [x] Vitest configuré avec coverage v8
- [ ] Ajouter script `npm run test:coverage` avec seuil minimum
- [ ] Configurer CI pour bloquer si coverage < 80%

#### Phase 2 : Tests Hooks Critiques 🔴
**Priorité** : Composants sans tests

1. **Hooks Auth & Sécurité** (5 hooks)
   - [ ] `useAuth` - Tests authentification
   - [ ] `useRequire2FA` - Tests 2FA
   - [ ] `usePermissions` - Tests permissions
   - [ ] `useAdmin` - Tests admin
   - [ ] `useKYC` - Tests KYC

2. **Hooks Payments** (8 hooks)
   - [ ] `usePayments` - Tests paiements
   - [ ] `useMoneroo` - Tests Moneroo
   - [ ] `useAdvancedPayments` - Tests paiements avancés
   - [ ] `useWithdrawals` - Tests retraits
   - [ ] `useTransactions` - Tests transactions
   - [ ] `useDisputes` - Tests litiges
   - [ ] `useAffiliateCommissions` - Tests commissions
   - [ ] `usePlatformCommissions` - Tests commissions plateforme

3. **Hooks Products** (10 hooks)
   - [ ] `useProducts` - Tests produits
   - [ ] `useProductManagement` - Tests gestion produits
   - [ ] `useDigitalProducts` - Tests produits digitaux
   - [ ] `usePhysicalProducts` - Tests produits physiques
   - [ ] `useProductSearch` - Tests recherche
   - [ ] `useProductRecommendations` - Tests recommandations
   - [ ] `useProductAnalytics` - Tests analytics
   - [ ] `useReviews` - Tests avis
   - [ ] `useWishlist` - Tests wishlist
   - [ ] `useCart` - Tests panier

4. **Hooks Orders** (6 hooks)
   - [ ] `useOrders` - Tests commandes
   - [ ] `useCreateOrder` - Tests création commande
   - [ ] `useOrderMessaging` - Tests messaging commande
   - [ ] `useShipping` - Tests shipping
   - [ ] `useReturns` - Tests retours
   - [ ] `useOrderTracking` - Tests tracking

#### Phase 3 : Tests Composants Critiques 🔴
**Priorité** : Composants sans tests

1. **Composants Auth** (3 composants)
   - [ ] `ProtectedRoute` - Tests protection routes
   - [ ] `AdminRoute` - Tests routes admin
   - [ ] `Require2FABanner` - Tests banner 2FA

2. **Composants Payments** (5 composants)
   - [ ] `PaymentProviderSelector` - Tests sélection provider
   - [ ] `PaymentForm` - Tests formulaire paiement
   - [ ] `PaymentStatus` - Tests statut paiement
   - [ ] `WithdrawalForm` - Tests formulaire retrait
   - [ ] `DisputeForm` - Tests formulaire litige

3. **Composants Products** (8 composants)
   - [ ] `ProductCard` - Tests carte produit
   - [ ] `ProductDetail` - Tests détail produit
   - [ ] `ProductForm` - Tests formulaire produit
   - [ ] `ProductVariantSelector` - Tests sélection variant
   - [ ] `ProductReviews` - Tests avis produits
   - [ ] `ProductImageGallery` - Tests galerie images
   - [ ] `ProductRecommendations` - Tests recommandations
   - [ ] `WishlistButton` - Tests bouton wishlist

4. **Composants Checkout** (4 composants)
   - [ ] `CheckoutForm` - Tests formulaire checkout
   - [ ] `CartSummary` - Tests résumé panier
   - [ ] `CouponInput` - Tests input coupon
   - [ ] `GiftCardInput` - Tests input carte cadeau

#### Phase 4 : Tests Utilitaires 🔴
**Priorité** : Utilitaires critiques

1. **Lib Utilitaires** (10 fichiers)
   - [ ] `lib/utils.ts` - Tests utilitaires généraux
   - [ ] `lib/validation-utils.ts` - Tests validation
   - [ ] `lib/error-handling.ts` - Tests gestion erreurs
   - [ ] `lib/cache-optimization.ts` - Tests cache
   - [ ] `lib/html-sanitizer.ts` - Tests sanitization
   - [ ] `lib/product-helpers.ts` - Tests helpers produits
   - [ ] `lib/currency-converter.ts` - Tests conversion devise
   - [ ] `lib/date-utils.ts` - Tests utilitaires dates
   - [ ] `lib/format-utils.ts` - Tests formatage
   - [ ] `lib/url-validator.ts` - Tests validation URLs

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **Coverage Total** | ~40% | 80%+ | 🔴 |
| **Tests Hooks** | ~20% | 80%+ | 🔴 |
| **Tests Composants** | ~30% | 80%+ | 🔴 |
| **Tests Utilitaires** | ~50% | 80%+ | 🟡 |

---

## ⚡ PRIORITÉ 2 : OPTIMISER PERFORMANCE

### État Actuel
- **FCP** : ~2s (Objectif : < 1.5s)
- **LCP** : ~4s (Objectif : < 2.5s)
- **TTFB** : Variable (Objectif : < 600ms)

### Plan d'Action

#### Phase 1 : Optimiser FCP (First Contentful Paint) 🔴

1. **CSS Critique** ✅ Partiellement fait
   - [x] `critical-css.ts` existe
   - [ ] Analyser CSS critique réellement utilisé
   - [ ] Inline CSS critique dans `<head>`
   - [ ] Différer CSS non-critique
   - [ ] Réduire taille CSS initial (< 50KB)

2. **JavaScript Initial**
   - [ ] Analyser bundle initial avec `rollup-plugin-visualizer`
   - [ ] Réduire imports non-critiques dans `main.tsx`
   - [ ] Lazy load i18n (déjà fait partiellement)
   - [ ] Lazy load Sentry (déjà fait)
   - [ ] Optimiser imports React Query

3. **Fonts**
   - [ ] Preload fonts critiques
   - [ ] Utiliser `font-display: swap`
   - [ ] Subset fonts (seulement caractères utilisés)
   - [ ] Utiliser `preconnect` pour Google Fonts

#### Phase 2 : Optimiser LCP (Largest Contentful Paint) 🔴

1. **Images Hero**
   - [ ] Identifier images LCP (hero images)
   - [ ] Preload images LCP avec `<link rel="preload">`
   - [ ] Utiliser formats modernes (WebP/AVIF)
   - [ ] Optimiser taille images (< 200KB)
   - [ ] Lazy load images non-LCP

2. **Rendu Initial**
   - [ ] Server-Side Rendering (SSR) pour pages critiques
   - [ ] Ou Static Site Generation (SSG) pour landing
   - [ ] Hydration progressive
   - [ ] Réduire JavaScript blocking

3. **Ressources Critiques**
   - [ ] Preload ressources critiques (CSS, JS, fonts)
   - [ ] Utiliser `resource hints` (preconnect, dns-prefetch)
   - [ ] Optimiser ordre chargement ressources

#### Phase 3 : Optimiser TTFB (Time to First Byte) 🟡

1. **CDN & Edge**
   - [ ] Utiliser Vercel Edge Functions pour routes critiques
   - [ ] CDN pour assets statiques
   - [ ] Cache headers optimisés

2. **Base de Données**
   - [ ] Optimiser requêtes Supabase
   - [ ] Utiliser RPC functions pour requêtes complexes
   - [ ] Cache côté serveur (Supabase Edge Functions)

3. **API Calls**
   - [ ] Réduire nombre requêtes initiales
   - [ ] Combiner requêtes multiples
   - [ ] Utiliser GraphQL si possible

#### Phase 4 : Optimisations Supplémentaires 🟡

1. **Code Splitting**
   - [ ] Analyser chunks avec visualizer
   - [ ] Optimiser taille chunks (< 200KB)
   - [ ] Preload chunks critiques

2. **Cache**
   - [ ] Service Worker pour cache assets
   - [ ] Cache stratégique avec React Query
   - [ ] LocalStorage pour données fréquentes

3. **Monitoring**
   - [ ] Web Vitals monitoring avec Sentry
   - [ ] Alertes si métriques dégradées
   - [ ] Dashboard performance

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **FCP** | ~2s | < 1.5s | 🔴 |
| **LCP** | ~4s | < 2.5s | 🔴 |
| **TTFB** | Variable | < 600ms | 🟡 |
| **Bundle Initial** | Optimisé | < 200KB | 🟡 |

---

## 🧹 PRIORITÉ 3 : NETTOYER TODO/FIXME

### État Actuel
- **Occurrences trouvées** : 385 (beaucoup faux positifs)
- **Vrais TODO/FIXME** : ~30-40 estimés
- **Types** : TODO, FIXME, XXX, HACK, BUG

### Plan d'Action

#### Phase 1 : Audit & Catégorisation 🔴

1. **Filtrer Vrais TODO/FIXME**
   - [ ] Exclure `logger.debug` (faux positifs)
   - [ ] Exclure commentaires CSS debug
   - [ ] Exclure traductions i18n
   - [ ] Lister vrais TODO/FIXME critiques

2. **Catégoriser par Priorité**
   - [ ] 🔴 **Critique** : Bugs, sécurité, fonctionnalités bloquantes
   - [ ] 🟡 **Moyenne** : Améliorations, optimisations
   - [ ] 🟢 **Basse** : Nice-to-have, documentation

3. **Créer Issues GitHub**
   - [ ] Créer issue pour chaque TODO critique
   - [ ] Ajouter labels (bug, enhancement, etc.)
   - [ ] Assigner priorité

#### Phase 2 : Traiter TODO Critiques 🔴

**TODO Critiques Identifiés** :

1. **`src/pages/Marketplace.tsx:384`**
   ```typescript
   // TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter RPC function Supabase
   - [ ] Créer fonction RPC `filter_marketplace_products`
   - [ ] Modifier hook `useMarketplaceProducts`
   - [ ] Tester performance

2. **`src/hooks/useMarketplaceProducts.ts:220`**
   ```typescript
   // TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter filtre variants
   - [ ] Ajouter jointure avec variants
   - [ ] Tester filtrage

3. **`src/lib/files/digital-file-processing.ts:246`**
   ```typescript
   // TODO: Implémenter avec JSZip ou Edge Function
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression ZIP
   - [ ] Ajouter JSZip pour compression
   - [ ] Ou créer Edge Function Supabase

4. **`src/lib/notifications/service-booking-notifications.ts:180`**
   ```typescript
   // TODO: Récupérer le user_id depuis le booking
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Corriger récupération user_id
   - [ ] Modifier requête pour inclure user_id
   - [ ] Tester notifications

5. **`src/hooks/physical/useStockOptimization.ts:291`**
   ```typescript
   // TODO: Calculer depuis l'historique des ventes
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter calcul historique
   - [ ] Créer fonction calcul moyenne ventes
   - [ ] Intégrer dans hook

6. **`src/pages/courses/CourseDetail.tsx:190`**
   ```typescript
   // TODO: Implémenter le paiement et l'inscription
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Implémenter paiement cours
   - [ ] Créer hook `useCoursePayment`
   - [ ] Intégrer dans page

7. **`src/lib/image-upload.ts:99`**
   ```typescript
   // TODO: Implémenter la compression avec canvas ou une librairie
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression images
   - [ ] Utiliser `browser-image-compression` (déjà installé)
   - [ ] Intégrer dans upload

8. **`src/lib/marketing/automation.ts`** (plusieurs TODO)
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter fonctionnalités automation
   - [ ] Vérification schedule
   - [ ] Vérification condition
   - [ ] Envoi SMS
   - [ ] Ajout segment
   - [ ] Appel webhook

#### Phase 3 : Nettoyer Code 🟡

1. **Supprimer TODO Résolus**
   - [ ] Vérifier si certains TODO sont déjà implémentés
   - [ ] Supprimer commentaires obsolètes

2. **Documenter TODO Restants**
   - [ ] Ajouter contexte pour chaque TODO
   - [ ] Ajouter lien vers issue GitHub
   - [ ] Ajouter estimation effort

3. **Créer Template TODO**
   - [ ] Template standardisé pour nouveaux TODO
   - [ ] Format : `// TODO: [PRIORITY] Description - Issue #XXX`

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **TODO Critiques** | ~8 | 0 | 🔴 |
| **TODO Moyennes** | ~15 | < 5 | 🟡 |
| **TODO Basses** | ~10 | < 10 | 🟢 |
| **Issues GitHub** | 0 | 20+ | 🔴 |

---

## 📅 CALENDRIER D'IMPLÉMENTATION

### Semaine 1 : Tests & TODO
- **Jour 1-2** : Configuration coverage + Tests hooks Auth
- **Jour 3-4** : Tests hooks Payments
- **Jour 5** : Audit TODO + Création issues GitHub

### Semaine 2 : Performance & Tests
- **Jour 1-2** : Optimiser FCP (CSS critique, JS initial)
- **Jour 3-4** : Optimiser LCP (images hero, preload)
- **Jour 5** : Tests composants critiques

### Semaine 3 : Finalisation
- **Jour 1-2** : Traiter TODO critiques
- **Jour 3-4** : Tests utilitaires + Coverage final
- **Jour 5** : Optimisations finales + Monitoring

---

## ✅ CHECKLIST PROGRESSION

### Priorité 1 : Tests
- [ ] Configuration coverage complète
- [ ] Tests hooks Auth (5 hooks)
- [ ] Tests hooks Payments (8 hooks)
- [ ] Tests hooks Products (10 hooks)
- [ ] Tests hooks Orders (6 hooks)
- [ ] Tests composants Auth (3 composants)
- [ ] Tests composants Payments (5 composants)
- [ ] Tests composants Products (8 composants)
- [ ] Tests composants Checkout (4 composants)
- [ ] Tests utilitaires (10 fichiers)
- [ ] Coverage 80%+ atteint

### Priorité 2 : Performance
- [ ] CSS critique optimisé (< 50KB)
- [ ] JS initial réduit (< 200KB)
- [ ] Fonts optimisées (preload, subset)
- [ ] Images LCP optimisées (preload, WebP)
- [ ] TTFB optimisé (< 600ms)
- [ ] FCP < 1.5s atteint
- [ ] LCP < 2.5s atteint

### Priorité 3 : TODO/FIXME
- [ ] Audit TODO complet
- [ ] Issues GitHub créées (20+)
- [ ] TODO critiques traités (8)
- [ ] TODO moyennes traitées (15)
- [ ] Code nettoyé et documenté

---

**Prochaine Révision** : 2025-02-07  
**Responsable** : Équipe Développement

## Implémentation des 3 Recommandations Prioritaires

**Date** : 2025-01-30  
**Objectif** : Améliorer Tests, Performance et Nettoyer TODO/FIXME

---

## 📋 PRIORITÉ 1 : AMÉLIORER COUVERTURE TESTS (Objectif 80%+)

### État Actuel
- **Couverture estimée** : ~40%
- **Tests existants** : 79 fichiers de tests
- **Tests E2E** : 50+ tests Playwright
- **Objectif** : 80%+ de couverture

### Plan d'Action

#### Phase 1 : Configuration Coverage ✅
- [x] Vitest configuré avec coverage v8
- [ ] Ajouter script `npm run test:coverage` avec seuil minimum
- [ ] Configurer CI pour bloquer si coverage < 80%

#### Phase 2 : Tests Hooks Critiques 🔴
**Priorité** : Composants sans tests

1. **Hooks Auth & Sécurité** (5 hooks)
   - [ ] `useAuth` - Tests authentification
   - [ ] `useRequire2FA` - Tests 2FA
   - [ ] `usePermissions` - Tests permissions
   - [ ] `useAdmin` - Tests admin
   - [ ] `useKYC` - Tests KYC

2. **Hooks Payments** (8 hooks)
   - [ ] `usePayments` - Tests paiements
   - [ ] `useMoneroo` - Tests Moneroo
   - [ ] `useAdvancedPayments` - Tests paiements avancés
   - [ ] `useWithdrawals` - Tests retraits
   - [ ] `useTransactions` - Tests transactions
   - [ ] `useDisputes` - Tests litiges
   - [ ] `useAffiliateCommissions` - Tests commissions
   - [ ] `usePlatformCommissions` - Tests commissions plateforme

3. **Hooks Products** (10 hooks)
   - [ ] `useProducts` - Tests produits
   - [ ] `useProductManagement` - Tests gestion produits
   - [ ] `useDigitalProducts` - Tests produits digitaux
   - [ ] `usePhysicalProducts` - Tests produits physiques
   - [ ] `useProductSearch` - Tests recherche
   - [ ] `useProductRecommendations` - Tests recommandations
   - [ ] `useProductAnalytics` - Tests analytics
   - [ ] `useReviews` - Tests avis
   - [ ] `useWishlist` - Tests wishlist
   - [ ] `useCart` - Tests panier

4. **Hooks Orders** (6 hooks)
   - [ ] `useOrders` - Tests commandes
   - [ ] `useCreateOrder` - Tests création commande
   - [ ] `useOrderMessaging` - Tests messaging commande
   - [ ] `useShipping` - Tests shipping
   - [ ] `useReturns` - Tests retours
   - [ ] `useOrderTracking` - Tests tracking

#### Phase 3 : Tests Composants Critiques 🔴
**Priorité** : Composants sans tests

1. **Composants Auth** (3 composants)
   - [ ] `ProtectedRoute` - Tests protection routes
   - [ ] `AdminRoute` - Tests routes admin
   - [ ] `Require2FABanner` - Tests banner 2FA

2. **Composants Payments** (5 composants)
   - [ ] `PaymentProviderSelector` - Tests sélection provider
   - [ ] `PaymentForm` - Tests formulaire paiement
   - [ ] `PaymentStatus` - Tests statut paiement
   - [ ] `WithdrawalForm` - Tests formulaire retrait
   - [ ] `DisputeForm` - Tests formulaire litige

3. **Composants Products** (8 composants)
   - [ ] `ProductCard` - Tests carte produit
   - [ ] `ProductDetail` - Tests détail produit
   - [ ] `ProductForm` - Tests formulaire produit
   - [ ] `ProductVariantSelector` - Tests sélection variant
   - [ ] `ProductReviews` - Tests avis produits
   - [ ] `ProductImageGallery` - Tests galerie images
   - [ ] `ProductRecommendations` - Tests recommandations
   - [ ] `WishlistButton` - Tests bouton wishlist

4. **Composants Checkout** (4 composants)
   - [ ] `CheckoutForm` - Tests formulaire checkout
   - [ ] `CartSummary` - Tests résumé panier
   - [ ] `CouponInput` - Tests input coupon
   - [ ] `GiftCardInput` - Tests input carte cadeau

#### Phase 4 : Tests Utilitaires 🔴
**Priorité** : Utilitaires critiques

1. **Lib Utilitaires** (10 fichiers)
   - [ ] `lib/utils.ts` - Tests utilitaires généraux
   - [ ] `lib/validation-utils.ts` - Tests validation
   - [ ] `lib/error-handling.ts` - Tests gestion erreurs
   - [ ] `lib/cache-optimization.ts` - Tests cache
   - [ ] `lib/html-sanitizer.ts` - Tests sanitization
   - [ ] `lib/product-helpers.ts` - Tests helpers produits
   - [ ] `lib/currency-converter.ts` - Tests conversion devise
   - [ ] `lib/date-utils.ts` - Tests utilitaires dates
   - [ ] `lib/format-utils.ts` - Tests formatage
   - [ ] `lib/url-validator.ts` - Tests validation URLs

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **Coverage Total** | ~40% | 80%+ | 🔴 |
| **Tests Hooks** | ~20% | 80%+ | 🔴 |
| **Tests Composants** | ~30% | 80%+ | 🔴 |
| **Tests Utilitaires** | ~50% | 80%+ | 🟡 |

---

## ⚡ PRIORITÉ 2 : OPTIMISER PERFORMANCE

### État Actuel
- **FCP** : ~2s (Objectif : < 1.5s)
- **LCP** : ~4s (Objectif : < 2.5s)
- **TTFB** : Variable (Objectif : < 600ms)

### Plan d'Action

#### Phase 1 : Optimiser FCP (First Contentful Paint) 🔴

1. **CSS Critique** ✅ Partiellement fait
   - [x] `critical-css.ts` existe
   - [ ] Analyser CSS critique réellement utilisé
   - [ ] Inline CSS critique dans `<head>`
   - [ ] Différer CSS non-critique
   - [ ] Réduire taille CSS initial (< 50KB)

2. **JavaScript Initial**
   - [ ] Analyser bundle initial avec `rollup-plugin-visualizer`
   - [ ] Réduire imports non-critiques dans `main.tsx`
   - [ ] Lazy load i18n (déjà fait partiellement)
   - [ ] Lazy load Sentry (déjà fait)
   - [ ] Optimiser imports React Query

3. **Fonts**
   - [ ] Preload fonts critiques
   - [ ] Utiliser `font-display: swap`
   - [ ] Subset fonts (seulement caractères utilisés)
   - [ ] Utiliser `preconnect` pour Google Fonts

#### Phase 2 : Optimiser LCP (Largest Contentful Paint) 🔴

1. **Images Hero**
   - [ ] Identifier images LCP (hero images)
   - [ ] Preload images LCP avec `<link rel="preload">`
   - [ ] Utiliser formats modernes (WebP/AVIF)
   - [ ] Optimiser taille images (< 200KB)
   - [ ] Lazy load images non-LCP

2. **Rendu Initial**
   - [ ] Server-Side Rendering (SSR) pour pages critiques
   - [ ] Ou Static Site Generation (SSG) pour landing
   - [ ] Hydration progressive
   - [ ] Réduire JavaScript blocking

3. **Ressources Critiques**
   - [ ] Preload ressources critiques (CSS, JS, fonts)
   - [ ] Utiliser `resource hints` (preconnect, dns-prefetch)
   - [ ] Optimiser ordre chargement ressources

#### Phase 3 : Optimiser TTFB (Time to First Byte) 🟡

1. **CDN & Edge**
   - [ ] Utiliser Vercel Edge Functions pour routes critiques
   - [ ] CDN pour assets statiques
   - [ ] Cache headers optimisés

2. **Base de Données**
   - [ ] Optimiser requêtes Supabase
   - [ ] Utiliser RPC functions pour requêtes complexes
   - [ ] Cache côté serveur (Supabase Edge Functions)

3. **API Calls**
   - [ ] Réduire nombre requêtes initiales
   - [ ] Combiner requêtes multiples
   - [ ] Utiliser GraphQL si possible

#### Phase 4 : Optimisations Supplémentaires 🟡

1. **Code Splitting**
   - [ ] Analyser chunks avec visualizer
   - [ ] Optimiser taille chunks (< 200KB)
   - [ ] Preload chunks critiques

2. **Cache**
   - [ ] Service Worker pour cache assets
   - [ ] Cache stratégique avec React Query
   - [ ] LocalStorage pour données fréquentes

3. **Monitoring**
   - [ ] Web Vitals monitoring avec Sentry
   - [ ] Alertes si métriques dégradées
   - [ ] Dashboard performance

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **FCP** | ~2s | < 1.5s | 🔴 |
| **LCP** | ~4s | < 2.5s | 🔴 |
| **TTFB** | Variable | < 600ms | 🟡 |
| **Bundle Initial** | Optimisé | < 200KB | 🟡 |

---

## 🧹 PRIORITÉ 3 : NETTOYER TODO/FIXME

### État Actuel
- **Occurrences trouvées** : 385 (beaucoup faux positifs)
- **Vrais TODO/FIXME** : ~30-40 estimés
- **Types** : TODO, FIXME, XXX, HACK, BUG

### Plan d'Action

#### Phase 1 : Audit & Catégorisation 🔴

1. **Filtrer Vrais TODO/FIXME**
   - [ ] Exclure `logger.debug` (faux positifs)
   - [ ] Exclure commentaires CSS debug
   - [ ] Exclure traductions i18n
   - [ ] Lister vrais TODO/FIXME critiques

2. **Catégoriser par Priorité**
   - [ ] 🔴 **Critique** : Bugs, sécurité, fonctionnalités bloquantes
   - [ ] 🟡 **Moyenne** : Améliorations, optimisations
   - [ ] 🟢 **Basse** : Nice-to-have, documentation

3. **Créer Issues GitHub**
   - [ ] Créer issue pour chaque TODO critique
   - [ ] Ajouter labels (bug, enhancement, etc.)
   - [ ] Assigner priorité

#### Phase 2 : Traiter TODO Critiques 🔴

**TODO Critiques Identifiés** :

1. **`src/pages/Marketplace.tsx:384`**
   ```typescript
   // TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter RPC function Supabase
   - [ ] Créer fonction RPC `filter_marketplace_products`
   - [ ] Modifier hook `useMarketplaceProducts`
   - [ ] Tester performance

2. **`src/hooks/useMarketplaceProducts.ts:220`**
   ```typescript
   // TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter filtre variants
   - [ ] Ajouter jointure avec variants
   - [ ] Tester filtrage

3. **`src/lib/files/digital-file-processing.ts:246`**
   ```typescript
   // TODO: Implémenter avec JSZip ou Edge Function
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression ZIP
   - [ ] Ajouter JSZip pour compression
   - [ ] Ou créer Edge Function Supabase

4. **`src/lib/notifications/service-booking-notifications.ts:180`**
   ```typescript
   // TODO: Récupérer le user_id depuis le booking
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Corriger récupération user_id
   - [ ] Modifier requête pour inclure user_id
   - [ ] Tester notifications

5. **`src/hooks/physical/useStockOptimization.ts:291`**
   ```typescript
   // TODO: Calculer depuis l'historique des ventes
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter calcul historique
   - [ ] Créer fonction calcul moyenne ventes
   - [ ] Intégrer dans hook

6. **`src/pages/courses/CourseDetail.tsx:190`**
   ```typescript
   // TODO: Implémenter le paiement et l'inscription
   ```
   - **Priorité** : 🔴 Critique
   - **Action** : Implémenter paiement cours
   - [ ] Créer hook `useCoursePayment`
   - [ ] Intégrer dans page

7. **`src/lib/image-upload.ts:99`**
   ```typescript
   // TODO: Implémenter la compression avec canvas ou une librairie
   ```
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter compression images
   - [ ] Utiliser `browser-image-compression` (déjà installé)
   - [ ] Intégrer dans upload

8. **`src/lib/marketing/automation.ts`** (plusieurs TODO)
   - **Priorité** : 🟡 Moyenne
   - **Action** : Implémenter fonctionnalités automation
   - [ ] Vérification schedule
   - [ ] Vérification condition
   - [ ] Envoi SMS
   - [ ] Ajout segment
   - [ ] Appel webhook

#### Phase 3 : Nettoyer Code 🟡

1. **Supprimer TODO Résolus**
   - [ ] Vérifier si certains TODO sont déjà implémentés
   - [ ] Supprimer commentaires obsolètes

2. **Documenter TODO Restants**
   - [ ] Ajouter contexte pour chaque TODO
   - [ ] Ajouter lien vers issue GitHub
   - [ ] Ajouter estimation effort

3. **Créer Template TODO**
   - [ ] Template standardisé pour nouveaux TODO
   - [ ] Format : `// TODO: [PRIORITY] Description - Issue #XXX`

### Métriques Objectif

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| **TODO Critiques** | ~8 | 0 | 🔴 |
| **TODO Moyennes** | ~15 | < 5 | 🟡 |
| **TODO Basses** | ~10 | < 10 | 🟢 |
| **Issues GitHub** | 0 | 20+ | 🔴 |

---

## 📅 CALENDRIER D'IMPLÉMENTATION

### Semaine 1 : Tests & TODO
- **Jour 1-2** : Configuration coverage + Tests hooks Auth
- **Jour 3-4** : Tests hooks Payments
- **Jour 5** : Audit TODO + Création issues GitHub

### Semaine 2 : Performance & Tests
- **Jour 1-2** : Optimiser FCP (CSS critique, JS initial)
- **Jour 3-4** : Optimiser LCP (images hero, preload)
- **Jour 5** : Tests composants critiques

### Semaine 3 : Finalisation
- **Jour 1-2** : Traiter TODO critiques
- **Jour 3-4** : Tests utilitaires + Coverage final
- **Jour 5** : Optimisations finales + Monitoring

---

## ✅ CHECKLIST PROGRESSION

### Priorité 1 : Tests
- [ ] Configuration coverage complète
- [ ] Tests hooks Auth (5 hooks)
- [ ] Tests hooks Payments (8 hooks)
- [ ] Tests hooks Products (10 hooks)
- [ ] Tests hooks Orders (6 hooks)
- [ ] Tests composants Auth (3 composants)
- [ ] Tests composants Payments (5 composants)
- [ ] Tests composants Products (8 composants)
- [ ] Tests composants Checkout (4 composants)
- [ ] Tests utilitaires (10 fichiers)
- [ ] Coverage 80%+ atteint

### Priorité 2 : Performance
- [ ] CSS critique optimisé (< 50KB)
- [ ] JS initial réduit (< 200KB)
- [ ] Fonts optimisées (preload, subset)
- [ ] Images LCP optimisées (preload, WebP)
- [ ] TTFB optimisé (< 600ms)
- [ ] FCP < 1.5s atteint
- [ ] LCP < 2.5s atteint

### Priorité 3 : TODO/FIXME
- [ ] Audit TODO complet
- [ ] Issues GitHub créées (20+)
- [ ] TODO critiques traités (8)
- [ ] TODO moyennes traitées (15)
- [ ] Code nettoyé et documenté

---

**Prochaine Révision** : 2025-02-07  
**Responsable** : Équipe Développement


