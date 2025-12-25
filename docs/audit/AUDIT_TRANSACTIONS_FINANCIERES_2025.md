# 🔍 Audit Complet des Transactions Financières

**Date**: Février 2025  
**Statut**: ✅ Audit terminé - Corrections en cours

---

## 📋 Résumé Exécutif

Cet audit a identifié plusieurs problèmes critiques dans le flux des transactions financières et la récupération des informations client sur la page "Paiements et Clients". Les principales issues concernent :

1. **Incohérence entre tables `payments` et `transactions`**
2. **Informations client incomplètes dans PaymentsCustomers**
3. **Données du checkout non récupérées depuis `transactions`**
4. **Manque de synchronisation entre les deux systèmes**

---

## 🔴 Problèmes Critiques Identifiés

### 1. **Problème Principal : Double Système de Paiements**

**Description** :

- La plateforme utilise deux tables parallèles : `payments` et `transactions`
- Les transactions Moneroo sont principalement dans `transactions`
- La page `PaymentsCustomers` utilise `usePayments` qui interroge uniquement `payments`
- Résultat : Les transactions Moneroo ne sont pas visibles dans PaymentsCustomers

**Impact** : 🔴 CRITIQUE

- Les vendeurs ne voient pas toutes leurs transactions
- Les données client du checkout ne sont pas récupérées
- Incohérence dans les rapports financiers

**Fichiers concernés** :

- `src/pages/PaymentsCustomers.tsx` (ligne 74)
- `src/hooks/usePayments.ts` (ligne 38-128)
- `src/lib/moneroo-payment.ts` (ligne 106-127)

---

### 2. **Informations Client Incomplètes**

**Description** :

- Dans `usePayments.ts`, seuls `name` et `email` sont récupérés (lignes 76-88)
- Les informations suivantes sont manquantes :
  - `phone` (téléphone)
  - `address` (adresse complète)
  - `city`, `postal_code`, `country` (localisation)
  - `shipping_address` (adresse de livraison complète depuis metadata)

**Impact** : 🟠 ÉLEVÉ

- La page PaymentsCustomers n'affiche pas toutes les informations collectées au checkout
- Les vendeurs ne peuvent pas contacter les clients facilement
- Perte d'informations importantes pour la livraison

**Fichiers concernés** :

- `src/hooks/usePayments.ts` (lignes 76-88)
- `src/pages/PaymentsCustomers.tsx` (lignes 828-838, 1100-1108)

---

### 3. **Données du Checkout Non Récupérées**

**Description** :

- Le checkout sauvegarde correctement dans `transactions` :
  - `customer_email`, `customer_name`, `customer_phone` (lignes 113-115 de moneroo-payment.ts)
  - `metadata.shipping_address` avec toutes les infos (ligne 1324 de Checkout.tsx)
- Mais `usePayments` ne récupère pas ces données depuis `transactions`

**Impact** : 🟠 ÉLEVÉ

- Les informations collectées au checkout sont perdues
- Impossible de voir l'adresse de livraison complète
- Métadonnées importantes non accessibles

**Fichiers concernés** :

- `src/pages/Checkout.tsx` (lignes 1310-1332)
- `src/lib/moneroo-payment.ts` (lignes 106-127)
- `src/hooks/usePayments.ts` (lignes 38-128)

---

### 4. **Manque de Synchronisation payments ↔ transactions**

**Description** :

- Les transactions Moneroo créent un enregistrement dans `transactions`
- Un enregistrement dans `payments` est créé via le webhook (ligne 352-383 de moneroo-webhook)
- Mais il n'y a pas de garantie que toutes les transactions aient un payment correspondant
- La relation `transaction.payment_id` peut être NULL

**Impact** : 🟡 MOYEN

- Risque de transactions orphelines
- Difficulté à faire le lien entre les deux tables
- Incohérences possibles dans les rapports

**Fichiers concernés** :

- `supabase/functions/moneroo-webhook/index.ts` (lignes 352-383)

---

## ✅ Points Positifs Identifiés

1. **Sauvegarde complète au checkout** : Toutes les informations client sont bien sauvegardées dans `transactions`
2. **Métadonnées riches** : Le système de metadata permet de stocker toutes les infos nécessaires
3. **Webhooks fonctionnels** : Les webhooks Moneroo mettent bien à jour les statuts
4. **Audit trail** : La table `transaction_logs` permet un suivi complet

---

## 🔧 Corrections Nécessaires

### Correction 1 : Unifier la récupération des paiements

