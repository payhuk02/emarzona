# 📋 TODOs et Améliorations Futures

Ce document liste les TODOs identifiés dans le code et les améliorations prévues.

## 🔴 Priorité Haute

### 1. Checkout Multi-Stores (`src/pages/Checkout.tsx`)

**Lignes**: 516, 529

**Description**:
Le système de checkout actuel ne gère pas complètement les commandes multi-boutiques. Actuellement, seul le premier store est traité.

**TODOs**:

- [ ] Implémenter le traitement complet multi-stores
- [ ] Créer la fonction `processMultiStoreCheckout` pour gérer tous les stores

**Complexité**: 🔴 Haute - Nécessite une refonte partielle du système de checkout

**Impact**:

- Les utilisateurs ne peuvent pas commander des produits de plusieurs boutiques en une seule transaction
- Expérience utilisateur limitée

**Solution proposée**:

1. Créer une fonction `processMultiStoreCheckout` qui :
   - Sépare les produits par store
   - Crée une commande par store
   - Gère les paiements multiples si nécessaire
   - Unifie la confirmation de commande
2. Mettre à jour l'UI pour afficher clairement les produits par boutique
3. Gérer les frais de livraison multiples

**Estimation**: 2-3 jours de développement

---

## 🟡 Priorité Moyenne

### 2. Types Supabase - service_availability (`src/pages/service/BookingsManagement.tsx`)

**Ligne**: 224

**Description**:
La table `service_availability` n'est pas incluse dans les types Supabase générés automatiquement.

**TODO**:

- [ ] Ajouter `service_availability` aux types Supabase générés

**Complexité**: 🟡 Moyenne - Nécessite la régénération des types

**Solution proposée**:

1. Vérifier que la table `service_availability` existe dans Supabase
2. Régénérer les types avec : `npm run supabase:types`
3. Si la table n'existe pas, créer la migration SQL nécessaire

**Estimation**: 30 minutes - 1 heure

**Note**: Un type temporaire a été créé pour contourner le problème en attendant la régénération.

---

## 📝 Notes

- Les TODOs sont régulièrement révisés et mis à jour
- Les issues GitHub sont créées pour les TODOs de priorité haute
- Les améliorations sont planifiées dans les sprints de développement

---

_Dernière mise à jour : 2025-01-30_
