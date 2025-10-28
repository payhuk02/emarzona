# 🧪 GUIDE DE TEST - PHASE 2 : ADVANCED PAYMENT SYSTEM

**Date** : 28 octobre 2025  
**Version** : 2.0  
**Testeur** : _____________

---

## 📋 CHECKLIST GLOBALE

- [ ] Migration SQL appliquée (payment_options)
- [ ] Build Vercel réussi
- [ ] Aucune erreur console
- [ ] Tests Physical Products
- [ ] Tests Service Products
- [ ] Tests Messagerie
- [ ] Tests Paiements
- [ ] Tests Litiges

---

## 🔧 PRÉREQUIS

### Vérifications Initiales
1. **Base de données**
   ```sql
   -- Vérifier que la colonne existe
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'products' 
   AND column_name = 'payment_options';
   ```
   ✅ Résultat attendu : `payment_options | jsonb`

2. **Vercel Build**
   - Aller sur : https://vercel.com/[votre-projet]/deployments
   - Vérifier : Status = "Ready" ✅
   - Check logs : 0 erreur TypeScript

3. **Console Browser**
   - Ouvrir DevTools (F12)
   - Onglet Console
   - ✅ Pas d'erreur rouge

---

## 🧪 TEST 1 : CRÉATION PRODUIT PHYSIQUE (Paiement Partiel)

### 1.1 - Accès Wizard
- [ ] Aller sur `/dashboard/products`
- [ ] Cliquer "Créer un produit"
- [ ] Sélectionner "Produit Physique"
- [ ] ✅ Wizard affiche "8 étapes"

### 1.2 - Étapes 1-6 (Standard)
- [ ] **Étape 1** : Remplir infos de base (nom, prix, image)
- [ ] **Étape 2** : Variantes (optionnel, skip)
- [ ] **Étape 3** : Inventaire (SKU, stock)
- [ ] **Étape 4** : Expédition (poids, dimensions)
- [ ] **Étape 5** : Affiliation (skip ou activer)
- [ ] **Étape 6** : SEO & FAQs (skip)

### 1.3 - Étape 7 : OPTIONS DE PAIEMENT ⭐
- [ ] ✅ Étape 7 existe et s'affiche
- [ ] ✅ Titre : "Options de Paiement"
- [ ] ✅ 3 options visibles :
  - [ ] **Paiement Complet** (radio button)
  - [ ] **Paiement Partiel** (radio button)
  - [ ] **Paiement Sécurisé** (radio button)

#### Test Paiement Partiel
- [ ] Sélectionner "Paiement Partiel"
- [ ] ✅ Input "Pourcentage d'acompte" apparaît
- [ ] Entrer : `50%`
- [ ] ✅ Calcul automatique affiché :
  - Acompte (maintenant) : 50% du prix
  - Solde (plus tard) : 50% du prix
- [ ] ✅ Badge "🔵 +30% conversions" visible
- [ ] ✅ Recommandations affichées

### 1.4 - Étape 8 : Aperçu & Validation
- [ ] Vérifier aperçu complet
- [ ] Cliquer "Publier le produit"
- [ ] ✅ Toast : "🎉 Produit publié !"
- [ ] ✅ Redirection vers `/dashboard/products`

### 1.5 - Vérification Base de Données
```sql
SELECT 
  id, 
  name, 
  price,
  payment_options
FROM products 
WHERE product_type = 'physical'
ORDER BY created_at DESC 
LIMIT 1;
```
✅ Résultat attendu :
```json
{
  "payment_type": "percentage",
  "percentage_rate": 50
}
```

---

## 🧪 TEST 2 : CRÉATION SERVICE (Paiement Escrow)

### 2.1 - Accès Wizard Service
- [ ] Créer un nouveau produit
- [ ] Sélectionner "Service"
- [ ] ✅ Wizard affiche "8 étapes"

### 2.2 - Étapes 1-6 (Standard)
- [ ] **Étape 1** : Infos de base (ex: "Consultation Marketing")
- [ ] **Étape 2** : Durée & Disponibilité
- [ ] **Étape 3** : Personnel & Ressources
- [ ] **Étape 4** : Tarification & Options
- [ ] **Étape 5** : Affiliation (skip)
- [ ] **Étape 6** : SEO & FAQs (skip)

