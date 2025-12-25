# Analyse des Relations entre les Pages de Transaction

**Date**: 2025-02-03  
**Objectif**: Vérifier la cohérence, les relations et l'intégration du système de retraits pour vendeurs

---

## 📋 Vue d'ensemble

Le système de retraits pour vendeurs comprend **3 pages principales** et **3 hooks** qui gèrent les transactions :

### Pages
1. **`/dashboard/withdrawals`** - Page vendeur pour gérer les retraits
2. **`/dashboard/payment-methods`** - Page vendeur pour gérer les méthodes de paiement
3. **`/admin/store-withdrawals`** - Page admin pour gérer tous les retraits

### Hooks
1. **`useStoreEarnings`** - Gestion des revenus et soldes
2. **`useStoreWithdrawals`** - Gestion des demandes de retrait
3. **`useStorePaymentMethods`** - Gestion des méthodes de paiement sauvegardées

### Tables de base de données
1. **`store_earnings`** - Revenus et soldes disponibles
2. **`store_withdrawals`** - Demandes de retrait
3. **`store_payment_methods`** - Méthodes de paiement sauvegardées

---

## 🔗 Relations entre les Pages

### 1. Page `/dashboard/withdrawals` (Vendeur)

**Dépendances**:
- ✅ `useStore()` - Récupère le store de l'utilisateur
- ✅ `useStoreEarnings(store?.id)` - Récupère les revenus et le solde
- ✅ `useStoreWithdrawals({ store_id: store?.id })` - Récupère les retraits du store
- ✅ `WithdrawalRequestDialog` - Utilise `useStorePaymentMethods` en interne

**Flux de données**:
```
Store → Earnings → Available Balance → Withdrawal Request → Withdrawals List
```

**Intégration avec Payment Methods**:
- ✅ Le `WithdrawalRequestDialog` charge automatiquement les méthodes sauvegardées via `useStorePaymentMethods`
- ✅ L'utilisateur peut sélectionner une méthode sauvegardée ou en créer une nouvelle
- ⚠️ **Note**: Si l'utilisateur crée une nouvelle méthode dans le dialog de retrait, elle n'est PAS sauvegardée automatiquement dans `store_payment_methods`. C'est un comportement attendu (méthode à usage unique).

**Actions**:
- ✅ Demander un retrait → Crée un enregistrement dans `store_withdrawals`
- ✅ Annuler un retrait en attente → Met à jour le statut à `cancelled`
- ✅ Rafraîchir les revenus → Appelle `refreshEarnings()` qui met à jour `store_earnings`

---

### 2. Page `/dashboard/payment-methods` (Vendeur)

**Dépendances**:
- ✅ `useStore()` - Récupère le store de l'utilisateur
- ✅ `useStorePaymentMethods({ storeId: store?.id, activeOnly: false })` - Récupère toutes les méthodes (actives et inactives)

**Flux de données**:
```
Store → Payment Methods List → Create/Edit/Delete → Store Payment Methods Table
```

**Intégration avec Withdrawals**:
- ✅ Les méthodes créées ici sont disponibles dans `WithdrawalRequestDialog`
- ✅ Le hook `useStorePaymentMethods` est partagé entre les deux pages
- ✅ Les méthodes par défaut (`is_default: true`) sont pré-sélectionnées dans le dialog de retrait

