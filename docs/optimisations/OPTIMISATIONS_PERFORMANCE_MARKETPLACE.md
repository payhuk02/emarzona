# ⚡ Optimisations Performance Marketplace
## Documentation des TODO Performance

**Date** : 2025-01-30  
**Statut** : 📋 Documentation et recommandations

---

## 📋 TODO IDENTIFIÉS

### 1. `src/pages/Marketplace.tsx:384`
**TODO** : Optimiser avec des fonctions RPC pour filtrer côté serveur

**Contexte** :
```typescript
// Filtres spécifiques par type de produit
// Note: Les filtres sur les relations (digital_products, service_products, etc.)
// seront appliqués côté client après récupération des données
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```

**Impact** : Performance recherche produits dégradée avec beaucoup de produits

**Solution Recommandée** :

#### Créer une fonction RPC Supabase

```sql
-- supabase/migrations/YYYYMMDD_filter_marketplace_products.sql
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  p_product_type TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_stock_availability TEXT DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  store_id UUID,
  name TEXT,
  slug TEXT,
  price NUMERIC,
  currency TEXT,
  image_url TEXT,
  category TEXT,
  product_type TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  is_active BOOLEAN,
  stock_quantity INTEGER,
  stock_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.store_id,
    p.name,
    p.slug,
    p.price,
    p.currency,
    p.image_url,
    p.category,
    p.product_type,
    p.rating,
    p.reviews_count,
    p.is_active,
    p.stock_quantity,
    p.stock_status
  FROM products p
  WHERE p.is_active = true
    AND (p_product_type IS NULL OR p.product_type = p_product_type)
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_stock_availability IS NULL OR 
         (p_stock_availability = 'in_stock' AND (p.stock_quantity > 0 OR p.stock_quantity IS NULL)) OR
         (p_stock_availability = 'out_of_stock' AND p.stock_quantity = 0))
    AND (p_search_term IS NULL OR 
         p.name ILIKE '%' || p_search_term || '%' OR
         p.description ILIKE '%' || p_search_term || '%')
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Utiliser la fonction RPC dans le hook

```typescript
// src/hooks/useMarketplaceProducts.ts
const { data, error } = await supabase.rpc('filter_marketplace_products', {
  p_product_type: filters.productType || null,
  p_category: filters.category || null,
  p_min_price: filters.minPrice || null,
  p_max_price: filters.maxPrice || null,
  p_stock_availability: filters.stockAvailability || null,
  p_search_term: filters.search || null,
  p_limit: pageSize,
  p_offset: (page - 1) * pageSize,
});
```

**Bénéfices** :
- ✅ Filtrage côté serveur (plus rapide)
- ✅ Moins de données transférées
- ✅ Meilleure performance avec beaucoup de produits
- ✅ Indexation DB optimale

**Effort** : 🟡 Moyen (2-3h)

---

### 2. `src/hooks/useMarketplaceProducts.ts:220`
**TODO** : Implémenter le filtre via jointure avec physical_product_variants si nécessaire

**Contexte** :
```typescript
// Note: free_shipping n'existe pas dans la table products
// Ce filtre doit être appliqué via une jointure avec physical_product_variants si nécessaire
// Pour l'instant, on ignore ce filtre côté serveur
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```

**Impact** : Filtrage variants incomplet

**Solution Recommandée** :

#### Étendre la fonction RPC pour inclure les variants

```sql
-- Ajouter le paramètre free_shipping à la fonction RPC
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  -- ... paramètres existants ...
  p_free_shipping BOOLEAN DEFAULT NULL
)
RETURNS TABLE (...) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    -- ... autres colonnes ...
  FROM products p
  LEFT JOIN physical_product_variants ppv ON ppv.product_id = p.id
  WHERE p.is_active = true
    -- ... autres conditions ...
    AND (p_free_shipping IS NULL OR 
         (p_free_shipping = true AND ppv.free_shipping = true) OR
         (p_free_shipping = false AND (ppv.free_shipping = false OR ppv.free_shipping IS NULL)))
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Bénéfices** :
- ✅ Filtrage free_shipping fonctionnel
- ✅ Jointure optimisée côté serveur
- ✅ Support des variants physiques

**Effort** : 🟡 Moyen (2-3h)

---

## 📊 IMPACT ATTENDU

### Performance

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| **Temps de recherche** | ~2-3s | ~0.5-1s | -60-70% |
| **Données transférées** | ~500KB | ~100KB | -80% |
| **Requêtes DB** | 1 + filtrage client | 1 RPC | Optimisé |

### Expérience Utilisateur

- ✅ Recherche plus rapide
- ✅ Moins de latence
- ✅ Meilleure réactivité

---

## 🎯 PLAN D'IMPLÉMENTATION

### Phase 1 : Fonction RPC de base (2h)
- [ ] Créer migration SQL avec fonction RPC
- [ ] Tester la fonction RPC directement
- [ ] Vérifier les performances

### Phase 2 : Intégration hook (1h)
- [ ] Modifier `useMarketplaceProducts.ts`
- [ ] Remplacer requête Supabase par RPC
- [ ] Tester les filtres

### Phase 3 : Support variants (2h)
- [ ] Étendre fonction RPC pour variants
- [ ] Ajouter filtre free_shipping
- [ ] Tests complets

### Phase 4 : Tests et validation (1h)
- [ ] Tests unitaires
- [ ] Tests E2E
- [ ] Validation performance

---

## 📝 NOTES

- Les fonctions RPC Supabase sont plus performantes que les requêtes client
- Le filtrage côté serveur réduit la charge réseau
- Les index DB peuvent être optimisés pour ces requêtes
- Compatible avec RLS (Row Level Security)

---

**Statut** : 📋 Documentation complète  
**Prochaine étape** : Implémenter Phase 1

## Documentation des TODO Performance

**Date** : 2025-01-30  
**Statut** : 📋 Documentation et recommandations

---

## 📋 TODO IDENTIFIÉS

### 1. `src/pages/Marketplace.tsx:384`
**TODO** : Optimiser avec des fonctions RPC pour filtrer côté serveur

**Contexte** :
```typescript
// Filtres spécifiques par type de produit
// Note: Les filtres sur les relations (digital_products, service_products, etc.)
// seront appliqués côté client après récupération des données
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```

**Impact** : Performance recherche produits dégradée avec beaucoup de produits

**Solution Recommandée** :

#### Créer une fonction RPC Supabase