### 2.3 - Étape 7 : OPTIONS DE PAIEMENT ⭐
- [ ] Sélectionner "Paiement Sécurisé (à la prestation)"
- [ ] ✅ Texte adapté pour services :
  - "L'argent est retenu jusqu'à confirmation de la prestation"
  - "Après prestation confirmée : transfert au vendeur"
- [ ] ✅ Badge "🟡 Confiance +40%" visible
- [ ] ✅ Montant total affiché (retenu en escrow)

### 2.4 - Publication
- [ ] **Étape 8** : Publier
- [ ] ✅ Toast succès
- [ ] ✅ Service visible dans la liste

### 2.5 - Vérification DB
```sql
SELECT 
  name, 
  price,
  payment_options->>'payment_type' as payment_type
FROM products 
WHERE product_type = 'service'
ORDER BY created_at DESC 
LIMIT 1;
```
✅ Résultat : `payment_type = "delivery_secured"`

---

## 🧪 TEST 3 : PASSAGE COMMANDE (Physical - Paiement Partiel)

### 3.1 - Simuler Achat Client
- [ ] Se déconnecter (ou mode incognito)
- [ ] Aller sur page produit physique créé
- [ ] Cliquer "Acheter"
- [ ] Remplir formulaire client :
  - Email
  - Nom
  - Adresse de livraison

### 3.2 - Vérifier Montant
- [ ] ✅ Montant affiché = **50% du prix** (acompte)
- [ ] ✅ Texte : "Acompte 50% : [Nom produit]"
- [ ] ✅ Message : "Solde restant : [montant] XOF"

### 3.3 - Checkout Moneroo
- [ ] Redirection vers Moneroo
- [ ] ✅ Montant Moneroo = acompte (50%)
- [ ] ✅ Description correcte

### 3.4 - Vérification Order DB
```sql
SELECT 
  order_number,
  total_amount,
  payment_type,
  percentage_paid,
  remaining_amount
FROM orders 
ORDER BY created_at DESC 
LIMIT 1;
```
✅ Vérifier :
- `payment_type = 'percentage'`
- `percentage_paid = 50% du total_amount`
- `remaining_amount = 50% du total_amount`

---

## 🧪 TEST 4 : PASSAGE COMMANDE (Service - Escrow)

### 4.1 - Réserver Service
- [ ] Page service créé
- [ ] Sélectionner créneau
- [ ] Cliquer "Réserver"
- [ ] Remplir infos client

### 4.2 - Vérifier Montant
- [ ] ✅ Montant = **100% du prix** (mais retenu)
- [ ] ✅ Texte : "Paiement sécurisé : [Nom service]"
- [ ] ✅ Info : "Fonds retenus jusqu'à confirmation prestation"

### 4.3 - Checkout Moneroo
- [ ] Redirection Moneroo
- [ ] ✅ Montant = 100%
- [ ] ✅ Description avec "Paiement sécurisé"

### 4.4 - Vérification Secured Payment
```sql
SELECT 
  o.order_number,
  o.payment_type,
  sp.status,
  sp.held_amount,
  sp.hold_reason
FROM orders o
LEFT JOIN secured_payments sp ON sp.order_id = o.id
WHERE o.payment_type = 'delivery_secured'
ORDER BY o.created_at DESC 
LIMIT 1;
```
✅ Vérifier :
- `status = 'held'`
- `held_amount = total du service`
- `hold_reason = 'service_completion'`

---

## 🧪 TEST 5 : ORDERDETAIL - BOUTONS ACTIONS

### 5.1 - Accéder OrderDetail
- [ ] Aller sur `/dashboard/orders`
- [ ] Cliquer sur une commande
- [ ] ✅ Dialog s'ouvre

