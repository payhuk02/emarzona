# 🧪 GUIDE DE TESTS VISUELS - Phase 1
**Date** : 28 octobre 2025  
**Pages à tester** : PhysicalProductDetail, ServiceDetail, PayBalance  
**Durée estimée** : 20-30 minutes

---

## 🎯 OBJECTIFS

- ✅ Valider que les nouvelles pages s'affichent correctement
- ✅ Tester la responsivité mobile/desktop
- ✅ Vérifier les interactions (clics, sélections)
- ✅ Identifier bugs visuels ou d'ergonomie
- ✅ Confirmer intégration composants

---

## 📱 TEST 1 : PhysicalProductDetail Page

### Setup (Prérequis)
```sql
-- Dans Supabase SQL Editor, créer un produit physique de test
INSERT INTO products (id, name, description, price, currency, category, store_id, type)
VALUES 
  ('test-physical-001', 'T-Shirt Premium', 'Un t-shirt de qualité supérieure', 15000, 'XOF', 'Vêtements', 'YOUR_STORE_ID', 'physical');

INSERT INTO physical_products (id, product_id, weight_kg, dimensions_cm, sku, brand)
VALUES 
  (gen_random_uuid(), 'test-physical-001', 0.25, '{"length": 30, "width": 25, "height": 2}', 'TSH-PRM-001', 'Premium Wear');

INSERT INTO product_variants (id, physical_product_id, name, sku, price_modifier, stock_quantity)
VALUES 
  (gen_random_uuid(), (SELECT id FROM physical_products WHERE product_id = 'test-physical-001'), 'S - Bleu', 'TSH-PRM-001-S-BL', 0, 10),
  (gen_random_uuid(), (SELECT id FROM physical_products WHERE product_id = 'test-physical-001'), 'M - Rouge', 'TSH-PRM-001-M-RD', 500, 5),
  (gen_random_uuid(), (SELECT id FROM physical_products WHERE product_id = 'test-physical-001'), 'L - Vert', 'TSH-PRM-001-L-GR', 1000, 0);

INSERT INTO inventory (id, physical_product_id, variant_id, quantity, reorder_point)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM physical_products WHERE product_id = 'test-physical-001'),
  pv.id,
  pv.stock_quantity,
  3
FROM product_variants pv
WHERE pv.physical_product_id = (SELECT id FROM physical_products WHERE product_id = 'test-physical-001');
```

### Navigation
1. Aller sur `http://localhost:5173/physical/test-physical-001`
2. La page doit se charger sans erreur

### Vérifications Desktop (≥768px)

#### ✅ Layout
- [ ] Grid 2 colonnes (image gauche, infos droite)
- [ ] Images occupent ~50% largeur
- [ ] Infos produit occupent ~50% largeur
- [ ] Pas de débordement horizontal

#### ✅ Images
- [ ] Image principale affichée (ou placeholder si null)
- [ ] Thumbnails en dessous (si multiple images)
- [ ] Clic thumbnail → change image principale
- [ ] Images responsive (max-width: 100%)

#### ✅ Informations Produit
- [ ] Breadcrumb "Retour" visible et fonctionnel
- [ ] Nom produit affiché (h1, grande police)
- [ ] Badge catégorie affiché
- [ ] Prix affiché correctement (format XOF)
- [ ] Prix promo barré si présent
- [ ] Description complète visible

#### ✅ Stock Indicator
- [ ] Composant `StockLevelIndicator` affiché
- [ ] Badge coloré selon stock :
  - Vert = En stock (> reorder_point)
  - Orange = Stock faible (≤ reorder_point)
  - Rouge = Rupture (= 0)
- [ ] Quantité affichée (ex: "10 unités")
- [ ] Barre de progression visible (showProgress={true})

#### ✅ Variantes
- [ ] Section "Variantes" visible
- [ ] Composant `VariantSelector` affiché
- [ ] Liste variantes (S-Bleu, M-Rouge, L-Vert)
- [ ] Clic variante → sélection visuelle (border highlight)
- [ ] Prix modifier appliqué au prix total
- [ ] Variantes en rupture désactivées ou marquées

#### ✅ Quantité
- [ ] Sélecteur quantité avec boutons -/+
- [ ] Input numérique centré
- [ ] Bouton "-" désactivé si qty = 1
- [ ] Bouton "+" désactivé si qty = stock max
- [ ] Limite automatique par stock variant sélectionné

