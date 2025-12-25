# 🚀 Guide de Déploiement Final - Correction Moneroo

## Date: 2025-01-29

## ✅ Corrections Appliquées

### 1. Edge Function (`supabase/functions/moneroo/index.ts`)

**Problème :** `metadata.product_id` n'était pas inclus dans la requête à l'API Moneroo.

**Solution :**
- ✅ Extraction de `productId` depuis `data` et ajout à `metadata.product_id`
- ✅ Extraction de `storeId` depuis `data` et ajout à `metadata.store_id`
- ✅ Logs détaillés pour diagnostic
- ✅ Vérification finale avec warning si `product_id` manque

### 2. Client Moneroo (`src/lib/moneroo-payment.ts`)

**Problème :** `productId` n'était pas passé à l'Edge Function.

**Solution :**
- ✅ Ajout de `productId` dans `metadata.product_id` directement
- ✅ Passage de `productId` et `storeId` directement dans `data` pour que l'Edge Function puisse les extraire
- ✅ Logs détaillés pour vérifier que `productId` est bien passé

### 3. Interface TypeScript (`src/lib/moneroo-client.ts`)

**Mise à jour :**
- ✅ Ajout de `productId` et `storeId` dans l'interface `MonerooCheckoutData`

## 📋 Pages de Paiement Existantes

### ✅ Pages Déjà Implémentées

1. **`/checkout/success`** : `src/pages/checkout/Success.tsx`
   - ✅ Vérifie le statut de la transaction
   - ✅ Affiche les détails du produit
   - ✅ Gère les licences PLR/copyrighted
   - ✅ Redirection vers marketplace ou dashboard

2. **`/checkout/cancel`** : `src/pages/checkout/Cancel.tsx`
   - ✅ Met à jour le statut de la transaction
   - ✅ Permet de retourner au marketplace
   - ✅ Bouton pour réessayer le paiement

3. **Routes configurées** dans `src/App.tsx` :
   - ✅ `/checkout/success` → `CheckoutSuccess`
   - ✅ `/checkout/cancel` → `CheckoutCancel`

## 🚀 Étapes de Déploiement

### Étape 1 : Redéployer l'Edge Function

1. **Ouvrir Supabase Dashboard** :
   - Aller sur https://app.supabase.com
   - Sélectionner votre projet **Payhuk**
   - Aller dans **Edge Functions** → **moneroo**

2. **Ouvrir l'onglet Code** :
   - Cliquer sur l'onglet **"Code"**
   - Sélectionner tout le code existant (Ctrl+A / Cmd+A)
   - Supprimer (Suppr / Delete)

3. **Copier le code corrigé** :
   - Ouvrir `supabase/functions/moneroo/index.ts`
   - Copier **TOUT** le contenu (Ctrl+A, Ctrl+C)
   - Coller dans l'éditeur Supabase (Ctrl+V)

4. **Déployer** :
   - Cliquer sur **"Deploy updates"** ou **"Save"**
   - Attendre que le déploiement soit terminé (quelques secondes)

### Étape 2 : Vérifier les Secrets

1. **Ouvrir l'onglet Secrets** :
   - Dans **Edge Functions** → **Secrets**
   - Vérifier que `MONEROO_API_KEY` existe
   - Si non, ajouter avec votre clé API Moneroo

### Étape 3 : Tester le Paiement

1. **Aller sur ProductDetail** :
   - Ouvrir un produit dans le marketplace
   - Cliquer sur **"Acheter maintenant"**

2. **Vérifier** :
   - ✅ Plus d'erreur 422
   - ✅ Redirection vers la page de checkout Moneroo
   - ✅ Après paiement, redirection vers `/checkout/success`

### Étape 4 : Vérifier les Logs

Dans **Supabase Dashboard** → **Edge Functions** → **moneroo** → **Logs**, vous devriez voir :

```
INFO Moneroo Edge Function Processing request: [action: "create_checkout", dataKeys: ["amount", "currency", "customerEmail", "storeId", "productId", ...]]
INFO Moneroo Edge Function Before metadata construction: [dataProductId: "a6dbf752-...", ...]
INFO Moneroo Edge Function Added product_id to metadata: a6dbf752-22ca-4931-abdc-0aee713dbd99
INFO Moneroo Edge Function Metadata construction: [finalMetadataProductId: "a6dbf752-...", ...]
```

## ✅ Checklist de Vérification

- [ ] Edge Function redéployée avec le code corrigé
- [ ] `MONEROO_API_KEY` configuré dans Secrets
- [ ] `productId` est passé dans `checkoutData.metadata.product_id`
- [ ] `productId` est passé directement dans `data` pour l'Edge Function
- [ ] Logs montrent `product_id` dans `finalMetadata`
- [ ] Plus d'erreur 422 de l'API Moneroo
- [ ] Redirection vers checkout Moneroo fonctionne
- [ ] Redirection vers `/checkout/success` après paiement fonctionne
- [ ] Page `/checkout/cancel` fonctionne en cas d'annulation

## 📚 Documentation

- [Documentation Moneroo](https://docs.moneroo.io/)
- [Moneroo Standard Integration](https://docs.moneroo.io/payments/standard-integration)
- [Moneroo PHP SDK - Exemple](https://docs.moneroo.io/sdks/php-sdk)

## 🔍 Structure de la Requête Finale

**Requête envoyée à l'API Moneroo :**
```json
{
  "amount": 5000,
  "currency": "XOF",
  "description": "Achat de Formation : ...",
  "customer": {
    "email": "client@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "return_url": "http://localhost:8080/checkout/success?transaction_id=...",
  "cancel_url": "http://localhost:8080/checkout/cancel?transaction_id=...",
  "metadata": {
    "transaction_id": "02d17847-5f7c-4e36-9d9d-8b92a3bdfd9e",
    "store_id": "ecb9d915-b37b-4383-afb1-256bab22da73",
    "product_id": "a6dbf752-22ca-4931-abdc-0aee713dbd99",  // ✅ Maintenant inclus
    "user_id": "cd50a4d0-6c7f-405a-b0ed-2ac5f12c33cc"
  }
}
```

## 🎯 Résultat Attendu

Après le redéploiement :
1. ✅ `metadata.product_id` sera automatiquement inclus
2. ✅ L'API Moneroo acceptera la requête (plus d'erreur 422)
3. ✅ Le paiement fonctionnera sur ProductDetail, Marketplace et Storefront
4. ✅ La redirection vers `/checkout/success` fonctionnera correctement

