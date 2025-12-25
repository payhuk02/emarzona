# 🔐 Authentification GitHub CLI

GitHub CLI est installé avec succès ! 

**Version installée** : 2.81.0

---

## 🚀 Étape suivante : Authentification

Pour créer les issues GitHub, vous devez vous authentifier.

### Option 1 : Authentification Interactive (Recommandé)

Exécutez dans votre terminal PowerShell :

```powershell
gh auth login
```

**Suivez les instructions** :
1. Choisir **GitHub.com**
2. Choisir votre méthode préférée :
   - **HTTPS** (recommandé)
   - **SSH**
3. Choisir votre méthode d'authentification :
   - **Login with a web browser** (le plus simple)
   - **Paste an authentication token**
4. Si vous choisissez le navigateur :
   - Une URL sera affichée
   - Ouvrez-la dans votre navigateur
   - Autorisez GitHub CLI
   - Revenez au terminal

### Option 2 : Authentification avec Token

Si vous avez déjà un token GitHub :

```powershell
gh auth login --with-token < token.txt
```

---

## ✅ Vérification

Après authentification, vérifiez :

```powershell
gh auth status
```

Vous devriez voir :
```
✓ Logged in to github.com as <votre-username>
```

---

## 🎯 Créer les Issues

Une fois authentifié, exécutez :

```powershell
npm run issues:create
```

Ou directement :

```powershell
.\scripts\create-github-issues.ps1
```

---

## 📝 Notes

- L'authentification est sécurisée et stockée localement
- Vous pouvez vous déconnecter avec `gh auth logout`
- Pour changer de compte, utilisez `gh auth login` à nouveau

