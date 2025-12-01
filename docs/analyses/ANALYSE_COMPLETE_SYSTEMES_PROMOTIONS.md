# Analyse Complète des Systèmes de Promotions

**Date:** 28 Janvier 2025  
**Auteur:** Analyse Automatique  
**Objectif:** Analyser et documenter tous les systèmes de promotions/coupons existants dans la plateforme Emarzona

---

## 📋 Résumé Exécutif

La plateforme Emarzona dispose de **4 systèmes distincts** de promotions/coupons :

1. **Système Simple** (`promotions`) - Pour tous types de produits
2. **Système Avancé** (`product_promotions`) - Pour produits physiques avec fonctionnalités avancées
3. **Système Digital** (`digital_product_coupons`) - Spécialisé pour produits digitaux
4. **Système Loyalty/Rewards** (`loyalty_rewards`) - Récompenses de fidélité avec réductions

### 🎯 Constat Principal

Il existe une **fragmentation importante** des systèmes de promotions, ce qui peut créer :
- ❌ Confusion pour les vendeurs (quel système utiliser ?)
- ❌ Duplication de code
- ❌ Incohérences dans l'expérience utilisateur
- ❌ Difficulté de maintenance

---

## 📊 Inventaire Complet des Systèmes

### 1. Système Simple : `promotions`

**Table:** `public.promotions`  
**Migration:** `20251006095939_e8408ab3-976c-4d6b-9f85-6627443b1eca.sql`  
**Page:** `/dashboard/promotions`  
**Hook:** `src/hooks/usePromotions.ts`  
**Composant:** `src/components/promotions/CreatePromotionDialog.tsx`

#### Structure de la Table

```sql
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL,
  min_purchase_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(store_id, code)
);
```

#### Colonnes Ajoutées par Migration Avancée

```sql
-- Ajoutées par 20250126_coupons_system_advanced.sql
applicable_to_product_ids UUID[],
applicable_to_product_types TEXT[],
max_uses_per_user INTEGER,
is_platform_wide BOOLEAN DEFAULT false,
customer_eligibility TEXT DEFAULT 'all'
```

#### Table de Suivi

- **Table:** `coupon_usages`
- **Colonnes:** `promotion_id`, `user_id`, `order_id`, `discount_amount`, `used_at`

#### Fonctionnalités

✅ **Disponibles:**
- Code promo simple
- Type de réduction (pourcentage ou montant fixe)
- Dates de validité
- Limites d'utilisation (globale et par utilisateur)
- Montant minimum d'achat
- Application aux produits spécifiques (après migration)
- Application aux types de produits (après migration)
- Coupons globaux (platform-wide)
- Éligibilité client (all, new_customers, existing_customers, vip)

❌ **Limitations:**
- Pas de sélection visuelle de produits/catégories/collections dans l'interface
- Pas de support des variantes
- Pas de promotion automatique (toujours avec code)

#### Interface Utilisateur

- **Page:** `/dashboard/promotions`
- **Composant de création:** `CreatePromotionDialog.tsx`
- **Fonctionnalités UI:**
  - Formulaire simple
  - Recherche et filtres
  - Statistiques (total, actives, utilisations, moyenne)
  - Tableau de promotions

---

### 2. Système Avancé : `product_promotions`

**Table:** `public.product_promotions`  
**Migration:** `20250128_physical_products_advanced_improvements.sql`  
**Page:** `/dashboard/physical-promotions`  
**Hook:** `src/hooks/physical/usePromotions.ts`  
**Composant:** `src/components/physical/promotions/PromotionsManager.tsx`

#### Structure de la Table

