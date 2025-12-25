# 🔧 Solution Endpoint Moneroo API - Erreur 404

## ❌ Problème Identifié

**Erreur dans les logs :**
```
ERROR Moneroo API error: { status: 404, statusText: "Not Found", response: { message: "The route v1/payments could not be found." } }
```

**Analyse :**
- ✅ Edge Function déployée et fonctionnelle
- ✅ CORS configuré correctement
- ✅ API Key configurée
- ❌ L'API Moneroo retourne 404 pour `/v1/payments`

---

## ✅ Correction Appliquée

J'ai changé l'endpoint de `/payments` à `/checkout` car :
1. C'était l'endpoint original
2. Les logs montrent que `/payments` n'existe pas
3. `/checkout` est plus logique pour créer un paiement

**Code corrigé :**
```typescript
case 'create_checkout':
  endpoint = '/checkout';  // Changé de '/payments' à '/checkout'
  method = 'POST';
  // ...
```

---

## 🚀 Action Immédiate

### Redéployer l'Edge Function avec le Code Corrigé

1. **Ouvrez Supabase Dashboard**
   - Allez sur : https://app.supabase.com/project/your-project-id/functions/moneroo/code

2. **Copiez le Code Corrigé**
   - Ouvrez `CODE_MONEROO_POUR_SUPABASE.txt`
   - Copiez tout le contenu (Ctrl+A, Ctrl+C)

3. **Collez dans Supabase**
   - Dans l'éditeur Supabase, sélectionnez tout (Ctrl+A)
   - Supprimez l'ancien code
   - Collez le nouveau code (Ctrl+V)

4. **Déployez**
   - Cliquez sur **"Deploy updates"**

5. **Testez**
   - Retournez sur `http://localhost:8080/marketplace`
   - Essayez d'acheter un produit
   - Vérifiez les logs Supabase

---

## 🔍 Si `/checkout` Ne Fonctionne Pas Non Plus

### Option 1 : Vérifier l'URL de Base

L'URL de base pourrait être incorrecte. Tester :

```typescript
// Option A (actuel)
const MONEROO_API_URL = 'https://api.moneroo.io/v1';

// Option B (sans /v1)
const MONEROO_API_URL = 'https://api.moneroo.io';

// Option C (alternative)
const MONEROO_API_URL = 'https://moneroo.io/api/v1';
```

### Option 2 : Essayer d'Autres Endpoints

Si `/checkout` ne fonctionne pas, essayer :

```typescript
// Option 1
endpoint = '/checkout';

// Option 2
endpoint = '/payment';  // singulier

// Option 3
endpoint = '/transactions';

// Option 4
endpoint = '/orders';

// Option 5
endpoint = '/checkout/create';
```

### Option 3 : Vérifier la Documentation Moneroo

**Action requise :**
1. Consulter la documentation officielle Moneroo
2. Vérifier l'endpoint exact pour créer un paiement
3. Vérifier l'URL de base de l'API
4. Vérifier le format des données attendu

---

## 📋 Checklist de Vérification

- [ ] Code corrigé avec `/checkout` déployé
- [ ] Test d'un paiement effectué
- [ ] Logs Supabase vérifiés
- [ ] Si erreur 404 persiste, essayer les autres options
- [ ] Documentation Moneroo consultée si nécessaire

---

## 🆘 Dépannage

### Si `/checkout` retourne aussi 404

1. **Vérifier la Clé API**
   - S'assurer que la clé API est valide
   - Vérifier qu'elle correspond au bon environnement

2. **Vérifier l'URL de Base**
   - Tester différentes URLs de base
   - Vérifier si l'API utilise une URL différente

3. **Contacter Moneroo**
   - Demander l'endpoint exact
   - Vérifier que le compte est actif

---

## 📝 Note Importante

**Il est crucial de vérifier la documentation officielle Moneroo** pour connaître :
- L'endpoint exact pour créer un paiement
- L'URL de base de l'API
- Le format des données attendu
- Les headers requis

---

## ✅ Prochaines Étapes

1. **Redéployer avec `/checkout`** (code déjà corrigé)
2. **Tester le paiement**
3. **Si erreur 404 persiste**, essayer les autres options
4. **Consulter la documentation Moneroo** si nécessaire