```sql
-- supabase/migrations/YYYYMMDD_filter_marketplace_products.sql
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  p_product_type TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_stock_availability TEXT DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  store_id UUID,
  name TEXT,
  slug TEXT,
  price NUMERIC,
  currency TEXT,
  image_url TEXT,
  category TEXT,
  product_type TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  is_active BOOLEAN,
  stock_quantity INTEGER,
  stock_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.store_id,
    p.name,
    p.slug,
    p.price,
    p.currency,
    p.image_url,
    p.category,
    p.product_type,
    p.rating,
    p.reviews_count,
    p.is_active,
    p.stock_quantity,
    p.stock_status
  FROM products p
  WHERE p.is_active = true
    AND (p_product_type IS NULL OR p.product_type = p_product_type)
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_stock_availability IS NULL OR 
         (p_stock_availability = 'in_stock' AND (p.stock_quantity > 0 OR p.stock_quantity IS NULL)) OR
         (p_stock_availability = 'out_of_stock' AND p.stock_quantity = 0))
    AND (p_search_term IS NULL OR 
         p.name ILIKE '%' || p_search_term || '%' OR
         p.description ILIKE '%' || p_search_term || '%')
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Utiliser la fonction RPC dans le hook

```typescript
// src/hooks/useMarketplaceProducts.ts
const { data, error } = await supabase.rpc('filter_marketplace_products', {
  p_product_type: filters.productType || null,
  p_category: filters.category || null,
  p_min_price: filters.minPrice || null,
  p_max_price: filters.maxPrice || null,
  p_stock_availability: filters.stockAvailability || null,
  p_search_term: filters.search || null,
  p_limit: pageSize,
  p_offset: (page - 1) * pageSize,
});
```

**Bénéfices** :
- ✅ Filtrage côté serveur (plus rapide)
- ✅ Moins de données transférées
- ✅ Meilleure performance avec beaucoup de produits
- ✅ Indexation DB optimale

**Effort** : 🟡 Moyen (2-3h)

---

### 2. `src/hooks/useMarketplaceProducts.ts:220`
**TODO** : Implémenter le filtre via jointure avec physical_product_variants si nécessaire

**Contexte** :
```typescript
// Note: free_shipping n'existe pas dans la table products
// Ce filtre doit être appliqué via une jointure avec physical_product_variants si nécessaire
// Pour l'instant, on ignore ce filtre côté serveur
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```

**Impact** : Filtrage variants incomplet

**Solution Recommandée** :

#### Étendre la fonction RPC pour inclure les variants

```sql
-- Ajouter le paramètre free_shipping à la fonction RPC
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  -- ... paramètres existants ...
  p_free_shipping BOOLEAN DEFAULT NULL
)
RETURNS TABLE (...) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    -- ... autres colonnes ...
  FROM products p
  LEFT JOIN physical_product_variants ppv ON ppv.product_id = p.id
  WHERE p.is_active = true
    -- ... autres conditions ...
    AND (p_free_shipping IS NULL OR 
         (p_free_shipping = true AND ppv.free_shipping = true) OR
         (p_free_shipping = false AND (ppv.free_shipping = false OR ppv.free_shipping IS NULL)))
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Bénéfices** :
- ✅ Filtrage free_shipping fonctionnel
- ✅ Jointure optimisée côté serveur
- ✅ Support des variants physiques

**Effort** : 🟡 Moyen (2-3h)

---

## 📊 IMPACT ATTENDU

### Performance

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| **Temps de recherche** | ~2-3s | ~0.5-1s | -60-70% |
| **Données transférées** | ~500KB | ~100KB | -80% |
| **Requêtes DB** | 1 + filtrage client | 1 RPC | Optimisé |

### Expérience Utilisateur

- ✅ Recherche plus rapide
- ✅ Moins de latence
- ✅ Meilleure réactivité

---

## 🎯 PLAN D'IMPLÉMENTATION

### Phase 1 : Fonction RPC de base (2h)
- [ ] Créer migration SQL avec fonction RPC
- [ ] Tester la fonction RPC directement
- [ ] Vérifier les performances

### Phase 2 : Intégration hook (1h)
- [ ] Modifier `useMarketplaceProducts.ts`
- [ ] Remplacer requête Supabase par RPC
- [ ] Tester les filtres

### Phase 3 : Support variants (2h)
- [ ] Étendre fonction RPC pour variants
- [ ] Ajouter filtre free_shipping
- [ ] Tests complets

### Phase 4 : Tests et validation (1h)
- [ ] Tests unitaires
- [ ] Tests E2E
- [ ] Validation performance

---

## 📝 NOTES

- Les fonctions RPC Supabase sont plus performantes que les requêtes client
- Le filtrage côté serveur réduit la charge réseau
- Les index DB peuvent être optimisés pour ces requêtes
- Compatible avec RLS (Row Level Security)

---

**Statut** : 📋 Documentation complète  
**Prochaine étape** : Implémenter Phase 1

## Documentation des TODO Performance

**Date** : 2025-01-30  
**Statut** : 📋 Documentation et recommandations

---

## 📋 TODO IDENTIFIÉS

### 1. `src/pages/Marketplace.tsx:384`
**TODO** : Optimiser avec des fonctions RPC pour filtrer côté serveur

**Contexte** :
```typescript
// Filtres spécifiques par type de produit
// Note: Les filtres sur les relations (digital_products, service_products, etc.)
// seront appliqués côté client après récupération des données
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```

**Impact** : Performance recherche produits dégradée avec beaucoup de produits

**Solution Recommandée** :

#### Créer une fonction RPC Supabase

```sql
-- supabase/migrations/YYYYMMDD_filter_marketplace_products.sql
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  p_product_type TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_stock_availability TEXT DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  store_id UUID,
  name TEXT,
  slug TEXT,
  price NUMERIC,
  currency TEXT,
  image_url TEXT,
  category TEXT,
  product_type TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  is_active BOOLEAN,
  stock_quantity INTEGER,
  stock_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.store_id,
    p.name,
    p.slug,
    p.price,
    p.currency,
    p.image_url,
    p.category,
    p.product_type,
    p.rating,
    p.reviews_count,
    p.is_active,
    p.stock_quantity,
    p.stock_status
  FROM products p
  WHERE p.is_active = true
    AND (p_product_type IS NULL OR p.product_type = p_product_type)
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_stock_availability IS NULL OR 
         (p_stock_availability = 'in_stock' AND (p.stock_quantity > 0 OR p.stock_quantity IS NULL)) OR
         (p_stock_availability = 'out_of_stock' AND p.stock_quantity = 0))
    AND (p_search_term IS NULL OR 
         p.name ILIKE '%' || p_search_term || '%' OR
         p.description ILIKE '%' || p_search_term || '%')
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Utiliser la fonction RPC dans le hook

```typescript
// src/hooks/useMarketplaceProducts.ts
const { data, error } = await supabase.rpc('filter_marketplace_products', {
  p_product_type: filters.productType || null,
  p_category: filters.category || null,
  p_min_price: filters.minPrice || null,
  p_max_price: filters.maxPrice || null,
  p_stock_availability: filters.stockAvailability || null,
  p_search_term: filters.search || null,
  p_limit: pageSize,
  p_offset: (page - 1) * pageSize,
});
```

**Bénéfices** :
- ✅ Filtrage côté serveur (plus rapide)
- ✅ Moins de données transférées
- ✅ Meilleure performance avec beaucoup de produits
- ✅ Indexation DB optimale

**Effort** : 🟡 Moyen (2-3h)

---

### 2. `src/hooks/useMarketplaceProducts.ts:220`
**TODO** : Implémenter le filtre via jointure avec physical_product_variants si nécessaire

**Contexte** :
```typescript
// Note: free_shipping n'existe pas dans la table products
// Ce filtre doit être appliqué via une jointure avec physical_product_variants si nécessaire
// Pour l'instant, on ignore ce filtre côté serveur
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```

**Impact** : Filtrage variants incomplet

**Solution Recommandée** :

#### Étendre la fonction RPC pour inclure les variants

```sql
-- Ajouter le paramètre free_shipping à la fonction RPC
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  -- ... paramètres existants ...
  p_free_shipping BOOLEAN DEFAULT NULL
)
RETURNS TABLE (...) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    -- ... autres colonnes ...
  FROM products p
  LEFT JOIN physical_product_variants ppv ON ppv.product_id = p.id
  WHERE p.is_active = true
    -- ... autres conditions ...
    AND (p_free_shipping IS NULL OR 
         (p_free_shipping = true AND ppv.free_shipping = true) OR
         (p_free_shipping = false AND (ppv.free_shipping = false OR ppv.free_shipping IS NULL)))
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Bénéfices** :
- ✅ Filtrage free_shipping fonctionnel
- ✅ Jointure optimisée côté serveur
- ✅ Support des variants physiques

