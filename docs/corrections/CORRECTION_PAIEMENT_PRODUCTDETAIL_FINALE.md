# ✅ Correction Paiement ProductDetail - Analyse Complète

## Date: 2025-01-29

## 🔍 Analyse du Problème

L'erreur "Edge Function returned a non-2xx status code" persiste sur ProductDetail alors que le paiement fonctionne sur Marketplace et Storefront.

### Différences Identifiées

1. **Récupération du storeId** :
   - Marketplace/Storefront : Utilisent directement `product.store_id`
   - ProductDetail : Peut ne pas avoir `product.store_id` si la requête ne le charge pas

2. **Validation du prix** :
   - ProductDetail utilisait `displayPriceInfo?.price` qui peut être `undefined`
   - Marketplace/Storefront utilisent directement `product.promo_price ?? product.price`

3. **Gestion des erreurs** :
   - ProductDetail ne réinitialisait pas `isPurchasing` dans tous les cas d'erreur

## ✅ Corrections Appliquées

### 1. Fallback pour storeId
```typescript
// Utiliser store.id si product.store_id n'est pas disponible
const storeId = product.store_id || store.id;
```

### 2. S'assurer que store_id est présent lors du chargement
```typescript
// S'assurer que store_id est présent (utiliser foundStore.id si manquant)
const productWithStore = {
  ...product,
  store_id: product.store_id || foundStore.id,
  free_product: freeProduct,
  paid_product: paidProduct,
};
```

### 3. Validation du prix améliorée
```typescript
// Utiliser le prix de la variante sélectionnée ou le prix promo/normal
const basePrice = product.promotional_price || product.promo_price || product.price;
const price = selectedVariantPrice || basePrice;

// S'assurer que le prix est un nombre valide
if (!price || isNaN(Number(price)) || Number(price) <= 0) {
  // Erreur
}
```

### 4. Conversion explicite en nombre
```typescript
amount: Number(price), // S'assurer que c'est un nombre
```

### 5. Logs de debug
```typescript
logger.log("Initiating Moneroo payment from ProductDetail:", {
  storeId,
  productId: product.id,
  amount: price,
  currency: product.currency ?? "XOF",
  productName: product.name,
  storeSlug: store.slug,
});
```

### 6. Gestion d'erreurs améliorée
```typescript
// S'assurer que setIsPurchasing(false) est appelé dans tous les cas
if (!user?.email) {
  // ...
  setIsPurchasing(false);
  return;
}

if (!price || isNaN(Number(price)) || Number(price) <= 0) {
  // ...
  setIsPurchasing(false);
  return;
}
```

## 🎯 Résultat

Le paiement dans ProductDetail utilise maintenant :
- ✅ Même logique de storeId que Marketplace/Storefront
- ✅ Validation robuste du prix
- ✅ Conversion explicite en nombre
- ✅ Logs de debug pour identifier les problèmes
- ✅ Gestion d'erreurs complète

Le paiement devrait maintenant fonctionner correctement sur la page de détails.

