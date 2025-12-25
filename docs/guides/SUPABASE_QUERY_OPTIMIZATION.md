# 🚀 Guide d'Optimisation des Requêtes Supabase

**Date** : Février 2025  
**Objectif** : Optimiser les performances des requêtes Supabase

---

## 📊 INDEXES EXISTANTS

### Table `products`

```sql
-- Indexes déjà créés
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_rating ON products(rating);
CREATE INDEX idx_products_promo_price ON products(promo_price);
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
```

### Table `orders`

```sql
-- Indexes recommandés
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

### Table `customers`

```sql
-- Indexes recommandés
CREATE INDEX idx_customers_store_id ON customers(store_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);
```

---

## 🎯 BONNES PRATIQUES

### 1. Utiliser les Indexes

✅ **BON** :
```typescript
// Utilise l'index idx_products_store_id
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('store_id', storeId)
  .eq('is_active', true);
```

❌ **MAUVAIS** :
```typescript
// Pas d'index sur category, scan complet
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('category', 'ebook');
```

### 2. Pagination Côté Serveur

✅ **BON** :
```typescript
const startIndex = (page - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage - 1;

const { data, count } = await supabase
  .from('products')
  .select('*', { count: 'exact' })
  .eq('store_id', storeId)
  .range(startIndex, endIndex);
```

❌ **MAUVAIS** :
```typescript
// Charge tous les produits
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('store_id', storeId);
```

### 3. Sélectionner Seulement les Colonnes Nécessaires

✅ **BON** :
```typescript
const { data } = await supabase
  .from('products')
  .select('id, name, price, image_url')
  .eq('store_id', storeId);
```

❌ **MAUVAIS** :
```typescript
// Charge toutes les colonnes
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('store_id', storeId);
```

### 4. Utiliser les Jointures Efficacement

✅ **BON** :
```typescript
const { data } = await supabase
  .from('products')
  .select(`
    id,
    name,
    stores!inner(id, name, slug)
  `)
  .eq('stores.is_active', true);
```

❌ **MAUVAIS** :
```typescript
// Charge tous les stores puis filtre côté client
const { data: products } = await supabase.from('products').select('*');
const { data: stores } = await supabase.from('stores').select('*');
```

### 5. Éviter les Requêtes N+1

✅ **BON** :
```typescript
// Une seule requête avec jointure
const { data } = await supabase
  .from('products')
  .select(`
    *,
    stores!inner(*)
  `);
```

❌ **MAUVAIS** :
```typescript
// Requête N+1
const { data: products } = await supabase.from('products').select('*');
for (const product of products) {
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('id', product.store_id)
    .single();
}
```

---

## 🔧 OPTIMISATIONS AVANCÉES

### 1. Utiliser les Fonctions RPC

Pour les requêtes complexes, créer des fonctions RPC :

```sql
CREATE OR REPLACE FUNCTION get_products_optimized(
  p_store_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  price NUMERIC,
  image_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.price,
    p.image_url
  FROM products p
  WHERE p.store_id = p_store_id
    AND p.is_active = true
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
```

Utilisation :
```typescript
const { data } = await supabase.rpc('get_products_optimized', {
  p_store_id: storeId,
  p_limit: 20,
  p_offset: 0
});
```

### 2. Utiliser le Cache React Query

```typescript
const { data } = useQuery({
  queryKey: ['products', storeId],
  queryFn: () => fetchProducts(storeId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
});
```

### 3. Debounce les Recherches

```typescript
const debouncedSearch = useDebounce(searchQuery, 500);

useEffect(() => {
  if (debouncedSearch) {
    fetchProducts(debouncedSearch);
  }
}, [debouncedSearch]);
```

---

## 📈 MÉTRIQUES DE PERFORMANCE

### Objectifs

| Métrique | Cible | Actuel |
|----------|-------|--------|
| Temps de réponse | < 200ms | À mesurer |
| Requêtes par page | < 5 | À mesurer |
| Taille de réponse | < 100 KB | À mesurer |

---

## ✅ CHECKLIST

- [x] Indexes créés sur colonnes fréquemment filtrées
- [x] Pagination côté serveur implémentée
- [x] Sélection de colonnes optimisée
- [x] Jointures efficaces
- [x] Cache React Query configuré
- [x] Debounce sur recherches

---

**Dernière mise à jour** : Février 2025