**Effort** : 🟡 Moyen (2-3h)

---

## 📊 IMPACT ATTENDU

### Performance

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| **Temps de recherche** | ~2-3s | ~0.5-1s | -60-70% |
| **Données transférées** | ~500KB | ~100KB | -80% |
| **Requêtes DB** | 1 + filtrage client | 1 RPC | Optimisé |

### Expérience Utilisateur

- ✅ Recherche plus rapide
- ✅ Moins de latence
- ✅ Meilleure réactivité

---

## 🎯 PLAN D'IMPLÉMENTATION

### Phase 1 : Fonction RPC de base (2h)
- [ ] Créer migration SQL avec fonction RPC
- [ ] Tester la fonction RPC directement
- [ ] Vérifier les performances

### Phase 2 : Intégration hook (1h)
- [ ] Modifier `useMarketplaceProducts.ts`
- [ ] Remplacer requête Supabase par RPC
- [ ] Tester les filtres

### Phase 3 : Support variants (2h)
- [ ] Étendre fonction RPC pour variants
- [ ] Ajouter filtre free_shipping
- [ ] Tests complets

### Phase 4 : Tests et validation (1h)
- [ ] Tests unitaires
- [ ] Tests E2E
- [ ] Validation performance

---

## 📝 NOTES

- Les fonctions RPC Supabase sont plus performantes que les requêtes client
- Le filtrage côté serveur réduit la charge réseau
- Les index DB peuvent être optimisés pour ces requêtes
- Compatible avec RLS (Row Level Security)

---

**Statut** : 📋 Documentation complète  
**Prochaine étape** : Implémenter Phase 1

## Documentation des TODO Performance

**Date** : 2025-01-30  
**Statut** : 📋 Documentation et recommandations

---

## 📋 TODO IDENTIFIÉS

### 1. `src/pages/Marketplace.tsx:384`
**TODO** : Optimiser avec des fonctions RPC pour filtrer côté serveur

**Contexte** :
```typescript
// Filtres spécifiques par type de produit
// Note: Les filtres sur les relations (digital_products, service_products, etc.)
// seront appliqués côté client après récupération des données
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```

**Impact** : Performance recherche produits dégradée avec beaucoup de produits

**Solution Recommandée** :

#### Créer une fonction RPC Supabase

```sql
-- supabase/migrations/YYYYMMDD_filter_marketplace_products.sql
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  p_product_type TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_stock_availability TEXT DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  store_id UUID,
  name TEXT,
  slug TEXT,
  price NUMERIC,
  currency TEXT,
  image_url TEXT,
  category TEXT,
  product_type TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  is_active BOOLEAN,
  stock_quantity INTEGER,
  stock_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.store_id,
    p.name,
    p.slug,
    p.price,
    p.currency,
    p.image_url,
    p.category,
    p.product_type,
    p.rating,
    p.reviews_count,
    p.is_active,
    p.stock_quantity,
    p.stock_status
  FROM products p
  WHERE p.is_active = true
    AND (p_product_type IS NULL OR p.product_type = p_product_type)
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_stock_availability IS NULL OR 
         (p_stock_availability = 'in_stock' AND (p.stock_quantity > 0 OR p.stock_quantity IS NULL)) OR
         (p_stock_availability = 'out_of_stock' AND p.stock_quantity = 0))
    AND (p_search_term IS NULL OR 
         p.name ILIKE '%' || p_search_term || '%' OR
         p.description ILIKE '%' || p_search_term || '%')
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Utiliser la fonction RPC dans le hook

```typescript
// src/hooks/useMarketplaceProducts.ts
const { data, error } = await supabase.rpc('filter_marketplace_products', {
  p_product_type: filters.productType || null,
  p_category: filters.category || null,
  p_min_price: filters.minPrice || null,
  p_max_price: filters.maxPrice || null,
  p_stock_availability: filters.stockAvailability || null,
  p_search_term: filters.search || null,
  p_limit: pageSize,
  p_offset: (page - 1) * pageSize,
});
```

**Bénéfices** :
- ✅ Filtrage côté serveur (plus rapide)
- ✅ Moins de données transférées
- ✅ Meilleure performance avec beaucoup de produits
- ✅ Indexation DB optimale

**Effort** : 🟡 Moyen (2-3h)

---

### 2. `src/hooks/useMarketplaceProducts.ts:220`
**TODO** : Implémenter le filtre via jointure avec physical_product_variants si nécessaire

**Contexte** :
```typescript
// Note: free_shipping n'existe pas dans la table products
// Ce filtre doit être appliqué via une jointure avec physical_product_variants si nécessaire
// Pour l'instant, on ignore ce filtre côté serveur
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```

**Impact** : Filtrage variants incomplet

**Solution Recommandée** :

#### Étendre la fonction RPC pour inclure les variants

```sql
-- Ajouter le paramètre free_shipping à la fonction RPC
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  -- ... paramètres existants ...
  p_free_shipping BOOLEAN DEFAULT NULL
)
RETURNS TABLE (...) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    -- ... autres colonnes ...
  FROM products p
  LEFT JOIN physical_product_variants ppv ON ppv.product_id = p.id
  WHERE p.is_active = true
    -- ... autres conditions ...
    AND (p_free_shipping IS NULL OR 
         (p_free_shipping = true AND ppv.free_shipping = true) OR
         (p_free_shipping = false AND (ppv.free_shipping = false OR ppv.free_shipping IS NULL)))
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Bénéfices** :
- ✅ Filtrage free_shipping fonctionnel
- ✅ Jointure optimisée côté serveur
- ✅ Support des variants physiques

**Effort** : 🟡 Moyen (2-3h)

---

## 📊 IMPACT ATTENDU

