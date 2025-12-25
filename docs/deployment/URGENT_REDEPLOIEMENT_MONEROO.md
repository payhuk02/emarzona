# ⚠️ URGENT : Redéploiement Edge Function Moneroo Requis

## 🔴 Problème Confirmé

D'après les logs Supabase Edge Functions :
- ✅ L'Edge Function `moneroo` reçoit bien les requêtes
- ✅ L'Edge Function démarre correctement
- ❌ **L'erreur persiste** : `"The route v1/checkout/initialize could not be found"`
- ❌ **Le code corrigé n'est pas encore déployé**

## 🎯 Cause du Problème

**Le code local a été corrigé**, mais **l'Edge Function déployée dans Supabase utilise encore l'ancien code** avec l'endpoint `/checkout/initialize` qui n'existe pas dans l'API Moneroo.

## ✅ Solution Immédiate : Redéployer l'Edge Function

### Méthode Rapide : Via Supabase Dashboard (5 minutes)

1. **Ouvrir Supabase Dashboard** :
   - Aller sur https://supabase.com/dashboard
   - Projet "Payhuk"
   - Edge Functions → Functions → moneroo

2. **Ouvrir l'onglet "Code"** :
   - Cliquer sur l'onglet "Code" dans la fonction `moneroo`

3. **Remplacer le code** :
   - Ouvrir le fichier local : `supabase/functions/moneroo/index.ts`
   - Copier TOUT le contenu du fichier
   - Coller dans l'éditeur Supabase (remplacer l'ancien code)

4. **Déployer** :
   - Cliquer sur le bouton "Deploy" ou "Save"
   - Attendre que le déploiement soit terminé (quelques secondes)

5. **Vérifier** :
   - Aller dans l'onglet "Logs"
   - Tester un paiement sur le marketplace
   - Vérifier que les nouveaux logs montrent l'endpoint `/checkout` au lieu de `/checkout/initialize`

### Méthode Alternative : Via Supabase CLI

```bash
# 1. Se connecter à Supabase
supabase login

# 2. Lier le projet
supabase link --project-ref your-project-id

# 3. Déployer l'Edge Function
supabase functions deploy moneroo
```

## 🔍 Vérification Post-Déploiement

### 1. Vérifier dans les Logs

Après le redéploiement, les logs devraient montrer :

**✅ Avant (ancien code - ERREUR) :**
```
INFO Moneroo request: {action: "create_checkout"}
ERROR Moneroo API error: { message: "The route v1/checkout/initialize could not be found." }
```

**✅ Après (nouveau code - SUCCÈS) :**
```
INFO Calling Moneroo API: { url: "https://api.moneroo.io/v1/checkout", method: "POST", endpoint: "/checkout" }
INFO Moneroo API response: { status: 200, ... }
```

### 2. Tester le Paiement

1. Aller sur https://payhula.vercel.app/marketplace
2. Sélectionner un produit
3. Cliquer sur "Acheter"
4. **Vérifier** :
   - ✅ Pas d'erreur "Edge Function returned a non-2xx status code"
   - ✅ L'URL de checkout Moneroo est retournée
   - ✅ La redirection vers Moneroo fonctionne

## 📋 Corrections Incluses dans le Nouveau Code

1. ✅ **Endpoint corrigé** : `/checkout/initialize` → `/checkout`
2. ✅ **Format des données** ajusté selon Moneroo
3. ✅ **Logs détaillés** pour diagnostic
4. ✅ **Gestion d'erreurs améliorée**
5. ✅ **Support `MONEROO_API_URL`** via variable d'environnement

## ⚠️ Important

**Sans redéploiement, l'erreur persistera**. Le code local est corrigé, mais Supabase utilise encore l'ancienne version déployée.

## 🎯 Checklist de Redéploiement

- [ ] Ouvrir Supabase Dashboard → Edge Functions → Functions → moneroo
- [ ] Ouvrir l'onglet "Code"
- [ ] Copier le contenu de `supabase/functions/moneroo/index.ts`
- [ ] Coller dans l'éditeur Supabase
- [ ] Cliquer sur "Deploy" ou "Save"
- [ ] Attendre la confirmation de déploiement
- [ ] Vérifier "LAST UPDATED" dans le dashboard
- [ ] Tester un paiement sur le marketplace
- [ ] Vérifier les logs pour confirmer l'endpoint `/checkout`
- [ ] Vérifier que l'erreur a disparu

## 📚 Ressources

- **Code à déployer** : `supabase/functions/moneroo/index.ts`
- **Guide détaillé** : `INSTRUCTIONS_REDEPLOIEMENT_MONEROO.md`
- **Résolution erreur** : `RESOLUTION_ERREUR_MONEROO.md`

## 🚀 Action Immédiate Requise

**Redéployer l'Edge Function `moneroo` maintenant** pour résoudre l'erreur "The route v1/checkout/initialize could not be found".






