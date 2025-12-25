# 🚨 ACTION IMMÉDIATE REQUISE - Déploiement Edge Function Moneroo

## ❌ ERREUR ACTUELLE

```
POST https://your-project-id.supabase.co/functions/v1/moneroo 404 (Not Found)
```

**L'Edge Function `moneroo` n'est pas déployée dans Supabase.**

---

## ✅ SOLUTION EN 5 ÉTAPES

### Étape 1 : Ouvrir Supabase Dashboard

🔗 **Allez sur :** [https://app.supabase.com/project/your-project-id/functions](https://app.supabase.com/project/your-project-id/functions)

### Étape 2 : Créer/Modifier la Fonction

1. **Si `moneroo` n'existe pas :** Cliquez sur **"New Function"** → Nommez `moneroo` → **"Create"**
2. **Si `moneroo` existe :** Cliquez sur `moneroo` → Onglet **"Code"**

### Étape 3 : Copier le Code

📁 **Ouvrez le fichier :** `CODE_MONEROO_POUR_SUPABASE.txt`

📋 **Copiez TOUT le contenu** (Ctrl+A, Ctrl+C)

### Étape 4 : Coller dans Supabase

1. **Dans l'éditeur Supabase**, sélectionnez tout (Ctrl+A)
2. **Supprimez** (Suppr)
3. **Collez le code** (Ctrl+V)
4. **Cliquez sur "Deploy"** ou **"Deploy updates"**

### Étape 5 : Vérifier les Secrets

1. **Onglet "Secrets"**
2. **Vérifiez** que `MONEROO_API_KEY` existe
3. **Si non**, ajoutez-le avec votre clé API Moneroo

---

## 🧪 TESTER

1. **Retournez sur** `http://localhost:8080/marketplace`
2. **Essayez d'acheter un produit**
3. **Vérifiez la console** : Plus d'erreur 404 ✅
4. **Vérifiez les logs Supabase** : Les requêtes apparaissent ✅

---

## 📋 VÉRIFICATIONS

- [ ] Fonction `moneroo` créée/déployée
- [ ] Code collé dans Supabase
- [ ] Bouton "Deploy" cliqué
- [ ] Secret `MONEROO_API_KEY` configuré
- [ ] Logs montrent `booted (time: Xms)`
- [ ] Plus d'erreur 404 dans la console

---

## 🆘 SI ÇA NE FONCTIONNE PAS

1. **Vérifiez le nom** : Doit être exactement `moneroo` (minuscules)
2. **Vérifiez les logs** : Edge Functions → moneroo → Logs
3. **Videz le cache** : Ctrl+Shift+R
4. **Vérifiez les secrets** : Edge Functions → Secrets

---

## 📁 FICHIERS DE RÉFÉRENCE

- **Code à copier :** `CODE_MONEROO_POUR_SUPABASE.txt`
- **Guide détaillé :** `GUIDE_DEPLOIEMENT_VISUEL_MONEROO.md`
- **Résumé :** `RESUME_CORRECTIONS_URGENTES.md`

---

**⏱️ TEMPS ESTIMÉ : 2-3 minutes**

Une fois déployé, l'erreur 404 sera résolue et les paiements fonctionneront ! 🎉




