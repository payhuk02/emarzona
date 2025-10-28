# ✅ TESTS VISUELS - PHASE 2 & 3
**Date** : 28 octobre 2025  
**Temps estimé** : 30-45 minutes  
**Objectif** : Valider visuellement toutes les améliorations UX et Mobile

---

## 🎯 SCÉNARIOS DE TEST

### SCÉNARIO 1 : Création Produit Physique avec Paiement Partiel (10 min)

#### Actions
1. **Navigation** : `/products/create`
2. **Sélectionner** : "Produit Physique"
3. **Remplir** :
   - Étape 1 : Nom "Test Laptop", Prix "500000 XOF"
   - Étape 2 : Catégorie "Électronique"
   - Étape 3 : Variantes (optionnel, skip)
   - Étape 4 : Stock "10"
   - Étape 5 : Livraison "2000 XOF"
   - Étape 6 : Affiliation (skip)
   - Étape 7 : **Options de Paiement** → Sélectionner "Paiement Partiel"

#### ✅ Vérifications - Desktop (1920px)

- [ ] Les 3 options de paiement s'affichent correctement (Full, Partiel, Escrow)
- [ ] Radio buttons sont cliquables
- [ ] Badge "+30% conversions" visible sur Paiement Partiel
- [ ] Input pourcentage fonctionne (min 10%, max 90%)
- [ ] Calcul automatique acompte/solde correct
  - **Exemple** : 50% de 500,000 = Acompte 250,000 | Solde 250,000
- [ ] Grid 2 colonnes pour acompte/solde (desktop)
- [ ] Pas de scroll horizontal
- [ ] Boutons "Précédent" et "Suivant" visibles

#### ✅ Vérifications - Mobile (375px)

- [ ] Options de paiement empilées verticalement
- [ ] Radio buttons assez grands (min 20px)
- [ ] Touch-friendly (touch-manipulation CSS)
- [ ] Grid 1 colonne pour acompte/solde (mobile)
- [ ] Input pourcentage responsive
- [ ] Textes lisibles sans zoom
- [ ] Badges visibles
- [ ] Pas de débordement horizontal

#### ✅ Vérifications - Tablet (768px)

- [ ] Transition desktop/mobile fluide
- [ ] Grid 2 colonnes pour acompte/solde

#### ✅ Sauvegarde en Base de Données

4. **Cliquer** : "Publier le produit"
5. **Vérifier dans Supabase** :
   ```sql
   SELECT 
     name, 
     price, 
     payment_options 
   FROM products 
   WHERE name = 'Test Laptop';
   
   -- Attendu:
   -- payment_options = {"payment_type": "percentage", "percentage_rate": 50}
   ```

- [ ] Produit créé avec `payment_options` correct
- [ ] Type = "percentage"
- [ ] Percentage_rate = 50 (ou valeur choisie)

---

### SCÉNARIO 2 : Création Service avec Paiement Escrow (10 min)

#### Actions
1. **Navigation** : `/products/create`
2. **Sélectionner** : "Service"
3. **Remplir** :
   - Étape 1 : Nom "Test Consultation", Prix "75000 XOF"
   - Étape 2 : Durée "1 heure", Type "individuel"
   - Étape 3 : Staff (skip ou créer un staff)
   - Étape 4 : Disponibilités (skip ou ajouter créneaux)
   - Étape 5 : Prix confirmé "75000"
   - Étape 6 : Affiliation (skip)
   - Étape 7 : **Options de Paiement** → Sélectionner "Paiement Sécurisé (Escrow)"

#### ✅ Vérifications UI

- [ ] Option Escrow affichée avec icône Shield (bouclier)
- [ ] Badge "Sécurité maximale" visible
- [ ] Texte explicatif clair : "Fonds retenus jusqu'à confirmation de prestation"
- [ ] Message de sécurité (7 jours auto-release) visible
- [ ] Pas d'input supplémentaire (escrow = 100% retenu)

#### ✅ Mobile/Tablet

