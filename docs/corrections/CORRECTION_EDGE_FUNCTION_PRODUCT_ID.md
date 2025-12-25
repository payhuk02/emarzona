# ✅ Correction Edge Function Moneroo - Ajout de product_id dans metadata

## Date: 2025-01-29

## 🔍 Problème Identifié

D'après les logs Supabase Edge Functions :
- ✅ L'Edge Function reçoit `productId` dans les données (`dataKeys: ["amount", "currency", "customerEmail", "storeId", "productId", "returnUrl", "cancelUrl"]`)
- ❌ Mais l'Edge Function ne transmet pas `productId` dans `metadata` lors de l'appel à l'API Moneroo
- ❌ L'API Moneroo retourne une erreur 422 : `"The metadata.product_id field is required."`

## 🔍 Analyse des Logs

**Log de l'Edge Function :**
```
INFO Moneroo Edge Function Processing request: [action: "create_checkout", hasData: true, dataKeys: ["amount", "currency", "customerEmail", "storeId", "productId", "returnUrl", "cancelUrl"]]
```

**Log de l'appel à l'API Moneroo :**
```
INFO Moneroo Edge Function Calling Moneroo API: [url: "https://api.moneroo.io/v1/payments/initialize", method: "POST", body: { amount: 5000, currency: "XOF", customer: {...}, metadata: { store_id: "ecb9d915-b37b-4383-afb1-256bab22da73" } }]
```

**Erreur Moneroo :**
```
ERROR Moneroo API error: [status 422, statusText: "Unprocessable Entity", response: { message: "The metadata.product_id field is required.", code: "validation_error" }]
```

## ✅ Correction Appliquée

### Modification dans `supabase/functions/moneroo/index.ts`

**Avant :**
```typescript
body = {
  amount: data.amount,
  currency: data.currency || 'XOF',
  description: data.description,
  customer: {
    email: data.customer_email,
    first_name: firstName,
    last_name: lastName,
  },
  return_url: data.return_url,
  metadata: data.metadata || {},  // ❌ Ne contient pas product_id
  ...(data.methods && { methods: data.methods }),
};
```

**Après :**
```typescript
// Construire metadata en incluant productId et storeId si présents
// L'API Moneroo exige metadata.product_id
const metadata = { ...(data.metadata || {}) };

// Ajouter productId à metadata si présent dans data
if (data.productId && !metadata.product_id) {
  metadata.product_id = data.productId;
}

// Ajouter storeId à metadata si présent dans data
if (data.storeId && !metadata.store_id) {
  metadata.store_id = data.storeId;
}

// Log pour diagnostic
console.log('[Moneroo Edge Function] Metadata construction:', {
  originalMetadata: data.metadata,
  productId: data.productId,
  storeId: data.storeId,
  finalMetadata: metadata,
});

body = {
  amount: data.amount,
  currency: data.currency || 'XOF',
  description: data.description,
  customer: {
    email: data.customer_email,
    first_name: firstName,
    last_name: lastName,
  },
  return_url: data.return_url,
  metadata: metadata,  // ✅ Contient maintenant product_id
  ...(data.methods && { methods: data.methods }),
};
```

## 🎯 Résultat Attendu

Après le redéploiement de l'Edge Function :
1. ✅ `productId` sera automatiquement ajouté à `metadata.product_id`
2. ✅ `storeId` sera automatiquement ajouté à `metadata.store_id` si présent
3. ✅ L'API Moneroo acceptera la requête (plus d'erreur 422)
4. ✅ Le paiement sera initié avec succès

## 📋 Prochaines Étapes

1. **Redéployer l'Edge Function** dans Supabase Dashboard :
   - Ouvrir Supabase Dashboard → Edge Functions → moneroo → Code
   - Copier le code corrigé depuis `supabase/functions/moneroo/index.ts`
   - Coller dans l'éditeur Supabase
   - Cliquer sur "Deploy updates"

2. **Tester le paiement** sur ProductDetail :
   - Vérifier que le paiement fonctionne maintenant
   - Vérifier les logs Supabase pour confirmer que `metadata.product_id` est présent

3. **Vérifier les logs** :
   - Les logs devraient maintenant montrer `finalMetadata: { product_id: "...", store_id: "..." }`
   - Plus d'erreur 422 de l'API Moneroo

## 🔍 Vérification

Après le redéploiement, les logs devraient montrer :
```
INFO Moneroo Edge Function Metadata construction: [originalMetadata: {...}, productId: "a6dbf752-22ca-4931-abdc-0aee713dbd99", storeId: "ecb9d915-b37b-4383-afb1-256bab22da73", finalMetadata: { product_id: "a6dbf752-22ca-4931-abdc-0aee713dbd99", store_id: "ecb9d915-b37b-4383-afb1-256bab22da73", ... }]
```

Et l'appel à l'API Moneroo devrait maintenant inclure :
```json
{
  "metadata": {
    "product_id": "a6dbf752-22ca-4931-abdc-0aee713dbd99",
    "store_id": "ecb9d915-b37b-4383-afb1-256bab22da73",
    ...
  }
}
```

