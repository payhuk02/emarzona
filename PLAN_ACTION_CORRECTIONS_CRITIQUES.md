# 🎯 PLAN D'ACTION - CORRECTIONS CRITIQUES

**Date** : Janvier 2025  
**Priorité** : 🔴 CRITIQUE  
**Statut** : 🟡 EN COURS

---

## 📋 OBJECTIFS

1. ✅ Remplacer `console.*` par `logger` dans le code production (4-6h)
2. ⏳ Nettoyer les warnings ESLint (10-15h)
3. ⏳ Nettoyer les erreurs TypeScript `any` (40-60h)

---

## ✅ TÂCHE 1 : REMPLACER CONSOLE.* PAR LOGGER

### Fichiers avec logger déjà importé (à compléter)

- [x] `src/utils/storage.ts` - ✅ Déjà fait
- [x] `src/lib/function-utils.ts` - ✅ Déjà fait
- [x] `src/lib/storage-utils.ts` - ✅ Déjà fait
- [x] `src/lib/cookie-utils.ts` - ✅ Logger importé, console.* à remplacer
- [x] `src/lib/serialization-utils.ts` - ✅ Déjà fait
- [x] `src/hooks/useStorage.ts` - ✅ Déjà fait
- [x] `src/hooks/useSmartQuery.ts` - ✅ Déjà fait
- [x] `src/hooks/useLocalCache.ts` - ✅ Déjà fait
- [ ] `src/hooks/usePagination.ts` - ⏳ Import dynamique à remplacer
- [ ] `src/hooks/useHapticFeedback.ts` - ⏳ À vérifier
- [ ] `src/main.tsx` - ⏳ Fallback console.error à remplacer

### Fichiers sans logger (à ajouter)

- [ ] `src/lib/route-tester.js` - ⏳ Fichier JS, à convertir ou ignorer
- [ ] `src/components/ui/dropdown-menu.tsx` - ⏳ Exemple dans commentaire
- [ ] `src/components/courses/player/AdvancedVideoPlayer.tsx` - ⏳ À vérifier
- [ ] `src/hooks/useFileUpload.ts` - ⏳ À vérifier
- [ ] `src/hooks/useSpeechRecognition.ts` - ⏳ À vérifier
- [ ] `src/hooks/useCountdown.ts` - ⏳ À vérifier
- [ ] `src/hooks/useErrorBoundary.ts` - ⏳ À vérifier
- [ ] `src/hooks/useDragAndDrop.ts` - ⏳ À vérifier
- [ ] `src/hooks/useClipboard.ts` - ⏳ À vérifier
- [ ] `src/components/icons/lazy-icon.tsx` - ⏳ À vérifier

### Fichiers de test (à ignorer)

- ✅ `src/utils/testStorageUpload.ts` - Fichier de test, console.* acceptable
- ✅ `src/test/setup.ts` - Setup tests, console.* acceptable
- ✅ `tests/setup/*.ts` - Setup Playwright, console.* acceptable

---

## ⏳ TÂCHE 2 : NETTOYER LES WARNINGS ESLINT

### Commandes à exécuter

```bash
# 1. Auto-fix des warnings simples
npm run lint:fix

# 2. Vérifier les warnings restants
npm run lint > lint-output.txt

# 3. Nettoyer manuellement les warnings restants
```

### Catégories de warnings

1. **Variables non utilisées** (2826 warnings)
   - Imports non utilisés
   - Variables déclarées mais jamais utilisées
   - Solution : Préfixer avec `_` ou supprimer

2. **React Hooks dependencies**
   - Dépendances manquantes ou inutiles
   - Solution : Corriger les dépendances

3. **Console statements** (356 occurrences)
   - Principalement dans tests (acceptable)
   - Solution : Remplacer par logger dans code production

---

## ⏳ TÂCHE 3 : NETTOYER LES ERREURS TYPESCRIPT `any`

### Fichiers les plus affectés

1. **Types complexes** (`src/types/*.ts`)
   - `src/types/advanced-features.ts` - 7 erreurs
   - `src/types/affiliate.ts` - 8 erreurs
   - `src/types/artist-product.ts` - 1 erreur (parsing)
   - `src/types/cart.ts` - 2 erreurs
   - `src/types/email.ts` - 3 erreurs
   - `src/types/giftCards.ts` - 3 erreurs
   - `src/types/invoice.ts` - 1 erreur
   - `src/types/legal.ts` - 2 erreurs
   - `src/types/loyalty.ts` - 5 erreurs
   - `src/types/marketplace.ts` - 1 erreur
   - `src/types/notifications.ts` - 2 erreurs
   - `src/types/react-big-calendar.d.ts` - 14 erreurs
   - `src/types/store-withdrawals.ts` - 1 erreur
   - `src/types/webhooks.ts` - 4 erreurs

2. **Pages** (`src/pages/*.tsx`)
   - `src/pages/payments/*.tsx` - Multiples erreurs
   - `src/pages/service/*.tsx` - Multiples erreurs
   - `src/pages/physical/*.tsx` - Multiples erreurs

3. **Services** (`src/services/*.ts`)
   - `src/services/webhooks/*.ts` - Multiples erreurs

### Stratégie de correction

1. **Phase 1** : Créer des types spécifiques pour remplacer `any`
2. **Phase 2** : Remplacer `any` dans les types complexes
3. **Phase 3** : Remplacer `any` dans les pages et composants
4. **Phase 4** : Remplacer `any` dans les services

---

## 📊 PROGRESSION

### Tâche 1 : Console.* → Logger
- **Progression** : 30%
- **Fichiers traités** : 9/27
- **Fichiers restants** : 18

### Tâche 2 : Warnings ESLint
- **Progression** : 0%
- **Action** : Exécuter `npm run lint:fix`

### Tâche 3 : Erreurs `any`
- **Progression** : 0%
- **Action** : Commencer par les types

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Compléter le remplacement console.* dans les fichiers avec logger
2. ⏳ Ajouter logger dans les fichiers sans logger
3. ⏳ Exécuter `npm run lint:fix`
4. ⏳ Créer des types pour remplacer `any` les plus fréquents
5. ⏳ Remplacer `any` progressivement par domaine

---

**Dernière mise à jour** : Janvier 2025