#### ✅ Actions
- [ ] Bouton "Ajouter au panier" visible
- [ ] Couleur primaire, grande taille
- [ ] Icon ShoppingCart visible
- [ ] Clic → Toast confirmation (ou erreur si variant non sélectionné)
- [ ] Boutons secondaires :
  - Favori (Heart icon)
  - Partager (Share2 icon)

#### ✅ Caractéristiques
- [ ] Card "Caractéristiques" visible
- [ ] Poids affiché (ex: 0.25 kg)
- [ ] Dimensions affichées (30x25x2 cm)
- [ ] SKU affiché
- [ ] Marque affichée

#### ✅ Livraison
- [ ] Composant `ShippingInfoDisplay` affiché
- [ ] Informations livraison (méthodes, délais, frais)
- [ ] Icons descriptifs

#### ✅ Reviews
- [ ] Composant `ProductReviewsSummary` affiché en bas
- [ ] Note moyenne + nombre d'avis
- [ ] Liste avis (si existants)

### Vérifications Mobile (≤767px)

#### ✅ Layout
- [ ] Grid 1 colonne (empilée)
- [ ] Image en haut (full-width)
- [ ] Infos en dessous
- [ ] Pas de scroll horizontal

#### ✅ Navigation
- [ ] Bouton "Retour" accessible (touch-friendly)
- [ ] Touch target ≥44x44px

#### ✅ Composants
- [ ] StockLevelIndicator lisible
- [ ] Variantes empilées (pas de grid overflow)
- [ ] Quantité sélecteur accessible
- [ ] Bouton "Ajouter" full-width
- [ ] Cards empilées (caractéristiques, livraison)

### Tests Interaction

#### Scénario 1 : Sélection variante + Ajout panier
1. Sélectionner variant "M - Rouge" (stock = 5)
2. Changer quantité à 3
3. Cliquer "Ajouter au panier"
4. **Attendu** : Toast success + ajout panier

#### Scénario 2 : Variante en rupture
1. Sélectionner variant "L - Vert" (stock = 0)
2. **Attendu** : Badge "Rupture de stock" rouge, bouton désactivé

#### Scénario 3 : Limite stock
1. Sélectionner variant "S - Bleu" (stock = 10)
2. Essayer de mettre quantité > 10
3. **Attendu** : Bouton "+" désactivé à qty=10

---

## 🛎️ TEST 2 : ServiceDetail Page

### Setup (Prérequis)
```sql
-- Dans Supabase SQL Editor, créer un service de test
INSERT INTO products (id, name, description, price, currency, category, store_id, type)
VALUES 
  ('test-service-001', 'Coiffure Professionnelle', 'Service de coiffure haut de gamme', 25000, 'XOF', 'Beauté', 'YOUR_STORE_ID', 'service');

INSERT INTO service_products (id, product_id, duration_minutes, service_type, location, max_participants)
VALUES 
  (gen_random_uuid(), 'test-service-001', 60, 'in_person', 'Salon de beauté downtown', 1);

INSERT INTO service_staff (id, service_product_id, name, bio, avatar_url)
VALUES 
  (gen_random_uuid(), (SELECT id FROM service_products WHERE product_id = 'test-service-001'), 'Marie Dupont', 'Coiffeuse professionnelle avec 10 ans d''expérience', 'https://i.pravatar.cc/150?img=1');

INSERT INTO service_availability (id, service_product_id, day_of_week, start_time, end_time)
VALUES 
  (gen_random_uuid(), (SELECT id FROM service_products WHERE product_id = 'test-service-001'), 1, '09:00', '17:00'),
  (gen_random_uuid(), (SELECT id FROM service_products WHERE product_id = 'test-service-001'), 2, '09:00', '17:00'),
  (gen_random_uuid(), (SELECT id FROM service_products WHERE product_id = 'test-service-001'), 3, '09:00', '17:00');
```

### Navigation
1. Aller sur `http://localhost:5173/service/test-service-001`
2. La page doit se charger sans erreur

### Vérifications Desktop (≥1024px)

#### ✅ Layout
- [ ] Grid 3 zones :
  - Image full-width en haut
  - Infos service (col-span-2)
  - Booking card sticky (col-span-1)
- [ ] Booking card reste visible en scroll (sticky top-4)

#### ✅ Image & Header
- [ ] Image service full-width (aspect-video)
- [ ] Placeholder si image null
- [ ] Breadcrumb "Retour" fonctionnel
- [ ] Nom service (h1)
- [ ] Badge catégorie
- [ ] Prix affiché