- [ ] Même qualité qu'en desktop
- [ ] Touch-friendly
- [ ] Texte lisible

#### ✅ Sauvegarde

4. **Cliquer** : "Publier le service"
5. **Vérifier dans Supabase** :
   ```sql
   SELECT 
     name, 
     price, 
     payment_options 
   FROM products 
   WHERE name = 'Test Consultation';
   
   -- Attendu:
   -- payment_options = {"payment_type": "delivery_secured"}
   ```

- [ ] Service créé avec `payment_options` correct
- [ ] Type = "delivery_secured"

---

### SCÉNARIO 3 : OrderDetailDialog - Badges & Unread Count (10 min)

#### Actions

1. **Créer une commande test** (manuellement ou via achat)
   - Produit : "Test Laptop" (paiement partiel 50%)
   - Montant total : 500,000 XOF
   
2. **Naviguer** : `/orders`
3. **Cliquer** sur une commande pour ouvrir `OrderDetailDialog`

#### ✅ Vérifications - Payment Type Section

- [ ] **Section "Type de Paiement"** visible après le Total
- [ ] Badge "Paiement Partiel (50%)" affiché avec icône Percent
- [ ] Couleur badge : Bleu (bg-blue-600)

#### ✅ Vérifications - Détails Paiement Partiel

- [ ] Card bleue (bg-blue-50 / dark:bg-blue-950)
- [ ] **Acompte payé** : 250,000 XOF (en bleu)
- [ ] **Solde restant** : 250,000 XOF (en orange)
- [ ] Bouton "Payer le solde" visible et fonctionnel

#### ✅ Vérifications - Unread Messages Badge

4. **Envoyer un message** dans `/orders/{orderId}/messaging`
5. **Retourner** à OrderDetailDialog

- [ ] Badge rouge avec compteur visible sur bouton "Messagerie"
- [ ] Nombre correct de messages non lus
- [ ] Badge disparaît quand messages marqués comme lus

#### ✅ Mobile

- [ ] Boutons empilés sur petits écrans
- [ ] Badges lisibles
- [ ] Cards responsive

---

### SCÉNARIO 4 : PaymentManagement - Countdown Timer (10 min)

#### Setup : Créer Secured Payment

1. **Dans Supabase SQL Editor** :
   ```sql
   -- Créer un secured_payment de test
   INSERT INTO secured_payments (
     order_id, 
     total_amount, 
     held_amount, 
     status, 
     hold_reason,
     held_until,
     release_conditions
   ) VALUES (
     (SELECT id FROM orders LIMIT 1), -- Prendre une commande existante
     100000,
     100000,
     'held',
     'delivery_confirmation',
     NOW() + INTERVAL '2 hours', -- Expire dans 2h
     '{"requires_delivery_confirmation": true, "auto_release_days": 7}'::jsonb
   );
   ```

#### Actions

2. **Naviguer** : `/payments/{orderId}/manage`
3. **Tab** : "Paiements Sécurisés"

#### ✅ Vérifications - Countdown Timer

- [ ] Card "Paiement Escrow" visible
- [ ] Date "Retenu jusqu'à" affichée
- [ ] **Section jaune** avec countdown timer visible
- [ ] Text: "Libération automatique dans :"
- [ ] **Countdown** : Format "X heures, Y minutes, Z secondes"
- [ ] Icône Clock visible
- [ ] Couleur texte : Orange/Yellow si < 24h, Gris sinon
- [ ] Timer se met à jour chaque seconde

#### ✅ Vérifications - Auto-Complete

4. **Modifier la date** pour expiration immédiate :
   ```sql
   UPDATE secured_payments 
   SET held_until = NOW() - INTERVAL '1 minute'
   WHERE status = 'held';
   ```

5. **Attendre 5-10 secondes**

- [ ] Toast notification "Paiement libéré automatiquement" s'affiche
- [ ] Countdown affiche "Expiré"
- [ ] Couleur rouge pour countdown expiré
- [ ] QueryClient invalide et re-fetch les données