**Action** : Modifier `usePayments` pour récupérer depuis `transactions` ET `payments`

**Fichier** : `src/hooks/usePayments.ts`

**Changements** :

1. Récupérer les transactions depuis la table `transactions`
2. Enrichir avec les données de `payments` si disponible
3. Prioriser les données de `transactions` (plus complètes)

---

### Correction 2 : Récupérer toutes les informations client

**Action** : Enrichir la récupération des données client

**Fichiers** :

- `src/hooks/usePayments.ts`
- `src/pages/PaymentsCustomers.tsx`

**Changements** :

1. Récupérer `phone`, `address`, `city`, `postal_code`, `country` depuis `customers`
2. Extraire `shipping_address` depuis `metadata` de `transactions`
3. Afficher toutes ces informations dans le dialog de détails

---

### Correction 3 : Créer un hook unifié pour transactions

**Action** : Créer `useTransactions` qui combine `transactions` et `payments`

**Fichier** : `src/hooks/useTransactions.ts` (nouveau)

**Fonctionnalités** :

- Récupérer toutes les transactions
- Enrichir avec les données de payments si disponible
- Inclure toutes les informations client
- Gérer les relations avec orders et customers

---

## 📊 Tableau de Comparaison

| Information      | Checkout sauvegarde | Transactions  | Payments | PaymentsCustomers affiche |
| ---------------- | ------------------- | ------------- | -------- | ------------------------- |
| Email            | ✅                  | ✅            | ❌       | ✅                        |
| Nom              | ✅                  | ✅            | ❌       | ✅                        |
| Téléphone        | ✅                  | ✅            | ❌       | ❌                        |
| Adresse complète | ✅                  | ✅ (metadata) | ❌       | ❌                        |
| Ville            | ✅                  | ✅ (metadata) | ❌       | ❌                        |
| Code postal      | ✅                  | ✅ (metadata) | ❌       | ❌                        |
| Pays             | ✅                  | ✅ (metadata) | ❌       | ❌                        |
| Montant          | ✅                  | ✅            | ✅       | ✅                        |
| Statut           | ✅                  | ✅            | ✅       | ✅                        |
| Transaction ID   | ✅                  | ✅            | ✅       | ✅                        |

---

## 🎯 Plan d'Action

### Phase 1 : Corrections Immédiates (Priorité Haute)

1. ✅ Modifier `usePayments` pour récupérer depuis `transactions`
2. ✅ Enrichir avec toutes les informations client
3. ✅ Afficher les données complètes dans PaymentsCustomers

### Phase 2 : Améliorations (Priorité Moyenne)

1. Créer `useTransactions` hook unifié
2. Synchroniser automatiquement `payments` et `transactions`
3. Ajouter des tests de validation

### Phase 3 : Optimisations (Priorité Basse)

1. Optimiser les requêtes avec des jointures
2. Ajouter un cache pour les données client
3. Créer des vues SQL pour simplifier les requêtes

---

## 📝 Notes Techniques

### Structure des Tables

**Table `transactions`** :

- Contient toutes les transactions Moneroo
- Stocke `customer_email`, `customer_name`, `customer_phone`
- Stocke `metadata` avec `shipping_address` complet
- Relation avec `orders` via `order_id`

**Table `payments`** :

- Contient les paiements génériques
- Moins d'informations client
- Relation avec `orders` via `order_id`
- Relation avec `customers` via `customer_id`

**Table `customers`** :

- Contient les informations client par boutique
- `name`, `email`, `phone`, `address`, `city`, `postal_code`, `country`
- Relation avec `orders` et `payments`

---

## ✅ Validation

Après les corrections, vérifier :

1. ✅ Toutes les transactions sont visibles dans PaymentsCustomers
2. ✅ Toutes les informations client sont affichées
3. ✅ L'adresse de livraison complète est accessible
4. ✅ Les métadonnées sont récupérées et affichées
5. ✅ Les statistiques sont cohérentes

---

## 📚 Références

- Migration transactions : `supabase/migrations/20251010154605_65ad8161-e545-406c-b46c-5f25f6ae1013.sql`
- Migration payments : `supabase/migrations/20251006101817_6d494383-4748-408d-9fa4-2bdd026fc3f9.sql`
- Webhook Moneroo : `supabase/functions/moneroo-webhook/index.ts`
- Service paiement : `src/lib/moneroo-payment.ts`
- Page PaymentsCustomers : `src/pages/PaymentsCustomers.tsx`
