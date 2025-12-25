# 📚 Analyse Complète de la Documentation Moneroo

## Date: 2025-01-29

## 🔍 Analyse de la Documentation Officielle

D'après la [documentation Moneroo](https://docs.moneroo.io/) et les exemples de code PHP/Laravel SDK :

### 1. Endpoint d'Initialisation de Paiement

**Endpoint :** `POST /v1/payments/initialize`

**URL Complète :** `https://api.moneroo.io/v1/payments/initialize`

✅ **Notre implémentation est correcte** : Nous utilisons bien `/payments/initialize`

### 2. Champs Requis pour l'Initialisation

D'après la documentation, les champs **obligatoires** sont :

| Champ | Type | Description |
|-------|------|-------------|
| `amount` | integer | Montant en centimes (ex: 1000 = 10.00 XOF) |
| `currency` | string | Code devise (ex: "XOF", "XAF", "USD") |
| `description` | string | Description du paiement |
| `customer_email` | string | Email du client |
| `customer_name` | string | Nom complet du client |
| `return_url` | string | URL de retour après paiement réussi |
| `cancel_url` | string | URL de retour si paiement annulé |

✅ **Notre implémentation inclut tous ces champs**

### 3. Champs Optionnels

| Champ | Type | Description |
|-------|------|-------------|
| `customer_address` | string | Adresse du client |
| `customer_city` | string | Ville du client |
| `customer_state` | string | État/Région du client |
| `customer_zip` | string | Code postal |
| `metadata` | object | **Données supplémentaires (product_id, order_id, user_id, etc.)** |
| `methods` | array | Méthodes de paiement autorisées |

### 4. ⚠️ IMPORTANT : Format du Customer

D'après la documentation et les exemples :

**Format attendu par Moneroo :**
```json
{
  "customer": {
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

✅ **Notre implémentation transforme correctement `customer_name` en `first_name` et `last_name`**

### 5. ⚠️ CRITIQUE : Format du Metadata

D'après les exemples de la documentation PHP SDK :

```php
'metadata' => [
    'order_id' => 'ORD-123',
    'product_id' => 'PROD-456',  // ⚠️ REQUIS selon les logs d'erreur
    'user_id' => 'USER-789',
]
```

**Format attendu :**
- `metadata` est un **objet** (pas un array)
- Les clés peuvent être en `snake_case` ou `camelCase`
- **`product_id` est requis** selon les erreurs 422 que nous recevons

### 6. Réponse de l'API Moneroo

**Succès (200) :**
```json
{
  "message": "Payment initialized successfully",
  "data": {
    "id": "transaction_id",
    "checkout_url": "https://checkout.moneroo.io/...",
    "status": "pending"
  }
}
```

**Erreur (422) :**
```json
{
  "message": "The metadata.product_id field is required.",
  "code": "validation_error"
}
```

## 🔍 Analyse de Notre Implémentation

### ✅ Points Corrects

1. **Endpoint** : `/payments/initialize` ✅
2. **Méthode HTTP** : `POST` ✅
3. **Headers** : `Authorization: Bearer {API_KEY}`, `Content-Type: application/json` ✅
4. **Format Customer** : Transformation `customer_name` → `first_name` + `last_name` ✅
5. **Champs obligatoires** : Tous présents ✅

### ❌ Problème Identifié

**Le problème :** `metadata.product_id` n'est pas inclus dans la requête envoyée à l'API Moneroo.

**Cause :** L'Edge Function reçoit `productId` dans `data`, mais ne l'ajoute pas systématiquement à `metadata.product_id`.

**Solution appliquée :** Code corrigé pour extraire `productId` de `data` et l'ajouter à `metadata.product_id`.

## 📋 Structure de la Requête Attendue

D'après la documentation, la requête complète devrait ressembler à :

```json
{
  "amount": 5000,
  "currency": "XOF",
  "description": "Achat de produit",
  "customer": {
    "email": "client@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "return_url": "https://votre-app.com/checkout/success?transaction_id=...",
  "cancel_url": "https://votre-app.com/checkout/cancel?transaction_id=...",
  "metadata": {
    "product_id": "a6dbf752-22ca-4931-abdc-0aee713dbd99",
    "store_id": "ecb9d915-b37b-4383-afb1-256bab22da73",
    "transaction_id": "02d17847-5f7c-4e36-9d9d-8b92a3bdfd9e",
    "user_id": "cd50a4d0-6c7f-405a-b0ed-2ac5f12c33cc"
  }
}
```

## 🎯 Pages de Paiement

### Pages Existantes

1. **`/checkout/success`** : Page de succès pour les transactions Moneroo
   - ✅ Existe : `src/pages/checkout/Success.tsx`
   - ✅ Vérifie le statut de la transaction
   - ✅ Affiche les détails du produit acheté

2. **`/checkout/cancel`** : Page d'annulation
   - ✅ Existe : `src/pages/checkout/Cancel.tsx`
   - ✅ Permet de retourner au marketplace

3. **`/payment/success`** : Page alternative de succès
   - ✅ Existe : `src/pages/payments/PaymentSuccess.tsx`
   - ✅ Utilisée pour d'autres types de paiements

### Routes Configurées

D'après `src/App.tsx` :
- ✅ `/checkout/success` → `CheckoutSuccess`
- ✅ `/checkout/cancel` → `CheckoutCancel`
- ✅ `/payment/success` → `PaymentSuccess`
- ✅ `/payment/cancel` → `PaymentCancel`

## ✅ Corrections Appliquées

### 1. Edge Function (`supabase/functions/moneroo/index.ts`)

**Corrections :**
- ✅ Extraction de `productId` depuis `data` et ajout à `metadata.product_id`
- ✅ Extraction de `storeId` depuis `data` et ajout à `metadata.store_id`
- ✅ Logs détaillés pour diagnostic
- ✅ Vérification finale avec warning si `product_id` manque
- ✅ Conversion explicite en string pour éviter les problèmes de type

### 2. Format de la Requête

**Avant (❌ Erreur 422) :**
```json
{
  "metadata": {
    "transaction_id": "...",
    "store_id": "..."
    // ❌ product_id manquant
  }
}
```

**Après (✅ Correct) :**
```json
{
  "metadata": {
    "transaction_id": "...",
    "store_id": "...",
    "product_id": "a6dbf752-22ca-4931-abdc-0aee713dbd99"  // ✅ Ajouté
  }
}
```

## 🚀 Prochaines Étapes

1. **Redéployer l'Edge Function** dans Supabase Dashboard
2. **Tester le paiement** sur ProductDetail
3. **Vérifier les logs** pour confirmer que `metadata.product_id` est présent
4. **Vérifier que la redirection** vers `/checkout/success` fonctionne correctement

## 📚 Références

- [Documentation Moneroo](https://docs.moneroo.io/)
- [Moneroo PHP SDK - Exemple d'initialisation](https://docs.moneroo.io/sdks/php-sdk)
- [Moneroo Laravel SDK - Exemple d'utilisation](https://docs.moneroo.io/sdks/laravel-sdk)

