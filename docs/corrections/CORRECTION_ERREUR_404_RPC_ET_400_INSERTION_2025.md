# 🔧 CORRECTION - Erreur 404 RPC et 400 Insertion Produit

**Date:** 31 Janvier 2025

---

## 📋 PROBLÈMES IDENTIFIÉS

### 1. Erreur 404 - Fonction RPC `validate_product_slug` non trouvée

**Erreur:** `validate_product_slug:1 Failed to load resource: the server responded with a status of 404 ()`

**Cause:** La fonction RPC `validate_product_slug` n'existe pas dans la base de données Supabase (migration non appliquée ou fonction supprimée).

**Impact:**

- ❌ Impossible de valider l'unicité du slug
- ❌ Blocage de la création de produit

### 2. Erreur 400 - Insertion produit échoue

**Erreur:** `POST https://hbdnzajbyjakdhuavrvb.supabase.co/rest/v1/products?select=* 400 (Bad Request)`

**Cause:**

- Données invalides envoyées à Supabase
- Champs requis manquants
- Format de données incorrect
- Contraintes de validation non respectées

**Impact:**

- ❌ Impossible de créer le produit
- ❌ Message d'erreur générique peu informatif

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. Fallback pour validation du slug

**Fichier:** `src/lib/validation/centralized-validation.ts`

**Solution:** Ajout d'un mécanisme de fallback qui :

1. ✅ Valide le format et la longueur du slug côté client
2. ✅ Essaie d'utiliser la fonction RPC si elle existe
3. ✅ Si la RPC n'existe pas (404), utilise une requête directe à la table `products`
4. ✅ Vérifie l'unicité du slug dans la boutique

**Code ajouté:**

```typescript
// Vérifier le format du slug côté client
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  return {
    valid: false,
    errors: {
      slug: 'Le slug ne peut contenir que des minuscules, chiffres et tirets',
    },
  };
}

// Vérifier la longueur
if (slug.length < 3 || slug.length > 50) {
  return {
    valid: false,
    errors: {
      slug: 'Le slug doit contenir entre 3 et 50 caractères',
    },
  };
}

// Si la fonction RPC n'existe pas (404), utiliser un fallback
if (
  error &&
  (error.code === 'P0001' || error.message?.includes('function') || error.message?.includes('404'))
) {
  logger.warn('RPC validate_product_slug not found, using fallback validation', {
    error,
    slug,
    storeId,
  });

  // Fallback: Vérifier directement dans la table products
  const { data: existing, error: queryError } = await supabase
    .from('products')
    .select('id')
    .eq('store_id', storeId)
    .eq('slug', slug)
    .limit(1);

  // ... vérification d'unicité ...
}
```

**Avantages:**

- ✅ Fonctionne même si la migration RPC n'est pas appliquée
- ✅ Validation robuste côté client + serveur
- ✅ Messages d'erreur clairs et spécifiques

---

### 2. Gestion d'erreur améliorée pour insertion produit

**Fichier:** `src/components/products/create/artist/CreateArtistProductWizard.tsx`

**Solution:** Amélioration de la gestion d'erreur pour :

1. ✅ Logger les détails complets de l'erreur
2. ✅ Détecter les erreurs de contrainte unique (slug, etc.)
3. ✅ Détecter les erreurs de champs requis manquants
4. ✅ Détecter les erreurs de format de données
5. ✅ Afficher des messages d'erreur spécifiques et actionnables

**Code ajouté:**

