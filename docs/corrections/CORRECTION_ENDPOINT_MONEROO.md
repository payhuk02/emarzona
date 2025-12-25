# 🔧 Correction de l'Endpoint Moneroo - Erreur 404

## 📊 Analyse des Logs

D'après les logs Supabase, l'erreur suivante apparaît :

```
ERROR Moneroo API error: { status: 404, statusText: "Not Found", response: { message: "The route v1/checkout could not be..." }
```

**Problème identifié :** L'endpoint `/v1/checkout` n'existe pas dans l'API Moneroo.

## ✅ Solution

L'API Moneroo utilise `/payments` pour créer les paiements, pas `/checkout`. 

### Correction appliquée

L'endpoint `create_checkout` a été modifié pour utiliser `/payments` au lieu de `/checkout`.

**Avant :**
```typescript
case 'create_checkout':
  endpoint = '/checkout';  // ❌ N'existe pas
  method = 'POST';
  break;
```

**Après :**
```typescript
case 'create_checkout':
  // Utiliser /payments pour créer un paiement avec checkout
  // Moneroo utilise /payments pour créer les paiements (pas /checkout)
  endpoint = '/payments';  // ✅ Endpoint correct
  method = 'POST';
  break;
```

## 🚀 Actions Requises

1. **Mettre à jour l'Edge Function dans Supabase Dashboard**
   - Copier le code corrigé depuis `MONEROO_CODE_COMPLET_A_COLLER.ts`
   - Coller dans l'éditeur Supabase Dashboard
   - Cliquer sur "Deploy updates"

2. **Tester le paiement**
   - Après le déploiement, tester un paiement depuis l'application
   - Vérifier que l'erreur 404 n'apparaît plus dans les logs
   - Vérifier que le paiement est créé avec succès

## 📋 Vérifications

### Logs attendus après correction

**Avant (erreur) :**
```
ERROR Moneroo API error: { status: 404, statusText: "Not Found", response: { message: "The route v1/checkout could not be..." }
```

**Après (succès) :**
```
INFO [Moneroo Edge Function] Calling Moneroo API: { url: "https://api.moneroo.io/v1/payments", method: "POST", hasBody: true }
INFO [Moneroo Edge Function] Moneroo API response: { status: 200, statusText: "OK", ok: true }
INFO Moneroo response success: { action: "create_checkout", status: 200 }
```

## 🔍 Détails Techniques

### Structure de l'API Moneroo

- **Créer un paiement :** `POST /v1/payments`
- **Récupérer un paiement :** `GET /v1/payments/:paymentId`
- **Vérifier un paiement :** `GET /v1/payments/:paymentId/verify`
- **Rembourser un paiement :** `POST /v1/payments/:paymentId/refund`
- **Annuler un paiement :** `POST /v1/payments/:paymentId/cancel`

### Format des données pour create_checkout

Les données sont formatées comme suit :

```typescript
{
  amount: number,
  currency: string, // Par défaut 'XOF'
  description: string,
  customer_email: string,
  customer_name: string,
  return_url: string,
  cancel_url: string,
  metadata: object
}
```

## 📝 Notes

- L'endpoint `/checkout` n'existe pas dans l'API Moneroo
- Tous les paiements (y compris les checkouts) utilisent `/payments`
- Les paramètres `return_url` et `cancel_url` permettent de gérer la redirection après paiement
- Le format des données reste le même, seul l'endpoint change

## ✅ Résultat Attendu

Après la correction :
- ✅ Plus d'erreur 404 dans les logs
- ✅ Les paiements sont créés avec succès
- ✅ Les URLs de checkout sont retournées correctement
- ✅ Les redirections fonctionnent après paiement
