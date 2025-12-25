# 📋 Analyse et Priorisation des TODOs

**Date** : 29 Janvier 2025  
**Total identifié** : 144 occurrences dans 53 fichiers

---

## 🔴 PRIORITÉ CRITIQUE (Fonctionnalités manquantes)

### 1. Gamification - Notifications de niveau
**Fichier** : `src/lib/gamification/system.ts` (lignes 322-323)  
**Impact** : Fonctionnalité de gamification incomplète  
**Temps estimé** : 1-2h  
**Statut** : ⚠️ À implémenter

```typescript
// TODO: Envoyer une notification de montée de niveau
// TODO: Attribuer des récompenses de niveau
```

**Solution** :
- Utiliser le système de notifications unifié
- Créer une fonction `sendLevelUpNotification()`
- Ajouter récompenses dans la table `user_rewards`

---

### 2. Service Orders - Vérification conflits staff
**Fichier** : `src/hooks/orders/useCreateServiceOrder.ts` (ligne 175)  
**Impact** : Risque de double réservation  
**Temps estimé** : 2-3h  
**Statut** : ⚠️ À implémenter

```typescript
// TODO: Vérifier si le staff est déjà réservé pour ce créneau
```

**Solution** :
- Créer fonction RPC `check_staff_availability()`
- Vérifier les conflits avant création de commande
- Retourner erreur si conflit détecté

---

### 3. PWA - Envoi subscription au backend
**Fichier** : `src/lib/pwa.ts` (ligne 168)  
**Impact** : Push notifications non fonctionnelles  
**Temps estimé** : 2-3h  
**Statut** : ⚠️ À implémenter

```typescript
// TODO: Implémenter l'envoi au backend
```

**Solution** :
- Créer Edge Function `save-push-subscription`
- Envoyer subscription à Supabase
- Stocker dans table `push_subscriptions`

---

## 🟡 PRIORITÉ MOYENNE (Améliorations fonctionnelles)

### 4. Content Management - Langue actuelle
**Fichier** : `src/components/admin/customization/ContentManagementSection.tsx` (ligne 163)  
**Impact** : Multilingue incomplet  
**Temps estimé** : 30min  
**Statut** : ✅ **CORRIGÉ** (29 Janvier 2025)

```typescript
const currentLang = 'fr'; // TODO: Récupérer la langue actuelle
```

---

### 5. Image Upload - Compression
**Fichier** : `src/lib/image-upload.ts` (ligne 83)  
**Impact** : Images non optimisées  
**Temps estimé** : 2-3h  
**Statut** : ⚠️ À implémenter

```typescript
// TODO: Implémenter la compression avec canvas ou une librairie
```

**Solution** :
- Utiliser `browser-image-compression` (déjà installé)
- Compresser avant upload
- Réduire taille de 60-80%

---

### 6. Marketing Automation - Fonctionnalités manquantes
**Fichier** : `src/lib/marketing/automation.ts` (lignes 386-421)  
**Impact** : Automatisation marketing incomplète  
**Temps estimé** : 8-10h  
**Statut** : ⚠️ À implémenter

**TODOs** :
- Vérification de schedule
- Vérification de condition
- Envoi SMS
- Mise à jour de tags
- Ajout à un segment
- Appel webhook

---

## 🟢 PRIORITÉ BASSE (Améliorations futures)

### 7. Tests - Environnement de test Supabase
**Fichier** : `src/hooks/__tests__/multiStoresIsolation.integration.test.ts`  
**Impact** : Tests non fonctionnels  
**Statut** : 📝 Documenté (nécessite setup test)

### 8. SEO - Liens réseaux sociaux
**Fichier** : `src/lib/seo/advanced.ts` (ligne 175)  
**Impact** : SEO incomplet  
**Statut** : 📝 Amélioration future

### 9. Cache - Tracking hits/misses
**Fichier** : `src/lib/moneroo-cache.ts` (ligne 180)  
**Impact** : Métriques cache manquantes  
**Statut** : 📝 Amélioration future

---

## ✅ CORRECTIONS APPLIQUÉES

### ContentManagementSection - Langue actuelle
**Fichier** : `src/components/admin/customization/ContentManagementSection.tsx`  
**Date** : 29 Janvier 2025  
**Correction** : 
- Ajout de l'import `useI18n` 
- Utilisation de `currentLanguage` depuis le hook `useI18n()`
- Remplacement de `const currentLang = 'fr'` par `const currentLang = currentLanguage || 'fr'`
- Ajout de `currentLanguage` dans les dépendances du `useEffect`

---

## 📊 STATISTIQUES

- **Critiques** : 3 TODOs
- **Moyennes** : 3 TODOs
- **Basses** : 3+ TODOs
- **Corrigés** : 1 TODO

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### Phase 1 (Semaine 1) - Critiques
1. ✅ Corriger ContentManagementSection (30min)
2. Implémenter notifications niveau gamification (1-2h)
3. Implémenter vérification conflits staff (2-3h)

### Phase 2 (Semaine 2) - Moyennes
4. Implémenter envoi subscription PWA (2-3h)
5. Implémenter compression images (2-3h)

### Phase 3 (Semaine 3+) - Futures
6. Compléter marketing automation (8-10h)
7. Améliorer SEO (2-3h)
8. Ajouter métriques cache (1-2h)

---

**Note** : Les TODOs dans les fichiers de test sont normaux et attendus (nécessitent setup environnement de test).