**Actions**:
- ✅ Créer une méthode → Insère dans `store_payment_methods`
- ✅ Modifier une méthode → Met à jour `store_payment_methods`
- ✅ Supprimer une méthode → Supprime de `store_payment_methods`
- ✅ Définir comme défaut → Met à jour `is_default` (le trigger SQL gère l'unicité)

---

### 3. Page `/admin/store-withdrawals` (Admin)

**Dépendances**:
- ✅ `useAdmin()` - Vérifie les droits admin
- ✅ `useStoreWithdrawals({ status: ... })` - Récupère TOUS les retraits (pas de filtre `store_id`)

**Flux de données**:
```
All Stores → All Withdrawals → Filter by Status → Approve/Reject/Complete
```

**Intégration avec le système**:
- ✅ Peut voir tous les retraits de tous les stores
- ✅ Peut approuver (`pending` → `processing`)
- ✅ Peut rejeter (`pending` → `failed`)
- ✅ Peut compléter (`processing` → `completed`)
- ✅ Met à jour les champs `approved_by`, `processed_by`, `transaction_reference`, `proof_url`

**Impact sur les revenus**:
- ⚠️ **IMPORTANT**: Quand un retrait passe à `completed`, le trigger SQL `update_store_earnings_on_withdrawal` met automatiquement à jour `store_earnings.total_withdrawn`
- ✅ Le solde disponible (`available_balance`) est recalculé automatiquement

---

## 🔄 Flux de Données Complet

### Cycle de vie d'un retrait

```
1. Vendeur crée une méthode de paiement
   └─> store_payment_methods (INSERT)

2. Vendeur demande un retrait
   └─> Vérifie store_earnings.available_balance
   └─> Crée store_withdrawals (status: 'pending')
   └─> Le montant est réservé (mais pas encore déduit)

3. Admin approuve le retrait
   └─> store_withdrawals.status = 'processing'
   └─> store_withdrawals.approved_at = now()
   └─> store_withdrawals.approved_by = admin_id

4. Admin complète le retrait
   └─> store_withdrawals.status = 'completed'
   └─> store_withdrawals.processed_at = now()
   └─> store_withdrawals.transaction_reference = '...'
   └─> TRIGGER: update_store_earnings_on_withdrawal
       └─> store_earnings.total_withdrawn += amount
       └─> store_earnings.available_balance -= amount

5. Vendeur voit le retrait complété
   └─> store_withdrawals.status = 'completed'
   └─> store_earnings.available_balance mis à jour
```

---

## 📊 Calcul des Revenus (store_earnings)

### Fonction SQL: `calculate_store_earnings(p_store_id)`

**Source des revenus**:
```sql
SELECT COALESCE(SUM(total_amount), 0)
FROM orders
WHERE store_id = p_store_id
  AND status = 'completed'
  AND payment_status = 'paid'
```

**Commission plateforme**:
```sql
total_platform_commission = total_revenue * platform_commission_rate
-- Par défaut: 10% (0.10)
```

**Retraits totaux**:
```sql
SELECT COALESCE(SUM(amount), 0)
FROM store_withdrawals
WHERE store_id = p_store_id
  AND status = 'completed'
```

**Solde disponible**:
```sql
available_balance = total_revenue 
                  - total_platform_commission 
                  - total_withdrawn
```

### Triggers automatiques

1. **`update_store_earnings_on_order`**
   - Déclenché: Après INSERT/UPDATE sur `orders`
   - Condition: `status = 'completed'`
   - Action: Appelle `update_store_earnings(store_id)`

2. **`update_store_earnings_on_withdrawal`**
   - Déclenché: Après INSERT/UPDATE sur `store_withdrawals`
   - Condition: `status` change
   - Action: Appelle `update_store_earnings(store_id)`

---

## ✅ Vérifications de Cohérence

### 1. Types TypeScript

**✅ Cohérence des types**:
- `StoreEarnings` correspond à la table `store_earnings`
- `StoreWithdrawal` correspond à la table `store_withdrawals`
- `SavedStorePaymentMethod` correspond à la table `store_payment_methods`
- `StorePaymentMethodForm` est utilisé pour créer/modifier des méthodes
- `StoreWithdrawalRequestForm` est utilisé pour créer des retraits

**✅ Types partagés**:
- `StorePaymentMethod` = `'mobile_money' | 'bank_card' | 'bank_transfer'`
- `StoreWithdrawalStatus` = `'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'`
- `MobileMoneyOperator` est défini et utilisé de manière cohérente

### 2. Relations de base de données

**✅ Clés étrangères**:
- `store_earnings.store_id` → `stores.id` (ON DELETE CASCADE)
- `store_withdrawals.store_id` → `stores.id` (ON DELETE CASCADE)
- `store_payment_methods.store_id` → `stores.id` (ON DELETE CASCADE)
- `store_withdrawals.approved_by` → `auth.users(id)`
- `store_withdrawals.processed_by` → `auth.users(id)`

**✅ Contraintes**:
- `store_earnings`: UNIQUE(store_id) - Un seul enregistrement par store
- `store_payment_methods`: UNIQUE(store_id, payment_method, is_default) WHERE is_default = TRUE
- `store_withdrawals.amount`: CHECK (amount > 0)
- `store_earnings.available_balance`: CHECK (available_balance >= 0)

### 3. RLS (Row Level Security)

**✅ Policies pour vendeurs**:
- Peuvent voir leurs propres `store_earnings`
- Peuvent voir leurs propres `store_withdrawals`
- Peuvent créer leurs propres `store_withdrawals`
- Peuvent annuler leurs `store_withdrawals` en attente
- Peuvent gérer leurs propres `store_payment_methods`

**✅ Policies pour admins**:
- Peuvent voir tous les `store_earnings`
- Peuvent voir tous les `store_withdrawals`
- Peuvent gérer tous les `store_withdrawals` (UPDATE)

### 4. Hooks et leurs dépendances

**✅ `useStoreEarnings`**:
- Dépend de `storeId`
- Appelle `update_store_earnings` si les revenus n'existent pas
- Recalcule automatiquement les revenus à chaque fetch
- Gère les erreurs de migration SQL manquante

**✅ `useStoreWithdrawals`**:
- Accepte des filtres optionnels (`StoreWithdrawalFilters`)
- Filtre par `store_id` si fourni (pour vendeurs)
- Ne filtre pas par `store_id` si non fourni (pour admins)
- Vérifie le solde disponible avant de créer un retrait
- Vérifie le montant minimum (10000 XOF)

**✅ `useStorePaymentMethods`**:
- Filtre par `storeId` (obligatoire)
- Peut filtrer par `paymentMethod` (optionnel)
- Peut filtrer par `activeOnly` (par défaut: true)
- Gère l'unicité des méthodes par défaut via le trigger SQL

---

## ⚠️ Problèmes Potentiels Identifiés

### 1. ⚠️ Calcul des revenus basé uniquement sur `orders.status = 'completed'`

**Problème**: La fonction `calculate_store_earnings` calcule les revenus uniquement à partir des commandes avec `status = 'completed'` et `payment_status = 'paid'`.

**Impact**: Si une commande est marquée comme `completed` mais que le paiement n'est pas encore `paid`, elle ne sera pas comptabilisée. C'est probablement le comportement attendu, mais il faut s'assurer que le workflow de paiement est cohérent.

**Recommandation**: ✅ Comportement correct - Les revenus ne doivent être comptabilisés que lorsque la commande est complétée ET payée.

### 2. ✅ Validation du solde disponible lors de l'approbation admin (CORRIGÉ)

**Problème initial**: Quand un admin approuve un retrait, il n'y a pas de vérification que le solde disponible est toujours suffisant. Si plusieurs retraits sont approuvés simultanément, le solde pourrait devenir négatif.

**Solution implémentée**: 
- ✅ Ajout d'une vérification dans `handleApprove` de `AdminStoreWithdrawals.tsx`
- ✅ Vérification du solde disponible avant d'approuver
- ✅ Message d'erreur clair si le solde est insuffisant
- ✅ Empêche l'approbation si le solde est insuffisant

**Code implémenté**:
```typescript
// Vérifier le solde disponible avant d'approuver
const { data: earnings, error: earningsError } = await supabase
  .from('store_earnings')
  .select('available_balance')
  .eq('store_id', withdrawal.store_id)
  .single();

if (earnings && withdrawal.amount > (earnings.available_balance || 0)) {
  toast({
    title: 'Solde insuffisant',
    description: `Le solde disponible (${earnings.available_balance || 0} XOF) est inférieur au montant du retrait (${withdrawal.amount} XOF)`,
    variant: 'destructive',
  });
  return;
}
```

### 3. ✅ Synchronisation en temps réel (IMPLÉMENTÉ)

**Problème initial**: Les pages ne se mettent pas à jour automatiquement quand un retrait change de statut. L'utilisateur doit rafraîchir manuellement.

**Solution implémentée**: 
- ✅ Utilisation de Supabase Realtime pour écouter les changements sur `store_withdrawals` et `store_earnings`
- ✅ Mise à jour automatique des listes de retraits
- ✅ Mise à jour automatique des revenus et soldes
- ✅ Notifications toast intelligentes quand le statut d'un retrait change
- ✅ Notification pour les admins quand un nouveau retrait est créé

**Code implémenté**:
- `useStoreEarnings`: Écoute les changements sur `store_earnings` pour le store spécifique
- `useStoreWithdrawals`: Écoute les changements sur `store_withdrawals` avec filtres dynamiques
- `AdminStoreWithdrawals`: Écoute tous les retraits et notifie l'admin des nouveaux retraits

**Notifications**:
- ✅ "Retrait approuvé ✅" quand le statut passe à `processing`
- ✅ "Retrait complété 🎉" quand le statut passe à `completed`
- ✅ "Retrait échoué ❌" quand le statut passe à `failed` (avec raison du rejet)
- ✅ "Nouveau retrait 📤" pour les admins quand un nouveau retrait est créé

### 4. ✅ Méthodes de paiement sauvegardées vs méthodes à usage unique

**Comportement actuel**: 
- Dans `WithdrawalRequestDialog`, l'utilisateur peut sélectionner une méthode sauvegardée OU créer une nouvelle méthode à usage unique
- Les méthodes à usage unique ne sont PAS sauvegardées dans `store_payment_methods`

**Évaluation**: ✅ C'est un comportement correct et flexible. L'utilisateur peut choisir de sauvegarder ou non.

### 5. ✅ Vérification des retraits en attente lors de la création (CORRIGÉ)

**Problème initial**: Un vendeur peut créer plusieurs retraits en attente simultanément, ce qui peut dépasser son solde disponible.

**Solution implémentée**: 
- ✅ Ajout d'une vérification dans `requestWithdrawal` pour calculer le solde disponible MOINS les retraits en attente
- ✅ Empêche la création de retraits qui dépasseraient le solde total disponible
- ✅ Message d'erreur clair indiquant le solde disponible après retraits en attente

**Code implémenté**:
```typescript
// Calculer le solde disponible moins les retraits en attente
const { data: pendingWithdrawals } = await supabase
  .from('store_withdrawals')
  .select('amount')
  .eq('store_id', storeId)
  .in('status', ['pending', 'processing']);

const pendingAmount = pendingWithdrawals?.reduce((sum, w) => sum + parseFloat(w.amount.toString()), 0) || 0;
const availableAfterPending = (earnings.available_balance || 0) - pendingAmount;

if (formData.amount > availableAfterPending) {
  throw new Error(`Solde insuffisant. Disponible après retraits en attente : ${availableAfterPending} XOF`);
}
```

---

## 🔍 Points de Vérification Manuels

### 1. Test du flux complet

**Scénario 1: Retrait simple**
1. ✅ Créer une méthode de paiement
2. ✅ Vérifier le solde disponible
3. ✅ Demander un retrait
4. ✅ Vérifier que le retrait apparaît dans la liste
5. ✅ Admin approuve le retrait
6. ✅ Admin complète le retrait
7. ✅ Vérifier que le solde disponible est mis à jour

**Scénario 2: Retrait annulé**
1. ✅ Demander un retrait
2. ✅ Annuler le retrait (vendeur)
3. ✅ Vérifier que le statut est `cancelled`
4. ✅ Vérifier que le solde disponible n'a pas changé

**Scénario 3: Retrait rejeté**
1. ✅ Demander un retrait
2. ✅ Admin rejette le retrait
3. ✅ Vérifier que le statut est `failed`
4. ✅ Vérifier que le solde disponible n'a pas changé

### 2. Vérification des calculs

**Test 1: Calcul des revenus**
- Créer une commande avec `status = 'completed'` et `payment_status = 'paid'`
- Vérifier que `store_earnings.total_revenue` est mis à jour
- Vérifier que `store_earnings.available_balance` est mis à jour

**Test 2: Commission plateforme**
- Vérifier que `total_platform_commission = total_revenue * 0.10`
- Vérifier que `available_balance = total_revenue - total_platform_commission - total_withdrawn`

**Test 3: Retrait complété**
- Compléter un retrait
- Vérifier que `total_withdrawn` est incrémenté
- Vérifier que `available_balance` est décrémenté

### 3. Vérification des permissions

**Test 1: Vendeur**
- ✅ Ne peut voir que ses propres revenus
- ✅ Ne peut voir que ses propres retraits
- ✅ Ne peut créer que des retraits pour son store
- ✅ Ne peut annuler que ses retraits en attente

**Test 2: Admin**
- ✅ Peut voir tous les revenus
- ✅ Peut voir tous les retraits
- ✅ Peut approuver/rejeter/compléter tous les retraits

---

## 📝 Recommandations d'Amélioration

### 1. ✅ Priorité Haute (TERMINÉ)

**✅ Ajouter une vérification du solde lors de l'approbation admin**
- ✅ Empêcher l'approbation si le solde est insuffisant
- ✅ Afficher un message d'erreur clair

**✅ Ajouter une vérification des retraits en attente lors de la création**
- ✅ Calculer le solde disponible moins les retraits en attente
- ✅ Empêcher la création si le solde total (disponible + en attente) est insuffisant

### 2. ✅ Priorité Moyenne (TERMINÉ)

**✅ Ajouter Supabase Realtime**
- ✅ Écouter les changements sur `store_withdrawals`
- ✅ Écouter les changements sur `store_earnings`
- ✅ Mettre à jour automatiquement les pages
- ✅ Gestion des filtres dynamiques dans les channels Realtime

**✅ Ajouter des notifications**
- ✅ Notifier le vendeur quand son retrait est approuvé (`processing`)
- ✅ Notifier le vendeur quand son retrait est complété (`completed`)
- ✅ Notifier le vendeur quand son retrait est rejeté (`failed`) avec raison
- ✅ Notifier l'admin quand un nouveau retrait est créé
- ✅ Messages personnalisés selon le statut avec emojis

### 3. ✅ Priorité Basse (TERMINÉ)

**✅ Ajouter un historique des changements de statut**
- ✅ Table `store_withdrawal_status_history` créée avec migration SQL
- ✅ Trigger automatique pour enregistrer chaque changement de statut
- ✅ Hook `useWithdrawalHistory` pour récupérer l'historique
- ✅ Composant `WithdrawalHistoryDialog` pour afficher l'historique
- ✅ Bouton "Historique" dans les listes de retraits (vendeur et admin)
- ✅ Traçabilité complète : ancien statut, nouveau statut, raison, utilisateur, date

**✅ Ajouter des statistiques avancées**
- ✅ Hook `useWithdrawalStats` pour calculer les statistiques
- ✅ Composant `WithdrawalStatsCard` pour afficher les statistiques
- ✅ Statistiques générales : total retraits, montant total, taux de réussite, montant moyen
- ✅ Statistiques de temps : temps moyen de traitement, temps moyen de complétion, plus rapide, plus lent
- ✅ Statistiques par méthode de paiement : nombre, montant, taux de réussite pour chaque méthode
- ✅ Statistiques par période : évolution mensuelle avec graphiques de progression
- ✅ Intégration dans les pages vendeur et admin

---

## ✅ Conclusion

### Points Forts

1. ✅ **Architecture cohérente**: Les pages, hooks et tables sont bien structurés
2. ✅ **Séparation des responsabilités**: Vendeurs et admins ont des pages distinctes
3. ✅ **Sécurité**: RLS policies bien configurées
4. ✅ **Types TypeScript**: Cohérents et bien définis
5. ✅ **Triggers SQL**: Automatisation du calcul des revenus

### Points à Améliorer

1. ✅ **Vérification du solde lors de l'approbation**: ✅ CORRIGÉ
2. ✅ **Vérification des retraits en attente**: ✅ CORRIGÉ
3. ✅ **Synchronisation en temps réel**: ✅ IMPLÉMENTÉ

### Statut Global

**✅ Système fonctionnel, cohérent et optimisé** avec :
- ✅ Vérifications de sécurité (solde, retraits en attente)
- ✅ Synchronisation en temps réel (Supabase Realtime)
- ✅ Notifications intelligentes pour les utilisateurs
- ✅ Expérience utilisateur fluide et réactive

**✅ Toutes les améliorations (haute, moyenne et basse priorité) ont été implémentées.**

### Nouvelles fonctionnalités ajoutées

1. **Historique des changements de statut**
   - Migration SQL : `20250203_store_withdrawal_status_history.sql`
   - Trigger automatique : `log_withdrawal_status_change()`
   - Interface utilisateur : Dialog avec timeline des changements
   - Accessible depuis les listes de retraits (bouton "Historique")

2. **Statistiques avancées**
   - Calculs automatiques : temps de traitement, taux de réussite, évolution mensuelle
   - Visualisation : cartes avec graphiques de progression
   - Filtres : par store, par période (optionnel)
   - Métriques : par méthode de paiement, par période mensuelle

---

**Dernière mise à jour**: 2025-02-03

