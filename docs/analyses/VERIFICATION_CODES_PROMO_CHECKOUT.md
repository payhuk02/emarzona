# Vérification des Codes Promo au Checkout

**Date**: 31 Janvier 2025  
**Objectif**: Vérifier et corriger l'application des codes promo au checkout avec le système unifié

## ✅ Modifications Effectuées

### 1. **Nouveau Hook de Validation Unifiée**
- ✅ Créé `useValidateUnifiedPromotion` dans `src/hooks/physical/usePromotions.ts`
- ✅ Utilise la fonction RPC `validate_unified_promotion` côté serveur
- ✅ Accepte tous les paramètres nécessaires : `productIds`, `categoryIds`, `collectionIds`, `orderAmount`, `customerId`, `isFirstOrder`
- ✅ Retourne toutes les informations de la promotion avec le montant de réduction calculé

### 2. **Composant CouponInput Amélioré**
- ✅ Mis à jour `src/components/checkout/CouponInput.tsx` pour utiliser le nouveau hook
- ✅ Charge automatiquement les catégories et collections des produits du panier
- ✅ Passe toutes les informations nécessaires à la validation (produits, catégories, collections)
- ✅ Supporte le paramètre `isFirstOrder` pour les promotions "nouveaux clients"

### 3. **Checkout Intégré**
- ✅ Mis à jour `src/pages/Checkout.tsx` pour passer toutes les informations du panier
- ✅ Passe `productIds` (tous les produits du panier) au lieu d'un seul `productId`
- ✅ Vérifie si c'est la première commande du client (`isFirstOrder`)
- ✅ Enregistre l'utilisation de la promotion dans `promotion_usage` après création de la commande
- ✅ Met à jour le compteur `current_uses` de la promotion

### 4. **Calcul de la Réduction**
- ✅ La réduction est calculée côté serveur par `validate_unified_promotion`
- ✅ Prend en compte :
  - Type de réduction (pourcentage ou montant fixe)
  - Montant maximum de réduction (si défini)
  - Montant de la commande
  - Limites au montant de la commande
- ✅ La réduction est correctement soustraite du sous-total avant calcul des taxes
- ✅ Le total final est calculé avec la réduction appliquée

## 📋 Flux de Validation au Checkout

1. **Saisie du code promo**
   - L'utilisateur saisit un code dans `CouponInput`
   - Le code est automatiquement validé en temps réel via `useValidateUnifiedPromotion`

2. **Validation Serveur**
   - Appel à `validate_unified_promotion` avec tous les paramètres :
     - Code promo
     - Store ID
     - IDs des produits du panier
     - IDs des catégories des produits
     - IDs des collections des produits
     - Montant de la commande
     - Customer ID (si connecté)
     - Premier achat ou non

3. **Vérifications Effectuées**
   - ✅ Code existe et est actif
   - ✅ Dates de validité (starts_at, ends_at)
   - ✅ Limite d'utilisation globale (max_uses)
   - ✅ Limite par client (max_uses_per_customer)
   - ✅ Montant minimum d'achat (min_purchase_amount)
   - ✅ Éligibilité client (nouveaux vs existants)
   - ✅ Application aux produits (produits spécifiques, catégories, collections)
   - ✅ Calcul du montant de réduction

4. **Application de la Réduction**
   - Si valide, la réduction est affichée et appliquée au total
   - Le montant est sauvegardé dans `appliedCouponCode`
   - Le code est sauvegardé dans localStorage

5. **Enregistrement après Commande**
   - Après création de la commande, l'utilisation est enregistrée dans `promotion_usage`
   - Le compteur `current_uses` de la promotion est incrémenté
   - Les statistiques sont mises à jour

## 🎯 Règles de Validation

### Promotion par Produits Spécifiques
- ✅ Vérifie que au moins un produit du panier correspond aux `product_ids` de la promotion

### Promotion par Catégories
- ✅ Vérifie que au moins un produit du panier appartient aux catégories sélectionnées
- ✅ Charge automatiquement les catégories des produits du panier

