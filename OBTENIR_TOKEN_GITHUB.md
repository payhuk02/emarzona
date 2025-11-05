# 🔑 Obtenir un Token GitHub pour Créer les Issues

Pour créer automatiquement les issues GitHub, vous avez besoin d'un **Personal Access Token**.

---

## 📋 Étapes pour Obtenir le Token

### 1. Accéder aux Settings GitHub

1. Allez sur : https://github.com/settings/tokens
2. Ou : **Profil GitHub** → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**

### 2. Créer un Nouveau Token

1. Cliquez sur **"Generate new token"** → **"Generate new token (classic)"**
2. Vous devrez peut-être entrer votre mot de passe GitHub

### 3. Configurer le Token

- **Note** : `Payhula Issues Creator` (ou un nom de votre choix)
- **Expiration** : Choisissez selon vos préférences (30 jours, 90 jours, ou pas d'expiration)
- **Permissions** : Cochez **`repo`** (toutes les permissions du repo)
  - ✅ **repo** (Full control of private repositories)
    - ✅ repo:status
    - ✅ repo_deployment
    - ✅ public_repo
    - ✅ repo:invite
    - ✅ security_events

### 4. Générer et Copier le Token

1. Cliquez sur **"Generate token"** en bas de la page
2. **⚠️ IMPORTANT** : Copiez le token immédiatement ! Il ne sera affiché qu'une seule fois.
3. Si vous perdez le token, vous devrez en créer un nouveau.

---

## 🚀 Utilisation du Token

### Méthode 1 : Variable d'environnement (Recommandé)

**PowerShell** :
```powershell
$env:GH_TOKEN="votre_token_ici"
.\scripts\create-github-issues-api.ps1
```

**Ou en une ligne** :
```powershell
$env:GH_TOKEN="ghp_votre_token"; .\scripts\create-github-issues-api.ps1
```

### Méthode 2 : Passer le token en paramètre

```powershell
.\scripts\create-github-issues-api.ps1 -Token "votre_token_ici"
```

---

## ⚠️ SÉCURITÉ

1. **Ne commitez JAMAIS le token** dans Git
2. **Ne partagez PAS le token** publiquement
3. **Le token est comme un mot de passe** - gardez-le secret
4. **Révocation** : Si vous pensez que le token a été compromis, révoquez-le immédiatement sur https://github.com/settings/tokens

---

## ✅ Vérification

Après avoir créé les issues, vérifiez sur :
https://github.com/payhuk02/payhula/issues

Vous devriez voir les 13 issues créées !

---

## 🔄 Si le Token Expire

Si votre token expire, créez-en un nouveau et réutilisez la même commande.

---

**Note** : Le token vous donne accès complet au repository. Utilisez-le avec précaution !

