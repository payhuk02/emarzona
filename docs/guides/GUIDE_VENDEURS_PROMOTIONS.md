# Guide Vendeurs : Gestion des Promotions

**Date:** 28 Janvier 2025  
**Version:** 1.0  
**Public:** Vendeurs et gestionnaires de boutique

---

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Accès à la Gestion des Promotions](#accès)
3. [Créer une Promotion](#créer-une-promotion)
4. [Types de Réductions](#types-de-réductions)
5. [Portée des Promotions](#portée-des-promotions)
6. [Paramètres Avancés](#paramètres-avancés)
7. [Gérer les Promotions Existantes](#gérer-les-promotions)
8. [Statistiques et Suivi](#statistiques)
9. [Conseils et Bonnes Pratiques](#conseils)
10. [FAQ](#faq)

---

## 🎯 Introduction

Le système unifié de promotions vous permet de créer et gérer toutes vos promotions et codes de réduction depuis une seule interface, pour tous vos produits (physiques, digitaux, services, cours).

### Avantages du Système Unifié

- ✅ **Interface unique** : Gérez toutes vos promotions au même endroit
- ✅ **Flexibilité maximale** : Créez des promotions pour tous types de produits
- ✅ **Suivi complet** : Statistiques détaillées sur l'utilisation de vos promotions
- ✅ **Application ciblée** : Définissez précisément à quels produits s'applique la promotion

---

## 🔐 Accès à la Gestion des Promotions

### Depuis le Tableau de Bord

1. Connectez-vous à votre compte vendeur
2. Cliquez sur **"Promotions"** dans le menu de navigation
3. Vous accédez à la page de gestion des promotions

### URL directe

```
/dashboard/promotions
```

---

## ➕ Créer une Promotion

### Étapes de Création

1. **Cliquez sur "Créer une promotion"** (bouton violet/rose en haut à droite)

2. **Remplissez les informations de base :**
   - **Nom** : Nom interne de la promotion (ex: "Black Friday 2025")
   - **Code promotionnel** (optionnel) : Code que les clients entreront (ex: "BLACKFRIDAY25")
   - **Description** : Description détaillée de la promotion

3. **Définissez le type et la valeur de réduction :**
   - Voir [Types de Réductions](#types-de-réductions)

4. **Choisissez la portée :**
   - Voir [Portée des Promotions](#portée-des-promotions)

5. **Configurez les dates :**
   - **Date de début** : Quand la promotion commence
   - **Date de fin** (optionnel) : Quand la promotion se termine

6. **Définissez les limites** (optionnel) :
   - Limite d'utilisations totales
   - Limite par client

7. **Activez ou désactivez** :
   - Cochez "Actif" pour activer immédiatement la promotion

8. **Cliquez sur "Créer"**

---

## 💰 Types de Réductions

### 1. Pourcentage

Réduction en pourcentage sur le montant total de la commande.

**Exemple :**

- Valeur : `20`
- Résultat : 20% de réduction sur le total

**Quand l'utiliser :**

- Soldes générales
- Promotions saisonnières
- Réductions sur catégories entières

---

### 2. Montant Fixe

Réduction d'un montant précis en XOF.

**Exemple :**

- Valeur : `5000`
- Résultat : 5000 XOF de réduction sur le total

**Quand l'utiliser :**

- Offres spéciales avec réduction fixe
- Promotions "économisez X XOF"

---

### 3. Livraison Gratuite

Offre la livraison gratuite sans réduction sur le prix.

**Exemple :**

- Type : Livraison gratuite
- Résultat : Les frais de livraison sont offerts

**Quand l'utiliser :**

- Commandes supérieures à un montant minimum
- Promotions événementielles

---

### 4. Acheter X Obtenir Y

Promotion conditionnelle (à venir dans une version future).

---

## 🎯 Portée des Promotions

### 1. Tous les Produits

La promotion s'applique à **tous vos produits** sans exception.

**Quand l'utiliser :**

- Soldes générales
- Promotions store-wide
- Offres spéciales globales

---

### 2. Produits Spécifiques

La promotion s'applique uniquement aux **produits que vous sélectionnez**.

**Comment procéder :**

1. Sélectionnez "Produits spécifiques"
2. Utilisez la recherche pour trouver vos produits
3. Cochez les produits concernés
4. Vous pouvez sélectionner "Tout sélectionner" pour une catégorie

**Quand l'utiliser :**

- Promotions sur des produits précis
- Nouveautés
- Produits en fin de série

---

### 3. Catégories

La promotion s'applique à **tous les produits d'une ou plusieurs catégories**.

**Comment procéder :**

1. Sélectionnez "Catégories"
2. Recherchez et sélectionnez les catégories concernées
3. Tous les produits de ces catégories bénéficient de la promotion

**Quand l'utiliser :**

- Soldes par catégorie
- Promotions thématiques
- Offres sur des types de produits

---

### 4. Collections

La promotion s'applique à **tous les produits d'une ou plusieurs collections**.

**Comment procéder :**

1. Sélectionnez "Collections"
2. Recherchez et sélectionnez les collections concernées
3. Tous les produits de ces collections bénéficient de la promotion

**Quand l'utiliser :**

- Promotions sur des collections spécifiques
- Offres packagées
- Nouveautés par collection

---

## ⚙️ Paramètres Avancés

### Limites d'Utilisation

#### Limite d'utilisations totales

Définit combien de fois au maximum le code peut être utilisé.

**Exemple :**

- Limite : `100`
- Résultat : Le code peut être utilisé maximum 100 fois au total

**Astuce :** Laissez vide pour une utilisation illimitée.

---

#### Limite par client

Définit combien de fois un même client peut utiliser le code.

**Exemple :**

- Limite : `1`
- Résultat : Chaque client peut utiliser le code une seule fois

**Astuce :** Par défaut, la limite est de 1 utilisation par client.

---

### Montant Minimum

Définit le montant minimum d'achat requis pour utiliser la promotion.

**Exemple :**

- Montant minimum : `10000`
- Résultat : La promotion ne s'applique que si le panier dépasse 10 000 XOF

**Quand l'utiliser :**

- Inciter à des commandes plus importantes
- Réductions importantes avec achat minimum
- Offres "dès X XOF d'achat"

---

### Application Automatique

Si activée, la promotion s'applique automatiquement sans que le client n'ait besoin d'entrer de code.

**Quand l'utiliser :**

- Promotions visibles sur tous les produits
- Soldes générales
- Promotions saisonnières automatiques

**Note :** Si désactivée, le client devra entrer le code promotionnel au checkout.

---

## 📊 Gérer les Promotions Existantes

### Modifier une Promotion

1. Trouvez la promotion dans la liste
2. Cliquez sur les **trois points** (⋮) à droite
3. Sélectionnez **"Modifier"**
4. Apportez vos modifications
5. Cliquez sur **"Enregistrer"**

**Note :** Les modifications affectent immédiatement les nouvelles commandes.

---

### Supprimer une Promotion

1. Trouvez la promotion dans la liste
2. Cliquez sur les **trois points** (⋮) à droite
3. Sélectionnez **"Supprimer"**
4. Confirmez la suppression

**⚠️ Attention :** La suppression est définitive et irréversible.

---

### Activer / Désactiver

Pour désactiver temporairement une promotion sans la supprimer :

1. Modifiez la promotion
2. Décochez **"Actif"**
3. Enregistrez

Pour la réactiver, répétez l'opération en cochant "Actif".

---

## 📈 Statistiques et Suivi

### Tableau de Bord

Sur la page des promotions, vous pouvez voir :

- **Total Promotions** : Nombre total de promotions créées
- **Actives** : Nombre de promotions actuellement actives
- **Total Utilisations** : Nombre total d'utilisations de toutes vos promotions
- **Moyenne Réduction** : Pourcentage moyen de réduction

### Détails d'une Promotion

Pour chaque promotion, vous voyez :

- **Statut** : Active / Inactive (avec badge coloré)
- **Dates** : Date de début et de fin
- **Utilisations** : Nombre d'utilisations / limite (ex: 45 / 100)
- **Code** : Le code promotionnel (si applicable)

---

## 💡 Conseils et Bonnes Pratiques

### 1. Nommez vos Promotions clairement

Utilisez des noms descriptifs qui vous permettront de les retrouver facilement :

- ✅ "Black Friday 2025 - Tous produits"
- ✅ "Promo Hiver - Catégorie Vêtements"
- ❌ "Promo 1"
- ❌ "Test"

---

### 2. Créez des Codes Mémorables

Les codes promotionnels doivent être :

- **Courts** : Faciles à retenir (ex: "WELCOME10")
- **Explicites** : Qui indiquent la promotion (ex: "SUMMER25")
- **En majuscules** : Pour faciliter la saisie

---

### 3. Définissez des Limites Appropriées

- **Limite totale** : Évitez les promos illimitées si le budget est contraint
- **Limite par client** : Limitez à 1 pour les promos importantes
- **Montant minimum** : Utilisez-le pour protéger vos marges

---

### 4. Planifiez à l'Avance

Créez vos promotions à l'avance et programmez-les avec les dates :

- Activez-les automatiquement au bon moment
- Désactivez-les automatiquement après la date de fin

---

### 5. Testez vos Promotions

Avant de lancer une promotion importante :

- Testez le code avec un petit montant
- Vérifiez que la réduction s'applique correctement
- Confirmez que les conditions fonctionnent

---

### 6. Surveillez les Statistiques

Consultez régulièrement :

- Le nombre d'utilisations
- Les produits les plus concernés
- L'impact sur vos ventes

---

## ❓ FAQ

### Puis-je créer plusieurs promotions en même temps ?

Oui, vous pouvez créer autant de promotions que vous voulez. Cependant, une seule promotion par commande peut être appliquée.

---

### Que se passe-t-il si une promotion expire pendant qu'un client est en train de commander ?

Si la date de fin est atteinte, la promotion devient inactive et ne peut plus être utilisée, même si le client a commencé sa commande.

---

### Puis-je modifier une promotion déjà utilisée ?

Oui, vous pouvez modifier une promotion à tout moment. Les modifications affectent :

- ✅ Les nouvelles commandes
- ❌ Les commandes déjà passées (non modifiables)

---

### Comment savoir si un code a été utilisé ?

Dans la liste des promotions, vous voyez le nombre d'utilisations par rapport à la limite (ex: "45 / 100").

---

### Puis-je créer une promotion sans code ?

Oui, si vous activez l'**"Application automatique"**, la promotion s'applique sans code.

---

### Les promotions fonctionnent-elles avec les produits en solde ?

Par défaut, les promotions s'appliquent aussi aux produits déjà en solde. Vous pouvez configurer cela dans les paramètres avancés (à venir).

---

### Comment désactiver temporairement une promotion ?

Modifiez la promotion et décochez "Actif". Vous pourrez la réactiver plus tard.

---

## 📞 Support

Pour toute question ou problème :

1. Consultez cette documentation
2. Contactez le support technique
3. Consultez la documentation technique pour les développeurs

---

**Dernière mise à jour :** 28 Janvier 2025  
**Version du guide :** 1.0