#### ✅ Détails Service
- [ ] Card "Détails du service" visible
- [ ] Icons + labels :
  - Clock : Durée (60 minutes)
  - Users : Participants max (1)
  - MapPin : Lieu
  - Calendar : Type (Sur place)
- [ ] Badge type service (Individuel/Groupe)
- [ ] Couleur badge cohérente

#### ✅ Description
- [ ] Card "Description" visible
- [ ] HTML content affiché
- [ ] Formatage préservé (paragraphes, listes)

#### ✅ Staff
- [ ] Card "Notre équipe" visible
- [ ] Avatar affiché (rond)
- [ ] Nom staff
- [ ] Bio complète
- [ ] Grid responsive (1 col mobile, 2+ desktop)

#### ✅ Booking Card (Sticky)
- [ ] Card "Réserver ce service" visible
- [ ] Reste visible en scroll (position sticky)
- [ ] Composant `ServiceCalendar` affiché
- [ ] Sélection date fonctionne
- [ ] Composant `TimeSlotPicker` affiché
- [ ] Liste créneaux disponibles (09:00-17:00)
- [ ] Sélection créneau fonctionne
- [ ] Input participants (si groupe, max_participants)
- [ ] Prix total calculé dynamiquement
- [ ] Bouton "Réserver maintenant" :
  - Désactivé si date/créneau manquant
  - Activé si formulaire complet
  - Loading state au clic

#### ✅ Reviews
- [ ] Composant `ProductReviewsSummary` en bas
- [ ] Note + avis affichés

### Vérifications Mobile (≤1023px)

#### ✅ Layout
- [ ] Cards empilées (1 colonne)
- [ ] Image en haut
- [ ] Détails → Description → Staff → Booking
- [ ] Booking card NOT sticky (empilée en bas)

#### ✅ Calendrier
- [ ] Calendrier responsive (rétrécit)
- [ ] Touch-friendly
- [ ] Date sélectionnable

#### ✅ Créneaux
- [ ] Grid 2-3 colonnes max mobile
- [ ] Boutons créneaux touch-friendly
- [ ] Pas de débordement

### Tests Interaction

#### Scénario 1 : Réservation complète
1. Sélectionner date (ex: demain)
2. Choisir créneau (ex: 10:00)
3. Vérifier prix total = prix service
4. Cliquer "Réserver maintenant"
5. **Attendu** : Redirection checkout ou Toast success

#### Scénario 2 : Service groupe
- Modifier `max_participants = 5` dans DB
- Recharger page
- Sélectionner 3 participants
- **Attendu** : Prix total = prix × 3

#### Scénario 3 : Validation formulaire
- Ne pas sélectionner date
- **Attendu** : Bouton "Réserver" désactivé
- Sélectionner date mais pas créneau
- **Attendu** : Bouton toujours désactivé
- Sélectionner les deux
- **Attendu** : Bouton activé

---

## 💳 TEST 3 : PayBalance Page

### Setup (Prérequis)
```sql
-- Créer une commande avec paiement partiel
INSERT INTO customers (id, email, full_name, phone)
VALUES 
  ('test-customer-001', 'test@example.com', 'Jean Test', '+22612345678');

INSERT INTO orders (id, customer_id, total_amount, payment_type, deposit_percentage, paid_amount, remaining_amount, status)
VALUES 
  ('test-order-001', 'test-customer-001', 100000, 'percentage', 30, 30000, 70000, 'pending');

INSERT INTO order_items (id, order_id, product_id, quantity, price)
VALUES 
  (gen_random_uuid(), 'test-order-001', 'test-physical-001', 2, 50000);
```

### Navigation
1. Aller sur `http://localhost:5173/payments/test-order-001/balance`
2. La page doit se charger sans erreur

### Vérifications Desktop

#### ✅ Layout
- [ ] Container centré (max-w-3xl)
- [ ] Gradient background (blue-indigo)
- [ ] Card principale centrée

#### ✅ Header
- [ ] Breadcrumb "Retour à mes commandes"
- [ ] Titre "Payer le solde"
- [ ] Icon CreditCard

#### ✅ Breakdown Paiement
- [ ] Card "Détails du paiement" visible
- [ ] 3 sections :
  - **Montant total** (bleu) : 100,000 XOF
  - **Acompte payé** (vert) : 30,000 XOF (30%)
  - **Solde restant** (orange) : 70,000 XOF
