# 🚀 Guide de Déploiement Visuel - Edge Function Moneroo

## ❌ Problème Actuel

**Erreur 404 :** `POST https://your-project-id.supabase.co/functions/v1/moneroo 404 (Not Found)`

**Cause :** L'Edge Function `moneroo` n'est pas déployée dans Supabase Dashboard.

---

## ✅ Solution : Déployer l'Edge Function

### Étape 1 : Accéder à Supabase Dashboard

1. **Allez sur** [https://app.supabase.com](https://app.supabase.com)
2. **Connectez-vous** à votre compte
3. **Sélectionnez votre projet** : **Payhuk** (ou le nom de votre projet)

### Étape 2 : Naviguer vers Edge Functions

1. **Dans le menu de gauche**, cliquez sur **"Edge Functions"** (icône ⚡)
2. **Vous verrez une liste** de vos Edge Functions (peut être vide si aucune n'est déployée)

### Étape 3 : Créer ou Modifier la Fonction `moneroo`

#### Option A : Si la fonction `moneroo` n'existe pas

1. **Cliquez sur** **"New Function"** ou **"Create Function"** (bouton en haut à droite)
2. **Nommez la fonction** : `moneroo` (en minuscules, exactement comme ça)
3. **Cliquez sur** **"Create"** ou **"Create Function"**

#### Option B : Si la fonction `moneroo` existe déjà

1. **Cliquez sur** la fonction `moneroo` dans la liste
2. **Allez dans l'onglet** **"Code"** (en haut)

### Étape 4 : Copier le Code

1. **Ouvrez le fichier** `CODE_MONEROO_POUR_SUPABASE.txt` dans votre éditeur de code
2. **Sélectionnez TOUT le code** (Ctrl+A / Cmd+A)
3. **Copiez le code** (Ctrl+C / Cmd+C)

**⚠️ IMPORTANT :** Le fichier `CODE_MONEROO_POUR_SUPABASE.txt` contient exactement le code à copier, **SANS** la première ligne de référence.

### Étape 5 : Coller le Code dans Supabase

1. **Dans l'éditeur Supabase**, **sélectionnez tout le code existant** (Ctrl+A / Cmd+A)
2. **Supprimez-le** (Suppr / Delete)
3. **Collez le nouveau code** (Ctrl+V / Cmd+V)
4. **Vérifiez** que le code est bien collé (vous devriez voir les imports Deno en haut)

### Étape 6 : Déployer la Fonction

1. **Cliquez sur le bouton** **"Deploy"** ou **"Deploy updates"** (en bas à droite ou en haut)
2. **Attendez** que le déploiement se termine (quelques secondes)
3. **Vous devriez voir** un message de succès : "Function deployed successfully" ou similaire

### Étape 7 : Vérifier les Secrets

1. **Toujours dans Edge Functions**, allez dans l'onglet **"Secrets"** (en haut)
2. **Vérifiez** que `MONEROO_API_KEY` est dans la liste
3. **Si ce n'est pas le cas :**
   - Cliquez sur **"Add a new secret"** ou **"New Secret"**
   - **Nom** : `MONEROO_API_KEY`
   - **Valeur** : Votre clé API Moneroo (format : `sk_live_...` ou `sk_test_...`)
   - Cliquez sur **"Save"** ou **"Add"**

### Étape 8 : Vérifier le Déploiement

1. **Allez dans l'onglet** **"Logs"** (en haut)
2. **Vous devriez voir** des messages `LOG booted (time: Xms)` indiquant que la fonction a démarré
3. **Si vous ne voyez rien**, attendez quelques secondes et rafraîchissez la page

---

## 🧪 Tester le Déploiement

### Test 1 : Vérifier dans les Logs

1. **Dans Supabase Dashboard**, allez dans **Edge Functions** > **moneroo** > **Logs**
2. **Retournez sur votre application** (`http://localhost:8080/marketplace`)
3. **Essayez d'acheter un produit**
4. **Retournez dans les logs Supabase**
5. **Vous devriez voir** :
   ```
   INFO [Moneroo Edge Function] Request received: { method: "POST", ... }
   INFO [Moneroo Edge Function] CORS config: { origin: "http://localhost:8080", ... }
   INFO [Moneroo Edge Function] Processing request: { action: "create_checkout", ... }
   ```

### Test 2 : Vérifier dans la Console du Navigateur

1. **Ouvrez la console du navigateur** (F12)
2. **Essayez d'acheter un produit**
3. **Vous ne devriez PLUS voir** l'erreur `404 (Not Found)`
4. **Si vous voyez d'autres erreurs**, consultez les logs Supabase pour plus de détails

---

## 🔍 Vérifications Post-Déploiement

### ✅ Checklist

- [ ] La fonction `moneroo` est listée dans **Edge Functions**
- [ ] Le code est collé dans l'éditeur Supabase
- [ ] La fonction est déployée (bouton "Deploy" cliqué)
- [ ] Le secret `MONEROO_API_KEY` est configuré
- [ ] Les logs montrent `booted (time: Xms)`
- [ ] Plus d'erreur 404 dans la console du navigateur
- [ ] Les requêtes POST apparaissent dans les logs Supabase

---

## 🆘 Dépannage

### Si l'erreur 404 persiste

1. **Vérifiez le nom de la fonction :**
   - Le nom doit être exactement `moneroo` (en minuscules)
   - Pas de caractères spéciaux, pas d'espaces

2. **Vérifiez que la fonction est déployée :**
   - Allez dans **Edge Functions** > **moneroo** > **Overview**
   - Vérifiez que la fonction est **active** et **déployée**

3. **Vérifiez l'URL :**
   - L'URL doit être : `https://[PROJECT_REF].supabase.co/functions/v1/moneroo`
   - Vérifiez que `[PROJECT_REF]` correspond à votre projet

4. **Videz le cache du navigateur :**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

### Si vous voyez une erreur 500

1. **Vérifiez les secrets :**
   - Allez dans **Edge Functions** > **Secrets**
   - Vérifiez que `MONEROO_API_KEY` est configuré
   - Vérifiez que la clé API est correcte

2. **Vérifiez les logs :**
   - Allez dans **Edge Functions** > **moneroo** > **Logs**
   - Cherchez les messages d'erreur
   - Les logs devraient indiquer le problème exact

### Si vous voyez une erreur CORS

1. **Vérifiez le code déployé :**
   - Allez dans **Edge Functions** > **moneroo** > **Code**
   - Vérifiez que les fonctions `getCorsOrigin` et `getCorsHeaders` sont présentes
   - Vérifiez que `localhost` est autorisé

2. **Vérifiez les logs :**
   - Les logs devraient montrer : `allowedOrigin: "http://localhost:8080"`

---

## 📋 Code à Copier

Le code complet se trouve dans le fichier **`CODE_MONEROO_POUR_SUPABASE.txt`**.

**⚠️ IMPORTANT :** 
- Ne copiez PAS la première ligne `/// <reference path="../deno.d.ts" />` si elle apparaît
- Cette ligne est uniquement pour l'IDE local, pas pour Supabase

---

## 🎯 Résultat Attendu

Après le déploiement :

- ✅ Plus d'erreur 404 sur l'Edge Function
- ✅ Les requêtes POST atteignent l'Edge Function
- ✅ Les logs Supabase montrent les requêtes entrantes
- ✅ Les paiements peuvent être initiés depuis l'application
- ✅ Plus d'erreur dans la console du navigateur

---

## 📚 Ressources

- **Code à copier :** `CODE_MONEROO_POUR_SUPABASE.txt`
- **Guide de déploiement :** `DEPLOIEMENT_URGENT_MONEROO.md`
- **Résumé des corrections :** `RESUME_CORRECTIONS_URGENTES.md`

---

## ✅ Prochaines Étapes

1. **Déployer l'Edge Function** (voir étapes ci-dessus)
2. **Vérifier les secrets** (voir étape 7)
3. **Tester le paiement** (voir section "Tester le Déploiement")
4. **Vérifier les logs** pour confirmer que tout fonctionne

Une fois ces étapes terminées, l'erreur 404 devrait être résolue et les paiements devraient fonctionner correctement.




