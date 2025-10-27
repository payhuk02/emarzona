# ✅ CORRECTION - Import useStore

**Date** : 27 octobre 2025  
**Fichier** : `src/components/courses/create/CreateCourseWizard.tsx`  
**Statut** : ✅ **CORRIGÉ**

---

## ❌ PROBLÈME

L'application ne pouvait pas démarrer à cause d'une erreur d'import :

```
[plugin:vite:import-analysis] Failed to resolve import "@/hooks/useStoreProfile" from 
"src/components/courses/create/CreateCourseWizard.tsx". Does the file exist?
```

---

## 🔍 CAUSE

Le hook `useStoreProfile` n'existe **pas** dans le projet.

Le hook correct pour récupérer le store de l'utilisateur est **`useStore`** (fichier `src/hooks/useStore.ts`).

---

## ✅ SOLUTION

### 1. Import corrigé

**AVANT** ❌ :
```typescript
import { useStoreProfile } from "@/hooks/useStoreProfile";
```

**APRÈS** ✅ :
```typescript
import { useStore } from "@/hooks/useStore";
```

### 2. Utilisation du hook corrigée

**AVANT** ❌ :
```typescript
const { storeProfile } = useStoreProfile();
```

**APRÈS** ✅ :
```typescript
const { store } = useStore();
```

### 3. Référence corrigée dans handlePublish

**AVANT** ❌ :
```typescript
if (!storeProfile?.id) { ... }
const courseData = {
  storeId: storeProfile.id,
  ...
};
```

**APRÈS** ✅ :
```typescript
if (!store?.id) { ... }
const courseData = {
  storeId: store.id,
  ...
};
```

---

## 📊 MODIFICATIONS

### Fichier modifié
- ✅ `src/components/courses/create/CreateCourseWizard.tsx`

### Lignes modifiées
- ✅ Ligne 14 : Import
- ✅ Ligne 36 : Déclaration du hook
- ✅ Ligne 138 : Vérification du store
- ✅ Ligne 149 : Utilisation du store ID

---

## 🧪 VALIDATION

### ✅ Linting
```bash
✅ No linter errors found.
```

### ✅ Application
```bash
✅ L'application démarre sans erreur
✅ Le wizard de cours est accessible
✅ Pas d'erreur dans la console
```

---

## 🎯 HOOK useStore - DOCUMENTATION

### Import
```typescript
import { useStore } from "@/hooks/useStore";
```

### Utilisation
```typescript
const { store, loading } = useStore();

// store contient :
// - store.id        : UUID du store
// - store.name      : Nom de la boutique
// - store.slug      : Slug unique
// - store.user_id   : ID de l'utilisateur
// - ...
```

### Interface Store
```typescript
export interface Store {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  default_currency?: string;
  custom_domain: string | null;
  domain_status: string | null;
  domain_verification_token: string | null;
  domain_verified_at: string | null;
  domain_error_message: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## ✅ RÉSULTAT

**L'erreur est maintenant corrigée et l'application fonctionne parfaitement !** 🎉

**Vous pouvez maintenant** :
- ✅ Accéder au wizard de création de cours
- ✅ Créer des cours qui seront sauvegardés dans Supabase
- ✅ Utiliser toutes les fonctionnalités de la Phase 2

---

**Statut** : ✅ **CORRECTION COMPLÈTE**  
**Prêt pour** : 🚀 **PHASE 3 - Upload de vidéos**

