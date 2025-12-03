# Suppression Complète de l'Ancien Système de Coupons

**Date:** 30 Janvier 2025  
**Action:** Suppression complète de l'ancien système de coupons pour éviter les conflits  
**Statut:** ✅ **COMPLÉTÉ**

---

## 🎯 Objectif

Supprimer complètement l'ancien système de coupons (`appliedCoupon` dans `useCart.ts`) pour éviter les conflits avec le nouveau système (`appliedCouponCode` dans `Checkout.tsx`).

---

## 🔍 Problème Identifié

### Conflit entre Deux Systèmes

1. **Ancien système** (`useCart.ts`):
   - `appliedCoupon` chargé depuis localStorage
   - Inclus dans `summary.discount_amount`
   - Utilise `validate_coupon` RPC

2. **Nouveau système** (`Checkout.tsx`):
   - `appliedCouponCode` chargé depuis localStorage
   - Soustrait séparément dans le calcul
   - Utilise `validate_unified_promotion` RPC

**Résultat:** Double application, confusion, et total incorrect.

---

## ✅ Modifications Appliquées

### 1. `src/hooks/cart/useCart.ts`

#### Supprimé:
- ❌ `const [appliedCoupon, setAppliedCoupon] = useState<any>(null);`
- ❌ `useEffect` qui charge le coupon depuis localStorage
- ❌ `const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;`
- ❌ `applyCoupon` mutation
- ❌ `removeCoupon` callback
- ❌ `appliedCoupon` dans le retour du hook

#### Modifié:
```typescript
// AVANT
const summary: CartSummary = {
  subtotal,
  discount_amount: couponDiscount + items.reduce(...), // Incluait le coupon
  // ...
};

// APRÈS
const summary: CartSummary = {
  subtotal,
  discount_amount: itemDiscounts, // Uniquement les remises items
  // ...
};
```

#### Résultat:
- `summary.subtotal` = prix après remises items (sans coupons)
- `summary.discount_amount` = uniquement remises items (sans coupons)
- Plus de conflit avec le nouveau système

---

### 2. `src/pages/Checkout.tsx`

#### Supprimé:
- ❌ `appliedCoupon: appliedCouponLegacy` de la destructuration `useCart()`
- ❌ Vérification `if (appliedCouponLegacy)` dans le useEffect
- ❌ Code d'enregistrement du coupon legacy dans `handleCheckout`
- ❌ Interface `LegacyCoupon`
- ❌ Toutes les références à `appliedCouponLegacy`

#### Modifié:
```typescript
// AVANT
const { items, summary, isLoading: cartLoading, appliedCoupon: appliedCouponLegacy } = useCart();

// APRÈS
const { items, summary, isLoading: cartLoading } = useCart();
```

#### Simplifié:
```typescript
// AVANT
useEffect(() => {
  if (appliedCouponCode) return;
  if (appliedCouponLegacy) return; // Vérification legacy
  // ...
}, [appliedCouponCode, appliedCouponLegacy]);

// APRÈS
useEffect(() => {
  if (appliedCouponCode) return;
  // ...
}, [appliedCouponCode]);
```

---

## 📊 Calcul Final Simplifié

### Flux de Calcul

1. **`useCart.ts`** calcule:
   ```typescript
   summary.subtotal = items.reduce((sum, item) => {
     return sum + (item.unit_price - item.discount_amount) * item.quantity;
   }, 0);
   // = Prix après remises items uniquement
   
   summary.discount_amount = items.reduce((sum, item) => {
     return sum + item.discount_amount * item.quantity;
   }, 0);
   // = Uniquement remises items
   ```

2. **`Checkout.tsx`** calcule:
   ```typescript
   const couponDiscount = appliedCouponCode?.discountAmount || 0;
   const subtotalAfterDiscounts = summary.subtotal - couponDiscount;
   // = Prix après remises items ET coupon
   ```

### Exemple: Prix 5000 XOF, Remise item 1000 XOF, Coupon -400 XOF

**Dans `useCart.ts`:**
- `summary.subtotal` = 5000 - 1000 = **4000 XOF** ✅
- `summary.discount_amount` = **1000 XOF** (remises items uniquement)

**Dans `Checkout.tsx`:**
- `couponDiscount` = **400 XOF**
- `subtotalAfterDiscounts` = 4000 - 400 = **3600 XOF** ✅
- Taxes (18%): 3600 × 0.18 = 648 XOF
- Livraison: 5000 XOF
- **Total final: 3600 + 648 + 5000 = 9248 XOF** ✅

---

## ✅ Avantages de la Suppression

1. **Clarté**
   - Un seul système de coupons
   - Pas de confusion entre ancien et nouveau

2. **Simplicité**
   - Calcul direct et clair
   - Moins de code à maintenir

3. **Fiabilité**
   - Pas de risque de double application
   - Total toujours correct

4. **Maintenabilité**
   - Code plus simple
   - Moins de bugs potentiels

---

## 🔑 Points Clés

1. **`summary.subtotal`** ne contient jamais de coupons
   - Uniquement prix après remises items

2. **`summary.discount_amount`** ne contient jamais de coupons
   - Uniquement remises items

3. **Coupons gérés uniquement dans `Checkout.tsx`**
   - Via `appliedCouponCode`
   - Soustrait directement du `summary.subtotal`

4. **Pas de chargement automatique dans `useCart`**
   - Le coupon est chargé uniquement dans `Checkout.tsx`

---

## 📝 Fichiers Modifiés

### `src/hooks/cart/useCart.ts`
- Lignes 79-105: Supprimé `appliedCoupon` state et useEffect
- Lignes 107-125: Modifié calcul de `summary` (sans coupon)
- Lignes 304-385: Supprimé `applyCoupon` et `removeCoupon`
- Lignes 387-401: Retiré `appliedCoupon` du retour

### `src/pages/Checkout.tsx`
- Ligne 64: Retiré `appliedCoupon: appliedCouponLegacy`
- Lignes 192-231: Simplifié useEffect de chargement
- Lignes 323-346: Calcul simplifié (soustrait uniquement coupon)
- Lignes 640-670: Supprimé code legacy dans `handleCheckout`
- Ligne 392: Retiré `appliedCouponLegacy` du debug

---

## ✅ Résultat

Le système est maintenant **unifié** :
- ✅ Un seul système de coupons (`appliedCouponCode`)
- ✅ Calcul clair et simple
- ✅ Pas de conflit
- ✅ Total se met à jour correctement

---

**Date de suppression:** 30 Janvier 2025  
**Statut:** ✅ **ANCIEN SYSTÈME COMPLÈTEMENT SUPPRIMÉ**

