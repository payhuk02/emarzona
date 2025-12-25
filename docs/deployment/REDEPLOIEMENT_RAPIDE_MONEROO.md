# ⚡ Redéploiement Rapide - Edge Function Moneroo

## 🎯 Objectif

Redéployer l'Edge Function `moneroo` avec le code corrigé pour résoudre l'erreur :
- ❌ `"The route v1/checkout/initialize could not be found"`
- ✅ Corrigé vers `/checkout`

## 🚀 Méthode Rapide (2 minutes)

### Étape 1 : Ouvrir le Code Local

1. Ouvrir le fichier : `supabase/functions/moneroo/index.ts`
2. Sélectionner TOUT le contenu (Ctrl+A)
3. Copier (Ctrl+C)

### Étape 2 : Coller dans Supabase Dashboard

1. Aller sur https://supabase.com/dashboard
2. Projet "Payhuk" → **Edge Functions** → **Functions** → **moneroo**
3. Cliquer sur l'onglet **"Code"**
4. Sélectionner TOUT le code existant (Ctrl+A)
5. Coller le nouveau code (Ctrl+V)
6. Cliquer sur **"Deploy"** ou **"Save"**

### Étape 3 : Vérifier

1. Attendre la confirmation "Deployed successfully"
2. Vérifier "LAST UPDATED" → devrait être "just now"
3. Tester un paiement sur le marketplace
4. Vérifier les logs → devrait voir `/checkout` au lieu de `/checkout/initialize`

## ✅ Vérification dans les Logs

**Avant redéploiement (ERREUR) :**
```
ERROR Moneroo API error: { message: "The route v1/checkout/initialize could not be found." }
```

**Après redéploiement (SUCCÈS) :**
```
INFO Calling Moneroo API: { url: "https://api.moneroo.io/v1/checkout", endpoint: "/checkout" }
INFO Moneroo API response: { status: 200, ... }
```

## 📝 Checklist

- [ ] Code local copié depuis `supabase/functions/moneroo/index.ts`
- [ ] Code collé dans Supabase Dashboard → Edge Functions → moneroo → Code
- [ ] Déployé avec succès
- [ ] "LAST UPDATED" mis à jour
- [ ] Paiement testé sur le marketplace
- [ ] Logs vérifiés (endpoint `/checkout` utilisé)
- [ ] Erreur disparue

## 🎯 Résultat Attendu

✅ L'erreur "The route v1/checkout/initialize could not be found" devrait disparaître
✅ Le paiement devrait fonctionner
✅ Les logs devraient montrer l'endpoint `/checkout` correct