### Performance

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| **Temps de recherche** | ~2-3s | ~0.5-1s | -60-70% |
| **Données transférées** | ~500KB | ~100KB | -80% |
| **Requêtes DB** | 1 + filtrage client | 1 RPC | Optimisé |

### Expérience Utilisateur

- ✅ Recherche plus rapide
- ✅ Moins de latence
- ✅ Meilleure réactivité

---

## 🎯 PLAN D'IMPLÉMENTATION

### Phase 1 : Fonction RPC de base (2h)
- [ ] Créer migration SQL avec fonction RPC
- [ ] Tester la fonction RPC directement
- [ ] Vérifier les performances

### Phase 2 : Intégration hook (1h)
- [ ] Modifier `useMarketplaceProducts.ts`
- [ ] Remplacer requête Supabase par RPC
- [ ] Tester les filtres

### Phase 3 : Support variants (2h)
- [ ] Étendre fonction RPC pour variants
- [ ] Ajouter filtre free_shipping
- [ ] Tests complets

### Phase 4 : Tests et validation (1h)
- [ ] Tests unitaires
- [ ] Tests E2E
- [ ] Validation performance

---

## 📝 NOTES

- Les fonctions RPC Supabase sont plus performantes que les requêtes client
- Le filtrage côté serveur réduit la charge réseau
- Les index DB peuvent être optimisés pour ces requêtes
- Compatible avec RLS (Row Level Security)

---

**Statut** : 📋 Documentation complète  
**Prochaine étape** : Implémenter Phase 1

## Documentation des TODO Performance

**Date** : 2025-01-30  
**Statut** : 📋 Documentation et recommandations

---

## 📋 TODO IDENTIFIÉS

### 1. `src/pages/Marketplace.tsx:384`
**TODO** : Optimiser avec des fonctions RPC pour filtrer côté serveur

**Contexte** :
```typescript
// Filtres spécifiques par type de produit
// Note: Les filtres sur les relations (digital_products, service_products, etc.)
// seront appliqués côté client après récupération des données
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```

**Impact** : Performance recherche produits dégradée avec beaucoup de produits

**Solution Recommandée** :

#### Créer une fonction RPC Supabase

```sql
-- supabase/migrations/YYYYMMDD_filter_marketplace_products.sql
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  p_product_type TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_stock_availability TEXT DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  store_id UUID,
  name TEXT,
  slug TEXT,
  price NUMERIC,
  currency TEXT,
  image_url TEXT,
  category TEXT,
  product_type TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  is_active BOOLEAN,
  stock_quantity INTEGER,
  stock_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.store_id,
    p.name,
    p.slug,
    p.price,
    p.currency,
    p.image_url,
    p.category,
    p.product_type,
    p.rating,
    p.reviews_count,
    p.is_active,
    p.stock_quantity,
    p.stock_status
  FROM products p
  WHERE p.is_active = true
    AND (p_product_type IS NULL OR p.product_type = p_product_type)
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_stock_availability IS NULL OR 
         (p_stock_availability = 'in_stock' AND (p.stock_quantity > 0 OR p.stock_quantity IS NULL)) OR
         (p_stock_availability = 'out_of_stock' AND p.stock_quantity = 0))
    AND (p_search_term IS NULL OR 
         p.name ILIKE '%' || p_search_term || '%' OR
         p.description ILIKE '%' || p_search_term || '%')
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Utiliser la fonction RPC dans le hook

```typescript
// src/hooks/useMarketplaceProducts.ts
const { data, error } = await supabase.rpc('filter_marketplace_products', {
  p_product_type: filters.productType || null,
  p_category: filters.category || null,
  p_min_price: filters.minPrice || null,
  p_max_price: filters.maxPrice || null,
  p_stock_availability: filters.stockAvailability || null,
  p_search_term: filters.search || null,
  p_limit: pageSize,
  p_offset: (page - 1) * pageSize,
});
```

**Bénéfices** :
- ✅ Filtrage côté serveur (plus rapide)
- ✅ Moins de données transférées
- ✅ Meilleure performance avec beaucoup de produits
- ✅ Indexation DB optimale

**Effort** : 🟡 Moyen (2-3h)

---

### 2. `src/hooks/useMarketplaceProducts.ts:220`
**TODO** : Implémenter le filtre via jointure avec physical_product_variants si nécessaire

**Contexte** :
```typescript
// Note: free_shipping n'existe pas dans la table products
// Ce filtre doit être appliqué via une jointure avec physical_product_variants si nécessaire
// Pour l'instant, on ignore ce filtre côté serveur
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```

**Impact** : Filtrage variants incomplet

**Solution Recommandée** :

#### Étendre la fonction RPC pour inclure les variants

```sql
-- Ajouter le paramètre free_shipping à la fonction RPC
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  -- ... paramètres existants ...
  p_free_shipping BOOLEAN DEFAULT NULL
)
RETURNS TABLE (...) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    -- ... autres colonnes ...
  FROM products p
  LEFT JOIN physical_product_variants ppv ON ppv.product_id = p.id
  WHERE p.is_active = true
    -- ... autres conditions ...
    AND (p_free_shipping IS NULL OR 
         (p_free_shipping = true AND ppv.free_shipping = true) OR
         (p_free_shipping = false AND (ppv.free_shipping = false OR ppv.free_shipping IS NULL)))
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Bénéfices** :
- ✅ Filtrage free_shipping fonctionnel
- ✅ Jointure optimisée côté serveur
- ✅ Support des variants physiques

**Effort** : 🟡 Moyen (2-3h)

---

## 📊 IMPACT ATTENDU

### Performance

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| **Temps de recherche** | ~2-3s | ~0.5-1s | -60-70% |
| **Données transférées** | ~500KB | ~100KB | -80% |
| **Requêtes DB** | 1 + filtrage client | 1 RPC | Optimisé |

### Expérience Utilisateur

- ✅ Recherche plus rapide
- ✅ Moins de latence
- ✅ Meilleure réactivité

---

## 🎯 PLAN D'IMPLÉMENTATION

### Phase 1 : Fonction RPC de base (2h)
- [ ] Créer migration SQL avec fonction RPC
- [ ] Tester la fonction RPC directement
- [ ] Vérifier les performances

### Phase 2 : Intégration hook (1h)
- [ ] Modifier `useMarketplaceProducts.ts`
- [ ] Remplacer requête Supabase par RPC
- [ ] Tester les filtres

### Phase 3 : Support variants (2h)
- [ ] Étendre fonction RPC pour variants
- [ ] Ajouter filtre free_shipping
- [ ] Tests complets

### Phase 4 : Tests et validation (1h)
- [ ] Tests unitaires
- [ ] Tests E2E
- [ ] Validation performance

---

## 📝 NOTES

- Les fonctions RPC Supabase sont plus performantes que les requêtes client
- Le filtrage côté serveur réduit la charge réseau
- Les index DB peuvent être optimisés pour ces requêtes
- Compatible avec RLS (Row Level Security)

---

