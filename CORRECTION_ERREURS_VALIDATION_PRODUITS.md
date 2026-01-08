# 🔧 Correction des erreurs de validation dans les wizards d'édition de produits

**Date** : 2025-01-28  
**Statut** : ✅ **CORRIGÉ**

---

## 📋 Problème identifié

Lors de la modification d'un produit, lorsqu'un utilisateur clique sur "Sauvegarder" ou "Suivant", un message d'erreur générique "Erreurs de validation - Veuillez corriger les erreurs avant de sauvegarder" s'affichait **sans afficher les erreurs spécifiques**.

### Causes identifiées

1. **Format incorrect de traitement des erreurs** :
   - `serverResult.errors` est un **tableau** d'objets `{field: string, message: string}`, pas un objet
   - Le code utilisait `Object.keys()` et `Object.values()` sur un tableau, ce qui ne fonctionnait pas correctement
   - Les erreurs n'étaient jamais extraites correctement du résultat de validation

2. **Gestion incomplète des erreurs de validation serveur** :
   - Si `serverResult.valid` était `false` mais que `serverResult.errors` était vide ou undefined, aucune erreur n'était ajoutée au tableau d'erreurs
   - Le message d'erreur générique s'affichait sans détails spécifiques

3. **Slug manquant pour la validation** :
   - La validation serveur n'était appelée que si `formData.slug` existait
   - Si le slug était vide, la validation serveur n'était pas exécutée, même si le slug pouvait être généré automatiquement

4. **Absence de message d'erreur par défaut** :
   - Si la validation serveur échouait sans retourner d'erreurs spécifiques, aucun message n'était affiché à l'utilisateur

---

## ✅ Corrections apportées

### 1. Amélioration de la gestion des erreurs de validation serveur

**Fichiers modifiés** :

- `src/components/products/edit/EditDigitalProductWizard.tsx`
- `src/components/products/edit/EditPhysicalProductWizard.tsx`
- `src/components/products/edit/EditServiceProductWizard.tsx`

**Changements** :

```typescript
// AVANT (INCORRECT - traite errors comme un objet)
if (!serverResult.valid) {
  if (serverResult.errors) {
    Object.values(serverResult.errors).forEach(error => {
      if (error) errors.push(error);
    });
  }
  setValidationErrors(prev => ({ ...prev, [step]: errors }));
  return false;
}

// APRÈS (CORRECT - traite errors comme un tableau)
if (!serverResult.valid) {
  // Ajouter les erreurs du serveur si disponibles
  // serverResult.errors est un tableau d'objets {field, message}
  if (serverResult.errors && Array.isArray(serverResult.errors) && serverResult.errors.length > 0) {
    serverResult.errors.forEach(errorObj => {
      if (errorObj && errorObj.message && typeof errorObj.message === 'string') {
        errors.push(errorObj.message);
      }
    });
  }
  // Si aucune erreur spécifique mais un message général, l'utiliser
  if (errors.length === 0 && serverResult.message) {
    errors.push(serverResult.message);
  }
  // Si toujours aucune erreur, utiliser un message par défaut
  if (errors.length === 0) {
    errors.push('Erreur de validation serveur. Veuillez vérifier vos données.');
  }
  logger.warn('[EditDigitalProductWizard] Validation échouée', {
    step,
    errors,
    serverResult,
    formData: {
      name: formData.name,
      slug: slugForValidation,
      price: pricingModel === 'free' ? 0 : formData.price,
    },
  });
  setValidationErrors(prev => ({ ...prev, [step]: errors }));
  return false;
}
```

**Améliorations** :

- ✅ Vérification que `serverResult.errors` existe ET contient des clés
- ✅ Vérification du type des erreurs avant de les ajouter
- ✅ Utilisation de `serverResult.message` si aucune erreur spécifique n'est disponible
- ✅ Message d'erreur par défaut si aucune erreur n'est disponible

### 2. Génération automatique du slug pour la validation

**Changements** :

```typescript
// AVANT
if (storeId && formData.slug) {
  const serverResult = await validateDigitalProductServer({
    name: formData.name || '',
    slug: formData.slug,
    price: pricingModel === 'free' ? 0 : formData.price || 0,
  });
  // ...
}

// APRÈS
// Générer le slug si nécessaire pour la validation
const slugForValidation =
  formData.slug?.trim() ||
  formData.name
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') ||
  null;

if (storeId && slugForValidation) {
  const serverResult = await validateDigitalProductServer({
    name: formData.name || '',
    slug: slugForValidation,
    price: pricingModel === 'free' ? 0 : formData.price || 0,
  });
  // ...
}
```

**Améliorations** :

- ✅ Génération automatique du slug à partir du nom du produit si le slug n'est pas fourni
- ✅ La validation serveur peut maintenant être exécutée même si le slug n'est pas explicitement défini
- ✅ Cohérence avec la logique de sauvegarde qui génère également le slug automatiquement

---

## 🎯 Résultat

### Avant

- ❌ Message d'erreur générique sans détails
- ❌ Impossible de savoir quelle erreur corriger
- ❌ Validation serveur non exécutée si slug manquant

### Après

- ✅ Erreurs spécifiques affichées à l'utilisateur
- ✅ Message d'erreur par défaut si aucune erreur spécifique n'est disponible
- ✅ Validation serveur exécutée même si le slug doit être généré
- ✅ Meilleure expérience utilisateur avec des messages d'erreur clairs

---

## 📝 Fichiers modifiés

1. **`src/components/products/edit/EditDigitalProductWizard.tsx`**
   - Ligne 368-400 : Amélioration de la validation de l'étape 1

2. **`src/components/products/edit/EditPhysicalProductWizard.tsx`**
   - Ligne 402-435 : Amélioration de la validation de l'étape 1

3. **`src/components/products/edit/EditServiceProductWizard.tsx`**
   - Ligne 407-440 : Amélioration de la validation de l'étape 1

---

## ✅ Tests recommandés

1. **Test de validation avec erreurs spécifiques** :
   - Modifier un produit avec un nom invalide (< 2 caractères)
   - Vérifier que l'erreur spécifique "Le nom doit contenir au moins 2 caractères" s'affiche

2. **Test de validation avec erreur serveur** :
   - Modifier un produit avec un slug déjà utilisé
   - Vérifier que l'erreur spécifique du serveur s'affiche

3. **Test de validation avec slug manquant** :
   - Modifier un produit sans slug
   - Vérifier que la validation fonctionne correctement avec le slug généré automatiquement

4. **Test de validation avec erreur serveur sans détails** :
   - Simuler une erreur serveur sans `errors` ni `message`
   - Vérifier que le message d'erreur par défaut s'affiche

---

## 🔍 Notes techniques

- La génération du slug suit la même logique que dans `saveProduct` pour garantir la cohérence
- Les erreurs de validation sont stockées dans `validationErrors[step]` pour être affichées dans l'interface utilisateur
- La validation serveur peut être désactivée si la fonction RPC n'est pas disponible (gestion d'erreur dans `server-validation.ts`)

---

## 📚 Références

- `src/hooks/useWizardServerValidation.ts` : Hook de validation serveur
- `src/lib/server-validation.ts` : Fonctions de validation serveur
- `src/components/products/edit/EditDigitalProductWizard.tsx` : Wizard d'édition de produits digitaux