### 5.2 - Vérifier Boutons Affichés
- [ ] ✅ Bouton **"💬 Messagerie"** (bleu, prominent)
- [ ] ✅ Bouton **"💳 Gérer Paiements"** (si payment_type ≠ full)
- [ ] ✅ Bouton **"🚨 Ouvrir litige"** (rouge, outline)
- [ ] ✅ Boutons "Fermer" et "Imprimer" (secondaires)

### 5.3 - Test Click Messagerie
- [ ] Cliquer "Messagerie"
- [ ] ✅ Navigation vers `/orders/[orderId]/messaging`
- [ ] ✅ Page charge correctement
- [ ] ✅ Zone de chat visible

### 5.4 - Test Click Gérer Paiements
- [ ] Revenir à OrderDetail
- [ ] Cliquer "Gérer Paiements"
- [ ] ✅ Navigation vers `/payments/[orderId]/manage`
- [ ] ✅ Page charge correctement
- [ ] ✅ Infos paiement affichées

### 5.5 - Test Click Ouvrir Litige
- [ ] Revenir à OrderDetail
- [ ] Cliquer "Ouvrir litige"
- [ ] ✅ Navigation vers `/disputes/create?order_id=[orderId]`

---

## 🧪 TEST 6 : MESSAGERIE COMPLÈTE

### 6.1 - Interface Messagerie
URL : `/orders/[orderId]/messaging`

- [ ] ✅ Sidebar conversations (gauche)
- [ ] ✅ Thread messages (droite)
- [ ] ✅ Input message visible
- [ ] ✅ Boutons upload (📎 Image, Vidéo, Fichier)

### 6.2 - Envoyer Message Texte
- [ ] Taper un message test
- [ ] Cliquer "Envoyer"
- [ ] ✅ Message apparaît immédiatement
- [ ] ✅ Avatar + nom expéditeur correct
- [ ] ✅ Timestamp affiché

### 6.3 - Upload Fichier
- [ ] Cliquer icône 📎
- [ ] Sélectionner une image
- [ ] ✅ Preview fichier s'affiche
- [ ] Envoyer
- [ ] ✅ Message avec image visible
- [ ] ✅ Image cliquable (preview fullscreen)

### 6.4 - Temps Réel (optionnel)
- [ ] Ouvrir 2 onglets (vendeur + client)
- [ ] Envoyer message depuis onglet 1
- [ ] ✅ Message apparaît dans onglet 2 (temps réel)

### 6.5 - Vérification DB
```sql
SELECT 
  c.id,
  c.status,
  COUNT(m.id) as message_count
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.order_id = '[orderId]'
GROUP BY c.id;
```
✅ Vérifier : messages créés correctement

---

## 🧪 TEST 7 : GESTION PAIEMENTS

### 7.1 - Page Payment Management
URL : `/payments/[orderId]/manage`

- [ ] ✅ Stats cards affichées :
  - Total à payer
  - Montant retenu
  - Paiements partiels
  - Paiements sécurisés

### 7.2 - Tab Paiements Sécurisés
- [ ] ✅ Liste des secured_payments
- [ ] ✅ Statut "🟡 Retenu" visible
- [ ] ✅ Montant retenu affiché
- [ ] ✅ Conditions de libération affichées

### 7.3 - Actions Vendeur (si applicable)
- [ ] Bouton "🔓 Relâcher paiement"
- [ ] Click → Confirmation dialog
- [ ] Confirmer
- [ ] ✅ Statut change à "Released"
- [ ] ✅ Toast succès

### 7.4 - Tab Paiements Partiels
- [ ] ✅ Progress bar acompte/solde
- [ ] ✅ Pourcentage payé visible
- [ ] ✅ Montant restant affiché
- [ ] ✅ Bouton "Payer le solde" (côté client)

---

## 🧪 TEST 8 : SYSTÈME LITIGES

### 8.1 - Page Dispute Detail
URL : `/disputes/[disputeId]`

- [ ] ✅ Infos litige affichées :
  - Raison
  - Statut
  - Initiateur
- [ ] ✅ Lien vers commande
- [ ] ✅ Timeline messages

