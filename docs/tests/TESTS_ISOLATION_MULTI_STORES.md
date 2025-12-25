# 🧪 Tests d'Isolation Multi-Stores

**Date** : 28 Janvier 2025  
**Objectif** : Valider que chaque boutique a son propre tableau et gère bien ses propres données

---

## 📋 Vue d'Ensemble

Cette suite de tests valide l'isolation complète des données dans le système multi-stores. Elle garantit que :

1. ✅ Chaque boutique ne voit que ses propres données
2. ✅ Aucune fuite de données entre boutiques
3. ✅ Les politiques RLS fonctionnent correctement
4. ✅ La limite de 3 boutiques est respectée
5. ✅ Le StoreContext gère correctement la sélection

---

## 🗂️ Structure des Tests

```
src/
├── hooks/
│   └── __tests__/
│       ├── multiStoresIsolation.test.ts          # Tests unitaires d'isolation
│       └── multiStoresIsolation.integration.test.ts  # Tests d'intégration
└── contexts/
    └── __tests__/
        └── StoreContext.isolation.test.tsx        # Tests du contexte
```

---

## 🧪 Tests Unitaires

### Fichier : `multiStoresIsolation.test.ts`

#### 1. Products Isolation

- ✅ `should only fetch products for the specified store`
- ✅ `should not return products from other stores`
- ✅ `should return empty array when storeId is null`

#### 2. Orders Isolation

- ✅ `should only fetch orders for the specified store`
- ✅ `should not return orders from other stores`
- ✅ `should return empty array when storeId is undefined`

#### 3. Customers Isolation

- ✅ `should only fetch customers for the specified store`
- ✅ `should not return customers from other stores`
- ✅ `should return empty data when storeId is undefined`

#### 4. Dashboard Stats Isolation

- ✅ `should only fetch stats for the specified store`

#### 5. Store Limit Validation

- ✅ `should enforce maximum of 3 stores per user`
- ✅ `should allow creation when user has less than 3 stores`

#### 6. Cross-Store Data Leakage Prevention

- ✅ `should prevent products from store-2 appearing in store-1 queries`
- ✅ `should prevent orders from store-2 appearing in store-1 queries`

#### 7. Store ID Validation

- ✅ `should require store_id for all data queries`
- ✅ `should filter by store_id in all queries`

---

## 🎯 Tests du StoreContext

### Fichier : `StoreContext.isolation.test.tsx`

#### 1. Store Selection

- ✅ `should load stores filtered by user_id`
- ✅ `should not load stores from other users`
- ✅ `should select first store by default when no stored selection`
- ✅ `should restore selected store from localStorage`
- ✅ `should validate selected store belongs to user`

#### 2. Store Switching

- ✅ `should switch to a different store`
- ✅ `should not switch to a store that does not belong to user`

#### 3. Store Limit

- ✅ `should correctly calculate remaining stores`
- ✅ `should prevent creation when limit reached`

---

## 🚀 Exécution des Tests

### Tous les tests d'isolation

```bash
npm run test:unit -- multiStoresIsolation
```

### Tests spécifiques

```bash
# Tests d'isolation des produits
npm run test:unit -- multiStoresIsolation.test.ts -t "Products Isolation"

# Tests du StoreContext
npm run test:unit -- StoreContext.isolation.test.tsx

# Tests de limite de boutiques
npm run test:unit -- multiStoresIsolation.test.ts -t "Store Limit"
```

### Avec couverture

```bash
npm run test:coverage -- multiStoresIsolation
```

---

## 📊 Résultats Attendus

### ✅ Tests qui doivent passer

Tous les tests doivent passer pour garantir l'isolation :

- ✅ **100% des tests d'isolation** doivent passer
- ✅ **Aucune fuite de données** détectée
- ✅ **Tous les filtres store_id** sont appliqués
- ✅ **Limite de 3 boutiques** respectée

### ⚠️ Tests qui échouent = Problème critique

Si un test échoue, cela indique une **faille de sécurité** dans l'isolation des données.

---

## 🔍 Scénarios Testés

### Scénario 1 : Deux utilisateurs avec plusieurs boutiques

```
User 1:
  - Store A (Products: P1, P2 | Orders: O1, O2)
  - Store B (Products: P3, P4 | Orders: O3, O4)

User 2:
  - Store C (Products: P5, P6 | Orders: O5, O6)
```

**Vérifications** :
- ✅ User 1 ne voit que Store A et Store B
- ✅ User 2 ne voit que Store C
- ✅ Store A ne voit que P1, P2, O1, O2
- ✅ Store B ne voit que P3, P4, O3, O4
- ✅ Store C ne voit que P5, P6, O5, O6

### Scénario 2 : Changement de boutique

```
1. User 1 sélectionne Store A
   → Voir P1, P2, O1, O2

2. User 1 switch vers Store B
   → Voir P3, P4, O3, O4
   → P1, P2, O1, O2 ne sont plus visibles
```

**Vérifications** :
- ✅ Les données se rechargent correctement
- ✅ Aucune donnée de Store A n'est visible dans Store B

---

## 🛠️ Maintenance

### Ajouter un nouveau test

1. Identifier le hook/composant à tester
2. Créer un test dans `multiStoresIsolation.test.ts`
3. Vérifier que le filtre `store_id` est appliqué
4. Vérifier qu'aucune fuite n'est possible

### Exemple de nouveau test

```typescript
describe('New Feature Isolation', () => {
  it('should only fetch data for the specified store', async () => {
    // Arrange
    const store1Data = [{ id: 'item-1', store_id: 'store-1' }];
    
    // Act
    const { result } = renderHook(() => useNewFeature('store-1'), { wrapper });
    
    // Assert
    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].store_id).toBe('store-1');
    });
    
    // Vérifier que le filtre est appliqué
    expect(mockEq).toHaveBeenCalledWith('store_id', 'store-1');
  });
});
```

---

## 📝 Notes

- Les tests utilisent des **mocks** pour isoler les tests
- Pour les tests d'intégration, un environnement Supabase de test est nécessaire
- Les tests doivent être exécutés avant chaque déploiement
- Toute modification du système multi-stores doit inclure des tests correspondants

---

## 🔗 Références

- `docs/analyses/ANALYSE_SECURITE_MULTI_STORES_ISOLATION.md` - Analyse de sécurité
- `src/contexts/StoreContext.tsx` - Contexte multi-stores
- `src/hooks/useStore.ts` - Hook principal
- `supabase/migrations/20250202_restore_multi_stores_limit.sql` - Limite de boutiques

---

**Date de création** : 28 Janvier 2025  
**Dernière mise à jour** : 28 Janvier 2025  
**Statut** : ✅ **ACTIF**