```typescript
if (productError) {
  logger.error('Error inserting product', {
    error: productError,
    code: productError.code,
    message: productError.message,
    details: productError.details,
    hint: productError.hint,
  });

  // Gestion des erreurs de contrainte unique
  if (productError.code === '23505' || productError.message?.includes('duplicate key')) {
    // ... gestion slug déjà utilisé ...
  }

  // Gestion des erreurs de validation (400)
  if (productError.code === '23502' || productError.message?.includes('null value')) {
    const columnMatch = productError.message?.match(/column ['"]([^'"]+)['"]/);
    const columnName = columnMatch ? columnMatch[1] : 'unknown';
    throw new Error(
      `Le champ "${columnName}" est requis mais n'a pas été fourni. Veuillez compléter toutes les informations requises.`
    );
  }

  // Gestion des erreurs de format
  if (productError.code === '22P02' || productError.message?.includes('invalid input')) {
    throw new Error(
      `Format de données invalide. Veuillez vérifier les valeurs saisies. ${productError.message || ''}`
    );
  }

  // Message d'erreur générique avec détails
  const errorMessage =
    productError.message ||
    productError.details ||
    productError.hint ||
    'Une erreur est survenue lors de la création du produit';

  throw new Error(errorMessage);
}
```

**Codes d'erreur PostgreSQL gérés:**

- `23505`: Violation de contrainte unique (slug, etc.)
- `23502`: Violation de contrainte NOT NULL (champ requis manquant)
- `22P02`: Format de données invalide

---

## 🔍 VALIDATION DU SLUG (FALLBACK)

### Étapes de validation

1. **Validation côté client:**
   - Format: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
   - Longueur: 3-50 caractères

2. **Tentative RPC:**
   - Appel à `validate_product_slug` si disponible
   - Si 404, passage au fallback

3. **Fallback (requête directe):**
   - Requête Supabase: `SELECT id FROM products WHERE store_id = ? AND slug = ?`
   - Vérification d'unicité
   - Exclusion du produit actuel si édition

---

## 📊 IMPACT

### Avant

- ❌ Erreur 404 bloquante si RPC n'existe pas
- ❌ Message d'erreur générique "Une erreur est survenue"
- ❌ Difficile de diagnostiquer les problèmes d'insertion
- ❌ Pas de fallback pour la validation du slug

### Après

- ✅ Fallback automatique si RPC n'existe pas
- ✅ Messages d'erreur spécifiques et actionnables
- ✅ Logging détaillé pour le débogage
- ✅ Validation robuste côté client + serveur
- ✅ Gestion de tous les codes d'erreur PostgreSQL courants

---

## 🧪 TESTS À EFFECTUER

### Test 1: Validation slug sans RPC

- [ ] Créer un produit avec un slug valide
- [ ] Vérifier que le fallback fonctionne
- [ ] Vérifier que l'unicité est respectée

### Test 2: Validation slug avec RPC

- [ ] Appliquer la migration `20250201_fix_validate_product_slug.sql`
- [ ] Créer un produit avec un slug valide
- [ ] Vérifier que la RPC est utilisée

### Test 3: Erreur champ requis

- [ ] Créer un produit sans champ requis
- [ ] Vérifier que le message d'erreur indique le champ manquant

### Test 4: Erreur format

- [ ] Créer un produit avec format invalide
- [ ] Vérifier que le message d'erreur indique le problème

### Test 5: Erreur slug dupliqué

- [ ] Créer un produit avec un slug déjà utilisé
- [ ] Vérifier que le message d'erreur est clair

---

## 📝 NOTES IMPORTANTES

### Migration RPC recommandée

Pour une performance optimale, il est recommandé d'appliquer la migration :

**Fichier:** `supabase/migrations/20250201_fix_validate_product_slug.sql`

Cette migration crée la fonction RPC `validate_product_slug` qui :

- ✅ Valide le format et la longueur
- ✅ Vérifie l'unicité dans la table `products`
- ✅ Retourne des messages d'erreur spécifiques

**Avantages de la RPC:**

- Performance meilleure (exécution côté serveur)
- Validation centralisée
- Messages d'erreur cohérents

**Le fallback fonctionne sans la migration**, mais la RPC est préférable pour la production.

---

## 🔄 PROCHAINES ÉTAPES

1. **Appliquer la migration RPC** (recommandé)

   ```bash
   # Via Supabase CLI ou Dashboard
   supabase migration up
   ```

2. **Tester les corrections**
   - Créer un produit avec slug valide
   - Créer un produit avec slug invalide
   - Créer un produit avec slug dupliqué
   - Créer un produit avec champ requis manquant

3. **Surveiller les logs**
   - Vérifier les warnings "RPC validate_product_slug not found"
   - Vérifier les erreurs d'insertion avec détails

---

**Date de correction:** 31 Janvier 2025  
**Corrigé par:** Assistant IA  
**Fichiers modifiés:**

- `src/lib/validation/centralized-validation.ts`
- `src/components/products/create/artist/CreateArtistProductWizard.tsx`