- [ ] Icons descriptifs (DollarSign, CheckCircle, AlertCircle)
- [ ] Couleurs cohérentes (bleu/vert/orange)
- [ ] Typography hiérarchisée (montants en gras)

#### ✅ Articles Commandés
- [ ] Card "Articles commandés" visible
- [ ] Liste items avec :
  - Nom produit
  - Quantité (× 2)
  - Prix unitaire
- [ ] Icon Package

#### ✅ Informations Client
- [ ] Card "Informations client" visible
- [ ] Nom : Jean Test
- [ ] Email : test@example.com
- [ ] Téléphone : +22612345678

#### ✅ Bouton Paiement
- [ ] Bouton "Payer le solde" visible
- [ ] Grande taille (py-6)
- [ ] Couleur primaire
- [ ] Icon CreditCard
- [ ] Montant affiché (70,000 XOF)
- [ ] Loading state au clic

#### ✅ Alertes Sécurité
- [ ] Alert info visible
- [ ] Icon ShieldCheck
- [ ] Message sécurité affiché

### Vérifications Mobile

#### ✅ Layout
- [ ] Container pleine largeur (p-4)
- [ ] Cards empilées
- [ ] Texte lisible
- [ ] Bouton full-width

#### ✅ Breakdown
- [ ] Sections empilées (1 col)
- [ ] Montants lisibles
- [ ] Icônes visibles

### Tests Interaction

#### Scénario 1 : Paiement solde
1. Cliquer "Payer le solde (70,000 XOF)"
2. **Attendu** : 
   - Loading spinner
   - Mutation vers Moneroo
   - Redirection vers payment_url
   - OU Toast error si échec

#### Scénario 2 : Solde déjà payé
- Modifier `remaining_amount = 0` dans DB
- Recharger page
- **Attendu** : Message success "Solde déjà payé !" + pas de bouton

#### Scénario 3 : Calcul pourcentage
- Vérifier calcul % : (30000 / 100000) × 100 = 30%
- **Attendu** : Badge "30% payé" visible

---

## 📊 CHECKLIST GLOBALE

### Fonctionnel
- [ ] 0 erreur console (F12)
- [ ] 0 warning React Query
- [ ] Toutes les queries chargent correctement
- [ ] Mutations fonctionnent (ajout panier, réservation, paiement)
- [ ] Toasts s'affichent correctement

### Performance
- [ ] Pages chargent en < 2s
- [ ] Images optimisées (pas de 5MB)
- [ ] Pas de lag au scroll
- [ ] Lazy loading fonctionne

### UX/UI
- [ ] Navigation intuitive
- [ ] Boutons touch-friendly mobile
- [ ] Feedback visuel (hover, active, disabled)
- [ ] Loading states présents
- [ ] Error states gérés

### Responsive
- [ ] Mobile (375px - 767px) ✅
- [ ] Tablet (768px - 1023px) ✅
- [ ] Desktop (≥1024px) ✅
- [ ] Pas de scroll horizontal

### Accessibilité
- [ ] Contraste couleurs suffisant
- [ ] Labels boutons descriptifs
- [ ] Icons + texte (pas que icons)
- [ ] Focus keyboard visible

---

## 🐛 BUGS IDENTIFIÉS

| Page | Élément | Bug | Priorité | Fix |
|------|---------|-----|----------|-----|
| PhysicalProductDetail | StockLevelIndicator | Import incorrect | ✅ **FIXÉ** | Commit 39f988a |
| | | | | |

---

## ✅ RÉSUMÉ

### Pages testées
- [  ] PhysicalProductDetail (10 vérifications)
- [  ] ServiceDetail (8 vérifications)
- [  ] PayBalance (6 vérifications)

### Bugs trouvés
- **Total** : 0 (1 corrigé)
- **Critiques** : 0
- **Majeurs** : 0
- **Mineurs** : 0

### Recommandations
- [ ] Ajouter images réelles aux produits test
- [ ] Tester avec données réelles Supabase
- [ ] Vérifier intégration paiement Moneroo
- [ ] Ajouter tests E2E (Playwright) - Phase 6

---

## 🚀 PROCHAINE ÉTAPE

Une fois tests visuels validés → **Phase 3 : UI Components**
- ProductImages component (galerie moderne)
- StaffCard component (carte staff améliorée)
- Animations micro-interactions
- Dark mode polish

**Durée estimée Phase 3** : 4h (2h × 2 composants)

