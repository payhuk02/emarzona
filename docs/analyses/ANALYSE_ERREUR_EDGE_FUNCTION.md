# 🔍 Analyse Erreur Edge Function - ProductDetail

## Date: 2025-01-29

## ❌ Problème

L'erreur "Edge Function returned a non-2xx status code" persiste sur ProductDetail alors que le paiement fonctionne sur Marketplace et Storefront.

## 🔍 Analyse Approfondie

### Différences Potentielles Identifiées

1. **Format des IDs** :
   - Les IDs (storeId, productId) pourraient ne pas être au bon format (string UUID)
   - ProductDetail pourrait envoyer des IDs différents ou mal formatés

2. **Validation des Paramètres** :
   - ProductDetail pourrait envoyer des paramètres invalides (null, undefined, objets au lieu de strings)
   - Le montant pourrait être mal formaté

3. **Structure des Données** :
   - Les metadata pourraient avoir une structure différente
   - Les URLs de retour pourraient être mal formées

## ✅ Corrections Appliquées

### 1. Validation Renforcée dans `moneroo-payment.ts`

```typescript
// Validation des paramètres obligatoires
if (!storeId || typeof storeId !== 'string' || storeId.trim() === '') {
  throw new MonerooValidationError(`storeId invalide: ${storeId}`);
}

if (productId && (typeof productId !== 'string' || productId.trim() === '')) {
  throw new MonerooValidationError(`productId invalide: ${productId}`);
}

if (!customerEmail || typeof customerEmail !== 'string' || !customerEmail.includes('@')) {
  throw new MonerooValidationError(`customerEmail invalide: ${customerEmail}`);
}
```

### 2. Conversion et Validation dans ProductDetail

```typescript
// S'assurer que storeId et productId sont des strings (UUIDs)
const finalStoreId = String(storeId).trim();
const finalProductId = String(product.id).trim();
const finalAmount = Number(price);
const finalCurrency = (product.currency || "XOF").trim();

// Validation finale avant l'appel
if (!finalStoreId || finalStoreId.length < 30) {
  // Erreur
}

if (!finalProductId || finalProductId.length < 30) {
  // Erreur
}
```

### 3. Logs Détaillés

```typescript
logger.log("Initiating Moneroo payment from ProductDetail:", {
  storeId: finalStoreId,
  productId: finalProductId,
  amount: finalAmount,
  amountType: typeof finalAmount,
  currency: finalCurrency,
  productName: product.name,
  storeSlug: store.slug,
  userEmail: user.email,
});
```

### 4. Logs dans moneroo-payment.ts

```typescript
logger.log("Initiating Moneroo checkout:", {
  ...checkoutData,
  amount: typeof checkoutData.amount === 'number' ? checkoutData.amount : Number(checkoutData.amount),
  currency: checkoutData.currency,
  hasReturnUrl: !!checkoutData.return_url,
  hasCancelUrl: !!checkoutData.cancel_url,
  metadataKeys: Object.keys(checkoutData.metadata || {}),
});
```

## 🎯 Prochaines Étapes

1. **Vérifier les logs** dans la console du navigateur pour voir exactement quelles données sont envoyées
2. **Comparer** les logs de ProductDetail avec ceux de Marketplace/Storefront
3. **Vérifier les logs Supabase Edge Functions** pour voir l'erreur exacte retournée par l'Edge Function

## 📊 Résultat Attendu

Avec ces validations et logs, nous devrions pouvoir :
- ✅ Identifier exactement quel paramètre cause l'erreur
- ✅ Voir la différence entre ProductDetail et les autres pages
- ✅ Corriger le problème spécifique

Les logs détaillés permettront de diagnostiquer précisément le problème.