**Statut** : 📋 Documentation complète  
**Prochaine étape** : Implémenter Phase 1

## Documentation des TODO Performance

**Date** : 2025-01-30  
**Statut** : 📋 Documentation et recommandations

---

## 📋 TODO IDENTIFIÉS

### 1. `src/pages/Marketplace.tsx:384`
**TODO** : Optimiser avec des fonctions RPC pour filtrer côté serveur

**Contexte** :
```typescript
// Filtres spécifiques par type de produit
// Note: Les filtres sur les relations (digital_products, service_products, etc.)
// seront appliqués côté client après récupération des données
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```

**Impact** : Performance recherche produits dégradée avec beaucoup de produits

**Solution Recommandée** :

#### Créer une fonction RPC Supabase

```sql
-- supabase/migrations/YYYYMMDD_filter_marketplace_products.sql
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  p_product_type TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_stock_availability TEXT DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  store_id UUID,
  name TEXT,
  slug TEXT,
  price NUMERIC,
  currency TEXT,
  image_url TEXT,
  category TEXT,
  product_type TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  is_active BOOLEAN,
  stock_quantity INTEGER,
  stock_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.store_id,
    p.name,
    p.slug,
    p.price,
    p.currency,
    p.image_url,
    p.category,
    p.product_type,
    p.rating,
    p.reviews_count,
    p.is_active,
    p.stock_quantity,
    p.stock_status
  FROM products p
  WHERE p.is_active = true
    AND (p_product_type IS NULL OR p.product_type = p_product_type)
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_stock_availability IS NULL OR 
         (p_stock_availability = 'in_stock' AND (p.stock_quantity > 0 OR p.stock_quantity IS NULL)) OR
         (p_stock_availability = 'out_of_stock' AND p.stock_quantity = 0))
    AND (p_search_term IS NULL OR 
         p.name ILIKE '%' || p_search_term || '%' OR
         p.description ILIKE '%' || p_search_term || '%')
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Utiliser la fonction RPC dans le hook

```typescript
// src/hooks/useMarketplaceProducts.ts
const { data, error } = await supabase.rpc('filter_marketplace_products', {
  p_product_type: filters.productType || null,
  p_category: filters.category || null,
  p_min_price: filters.minPrice || null,
  p_max_price: filters.maxPrice || null,
  p_stock_availability: filters.stockAvailability || null,
  p_search_term: filters.search || null,
  p_limit: pageSize,
  p_offset: (page - 1) * pageSize,
});
```

**Bénéfices** :
- ✅ Filtrage côté serveur (plus rapide)
- ✅ Moins de données transférées
- ✅ Meilleure performance avec beaucoup de produits
- ✅ Indexation DB optimale

**Effort** : 🟡 Moyen (2-3h)

---

### 2. `src/hooks/useMarketplaceProducts.ts:220`
**TODO** : Implémenter le filtre via jointure avec physical_product_variants si nécessaire

**Contexte** :
```typescript
// Note: free_shipping n'existe pas dans la table products
// Ce filtre doit être appliqué via une jointure avec physical_product_variants si nécessaire
// Pour l'instant, on ignore ce filtre côté serveur
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```

**Impact** : Filtrage variants incomplet

**Solution Recommandée** :

#### Étendre la fonction RPC pour inclure les variants

```sql
-- Ajouter le paramètre free_shipping à la fonction RPC
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  -- ... paramètres existants ...
  p_free_shipping BOOLEAN DEFAULT NULL
)
RETURNS TABLE (...) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    -- ... autres colonnes ...
  FROM products p
  LEFT JOIN physical_product_variants ppv ON ppv.product_id = p.id
  WHERE p.is_active = true
    -- ... autres conditions ...
    AND (p_free_shipping IS NULL OR 
         (p_free_shipping = true AND ppv.free_shipping = true) OR
         (p_free_shipping = false AND (ppv.free_shipping = false OR ppv.free_shipping IS NULL)))
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Bénéfices** :
- ✅ Filtrage free_shipping fonctionnel
- ✅ Jointure optimisée côté serveur
- ✅ Support des variants physiques

**Effort** : 🟡 Moyen (2-3h)

---

## 📊 IMPACT ATTENDU

### Performance

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| **Temps de recherche** | ~2-3s | ~0.5-1s | -60-70% |
| **Données transférées** | ~500KB | ~100KB | -80% |
| **Requêtes DB** | 1 + filtrage client | 1 RPC | Optimisé |

### Expérience Utilisateur

- ✅ Recherche plus rapide
- ✅ Moins de latence
- ✅ Meilleure réactivité

---

## 🎯 PLAN D'IMPLÉMENTATION

### Phase 1 : Fonction RPC de base (2h)
- [ ] Créer migration SQL avec fonction RPC
- [ ] Tester la fonction RPC directement
- [ ] Vérifier les performances

### Phase 2 : Intégration hook (1h)
- [ ] Modifier `useMarketplaceProducts.ts`
- [ ] Remplacer requête Supabase par RPC
- [ ] Tester les filtres

### Phase 3 : Support variants (2h)
- [ ] Étendre fonction RPC pour variants
- [ ] Ajouter filtre free_shipping
- [ ] Tests complets

### Phase 4 : Tests et validation (1h)
- [ ] Tests unitaires
- [ ] Tests E2E
- [ ] Validation performance

---

## 📝 NOTES

- Les fonctions RPC Supabase sont plus performantes que les requêtes client
- Le filtrage côté serveur réduit la charge réseau
- Les index DB peuvent être optimisés pour ces requêtes
- Compatible avec RLS (Row Level Security)

---

**Statut** : 📋 Documentation complète  
**Prochaine étape** : Implémenter Phase 1

## Documentation des TODO Performance

**Date** : 2025-01-30  
**Statut** : 📋 Documentation et recommandations

---

## 📋 TODO IDENTIFIÉS

### 1. `src/pages/Marketplace.tsx:384`
**TODO** : Optimiser avec des fonctions RPC pour filtrer côté serveur

**Contexte** :
```typescript
// Filtres spécifiques par type de produit
// Note: Les filtres sur les relations (digital_products, service_products, etc.)
// seront appliqués côté client après récupération des données
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```

**Impact** : Performance recherche produits dégradée avec beaucoup de produits

**Solution Recommandée** :

#### Créer une fonction RPC Supabase

