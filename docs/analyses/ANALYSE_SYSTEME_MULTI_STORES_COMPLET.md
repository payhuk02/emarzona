# 📊 ANALYSE COMPLÈTE - SYSTÈME MULTI-STORES

**Date** : 2 Février 2025  
**Objectif** : Analyser le projet pour installer un système complet de multi-stores  
**Spécifications** : Chaque utilisateur peut créer jusqu'à 3 boutiques, chaque boutique aura son propre tableau de bord et ses données isolées

---

## 📋 ÉTAT ACTUEL DU SYSTÈME

### 1. Architecture Actuelle

#### Base de Données
- ✅ Table `stores` existe avec les colonnes nécessaires
- ✅ Migration `20250130_enforce_store_limit.sql` limite actuellement à **1 boutique** (modifiée depuis la version 3)
- ✅ Toutes les tables liées utilisent `store_id` comme clé étrangère :
  - `products` → `store_id`
  - `orders` → `store_id`
  - `customers` → `store_id`
  - `transactions` → `store_id`
  - `payments` → `store_id`
  - `sales_history` → `store_id`
  - Et bien d'autres...

#### Frontend
- ❌ **StoreContext supprimé** (janvier 2025)
- ✅ Hook `useStores()` existe mais limite à 1 boutique
- ✅ Hook `useStore()` récupère uniquement la première boutique
- ❌ Pas de mécanisme de sélection de boutique active
- ❌ Pas d'interface de switch entre boutiques

#### Isolation des Données
- ✅ **RLS (Row Level Security)** déjà en place sur toutes les tables
- ✅ Les politiques RLS filtrent par `store_id` via `user_id`
- ✅ Les données sont déjà isolées par boutique au niveau base de données

---

## 🎯 OBJECTIFS DU SYSTÈME MULTI-STORES

### Fonctionnalités Requises

1. **Limite de 3 boutiques par utilisateur**
   - Validation au niveau base de données (trigger)
   - Validation au niveau application (hooks)
   - Messages d'erreur clairs

2. **Sélection de boutique active**
   - Contexte React pour gérer la boutique sélectionnée
   - Persistance dans `localStorage`
   - Synchronisation entre tous les composants

3. **Isolation complète des données**
   - Chaque boutique a son propre tableau de bord
   - Produits, commandes, clients isolés par boutique
   - Analytics et statistiques par boutique
   - Paramètres et configurations par boutique