```sql
CREATE TABLE public.product_promotions (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  
  -- Info promotion
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE,
  
  -- Type de réduction
  discount_type TEXT CHECK (
    IN ('percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping')
  ),
  discount_value NUMERIC NOT NULL,
  
  -- Portée
  applies_to TEXT CHECK (
    IN ('all_products', 'specific_products', 'categories', 'collections')
  ) DEFAULT 'all_products',
  product_ids UUID[],
  category_ids UUID[],
  collection_ids UUID[],
  
  -- Variantes
  applies_to_variants BOOLEAN DEFAULT TRUE,
  variant_ids UUID[],
  
  -- Conditions
  min_purchase_amount NUMERIC,
  min_quantity INTEGER,
  max_uses INTEGER,
  max_uses_per_customer INTEGER,
  current_uses INTEGER DEFAULT 0,
  
  -- Dates
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  
  -- Statut
  is_active BOOLEAN DEFAULT TRUE,
  is_automatic BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### Table de Suivi

- **Table:** `promotion_usage`
- **Colonnes:** `promotion_id`, `order_id`, `customer_id`, `discount_amount`, `used_at`

#### Fonctionnalités

✅ **Disponibles:**
- Nom et description de la promotion
- Code promo optionnel
- Types de réduction avancés (pourcentage, montant fixe, buy_x_get_y, livraison gratuite)
- Sélection de produits spécifiques ✅ (avec `PromotionScopeSelector`)
- Sélection de catégories ✅ (avec `PromotionScopeSelector`)
- Sélection de collections ✅ (avec `PromotionScopeSelector`)
- Support des variantes de produits
- Promotion automatique (sans code)
- Limite d'utilisation globale et par client
- Quantité minimum
- Validation au checkout améliorée ✅

#### Interface Utilisateur

- **Page:** `/dashboard/physical-promotions`
- **Composant de création:** `PromotionsManager.tsx`
- **Fonctionnalités UI:**
  - Formulaire complet avec sélection de produits/catégories/collections
  - Recherche et filtres
  - Statistiques détaillées
  - Vue tableau (desktop) et cartes (mobile)
  - Modification et suppression

---

### 3. Système Digital : `digital_product_coupons`

**Table:** `public.digital_product_coupons`  
**Migration:** `20250127_digital_product_coupons.sql`  
**Hook:** `src/hooks/digital/useCoupons.ts`  
**Composant:** `src/components/checkout/CouponInput.tsx`

#### Structure de la Table

```sql
CREATE TABLE public.digital_product_coupons (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  
  -- Coupon code
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Discount
  discount_type TEXT CHECK (IN ('percentage', 'fixed')) DEFAULT 'percentage',
  discount_value NUMERIC(10, 2) NOT NULL,
  
  -- Limits
  min_purchase_amount NUMERIC(10, 2) DEFAULT 0,
  max_discount_amount NUMERIC(10, 2),
  
  -- Applicability
  applicable_product_ids UUID[],
  applicable_product_types TEXT[],
  applicable_store_ids UUID[],
  
  -- Usage limits
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  usage_limit_per_customer INTEGER DEFAULT 1,
  
  -- Validity
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Restrictions
  first_time_buyers_only BOOLEAN DEFAULT FALSE,
  exclude_sale_items BOOLEAN DEFAULT FALSE,
  exclude_bundles BOOLEAN DEFAULT FALSE,
  
  -- Statistics
  total_discount_given NUMERIC(10, 2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### Table de Suivi

- **Table:** `coupon_usages` (partagée avec le système simple)
- **Colonnes:** `coupon_id`, `order_id`, `customer_id`, `discount_amount`, `customer_email`, `product_id`, `product_type`

#### Fonctionnalités

✅ **Disponibles:**
- Code coupon unique
- Nom et description
- Types de réduction (pourcentage avec limite max, montant fixe)
- Sélection de produits spécifiques
- Sélection de types de produits
- Sélection de stores (multi-stores)
- Limite d'utilisation globale et par client
- Restrictions spéciales :
  - Première fois seulement
  - Exclure articles en solde
  - Exclure bundles
- Statistiques (total réductions données, nombre de commandes)
- Archivage

#### Interface Utilisateur

- **Composant de validation:** `CouponInput.tsx`
- **Fonctionnalités UI:**
  - Validation en temps réel
  - Application dans le checkout
  - Gestion des erreurs

❌ **Manque:**
- Interface de gestion complète (création, modification, suppression)
- Page dédiée pour les vendeurs

---

### 4. Système Loyalty/Rewards : `loyalty_rewards`

**Table:** `public.loyalty_rewards`  
**Migration:** `20250127_loyalty_program.sql`  
**Hook:** `src/hooks/loyalty/useLoyalty.ts`

#### Structure de la Table

```sql
CREATE TABLE public.loyalty_rewards (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  
  -- Configuration
  name TEXT NOT NULL,
  description TEXT,
  
  -- Coût en points
  points_cost INTEGER NOT NULL,
  
  -- Type de récompense
  reward_type loyalty_reward_type, -- 'discount', 'free_product', 'gift_card', 'cash_back', 'custom'
  
  -- Valeur selon le type
  discount_percentage NUMERIC,
  discount_amount NUMERIC,
  free_product_id UUID,
  gift_card_amount NUMERIC,
  cash_back_amount NUMERIC,
  custom_value JSONB,
  
  -- Limitations
  max_redemptions INTEGER,
  max_redemptions_per_customer INTEGER,
  redemption_count INTEGER DEFAULT 0,
  
  -- Disponibilité
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  
  -- Conditions
  applicable_to_product_types TEXT[],
  applicable_to_products UUID[],
  
  -- Visuel
  image_url TEXT,
  badge_text TEXT,
  display_order INTEGER DEFAULT 0,
  
  status TEXT DEFAULT 'active',
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### Fonctionnalités

✅ **Disponibles:**
- Système de points de fidélité
- Récompenses échangeables contre des points
- Types de récompenses multiples (réduction, produit gratuit, carte cadeau, cash-back, personnalisé)
- Limitations d'échange
- Application aux produits/catégories
- Attribution automatique de points lors des achats

#### Relation avec les Promotions

Ce système n'est **pas directement** un système de promotions, mais il permet d'offrir des réductions via l'échange de points. C'est un système complémentaire.

---

## 🔄 Comparaison Détaillée

### Tableau Comparatif des Fonctionnalités

| Fonctionnalité | `promotions` | `product_promotions` | `digital_product_coupons` | `loyalty_rewards` |
|----------------|--------------|---------------------|---------------------------|-------------------|
| **Code promo** | ✅ | ✅ (optionnel) | ✅ | ❌ (points) |
| **Type réduction** | Pourcentage, Fixe | %, Fixe, Buy X Get Y, Free Shipping | Pourcentage, Fixe | %, Fixe, Produit, Carte, Cash-back |
| **Sélection produits** | ✅ (via migration) | ✅ (avec UI) | ✅ | ✅ |
| **Sélection catégories** | ❌ | ✅ (avec UI) | ❌ | ✅ |
| **Sélection collections** | ❌ | ✅ (avec UI) | ❌ | ✅ |
| **Variantes produits** | ❌ | ✅ | ❌ | ❌ |
| **Promotion automatique** | ❌ | ✅ | ❌ | ❌ |
| **Limite globale** | ✅ | ✅ | ✅ | ✅ |
| **Limite par client** | ✅ | ✅ | ✅ | ✅ |
| **Montant minimum** | ✅ | ✅ | ✅ | ❌ |
| **Quantité minimum** | ❌ | ✅ | ❌ | ❌ |
| **Dates validité** | ✅ | ✅ | ✅ | ✅ |
| **Restrictions spéciales** | Éligibilité client | ❌ | Première fois, Exclure solde/bundles | Points requis |
| **Interface gestion** | ✅ | ✅ | ❌ | ✅ |
| **Validation checkout** | ✅ | ✅ | ✅ | ✅ (via points) |

---

## 🎯 Routes et Pages

### Routes Identifiées

1. **`/dashboard/promotions`** → Système simple (`promotions`)
   - Composant: `src/pages/Promotions.tsx`
   - Hook: `src/hooks/usePromotions.ts`

2. **`/dashboard/physical-promotions`** → Système avancé (`product_promotions`)
   - Composant: `src/pages/admin/PhysicalPromotions.tsx`
   - Hook: `src/hooks/physical/usePromotions.ts`

3. **Checkout** → Utilise les deux systèmes
   - Composant: `src/components/checkout/CouponInput.tsx`
   - Validation: Fonctions RPC et hooks

---

## 🔧 Fonctions RPC (Supabase)

### 1. `validate_coupon`

**Utilisée par:** Système simple (`promotions`)

```sql
validate_coupon(
  coupon_code TEXT,
  cart_subtotal NUMERIC,
  product_ids UUID[] DEFAULT NULL,
  product_types TEXT[] DEFAULT NULL
) RETURNS JSONB
```

**Validations:**
- Existence et validité du coupon
- Dates de validité
- Montant minimum
- Limites d'utilisation
- Produits éligibles
- Types de produits éligibles

### 2. `validate_coupon` (Digital)

**Utilisée par:** Système digital (`digital_product_coupons`)

```sql
validate_coupon(
  p_code TEXT,
  p_product_id UUID DEFAULT NULL,
  p_product_type TEXT DEFAULT NULL,
  p_store_id UUID DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_order_amount NUMERIC(10, 2) DEFAULT 0
) RETURNS JSONB
```

**Validations supplémentaires:**
- Store éligible
- Client première fois
- Exclusion articles en solde
- Exclusion bundles
- Limite max de réduction

### 3. `record_coupon_usage`

**Utilisée par:** Système simple

Enregistre l'utilisation d'un coupon et met à jour les compteurs.

---

## ⚠️ Problèmes Identifiés

### 1. Fragmentation et Duplication

- **4 systèmes différents** pour gérer les promotions
- Code dupliqué pour la validation
- Interfaces différentes selon le système
- Confusion potentielle pour les vendeurs

### 2. Incohérences

- Le système simple a des colonnes pour `applicable_to_product_ids` mais **pas d'interface** pour les sélectionner
- Le système digital a moins de fonctionnalités mais plus de restrictions spéciales
- Différentes tables de suivi (`coupon_usages` vs `promotion_usage`)

### 3. Manques Fonctionnels

- ❌ Pas d'interface de gestion pour `digital_product_coupons`
- ❌ Pas de sélection visuelle pour `promotions` (produits/catégories)
- ❌ Pas d'unification des systèmes
- ❌ Possibilité d'avoir des codes dupliqués entre systèmes

### 4. Complexité au Checkout

- Le checkout doit gérer plusieurs systèmes
- Validation différente selon le système
- Risque de confusion pour les clients

---

## ✅ Points Forts

1. **Fonctionnalités Complètes** : Chaque système couvre des besoins spécifiques
2. **Validation Robuste** : Validation au niveau RPC avec messages d'erreur clairs
3. **Suivi Détaillé** : Tables de suivi pour l'historique
4. **Sécurité** : RLS bien configuré sur toutes les tables
5. **Performance** : Indexes bien configurés

---

## 🎯 Recommandations

### Priorité 1 : Unification des Systèmes

**Objectif:** Créer un système unifié qui remplace les 3 systèmes principaux

**Proposition:**
- **Conserver** `product_promotions` comme système principal (le plus complet)
- **Migrer** les données de `promotions` vers `product_promotions`
- **Intégrer** les fonctionnalités de `digital_product_coupons` dans `product_promotions`
- **Créer** une page unique `/dashboard/promotions` qui utilise le système unifié

**Avantages:**
- Une seule interface pour les vendeurs
- Code unifié et maintenable
- Expérience utilisateur cohérente
- Validation centralisée

### Priorité 2 : Interface de Gestion Complète

**Créer une interface de gestion complète pour tous les types de promotions:**
- Vue unifiée
- Filtres avancés
- Statistiques consolidées
- Export des données

### Priorité 3 : Migration des Données

**Plan de migration:**
1. Créer une fonction de migration pour `promotions` → `product_promotions`
2. Créer une fonction de migration pour `digital_product_coupons` → `product_promotions`
3. Tester la migration sur une copie de production
4. Exécuter la migration avec rollback possible

### Priorité 4 : Documentation

**Créer une documentation claire pour:**
- Les vendeurs : Guide d'utilisation des promotions
- Les développeurs : Architecture et API
- Les administrateurs : Gestion et maintenance

---

## 📝 Plan d'Action Recommandé

### Phase 1 : Amélioration Immédiate (1-2 semaines)

1. ✅ Ajouter interface de sélection produits/catégories/collections au système simple
2. ✅ Créer interface de gestion pour `digital_product_coupons`
3. ✅ Unifier les composants de validation au checkout

### Phase 2 : Unification (2-4 semaines)

1. Créer un système unifié basé sur `product_promotions`
2. Migrer les données existantes
3. Adapter toutes les interfaces
4. Mettre à jour la documentation

### Phase 3 : Optimisation (1-2 semaines)

1. Optimiser les requêtes
2. Améliorer les performances
3. Ajouter des tests
4. Finaliser la documentation

---

## 📊 Statistiques des Systèmes

### Système Simple (`promotions`)

- **Tables:** 2 (`promotions`, `coupon_usages`)
- **Hooks:** 1 (`usePromotions.ts`)
- **Composants UI:** 3 (`CreatePromotionDialog`, `PromotionsTable`, `PromotionFilters`)
- **Pages:** 1 (`/dashboard/promotions`)
- **Fonctions RPC:** 2 (`validate_coupon`, `record_coupon_usage`)

### Système Avancé (`product_promotions`)

- **Tables:** 2 (`product_promotions`, `promotion_usage`)
- **Hooks:** 1 (`usePromotions.ts` dans physical/)
- **Composants UI:** 1 (`PromotionsManager.tsx`)
- **Pages:** 1 (`/dashboard/physical-promotions`)
- **Fonctions RPC:** Validation dans le hook

### Système Digital (`digital_product_coupons`)

- **Tables:** 2 (`digital_product_coupons`, `coupon_usages`)
- **Hooks:** 1 (`useCoupons.ts`)
- **Composants UI:** 1 (`CouponInput.tsx`)
- **Pages:** 0 (pas d'interface de gestion)
- **Fonctions RPC:** 2 (`validate_coupon`, `apply_coupon_to_order`)

### Système Loyalty

- **Tables:** 5 (loyalty_tiers, loyalty_points, loyalty_transactions, loyalty_rewards, loyalty_reward_redemptions)
- **Hooks:** 1 (`useLoyalty.ts`)
- **Composants UI:** Variables
- **Pages:** Variables
- **Fonctions RPC:** 3 (`calculate_loyalty_points`, `update_customer_tier`, `redeem_loyalty_reward`)

---

## 🔍 Points d'Attention

### Conflits Potentiels

1. **Codes Dupliqués** : Rien n'empêche d'avoir le même code dans `promotions` et `digital_product_coupons`
2. **Validation Multiple** : Le checkout doit vérifier plusieurs systèmes
3. **Interface Fragmentée** : Les vendeurs doivent aller à différents endroits selon le type

### Sécurité

- ✅ RLS bien configuré sur toutes les tables
- ✅ Validation côté serveur (RPC)
- ⚠️ Vérifier que tous les systèmes respectent les mêmes règles de sécurité

### Performance

- ✅ Indexes bien configurés
- ⚠️ Requêtes multiples au checkout (validation dans plusieurs systèmes)
- 💡 Optimisation possible avec un système unifié

---

## ✅ Conclusion

La plateforme dispose de **4 systèmes de promotions** fonctionnels mais fragmentés. Le système le plus complet est `product_promotions`, qui devrait devenir le système unifié.

**Recommandation principale:** Unifier progressivement tous les systèmes vers `product_promotions` en conservant les fonctionnalités spécifiques de chacun.

**Action immédiate:** Continuer l'amélioration de `product_promotions` (déjà en cours) et créer une interface de gestion pour `digital_product_coupons`.

---

## 📚 Références

- Migration simple: `supabase/migrations/20251006095939_e8408ab3-976c-4d6b-9f85-6627443b1eca.sql`
- Migration avancée: `supabase/migrations/20250126_coupons_system_advanced.sql`
- Migration digital: `supabase/migrations/20250127_digital_product_coupons.sql`
- Migration physical: `supabase/migrations/20250128_physical_products_advanced_improvements.sql`
- Migration collections: `supabase/migrations/20250128_collections_system.sql`

