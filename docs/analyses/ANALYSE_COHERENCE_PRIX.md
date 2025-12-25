# 🔍 Analyse de Cohérence des Prix - Marketplace vs ProductDetail

## ❌ Problèmes Identifiés

### 1. ProductDetail.tsx - Ligne 393
**Problème :** Affiche toujours `product.price` sans tenir compte de `promotional_price`

```typescript
// ❌ ACTUEL (ligne 393)
{product.price.toLocaleString()}{" "}
{product.currency}
```

**Impact :** Si un produit a un `promotional_price`, il n'est pas affiché dans la page de détail, alors qu'il est affiché dans la carte Marketplace.

### 2. Logique Incohérente

**Marketplace (UnifiedProductCard) :**
- Utilise `getDisplayPrice()` qui retourne `promo_price` si disponible
- Affiche le prix barré si promotion
- Affiche le pourcentage de réduction

**ProductDetail :**
- Affiche toujours `product.price` (ligne 393)
- Utilise `product.promotional_price || product.price` seulement pour PriceStockAlertButton (ligne 531)
- Pas d'affichage du prix barré
- Pas d'affichage du pourcentage de réduction

### 3. Formatage Incohérent

**Marketplace :**
- Utilise `formatPrice()` avec `toLocaleString('fr-FR')`
- Format : `"1 234 FCFA"`

**ProductDetail :**
- Utilise `toLocaleString()` directement
- Format : `"1 234"` + devise séparée
- Incohérent avec le format Marketplace

## ✅ Solution Proposée

### 1. Utiliser les Helpers Unifiés dans ProductDetail

```typescript
import { 
  formatPrice, 
  getDisplayPrice, 
  hasPromotion,
  calculateDiscount 
} from '@/lib/product-helpers';

// Dans le composant
const priceInfo = getDisplayPrice(product);
const hasPromo = hasPromotion(product);
const discount = hasPromo ? calculateDiscount(product.price, product.promo_price) : 0;
```

### 2. Afficher le Prix avec Promotion

```typescript
// Remplacer ligne 392-396
<div className="space-y-2">
  <div className="flex items-baseline gap-3">
    {priceInfo.originalPrice && (
      <span className="text-2xl text-muted-foreground line-through">
        {formatPrice(priceInfo.originalPrice, product.currency)}
      </span>
    )}
    <div className="text-4xl font-bold text-primary">
      {formatPrice(priceInfo.price, product.currency)}
    </div>
    {hasPromo && discount > 0 && (
      <Badge variant="destructive" className="text-sm">
        -{discount}%
      </Badge>
    )}
  </div>
</div>
```

### 3. Utiliser le Même Prix pour les Actions

```typescript
// Ligne 531 - Utiliser priceInfo.price au lieu de product.promotional_price || product.price
currentPrice={selectedVariantPrice || priceInfo.price}
```

## 📊 Comparaison Avant/Après

### Avant
- **Marketplace** : Affiche prix promo si disponible
- **ProductDetail** : Affiche toujours prix normal
- **Incohérence** : Prix différents entre les deux pages

### Après
- **Marketplace** : Affiche prix promo si disponible ✅
- **ProductDetail** : Affiche prix promo si disponible ✅
- **Cohérence** : Même logique, même affichage ✅