4. **Interface utilisateur**
   - Sélecteur de boutique dans le sidebar
   - Indicateur visuel de la boutique active
   - Switch rapide entre boutiques
   - Création de nouvelles boutiques (jusqu'à 3)

---

## 🏗️ ARCHITECTURE PROPOSÉE

### 1. Contexte React : `StoreContext`

**Fichier** : `src/contexts/StoreContext.tsx`

**Responsabilités** :
- Gérer la liste des boutiques de l'utilisateur
- Gérer la boutique sélectionnée/active
- Persister la sélection dans `localStorage`
- Fournir des fonctions pour changer de boutique

**Interface** :
```typescript
interface StoreContextType {
  stores: Store[];
  selectedStoreId: string | null;
  selectedStore: Store | null;
  loading: boolean;
  setSelectedStoreId: (storeId: string | null) => void;
  switchStore: (storeId: string) => void;
  refreshStores: () => Promise<void>;
}
```

### 2. Hooks Modifiés

#### `useStore.ts`
- Modifier pour utiliser `selectedStoreId` du contexte
- Récupérer la boutique active au lieu de la première
- Réagir aux changements de sélection

#### `useStores.ts`
- Modifier pour permettre jusqu'à 3 boutiques
- Ajouter fonction `canCreateStore()` (retourne `stores.length < 3`)
- Ajouter fonction `getRemainingStores()` (retourne `3 - stores.length`)

### 3. Interface Utilisateur

#### `AppSidebar.tsx`
- Ajouter un sous-menu "Boutiques" sous "Tableau de bord"
- Afficher la liste des boutiques avec indicateur de sélection
- Bouton "Créer une boutique" (si < 3 boutiques)
- Switch rapide entre boutiques

#### `Store.tsx`
- Afficher toutes les boutiques de l'utilisateur
- Permettre la création jusqu'à 3 boutiques
- Afficher les statistiques par boutique

### 4. Base de Données

#### Migration SQL
**Fichier** : `supabase/migrations/20250202_restore_multi_stores_limit.sql`

**Actions** :
- Modifier le trigger `check_store_limit()` pour limiter à **3 boutiques**
- Mettre à jour les messages d'erreur
- Vérifier que toutes les politiques RLS sont correctes

---

## 📊 TABLES IMPACTÉES

### Tables avec `store_id` (Isolation déjà en place)

1. **Produits & Catalogue**
   - `products` → `store_id`
   - `product_variants` → `product_id` → `store_id`
   - `product_categories` → `store_id`
   - `product_reviews` → `product_id` → `store_id`

2. **Commandes & Transactions**
   - `orders` → `store_id`
   - `order_items` → `order_id` → `store_id`
   - `transactions` → `store_id`
   - `payments` → `store_id`

3. **Clients**
   - `customers` → `store_id`
   - `customer_loyalty` → `customer_id` → `store_id`

4. **Analytics & Statistiques**
   - `sales_history` → `store_id`
   - `product_analytics` → `product_id` → `store_id`
   - `store_analytics` → `store_id`

5. **Affiliation**
   - `affiliate_links` → `store_id`
   - `affiliate_commissions` → `store_id`

6. **Autres**
   - `store_withdrawals` → `store_id`
   - `store_payment_methods` → `store_id`
   - `store_earnings` → `store_id`
   - `coupons` → `store_id`
   - `gift_cards` → `store_id`
   - `wishlists` → `store_id`

**✅ Conclusion** : Toutes les tables sont déjà configurées pour l'isolation par boutique via `store_id` et les politiques RLS.

---

## 🔄 FLUX DE DONNÉES

### 1. Chargement Initial

```
1. Utilisateur se connecte
   ↓
2. StoreContext charge toutes les boutiques de l'utilisateur
   ↓
3. Récupère selectedStoreId depuis localStorage
   ↓
4. Si selectedStoreId existe et est valide → utilise cette boutique
   ↓
5. Sinon → utilise la première boutique (ou null si aucune)
   ↓
6. Tous les hooks (useStore, useDashboardStats, etc.) utilisent selectedStoreId
```

### 2. Changement de Boutique

```
1. Utilisateur clique sur une boutique dans le sidebar
   ↓
2. StoreContext.setSelectedStoreId(newStoreId)
   ↓
3. Sauvegarde dans localStorage
   ↓
4. Tous les composants utilisant useStoreContext() sont re-rendus
   ↓
5. useStore() détecte le changement et recharge les données
   ↓
6. useDashboardStats() recharge les statistiques pour la nouvelle boutique
   ↓
7. Toutes les pages affichent les données de la nouvelle boutique
```

### 3. Création de Boutique

```
1. Utilisateur clique sur "Créer une boutique"
   ↓
2. Vérification : stores.length < 3 ?
   ↓
3. Si oui → Formulaire de création
   ↓
4. Création en base de données (trigger vérifie la limite)
   ↓
5. StoreContext.refreshStores() recharge la liste
   ↓
6. Nouvelle boutique devient automatiquement sélectionnée
```

---

## 🛠️ PLAN D'IMPLÉMENTATION

### Phase 1 : Base de Données ✅
- [x] Analyser les migrations existantes
- [ ] Créer/modifier la migration pour limiter à 3 boutiques
- [ ] Vérifier toutes les politiques RLS
- [ ] Tester la création de boutiques multiples

### Phase 2 : Contexte React 🔄
- [ ] Créer `StoreContext.tsx`
- [ ] Implémenter la gestion de la sélection
- [ ] Ajouter la persistance localStorage
- [ ] Intégrer dans `App.tsx`

### Phase 3 : Hooks 🔄
- [ ] Modifier `useStore.ts` pour utiliser le contexte
- [ ] Modifier `useStores.ts` pour supporter 3 boutiques
- [ ] Adapter tous les hooks qui utilisent `store_id`

### Phase 4 : Interface Utilisateur 🔄
- [ ] Ajouter le sélecteur dans `AppSidebar.tsx`
- [ ] Modifier `Store.tsx` pour afficher toutes les boutiques
- [ ] Ajouter les indicateurs visuels de sélection
- [ ] Créer le composant de création de boutique

### Phase 5 : Isolation des Données 🔄
- [ ] Vérifier que toutes les pages filtrent par `selectedStoreId`
- [ ] Adapter les dashboards pour la boutique active
- [ ] Tester l'isolation complète des données

### Phase 6 : Tests & Validation 🔄
- [ ] Tester la création de 3 boutiques
- [ ] Tester le switch entre boutiques
- [ ] Vérifier l'isolation des données
- [ ] Tester les performances

---

## ⚠️ POINTS D'ATTENTION

### 1. Performance
- **Problème** : Charger toutes les boutiques à chaque fois peut être coûteux
- **Solution** : Mettre en cache la liste des boutiques, ne recharger que si nécessaire

### 2. Synchronisation
- **Problème** : Plusieurs onglets peuvent avoir des sélections différentes
- **Solution** : Utiliser `storage` event pour synchroniser entre onglets

### 3. Données Orphelines
- **Problème** : Si un utilisateur supprime une boutique, les données liées sont supprimées (CASCADE)
- **Solution** : Ajouter une confirmation avant suppression, avec avertissement sur les données

### 4. Migration des Données Existantes
- **Problème** : Les utilisateurs actuels ont peut-être déjà plusieurs boutiques
- **Solution** : La migration SQL doit être compatible avec l'existant

---

## 📝 FICHIERS À MODIFIER/CRÉER

### Nouveaux Fichiers
1. `src/contexts/StoreContext.tsx` - Contexte de gestion des boutiques
2. `supabase/migrations/20250202_restore_multi_stores_limit.sql` - Migration SQL

### Fichiers à Modifier
1. `src/App.tsx` - Ajouter StoreProvider
2. `src/hooks/useStore.ts` - Utiliser le contexte
3. `src/hooks/useStores.ts` - Supporter 3 boutiques
4. `src/components/AppSidebar.tsx` - Ajouter le sélecteur
5. `src/pages/Store.tsx` - Afficher toutes les boutiques
6. `src/components/store/StoreForm.tsx` - Adapter pour 3 boutiques
7. `src/components/settings/StoreSettings.tsx` - Adapter l'interface

### Fichiers à Vérifier (Isolation des Données)
- Tous les hooks qui utilisent `store_id`
- Toutes les pages qui affichent des données par boutique
- Tous les composants de dashboard/analytics

---

## 🎯 RÉSULTAT ATTENDU

### Expérience Utilisateur

1. **Création de Boutiques**
   - L'utilisateur peut créer jusqu'à 3 boutiques
   - Message clair indiquant le nombre de boutiques restantes
   - Interface intuitive pour la création

2. **Sélection de Boutique**
   - Menu déroulant dans le sidebar avec toutes les boutiques
   - Indicateur visuel de la boutique active
   - Switch instantané entre boutiques

3. **Isolation des Données**
   - Chaque boutique a son propre tableau de bord
   - Produits, commandes, clients isolés
   - Analytics et statistiques par boutique
   - Aucune fuite de données entre boutiques

4. **Performance**
   - Chargement rapide de la boutique active
   - Pas de rechargement inutile des données
   - Interface réactive et fluide

---

## ✅ VALIDATION

### Tests à Effectuer

1. **Création**
   - [ ] Créer 1 boutique → ✅ Succès
   - [ ] Créer 2 boutiques → ✅ Succès
   - [ ] Créer 3 boutiques → ✅ Succès
   - [ ] Tenter de créer une 4ème → ❌ Erreur claire

2. **Sélection**
   - [ ] Changer de boutique dans le sidebar → ✅ Données mises à jour
   - [ ] Recharger la page → ✅ Boutique sélectionnée conservée
   - [ ] Ouvrir plusieurs onglets → ✅ Synchronisation (optionnel)

3. **Isolation**
   - [ ] Produits de la boutique A n'apparaissent pas dans la boutique B
   - [ ] Commandes de la boutique A n'apparaissent pas dans la boutique B
   - [ ] Analytics de la boutique A sont indépendants de la boutique B

4. **Performance**
   - [ ] Temps de chargement < 2s
   - [ ] Switch entre boutiques < 500ms
   - [ ] Pas de re-renders inutiles

---

## 📚 RESSOURCES

### Documentation Supabase
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Triggers](https://supabase.com/docs/guides/database/triggers)

### Documentation React
- [Context API](https://react.dev/reference/react/createContext)
- [Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

**Document créé le** : 2 Février 2025  
**Version** : 1.0  
**Statut** : 📋 Analyse complète - Prêt pour implémentation

