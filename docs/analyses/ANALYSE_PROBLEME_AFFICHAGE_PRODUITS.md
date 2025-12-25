# 🔍 ANALYSE - Problème d'Affichage des Produits dans le Dashboard

## 📋 PROBLÈME SIGNALÉ

Le tableau de bord affiche "0 produits" alors que la boutique "Boutique 1" a bien un produit.

---

## 🔍 CAUSE IDENTIFIÉE

### Problème Principal : Mauvais Hook Utilisé

**Fichier** : `src/hooks/useDashboardStats.ts`

**Ligne 9** :
```typescript
// ❌ PROBLÈME : Utilise l'ancien hook
import { useStore } from "./use-store";
```

### Explication

Il existe **deux hooks différents** dans le projet :

1. **`src/hooks/use-store.ts`** (ANCIEN)
   - Récupère simplement la **première boutique** de l'utilisateur
   - Ne tient pas compte de la boutique sélectionnée
   - Code :
   ```typescript
   const { data, error } = await supabase
     .from('stores')
     .select('*')
     .eq('user_id', user.id)
     .limit(1);  // ❌ Prend juste la première
   ```

2. **`src/hooks/useStore.ts`** (NOUVEAU - Multi-stores)
   - Utilise le **StoreContext** pour obtenir la boutique sélectionnée
   - Respecte le changement de boutique
   - Code :
   ```typescript
   const { selectedStoreId, selectedStore: contextStore } = useStoreContext();
   // ✅ Utilise la boutique sélectionnée
   ```

### Scénario du Problème

```
Utilisateur a 2 boutiques :
- Boutique 1 (première créée) - A 1 produit
- Boutique 2 (deuxième créée) - A 0 produits

Utilisateur sélectionne "Boutique 1" dans le sidebar
  ↓
useDashboardStats utilise use-store (ancien)
  ↓
use-store récupère la première boutique (Boutique 1) ✅
  ↓
MAIS si l'utilisateur avait sélectionné "Boutique 2" avant,
  ↓
use-store récupère toujours la première (Boutique 1)
  ↓
Les produits de Boutique 1 s'affichent même si Boutique 2 est sélectionnée ❌
```

**OU** (plus probable) :

```
Utilisateur a 2 boutiques :
- Boutique A (première créée) - A 0 produits
- Boutique B (deuxième créée) - A 1 produit

Utilisateur sélectionne "Boutique B" dans le sidebar
  ↓
useDashboardStats utilise use-store (ancien)
  ↓
use-store récupère la première boutique (Boutique A) ❌
  ↓
Les produits de Boutique A s'affichent (0 produits) ❌
  ↓
Les produits de Boutique B ne s'affichent pas ❌
```

---

## ✅ SOLUTION APPLIQUÉE

### Correction de l'import

**Fichier** : `src/hooks/useDashboardStats.ts`

```typescript
// ✅ CORRIGÉ : Utilise le bon hook avec StoreContext
import { useStore } from "./useStore";
```

### Fichiers Corrigés

1. ✅ `src/hooks/useDashboardStats.ts` - Import corrigé
2. ✅ `src/pages/Dashboard.tsx` - Import corrigé

### Fichiers à Corriger (Autres utilisations de l'ancien hook)

Les fichiers suivants utilisent encore `use-store` et devraient être corrigés :

- `src/hooks/useAdvancedDashboardStats.ts`
- `src/pages/AdvancedDashboard.tsx`
- `src/pages/Analytics.tsx`
- `src/pages/Customers.tsx`
- `src/pages/Orders.tsx`
- `src/pages/Withdrawals.tsx`
- `src/pages/Promotions.tsx`
- `src/pages/PaymentMethods.tsx`
- `src/pages/AdvancedOrderManagement.tsx`
- `src/pages/AdvancedOrderManagementSimple.tsx`
- `src/pages/dashboard/StoreAffiliateManagement.tsx`
- `src/components/physical/promotions/PromotionsManager.tsx`
- `src/components/physical/inventory/StockAlerts.tsx`
- `src/components/physical/inventory/WarehouseManager.tsx`
- `src/components/storefront/StoreHeader.tsx`

---

## 🔍 VÉRIFICATIONS SUPPLÉMENTAIRES

### 1. Logs de débogage ajoutés

Des logs ont été ajoutés pour tracer la récupération des produits :

```typescript
if (productsResult.status === 'rejected') {
  logger.error('❌ [useDashboardStats] Erreur lors de la récupération des produits:', productsResult.reason);
} else {
  logger.info('✅ [useDashboardStats] Produits récupérés:', {
    count: products.length,
    storeId: store.id,
    products: products.map(p => ({ id: p.id, name: p.name || 'N/A', is_active: p.is_active }))
  });
}
```

### 2. Vérification du filtre store_id

Le filtre est correctement appliqué dans la requête :

```typescript
.eq("store_id", store.id)
```

---

## 🎯 RÉSULTAT ATTENDU

Après cette correction :
- ✅ Le dashboard affiche les produits de la boutique **sélectionnée**
- ✅ Les statistiques correspondent à la bonne boutique
- ✅ Le changement de boutique met à jour correctement les données
- ✅ Les produits s'affichent correctement dans le tableau de bord

---

## 📝 RECOMMANDATIONS

### 1. Corriger tous les fichiers utilisant l'ancien hook

Tous les fichiers listés ci-dessus devraient être mis à jour pour utiliser `useStore` au lieu de `use-store`.

### 2. Supprimer l'ancien hook (optionnel)

Une fois tous les fichiers corrigés, considérer la suppression de `src/hooks/use-store.ts` pour éviter toute confusion future.

### 3. Tests

Ajouter des tests pour vérifier que :
- Le dashboard affiche les bonnes données pour chaque boutique
- Le changement de boutique met à jour les statistiques
- Les produits s'affichent correctement

---

**Date** : 28 Janvier 2025  
**Statut** : ✅ **CORRIGÉ** (Dashboard et useDashboardStats)  
**Action requise** : Corriger les autres fichiers utilisant `use-store`

