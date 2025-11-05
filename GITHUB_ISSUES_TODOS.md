# 📋 Issues GitHub - TODOs à Implémenter

**Date de création** : 27 Janvier 2025  
**Total** : 13 issues prioritaires

---

## 🔴 PRIORITÉ CRITIQUE (P0)

### Issue #1: Implémenter les appels API réels pour FedEx
**Fichier**: `src/integrations/shipping/fedex.ts`  
**Lignes**: 119, 159, 195  
**Labels**: `enhancement`, `shipping`, `api`, `high-priority`

**Description**:
Actuellement, les méthodes `getRates()` et `createLabel()` retournent des données mockées. Il faut implémenter les appels API réels vers l'API FedEx.

**Tâches**:
- [ ] Implémenter l'authentification OAuth pour FedEx
- [ ] Implémenter `getRates()` avec l'API réelle
- [ ] Implémenter `createLabel()` avec l'API réelle
- [ ] Ajouter gestion d'erreurs robuste
- [ ] Ajouter tests unitaires

**Acceptance Criteria**:
- Les tarifs sont calculés depuis l'API FedEx réelle
- Les étiquettes sont générées via l'API FedEx
- Gestion des erreurs réseau et API

---

### Issue #2: Implémenter les appels API réels pour DHL
**Fichier**: `src/integrations/shipping/dhl.ts`  
**Lignes**: 106, 154, 198  
**Labels**: `enhancement`, `shipping`, `api`, `high-priority`

**Description**:
Actuellement, les méthodes `getRates()`, `createLabel()` et `trackShipment()` retournent des données mockées. Il faut implémenter les appels API réels vers l'API DHL.

**Tâches**:
- [ ] Implémenter `getRates()` avec l'API réelle
- [ ] Implémenter `createLabel()` avec l'API réelle
- [ ] Implémenter `trackShipment()` avec l'API réelle
- [ ] Ajouter gestion d'erreurs robuste
- [ ] Ajouter tests unitaires

**Acceptance Criteria**:
- Les tarifs sont calculés depuis l'API DHL réelle
- Les étiquettes sont générées via l'API DHL
- Le tracking fonctionne avec l'API DHL

---

## 🟡 PRIORITÉ HAUTE (P1)

### Issue #3: Implémenter le dashboard analytics des services
**Fichier**: `src/components/service/ServiceAnalyticsDashboard.tsx`  
**Ligne**: 28  
**Labels**: `enhancement`, `analytics`, `services`, `medium-priority`

**Description**:
Le composant `ServiceAnalyticsDashboard` affiche actuellement un placeholder. Il faut implémenter le fetching réel des données avec React Query.

**Tâches**:
- [ ] Créer hook `useServiceAnalytics()` avec React Query
- [ ] Implémenter les requêtes Supabase pour les métriques
- [ ] Ajouter graphiques de réservations, tendances, revenus
- [ ] Ajouter filtres par période (jour, semaine, mois)
- [ ] Ajouter export CSV

**Acceptance Criteria**:
- Dashboard affiche des données réelles
- Graphiques interactifs avec Recharts
- Filtres fonctionnels
- Export CSV disponible

---

### Issue #4: Gérer les commandes multi-stores
**Fichier**: `src/pages/Checkout.tsx`  
**Ligne**: 289  
**Labels**: `enhancement`, `checkout`, `orders`, `medium-priority`

**Description**:
Actuellement, le checkout utilise le `store_id` du premier produit. Il faut gérer les commandes contenant des produits de plusieurs stores.

**Tâches**:
- [ ] Détecter les produits de différents stores dans le panier
- [ ] Créer une commande séparée par store
- [ ] Gérer les paiements multiples si nécessaire
- [ ] Mettre à jour l'UI pour afficher les commandes multiples
- [ ] Ajouter tests E2E

**Acceptance Criteria**:
- Les commandes multi-stores sont créées correctement
- Chaque store reçoit sa commande
- L'utilisateur voit toutes ses commandes créées

