# 🚀 PHASE 4 - PLAN D'ACTION

## Date : 2025 - Optimisations Avancées

---

## 📋 OBJECTIFS PHASE 4

1. ✅ **Optimiser composants lourds** avec useMemo/useCallback
2. ✅ **Ajouter debounce** sur recherches et filtres manquants
3. ✅ **Vérifier composants volumineux** (>1000 lignes)
4. ✅ **Optimiser métriques de performance** (FCP, LCP, TTFB)
5. ✅ **Optimiser hooks avec beaucoup de useState/useEffect**

---

## 🎯 TÂCHE 1 : Optimiser Composants Lourds

### Composants identifiés

1. **StoreDetails.tsx** : 89 hooks (useState, useEffect, useMemo, useCallback)
   - ⚠️ 2042 lignes
   - ⚠️ Beaucoup de useState individuels
   - 💡 **Recommandation** : Utiliser useReducer ou regrouper les états

2. **ProductForm.tsx** : Composant complexe
   - ✅ Déjà utilise useCallback pour updateFormData
   - ⚠️ Pourrait bénéficier de plus de useMemo

3. **CreateDigitalProductWizard_v2.tsx** : Wizard complexe
   - ✅ Déjà utilise useMemo et useCallback
   - ✅ Déjà optimisé

### Actions à prendre

1. ✅ Regrouper les états similaires dans StoreDetails
2. ✅ Ajouter useMemo pour les calculs coûteux
3. ✅ Ajouter useCallback pour les handlers

---

## 🎯 TÂCHE 2 : Ajouter Debounce

### Composants identifiés

**Déjà avec debounce** :

- ✅ `StoreFieldWithValidation.tsx` : Debounce 300ms
- ✅ `SearchAutocomplete.tsx` : Déjà debounce
- ✅ `StoreSlugEditor.tsx` : Déjà debounce

**À vérifier** :

- ⚠️ Recherches dans ProductForm
- ⚠️ Filtres dans ProductListView
- ⚠️ Recherches dans OrdersTable

---

## 🎯 TÂCHE 3 : Vérifier Composants Volumineux

### Composants identifiés

1. **StoreDetails.tsx** : 2042 lignes
   - ⚠️ Très volumineux
   - 💡 **Recommandation** : Diviser en sous-composants

2. **StoreForm.tsx** : 1879 lignes
   - ⚠️ Très volumineux
   - 💡 **Recommandation** : Diviser en sous-composants

3. **CreateDigitalProductWizard_v2.tsx** : 1411 lignes
   - ⚠️ Volumineux mais acceptable (wizard)
   - ✅ Déjà bien structuré

---

## 🎯 TÂCHE 4 : Optimiser Métriques Performance

### Métriques à améliorer

1. **FCP (First Contentful Paint)** : 2-5s → <1.8s
   - ✅ Fonts optimisées (déjà fait)
   - ✅ CSS critiques préchargés (déjà fait)
   - ⚠️ À vérifier : Images critiques

2. **LCP (Largest Contentful Paint)** : 2-5s → <2.5s
   - ✅ Lazy loading images (déjà fait)
   - ⚠️ À vérifier : Images au-dessus de la ligne de flottaison

3. **TTFB (Time to First Byte)** : Variable → <600ms
   - ⚠️ Dépend du backend (Supabase)
   - 💡 **Recommandation** : Vérifier les requêtes lentes

---

## 🎯 TÂCHE 5 : Optimiser Hooks

### Hooks identifiés

1. **StoreDetails.tsx** : 89 hooks
   - ⚠️ Beaucoup de useState individuels
   - 💡 **Recommandation** : Regrouper avec useReducer

2. **ProductForm.tsx** : Hooks bien utilisés
   - ✅ Déjà optimisé

---

## 📊 PROGRESSION

| Tâche                     | Statut      | Progression |
| ------------------------- | ----------- | ----------- |
| **Composants lourds**     | 🔄 En cours | 0%          |
| **Debounce**              | ⏳ À faire  | 0%          |
| **Composants volumineux** | ⏳ À faire  | 0%          |
| **Métriques performance** | ⏳ À faire  | 0%          |
| **Hooks**                 | ⏳ À faire  | 0%          |

---

## ⏱️ TEMPS ESTIMÉ

- **Tâche 1** : 3-4 heures
- **Tâche 2** : 1-2 heures
- **Tâche 3** : 4-6 heures (refactoring)
- **Tâche 4** : 2-3 heures
- **Tâche 5** : 2-3 heures

**Total** : 12-18 heures

---

**Date de début** : 2025  
**Statut** : 🔄 En cours
