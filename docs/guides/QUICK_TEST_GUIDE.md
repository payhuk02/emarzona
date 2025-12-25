# 🧪 GUIDE DE TEST RAPIDE - 15 minutes
**Date** : 28 octobre 2025  
**Objectif** : Valider les nouvelles pages créées

---

## 🚀 SETUP (2 min)

### 1. Créer les données de test
```sql
-- Dans Supabase SQL Editor :
-- Copier/coller le contenu de scripts/create-test-data.sql
-- Exécuter
-- ✅ Vérifier "Données de test créées avec succès !"
```

### 2. Lancer l'application
```bash
npm run dev
# ✅ App démarre sur http://localhost:5173
```

---

## ✅ TEST 1 : PhysicalProductDetail (5 min)

### URL
```
http://localhost:5173/physical/test-physical-001
```

### Checklist Rapide
- [ ] **Page charge sans erreur** (F12 console = 0 erreur)
- [ ] **ProductImages galerie affichée** (4 images)
- [ ] **Clic thumbnail** → change image principale ✅
- [ ] **Clic bouton "Expand"** → ouvre lightbox ✅
- [ ] **Dans lightbox** : clic image → zoom in/out ✅
- [ ] **Navigation arrows** fonctionnent (prev/next) ✅
- [ ] **Close lightbox** fonctionne (X ou Escape) ✅
- [ ] **StockLevelIndicator** affiché avec couleur :
  - Variante "S - Bleu" (10 stock) → Badge vert "En stock"
  - Variante "M - Rouge" (5 stock) → Badge orange "Stock faible"
  - Variante "L - Vert" (0 stock) → Badge rouge "Rupture"
- [ ] **Sélection variante** fonctionne
- [ ] **Quantité +/-** fonctionne (limité par stock)
- [ ] **Bouton "Ajouter au panier"** → Toast success ✅
- [ ] **Mobile responsive** (resize à 375px) :
  - Grid 1 colonne
  - Images responsive
  - Thumbnails 4 colonnes
  - Boutons touch-friendly

### ⚡ Test Rapide (1 min)
1. Ouvrir page
2. Cliquer 2ème thumbnail
3. Cliquer "Expand"
4. Zoom in (clic image)
5. Navigation arrow droite
6. Close lightbox
7. **✅ = PASS**

---

## ✅ TEST 2 : ServiceDetail (5 min)

### URL
```
http://localhost:5173/service/test-service-001
```

### Checklist Rapide
- [ ] **Page charge sans erreur**
- [ ] **Image service** affichée (coiffure)
- [ ] **Détails service** :
  - Durée : 60 minutes
  - Participants : 1
  - Lieu affiché
  - Type : Individuel
- [ ] **Staff section** "Notre équipe" :
  - **2 StaffCard affichées** (Marie Dupont, Sophie Martin)
  - **Variant compact** utilisé
  - **Grid 2 colonnes** desktop
  - **Avatars** affichés (ou initiales MD, SM)
  - **Status indicator** vert (disponible)
  - **Role/specialty** affiché
  - **Bio** affichée (tronquée si longue)
- [ ] **Booking card** sticky (reste visible en scroll)
- [ ] **ServiceCalendar** affiché
- [ ] **Sélection date** fonctionne
- [ ] **TimeSlotPicker** affiche créneaux (9h-17h)
- [ ] **Sélection créneau** fonctionne
- [ ] **Prix total** = 25,000 XOF
- [ ] **Bouton "Réserver"** :
  - Désactivé si date/créneau manquant
  - Activé si complet
- [ ] **Mobile responsive** (resize à 375px) :
  - Cards empilées
  - Staff grid 1 colonne
  - Booking card en bas (pas sticky)

### ⚡ Test Rapide (1 min)
1. Ouvrir page
2. Scroll → vérifier staff cards (2)
3. Vérifier avatars + status
4. Sélectionner date calendrier
5. Choisir créneau 10:00
6. **✅ = PASS**

---

## ✅ TEST 3 : PayBalance (3 min)

### URL
```
http://localhost:5173/payments/test-order-001/balance
```

### Checklist Rapide
- [ ] **Page charge sans erreur**
- [ ] **Breakdown paiement** affiché :
  - Montant total : 100,000 XOF (bleu)
  - Acompte payé : 30,000 XOF (vert) + badge "30%"
  - Solde restant : 70,000 XOF (orange)
- [ ] **Articles commandés** :
  - T-Shirt Premium × 2
  - Prix affiché
- [ ] **Informations client** :
  - Nom : Jean Test
  - Email : jean.test@example.com
  - Téléphone : +22612345678
- [ ] **Bouton "Payer le solde"** :
  - Montant : 70,000 XOF
  - Couleur primaire
  - Icon CreditCard
- [ ] **Alert sécurité** visible
- [ ] **Mobile responsive** :
  - Breakdown empilé (1 col)
  - Texte lisible
  - Bouton full-width

### ⚡ Test Rapide (30 sec)
1. Ouvrir page
2. Vérifier breakdown (3 sections)
3. Vérifier calcul 30% correct
4. **✅ = PASS**

---

## 📊 RÉSULTAT ATTENDU

### Si tout passe ✅
```
✅ PhysicalProductDetail
  - ProductImages galerie : OK
  - Lightbox + zoom : OK
  - StockLevelIndicator : OK
  - Variantes : OK
  - Responsive : OK

✅ ServiceDetail
  - StaffCard (2) : OK
  - Status indicator : OK
  - Avatars : OK
  - Booking : OK
  - Responsive : OK

✅ PayBalance
  - Breakdown : OK
  - Calcul % : OK
  - Client info : OK
  - Responsive : OK

🎉 VALIDATION COMPLÈTE - Prêt pour Phase B !
```

### Si erreurs ❌
- Noter l'erreur exacte (console F12)
- Screenshot si bug visuel
- Page concernée
- → Correction avant Phase B

---

## 🐛 BUGS FRÉQUENTS

| Problème | Cause probable | Solution |
|----------|----------------|----------|
| Images ne chargent pas | URLs Unsplash bloquées | Vérifier réseau / remplacer URLs |
| Staff cards vides | Données pas créées | Relancer script SQL |
| Lightbox ne s'ouvre pas | Dialog component | Vérifier import Dialog |
| Stock indicator absent | Variantes pas créées | Vérifier inventaire table |
| Calendrier vide | Availabilities manquantes | Vérifier service_availability |

---

## ⏱️ TIMING

- **Setup** : 2 min
- **Test 1** : 5 min
- **Test 2** : 5 min
- **Test 3** : 3 min
- **Total** : **15 min** ⚡

---

## 🎯 APRÈS VALIDATION

Si tous les tests passent → **Continuer Phase B (ServiceCalendar)**

Si bugs trouvés → **Corriger puis continuer**

---

**Prêt ? GO ! 🚀**