---

### Issue #5: Implémenter le système de paiement et inscription aux cours
**Fichier**: `src/pages/courses/CourseDetail.tsx`  
**Ligne**: 178  
**Labels**: `feature`, `courses`, `payment`, `high-priority`

**Description**:
Le bouton "S'inscrire" affiche actuellement un toast de développement. Il faut implémenter le flux complet de paiement et d'inscription.

**Tâches**:
- [ ] Intégrer le processus de paiement (PayDunya/Moneroo)
- [ ] Créer l'enrollment après paiement réussi
- [ ] Gérer les erreurs de paiement
- [ ] Ajouter redirection vers le cours après inscription
- [ ] Ajouter tests E2E

**Acceptance Criteria**:
- L'utilisateur peut payer et s'inscrire à un cours
- L'enrollment est créé automatiquement
- Redirection vers la page du cours après inscription

---

### Issue #6: Implémenter l'upload de photos pour les retours
**Fichier**: `src/components/physical/returns/ReturnRequestForm.tsx`  
**Ligne**: 180  
**Labels**: `feature`, `returns`, `upload`, `medium-priority`

**Description**:
Le formulaire de retour mentionne l'upload de photos mais n'a pas l'implémentation. Il faut ajouter la fonctionnalité d'upload.

**Tâches**:
- [ ] Ajouter composant d'upload d'images
- [ ] Implémenter upload vers Supabase Storage
- [ ] Ajouter compression d'images
- [ ] Ajouter preview des images
- [ ] Stocker les URLs dans la table `return_requests`

**Acceptance Criteria**:
- L'utilisateur peut uploader des photos
- Les photos sont compressées et stockées
- Les URLs sont sauvegardées avec la demande de retour

---

### Issue #7: Implémenter les notifications email pour les versions de produits
**Fichier**: `src/hooks/digital/useProductVersions.ts`  
**Ligne**: 317  
**Labels**: `feature`, `notifications`, `email`, `medium-priority`

**Description**:
Quand une nouvelle version d'un produit digital est publiée, les utilisateurs qui ont acheté doivent être notifiés par email.

**Tâches**:
- [ ] Créer Supabase Edge Function pour l'envoi d'emails
- [ ] Récupérer la liste des utilisateurs ayant acheté le produit
- [ ] Créer template email pour nouvelles versions
- [ ] Implémenter l'envoi via SendGrid ou Supabase
- [ ] Ajouter logs et gestion d'erreurs

**Acceptance Criteria**:
- Les emails sont envoyés automatiquement
- Template email professionnel
- Gestion des erreurs d'envoi

---

## 🟢 PRIORITÉ MOYENNE (P2)

### Issue #8: Implémenter la navigation vers les pages de cohort
**Fichier**: `src/pages/courses/CourseDetail.tsx`  
**Ligne**: 497  
**Labels**: `feature`, `courses`, `navigation`, `low-priority`

**Description**:
Le clic sur un cohort dans la liste ne navigue pas vers la page du cohort. Il faut implémenter la navigation.

**Tâches**:
- [ ] Créer la route `/courses/:courseId/cohorts/:cohortId`
- [ ] Créer la page `CohortDetailPage`
- [ ] Implémenter la navigation depuis `CohortsList`
- [ ] Ajouter tests

**Acceptance Criteria**:
- Navigation fonctionnelle vers la page du cohort
- Page affiche les détails du cohort

---

### Issue #9: Implémenter markCartRecovered dans le checkout
**Fichier**: `src/pages/Checkout.tsx`  
**Ligne**: 470  
**Labels**: `feature`, `checkout`, `cart`, `low-priority`

**Description**:
Après un checkout réussi, il faudrait marquer le panier comme récupéré pour éviter les notifications de panier abandonné.

