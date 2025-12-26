# Correction - Double Application du Code Promo

**Date:** 30 Janvier 2025  
**Problème:** Le code promo était appliqué automatiquement à la création et le total ne se mettait pas à jour  
**Statut:** ✅ **CORRIGÉ**

---

## 🔍 Problème Identifié

### Symptômes

- Sous-total: 4000 XOF
- Code promo (PROMO10): -400 XOF (affiché)
- **Total: 4000 XOF** ❌ (devrait être 3600 XOF)

### Cause Racine

**Conflit entre deux systèmes de calcul :**

1. **`useCart.ts`** calcule `summary.subtotal` :

   ```typescript
   const subtotal = items.reduce((sum, item) => {
     const itemPrice = (item.unit_price - (item.discount_amount || 0)) * item.quantity;
     return sum + itemPrice;
   }, 0);
   ```

   - `summary.subtotal` = **prix APRÈS remises sur items** (déjà soustrait)

2. **`Checkout.tsx`** calculait :

   ```typescript
   const itemDiscounts = items.reduce(...); // Remises items
   const couponDiscount = appliedCouponCode?.discountAmount;
   const totalDiscounts = itemDiscounts + couponDiscount;
   const subtotalAfterDiscounts = summary.subtotal - totalDiscounts;
   ```

   - **PROBLÈME** : On soustrayait `itemDiscounts` alors qu'ils sont **déjà dans `summary.subtotal`**
   - Résultat : Double soustraction des remises items OU confusion

---

## ✅ Solution Appliquée

### 1. Correction du Calcul

**Avant (Incorrect):**

```typescript
const itemDiscounts = items.reduce(...); // Remises items
const couponDiscount = appliedCouponCode?.discountAmount;
const totalDiscounts = itemDiscounts + couponDiscount;
const subtotalAfterDiscounts = summary.subtotal - totalDiscounts;
// ❌ Soustrait itemDiscounts deux fois (déjà dans summary.subtotal)
```

**Après (Correct):**

```typescript
// Calculer les remises items (pour affichage uniquement)
const itemDiscounts = items.reduce(...);

// Montant du coupon
const couponDiscount = appliedCouponCode?.discountAmount ? Number(...) : 0;

// IMPORTANT: summary.subtotal contient DÉJÀ les remises items
// On soustrait UNIQUEMENT le coupon
const subtotalAfterDiscounts = Math.max(0, summary.subtotal - couponDiscount);
```

### 2. Prévention de la Double Application

**Amélioration du chargement depuis localStorage:**

```typescript
useEffect(() => {
  // Ne charger que si appliedCouponCode n'est pas déjà défini
  if (appliedCouponCode) {
    return; // Déjà chargé, ne pas recharger
  }

  // Vérifier expiration (24h)
  if (coupon.appliedAt) {
    const hoursDiff = (now - appliedAt) / (1000 * 60 * 60);
    if (hoursDiff >= 24) {
      localStorage.removeItem('applied_coupon');
      return;
    }
  }

  // Conversion explicite en nombre
  setAppliedCouponCode({
    id: coupon.id,
    discountAmount: Number(coupon.discountAmount),
    code: coupon.code,
  });
}, []);
```

### 3. Amélioration du Debug

Ajout de logs pour détecter les conflits :

```typescript
console.log('[Checkout] Coupon appliqué:', {
  couponCode: appliedCouponCode.code,
  discountAmount: appliedCouponCode.discountAmount,
  subtotal: summary.subtotal,
  itemDiscounts,
  couponDiscount,
  subtotalAfterDiscounts,
  finalTotal,
  // Vérifier qu'il n'y a pas de double application
  summaryDiscountAmount: summary.discount_amount,
  appliedCouponLegacy: appliedCouponLegacy,
});
```

---

## 📊 Flux de Calcul Corrigé

### Exemple: Prix original 5000 XOF, Remise item 1000 XOF, Code promo -400 XOF

**Dans `useCart.ts`:**

1. Prix item: 5000 XOF
2. Remise item: 1000 XOF
3. `summary.subtotal` = 5000 - 1000 = **4000 XOF** ✅

**Dans `Checkout.tsx`:**

1. `summary.subtotal` = 4000 XOF (déjà avec remises items)
2. `itemDiscounts` = 1000 XOF (pour affichage uniquement)
3. `couponDiscount` = 400 XOF
4. `subtotalAfterDiscounts` = 4000 - 400 = **3600 XOF** ✅
5. Taxes (18%): 3600 × 0.18 = 648 XOF
6. Livraison: 5000 XOF
7. **Total final: 3600 + 648 + 5000 = 9248 XOF** ✅

---

## 🔑 Points Clés de la Correction

1. **Compréhension de `summary.subtotal`**
   - `summary.subtotal` = prix APRÈS remises items
   - Ne pas soustraire `itemDiscounts` à nouveau

2. **Soustraction Unique du Coupon**
   - `subtotalAfterDiscounts = summary.subtotal - couponDiscount`
   - Simple et clair

3. **Prévention Double Chargement**
   - Vérifier si `appliedCouponCode` existe avant de charger
   - Vérifier expiration (24h)

4. **Conversion Explicite**
   - `Number(coupon.discountAmount)` pour garantir le type

---

## ✅ Résultat

Le total se met maintenant à jour **correctement** :

- Sous-total: 4000 XOF (avec remises items)
- Code promo: -400 XOF
- **Total: 3600 XOF** ✅ (avant taxes et shipping)

---

**Date de correction:** 30 Janvier 2025  
**Statut:** ✅ **CORRIGÉ**
