# 🔧 Correction du Problème CORS pour Localhost

## 🔴 Problème Identifié

L'erreur CORS suivante apparaît lors du développement local :
```
Access to fetch at 'https://your-project-id.supabase.co/functions/v1/moneroo' 
from origin 'http://localhost:8080' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
The 'Access-Control-Allow-Origin' header has a value 'https://payhula.vercel.app/' 
that is not equal to the supplied origin.
```

## ✅ Solution Appliquée

### 1. CORS Dynamique dans l'Edge Function

L'Edge Function Moneroo a été modifiée pour :
- ✅ Détecter automatiquement l'origine de la requête
- ✅ Autoriser `localhost` et `127.0.0.1` pour le développement
- ✅ Autoriser le domaine de production (`https://payhula.vercel.app`)
- ✅ Retourner l'origine exacte pour les requêtes localhost (nécessaire pour CORS avec credentials)

### 2. Modifications Apportées

**Fichier :** `supabase/functions/moneroo/index.ts`

**Changements :**
1. Fonction `getCorsOrigin()` pour déterminer l'origine autorisée
2. Fonction `getCorsHeaders()` pour créer les headers CORS dynamiques
3. Support de `localhost` et `127.0.0.1` pour le développement
4. Support du domaine de production
5. Header `Access-Control-Allow-Credentials: true` ajouté

## 🚀 Redéploiement Requis

### Option 1 : Via Supabase Dashboard (Recommandé)

1. **Aller sur Supabase Dashboard :**
   - https://supabase.com/dashboard/project/your-project-id/functions/moneroo/code

2. **Copier le code mis à jour :**
   - Ouvrir `supabase/functions/moneroo/index.ts`
   - Copier tout le contenu (Ctrl+A, Ctrl+C)

3. **Coller dans l'éditeur :**
   - Coller le code dans l'éditeur Supabase
   - Cliquer sur **Deploy** (ou **Save**)

4. **Vérifier le déploiement :**
   - Attendre le message de succès
   - Vérifier les logs pour confirmer

### Option 2 : Via Supabase CLI

```bash
# Redéployer l'Edge Function
supabase functions deploy moneroo
```

## ✅ Vérification

Après le redéploiement :

1. **Redémarrer le serveur de développement :**
   ```bash
   npm run dev
   ```

2. **Tester le paiement :**
   - Aller sur http://localhost:8080/marketplace
   - Cliquer sur "Acheter" sur un produit
   - Vérifier que l'erreur CORS a disparu

3. **Vérifier la console :**
   - ✅ Plus d'erreur CORS
   - ✅ Les requêtes POST atteignent l'Edge Function
   - ✅ Les logs Supabase montrent les requêtes POST

4. **Vérifier les logs Supabase :**
   - Aller sur : https://supabase.com/dashboard/project/your-project-id/functions/moneroo/logs
   - Vérifier que les requêtes POST apparaissent (pas seulement OPTIONS)

## 📝 Notes Importantes

### Sécurité

- ✅ En développement, `localhost` est autorisé automatiquement
- ✅ En production, seul le domaine configuré (`SITE_URL`) est autorisé
- ✅ Les credentials sont autorisés (`Access-Control-Allow-Credentials: true`)

### Configuration

- La variable `SITE_URL` dans Supabase Edge Functions Secrets contrôle le domaine de production
- Si `SITE_URL` n'est pas configuré, `https://payhula.vercel.app` est utilisé par défaut
- Les ports localhost sont autorisés automatiquement (8080, 3000, 5173, etc.)

### Dépannage

Si l'erreur CORS persiste après le redéploiement :

1. **Vider le cache du navigateur :**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

2. **Vérifier que l'Edge Function est bien déployée :**
   - Vérifier les logs Supabase
   - Vérifier que le code mis à jour est déployé

3. **Vérifier l'origine dans les logs :**
   - Les logs Supabase devraient montrer `origin: http://localhost:8080`
   - Les logs devraient montrer `allowedOrigin: http://localhost:8080`

## 🔗 Fichiers Modifiés

- `supabase/functions/moneroo/index.ts` - CORS dynamique ajouté
- `CORRECTION_CORS_LOCALHOST.md` - Ce fichier de documentation

## 📚 Ressources

- [Documentation CORS Supabase](https://supabase.com/docs/guides/functions/cors)
- [Documentation CORS MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)





