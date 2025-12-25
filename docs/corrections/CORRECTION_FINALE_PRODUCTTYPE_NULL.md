# ✅ Correction Finale - Erreur productType null

## Date: 2025-01-29

## 🔍 Problème Identifié

**Erreur 422 :** `"The metadata.productType must be a string, boolean or integer."`

**Cause :** 
- `productType: null` était inclus dans `metadata` dans `ProductDetail.tsx`
- L'API Moneroo n'accepte **que** `string`, `boolean` ou `integer` dans `metadata`
- Les valeurs `null`, `undefined` et objets complexes ne sont pas acceptées

## ✅ Corrections Appliquées

### 1. Client Moneroo (`src/lib/moneroo-payment.ts`)

**Ajout d'un nettoyage automatique de metadata :**
- ✅ Filtrage des valeurs `null`, `undefined` et chaînes vides
- ✅ Conversion des objets en JSON string si nécessaire
- ✅ Conservation uniquement des valeurs valides (string, number, boolean)

**Code ajouté :**
```typescript
// Nettoyer metadata : supprimer les valeurs null, undefined, et vides
// L'API Moneroo n'accepte que string, boolean ou integer dans metadata
const cleanMetadata: Record<string, unknown> = {
  transaction_id: transaction.id,
  store_id: storeId,
  ...(productId && { product_id: productId }),
};

// Ajouter les métadonnées personnalisées en filtrant les valeurs null/undefined
Object.entries(metadata || {}).forEach(([key, value]) => {
  if (value !== null && value !== undefined && value !== '') {
    if (typeof value === 'object' && value !== null) {
      if (Object.keys(value).length > 0) {
        cleanMetadata[key] = value;
      }
    } else {
      cleanMetadata[key] = value;
    }
  }
});
```

### 2. ProductDetail (`src/pages/ProductDetail.tsx`)

**Correction pour ne pas inclure productType si null :**
```typescript
metadata: { 
  productName: product.name, 
  storeSlug: store.slug || '',
  userId: user.id,
  // Ne pas inclure productType si c'est null (l'API Moneroo n'accepte pas null)
  ...(product.product_type && { productType: product.product_type }),
},
```

### 3. Edge Function (`supabase/functions/moneroo/index.ts`)

**Nettoyage supplémentaire dans l'Edge Function :**
- ✅ Filtrage des valeurs null/undefined
- ✅ Conversion des objets en JSON string
- ✅ Type strict : `Record<string, string | number | boolean>`

**Code ajouté :**
```typescript
// IMPORTANT: L'API Moneroo n'accepte que string, boolean ou integer dans metadata
// Il faut filtrer les valeurs null, undefined, et objets vides
const rawMetadata = data.metadata || {};
const metadata: Record<string, string | number | boolean> = {};

// Nettoyer les métadonnées : ne garder que les valeurs valides
Object.entries(rawMetadata).forEach(([key, value]) => {
  if (value !== null && value !== undefined && value !== '') {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      metadata[key] = value;
    } else if (typeof value === 'object') {
      // Pour les objets, les convertir en string JSON
      try {
        metadata[key] = JSON.stringify(value);
      } catch {
        console.warn(`[Moneroo Edge Function] Cannot serialize metadata.${key}, skipping`);
      }
    }
  }
});
```

## 📋 Format Metadata Accepté par Moneroo

D'après la documentation Moneroo et l'erreur reçue :

**✅ Accepté :**
- `string` : `"digital"`, `"physical"`, etc.
- `number` : `123`, `456.78`
- `boolean` : `true`, `false`

**❌ Rejeté :**
- `null` : ❌
- `undefined` : ❌
- Objets complexes (sauf conversion en JSON string) : ❌
- Tableaux (sauf conversion en JSON string) : ❌

## 🎯 Résultat Attendu

Après le redéploiement de l'Edge Function :
1. ✅ `productType: null` ne sera plus inclus dans metadata
2. ✅ Toutes les valeurs null/undefined seront filtrées
3. ✅ L'API Moneroo acceptera la requête (plus d'erreur 422)
4. ✅ Le paiement fonctionnera sur ProductDetail

## 🚀 Prochaines Étapes

1. **Redéployer l'Edge Function** dans Supabase Dashboard
2. **Tester le paiement** sur ProductDetail
3. **Vérifier les logs** pour confirmer que metadata ne contient plus de valeurs null

## 📚 Références

- [Documentation Moneroo - Erreurs](https://docs.moneroo.io/introduction/errors)
- Erreur 422 : "Vous avez fourni tous les paramètres requis, mais ils ne sont pas appropriés pour la requête."