#### ✅ Mobile

- [ ] Countdown lisible
- [ ] Card jaune responsive
- [ ] Pas de débordement

---

## 🐛 BUGS POTENTIELS À SURVEILLER

### 1. PaymentOptionsForm

- **Bug** : Grid ne passe pas en 1 colonne sur mobile
- **Cause** : Manque `sm:` prefix
- **Solution** : Vérifier `grid-cols-1 sm:grid-cols-2`

### 2. OrderDetailDialog

- **Bug** : Badge unread count ne se met pas à jour
- **Cause** : `refetchInterval` trop long
- **Solution** : Vérifier hook `useUnreadCount` (5s refetch)

### 3. CountdownTimer

- **Bug** : Timer ne démarre pas
- **Cause** : Format date incorrect
- **Solution** : Vérifier `new Date(targetDate).getTime()`

- **Bug** : onComplete ne se déclenche pas
- **Cause** : Condition `difference <= 0` non atteinte
- **Solution** : Vérifier logic dans `useEffect`

### 4. Mobile Touch

- **Bug** : Radio buttons difficiles à cliquer
- **Cause** : Trop petits
- **Solution** : Vérifier `min-w-[20px] min-h-[20px]`

---

## 📊 ANALYTICS TRACKING VÉRIFICATION

### Test Analytics Events

1. **Ouvrir DevTools** → Console
2. **Créer un produit** avec paiement partiel
3. **Vérifier** dans console :
   ```javascript
   // Doit logger:
   {
     event: 'payment_option_selected',
     payment_type: 'percentage',
     product_price: 500000,
     product_type: 'physical',
     percentage_rate: 50
   }
   ```

4. **Vérifier dans Supabase** :
   ```sql
   SELECT * FROM product_analytics 
   WHERE event_type = 'payment_option_selected'
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

- [ ] Event "payment_option_selected" tracké
- [ ] Metadata correcte (price, type, etc.)
- [ ] Timestamp correct

---

## ✅ CHECKLIST FINALE

### Desktop (1920px)
- [ ] PaymentOptionsForm - 3 options visibles
- [ ] OrderDetailDialog - Badges payment type
- [ ] PaymentManagement - Countdown timer
- [ ] Analytics tracking fonctionnel

### Mobile (375px)
- [ ] PaymentOptionsForm - Grid 1 colonne
- [ ] PaymentOptionsForm - Touch-friendly
- [ ] OrderDetailDialog - Boutons empilés
- [ ] PaymentManagement - Countdown responsive

### Tablet (768px)
- [ ] Transition fluide desktop/mobile
- [ ] Tous éléments lisibles

### Fonctionnel
- [ ] Sauvegarde payment_options en DB
- [ ] Calculs acompte/solde corrects
- [ ] Unread count messages précis
- [ ] Countdown timer temps réel
- [ ] Auto-complete notification toast

### Performance
- [ ] Pas de lag lors sélection payment option
- [ ] Countdown ne ralentit pas la page
- [ ] Unread count refetch toutes les 5s max

---

## 🎉 SI TOUS LES TESTS PASSENT

**Résultat** : 99% FONCTIONNEL ✅

**Prêt pour** :
1. ✅ Git commit + push
2. ✅ Deploy Vercel
3. ✅ Tests utilisateurs beta

**Prochaine étape** :
- Phase 4 : Déploiement
- Phase 5 : Monitoring + Feedback utilisateurs

---

## 📝 RAPPORT DE BUGS (À remplir)

Si bugs trouvés, documenter ici :

| # | Scénario | Bug | Sévérité | Status |
|---|----------|-----|----------|--------|
| 1 |          |     |          |        |
| 2 |          |     |          |        |
| 3 |          |     |          |        |

**Temps total tests** : _____ minutes  
**Bugs trouvés** : _____ / 4 scénarios  
**Taux de réussite** : _____ %

---

**Bon tests ! 🚀**