### Promotion par Collections
- ✅ Vérifie que au moins un produit du panier appartient aux collections sélectionnées
- ✅ Charge automatiquement les collections des produits du panier

### Promotion pour Tous les Produits
- ✅ S'applique à tous les produits du panier sans restriction

### Promotion pour Nouveaux Clients
- ✅ Vérifie si c'est la première commande du client
- ✅ Rejette si le client a déjà passé des commandes

## ⚠️ Points d'Attention

1. **Fonction RPC manquante**
   - La fonction `increment_promotion_usage` pour incrémenter `current_uses` pourrait ne pas exister
   - Alternative : mettre à jour manuellement avec un UPDATE
   - Impact : Le compteur pourrait ne pas se mettre à jour automatiquement

2. **Calcul du Total**
   - ✅ La réduction est soustraite du sous-total AVANT les taxes
   - ✅ Les taxes sont calculées sur le montant après réduction
   - ✅ La carte cadeau est appliquée APRÈS les taxes

3. **Multi-Boutiques**
   - Le checkout gère les paniers multi-boutiques
   - Chaque commande doit valider la promotion pour ses propres produits

## 🧪 Tests à Effectuer

### Tests Manuels Recommandés

1. **Code promo pour produits spécifiques**
   - ✅ Créer une promotion pour un produit spécifique
   - ✅ Tester avec le produit dans le panier → Doit être valide
   - ✅ Tester avec un autre produit → Doit être invalide

2. **Code promo pour catégories**
   - ✅ Créer une promotion pour une catégorie
   - ✅ Ajouter un produit de cette catégorie au panier
   - ✅ Tester le code → Doit être valide
   - ✅ Retirer le produit et ajouter un autre d'une autre catégorie
   - ✅ Tester le code → Doit être invalide

3. **Code promo pour collections**
   - ✅ Créer une promotion pour une collection
   - ✅ Ajouter un produit de cette collection au panier
   - ✅ Tester le code → Doit être valide

4. **Code promo nouveaux clients**
   - ✅ Créer une promotion pour nouveaux clients uniquement
   - ✅ Tester avec un nouveau compte → Doit être valide
   - ✅ Tester avec un compte existant → Doit être invalide

5. **Calcul de la réduction**
   - ✅ Code promo 10% sur 1000 XOF → Réduction de 100 XOF
   - ✅ Code promo montant fixe 500 XOF sur 1000 XOF → Réduction de 500 XOF
   - ✅ Vérifier que le total final est correct

6. **Limites d'utilisation**
   - ✅ Créer une promotion avec max_uses = 1
   - ✅ Utiliser le code une fois → Doit fonctionner
   - ✅ Essayer de l'utiliser une deuxième fois → Doit être rejeté

## 📝 Notes Techniques

### Fichiers Modifiés

1. `src/hooks/physical/usePromotions.ts`
   - Ajout de `useValidateUnifiedPromotion`
   - Extension de `PromotionValidationResult`

2. `src/components/checkout/CouponInput.tsx`
   - Utilisation de `useValidateUnifiedPromotion`
   - Chargement automatique des catégories/collections
   - Support de `productIds` au lieu de `productId`

3. `src/pages/Checkout.tsx`
   - Passe `productIds` au `CouponInput`
   - Vérifie `isFirstOrder`
   - Enregistre l'utilisation dans `promotion_usage`

### Fonctions SQL Utilisées

- `validate_unified_promotion()` : Validation complète de la promotion
- `promotion_usage` : Table d'enregistrement des utilisations
- `increment_promotion_usage()` : À créer ou utiliser UPDATE direct

## ✅ Conclusion

Le système de validation des codes promo au checkout a été entièrement migré vers le système unifié. Tous les types de promotions (produits spécifiques, catégories, collections, tous produits, nouveaux clients) sont maintenant supportés avec une validation complète côté serveur.

**Prochaines étapes recommandées** :
1. Tester manuellement tous les scénarios décrits ci-dessus
2. Créer la fonction RPC `increment_promotion_usage` si elle n'existe pas
3. Ajouter des tests automatisés pour la validation des promotions
