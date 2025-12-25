# Audit Complet - Logos de Boutiques sur les Cartes Produits

## Date: 2025-02-02

## Résumé Exécutif

Cet audit vérifie que toutes les cartes produits du marketplace importent et affichent correctement les logos de boutiques.

## État Actuel

### ✅ Cartes qui fonctionnent correctement

1. **ProductCardModern.tsx** (ligne 438-460)
   - ✅ Utilise `product.stores.logo_url`
   - ✅ Affiche le logo avec `LazyImage`
   - ✅ Fallback avec icône Store si pas de logo

2. **ProductCardProfessional.tsx** (ligne 358-385)
   - ✅ Utilise `product.stores.logo_url`
   - ✅ Affiche le logo avec `<img>`
   - ✅ Fallback avec icône Store si pas de logo

3. **UnifiedProductCard.tsx** (ligne 300-324)
   - ✅ Utilise `product.store.logo_url`
   - ✅ Affiche le logo avec `OptimizedImage`
   - ✅ Fallback avec icône Store si pas de logo

4. **CourseProductCard.tsx** (ligne 255-276)
   - ✅ Utilise `product.store.logo_url` (conditionné par `variant === 'marketplace'`)
   - ✅ Affiche le logo avec `<img>`
   - ✅ Fallback avec icône Store si pas de logo

5. **PhysicalProductCard.tsx** (ligne 269-290)
   - ✅ Utilise `product.store.logo_url` (conditionné par `variant === 'marketplace'`)
   - ✅ Affiche le logo avec `<img>`
   - ✅ Fallback avec icône Store si pas de logo

6. **ServiceProductCard.tsx** (ligne 246-267)
   - ✅ Utilise `product.store.logo_url` (conditionné par `variant === 'marketplace'`)
   - ✅ Affiche le logo avec `<img>`
   - ✅ Fallback avec icône Store si pas de logo

7. **ArtistProductCard.tsx** (ligne 312-333)
   - ✅ Utilise `product.store.logo_url` (conditionné par `variant === 'marketplace'`)
   - ✅ Affiche le logo avec `<img>`
   - ✅ Fallback avec icône Store si pas de logo

### ⚠️ Problème identifié

**ProductCard.tsx** (ligne 284-308)

- ❌ Utilise `useStoreInfo(product.store_id)` au lieu de `product.stores`
- ❌ Fait une requête séparée par produit (N+1 queries)
- ✅ Affiche correctement le logo quand disponible
- ✅ Fallback avec icône Store si pas de logo

## Problèmes à Corriger

### 1. ProductCard.tsx - Requête N+1

**Problème**: Utilise `useStoreInfo` qui fait une requête séparée alors que les données sont déjà disponibles dans `product.stores` via la jointure Supabase.

**Impact**:

- Performance dégradée (N requêtes supplémentaires)
- Latence inutile
- Charge serveur augmentée

**Solution**: Remplacer `useStoreInfo` par `product.stores` qui est déjà inclus dans la requête Marketplace.

### 2. Incohérence dans la structure des données

**Problème**:

- `ProductCard.tsx` et `ProductCardModern.tsx` utilisent `product.stores` (pluriel)
- `UnifiedProductCard.tsx` et les cartes spécialisées utilisent `product.store` (singulier)

**Impact**:

- Risque d'erreurs si la structure change
- Code moins maintenable

**Note**: Supabase retourne `stores` comme un objet ou un tableau selon la jointure. Il faut normaliser.

## Recommandations

1. ✅ Corriger `ProductCard.tsx` pour utiliser `product.stores` au lieu de `useStoreInfo`
2. ✅ Uniformiser l'affichage des logos (même composant/image optimisé)
3. ✅ Ajouter des attributs `loading="lazy"` et `decoding="async"` pour performance
4. ✅ Vérifier que toutes les cartes affichent le logo en mode marketplace

## Données Disponibles

Dans `Marketplace.tsx`, les produits sont récupérés avec:

```typescript
stores!inner (
  id,
  name,
  slug,
  logo_url,
  created_at
)
```

Donc `product.stores` contient toujours les informations de boutique avec `logo_url`.

## Tests à Effectuer

1. Vérifier que tous les logos s'affichent sur la page Marketplace
2. Vérifier le fallback (icône Store) quand logo_url est null
3. Vérifier les performances (pas de requêtes N+1)
4. Tester sur mobile et desktop
5. Vérifier le mode sombre/clair

