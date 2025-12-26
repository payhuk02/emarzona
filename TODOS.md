# 📋 TODOs - Emarzona Platform

> **Documentation des fonctionnalités à implémenter**  
> Dernière mise à jour: 2025-01-30

---

## 🔴 Priorité Haute

### 1. Checkout Multi-Stores

**Fichier**: `src/pages/Checkout.tsx`  
**Lignes**: 516, 529  
**Description**: Implémenter le traitement complet du checkout multi-stores pour gérer les produits de plusieurs boutiques dans un seul panier.

**Contexte**:

```typescript
// TODO: Implémenter le traitement complet multi-stores
if (isMultiStore && storeGroups.size > 1) {
  // Pour l'instant, on traite uniquement le premier store
  // Le traitement multi-stores complet nécessite une implémentation dédiée
  logger.log('Multi-store checkout detected', { storeCount: storeGroups.size });

  // TODO: Implémenter processMultiStoreCheckout pour gérer tous les stores
}
```

**Recommandations**:

- Créer une fonction `processMultiStoreCheckout` qui:
  - Sépare les produits par boutique
  - Crée une commande par boutique
  - Gère les paiements multiples si nécessaire
  - Unifie l'expérience utilisateur

**Issue GitHub suggérée**: `#XXX - Feature: Multi-store checkout implementation`

---

## 🟡 Priorité Moyenne

### 2. Types Supabase - Service Availability

**Fichier**: `src/pages/service/BookingsManagement.tsx`  
**Ligne**: 221  
**Description**: Ajouter `service_availability` aux types Supabase générés.

**Contexte**:

```typescript
// Type temporaire pour service_availability en attendant la régénération des types Supabase
// TODO: Ajouter service_availability aux types Supabase générés (voir docs/TODOS.md)
interface ServiceAvailability {
  id: string;
  service_product_id: string;
  // ...
}
```

**Recommandations**:

1. Vérifier que la table `service_availability` existe dans Supabase
2. Régénérer les types Supabase:
   ```bash
   npm run supabase:types
   ```
3. Remplacer l'interface temporaire par le type généré

**Issue GitHub suggérée**: `#XXX - Fix: Add service_availability to Supabase types`

---

## 🟢 Priorité Basse

### 3. Paiement et Inscription aux Cours

**Fichier**: `src/pages/courses/CourseDetail.tsx`  
**Ligne**: 178  
**Description**: Implémenter le paiement et l'inscription aux cours en ligne.

**Contexte**:

```typescript
// TODO: Implémenter le paiement et l'inscription
toast({
  title: 'Inscription au cours',
  description: 'Fonctionnalité en cours de développement...',
});
```

**Recommandations**:

- Intégrer avec le système de paiement Moneroo/PayDunya
- Créer l'enrollment dans la table `course_enrollments`
- Gérer les cas d'erreur (paiement échoué, cours complet, etc.)
- Rediriger vers la page du cours après inscription réussie

**Issue GitHub suggérée**: `#XXX - Feature: Course enrollment and payment`

### 4. Navigation vers la Page du Cohort

**Fichier**: `src/pages/courses/CourseDetail.tsx`  
**Ligne**: 497  
**Description**: Implémenter la navigation vers la page détaillée d'un cohort.

**Contexte**:

```typescript
// TODO: Naviguer vers la page du cohort
onCohortClick={(cohort) => {
  logger.debug('Navigate to cohort', { cohortId: cohort.id });
}}
```

**Recommandations**:

- Créer une route `/courses/:courseId/cohorts/:cohortId` si nécessaire
- Ou rediriger vers `/courses/:courseId` avec un paramètre de query `?cohort=:cohortId`
- Implémenter la page de détails du cohort

**Issue GitHub suggérée**: `#XXX - Feature: Cohort detail page navigation`

---

## 📊 Résumé

| Priorité   | Nombre | Statut           |
| ---------- | ------ | ---------------- |
| 🔴 Haute   | 1      | En attente       |
| 🟡 Moyenne | 1      | En attente       |
| 🟢 Basse   | 2      | En attente       |
| **Total**  | **4**  | **4 en attente** |

---

## 🔗 Liens Utils

- [Guide de Contribution](docs/CONTRIBUTING.md)
- [Architecture du Projet](docs/ARCHITECTURE.md)
- [Guide de Développement](docs/DEVELOPMENT.md)

---

## 📝 Notes

- Les TODOs sont documentés ici pour faciliter le suivi
- Créer des issues GitHub pour chaque TODO prioritaire
- Mettre à jour ce fichier lors de l'implémentation d'un TODO

---

_Dernière mise à jour: 2025-01-30_
