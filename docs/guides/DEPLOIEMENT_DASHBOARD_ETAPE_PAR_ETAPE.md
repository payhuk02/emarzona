# 🚀 Déploiement Edge Function Moneroo - Étape par Étape

## ⚡ Méthode Rapide via Dashboard (2 minutes)

### Étape 1 : Ouvrir le Code Local ✅

1. Ouvrir le fichier : `supabase/functions/moneroo/index.ts`
2. **Sélectionner TOUT** le contenu (Ctrl+A ou Cmd+A)
3. **Copier** (Ctrl+C ou Cmd+C)

### Étape 2 : Ouvrir Supabase Dashboard ✅

1. Aller sur : https://supabase.com/dashboard
2. Sélectionner le projet **"Payhuk"**
3. Cliquer sur **Edge Functions** dans la sidebar
4. Cliquer sur **Functions**
5. Cliquer sur **moneroo** dans la liste

### Étape 3 : Coller le Nouveau Code ✅

1. Cliquer sur l'onglet **"Code"** (en haut de la page)
2. **Sélectionner TOUT** le code existant (Ctrl+A ou Cmd+A)
3. **Supprimer** (Suppr ou Backspace)
4. **Coller** le nouveau code (Ctrl+V ou Cmd+V)
5. Cliquer sur le bouton **"Deploy"** (en haut à droite)

### Étape 4 : Vérifier le Déploiement ✅

1. Attendre la confirmation **"Deployed successfully"** (quelques secondes)
2. Vérifier que **"LAST UPDATED"** affiche maintenant **"just now"** ou **"a few seconds ago"**
3. Cliquer sur l'onglet **"Logs"** pour voir les nouveaux logs

### Étape 5 : Tester le Paiement ✅

1. Aller sur : https://payhula.vercel.app/marketplace
2. Sélectionner un produit
3. Cliquer sur **"Acheter"**
4. **Vérifier** :
   - ✅ Pas d'erreur "Edge Function returned a non-2xx status code"
   - ✅ L'URL de checkout Moneroo est retournée
   - ✅ La redirection vers Moneroo fonctionne

## 🔍 Vérification dans les Logs

### Avant Redéploiement (ERREUR) ❌

```
ERROR Moneroo API error: { message: "The route v1/checkout/initialize could not be found." }
```

### Après Redéploiement (SUCCÈS) ✅

```
INFO Calling Moneroo API: { url: "https://api.moneroo.io/v1/checkout", endpoint: "/checkout" }
INFO Moneroo API response: { status: 200, ... }
```

## 📋 Checklist Complète

- [ ] Code local copié depuis `supabase/functions/moneroo/index.ts`
- [ ] Supabase Dashboard ouvert → Edge Functions → Functions → moneroo
- [ ] Onglet "Code" ouvert
- [ ] Ancien code supprimé
- [ ] Nouveau code collé
- [ ] Bouton "Deploy" cliqué
- [ ] "Deployed successfully" confirmé
- [ ] "LAST UPDATED" mis à jour
- [ ] Paiement testé sur le marketplace
- [ ] Logs vérifiés (endpoint `/checkout` utilisé)
- [ ] Erreur disparue

## 🎯 Résultat Attendu

✅ L'erreur **"The route v1/checkout/initialize could not be found"** devrait **disparaître**
✅ Le paiement devrait **fonctionner** correctement
✅ Les logs devraient montrer l'endpoint **`/checkout`** correct
✅ La redirection vers Moneroo devrait **fonctionner**

## ⚠️ Important

**Le redéploiement est nécessaire** pour que les corrections soient prises en compte. Sans redéploiement, l'Edge Function continuera d'utiliser l'ancien code avec l'endpoint `/checkout/initialize` qui n'existe pas.

## 🆘 Si l'Erreur Persiste

Si après le redéploiement, l'erreur persiste :

1. **Vérifier les logs** Supabase pour voir la nouvelle erreur
2. **Vérifier la documentation Moneroo** pour le bon endpoint
3. **Tester avec Postman/curl** pour vérifier l'endpoint correct
4. **Vérifier les secrets** dans Supabase Dashboard → Edge Functions → Secrets

## 📚 Ressources

- **Code à déployer** : `supabase/functions/moneroo/index.ts`
- **URL Edge Function** : `https://your-project-id.supabase.co/functions/v1/moneroo`
- **Dashboard Supabase** : https://supabase.com/dashboard/project/your-project-id/functions






