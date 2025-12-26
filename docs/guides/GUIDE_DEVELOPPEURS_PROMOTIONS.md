# Guide Développeurs : Système Unifié de Promotions

**Date:** 28 Janvier 2025  
**Version:** 1.0  
**Public:** Développeurs et contributeurs techniques

---

## 📋 Table des Matières

1. [Architecture](#architecture)
2. [Migration des Données](#migration-des-données)
3. [Structure de la Base de Données](#structure-de-la-base-de-données)
4. [API et Hooks](#api-et-hooks)
5. [Composants React](#composants-react)
6. [Validation au Checkout](#validation-au-checkout)
7. [Migration Guide](#migration-guide)
8. [Tests](#tests)
9. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture

### Vue d'Ensemble

Le système unifié de promotions utilise la table `product_promotions` comme système principal pour gérer toutes les promotions de la plateforme, qu'elles concernent des produits physiques, digitaux, services ou cours.

```
┌─────────────────────────────────────────────────────┐
│          Système Unifié de Promotions                │
│              (product_promotions)                    │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
│  Physiques   │ │  Digitaux   │ │  Services  │
└──────────────┘ └─────────────┘ └────────────┘
```

### Migration depuis les Anciens Systèmes

Le système unifie trois systèmes précédents :

1. **`promotions`** (système simple)
2. **`digital_product_coupons`** (système digital)
3. **`product_promotions`** (système physique - devenu principal)

Tous les anciens systèmes sont migrés vers `product_promotions` avec des colonnes de traçabilité (`original_promotion_id`, `original_digital_coupon_id`, `migration_source`).

---

## 📦 Migration des Données

### Exécuter la Migration

La migration est fournie dans `supabase/migrations/20250128_unify_promotions_system.sql`.

```bash
# Via Supabase CLI
supabase migration up

# Ou via SQL direct dans Supabase Dashboard
```

### Fonctions de Migration

#### 1. Migrer depuis `promotions`

```sql
SELECT * FROM migrate_promotions_to_product_promotions();
```

Cette fonction :

- Trouve toutes les promotions dans `promotions`
- Les transforme en format `product_promotions`
- Préserve les relations originales via `original_promotion_id`
- Retourne le nombre de migrations réussies/échouées

---

#### 2. Migrer depuis `digital_product_coupons`

```sql
SELECT * FROM migrate_digital_coupons_to_product_promotions();
```

Cette fonction :

- Trouve tous les coupons dans `digital_product_coupons`
- Les transforme en format `product_promotions`
- Préserve les relations via `original_digital_coupon_id`
- Conserve les métadonnées spécifiques (max_discount_amount, etc.)

---

#### 3. Migrer les Utilisations

```sql
SELECT migrate_coupon_usages_to_promotion_usage();
```

Migre les données d'utilisation depuis `coupon_usages` vers `promotion_usage`.

---

### Vérifier la Migration

```sql
-- Voir les promotions migrées
SELECT
  id,
  name,
  code,
  migration_source,
  original_promotion_id,
  original_digital_coupon_id,
  created_at
FROM product_promotions
WHERE migration_source IS NOT NULL
ORDER BY created_at DESC;
```

---

## 🗄️ Structure de la Base de Données

### Table Principale : `product_promotions`

```sql
CREATE TABLE public.product_promotions (
  -- Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id),

  -- Informations de base
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE,

  -- Type de réduction
  discount_type TEXT NOT NULL CHECK (discount_type IN (
    'percentage',
    'fixed_amount',
    'buy_x_get_y',
    'free_shipping'
  )),
  discount_value NUMERIC NOT NULL,

  -- Portée (scope)
  applies_to TEXT NOT NULL CHECK (applies_to IN (
    'all_products',
    'specific_products',
    'categories',
    'collections'
  )) DEFAULT 'all_products',
  product_ids UUID[], -- Pour specific_products
  category_ids UUID[], -- Pour categories
  collection_ids UUID[], -- Pour collections

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

  -- Colonnes de migration
  original_promotion_id UUID,
  original_digital_coupon_id UUID,
  migration_source TEXT, -- 'promotions', 'digital_product_coupons', 'product_promotions'
  migration_note TEXT,

  -- Colonnes étendues (digital)
  max_discount_amount NUMERIC,
  applicable_store_ids UUID[],
  first_time_buyers_only BOOLEAN DEFAULT FALSE,
  exclude_sale_items BOOLEAN DEFAULT FALSE,
  exclude_bundles BOOLEAN DEFAULT FALSE,
  is_platform_wide BOOLEAN DEFAULT FALSE,
  customer_eligibility TEXT DEFAULT 'all',
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Statistiques
  total_discount_given NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Index

```sql
CREATE INDEX idx_product_promotions_store_id ON product_promotions(store_id);
CREATE INDEX idx_product_promotions_code ON product_promotions(code) WHERE code IS NOT NULL;
CREATE INDEX idx_product_promotions_active ON product_promotions(is_active);
CREATE INDEX idx_product_promotions_dates ON product_promotions(starts_at, ends_at);
CREATE INDEX idx_product_promotions_product_ids ON product_promotions USING GIN(product_ids);
CREATE INDEX idx_product_promotions_category_ids ON product_promotions USING GIN(category_ids);
CREATE INDEX idx_product_promotions_collection_ids ON product_promotions USING GIN(collection_ids);
```

---

## 🔌 API et Hooks

### Hooks Principaux

Tous les hooks sont dans `src/hooks/physical/usePromotions.ts`.

#### `usePromotions(storeId?: string)`

Récupère toutes les promotions d'une boutique.

```typescript
const { data: promotions, isLoading } = usePromotions(storeId);
```

#### `usePromotion(promotionId: string)`

Récupère une promotion spécifique.

```typescript
const { data: promotion } = usePromotion(promotionId);
```

#### `useCreatePromotion()`

Crée une nouvelle promotion.

```typescript
const createMutation = useCreatePromotion();

await createMutation.mutateAsync({
  store_id: storeId,
  name: 'Black Friday 2025',
  code: 'BLACKFRIDAY25',
  discount_type: 'percentage',
  discount_value: 20,
  applies_to: 'all_products',
  starts_at: new Date().toISOString(),
  is_active: true,
  is_automatic: false,
});
```

#### `useUpdatePromotion()`

Met à jour une promotion existante.

```typescript
const updateMutation = useUpdatePromotion();

await updateMutation.mutateAsync({
  id: promotionId,
  ...updatedFields,
});
```

#### `useDeletePromotion()`

Supprime une promotion.

```typescript
const deleteMutation = useDeletePromotion();

await deleteMutation.mutateAsync(promotionId);
```

#### `useValidatePromotionCode()`

Valide un code promotionnel au checkout.

```typescript
const validateMutation = useValidatePromotionCode();

const result = await validateMutation.mutateAsync({
  code: 'BLACKFRIDAY25',
  customerId: customerId,
  orderAmount: 15000,
  productIdsInCart: ['product-id-1', 'product-id-2'],
  categoryIdsInCart: ['category-id-1'],
  collectionIdsInCart: ['collection-id-1'],
});

if (result.valid) {
  console.log(`Réduction: ${result.discount_amount} XOF`);
} else {
  console.error(result.error);
}
```

---

## ⚛️ Composants React

### Composant Principal : `PromotionsManager`

**Fichier:** `src/components/physical/promotions/PromotionsManager.tsx`

**Fonctionnalités:**

- Affichage de la liste des promotions
- Création / Modification / Suppression
- Statistiques
- Vue responsive (tableau desktop, cartes mobile)

**Utilisation:**

```tsx
import { PromotionsManager } from '@/components/physical/promotions/PromotionsManager';

<PromotionsManager />;
```

---

### Composant de Sélection : `PromotionScopeSelector`

**Fichier:** `src/components/promotions/PromotionScopeSelector.tsx`

**Fonctionnalités:**

- Sélection de produits
- Sélection de catégories
- Sélection de collections
- Recherche intégrée

**Utilisation:**

```tsx
import { PromotionScopeSelector } from '@/components/promotions/PromotionScopeSelector';

<PromotionScopeSelector
  storeId={storeId}
  appliesTo="specific_products"
  selectedProductIds={productIds}
  onProductIdsChange={setProductIds}
  selectedCategoryIds={categoryIds}
  onCategoryIdsChange={setCategoryIds}
  selectedCollectionIds={collectionIds}
  onCollectionIdsChange={setCollectionIds}
/>;
```

---

### Page Unifiée : `UnifiedPromotionsPage`

**Fichier:** `src/pages/promotions/UnifiedPromotionsPage.tsx`

**Fonctionnalités:**

- Page complète de gestion
- Guide intégré
- Interface unifiée

**Route:**

```tsx
<Route
  path="/dashboard/promotions"
  element={
    <ProtectedRoute>
      <UnifiedPromotionsPage />
    </ProtectedRoute>
  }
/>
```

---

## ✅ Validation au Checkout

### Fonction SQL : `validate_unified_promotion()`

**Fichier:** `supabase/migrations/20250128_unify_promotions_system.sql`

**Signature:**

```sql
FUNCTION validate_unified_promotion(
  p_code TEXT,
  p_store_id UUID DEFAULT NULL,
  p_product_ids UUID[] DEFAULT NULL,
  p_category_ids UUID[] DEFAULT NULL,
  p_order_amount NUMERIC DEFAULT 0,
  p_customer_id UUID DEFAULT NULL,
  p_is_first_order BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
```

**Retour:**

```json
{
  "valid": true,
  "promotion_id": "uuid",
  "code": "BLACKFRIDAY25",
  "name": "Black Friday 2025",
  "discount_type": "percentage",
  "discount_value": 20,
  "discount_amount": 3000,
  "order_total_before": 15000,
  "order_total_after": 12000
}
```

Ou en cas d'erreur:

```json
{
  "valid": false,
  "error": "Message d'erreur explicite"
}
```

**Utilisation dans le code:**

```typescript
const { data } = await supabase.rpc('validate_unified_promotion', {
  p_code: code.toUpperCase(),
  p_store_id: storeId,
  p_product_ids: productIds,
  p_category_ids: categoryIds,
  p_order_amount: total,
  p_customer_id: customerId,
  p_is_first_order: isFirstOrder,
});
```

---

## 🔄 Migration Guide

### Étape 1 : Préparer la Migration

1. **Sauvegarder les données existantes**

```sql
-- Créer des backups
CREATE TABLE promotions_backup AS SELECT * FROM promotions;
CREATE TABLE digital_product_coupons_backup AS SELECT * FROM digital_product_coupons;
```

2. **Vérifier l'état actuel**

```sql
-- Compter les enregistrements
SELECT COUNT(*) FROM promotions;
SELECT COUNT(*) FROM digital_product_coupons;
SELECT COUNT(*) FROM product_promotions;
```

---

### Étape 2 : Exécuter la Migration

```sql
-- 1. Étendre la table product_promotions
-- (déjà inclus dans la migration)

-- 2. Migrer depuis promotions
SELECT * FROM migrate_promotions_to_product_promotions();

-- 3. Migrer depuis digital_product_coupons
SELECT * FROM migrate_digital_coupons_to_product_promotions();

-- 4. Migrer les utilisations
SELECT migrate_coupon_usages_to_promotion_usage();
```

---

### Étape 3 : Vérifier les Résultats

```sql
-- Vérifier les migrations réussies
SELECT
  migration_source,
  COUNT(*) as count
FROM product_promotions
WHERE migration_source IS NOT NULL
GROUP BY migration_source;

-- Vérifier les erreurs (si la fonction les retourne)
-- (les erreurs sont dans le retour de la fonction)
```

---

### Étape 4 : Mettre à Jour le Code

1. **Remplacer les appels aux anciens hooks**

**Avant:**

```typescript
import { useCoupons } from '@/hooks/digital/useCoupons';
const { data: coupons } = useCoupons(storeId);
```

**Après:**

```typescript
import { usePromotions } from '@/hooks/physical/usePromotions';
const { data: promotions } = usePromotions(storeId);
```

2. **Adapter les composants**

Utiliser `PromotionsManager` au lieu des anciens composants séparés.

3. **Mettre à jour les routes**

```tsx
// Remplacer
<Route path="/dashboard/digital-coupons" ... />

// Par
<Route path="/dashboard/promotions" element={<UnifiedPromotionsPage />} />
```

---

### Étape 5 : Tests

1. **Tester la création de promotions**
2. **Tester la validation au checkout**
3. **Vérifier les statistiques**
4. **Tester tous les types de produits**

---

## 🧪 Tests

### Tests Unitaires

**Fichier:** `src/hooks/physical/__tests__/usePromotions.test.ts` (à créer)

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { usePromotions } from '@/hooks/physical/usePromotions';

describe('usePromotions', () => {
  it('should fetch promotions for a store', async () => {
    const { result } = renderHook(() => usePromotions('store-id'));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });
});
```

---

### Tests d'Intégration

Tester le flux complet :

1. Créer une promotion
2. Valider au checkout
3. Vérifier l'application
4. Vérifier les statistiques

---

## 🔧 Troubleshooting

### Problème : Migration échoue

**Solution:**

1. Vérifier les contraintes de la table
2. Vérifier les types de données
3. Consulter les logs d'erreur

```sql
-- Vérifier les contraintes
SELECT * FROM information_schema.table_constraints
WHERE table_name = 'product_promotions';
```

---

### Problème : Validation ne fonctionne pas

**Solution:**

1. Vérifier que la fonction existe

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'validate_unified_promotion';
```

2. Vérifier les permissions

```sql
GRANT EXECUTE ON FUNCTION validate_unified_promotion TO authenticated;
```

---

### Problème : Anciennes promotions non migrées

**Solution:**

1. Vérifier les IDs originaux

```sql
SELECT id, migration_source, original_promotion_id
FROM product_promotions
WHERE migration_source IS NULL;
```

2. Relancer la migration manuellement

```sql
-- Pour une promotion spécifique
INSERT INTO product_promotions (...)
SELECT ... FROM promotions WHERE id = 'promotion-id';
```

---

## 📚 Références

- **Migration SQL:** `supabase/migrations/20250128_unify_promotions_system.sql`
- **Hooks:** `src/hooks/physical/usePromotions.ts`
- **Composants:** `src/components/physical/promotions/PromotionsManager.tsx`
- **Page:** `src/pages/promotions/UnifiedPromotionsPage.tsx`
- **Guide Vendeurs:** `docs/guides/GUIDE_VENDEURS_PROMOTIONS.md`

---

**Dernière mise à jour :** 28 Janvier 2025  
**Version du guide :** 1.0
