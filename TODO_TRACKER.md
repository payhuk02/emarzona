# 📋 TRACKER TODO/FIXME
## Suivi des TODO/FIXME du projet Emarzona

**Date de création** : 2025-01-30  
**Dernière mise à jour** : 2025-01-30  
**Total TODO identifiés** : 47  
**TODO Critiques** : 0/8 (100% corrigés) ✅  
**Objectif** : Traiter tous les TODO critiques et réduire les TODO moyennes

---

## 🔴 PRIORITÉ CRITIQUE (8 TODO)

### 1. `src/lib/notifications/service-booking-notifications.ts:180` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Récupération du user_id depuis le booking
const { data: booking } = await supabase
  .from('service_bookings')
  .select('user_id, customer_id')
  .eq('id', data.booking_id)
  .single();
const userId = booking.user_id || booking.customer_id;
```
- **Impact** : Notifications fonctionnent correctement ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-001

### 2. `src/pages/courses/CourseDetail.tsx:190` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Implémentation complète avec useCreateCourseOrder
const result = await createCourseOrder.mutateAsync({...});
```
- **Impact** : Paiement cours fonctionnel ✅
- **Effort** : 🔴 Élevé (4-6h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-002

### 3. `src/pages/courses/CourseDetail.tsx:540` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Navigation vers /dashboard/cohorts/:cohortId
navigate(`/dashboard/cohorts/${cohort.id}`);
```
- **Impact** : Navigation cohort fonctionnelle ✅
- **Effort** : 🟢 Faible (30min)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-003

### 4. `src/components/orders/OrderDetailDialog.tsx:656` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Validation utilisateur et commande avant navigation
const { data: { user } } = await supabase.auth.getUser();
if (!user) { toast(...); return; }
navigate(`/disputes/create?order_id=${order.id}`);
```
- **Impact** : Création litige améliorée ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-004

### 5. `src/pages/payments/PayBalance.tsx:71` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Utilisation de initiateMonerooPayment
const paymentResult = await initiateMonerooPayment({...});
```
- **Impact** : Paiement balance fonctionnel ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-005

### 6. `src/hooks/useDisputes.ts:177` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Notifications temps réel avec Supabase Realtime
channel = supabase.channel('disputes_realtime')
  .on('postgres_changes', {...})
  .subscribe();
```
- **Impact** : Notifications temps réel fonctionnelles ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-006

### 7. `src/pages/vendor/VendorMessaging.tsx:948` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Infinite scroll avec loadMoreMessages
if (target.scrollTop === 0 && !messagesLoading && hasMoreMessages) {
  loadMoreMessages();
}
```
- **Impact** : Pagination messages fonctionnelle ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-007

### 8. `src/pages/service/ServiceWaitlistManagementPage.tsx:105` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Navigation vers page booking avec pré-remplissage et gestion erreurs
navigate(`/service/${entry.serviceId}/book?waitlist=${entryId}`, {
  state: { waitlistEntry: entry, prefillData: {...} }
});
```
- **Impact** : Conversion waitlist améliorée avec meilleure UX ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-008

---

## 🟡 PRIORITÉ MOYENNE (25 TODO)

### Performance & Optimisations

#### 9. `src/pages/Marketplace.tsx:384`
```typescript
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```
- **Impact** : Performance recherche produits
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-009

#### 10. `src/hooks/useMarketplaceProducts.ts:220`
```typescript
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```
- **Impact** : Filtrage variants incomplet
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-010

#### 11. `src/lib/image-upload.ts:99` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Compression avec browser-image-compression
const imageCompression = (await import('browser-image-compression')).default;
const compressedFile = await imageCompression(file, options);
```
- **Impact** : Images compressées automatiquement ✅
- **Effort** : 🟢 Faible (1h) - browser-image-compression déjà installé
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Issue** : #TODO-011

#### 12. `src/hooks/physical/useStockOptimization.ts:291`
```typescript
// TODO: Calculer depuis l'historique des ventes
const averageDailySales = 0; // TODO: Calculer depuis l'historique des ventes
```
- **Impact** : Optimisation stock imprécise
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-012

#### 13. `src/hooks/physical/useStockOptimization.ts:353`
```typescript
// TODO: Intégrer les prévisions
forecast: undefined, // TODO: Intégrer les prévisions
```
- **Impact** : Prévisions stock manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-013

### Fonctionnalités Manquantes

#### 14. `src/lib/files/digital-file-processing.ts:246`
```typescript
// TODO: Implémenter avec JSZip ou Edge Function
```
- **Impact** : Compression fichiers ZIP manquante
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-014

#### 15. `src/lib/marketing/automation.ts:427`
```typescript
// TODO: Implémenter la vérification de schedule
// TODO: Implémenter la vérification de condition
// TODO: Implémenter l'envoi SMS
// TODO: Implémenter l'ajout à un segment
// TODO: Implémenter l'appel webhook
```
- **Impact** : Automation marketing incomplète
- **Effort** : 🔴 Élevé (6-8h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-015

#### 16. `src/components/admin/customization/IntegrationsSection.tsx:142`
```typescript
// TODO: Implémenter les tests de connexion
```
- **Impact** : Tests intégrations manquants
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-016

#### 17. `src/lib/seo/advanced.ts:203`
```typescript
// TODO: Ajouter les liens vers les réseaux sociaux
```
- **Impact** : SEO social incomplet
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-017

#### 18. `src/lib/services/cancellation-policy.ts:275`
```typescript
// TODO: Implémenter l'appel réel à l'API de paiement
// TODO: Implémenter l'appel réel à Moneroo ou PayDunya
```
- **Impact** : Remboursements non fonctionnels
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-018

#### 19. `src/components/digital/customer/MyLicenses.tsx:631`
```typescript
// TODO: Implémenter le transfert de licence
```
- **Impact** : Transfert licences manquant
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-019

#### 20. `src/pages/dashboard/LiveSessionsManagement.tsx:269`
```typescript
// TODO: Intégrer avec les services Zoom/Google Meet
```
- **Impact** : Intégration vidéo manquante
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-020

#### 21. `src/components/physical/PreOrderManager.tsx:267`
```typescript
// TODO: API call to save
```
- **Impact** : Sauvegarde précommandes non fonctionnelle
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-021

#### 22. `src/components/reviews/ShareReviewButtons.tsx:110`
```typescript
// TODO: Implement analytics tracking
```
- **Impact** : Analytics partage manquant
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-022

#### 23. `src/components/returns/ReturnRequestForm.tsx:126`
```typescript
// TODO: Upload vers Supabase Storage
```
- **Impact** : Upload fichiers retours manquant
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-023

#### 24. `src/pages/service/BookingsManagement.tsx:221`
```typescript
// TODO: Ajouter service_availability aux types Supabase générés
```
- **Impact** : Types TypeScript incomplets
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟡 À faire
- **Issue** : #TODO-024

#### 25. `src/integrations/payments/flutterwave.ts:230`
```typescript
// TODO: Implémenter la vérification de signature Flutterwave
```
- **Impact** : Sécurité webhooks Flutterwave
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-025

#### 26. `src/integrations/payments/paypal.ts:237`
```typescript
// TODO: Implémenter la logique complète de capture puis refund
// TODO: Implémenter la vérification de signature PayPal
```
- **Impact** : Intégration PayPal incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-026

#### 27. `src/integrations/payments/stripe.ts:215`
```typescript
// TODO: Implémenter la vérification de signature Stripe
```
- **Impact** : Sécurité webhooks Stripe
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-027

#### 28. `src/lib/gamification/system.ts:322`
```typescript
// TODO: Envoyer une notification de montée de niveau
// TODO: Attribuer des récompenses de niveau
```
- **Impact** : Gamification incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-028

#### 29. `src/lib/pwa.ts:168`
```typescript
// TODO: Implémenter l'envoi au backend
```
- **Impact** : PWA notifications manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-029

#### 30. `src/hooks/physical/useInventoryReports.ts:159`
```typescript
// TODO: Calculate from orders/sales
```
- **Impact** : Rapports inventaire imprécis
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-030

#### 31. `src/services/fedex/FedexService.ts:17`
```typescript
// TODO: Implement real API call (4 occurrences)
```
- **Impact** : Intégration FedEx non fonctionnelle
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-031

#### 32. `src/hooks/services/useServiceReports.ts:340`
```typescript
// TODO: Get peak utilization by day (requires more complex query)
```
- **Impact** : Rapports services incomplets
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-032

#### 33. `src/components/courses/StudentProgressManager.tsx:171`
```typescript
// TODO: Calculer basé sur les dernières semaines
```
- **Impact** : Calcul progression imprécis
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-033

---

## 🟢 PRIORITÉ BASSE / TESTS (14 TODO)

### Tests à Implémenter

#### 34-47. Tests d'Intégration Supabase
`src/hooks/__tests__/multiStoresIsolation.integration.test.ts`
- **5 TODO** pour tests d'intégration avec environnement de test Supabase
- **Effort** : 🟡 Moyen (4-5h)
- **Status** : 🟢 À faire
- **Issue** : #TODO-034

#### 48. `src/components/settings/__tests__/DomainSettings.test.tsx:127`
```typescript
// TODO: Tester la désactivation automatique quand SSL est off
```
- **Impact** : Test manquant
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟢 À faire
- **Issue** : #TODO-048

---

## 📊 STATISTIQUES

| Priorité | Nombre | Traités | Restants | % |
|----------|--------|---------|----------|---|
| 🔴 **Critique** | 8 | 8 | 0 | 100% ✅ |
| 🟡 **Moyenne** | 25 | 0 | 25 | 0% |
| 🟢 **Basse** | 14 | 0 | 14 | 0% |
| **TOTAL** | **47** | **8** | **39** | **17%** |

---

## 🎯 OBJECTIFS

- **Semaine 1** : Traiter 8 TODO critiques
- **Semaine 2** : Traiter 10 TODO moyennes
- **Semaine 3** : Traiter 10 TODO moyennes restantes
- **Semaine 4** : Traiter TODO basses + Tests

---

## 📝 NOTES

- Les TODO dans les fichiers de tests sont considérés comme basse priorité
- Les TODO liés aux intégrations externes (FedEx, PayPal, Stripe) nécessitent des clés API
- Certains TODO nécessitent des modifications de schéma Supabase

---

**Dernière mise à jour** : 2025-01-30



**Date de création** : 2025-01-30  
**Dernière mise à jour** : 2025-01-30  
**Total TODO identifiés** : 47  
**TODO Critiques** : 0/8 (100% corrigés) ✅  
**Objectif** : Traiter tous les TODO critiques et réduire les TODO moyennes

---

## 🔴 PRIORITÉ CRITIQUE (8 TODO)

### 1. `src/lib/notifications/service-booking-notifications.ts:180` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Récupération du user_id depuis le booking
const { data: booking } = await supabase
  .from('service_bookings')
  .select('user_id, customer_id')
  .eq('id', data.booking_id)
  .single();
const userId = booking.user_id || booking.customer_id;
```
- **Impact** : Notifications fonctionnent correctement ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-001

### 2. `src/pages/courses/CourseDetail.tsx:190` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Implémentation complète avec useCreateCourseOrder
const result = await createCourseOrder.mutateAsync({...});
```
- **Impact** : Paiement cours fonctionnel ✅
- **Effort** : 🔴 Élevé (4-6h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-002

### 3. `src/pages/courses/CourseDetail.tsx:540` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Navigation vers /dashboard/cohorts/:cohortId
navigate(`/dashboard/cohorts/${cohort.id}`);
```
- **Impact** : Navigation cohort fonctionnelle ✅
- **Effort** : 🟢 Faible (30min)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-003

### 4. `src/components/orders/OrderDetailDialog.tsx:656` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Validation utilisateur et commande avant navigation
const { data: { user } } = await supabase.auth.getUser();
if (!user) { toast(...); return; }
navigate(`/disputes/create?order_id=${order.id}`);
```
- **Impact** : Création litige améliorée ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-004

### 5. `src/pages/payments/PayBalance.tsx:71` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Utilisation de initiateMonerooPayment
const paymentResult = await initiateMonerooPayment({...});
```
- **Impact** : Paiement balance fonctionnel ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-005

### 6. `src/hooks/useDisputes.ts:177` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Notifications temps réel avec Supabase Realtime
channel = supabase.channel('disputes_realtime')
  .on('postgres_changes', {...})
  .subscribe();
```
- **Impact** : Notifications temps réel fonctionnelles ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-006

### 7. `src/pages/vendor/VendorMessaging.tsx:948` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Infinite scroll avec loadMoreMessages
if (target.scrollTop === 0 && !messagesLoading && hasMoreMessages) {
  loadMoreMessages();
}
```
- **Impact** : Pagination messages fonctionnelle ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-007

### 8. `src/pages/service/ServiceWaitlistManagementPage.tsx:105` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Navigation vers page booking avec pré-remplissage et gestion erreurs
navigate(`/service/${entry.serviceId}/book?waitlist=${entryId}`, {
  state: { waitlistEntry: entry, prefillData: {...} }
});
```
- **Impact** : Conversion waitlist améliorée avec meilleure UX ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-008

---

## 🟡 PRIORITÉ MOYENNE (25 TODO)

### Performance & Optimisations

#### 9. `src/pages/Marketplace.tsx:384`
```typescript
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```
- **Impact** : Performance recherche produits
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-009

#### 10. `src/hooks/useMarketplaceProducts.ts:220`
```typescript
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```
- **Impact** : Filtrage variants incomplet
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-010

#### 11. `src/lib/image-upload.ts:99` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Compression avec browser-image-compression
const imageCompression = (await import('browser-image-compression')).default;
const compressedFile = await imageCompression(file, options);
```
- **Impact** : Images compressées automatiquement ✅
- **Effort** : 🟢 Faible (1h) - browser-image-compression déjà installé
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Issue** : #TODO-011

#### 12. `src/hooks/physical/useStockOptimization.ts:291`
```typescript
// TODO: Calculer depuis l'historique des ventes
const averageDailySales = 0; // TODO: Calculer depuis l'historique des ventes
```
- **Impact** : Optimisation stock imprécise
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-012

#### 13. `src/hooks/physical/useStockOptimization.ts:353`
```typescript
// TODO: Intégrer les prévisions
forecast: undefined, // TODO: Intégrer les prévisions
```
- **Impact** : Prévisions stock manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-013

### Fonctionnalités Manquantes

#### 14. `src/lib/files/digital-file-processing.ts:246`
```typescript
// TODO: Implémenter avec JSZip ou Edge Function
```
- **Impact** : Compression fichiers ZIP manquante
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-014

#### 15. `src/lib/marketing/automation.ts:427`
```typescript
// TODO: Implémenter la vérification de schedule
// TODO: Implémenter la vérification de condition
// TODO: Implémenter l'envoi SMS
// TODO: Implémenter l'ajout à un segment
// TODO: Implémenter l'appel webhook
```
- **Impact** : Automation marketing incomplète
- **Effort** : 🔴 Élevé (6-8h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-015

#### 16. `src/components/admin/customization/IntegrationsSection.tsx:142`
```typescript
// TODO: Implémenter les tests de connexion
```
- **Impact** : Tests intégrations manquants
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-016

#### 17. `src/lib/seo/advanced.ts:203`
```typescript
// TODO: Ajouter les liens vers les réseaux sociaux
```
- **Impact** : SEO social incomplet
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-017

#### 18. `src/lib/services/cancellation-policy.ts:275`
```typescript
// TODO: Implémenter l'appel réel à l'API de paiement
// TODO: Implémenter l'appel réel à Moneroo ou PayDunya
```
- **Impact** : Remboursements non fonctionnels
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-018

#### 19. `src/components/digital/customer/MyLicenses.tsx:631`
```typescript
// TODO: Implémenter le transfert de licence
```
- **Impact** : Transfert licences manquant
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-019

#### 20. `src/pages/dashboard/LiveSessionsManagement.tsx:269`
```typescript
// TODO: Intégrer avec les services Zoom/Google Meet
```
- **Impact** : Intégration vidéo manquante
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-020

#### 21. `src/components/physical/PreOrderManager.tsx:267`
```typescript
// TODO: API call to save
```
- **Impact** : Sauvegarde précommandes non fonctionnelle
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-021

#### 22. `src/components/reviews/ShareReviewButtons.tsx:110`
```typescript
// TODO: Implement analytics tracking
```
- **Impact** : Analytics partage manquant
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-022

#### 23. `src/components/returns/ReturnRequestForm.tsx:126`
```typescript
// TODO: Upload vers Supabase Storage
```
- **Impact** : Upload fichiers retours manquant
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-023

#### 24. `src/pages/service/BookingsManagement.tsx:221`
```typescript
// TODO: Ajouter service_availability aux types Supabase générés
```
- **Impact** : Types TypeScript incomplets
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟡 À faire
- **Issue** : #TODO-024

#### 25. `src/integrations/payments/flutterwave.ts:230`
```typescript
// TODO: Implémenter la vérification de signature Flutterwave
```
- **Impact** : Sécurité webhooks Flutterwave
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-025

#### 26. `src/integrations/payments/paypal.ts:237`
```typescript
// TODO: Implémenter la logique complète de capture puis refund
// TODO: Implémenter la vérification de signature PayPal
```
- **Impact** : Intégration PayPal incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-026

#### 27. `src/integrations/payments/stripe.ts:215`
```typescript
// TODO: Implémenter la vérification de signature Stripe
```
- **Impact** : Sécurité webhooks Stripe
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-027

#### 28. `src/lib/gamification/system.ts:322`
```typescript
// TODO: Envoyer une notification de montée de niveau
// TODO: Attribuer des récompenses de niveau
```
- **Impact** : Gamification incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-028

#### 29. `src/lib/pwa.ts:168`
```typescript
// TODO: Implémenter l'envoi au backend
```
- **Impact** : PWA notifications manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-029

#### 30. `src/hooks/physical/useInventoryReports.ts:159`
```typescript
// TODO: Calculate from orders/sales
```
- **Impact** : Rapports inventaire imprécis
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-030

#### 31. `src/services/fedex/FedexService.ts:17`
```typescript
// TODO: Implement real API call (4 occurrences)
```
- **Impact** : Intégration FedEx non fonctionnelle
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-031

#### 32. `src/hooks/services/useServiceReports.ts:340`
```typescript
// TODO: Get peak utilization by day (requires more complex query)
```
- **Impact** : Rapports services incomplets
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-032

#### 33. `src/components/courses/StudentProgressManager.tsx:171`
```typescript
// TODO: Calculer basé sur les dernières semaines
```
- **Impact** : Calcul progression imprécis
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-033

---

## 🟢 PRIORITÉ BASSE / TESTS (14 TODO)

### Tests à Implémenter

#### 34-47. Tests d'Intégration Supabase
`src/hooks/__tests__/multiStoresIsolation.integration.test.ts`
- **5 TODO** pour tests d'intégration avec environnement de test Supabase
- **Effort** : 🟡 Moyen (4-5h)
- **Status** : 🟢 À faire
- **Issue** : #TODO-034

#### 48. `src/components/settings/__tests__/DomainSettings.test.tsx:127`
```typescript
// TODO: Tester la désactivation automatique quand SSL est off
```
- **Impact** : Test manquant
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟢 À faire
- **Issue** : #TODO-048

---

## 📊 STATISTIQUES

| Priorité | Nombre | Traités | Restants | % |
|----------|--------|---------|----------|---|
| 🔴 **Critique** | 8 | 8 | 0 | 100% ✅ |
| 🟡 **Moyenne** | 25 | 0 | 25 | 0% |
| 🟢 **Basse** | 14 | 0 | 14 | 0% |
| **TOTAL** | **47** | **8** | **39** | **17%** |

---

## 🎯 OBJECTIFS

- **Semaine 1** : Traiter 8 TODO critiques
- **Semaine 2** : Traiter 10 TODO moyennes
- **Semaine 3** : Traiter 10 TODO moyennes restantes
- **Semaine 4** : Traiter TODO basses + Tests

---

## 📝 NOTES

- Les TODO dans les fichiers de tests sont considérés comme basse priorité
- Les TODO liés aux intégrations externes (FedEx, PayPal, Stripe) nécessitent des clés API
- Certains TODO nécessitent des modifications de schéma Supabase

---

**Dernière mise à jour** : 2025-01-30



**Date de création** : 2025-01-30  
**Dernière mise à jour** : 2025-01-30  
**Total TODO identifiés** : 47  
**TODO Critiques** : 0/8 (100% corrigés) ✅  
**Objectif** : Traiter tous les TODO critiques et réduire les TODO moyennes

---

## 🔴 PRIORITÉ CRITIQUE (8 TODO)

### 1. `src/lib/notifications/service-booking-notifications.ts:180` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Récupération du user_id depuis le booking
const { data: booking } = await supabase
  .from('service_bookings')
  .select('user_id, customer_id')
  .eq('id', data.booking_id)
  .single();
const userId = booking.user_id || booking.customer_id;
```
- **Impact** : Notifications fonctionnent correctement ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-001

### 2. `src/pages/courses/CourseDetail.tsx:190` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Implémentation complète avec useCreateCourseOrder
const result = await createCourseOrder.mutateAsync({...});
```
- **Impact** : Paiement cours fonctionnel ✅
- **Effort** : 🔴 Élevé (4-6h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-002

### 3. `src/pages/courses/CourseDetail.tsx:540` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Navigation vers /dashboard/cohorts/:cohortId
navigate(`/dashboard/cohorts/${cohort.id}`);
```
- **Impact** : Navigation cohort fonctionnelle ✅
- **Effort** : 🟢 Faible (30min)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-003

### 4. `src/components/orders/OrderDetailDialog.tsx:656` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Validation utilisateur et commande avant navigation
const { data: { user } } = await supabase.auth.getUser();
if (!user) { toast(...); return; }
navigate(`/disputes/create?order_id=${order.id}`);
```
- **Impact** : Création litige améliorée ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-004

### 5. `src/pages/payments/PayBalance.tsx:71` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Utilisation de initiateMonerooPayment
const paymentResult = await initiateMonerooPayment({...});
```
- **Impact** : Paiement balance fonctionnel ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-005

### 6. `src/hooks/useDisputes.ts:177` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Notifications temps réel avec Supabase Realtime
channel = supabase.channel('disputes_realtime')
  .on('postgres_changes', {...})
  .subscribe();
```
- **Impact** : Notifications temps réel fonctionnelles ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-006

### 7. `src/pages/vendor/VendorMessaging.tsx:948` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Infinite scroll avec loadMoreMessages
if (target.scrollTop === 0 && !messagesLoading && hasMoreMessages) {
  loadMoreMessages();
}
```
- **Impact** : Pagination messages fonctionnelle ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-007

### 8. `src/pages/service/ServiceWaitlistManagementPage.tsx:105` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Navigation vers page booking avec pré-remplissage et gestion erreurs
navigate(`/service/${entry.serviceId}/book?waitlist=${entryId}`, {
  state: { waitlistEntry: entry, prefillData: {...} }
});
```
- **Impact** : Conversion waitlist améliorée avec meilleure UX ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-008

---

## 🟡 PRIORITÉ MOYENNE (25 TODO)

### Performance & Optimisations

#### 9. `src/pages/Marketplace.tsx:384`
```typescript
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```
- **Impact** : Performance recherche produits
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-009

#### 10. `src/hooks/useMarketplaceProducts.ts:220`
```typescript
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```
- **Impact** : Filtrage variants incomplet
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-010

#### 11. `src/lib/image-upload.ts:99` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Compression avec browser-image-compression
const imageCompression = (await import('browser-image-compression')).default;
const compressedFile = await imageCompression(file, options);
```
- **Impact** : Images compressées automatiquement ✅
- **Effort** : 🟢 Faible (1h) - browser-image-compression déjà installé
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Issue** : #TODO-011

#### 12. `src/hooks/physical/useStockOptimization.ts:291`
```typescript
// TODO: Calculer depuis l'historique des ventes
const averageDailySales = 0; // TODO: Calculer depuis l'historique des ventes
```
- **Impact** : Optimisation stock imprécise
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-012

#### 13. `src/hooks/physical/useStockOptimization.ts:353`
```typescript
// TODO: Intégrer les prévisions
forecast: undefined, // TODO: Intégrer les prévisions
```
- **Impact** : Prévisions stock manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-013

### Fonctionnalités Manquantes

#### 14. `src/lib/files/digital-file-processing.ts:246`
```typescript
// TODO: Implémenter avec JSZip ou Edge Function
```
- **Impact** : Compression fichiers ZIP manquante
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-014

#### 15. `src/lib/marketing/automation.ts:427`
```typescript
// TODO: Implémenter la vérification de schedule
// TODO: Implémenter la vérification de condition
// TODO: Implémenter l'envoi SMS
// TODO: Implémenter l'ajout à un segment
// TODO: Implémenter l'appel webhook
```
- **Impact** : Automation marketing incomplète
- **Effort** : 🔴 Élevé (6-8h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-015

#### 16. `src/components/admin/customization/IntegrationsSection.tsx:142`
```typescript
// TODO: Implémenter les tests de connexion
```
- **Impact** : Tests intégrations manquants
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-016

#### 17. `src/lib/seo/advanced.ts:203`
```typescript
// TODO: Ajouter les liens vers les réseaux sociaux
```
- **Impact** : SEO social incomplet
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-017

#### 18. `src/lib/services/cancellation-policy.ts:275`
```typescript
// TODO: Implémenter l'appel réel à l'API de paiement
// TODO: Implémenter l'appel réel à Moneroo ou PayDunya
```
- **Impact** : Remboursements non fonctionnels
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-018

#### 19. `src/components/digital/customer/MyLicenses.tsx:631`
```typescript
// TODO: Implémenter le transfert de licence
```
- **Impact** : Transfert licences manquant
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-019

#### 20. `src/pages/dashboard/LiveSessionsManagement.tsx:269`
```typescript
// TODO: Intégrer avec les services Zoom/Google Meet
```
- **Impact** : Intégration vidéo manquante
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-020

#### 21. `src/components/physical/PreOrderManager.tsx:267`
```typescript
// TODO: API call to save
```
- **Impact** : Sauvegarde précommandes non fonctionnelle
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-021

#### 22. `src/components/reviews/ShareReviewButtons.tsx:110`
```typescript
// TODO: Implement analytics tracking
```
- **Impact** : Analytics partage manquant
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-022

#### 23. `src/components/returns/ReturnRequestForm.tsx:126`
```typescript
// TODO: Upload vers Supabase Storage
```
- **Impact** : Upload fichiers retours manquant
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-023

#### 24. `src/pages/service/BookingsManagement.tsx:221`
```typescript
// TODO: Ajouter service_availability aux types Supabase générés
```
- **Impact** : Types TypeScript incomplets
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟡 À faire
- **Issue** : #TODO-024

#### 25. `src/integrations/payments/flutterwave.ts:230`
```typescript
// TODO: Implémenter la vérification de signature Flutterwave
```
- **Impact** : Sécurité webhooks Flutterwave
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-025

#### 26. `src/integrations/payments/paypal.ts:237`
```typescript
// TODO: Implémenter la logique complète de capture puis refund
// TODO: Implémenter la vérification de signature PayPal
```
- **Impact** : Intégration PayPal incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-026

#### 27. `src/integrations/payments/stripe.ts:215`
```typescript
// TODO: Implémenter la vérification de signature Stripe
```
- **Impact** : Sécurité webhooks Stripe
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-027

#### 28. `src/lib/gamification/system.ts:322`
```typescript
// TODO: Envoyer une notification de montée de niveau
// TODO: Attribuer des récompenses de niveau
```
- **Impact** : Gamification incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-028

#### 29. `src/lib/pwa.ts:168`
```typescript
// TODO: Implémenter l'envoi au backend
```
- **Impact** : PWA notifications manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-029

#### 30. `src/hooks/physical/useInventoryReports.ts:159`
```typescript
// TODO: Calculate from orders/sales
```
- **Impact** : Rapports inventaire imprécis
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-030

#### 31. `src/services/fedex/FedexService.ts:17`
```typescript
// TODO: Implement real API call (4 occurrences)
```
- **Impact** : Intégration FedEx non fonctionnelle
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-031

#### 32. `src/hooks/services/useServiceReports.ts:340`
```typescript
// TODO: Get peak utilization by day (requires more complex query)
```
- **Impact** : Rapports services incomplets
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-032

#### 33. `src/components/courses/StudentProgressManager.tsx:171`
```typescript
// TODO: Calculer basé sur les dernières semaines
```
- **Impact** : Calcul progression imprécis
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-033

---

## 🟢 PRIORITÉ BASSE / TESTS (14 TODO)

### Tests à Implémenter

#### 34-47. Tests d'Intégration Supabase
`src/hooks/__tests__/multiStoresIsolation.integration.test.ts`
- **5 TODO** pour tests d'intégration avec environnement de test Supabase
- **Effort** : 🟡 Moyen (4-5h)
- **Status** : 🟢 À faire
- **Issue** : #TODO-034

#### 48. `src/components/settings/__tests__/DomainSettings.test.tsx:127`
```typescript
// TODO: Tester la désactivation automatique quand SSL est off
```
- **Impact** : Test manquant
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟢 À faire
- **Issue** : #TODO-048

---

## 📊 STATISTIQUES

| Priorité | Nombre | Traités | Restants | % |
|----------|--------|---------|----------|---|
| 🔴 **Critique** | 8 | 8 | 0 | 100% ✅ |
| 🟡 **Moyenne** | 25 | 0 | 25 | 0% |
| 🟢 **Basse** | 14 | 0 | 14 | 0% |
| **TOTAL** | **47** | **8** | **39** | **17%** |

---

## 🎯 OBJECTIFS

- **Semaine 1** : Traiter 8 TODO critiques
- **Semaine 2** : Traiter 10 TODO moyennes
- **Semaine 3** : Traiter 10 TODO moyennes restantes
- **Semaine 4** : Traiter TODO basses + Tests

---

## 📝 NOTES

- Les TODO dans les fichiers de tests sont considérés comme basse priorité
- Les TODO liés aux intégrations externes (FedEx, PayPal, Stripe) nécessitent des clés API
- Certains TODO nécessitent des modifications de schéma Supabase

---

**Dernière mise à jour** : 2025-01-30



**Date de création** : 2025-01-30  
**Dernière mise à jour** : 2025-01-30  
**Total TODO identifiés** : 47  
**TODO Critiques** : 0/8 (100% corrigés) ✅  
**Objectif** : Traiter tous les TODO critiques et réduire les TODO moyennes

---

## 🔴 PRIORITÉ CRITIQUE (8 TODO)

### 1. `src/lib/notifications/service-booking-notifications.ts:180` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Récupération du user_id depuis le booking
const { data: booking } = await supabase
  .from('service_bookings')
  .select('user_id, customer_id')
  .eq('id', data.booking_id)
  .single();
const userId = booking.user_id || booking.customer_id;
```
- **Impact** : Notifications fonctionnent correctement ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-001

### 2. `src/pages/courses/CourseDetail.tsx:190` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Implémentation complète avec useCreateCourseOrder
const result = await createCourseOrder.mutateAsync({...});
```
- **Impact** : Paiement cours fonctionnel ✅
- **Effort** : 🔴 Élevé (4-6h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-002

### 3. `src/pages/courses/CourseDetail.tsx:540` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Navigation vers /dashboard/cohorts/:cohortId
navigate(`/dashboard/cohorts/${cohort.id}`);
```
- **Impact** : Navigation cohort fonctionnelle ✅
- **Effort** : 🟢 Faible (30min)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-003

### 4. `src/components/orders/OrderDetailDialog.tsx:656` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Validation utilisateur et commande avant navigation
const { data: { user } } = await supabase.auth.getUser();
if (!user) { toast(...); return; }
navigate(`/disputes/create?order_id=${order.id}`);
```
- **Impact** : Création litige améliorée ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-004

### 5. `src/pages/payments/PayBalance.tsx:71` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Utilisation de initiateMonerooPayment
const paymentResult = await initiateMonerooPayment({...});
```
- **Impact** : Paiement balance fonctionnel ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-005

### 6. `src/hooks/useDisputes.ts:177` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Notifications temps réel avec Supabase Realtime
channel = supabase.channel('disputes_realtime')
  .on('postgres_changes', {...})
  .subscribe();
```
- **Impact** : Notifications temps réel fonctionnelles ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-006

### 7. `src/pages/vendor/VendorMessaging.tsx:948` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Infinite scroll avec loadMoreMessages
if (target.scrollTop === 0 && !messagesLoading && hasMoreMessages) {
  loadMoreMessages();
}
```
- **Impact** : Pagination messages fonctionnelle ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-007

### 8. `src/pages/service/ServiceWaitlistManagementPage.tsx:105` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Navigation vers page booking avec pré-remplissage et gestion erreurs
navigate(`/service/${entry.serviceId}/book?waitlist=${entryId}`, {
  state: { waitlistEntry: entry, prefillData: {...} }
});
```
- **Impact** : Conversion waitlist améliorée avec meilleure UX ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-008

---

## 🟡 PRIORITÉ MOYENNE (25 TODO)

### Performance & Optimisations

#### 9. `src/pages/Marketplace.tsx:384`
```typescript
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```
- **Impact** : Performance recherche produits
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-009

#### 10. `src/hooks/useMarketplaceProducts.ts:220`
```typescript
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```
- **Impact** : Filtrage variants incomplet
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-010

#### 11. `src/lib/image-upload.ts:99` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Compression avec browser-image-compression
const imageCompression = (await import('browser-image-compression')).default;
const compressedFile = await imageCompression(file, options);
```
- **Impact** : Images compressées automatiquement ✅
- **Effort** : 🟢 Faible (1h) - browser-image-compression déjà installé
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Issue** : #TODO-011

#### 12. `src/hooks/physical/useStockOptimization.ts:291`
```typescript
// TODO: Calculer depuis l'historique des ventes
const averageDailySales = 0; // TODO: Calculer depuis l'historique des ventes
```
- **Impact** : Optimisation stock imprécise
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-012

#### 13. `src/hooks/physical/useStockOptimization.ts:353`
```typescript
// TODO: Intégrer les prévisions
forecast: undefined, // TODO: Intégrer les prévisions
```
- **Impact** : Prévisions stock manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-013

### Fonctionnalités Manquantes

#### 14. `src/lib/files/digital-file-processing.ts:246`
```typescript
// TODO: Implémenter avec JSZip ou Edge Function
```
- **Impact** : Compression fichiers ZIP manquante
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-014

#### 15. `src/lib/marketing/automation.ts:427`
```typescript
// TODO: Implémenter la vérification de schedule
// TODO: Implémenter la vérification de condition
// TODO: Implémenter l'envoi SMS
// TODO: Implémenter l'ajout à un segment
// TODO: Implémenter l'appel webhook
```
- **Impact** : Automation marketing incomplète
- **Effort** : 🔴 Élevé (6-8h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-015

#### 16. `src/components/admin/customization/IntegrationsSection.tsx:142`
```typescript
// TODO: Implémenter les tests de connexion
```
- **Impact** : Tests intégrations manquants
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-016

#### 17. `src/lib/seo/advanced.ts:203`
```typescript
// TODO: Ajouter les liens vers les réseaux sociaux
```
- **Impact** : SEO social incomplet
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-017

#### 18. `src/lib/services/cancellation-policy.ts:275`
```typescript
// TODO: Implémenter l'appel réel à l'API de paiement
// TODO: Implémenter l'appel réel à Moneroo ou PayDunya
```
- **Impact** : Remboursements non fonctionnels
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-018

#### 19. `src/components/digital/customer/MyLicenses.tsx:631`
```typescript
// TODO: Implémenter le transfert de licence
```
- **Impact** : Transfert licences manquant
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-019

#### 20. `src/pages/dashboard/LiveSessionsManagement.tsx:269`
```typescript
// TODO: Intégrer avec les services Zoom/Google Meet
```
- **Impact** : Intégration vidéo manquante
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-020

#### 21. `src/components/physical/PreOrderManager.tsx:267`
```typescript
// TODO: API call to save
```
- **Impact** : Sauvegarde précommandes non fonctionnelle
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-021

#### 22. `src/components/reviews/ShareReviewButtons.tsx:110`
```typescript
// TODO: Implement analytics tracking
```
- **Impact** : Analytics partage manquant
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-022

#### 23. `src/components/returns/ReturnRequestForm.tsx:126`
```typescript
// TODO: Upload vers Supabase Storage
```
- **Impact** : Upload fichiers retours manquant
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-023

#### 24. `src/pages/service/BookingsManagement.tsx:221`
```typescript
// TODO: Ajouter service_availability aux types Supabase générés
```
- **Impact** : Types TypeScript incomplets
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟡 À faire
- **Issue** : #TODO-024

#### 25. `src/integrations/payments/flutterwave.ts:230`
```typescript
// TODO: Implémenter la vérification de signature Flutterwave
```
- **Impact** : Sécurité webhooks Flutterwave
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-025

#### 26. `src/integrations/payments/paypal.ts:237`
```typescript
// TODO: Implémenter la logique complète de capture puis refund
// TODO: Implémenter la vérification de signature PayPal
```
- **Impact** : Intégration PayPal incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-026

#### 27. `src/integrations/payments/stripe.ts:215`
```typescript
// TODO: Implémenter la vérification de signature Stripe
```
- **Impact** : Sécurité webhooks Stripe
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-027

#### 28. `src/lib/gamification/system.ts:322`
```typescript
// TODO: Envoyer une notification de montée de niveau
// TODO: Attribuer des récompenses de niveau
```
- **Impact** : Gamification incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-028

#### 29. `src/lib/pwa.ts:168`
```typescript
// TODO: Implémenter l'envoi au backend
```
- **Impact** : PWA notifications manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-029

#### 30. `src/hooks/physical/useInventoryReports.ts:159`
```typescript
// TODO: Calculate from orders/sales
```
- **Impact** : Rapports inventaire imprécis
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-030

#### 31. `src/services/fedex/FedexService.ts:17`
```typescript
// TODO: Implement real API call (4 occurrences)
```
- **Impact** : Intégration FedEx non fonctionnelle
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-031

#### 32. `src/hooks/services/useServiceReports.ts:340`
```typescript
// TODO: Get peak utilization by day (requires more complex query)
```
- **Impact** : Rapports services incomplets
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-032

#### 33. `src/components/courses/StudentProgressManager.tsx:171`
```typescript
// TODO: Calculer basé sur les dernières semaines
```
- **Impact** : Calcul progression imprécis
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-033

---

## 🟢 PRIORITÉ BASSE / TESTS (14 TODO)

### Tests à Implémenter

#### 34-47. Tests d'Intégration Supabase
`src/hooks/__tests__/multiStoresIsolation.integration.test.ts`
- **5 TODO** pour tests d'intégration avec environnement de test Supabase
- **Effort** : 🟡 Moyen (4-5h)
- **Status** : 🟢 À faire
- **Issue** : #TODO-034

#### 48. `src/components/settings/__tests__/DomainSettings.test.tsx:127`
```typescript
// TODO: Tester la désactivation automatique quand SSL est off
```
- **Impact** : Test manquant
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟢 À faire
- **Issue** : #TODO-048

---

## 📊 STATISTIQUES

| Priorité | Nombre | Traités | Restants | % |
|----------|--------|---------|----------|---|
| 🔴 **Critique** | 8 | 8 | 0 | 100% ✅ |
| 🟡 **Moyenne** | 25 | 0 | 25 | 0% |
| 🟢 **Basse** | 14 | 0 | 14 | 0% |
| **TOTAL** | **47** | **8** | **39** | **17%** |

---

## 🎯 OBJECTIFS

- **Semaine 1** : Traiter 8 TODO critiques
- **Semaine 2** : Traiter 10 TODO moyennes
- **Semaine 3** : Traiter 10 TODO moyennes restantes
- **Semaine 4** : Traiter TODO basses + Tests

---

## 📝 NOTES

- Les TODO dans les fichiers de tests sont considérés comme basse priorité
- Les TODO liés aux intégrations externes (FedEx, PayPal, Stripe) nécessitent des clés API
- Certains TODO nécessitent des modifications de schéma Supabase

---

**Dernière mise à jour** : 2025-01-30



**Date de création** : 2025-01-30  
**Dernière mise à jour** : 2025-01-30  
**Total TODO identifiés** : 47  
**TODO Critiques** : 0/8 (100% corrigés) ✅  
**Objectif** : Traiter tous les TODO critiques et réduire les TODO moyennes

---

## 🔴 PRIORITÉ CRITIQUE (8 TODO)

### 1. `src/lib/notifications/service-booking-notifications.ts:180` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Récupération du user_id depuis le booking
const { data: booking } = await supabase
  .from('service_bookings')
  .select('user_id, customer_id')
  .eq('id', data.booking_id)
  .single();
const userId = booking.user_id || booking.customer_id;
```
- **Impact** : Notifications fonctionnent correctement ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-001

### 2. `src/pages/courses/CourseDetail.tsx:190` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Implémentation complète avec useCreateCourseOrder
const result = await createCourseOrder.mutateAsync({...});
```
- **Impact** : Paiement cours fonctionnel ✅
- **Effort** : 🔴 Élevé (4-6h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-002

### 3. `src/pages/courses/CourseDetail.tsx:540` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Navigation vers /dashboard/cohorts/:cohortId
navigate(`/dashboard/cohorts/${cohort.id}`);
```
- **Impact** : Navigation cohort fonctionnelle ✅
- **Effort** : 🟢 Faible (30min)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-003

### 4. `src/components/orders/OrderDetailDialog.tsx:656` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Validation utilisateur et commande avant navigation
const { data: { user } } = await supabase.auth.getUser();
if (!user) { toast(...); return; }
navigate(`/disputes/create?order_id=${order.id}`);
```
- **Impact** : Création litige améliorée ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-004

### 5. `src/pages/payments/PayBalance.tsx:71` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Utilisation de initiateMonerooPayment
const paymentResult = await initiateMonerooPayment({...});
```
- **Impact** : Paiement balance fonctionnel ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-005

### 6. `src/hooks/useDisputes.ts:177` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Notifications temps réel avec Supabase Realtime
channel = supabase.channel('disputes_realtime')
  .on('postgres_changes', {...})
  .subscribe();
```
- **Impact** : Notifications temps réel fonctionnelles ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-006

### 7. `src/pages/vendor/VendorMessaging.tsx:948` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Infinite scroll avec loadMoreMessages
if (target.scrollTop === 0 && !messagesLoading && hasMoreMessages) {
  loadMoreMessages();
}
```
- **Impact** : Pagination messages fonctionnelle ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-007

### 8. `src/pages/service/ServiceWaitlistManagementPage.tsx:105` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Navigation vers page booking avec pré-remplissage et gestion erreurs
navigate(`/service/${entry.serviceId}/book?waitlist=${entryId}`, {
  state: { waitlistEntry: entry, prefillData: {...} }
});
```
- **Impact** : Conversion waitlist améliorée avec meilleure UX ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-008

---

## 🟡 PRIORITÉ MOYENNE (25 TODO)

### Performance & Optimisations

#### 9. `src/pages/Marketplace.tsx:384`
```typescript
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```
- **Impact** : Performance recherche produits
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-009

#### 10. `src/hooks/useMarketplaceProducts.ts:220`
```typescript
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```
- **Impact** : Filtrage variants incomplet
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-010

#### 11. `src/lib/image-upload.ts:99` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Compression avec browser-image-compression
const imageCompression = (await import('browser-image-compression')).default;
const compressedFile = await imageCompression(file, options);
```
- **Impact** : Images compressées automatiquement ✅
- **Effort** : 🟢 Faible (1h) - browser-image-compression déjà installé
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Issue** : #TODO-011

#### 12. `src/hooks/physical/useStockOptimization.ts:291`
```typescript
// TODO: Calculer depuis l'historique des ventes
const averageDailySales = 0; // TODO: Calculer depuis l'historique des ventes
```
- **Impact** : Optimisation stock imprécise
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-012

#### 13. `src/hooks/physical/useStockOptimization.ts:353`
```typescript
// TODO: Intégrer les prévisions
forecast: undefined, // TODO: Intégrer les prévisions
```
- **Impact** : Prévisions stock manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-013

### Fonctionnalités Manquantes

#### 14. `src/lib/files/digital-file-processing.ts:246`
```typescript
// TODO: Implémenter avec JSZip ou Edge Function
```
- **Impact** : Compression fichiers ZIP manquante
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-014

#### 15. `src/lib/marketing/automation.ts:427`
```typescript
// TODO: Implémenter la vérification de schedule
// TODO: Implémenter la vérification de condition
// TODO: Implémenter l'envoi SMS
// TODO: Implémenter l'ajout à un segment
// TODO: Implémenter l'appel webhook
```
- **Impact** : Automation marketing incomplète
- **Effort** : 🔴 Élevé (6-8h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-015

#### 16. `src/components/admin/customization/IntegrationsSection.tsx:142`
```typescript
// TODO: Implémenter les tests de connexion
```
- **Impact** : Tests intégrations manquants
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-016

#### 17. `src/lib/seo/advanced.ts:203`
```typescript
// TODO: Ajouter les liens vers les réseaux sociaux
```
- **Impact** : SEO social incomplet
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-017

#### 18. `src/lib/services/cancellation-policy.ts:275`
```typescript
// TODO: Implémenter l'appel réel à l'API de paiement
// TODO: Implémenter l'appel réel à Moneroo ou PayDunya
```
- **Impact** : Remboursements non fonctionnels
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-018

#### 19. `src/components/digital/customer/MyLicenses.tsx:631`
```typescript
// TODO: Implémenter le transfert de licence
```
- **Impact** : Transfert licences manquant
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-019

#### 20. `src/pages/dashboard/LiveSessionsManagement.tsx:269`
```typescript
// TODO: Intégrer avec les services Zoom/Google Meet
```
- **Impact** : Intégration vidéo manquante
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-020

#### 21. `src/components/physical/PreOrderManager.tsx:267`
```typescript
// TODO: API call to save
```
- **Impact** : Sauvegarde précommandes non fonctionnelle
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-021

#### 22. `src/components/reviews/ShareReviewButtons.tsx:110`
```typescript
// TODO: Implement analytics tracking
```
- **Impact** : Analytics partage manquant
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-022

#### 23. `src/components/returns/ReturnRequestForm.tsx:126`
```typescript
// TODO: Upload vers Supabase Storage
```
- **Impact** : Upload fichiers retours manquant
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-023

#### 24. `src/pages/service/BookingsManagement.tsx:221`
```typescript
// TODO: Ajouter service_availability aux types Supabase générés
```
- **Impact** : Types TypeScript incomplets
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟡 À faire
- **Issue** : #TODO-024

#### 25. `src/integrations/payments/flutterwave.ts:230`
```typescript
// TODO: Implémenter la vérification de signature Flutterwave
```
- **Impact** : Sécurité webhooks Flutterwave
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-025

#### 26. `src/integrations/payments/paypal.ts:237`
```typescript
// TODO: Implémenter la logique complète de capture puis refund
// TODO: Implémenter la vérification de signature PayPal
```
- **Impact** : Intégration PayPal incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-026

#### 27. `src/integrations/payments/stripe.ts:215`
```typescript
// TODO: Implémenter la vérification de signature Stripe
```
- **Impact** : Sécurité webhooks Stripe
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-027

#### 28. `src/lib/gamification/system.ts:322`
```typescript
// TODO: Envoyer une notification de montée de niveau
// TODO: Attribuer des récompenses de niveau
```
- **Impact** : Gamification incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-028

#### 29. `src/lib/pwa.ts:168`
```typescript
// TODO: Implémenter l'envoi au backend
```
- **Impact** : PWA notifications manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-029

#### 30. `src/hooks/physical/useInventoryReports.ts:159`
```typescript
// TODO: Calculate from orders/sales
```
- **Impact** : Rapports inventaire imprécis
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-030

#### 31. `src/services/fedex/FedexService.ts:17`
```typescript
// TODO: Implement real API call (4 occurrences)
```
- **Impact** : Intégration FedEx non fonctionnelle
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-031

#### 32. `src/hooks/services/useServiceReports.ts:340`
```typescript
// TODO: Get peak utilization by day (requires more complex query)
```
- **Impact** : Rapports services incomplets
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-032

#### 33. `src/components/courses/StudentProgressManager.tsx:171`
```typescript
// TODO: Calculer basé sur les dernières semaines
```
- **Impact** : Calcul progression imprécis
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-033

---

## 🟢 PRIORITÉ BASSE / TESTS (14 TODO)

### Tests à Implémenter

#### 34-47. Tests d'Intégration Supabase
`src/hooks/__tests__/multiStoresIsolation.integration.test.ts`
- **5 TODO** pour tests d'intégration avec environnement de test Supabase
- **Effort** : 🟡 Moyen (4-5h)
- **Status** : 🟢 À faire
- **Issue** : #TODO-034

#### 48. `src/components/settings/__tests__/DomainSettings.test.tsx:127`
```typescript
// TODO: Tester la désactivation automatique quand SSL est off
```
- **Impact** : Test manquant
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟢 À faire
- **Issue** : #TODO-048

---

## 📊 STATISTIQUES

| Priorité | Nombre | Traités | Restants | % |
|----------|--------|---------|----------|---|
| 🔴 **Critique** | 8 | 8 | 0 | 100% ✅ |
| 🟡 **Moyenne** | 25 | 0 | 25 | 0% |
| 🟢 **Basse** | 14 | 0 | 14 | 0% |
| **TOTAL** | **47** | **8** | **39** | **17%** |

---

## 🎯 OBJECTIFS

- **Semaine 1** : Traiter 8 TODO critiques
- **Semaine 2** : Traiter 10 TODO moyennes
- **Semaine 3** : Traiter 10 TODO moyennes restantes
- **Semaine 4** : Traiter TODO basses + Tests

---

## 📝 NOTES

- Les TODO dans les fichiers de tests sont considérés comme basse priorité
- Les TODO liés aux intégrations externes (FedEx, PayPal, Stripe) nécessitent des clés API
- Certains TODO nécessitent des modifications de schéma Supabase

---

**Dernière mise à jour** : 2025-01-30



**Date de création** : 2025-01-30  
**Dernière mise à jour** : 2025-01-30  
**Total TODO identifiés** : 47  
**TODO Critiques** : 0/8 (100% corrigés) ✅  
**Objectif** : Traiter tous les TODO critiques et réduire les TODO moyennes

---

## 🔴 PRIORITÉ CRITIQUE (8 TODO)

### 1. `src/lib/notifications/service-booking-notifications.ts:180` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Récupération du user_id depuis le booking
const { data: booking } = await supabase
  .from('service_bookings')
  .select('user_id, customer_id')
  .eq('id', data.booking_id)
  .single();
const userId = booking.user_id || booking.customer_id;
```
- **Impact** : Notifications fonctionnent correctement ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-001

### 2. `src/pages/courses/CourseDetail.tsx:190` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Implémentation complète avec useCreateCourseOrder
const result = await createCourseOrder.mutateAsync({...});
```
- **Impact** : Paiement cours fonctionnel ✅
- **Effort** : 🔴 Élevé (4-6h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-002

### 3. `src/pages/courses/CourseDetail.tsx:540` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Navigation vers /dashboard/cohorts/:cohortId
navigate(`/dashboard/cohorts/${cohort.id}`);
```
- **Impact** : Navigation cohort fonctionnelle ✅
- **Effort** : 🟢 Faible (30min)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-003

### 4. `src/components/orders/OrderDetailDialog.tsx:656` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Validation utilisateur et commande avant navigation
const { data: { user } } = await supabase.auth.getUser();
if (!user) { toast(...); return; }
navigate(`/disputes/create?order_id=${order.id}`);
```
- **Impact** : Création litige améliorée ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-004

### 5. `src/pages/payments/PayBalance.tsx:71` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Utilisation de initiateMonerooPayment
const paymentResult = await initiateMonerooPayment({...});
```
- **Impact** : Paiement balance fonctionnel ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-005

### 6. `src/hooks/useDisputes.ts:177` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Notifications temps réel avec Supabase Realtime
channel = supabase.channel('disputes_realtime')
  .on('postgres_changes', {...})
  .subscribe();
```
- **Impact** : Notifications temps réel fonctionnelles ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-006

### 7. `src/pages/vendor/VendorMessaging.tsx:948` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Infinite scroll avec loadMoreMessages
if (target.scrollTop === 0 && !messagesLoading && hasMoreMessages) {
  loadMoreMessages();
}
```
- **Impact** : Pagination messages fonctionnelle ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-007

### 8. `src/pages/service/ServiceWaitlistManagementPage.tsx:105` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Navigation vers page booking avec pré-remplissage et gestion erreurs
navigate(`/service/${entry.serviceId}/book?waitlist=${entryId}`, {
  state: { waitlistEntry: entry, prefillData: {...} }
});
```
- **Impact** : Conversion waitlist améliorée avec meilleure UX ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-008

---

## 🟡 PRIORITÉ MOYENNE (25 TODO)

### Performance & Optimisations

#### 9. `src/pages/Marketplace.tsx:384`
```typescript
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```
- **Impact** : Performance recherche produits
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-009

#### 10. `src/hooks/useMarketplaceProducts.ts:220`
```typescript
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```
- **Impact** : Filtrage variants incomplet
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-010

#### 11. `src/lib/image-upload.ts:99` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Compression avec browser-image-compression
const imageCompression = (await import('browser-image-compression')).default;
const compressedFile = await imageCompression(file, options);
```
- **Impact** : Images compressées automatiquement ✅
- **Effort** : 🟢 Faible (1h) - browser-image-compression déjà installé
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Issue** : #TODO-011

#### 12. `src/hooks/physical/useStockOptimization.ts:291`
```typescript
// TODO: Calculer depuis l'historique des ventes
const averageDailySales = 0; // TODO: Calculer depuis l'historique des ventes
```
- **Impact** : Optimisation stock imprécise
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-012

#### 13. `src/hooks/physical/useStockOptimization.ts:353`
```typescript
// TODO: Intégrer les prévisions
forecast: undefined, // TODO: Intégrer les prévisions
```
- **Impact** : Prévisions stock manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-013

### Fonctionnalités Manquantes

#### 14. `src/lib/files/digital-file-processing.ts:246`
```typescript
// TODO: Implémenter avec JSZip ou Edge Function
```
- **Impact** : Compression fichiers ZIP manquante
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-014

#### 15. `src/lib/marketing/automation.ts:427`
```typescript
// TODO: Implémenter la vérification de schedule
// TODO: Implémenter la vérification de condition
// TODO: Implémenter l'envoi SMS
// TODO: Implémenter l'ajout à un segment
// TODO: Implémenter l'appel webhook
```
- **Impact** : Automation marketing incomplète
- **Effort** : 🔴 Élevé (6-8h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-015

#### 16. `src/components/admin/customization/IntegrationsSection.tsx:142`
```typescript
// TODO: Implémenter les tests de connexion
```
- **Impact** : Tests intégrations manquants
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-016

#### 17. `src/lib/seo/advanced.ts:203`
```typescript
// TODO: Ajouter les liens vers les réseaux sociaux
```
- **Impact** : SEO social incomplet
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-017

#### 18. `src/lib/services/cancellation-policy.ts:275`
```typescript
// TODO: Implémenter l'appel réel à l'API de paiement
// TODO: Implémenter l'appel réel à Moneroo ou PayDunya
```
- **Impact** : Remboursements non fonctionnels
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-018

#### 19. `src/components/digital/customer/MyLicenses.tsx:631`
```typescript
// TODO: Implémenter le transfert de licence
```
- **Impact** : Transfert licences manquant
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-019

#### 20. `src/pages/dashboard/LiveSessionsManagement.tsx:269`
```typescript
// TODO: Intégrer avec les services Zoom/Google Meet
```
- **Impact** : Intégration vidéo manquante
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-020

#### 21. `src/components/physical/PreOrderManager.tsx:267`
```typescript
// TODO: API call to save
```
- **Impact** : Sauvegarde précommandes non fonctionnelle
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-021

#### 22. `src/components/reviews/ShareReviewButtons.tsx:110`
```typescript
// TODO: Implement analytics tracking
```
- **Impact** : Analytics partage manquant
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-022

#### 23. `src/components/returns/ReturnRequestForm.tsx:126`
```typescript
// TODO: Upload vers Supabase Storage
```
- **Impact** : Upload fichiers retours manquant
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-023

#### 24. `src/pages/service/BookingsManagement.tsx:221`
```typescript
// TODO: Ajouter service_availability aux types Supabase générés
```
- **Impact** : Types TypeScript incomplets
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟡 À faire
- **Issue** : #TODO-024

#### 25. `src/integrations/payments/flutterwave.ts:230`
```typescript
// TODO: Implémenter la vérification de signature Flutterwave
```
- **Impact** : Sécurité webhooks Flutterwave
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-025

#### 26. `src/integrations/payments/paypal.ts:237`
```typescript
// TODO: Implémenter la logique complète de capture puis refund
// TODO: Implémenter la vérification de signature PayPal
```
- **Impact** : Intégration PayPal incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-026

#### 27. `src/integrations/payments/stripe.ts:215`
```typescript
// TODO: Implémenter la vérification de signature Stripe
```
- **Impact** : Sécurité webhooks Stripe
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-027

#### 28. `src/lib/gamification/system.ts:322`
```typescript
// TODO: Envoyer une notification de montée de niveau
// TODO: Attribuer des récompenses de niveau
```
- **Impact** : Gamification incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-028

#### 29. `src/lib/pwa.ts:168`
```typescript
// TODO: Implémenter l'envoi au backend
```
- **Impact** : PWA notifications manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-029

#### 30. `src/hooks/physical/useInventoryReports.ts:159`
```typescript
// TODO: Calculate from orders/sales
```
- **Impact** : Rapports inventaire imprécis
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-030

#### 31. `src/services/fedex/FedexService.ts:17`
```typescript
// TODO: Implement real API call (4 occurrences)
```
- **Impact** : Intégration FedEx non fonctionnelle
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-031

#### 32. `src/hooks/services/useServiceReports.ts:340`
```typescript
// TODO: Get peak utilization by day (requires more complex query)
```
- **Impact** : Rapports services incomplets
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-032

#### 33. `src/components/courses/StudentProgressManager.tsx:171`
```typescript
// TODO: Calculer basé sur les dernières semaines
```
- **Impact** : Calcul progression imprécis
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-033

---

## 🟢 PRIORITÉ BASSE / TESTS (14 TODO)

### Tests à Implémenter

#### 34-47. Tests d'Intégration Supabase
`src/hooks/__tests__/multiStoresIsolation.integration.test.ts`
- **5 TODO** pour tests d'intégration avec environnement de test Supabase
- **Effort** : 🟡 Moyen (4-5h)
- **Status** : 🟢 À faire
- **Issue** : #TODO-034

#### 48. `src/components/settings/__tests__/DomainSettings.test.tsx:127`
```typescript
// TODO: Tester la désactivation automatique quand SSL est off
```
- **Impact** : Test manquant
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟢 À faire
- **Issue** : #TODO-048

---

## 📊 STATISTIQUES

| Priorité | Nombre | Traités | Restants | % |
|----------|--------|---------|----------|---|
| 🔴 **Critique** | 8 | 8 | 0 | 100% ✅ |
| 🟡 **Moyenne** | 25 | 0 | 25 | 0% |
| 🟢 **Basse** | 14 | 0 | 14 | 0% |
| **TOTAL** | **47** | **8** | **39** | **17%** |

---

## 🎯 OBJECTIFS

- **Semaine 1** : Traiter 8 TODO critiques
- **Semaine 2** : Traiter 10 TODO moyennes
- **Semaine 3** : Traiter 10 TODO moyennes restantes
- **Semaine 4** : Traiter TODO basses + Tests

---

## 📝 NOTES

- Les TODO dans les fichiers de tests sont considérés comme basse priorité
- Les TODO liés aux intégrations externes (FedEx, PayPal, Stripe) nécessitent des clés API
- Certains TODO nécessitent des modifications de schéma Supabase

---

**Dernière mise à jour** : 2025-01-30



**Date de création** : 2025-01-30  
**Dernière mise à jour** : 2025-01-30  
**Total TODO identifiés** : 47  
**TODO Critiques** : 0/8 (100% corrigés) ✅  
**Objectif** : Traiter tous les TODO critiques et réduire les TODO moyennes

---

## 🔴 PRIORITÉ CRITIQUE (8 TODO)

### 1. `src/lib/notifications/service-booking-notifications.ts:180` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Récupération du user_id depuis le booking
const { data: booking } = await supabase
  .from('service_bookings')
  .select('user_id, customer_id')
  .eq('id', data.booking_id)
  .single();
const userId = booking.user_id || booking.customer_id;
```
- **Impact** : Notifications fonctionnent correctement ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-001

### 2. `src/pages/courses/CourseDetail.tsx:190` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Implémentation complète avec useCreateCourseOrder
const result = await createCourseOrder.mutateAsync({...});
```
- **Impact** : Paiement cours fonctionnel ✅
- **Effort** : 🔴 Élevé (4-6h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-002

### 3. `src/pages/courses/CourseDetail.tsx:540` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Navigation vers /dashboard/cohorts/:cohortId
navigate(`/dashboard/cohorts/${cohort.id}`);
```
- **Impact** : Navigation cohort fonctionnelle ✅
- **Effort** : 🟢 Faible (30min)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-003

### 4. `src/components/orders/OrderDetailDialog.tsx:656` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Validation utilisateur et commande avant navigation
const { data: { user } } = await supabase.auth.getUser();
if (!user) { toast(...); return; }
navigate(`/disputes/create?order_id=${order.id}`);
```
- **Impact** : Création litige améliorée ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-004

### 5. `src/pages/payments/PayBalance.tsx:71` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Utilisation de initiateMonerooPayment
const paymentResult = await initiateMonerooPayment({...});
```
- **Impact** : Paiement balance fonctionnel ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-005

### 6. `src/hooks/useDisputes.ts:177` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Notifications temps réel avec Supabase Realtime
channel = supabase.channel('disputes_realtime')
  .on('postgres_changes', {...})
  .subscribe();
```
- **Impact** : Notifications temps réel fonctionnelles ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-006

### 7. `src/pages/vendor/VendorMessaging.tsx:948` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Infinite scroll avec loadMoreMessages
if (target.scrollTop === 0 && !messagesLoading && hasMoreMessages) {
  loadMoreMessages();
}
```
- **Impact** : Pagination messages fonctionnelle ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-007

### 8. `src/pages/service/ServiceWaitlistManagementPage.tsx:105` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Navigation vers page booking avec pré-remplissage et gestion erreurs
navigate(`/service/${entry.serviceId}/book?waitlist=${entryId}`, {
  state: { waitlistEntry: entry, prefillData: {...} }
});
```
- **Impact** : Conversion waitlist améliorée avec meilleure UX ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-008

---

## 🟡 PRIORITÉ MOYENNE (25 TODO)

### Performance & Optimisations

#### 9. `src/pages/Marketplace.tsx:384`
```typescript
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```
- **Impact** : Performance recherche produits
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-009

#### 10. `src/hooks/useMarketplaceProducts.ts:220`
```typescript
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```
- **Impact** : Filtrage variants incomplet
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-010

#### 11. `src/lib/image-upload.ts:99` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Compression avec browser-image-compression
const imageCompression = (await import('browser-image-compression')).default;
const compressedFile = await imageCompression(file, options);
```
- **Impact** : Images compressées automatiquement ✅
- **Effort** : 🟢 Faible (1h) - browser-image-compression déjà installé
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Issue** : #TODO-011

#### 12. `src/hooks/physical/useStockOptimization.ts:291`
```typescript
// TODO: Calculer depuis l'historique des ventes
const averageDailySales = 0; // TODO: Calculer depuis l'historique des ventes
```
- **Impact** : Optimisation stock imprécise
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-012

#### 13. `src/hooks/physical/useStockOptimization.ts:353`
```typescript
// TODO: Intégrer les prévisions
forecast: undefined, // TODO: Intégrer les prévisions
```
- **Impact** : Prévisions stock manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-013

### Fonctionnalités Manquantes

#### 14. `src/lib/files/digital-file-processing.ts:246`
```typescript
// TODO: Implémenter avec JSZip ou Edge Function
```
- **Impact** : Compression fichiers ZIP manquante
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-014

#### 15. `src/lib/marketing/automation.ts:427`
```typescript
// TODO: Implémenter la vérification de schedule
// TODO: Implémenter la vérification de condition
// TODO: Implémenter l'envoi SMS
// TODO: Implémenter l'ajout à un segment
// TODO: Implémenter l'appel webhook
```
- **Impact** : Automation marketing incomplète
- **Effort** : 🔴 Élevé (6-8h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-015

#### 16. `src/components/admin/customization/IntegrationsSection.tsx:142`
```typescript
// TODO: Implémenter les tests de connexion
```
- **Impact** : Tests intégrations manquants
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-016

#### 17. `src/lib/seo/advanced.ts:203`
```typescript
// TODO: Ajouter les liens vers les réseaux sociaux
```
- **Impact** : SEO social incomplet
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-017

#### 18. `src/lib/services/cancellation-policy.ts:275`
```typescript
// TODO: Implémenter l'appel réel à l'API de paiement
// TODO: Implémenter l'appel réel à Moneroo ou PayDunya
```
- **Impact** : Remboursements non fonctionnels
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-018

#### 19. `src/components/digital/customer/MyLicenses.tsx:631`
```typescript
// TODO: Implémenter le transfert de licence
```
- **Impact** : Transfert licences manquant
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-019

#### 20. `src/pages/dashboard/LiveSessionsManagement.tsx:269`
```typescript
// TODO: Intégrer avec les services Zoom/Google Meet
```
- **Impact** : Intégration vidéo manquante
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-020

#### 21. `src/components/physical/PreOrderManager.tsx:267`
```typescript
// TODO: API call to save
```
- **Impact** : Sauvegarde précommandes non fonctionnelle
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-021

#### 22. `src/components/reviews/ShareReviewButtons.tsx:110`
```typescript
// TODO: Implement analytics tracking
```
- **Impact** : Analytics partage manquant
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-022

#### 23. `src/components/returns/ReturnRequestForm.tsx:126`
```typescript
// TODO: Upload vers Supabase Storage
```
- **Impact** : Upload fichiers retours manquant
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-023

#### 24. `src/pages/service/BookingsManagement.tsx:221`
```typescript
// TODO: Ajouter service_availability aux types Supabase générés
```
- **Impact** : Types TypeScript incomplets
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟡 À faire
- **Issue** : #TODO-024

#### 25. `src/integrations/payments/flutterwave.ts:230`
```typescript
// TODO: Implémenter la vérification de signature Flutterwave
```
- **Impact** : Sécurité webhooks Flutterwave
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-025

#### 26. `src/integrations/payments/paypal.ts:237`
```typescript
// TODO: Implémenter la logique complète de capture puis refund
// TODO: Implémenter la vérification de signature PayPal
```
- **Impact** : Intégration PayPal incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-026

#### 27. `src/integrations/payments/stripe.ts:215`
```typescript
// TODO: Implémenter la vérification de signature Stripe
```
- **Impact** : Sécurité webhooks Stripe
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-027

#### 28. `src/lib/gamification/system.ts:322`
```typescript
// TODO: Envoyer une notification de montée de niveau
// TODO: Attribuer des récompenses de niveau
```
- **Impact** : Gamification incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-028

#### 29. `src/lib/pwa.ts:168`
```typescript
// TODO: Implémenter l'envoi au backend
```
- **Impact** : PWA notifications manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-029

#### 30. `src/hooks/physical/useInventoryReports.ts:159`
```typescript
// TODO: Calculate from orders/sales
```
- **Impact** : Rapports inventaire imprécis
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-030

#### 31. `src/services/fedex/FedexService.ts:17`
```typescript
// TODO: Implement real API call (4 occurrences)
```
- **Impact** : Intégration FedEx non fonctionnelle
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-031

#### 32. `src/hooks/services/useServiceReports.ts:340`
```typescript
// TODO: Get peak utilization by day (requires more complex query)
```
- **Impact** : Rapports services incomplets
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-032

#### 33. `src/components/courses/StudentProgressManager.tsx:171`
```typescript
// TODO: Calculer basé sur les dernières semaines
```
- **Impact** : Calcul progression imprécis
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-033

---

## 🟢 PRIORITÉ BASSE / TESTS (14 TODO)

### Tests à Implémenter

#### 34-47. Tests d'Intégration Supabase
`src/hooks/__tests__/multiStoresIsolation.integration.test.ts`
- **5 TODO** pour tests d'intégration avec environnement de test Supabase
- **Effort** : 🟡 Moyen (4-5h)
- **Status** : 🟢 À faire
- **Issue** : #TODO-034

#### 48. `src/components/settings/__tests__/DomainSettings.test.tsx:127`
```typescript
// TODO: Tester la désactivation automatique quand SSL est off
```
- **Impact** : Test manquant
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟢 À faire
- **Issue** : #TODO-048

---

## 📊 STATISTIQUES

| Priorité | Nombre | Traités | Restants | % |
|----------|--------|---------|----------|---|
| 🔴 **Critique** | 8 | 8 | 0 | 100% ✅ |
| 🟡 **Moyenne** | 25 | 0 | 25 | 0% |
| 🟢 **Basse** | 14 | 0 | 14 | 0% |
| **TOTAL** | **47** | **8** | **39** | **17%** |

---

## 🎯 OBJECTIFS

- **Semaine 1** : Traiter 8 TODO critiques
- **Semaine 2** : Traiter 10 TODO moyennes
- **Semaine 3** : Traiter 10 TODO moyennes restantes
- **Semaine 4** : Traiter TODO basses + Tests

---

## 📝 NOTES

- Les TODO dans les fichiers de tests sont considérés comme basse priorité
- Les TODO liés aux intégrations externes (FedEx, PayPal, Stripe) nécessitent des clés API
- Certains TODO nécessitent des modifications de schéma Supabase

---

**Dernière mise à jour** : 2025-01-30



**Date de création** : 2025-01-30  
**Dernière mise à jour** : 2025-01-30  
**Total TODO identifiés** : 47  
**TODO Critiques** : 0/8 (100% corrigés) ✅  
**Objectif** : Traiter tous les TODO critiques et réduire les TODO moyennes

---

## 🔴 PRIORITÉ CRITIQUE (8 TODO)

### 1. `src/lib/notifications/service-booking-notifications.ts:180` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Récupération du user_id depuis le booking
const { data: booking } = await supabase
  .from('service_bookings')
  .select('user_id, customer_id')
  .eq('id', data.booking_id)
  .single();
const userId = booking.user_id || booking.customer_id;
```
- **Impact** : Notifications fonctionnent correctement ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-001

### 2. `src/pages/courses/CourseDetail.tsx:190` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Implémentation complète avec useCreateCourseOrder
const result = await createCourseOrder.mutateAsync({...});
```
- **Impact** : Paiement cours fonctionnel ✅
- **Effort** : 🔴 Élevé (4-6h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-002

### 3. `src/pages/courses/CourseDetail.tsx:540` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Navigation vers /dashboard/cohorts/:cohortId
navigate(`/dashboard/cohorts/${cohort.id}`);
```
- **Impact** : Navigation cohort fonctionnelle ✅
- **Effort** : 🟢 Faible (30min)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-003

### 4. `src/components/orders/OrderDetailDialog.tsx:656` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Validation utilisateur et commande avant navigation
const { data: { user } } = await supabase.auth.getUser();
if (!user) { toast(...); return; }
navigate(`/disputes/create?order_id=${order.id}`);
```
- **Impact** : Création litige améliorée ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-004

### 5. `src/pages/payments/PayBalance.tsx:71` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Utilisation de initiateMonerooPayment
const paymentResult = await initiateMonerooPayment({...});
```
- **Impact** : Paiement balance fonctionnel ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-005

### 6. `src/hooks/useDisputes.ts:177` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Notifications temps réel avec Supabase Realtime
channel = supabase.channel('disputes_realtime')
  .on('postgres_changes', {...})
  .subscribe();
```
- **Impact** : Notifications temps réel fonctionnelles ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-006

### 7. `src/pages/vendor/VendorMessaging.tsx:948` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Infinite scroll avec loadMoreMessages
if (target.scrollTop === 0 && !messagesLoading && hasMoreMessages) {
  loadMoreMessages();
}
```
- **Impact** : Pagination messages fonctionnelle ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-007

### 8. `src/pages/service/ServiceWaitlistManagementPage.tsx:105` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Navigation vers page booking avec pré-remplissage et gestion erreurs
navigate(`/service/${entry.serviceId}/book?waitlist=${entryId}`, {
  state: { waitlistEntry: entry, prefillData: {...} }
});
```
- **Impact** : Conversion waitlist améliorée avec meilleure UX ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-008

---

## 🟡 PRIORITÉ MOYENNE (25 TODO)

### Performance & Optimisations

#### 9. `src/pages/Marketplace.tsx:384`
```typescript
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```
- **Impact** : Performance recherche produits
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-009

#### 10. `src/hooks/useMarketplaceProducts.ts:220`
```typescript
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```
- **Impact** : Filtrage variants incomplet
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-010

#### 11. `src/lib/image-upload.ts:99` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Compression avec browser-image-compression
const imageCompression = (await import('browser-image-compression')).default;
const compressedFile = await imageCompression(file, options);
```
- **Impact** : Images compressées automatiquement ✅
- **Effort** : 🟢 Faible (1h) - browser-image-compression déjà installé
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Issue** : #TODO-011

#### 12. `src/hooks/physical/useStockOptimization.ts:291`
```typescript
// TODO: Calculer depuis l'historique des ventes
const averageDailySales = 0; // TODO: Calculer depuis l'historique des ventes
```
- **Impact** : Optimisation stock imprécise
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-012

#### 13. `src/hooks/physical/useStockOptimization.ts:353`
```typescript
// TODO: Intégrer les prévisions
forecast: undefined, // TODO: Intégrer les prévisions
```
- **Impact** : Prévisions stock manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-013

### Fonctionnalités Manquantes

#### 14. `src/lib/files/digital-file-processing.ts:246`
```typescript
// TODO: Implémenter avec JSZip ou Edge Function
```
- **Impact** : Compression fichiers ZIP manquante
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-014

#### 15. `src/lib/marketing/automation.ts:427`
```typescript
// TODO: Implémenter la vérification de schedule
// TODO: Implémenter la vérification de condition
// TODO: Implémenter l'envoi SMS
// TODO: Implémenter l'ajout à un segment
// TODO: Implémenter l'appel webhook
```
- **Impact** : Automation marketing incomplète
- **Effort** : 🔴 Élevé (6-8h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-015

#### 16. `src/components/admin/customization/IntegrationsSection.tsx:142`
```typescript
// TODO: Implémenter les tests de connexion
```
- **Impact** : Tests intégrations manquants
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-016

#### 17. `src/lib/seo/advanced.ts:203`
```typescript
// TODO: Ajouter les liens vers les réseaux sociaux
```
- **Impact** : SEO social incomplet
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-017

#### 18. `src/lib/services/cancellation-policy.ts:275`
```typescript
// TODO: Implémenter l'appel réel à l'API de paiement
// TODO: Implémenter l'appel réel à Moneroo ou PayDunya
```
- **Impact** : Remboursements non fonctionnels
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-018

#### 19. `src/components/digital/customer/MyLicenses.tsx:631`
```typescript
// TODO: Implémenter le transfert de licence
```
- **Impact** : Transfert licences manquant
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-019

#### 20. `src/pages/dashboard/LiveSessionsManagement.tsx:269`
```typescript
// TODO: Intégrer avec les services Zoom/Google Meet
```
- **Impact** : Intégration vidéo manquante
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-020

#### 21. `src/components/physical/PreOrderManager.tsx:267`
```typescript
// TODO: API call to save
```
- **Impact** : Sauvegarde précommandes non fonctionnelle
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-021

#### 22. `src/components/reviews/ShareReviewButtons.tsx:110`
```typescript
// TODO: Implement analytics tracking
```
- **Impact** : Analytics partage manquant
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-022

#### 23. `src/components/returns/ReturnRequestForm.tsx:126`
```typescript
// TODO: Upload vers Supabase Storage
```
- **Impact** : Upload fichiers retours manquant
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-023

#### 24. `src/pages/service/BookingsManagement.tsx:221`
```typescript
// TODO: Ajouter service_availability aux types Supabase générés
```
- **Impact** : Types TypeScript incomplets
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟡 À faire
- **Issue** : #TODO-024

#### 25. `src/integrations/payments/flutterwave.ts:230`
```typescript
// TODO: Implémenter la vérification de signature Flutterwave
```
- **Impact** : Sécurité webhooks Flutterwave
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-025

#### 26. `src/integrations/payments/paypal.ts:237`
```typescript
// TODO: Implémenter la logique complète de capture puis refund
// TODO: Implémenter la vérification de signature PayPal
```
- **Impact** : Intégration PayPal incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-026

#### 27. `src/integrations/payments/stripe.ts:215`
```typescript
// TODO: Implémenter la vérification de signature Stripe
```
- **Impact** : Sécurité webhooks Stripe
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-027

#### 28. `src/lib/gamification/system.ts:322`
```typescript
// TODO: Envoyer une notification de montée de niveau
// TODO: Attribuer des récompenses de niveau
```
- **Impact** : Gamification incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-028

#### 29. `src/lib/pwa.ts:168`
```typescript
// TODO: Implémenter l'envoi au backend
```
- **Impact** : PWA notifications manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-029

#### 30. `src/hooks/physical/useInventoryReports.ts:159`
```typescript
// TODO: Calculate from orders/sales
```
- **Impact** : Rapports inventaire imprécis
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-030

#### 31. `src/services/fedex/FedexService.ts:17`
```typescript
// TODO: Implement real API call (4 occurrences)
```
- **Impact** : Intégration FedEx non fonctionnelle
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-031

#### 32. `src/hooks/services/useServiceReports.ts:340`
```typescript
// TODO: Get peak utilization by day (requires more complex query)
```
- **Impact** : Rapports services incomplets
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-032

#### 33. `src/components/courses/StudentProgressManager.tsx:171`
```typescript
// TODO: Calculer basé sur les dernières semaines
```
- **Impact** : Calcul progression imprécis
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-033

---

## 🟢 PRIORITÉ BASSE / TESTS (14 TODO)

### Tests à Implémenter

#### 34-47. Tests d'Intégration Supabase
`src/hooks/__tests__/multiStoresIsolation.integration.test.ts`
- **5 TODO** pour tests d'intégration avec environnement de test Supabase
- **Effort** : 🟡 Moyen (4-5h)
- **Status** : 🟢 À faire
- **Issue** : #TODO-034

#### 48. `src/components/settings/__tests__/DomainSettings.test.tsx:127`
```typescript
// TODO: Tester la désactivation automatique quand SSL est off
```
- **Impact** : Test manquant
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟢 À faire
- **Issue** : #TODO-048

---

## 📊 STATISTIQUES

| Priorité | Nombre | Traités | Restants | % |
|----------|--------|---------|----------|---|
| 🔴 **Critique** | 8 | 8 | 0 | 100% ✅ |
| 🟡 **Moyenne** | 25 | 0 | 25 | 0% |
| 🟢 **Basse** | 14 | 0 | 14 | 0% |
| **TOTAL** | **47** | **8** | **39** | **17%** |

---

## 🎯 OBJECTIFS

- **Semaine 1** : Traiter 8 TODO critiques
- **Semaine 2** : Traiter 10 TODO moyennes
- **Semaine 3** : Traiter 10 TODO moyennes restantes
- **Semaine 4** : Traiter TODO basses + Tests

---

## 📝 NOTES

- Les TODO dans les fichiers de tests sont considérés comme basse priorité
- Les TODO liés aux intégrations externes (FedEx, PayPal, Stripe) nécessitent des clés API
- Certains TODO nécessitent des modifications de schéma Supabase

---

**Dernière mise à jour** : 2025-01-30



**Date de création** : 2025-01-30  
**Dernière mise à jour** : 2025-01-30  
**Total TODO identifiés** : 47  
**TODO Critiques** : 0/8 (100% corrigés) ✅  
**Objectif** : Traiter tous les TODO critiques et réduire les TODO moyennes

---

## 🔴 PRIORITÉ CRITIQUE (8 TODO)

### 1. `src/lib/notifications/service-booking-notifications.ts:180` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Récupération du user_id depuis le booking
const { data: booking } = await supabase
  .from('service_bookings')
  .select('user_id, customer_id')
  .eq('id', data.booking_id)
  .single();
const userId = booking.user_id || booking.customer_id;
```
- **Impact** : Notifications fonctionnent correctement ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-001

### 2. `src/pages/courses/CourseDetail.tsx:190` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Implémentation complète avec useCreateCourseOrder
const result = await createCourseOrder.mutateAsync({...});
```
- **Impact** : Paiement cours fonctionnel ✅
- **Effort** : 🔴 Élevé (4-6h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-002

### 3. `src/pages/courses/CourseDetail.tsx:540` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Navigation vers /dashboard/cohorts/:cohortId
navigate(`/dashboard/cohorts/${cohort.id}`);
```
- **Impact** : Navigation cohort fonctionnelle ✅
- **Effort** : 🟢 Faible (30min)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-003

### 4. `src/components/orders/OrderDetailDialog.tsx:656` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Validation utilisateur et commande avant navigation
const { data: { user } } = await supabase.auth.getUser();
if (!user) { toast(...); return; }
navigate(`/disputes/create?order_id=${order.id}`);
```
- **Impact** : Création litige améliorée ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-004

### 5. `src/pages/payments/PayBalance.tsx:71` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Utilisation de initiateMonerooPayment
const paymentResult = await initiateMonerooPayment({...});
```
- **Impact** : Paiement balance fonctionnel ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-005

### 6. `src/hooks/useDisputes.ts:177` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Notifications temps réel avec Supabase Realtime
channel = supabase.channel('disputes_realtime')
  .on('postgres_changes', {...})
  .subscribe();
```
- **Impact** : Notifications temps réel fonctionnelles ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-006

### 7. `src/pages/vendor/VendorMessaging.tsx:948` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Infinite scroll avec loadMoreMessages
if (target.scrollTop === 0 && !messagesLoading && hasMoreMessages) {
  loadMoreMessages();
}
```
- **Impact** : Pagination messages fonctionnelle ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-007

### 8. `src/pages/service/ServiceWaitlistManagementPage.tsx:105` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Navigation vers page booking avec pré-remplissage et gestion erreurs
navigate(`/service/${entry.serviceId}/book?waitlist=${entryId}`, {
  state: { waitlistEntry: entry, prefillData: {...} }
});
```
- **Impact** : Conversion waitlist améliorée avec meilleure UX ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-008

---

## 🟡 PRIORITÉ MOYENNE (25 TODO)

### Performance & Optimisations

#### 9. `src/pages/Marketplace.tsx:384`
```typescript
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```
- **Impact** : Performance recherche produits
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-009

#### 10. `src/hooks/useMarketplaceProducts.ts:220`
```typescript
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```
- **Impact** : Filtrage variants incomplet
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-010

#### 11. `src/lib/image-upload.ts:99` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Compression avec browser-image-compression
const imageCompression = (await import('browser-image-compression')).default;
const compressedFile = await imageCompression(file, options);
```
- **Impact** : Images compressées automatiquement ✅
- **Effort** : 🟢 Faible (1h) - browser-image-compression déjà installé
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Issue** : #TODO-011

#### 12. `src/hooks/physical/useStockOptimization.ts:291`
```typescript
// TODO: Calculer depuis l'historique des ventes
const averageDailySales = 0; // TODO: Calculer depuis l'historique des ventes
```
- **Impact** : Optimisation stock imprécise
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-012

#### 13. `src/hooks/physical/useStockOptimization.ts:353`
```typescript
// TODO: Intégrer les prévisions
forecast: undefined, // TODO: Intégrer les prévisions
```
- **Impact** : Prévisions stock manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-013

### Fonctionnalités Manquantes

#### 14. `src/lib/files/digital-file-processing.ts:246`
```typescript
// TODO: Implémenter avec JSZip ou Edge Function
```
- **Impact** : Compression fichiers ZIP manquante
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-014

#### 15. `src/lib/marketing/automation.ts:427`
```typescript
// TODO: Implémenter la vérification de schedule
// TODO: Implémenter la vérification de condition
// TODO: Implémenter l'envoi SMS
// TODO: Implémenter l'ajout à un segment
// TODO: Implémenter l'appel webhook
```
- **Impact** : Automation marketing incomplète
- **Effort** : 🔴 Élevé (6-8h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-015

#### 16. `src/components/admin/customization/IntegrationsSection.tsx:142`
```typescript
// TODO: Implémenter les tests de connexion
```
- **Impact** : Tests intégrations manquants
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-016

#### 17. `src/lib/seo/advanced.ts:203`
```typescript
// TODO: Ajouter les liens vers les réseaux sociaux
```
- **Impact** : SEO social incomplet
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-017

#### 18. `src/lib/services/cancellation-policy.ts:275`
```typescript
// TODO: Implémenter l'appel réel à l'API de paiement
// TODO: Implémenter l'appel réel à Moneroo ou PayDunya
```
- **Impact** : Remboursements non fonctionnels
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-018

#### 19. `src/components/digital/customer/MyLicenses.tsx:631`
```typescript
// TODO: Implémenter le transfert de licence
```
- **Impact** : Transfert licences manquant
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-019

#### 20. `src/pages/dashboard/LiveSessionsManagement.tsx:269`
```typescript
// TODO: Intégrer avec les services Zoom/Google Meet
```
- **Impact** : Intégration vidéo manquante
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-020

#### 21. `src/components/physical/PreOrderManager.tsx:267`
```typescript
// TODO: API call to save
```
- **Impact** : Sauvegarde précommandes non fonctionnelle
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-021

#### 22. `src/components/reviews/ShareReviewButtons.tsx:110`
```typescript
// TODO: Implement analytics tracking
```
- **Impact** : Analytics partage manquant
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-022

#### 23. `src/components/returns/ReturnRequestForm.tsx:126`
```typescript
// TODO: Upload vers Supabase Storage
```
- **Impact** : Upload fichiers retours manquant
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-023

#### 24. `src/pages/service/BookingsManagement.tsx:221`
```typescript
// TODO: Ajouter service_availability aux types Supabase générés
```
- **Impact** : Types TypeScript incomplets
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟡 À faire
- **Issue** : #TODO-024

#### 25. `src/integrations/payments/flutterwave.ts:230`
```typescript
// TODO: Implémenter la vérification de signature Flutterwave
```
- **Impact** : Sécurité webhooks Flutterwave
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-025

#### 26. `src/integrations/payments/paypal.ts:237`
```typescript
// TODO: Implémenter la logique complète de capture puis refund
// TODO: Implémenter la vérification de signature PayPal
```
- **Impact** : Intégration PayPal incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-026

#### 27. `src/integrations/payments/stripe.ts:215`
```typescript
// TODO: Implémenter la vérification de signature Stripe
```
- **Impact** : Sécurité webhooks Stripe
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-027

#### 28. `src/lib/gamification/system.ts:322`
```typescript
// TODO: Envoyer une notification de montée de niveau
// TODO: Attribuer des récompenses de niveau
```
- **Impact** : Gamification incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-028

#### 29. `src/lib/pwa.ts:168`
```typescript
// TODO: Implémenter l'envoi au backend
```
- **Impact** : PWA notifications manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-029

#### 30. `src/hooks/physical/useInventoryReports.ts:159`
```typescript
// TODO: Calculate from orders/sales
```
- **Impact** : Rapports inventaire imprécis
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-030

#### 31. `src/services/fedex/FedexService.ts:17`
```typescript
// TODO: Implement real API call (4 occurrences)
```
- **Impact** : Intégration FedEx non fonctionnelle
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-031

#### 32. `src/hooks/services/useServiceReports.ts:340`
```typescript
// TODO: Get peak utilization by day (requires more complex query)
```
- **Impact** : Rapports services incomplets
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-032

#### 33. `src/components/courses/StudentProgressManager.tsx:171`
```typescript
// TODO: Calculer basé sur les dernières semaines
```
- **Impact** : Calcul progression imprécis
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-033

---

## 🟢 PRIORITÉ BASSE / TESTS (14 TODO)

### Tests à Implémenter

#### 34-47. Tests d'Intégration Supabase
`src/hooks/__tests__/multiStoresIsolation.integration.test.ts`
- **5 TODO** pour tests d'intégration avec environnement de test Supabase
- **Effort** : 🟡 Moyen (4-5h)
- **Status** : 🟢 À faire
- **Issue** : #TODO-034

#### 48. `src/components/settings/__tests__/DomainSettings.test.tsx:127`
```typescript
// TODO: Tester la désactivation automatique quand SSL est off
```
- **Impact** : Test manquant
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟢 À faire
- **Issue** : #TODO-048

---

## 📊 STATISTIQUES

| Priorité | Nombre | Traités | Restants | % |
|----------|--------|---------|----------|---|
| 🔴 **Critique** | 8 | 8 | 0 | 100% ✅ |
| 🟡 **Moyenne** | 25 | 0 | 25 | 0% |
| 🟢 **Basse** | 14 | 0 | 14 | 0% |
| **TOTAL** | **47** | **8** | **39** | **17%** |

---

## 🎯 OBJECTIFS

- **Semaine 1** : Traiter 8 TODO critiques
- **Semaine 2** : Traiter 10 TODO moyennes
- **Semaine 3** : Traiter 10 TODO moyennes restantes
- **Semaine 4** : Traiter TODO basses + Tests

---

## 📝 NOTES

- Les TODO dans les fichiers de tests sont considérés comme basse priorité
- Les TODO liés aux intégrations externes (FedEx, PayPal, Stripe) nécessitent des clés API
- Certains TODO nécessitent des modifications de schéma Supabase

---

**Dernière mise à jour** : 2025-01-30



**Date de création** : 2025-01-30  
**Dernière mise à jour** : 2025-01-30  
**Total TODO identifiés** : 47  
**TODO Critiques** : 0/8 (100% corrigés) ✅  
**Objectif** : Traiter tous les TODO critiques et réduire les TODO moyennes

---

## 🔴 PRIORITÉ CRITIQUE (8 TODO)

### 1. `src/lib/notifications/service-booking-notifications.ts:180` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Récupération du user_id depuis le booking
const { data: booking } = await supabase
  .from('service_bookings')
  .select('user_id, customer_id')
  .eq('id', data.booking_id)
  .single();
const userId = booking.user_id || booking.customer_id;
```
- **Impact** : Notifications fonctionnent correctement ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-001

### 2. `src/pages/courses/CourseDetail.tsx:190` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Implémentation complète avec useCreateCourseOrder
const result = await createCourseOrder.mutateAsync({...});
```
- **Impact** : Paiement cours fonctionnel ✅
- **Effort** : 🔴 Élevé (4-6h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-002

### 3. `src/pages/courses/CourseDetail.tsx:540` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Navigation vers /dashboard/cohorts/:cohortId
navigate(`/dashboard/cohorts/${cohort.id}`);
```
- **Impact** : Navigation cohort fonctionnelle ✅
- **Effort** : 🟢 Faible (30min)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-003

### 4. `src/components/orders/OrderDetailDialog.tsx:656` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Validation utilisateur et commande avant navigation
const { data: { user } } = await supabase.auth.getUser();
if (!user) { toast(...); return; }
navigate(`/disputes/create?order_id=${order.id}`);
```
- **Impact** : Création litige améliorée ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-004

### 5. `src/pages/payments/PayBalance.tsx:71` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Utilisation de initiateMonerooPayment
const paymentResult = await initiateMonerooPayment({...});
```
- **Impact** : Paiement balance fonctionnel ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-005

### 6. `src/hooks/useDisputes.ts:177` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Notifications temps réel avec Supabase Realtime
channel = supabase.channel('disputes_realtime')
  .on('postgres_changes', {...})
  .subscribe();
```
- **Impact** : Notifications temps réel fonctionnelles ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-006

### 7. `src/pages/vendor/VendorMessaging.tsx:948` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Infinite scroll avec loadMoreMessages
if (target.scrollTop === 0 && !messagesLoading && hasMoreMessages) {
  loadMoreMessages();
}
```
- **Impact** : Pagination messages fonctionnelle ✅
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-007

### 8. `src/pages/service/ServiceWaitlistManagementPage.tsx:105` ✅ **AMÉLIORÉ**
```typescript
// ✅ AMÉLIORÉ: Navigation vers page booking avec pré-remplissage et gestion erreurs
navigate(`/service/${entry.serviceId}/book?waitlist=${entryId}`, {
  state: { waitlistEntry: entry, prefillData: {...} }
});
```
- **Impact** : Conversion waitlist améliorée avec meilleure UX ✅
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : ✅ **AMÉLIORÉ** (2025-01-30)
- **Assignee** : -
- **Issue** : #TODO-008

---

## 🟡 PRIORITÉ MOYENNE (25 TODO)

### Performance & Optimisations

#### 9. `src/pages/Marketplace.tsx:384`
```typescript
// TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur
```
- **Impact** : Performance recherche produits
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-009

#### 10. `src/hooks/useMarketplaceProducts.ts:220`
```typescript
// TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
```
- **Impact** : Filtrage variants incomplet
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-010

#### 11. `src/lib/image-upload.ts:99` ✅ **CORRIGÉ**
```typescript
// ✅ CORRIGÉ: Compression avec browser-image-compression
const imageCompression = (await import('browser-image-compression')).default;
const compressedFile = await imageCompression(file, options);
```
- **Impact** : Images compressées automatiquement ✅
- **Effort** : 🟢 Faible (1h) - browser-image-compression déjà installé
- **Status** : ✅ **CORRIGÉ** (2025-01-30)
- **Issue** : #TODO-011

#### 12. `src/hooks/physical/useStockOptimization.ts:291`
```typescript
// TODO: Calculer depuis l'historique des ventes
const averageDailySales = 0; // TODO: Calculer depuis l'historique des ventes
```
- **Impact** : Optimisation stock imprécise
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-012

#### 13. `src/hooks/physical/useStockOptimization.ts:353`
```typescript
// TODO: Intégrer les prévisions
forecast: undefined, // TODO: Intégrer les prévisions
```
- **Impact** : Prévisions stock manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-013

### Fonctionnalités Manquantes

#### 14. `src/lib/files/digital-file-processing.ts:246`
```typescript
// TODO: Implémenter avec JSZip ou Edge Function
```
- **Impact** : Compression fichiers ZIP manquante
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-014

#### 15. `src/lib/marketing/automation.ts:427`
```typescript
// TODO: Implémenter la vérification de schedule
// TODO: Implémenter la vérification de condition
// TODO: Implémenter l'envoi SMS
// TODO: Implémenter l'ajout à un segment
// TODO: Implémenter l'appel webhook
```
- **Impact** : Automation marketing incomplète
- **Effort** : 🔴 Élevé (6-8h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-015

#### 16. `src/components/admin/customization/IntegrationsSection.tsx:142`
```typescript
// TODO: Implémenter les tests de connexion
```
- **Impact** : Tests intégrations manquants
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-016

#### 17. `src/lib/seo/advanced.ts:203`
```typescript
// TODO: Ajouter les liens vers les réseaux sociaux
```
- **Impact** : SEO social incomplet
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-017

#### 18. `src/lib/services/cancellation-policy.ts:275`
```typescript
// TODO: Implémenter l'appel réel à l'API de paiement
// TODO: Implémenter l'appel réel à Moneroo ou PayDunya
```
- **Impact** : Remboursements non fonctionnels
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-018

#### 19. `src/components/digital/customer/MyLicenses.tsx:631`
```typescript
// TODO: Implémenter le transfert de licence
```
- **Impact** : Transfert licences manquant
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-019

#### 20. `src/pages/dashboard/LiveSessionsManagement.tsx:269`
```typescript
// TODO: Intégrer avec les services Zoom/Google Meet
```
- **Impact** : Intégration vidéo manquante
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-020

#### 21. `src/components/physical/PreOrderManager.tsx:267`
```typescript
// TODO: API call to save
```
- **Impact** : Sauvegarde précommandes non fonctionnelle
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-021

#### 22. `src/components/reviews/ShareReviewButtons.tsx:110`
```typescript
// TODO: Implement analytics tracking
```
- **Impact** : Analytics partage manquant
- **Effort** : 🟢 Faible (1h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-022

#### 23. `src/components/returns/ReturnRequestForm.tsx:126`
```typescript
// TODO: Upload vers Supabase Storage
```
- **Impact** : Upload fichiers retours manquant
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-023

#### 24. `src/pages/service/BookingsManagement.tsx:221`
```typescript
// TODO: Ajouter service_availability aux types Supabase générés
```
- **Impact** : Types TypeScript incomplets
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟡 À faire
- **Issue** : #TODO-024

#### 25. `src/integrations/payments/flutterwave.ts:230`
```typescript
// TODO: Implémenter la vérification de signature Flutterwave
```
- **Impact** : Sécurité webhooks Flutterwave
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-025

#### 26. `src/integrations/payments/paypal.ts:237`
```typescript
// TODO: Implémenter la logique complète de capture puis refund
// TODO: Implémenter la vérification de signature PayPal
```
- **Impact** : Intégration PayPal incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-026

#### 27. `src/integrations/payments/stripe.ts:215`
```typescript
// TODO: Implémenter la vérification de signature Stripe
```
- **Impact** : Sécurité webhooks Stripe
- **Effort** : 🟡 Moyen (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-027

#### 28. `src/lib/gamification/system.ts:322`
```typescript
// TODO: Envoyer une notification de montée de niveau
// TODO: Attribuer des récompenses de niveau
```
- **Impact** : Gamification incomplète
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-028

#### 29. `src/lib/pwa.ts:168`
```typescript
// TODO: Implémenter l'envoi au backend
```
- **Impact** : PWA notifications manquantes
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-029

#### 30. `src/hooks/physical/useInventoryReports.ts:159`
```typescript
// TODO: Calculate from orders/sales
```
- **Impact** : Rapports inventaire imprécis
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-030

#### 31. `src/services/fedex/FedexService.ts:17`
```typescript
// TODO: Implement real API call (4 occurrences)
```
- **Impact** : Intégration FedEx non fonctionnelle
- **Effort** : 🟡 Moyen (3-4h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-031

#### 32. `src/hooks/services/useServiceReports.ts:340`
```typescript
// TODO: Get peak utilization by day (requires more complex query)
```
- **Impact** : Rapports services incomplets
- **Effort** : 🟡 Moyen (2-3h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-032

#### 33. `src/components/courses/StudentProgressManager.tsx:171`
```typescript
// TODO: Calculer basé sur les dernières semaines
```
- **Impact** : Calcul progression imprécis
- **Effort** : 🟢 Faible (1-2h)
- **Status** : 🟡 À faire
- **Issue** : #TODO-033

---

## 🟢 PRIORITÉ BASSE / TESTS (14 TODO)

### Tests à Implémenter

#### 34-47. Tests d'Intégration Supabase
`src/hooks/__tests__/multiStoresIsolation.integration.test.ts`
- **5 TODO** pour tests d'intégration avec environnement de test Supabase
- **Effort** : 🟡 Moyen (4-5h)
- **Status** : 🟢 À faire
- **Issue** : #TODO-034

#### 48. `src/components/settings/__tests__/DomainSettings.test.tsx:127`
```typescript
// TODO: Tester la désactivation automatique quand SSL est off
```
- **Impact** : Test manquant
- **Effort** : 🟢 Faible (30min)
- **Status** : 🟢 À faire
- **Issue** : #TODO-048

---

## 📊 STATISTIQUES

| Priorité | Nombre | Traités | Restants | % |
|----------|--------|---------|----------|---|
| 🔴 **Critique** | 8 | 8 | 0 | 100% ✅ |
| 🟡 **Moyenne** | 25 | 0 | 25 | 0% |
| 🟢 **Basse** | 14 | 0 | 14 | 0% |
| **TOTAL** | **47** | **8** | **39** | **17%** |

---

## 🎯 OBJECTIFS

- **Semaine 1** : Traiter 8 TODO critiques
- **Semaine 2** : Traiter 10 TODO moyennes
- **Semaine 3** : Traiter 10 TODO moyennes restantes
- **Semaine 4** : Traiter TODO basses + Tests

---

## 📝 NOTES

- Les TODO dans les fichiers de tests sont considérés comme basse priorité
- Les TODO liés aux intégrations externes (FedEx, PayPal, Stripe) nécessitent des clés API
- Certains TODO nécessitent des modifications de schéma Supabase

---

**Dernière mise à jour** : 2025-01-30