```sql
-- supabase/migrations/YYYYMMDD_filter_marketplace_products.sql
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  p_product_type TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_stock_availability TEXT DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  store_id UUID,
  name TEXT,
  slug TEXT,
  price NUMERIC,
  currency TEXT,
  image_url TEXT,
  category TEXT,
  product_type TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  is_active BOOLEAN,
  stock_quantity INTEGER,
  stock_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.store_id,
    p.name,
    p.slug,
    p.price,
    p.currency,
    p.image_url,
    p.category,
    p.product_type,
    p.rating,
    p.reviews_count,
    p.is_active,
    p.stock_quantity,
    p.stock_status
  FROM products p
  WHERE p.is_active = true
    AND (p_product_type IS NULL OR p.product_type = p_product_type)
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_stock_availability IS NULL OR 
         (p_stock_availability = 'in_stock' AND (p.stock_quantity > 0 OR p.stock_quantity IS NULL)) OR
         (p_stock_availability = 'out_of_stock' AND p.stock_quantity = 0))
    AND (p_search_term IS NULL OR 
         p.name ILIKE '%' || p_search_term || '%' OR
         p.description ILIKE '%' || p_search_term || '%')
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Utiliser la fonction RPC dans le hook

```typescript
// src/hooks/useMarketplaceProducts.ts
const { data, error } = await supabase.rpc('filter_marketplace_products', {
  p_product_type: filters.productType || null,
  p_category: filters.category || null,
  p_min_price: filters.minPrice || null,
  p_max_price: filters.maxPrice || null,
  p_stock_availability: filters.stockAvailability || null,
  p_search_term: filters.search || null,
  p_limit: pageSize,
  p_offset: (page - 1) * pageSize,
});
```

**Bénéfices** :
- ✅ Filtrage côté serveur (plus rapide)
- ✅ Moins de données transférées
- ✅ Meilleure performance avec beaucoup de produits
- ✅ Indexation DB optimale

**Effort** : 🟡 Moyen (2-3h)

---

### 2. `src/hooks/useMarketplaceProducts.ts:220`
**TODO** : Implémenter le filtre via jointure avec physical_product_variants si nécessaire

**Contexte** :
```typescript
// Note: free_shipping n'existe pas dans la table products
// Ce filtre doit être appliqué via une jointure avec physical_product_variants si nécessaire
// Pour l'instant, on ignore ce filtre côté serveur
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```

**Impact** : Filtrage variants incomplet

**Solution Recommandée** :

#### Étendre la fonction RPC pour inclure les variants

```sql
-- Ajouter le paramètre free_shipping à la fonction RPC
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  -- ... paramètres existants ...
  p_free_shipping BOOLEAN DEFAULT NULL
)
RETURNS TABLE (...) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    -- ... autres colonnes ...
  FROM products p
  LEFT JOIN physical_product_variants ppv ON ppv.product_id = p.id
  WHERE p.is_active = true
    -- ... autres conditions ...
    AND (p_free_shipping IS NULL OR 
         (p_free_shipping = true AND ppv.free_shipping = true) OR
         (p_free_shipping = false AND (ppv.free_shipping = false OR ppv.free_shipping IS NULL)))
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Bénéfices** :
- ✅ Filtrage free_shipping fonctionnel
- ✅ Jointure optimisée côté serveur
- ✅ Support des variants physiques

**Effort** : 🟡 Moyen (2-3h)

---

## 📊 IMPACT ATTENDU

### Performance

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| **Temps de recherche** | ~2-3s | ~0.5-1s | -60-70% |
| **Données transférées** | ~500KB | ~100KB | -80% |
| **Requêtes DB** | 1 + filtrage client | 1 RPC | Optimisé |

### Expérience Utilisateur

- ✅ Recherche plus rapide
- ✅ Moins de latence
- ✅ Meilleure réactivité

---

## 🎯 PLAN D'IMPLÉMENTATION

### Phase 1 : Fonction RPC de base (2h)
- [ ] Créer migration SQL avec fonction RPC
- [ ] Tester la fonction RPC directement
- [ ] Vérifier les performances

### Phase 2 : Intégration hook (1h)
- [ ] Modifier `useMarketplaceProducts.ts`
- [ ] Remplacer requête Supabase par RPC
- [ ] Tester les filtres

### Phase 3 : Support variants (2h)
- [ ] Étendre fonction RPC pour variants
- [ ] Ajouter filtre free_shipping
- [ ] Tests complets

### Phase 4 : Tests et validation (1h)
- [ ] Tests unitaires
- [ ] Tests E2E
- [ ] Validation performance

---

## 📝 NOTES

- Les fonctions RPC Supabase sont plus performantes que les requêtes client
- Le filtrage côté serveur réduit la charge réseau
- Les index DB peuvent être optimisés pour ces requêtes
- Compatible avec RLS (Row Level Security)

---

**Statut** : 📋 Documentation complète  
**Prochaine étape** : Implémenter Phase 1

## Documentation des TODO Performance

**Date** : 2025-01-30  
**Statut** : 📋 Documentation et recommandations

---

## 📋 TODO IDENTIFIÉS

### 1. `src/pages/Marketplace.tsx:384`
**TODO** : Optimiser avec des fonctions RPC pour filtrer côté serveur

**Contexte** :
```typescript
// Filtres spécifiques par type de produit
// Note: Les filtres sur les relations (digital_products, service_products, etc.)
// seront appliqués côté client après récupération des données
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```

**Impact** : Performance recherche produits dégradée avec beaucoup de produits

**Solution Recommandée** :

#### Créer une fonction RPC Supabase

```sql
-- supabase/migrations/YYYYMMDD_filter_marketplace_products.sql
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  p_product_type TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_stock_availability TEXT DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  store_id UUID,
  name TEXT,
  slug TEXT,
  price NUMERIC,
  currency TEXT,
  image_url TEXT,
  category TEXT,
  product_type TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  is_active BOOLEAN,
  stock_quantity INTEGER,
  stock_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.store_id,
    p.name,
    p.slug,
    p.price,
    p.currency,
    p.image_url,
    p.category,
    p.product_type,
    p.rating,
    p.reviews_count,
    p.is_active,
    p.stock_quantity,
    p.stock_status
  FROM products p
  WHERE p.is_active = true
    AND (p_product_type IS NULL OR p.product_type = p_product_type)
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_stock_availability IS NULL OR 
         (p_stock_availability = 'in_stock' AND (p.stock_quantity > 0 OR p.stock_quantity IS NULL)) OR
         (p_stock_availability = 'out_of_stock' AND p.stock_quantity = 0))
    AND (p_search_term IS NULL OR 
         p.name ILIKE '%' || p_search_term || '%' OR
         p.description ILIKE '%' || p_search_term || '%')
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Utiliser la fonction RPC dans le hook

```typescript
// src/hooks/useMarketplaceProducts.ts
const { data, error } = await supabase.rpc('filter_marketplace_products', {
  p_product_type: filters.productType || null,
  p_category: filters.category || null,
  p_min_price: filters.minPrice || null,
  p_max_price: filters.maxPrice || null,
  p_stock_availability: filters.stockAvailability || null,
  p_search_term: filters.search || null,
  p_limit: pageSize,
  p_offset: (page - 1) * pageSize,
});
```

**Bénéfices** :
- ✅ Filtrage côté serveur (plus rapide)
- ✅ Moins de données transférées
- ✅ Meilleure performance avec beaucoup de produits
- ✅ Indexation DB optimale

**Effort** : 🟡 Moyen (2-3h)

---

### 2. `src/hooks/useMarketplaceProducts.ts:220`
**TODO** : Implémenter le filtre via jointure avec physical_product_variants si nécessaire

**Contexte** :
```typescript
// Note: free_shipping n'existe pas dans la table products
// Ce filtre doit être appliqué via une jointure avec physical_product_variants si nécessaire
// Pour l'instant, on ignore ce filtre côté serveur
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```

**Impact** : Filtrage variants incomplet

**Solution Recommandée** :

#### Étendre la fonction RPC pour inclure les variants

```sql
-- Ajouter le paramètre free_shipping à la fonction RPC
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  -- ... paramètres existants ...
  p_free_shipping BOOLEAN DEFAULT NULL
)
RETURNS TABLE (...) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    -- ... autres colonnes ...
  FROM products p
  LEFT JOIN physical_product_variants ppv ON ppv.product_id = p.id
  WHERE p.is_active = true
    -- ... autres conditions ...
    AND (p_free_shipping IS NULL OR 
         (p_free_shipping = true AND ppv.free_shipping = true) OR
         (p_free_shipping = false AND (ppv.free_shipping = false OR ppv.free_shipping IS NULL)))
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Bénéfices** :
- ✅ Filtrage free_shipping fonctionnel
- ✅ Jointure optimisée côté serveur
- ✅ Support des variants physiques

