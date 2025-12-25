# 🔧 Correction Endpoint Moneroo API - Erreur 404

## ❌ Problème Identifié

**Erreur dans les logs Supabase :**
```
ERROR Moneroo API error: { status: 404, statusText: "Not Found", response: { message: "The route v1/payments could not be found." } }
```

**Cause :** L'endpoint `/v1/payments` n'existe pas dans l'API Moneroo.

---

## 🔍 Analyse

D'après les logs :
- ✅ L'Edge Function est bien déployée
- ✅ CORS fonctionne correctement (localhost autorisé)
- ✅ L'API Key est configurée (`hasApiKey: true, apiKeyLength: 37`)
- ✅ Les requêtes atteignent l'Edge Function
- ❌ L'API Moneroo retourne 404 pour `/v1/payments`

**Conclusion :** L'endpoint utilisé est incorrect.

---

## ✅ Solutions Possibles

### Option 1 : Utiliser `/checkout` (Endpoint Original)

L'endpoint `/checkout` pourrait être le bon endpoint pour créer un paiement Moneroo.

### Option 2 : Vérifier l'URL de Base

L'URL de base pourrait être incorrecte. Vérifier :
- `https://api.moneroo.io/v1` (actuel)
- `https://api.moneroo.io` (sans /v1)
- `https://moneroo.io/api/v1` (alternative)

### Option 3 : Endpoint Différent

L'endpoint pourrait être :
- `/payment` (singulier)
- `/transactions`
- `/orders`
- `/checkout/create`

---

## 🚀 Correction Recommandée

### Essayer `/checkout` en Premier

L'endpoint `/checkout` était l'endpoint original. Il se peut que ce soit le bon endpoint après tout.

**Modification à appliquer :**

```typescript
case 'create_checkout':
  // Essayer /checkout comme endpoint principal
  endpoint = '/checkout';
  method = 'POST';
  // ...
```

---

## 📋 Actions à Effectuer

1. **Vérifier la Documentation Moneroo**
   - Consulter la documentation officielle Moneroo
   - Vérifier l'endpoint exact pour créer un paiement

2. **Tester Différents Endpoints**
   - Essayer `/checkout`
   - Essayer `/payment` (singulier)
   - Essayer sans `/v1` dans l'URL

3. **Contacter le Support Moneroo**
   - Si la documentation n'est pas claire
   - Demander l'endpoint exact pour créer un paiement

---

## 🔄 Code Corrigé (Option 1 : /checkout)

Si `/checkout` est le bon endpoint, voici la correction :

```typescript
case 'create_checkout':
  // Endpoint /checkout pour créer un paiement Moneroo
  endpoint = '/checkout';
  method = 'POST';
  body = {
    amount: data.amount,
    currency: data.currency || 'XOF',
    description: data.description,
    customer_email: data.customer_email,
    customer_name: data.customer_name,
    return_url: data.return_url,
    cancel_url: data.cancel_url,
    metadata: data.metadata || {},
  };
  break;
```

---

## 📝 Note Importante

**Il est crucial de vérifier la documentation officielle Moneroo** pour connaître l'endpoint exact. Les endpoints peuvent varier selon :
- La version de l'API
- Le type de compte (test/production)
- La région

---

## 🆘 Si Aucun Endpoint Ne Fonctionne

1. **Vérifier la Clé API**
   - S'assurer que la clé API est valide
   - Vérifier qu'elle correspond au bon environnement (test/production)

2. **Vérifier l'URL de Base**
   - Tester différentes URLs de base
   - Vérifier si l'API utilise une URL différente pour le test

3. **Contacter Moneroo**
   - Demander l'endpoint exact
   - Vérifier que le compte est actif




