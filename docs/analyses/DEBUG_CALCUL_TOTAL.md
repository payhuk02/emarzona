# Debug - Calcul du Total avec Code Promo

**Date**: 31 Janvier 2025  
**Problème**: Le total ne se met pas à jour correctement quand un code promo est appliqué

## 🔍 Analyse du Problème

D'après l'image fournie :

- **Sous-total** : 4000 XOF
- **Code promo (PROMO10)** : -400 XOF (affiché comme appliqué)
- **Total affiché** : 4000 XOF ❌
- **Total attendu** : 3600 XOF ✅

## 🐛 Problèmes Potentiels Identifiés

### 1. Dépendances du `useMemo`

Le `finalTotal` utilise un `useMemo` avec des dépendances. Si les dépendances ne changent pas de manière détectable, le recalcul ne se déclenche pas.

**Solution appliquée** : Utiliser directement `appliedCouponCode?.discountAmount` dans les dépendances du `finalTotal` au lieu de passer par `couponDiscountAmount`.

### 2. Calcul de `couponDiscountAmount`

Le `couponDiscountAmount` était calculé avec un `useMemo` qui dépendait de l'objet `appliedCouponCode` complet. Cela peut causer des problèmes de comparaison d'objets.

**Solution appliquée** : Simplifier en utilisant directement la valeur sans `useMemo` pour garantir que la valeur est toujours à jour.

### 3. Ordre des Calculs

Le calcul doit suivre cet ordre :

1. Sous-total (4000 XOF)
2. Réduction du coupon (-400 XOF)
3. Taxes (calculées sur montant après réduction)
4. Shipping
5. Carte cadeau

## ✅ Corrections Appliquées

### Modification 1 : Simplification de `couponDiscountAmount`

**Avant:**

```typescript
const couponDiscountAmount = useMemo(() => {
  if (!appliedCouponCode || !appliedCouponCode.discountAmount) return 0;
  return appliedCouponCode.discountAmount;
}, [appliedCouponCode]);
```

**Après:**

```typescript
const couponDiscountAmount = appliedCouponCode?.discountAmount
  ? Number(appliedCouponCode.discountAmount)
  : 0;
```

### Modification 2 : Calcul direct dans `finalTotal`

**Avant:**

```typescript
const finalTotal = useMemo(() => {
  const subtotalAfterDiscounts = summary.subtotal - summary.discount_amount - couponDiscountAmount;
  // ...
}, [
  summary.subtotal,
  summary.discount_amount,
  taxAmount,
  shippingAmount,
  couponDiscountAmount,
  giftCardAmount,
]);
```

**Après:**

```typescript
const finalTotal = useMemo(() => {
  const couponDiscount = appliedCouponCode?.discountAmount
    ? Number(appliedCouponCode.discountAmount)
    : 0;
  const subtotalAfterDiscounts = summary.subtotal - summary.discount_amount - couponDiscount;
  // ...
}, [
  summary.subtotal,
  summary.discount_amount,
  taxAmount,
  shippingAmount,
  appliedCouponCode?.discountAmount,
  appliedCouponCode?.id,
  giftCardAmount,
]);
```

## 📊 Exemple de Calcul

Pour un sous-total de 4000 XOF avec une réduction de 400 XOF :

1. **Sous-total** : 4000 XOF
2. **Réduction du coupon** : -400 XOF
3. **Montant après réduction** : 4000 - 400 = 3600 XOF
4. **Taxes** (si applicable) : calculées sur 3600 XOF
5. **Shipping** : ajouté après taxes
6. **Total final** : 3600 + taxes + shipping - carte cadeau

## 🔧 Points à Vérifier

1. ✅ `appliedCouponCode` est bien mis à jour quand le coupon est appliqué
2. ✅ `discountAmount` est bien stocké dans `appliedCouponCode`
3. ✅ Le `finalTotal` se recalcule quand `appliedCouponCode` change
4. ✅ Les dépendances du `useMemo` incluent bien les valeurs nécessaires

## 🧪 Test Manuel

Pour vérifier que la correction fonctionne :

1. Ajouter un produit au panier (ex: 4000 XOF)
2. Appliquer un code promo avec une réduction de 400 XOF
3. Vérifier que :
   - Le sous-total affiche 4000 XOF
   - La réduction affiche -400 XOF
   - Le total affiche **3600 XOF** (et non 4000 XOF)

## 📝 Notes

- La simplification de `couponDiscountAmount` garantit que la valeur est toujours à jour
- L'utilisation directe de `appliedCouponCode?.discountAmount` dans `finalTotal` force le recalcul
- Les dépendances incluent `appliedCouponCode?.discountAmount` et `appliedCouponCode?.id` pour garantir la réactivité