**Effort** : 🟡 Moyen (2-3h)

---

## 📊 IMPACT ATTENDU

### Performance

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| **Temps de recherche** | ~2-3s | ~0.5-1s | -60-70% |
| **Données transférées** | ~500KB | ~100KB | -80% |
| **Requêtes DB** | 1 + filtrage client | 1 RPC | Optimisé |

### Expérience Utilisateur

- ✅ Recherche plus rapide
- ✅ Moins de latence
- ✅ Meilleure réactivité

---

## 🎯 PLAN D'IMPLÉMENTATION

### Phase 1 : Fonction RPC de base (2h)
- [ ] Créer migration SQL avec fonction RPC
- [ ] Tester la fonction RPC directement
- [ ] Vérifier les performances

### Phase 2 : Intégration hook (1h)
- [ ] Modifier `useMarketplaceProducts.ts`
- [ ] Remplacer requête Supabase par RPC
- [ ] Tester les filtres

### Phase 3 : Support variants (2h)
- [ ] Étendre fonction RPC pour variants
- [ ] Ajouter filtre free_shipping
- [ ] Tests complets

### Phase 4 : Tests et validation (1h)
- [ ] Tests unitaires
- [ ] Tests E2E
- [ ] Validation performance

---

## 📝 NOTES

- Les fonctions RPC Supabase sont plus performantes que les requêtes client
- Le filtrage côté serveur réduit la charge réseau
- Les index DB peuvent être optimisés pour ces requêtes
- Compatible avec RLS (Row Level Security)

---

**Statut** : 📋 Documentation complète  
**Prochaine étape** : Implémenter Phase 1

## Documentation des TODO Performance

**Date** : 2025-01-30  
**Statut** : 📋 Documentation et recommandations

---

## 📋 TODO IDENTIFIÉS

### 1. `src/pages/Marketplace.tsx:384`
**TODO** : Optimiser avec des fonctions RPC pour filtrer côté serveur

**Contexte** :
```typescript
// Filtres spécifiques par type de produit
// Note: Les filtres sur les relations (digital_products, service_products, etc.)
// seront appliqués côté client après récupération des données
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```

**Impact** : Performance recherche produits dégradée avec beaucoup de produits

**Solution Recommandée** :

#### Créer une fonction RPC Supabase

```sql
-- supabase/migrations/YYYYMMDD_filter_marketplace_products.sql
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  p_product_type TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_stock_availability TEXT DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  store_id UUID,
  name TEXT,
  slug TEXT,
  price NUMERIC,
  currency TEXT,
  image_url TEXT,
  category TEXT,
  product_type TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  is_active BOOLEAN,
  stock_quantity INTEGER,
  stock_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.store_id,
    p.name,
    p.slug,
    p.price,
    p.currency,
    p.image_url,
    p.category,
    p.product_type,
    p.rating,
    p.reviews_count,
    p.is_active,
    p.stock_quantity,
    p.stock_status
  FROM products p
  WHERE p.is_active = true
    AND (p_product_type IS NULL OR p.product_type = p_product_type)
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_stock_availability IS NULL OR 
         (p_stock_availability = 'in_stock' AND (p.stock_quantity > 0 OR p.stock_quantity IS NULL)) OR
         (p_stock_availability = 'out_of_stock' AND p.stock_quantity = 0))
    AND (p_search_term IS NULL OR 
         p.name ILIKE '%' || p_search_term || '%' OR
         p.description ILIKE '%' || p_search_term || '%')
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Utiliser la fonction RPC dans le hook

```typescript
// src/hooks/useMarketplaceProducts.ts
const { data, error } = await supabase.rpc('filter_marketplace_products', {
  p_product_type: filters.productType || null,
  p_category: filters.category || null,
  p_min_price: filters.minPrice || null,
  p_max_price: filters.maxPrice || null,
  p_stock_availability: filters.stockAvailability || null,
  p_search_term: filters.search || null,
  p_limit: pageSize,
  p_offset: (page - 1) * pageSize,
});
```

**Bénéfices** :
- ✅ Filtrage côté serveur (plus rapide)
- ✅ Moins de données transférées
- ✅ Meilleure performance avec beaucoup de produits
- ✅ Indexation DB optimale

**Effort** : 🟡 Moyen (2-3h)

---

### 2. `src/hooks/useMarketplaceProducts.ts:220`
**TODO** : Implémenter le filtre via jointure avec physical_product_variants si nécessaire

**Contexte** :
```typescript
// Note: free_shipping n'existe pas dans la table products
// Ce filtre doit être appliqué via une jointure avec physical_product_variants si nécessaire
// Pour l'instant, on ignore ce filtre côté serveur
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```

**Impact** : Filtrage variants incomplet

**Solution Recommandée** :

#### Étendre la fonction RPC pour inclure les variants

```sql
-- Ajouter le paramètre free_shipping à la fonction RPC
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  -- ... paramètres existants ...
  p_free_shipping BOOLEAN DEFAULT NULL
)
RETURNS TABLE (...) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    -- ... autres colonnes ...
  FROM products p
  LEFT JOIN physical_product_variants ppv ON ppv.product_id = p.id
  WHERE p.is_active = true
    -- ... autres conditions ...
    AND (p_free_shipping IS NULL OR 
         (p_free_shipping = true AND ppv.free_shipping = true) OR
         (p_free_shipping = false AND (ppv.free_shipping = false OR ppv.free_shipping IS NULL)))
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Bénéfices** :
- ✅ Filtrage free_shipping fonctionnel
- ✅ Jointure optimisée côté serveur
- ✅ Support des variants physiques

**Effort** : 🟡 Moyen (2-3h)

---

## 📊 IMPACT ATTENDU

### Performance

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| **Temps de recherche** | ~2-3s | ~0.5-1s | -60-70% |
| **Données transférées** | ~500KB | ~100KB | -80% |
| **Requêtes DB** | 1 + filtrage client | 1 RPC | Optimisé |

