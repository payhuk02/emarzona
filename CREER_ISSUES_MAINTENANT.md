# 🎯 CRÉER LES ISSUES MAINTENANT - Guide Ultra Simple

**Dépôt** : https://github.com/payhuk02/payhula.git

---

## ⚡ ÉTAPES RAPIDES (3 minutes)

### 1️⃣ Créer le Token GitHub

Le navigateur devrait être ouvert sur : https://github.com/settings/tokens/new

**Si ce n'est pas le cas**, ouvrez manuellement :
https://github.com/settings/tokens/new

**Actions** :
1. **Note** : Tapez `Payhula Issues Creator`
2. **Expiration** : Choisissez `30 days` (ou `No expiration`)
3. **Permissions** : Cochez **`repo`** (toutes les cases)
4. Cliquez **"Generate token"** en bas
5. **⚠️ COPIEZ LE TOKEN** (il commence par `ghp_...`)

### 2️⃣ Créer les Issues

**Dans votre terminal PowerShell**, collez cette commande (remplacez `VOTRE_TOKEN` par le token copié) :

```powershell
$env:GH_TOKEN="VOTRE_TOKEN"; npm run issues:create:api
```

**Exemple** :
```powershell
$env:GH_TOKEN="ghp_abc123xyz456"; npm run issues:create:api
```

### 3️⃣ Vérifier

Allez sur : https://github.com/payhuk02/payhula/issues

Vous devriez voir **13 issues** créées ! ✅

---

## 🆘 Si ça ne marche pas

### Erreur : "Token invalide"
- Vérifiez que vous avez bien copié tout le token
- Le token doit commencer par `ghp_`
- Vérifiez que vous avez coché les permissions `repo`

### Erreur : "Permission denied"
- Vérifiez que vous êtes bien connecté à GitHub
- Vérifiez que vous avez les droits d'écriture sur le repo `payhuk02/payhula`

### Erreur : "Repository not found"
- Vérifiez que le repo existe bien : https://github.com/payhuk02/payhula

---

## 📞 Besoin d'aide ?

Si vous avez des problèmes, dites-moi et je vous aiderai !

---

**Une fois le token créé, dites-moi et je lancerai la création des issues pour vous ! 🚀**