### 8.2 - Envoyer Message Litige
- [ ] Input message visible
- [ ] Taper message
- [ ] Upload preuve (image)
- [ ] Envoyer
- [ ] ✅ Message + preuve affichés

### 8.3 - Actions Admin (si admin)
- [ ] Bouton "Résoudre litige" visible
- [ ] Click → Dialog résolution
- [ ] Choisir résolution (vendeur/client)
- [ ] Confirmer
- [ ] ✅ Statut change à "Resolved"

### 8.4 - Vérification DB
```sql
SELECT 
  d.id,
  d.status,
  d.reason,
  COUNT(m.id) as message_count
FROM disputes d
LEFT JOIN messages m ON m.conversation_id = d.conversation_id
GROUP BY d.id;
```

---

## 🧪 TEST 9 : RESPONSIVE MOBILE

### 9.1 - PaymentOptionsForm
- [ ] Ouvrir sur mobile (DevTools → 375px)
- [ ] ✅ Radio buttons empilés verticalement
- [ ] ✅ Calculs lisibles
- [ ] ✅ Badges visibles
- [ ] ✅ Pas de scroll horizontal

### 9.2 - OrderDetailDialog
- [ ] Ouvrir dialog sur mobile
- [ ] ✅ Boutons empilés (grid-cols-1 sm:grid-cols-2)
- [ ] ✅ Tous cliquables
- [ ] ✅ Texte lisible

### 9.3 - Messagerie Mobile
- [ ] Page messaging sur 375px
- [ ] ✅ Conversations en sidebar collapsible
- [ ] ✅ Thread messages scrollable
- [ ] ✅ Input fixe en bas
- [ ] ✅ Upload buttons accessibles

---

## 🧪 TEST 10 : EDGE CASES

### 10.1 - Paiement Partiel 0%
- [ ] Créer produit avec percentage_rate = 10 (minimum)
- [ ] ✅ Validation : accepte 10%
- [ ] Essayer 5%
- [ ] ✅ Validation : refuse < 10%

### 10.2 - Paiement Partiel 100%
- [ ] Essayer percentage_rate = 95 (maximum)
- [ ] ✅ Validation : accepte 90%
- [ ] Essayer 100%
- [ ] ✅ Validation : refuse > 90%

### 10.3 - Commande Sans Payment Options
- [ ] Créer produit SANS modifier step 7 (laisser default)
- [ ] Acheter ce produit
- [ ] ✅ payment_type = 'full' en DB
- [ ] ✅ Pas de bouton "Gérer Paiements" dans OrderDetail
- [ ] ✅ Montant Moneroo = 100% du prix

### 10.4 - Messagerie Sans Conversation
- [ ] Aller sur `/orders/[orderId]/messaging` (order sans conversation)
- [ ] ✅ Message "Aucune conversation"
- [ ] ✅ Pas d'erreur console

---

## 📊 RÉSULTATS ATTENDUS

### ✅ Succès Total
- [ ] **100% des tests passés**
- [ ] 0 erreur console
- [ ] 0 erreur SQL
- [ ] UI responsive parfaite
- [ ] Workflow fluide

### ⚠️ Problèmes Potentiels
Si tests échouent, vérifier :

1. **Migration non appliquée**
   ```sql
   -- Réappliquer
   \i supabase/migrations/20251028_product_payment_options.sql
   ```

2. **Cache Browser**
   - Ctrl + Shift + R (hard refresh)
   - Vider cache

3. **Vercel Build Failed**
   - Check logs Vercel
   - Vérifier TypeScript errors

4. **RLS Policies**
   - Vérifier que l'user a accès à `products`, `orders`, etc.

---

## 🎯 PROCHAINES ACTIONS

Si tous les tests passent ✅ :
- [ ] Documenter features (README)
- [ ] Créer vidéo démo
- [ ] Former équipe support
- [ ] Lancer en production

Si problèmes ❌ :
- [ ] Noter erreurs spécifiques
- [ ] Créer issues GitHub
- [ ] Corriger + re-test

---

**Date du test** : __________  
**Testeur** : __________  
**Résultat global** : ✅ PASS / ❌ FAIL  
**Notes** :

