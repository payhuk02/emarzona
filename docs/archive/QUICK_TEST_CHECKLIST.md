# ⚡ CHECKLIST TEST RAPIDE - PHASE 2 (5 min)

**Date** : 28 octobre 2025  
**Objectif** : Validation rapide des fonctionnalités critiques

---

## 🚀 ÉTAPE 1 : VÉRIFICATION BUILD (30 sec)

### Vercel Deploy Status
```
✅ Aller sur : https://vercel.com/payhuk02/payhula/deployments
✅ Status = "Ready" (vert)
✅ Dernier commit = "PHASE 2 Complete: Advanced Payment System"
```

### Console Browser
```
✅ Ouvrir app : https://[votre-app].vercel.app
✅ F12 → Console
✅ Pas d'erreur rouge
```

---

## 🧪 ÉTAPE 2 : TEST WIZARD PRODUIT PHYSIQUE (2 min)

1. **Accéder au wizard**
   ```
   ✅ /dashboard/products → "Créer un produit"
   ✅ Cliquer "Produit Physique"
   ```

2. **Vérifier 8 étapes**
   ```
   ✅ Étape 1 : Informations de base ✓
   ✅ Étape 2 : Variantes & Options ✓
   ✅ Étape 3 : Inventaire ✓
   ✅ Étape 4 : Expédition ✓
   ✅ Étape 5 : Affiliation ✓
   ✅ Étape 6 : SEO & FAQs ✓
   ✅ Étape 7 : Options de Paiement ⭐ NOUVEAU
   ✅ Étape 8 : Aperçu & Validation ✓
   ```

3. **Tester Étape 7**
   ```
   ✅ Aller à l'étape 7
   ✅ 3 options radio visibles :
      - Paiement Complet
      - Paiement Partiel
      - Paiement Sécurisé
   
   ✅ Sélectionner "Paiement Partiel"
   ✅ Input "Pourcentage" apparaît
   ✅ Mettre 30%
   ✅ Calcul automatique affiché (acompte / solde)
   ```

4. **Publier**
   ```
   ✅ Étape 8 → "Publier le produit"
   ✅ Toast "🎉 Produit publié !"
   ```

---

## 🧪 ÉTAPE 3 : TEST WIZARD SERVICE (1 min)

1. **Créer service**
   ```
   ✅ Nouveau produit → "Service"
   ✅ Vérifier : 8 étapes aussi
   ```

2. **Étape 7 - Options Paiement**
   ```
   ✅ Sélectionner "Paiement Sécurisé"
   ✅ Texte adapté : "à la prestation" (pas "livraison")
   ✅ Badge "Confiance +40%" visible
   ```

3. **Publier**
   ```
   ✅ Publier le service
   ✅ Succès
   ```

---

## 🧪 ÉTAPE 4 : TEST ORDERDETAIL BUTTONS (1 min)

1. **Ouvrir une commande**
   ```
   ✅ /dashboard/orders
   ✅ Cliquer sur n'importe quelle commande
   ✅ Dialog s'ouvre
   ```

2. **Vérifier boutons**
   ```
   ✅ Bouton "💬 Messagerie" (bleu, en haut)
   ✅ Bouton "💳 Gérer Paiements" (si payment_type avancé)
   ✅ Bouton "🚨 Ouvrir litige" (rouge, en bas)
   ```

3. **Test click Messagerie**
   ```
   ✅ Cliquer "Messagerie"
   ✅ Navigation → /orders/[orderId]/messaging
   ✅ Page charge (même si vide)
   ```

4. **Test click Paiements** (si visible)
   ```
   ✅ Revenir, cliquer "Gérer Paiements"
   ✅ Navigation → /payments/[orderId]/manage
   ✅ Page charge
   ```

---

## 🧪 ÉTAPE 5 : VÉRIFICATION BASE DE DONNÉES (30 sec)

### SQL Quick Check
Exécuter dans Supabase SQL Editor :

```sql
-- Check 1: Colonne payment_options existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'payment_options';

-- ✅ Résultat attendu : 1 ligne

-- Check 2: Produits créés avec payment_options
SELECT 
  name,
  payment_options->>'payment_type' as payment_type,
  payment_options->>'percentage_rate' as percentage_rate
FROM products
WHERE payment_options IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;

-- ✅ Résultat attendu : Au moins 2 produits (physical + service)
```

---

## ✅ RÉSULTAT FINAL

### Critères de Succès
```
✅ Build Vercel OK
✅ Wizard Physical 8 étapes
✅ Wizard Service 8 étapes
✅ Étape 7 paiement fonctionne
✅ OrderDetail boutons présents
✅ Navigation fonctionne
✅ DB payment_options OK
```

### Si TOUS ✅ → **TEST RÉUSSI** 🎉

### Si ❌ quelque part → Voir `TESTING_GUIDE_PHASE2.md` pour debug détaillé

---

## 🎯 PROCHAINE ÉTAPE

Une fois ce test rapide validé :

**A)** 📚 Créer documentation utilisateur  
**B)** 🎨 Améliorer UI/UX (animations, feedbacks)  
**C)** 🧪 Tests E2E complets (Playwright)  
**D)** 🚀 Déployer en production  
**E)** ⏸️ Pause ici

---

**Temps total** : ~5 minutes  
**Niveau** : Basique (validation rapide)  
**Détails complets** : Voir `TESTING_GUIDE_PHASE2.md`