**Tâches**:
- [ ] Créer fonction `markCartRecovered()` dans le hook cart
- [ ] Appeler cette fonction après checkout réussi
- [ ] Mettre à jour la table `abandoned_carts`
- [ ] Ajouter tests

**Acceptance Criteria**:
- Le panier est marqué comme récupéré
- Plus de notifications de panier abandonné

---

### Issue #10: Implémenter la vérification de disponibilité staff dans les réservations
**Fichier**: `src/hooks/orders/useCreateServiceOrder.ts`  
**Ligne**: 175  
**Labels**: `feature`, `services`, `bookings`, `medium-priority`

**Description**:
Avant de créer une réservation, il faut vérifier si le staff est déjà réservé pour ce créneau.

**Tâches**:
- [ ] Créer fonction de vérification de disponibilité
- [ ] Vérifier les conflits avec les réservations existantes
- [ ] Retourner erreur si conflit
- [ ] Ajouter tests unitaires

**Acceptance Criteria**:
- Vérification de disponibilité avant création
- Erreur claire si conflit
- Pas de double réservation

---

### Issue #11: Implémenter la logique de réservation dans ServiceDetail
**Fichier**: `src/pages/service/ServiceDetail.tsx`  
**Ligne**: 118  
**Labels**: `feature`, `services`, `bookings`, `high-priority`

**Description**:
La page de détail d'un service n'a pas encore la logique de réservation implémentée.

**Tâches**:
- [ ] Créer formulaire de réservation
- [ ] Implémenter sélection de créneau
- [ ] Implémenter création de réservation
- [ ] Ajouter gestion des erreurs
- [ ] Ajouter tests E2E

**Acceptance Criteria**:
- L'utilisateur peut réserver un service
- Sélection de créneau fonctionnelle
- Réservation créée en base

---

### Issue #12: Implémenter la fonctionnalité de panier dans PhysicalProductDetail
**Fichier**: `src/pages/physical/PhysicalProductDetail.tsx`  
**Ligne**: 98  
**Labels**: `feature`, `cart`, `physical-products`, `medium-priority`

**Description**:
La page de détail d'un produit physique n'a pas encore la fonctionnalité d'ajout au panier implémentée.

**Tâches**:
- [ ] Intégrer le hook `useCart()`
- [ ] Implémenter ajout au panier avec variants
- [ ] Gérer la quantité
- [ ] Ajouter toast de confirmation
- [ ] Ajouter tests E2E

**Acceptance Criteria**:
- L'utilisateur peut ajouter au panier
- Les variants sont gérés correctement
- Toast de confirmation affiché

---

### Issue #13: Implémenter l'upload vers Supabase Storage pour les retours
**Fichier**: `src/components/returns/ReturnRequestForm.tsx`  
**Ligne**: 126  
**Labels**: `feature`, `returns`, `storage`, `medium-priority`

**Description**:
Le formulaire de retour mentionne l'upload mais n'a pas l'implémentation vers Supabase Storage.

**Tâches**:
- [ ] Créer bucket `return-requests` dans Supabase Storage
- [ ] Implémenter upload avec `supabase.storage`
- [ ] Ajouter compression d'images
- [ ] Gérer les erreurs d'upload
- [ ] Stocker les URLs dans la base

**Acceptance Criteria**:
- Upload fonctionnel vers Supabase Storage
- Images compressées
- URLs stockées en base

---

## 📝 Notes pour la création des issues

1. **Créer les issues sur GitHub** avec le format ci-dessus
2. **Assigner les labels** appropriés
3. **Estimer le temps** pour chaque issue
4. **Créer un milestone** "TODOs Q1 2025" pour les regrouper
5. **Prioriser** selon l'impact utilisateur

---

**Template GitHub Issue**:

```markdown
## Description
[Description de l'issue]

## Fichiers concernés
- `src/path/to/file.ts`

## Tâches
- [ ] Tâche 1
- [ ] Tâche 2

## Acceptance Criteria
- Critère 1
- Critère 2
```