### Expérience Utilisateur

- ✅ Recherche plus rapide
- ✅ Moins de latence
- ✅ Meilleure réactivité

---

## 🎯 PLAN D'IMPLÉMENTATION

### Phase 1 : Fonction RPC de base (2h)
- [ ] Créer migration SQL avec fonction RPC
- [ ] Tester la fonction RPC directement
- [ ] Vérifier les performances

### Phase 2 : Intégration hook (1h)
- [ ] Modifier `useMarketplaceProducts.ts`
- [ ] Remplacer requête Supabase par RPC
- [ ] Tester les filtres

### Phase 3 : Support variants (2h)
- [ ] Étendre fonction RPC pour variants
- [ ] Ajouter filtre free_shipping
- [ ] Tests complets

### Phase 4 : Tests et validation (1h)
- [ ] Tests unitaires
- [ ] Tests E2E
- [ ] Validation performance

---

## 📝 NOTES

- Les fonctions RPC Supabase sont plus performantes que les requêtes client
- Le filtrage côté serveur réduit la charge réseau
- Les index DB peuvent être optimisés pour ces requêtes
- Compatible avec RLS (Row Level Security)

---

**Statut** : 📋 Documentation complète  
**Prochaine étape** : Implémenter Phase 1

## Documentation des TODO Performance

**Date** : 2025-01-30  
**Statut** : 📋 Documentation et recommandations

---

## 📋 TODO IDENTIFIÉS

### 1. `src/pages/Marketplace.tsx:384`
**TODO** : Optimiser avec des fonctions RPC pour filtrer côté serveur

**Contexte** :
```typescript
// Filtres spécifiques par type de produit
// Note: Les filtres sur les relations (digital_products, service_products, etc.)
// seront appliqués côté client après récupération des données
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```

**Impact** : Performance recherche produits dégradée avec beaucoup de produits

**Solution Recommandée** :

#### Créer une fonction RPC Supabase

```sql
-- supabase/migrations/YYYYMMDD_filter_marketplace_products.sql
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  p_product_type TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_stock_availability TEXT DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  store_id UUID,
  name TEXT,
  slug TEXT,
  price NUMERIC,
  currency TEXT,
  image_url TEXT,
  category TEXT,
  product_type TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  is_active BOOLEAN,
  stock_quantity INTEGER,
  stock_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.store_id,
    p.name,
    p.slug,
    p.price,
    p.currency,
    p.image_url,
    p.category,
    p.product_type,
    p.rating,
    p.reviews_count,
    p.is_active,
    p.stock_quantity,
    p.stock_status
  FROM products p
  WHERE p.is_active = true
    AND (p_product_type IS NULL OR p.product_type = p_product_type)
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_stock_availability IS NULL OR 
         (p_stock_availability = 'in_stock' AND (p.stock_quantity > 0 OR p.stock_quantity IS NULL)) OR
         (p_stock_availability = 'out_of_stock' AND p.stock_quantity = 0))
    AND (p_search_term IS NULL OR 
         p.name ILIKE '%' || p_search_term || '%' OR
         p.description ILIKE '%' || p_search_term || '%')
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Utiliser la fonction RPC dans le hook

```typescript
// src/hooks/useMarketplaceProducts.ts
const { data, error } = await supabase.rpc('filter_marketplace_products', {
  p_product_type: filters.productType || null,
  p_category: filters.category || null,
  p_min_price: filters.minPrice || null,
  p_max_price: filters.maxPrice || null,
  p_stock_availability: filters.stockAvailability || null,
  p_search_term: filters.search || null,
  p_limit: pageSize,
  p_offset: (page - 1) * pageSize,
});
```

**Bénéfices** :
- ✅ Filtrage côté serveur (plus rapide)
- ✅ Moins de données transférées
- ✅ Meilleure performance avec beaucoup de produits
- ✅ Indexation DB optimale

**Effort** : 🟡 Moyen (2-3h)

---

### 2. `src/hooks/useMarketplaceProducts.ts:220`
**TODO** : Implémenter le filtre via jointure avec physical_product_variants si nécessaire

**Contexte** :
```typescript
// Note: free_shipping n'existe pas dans la table products
// Ce filtre doit être appliqué via une jointure avec physical_product_variants si nécessaire
// Pour l'instant, on ignore ce filtre côté serveur
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```

**Impact** : Filtrage variants incomplet

**Solution Recommandée** :

#### Étendre la fonction RPC pour inclure les variants

```sql
-- Ajouter le paramètre free_shipping à la fonction RPC
CREATE OR REPLACE FUNCTION filter_marketplace_products(
  -- ... paramètres existants ...
  p_free_shipping BOOLEAN DEFAULT NULL
)
RETURNS TABLE (...) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    -- ... autres colonnes ...
  FROM products p
  LEFT JOIN physical_product_variants ppv ON ppv.product_id = p.id
  WHERE p.is_active = true
    -- ... autres conditions ...
    AND (p_free_shipping IS NULL OR 
         (p_free_shipping = true AND ppv.free_shipping = true) OR
         (p_free_shipping = false AND (ppv.free_shipping = false OR ppv.free_shipping IS NULL)))
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Bénéfices** :
- ✅ Filtrage free_shipping fonctionnel
- ✅ Jointure optimisée côté serveur
- ✅ Support des variants physiques

**Effort** : 🟡 Moyen (2-3h)

---

## 📊 IMPACT ATTENDU

### Performance

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| **Temps de recherche** | ~2-3s | ~0.5-1s | -60-70% |
| **Données transférées** | ~500KB | ~100KB | -80% |
| **Requêtes DB** | 1 + filtrage client | 1 RPC | Optimisé |

### Expérience Utilisateur

- ✅ Recherche plus rapide
- ✅ Moins de latence
- ✅ Meilleure réactivité

---

## 🎯 PLAN D'IMPLÉMENTATION

### Phase 1 : Fonction RPC de base (2h)
- [ ] Créer migration SQL avec fonction RPC
- [ ] Tester la fonction RPC directement
- [ ] Vérifier les performances

### Phase 2 : Intégration hook (1h)
- [ ] Modifier `useMarketplaceProducts.ts`
- [ ] Remplacer requête Supabase par RPC
- [ ] Tester les filtres

### Phase 3 : Support variants (2h)
- [ ] Étendre fonction RPC pour variants
- [ ] Ajouter filtre free_shipping
- [ ] Tests complets

### Phase 4 : Tests et validation (1h)
- [ ] Tests unitaires
- [ ] Tests E2E
- [ ] Validation performance

---

## 📝 NOTES

- Les fonctions RPC Supabase sont plus performantes que les requêtes client
- Le filtrage côté serveur réduit la charge réseau
- Les index DB peuvent être optimisés pour ces requêtes
- Compatible avec RLS (Row Level Security)

---

**Statut** : 📋 Documentation complète  
**Prochaine étape** : Implémenter Phase 1


