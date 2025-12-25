# 🔑 Guide Complet - Création Token GitHub

**Lien** : https://github.com/settings/tokens/new

---

## 📋 ÉTAPES DÉTAILLÉES

### ✅ Étape 1 : Note (Nom du Token)

**Dans le champ "Note"** :
- Tapez : `Payhula Issues Creator`
- Ou : `Payhula - Création Issues Automatique`
- **But** : Identifier facilement ce token plus tard

---

### ✅ Étape 2 : Expiration

**Dans le dropdown "Expiration"** :
- Choisissez : **`30 days`** (recommandé pour la sécurité)
- Ou : **`90 days`** si vous préférez
- Ou : **`No expiration`** (moins sécurisé mais pratique)

**Recommandation** : `30 days` est un bon compromis

---

### ✅ Étape 3 : Sélectionner les Permissions (IMPORTANT)

**Dans la section "Select scopes"** :

#### 🔴 PERMISSION OBLIGATOIRE

**Cochez la case principale** : ✅ **`repo`**

Cette case cochera automatiquement toutes les sous-permissions :
- ✅ `repo:status` (Access commit status)
- ✅ `repo_deployment` (Access deployment status)
- ✅ `public_repo` (Access public repositories)
- ✅ `repo:invite` (Access repository invitations)
- ✅ `security_events` (Read and write security events)

**⚠️ IMPORTANT** : C'est la **SEULE** permission nécessaire pour créer des issues !

#### ❌ NE PAS COCHER

- ❌ `workflow` (pas nécessaire)
- ❌ `admin:org` (pas nécessaire)
- ❌ `gist` (pas nécessaire)
- ❌ `delete_repo` (DANGEREUX - ne pas cocher)
- ❌ Toutes les autres permissions (pas nécessaires)

---

### ✅ Étape 4 : Générer le Token

1. **Cliquez sur le bouton vert** : **"Generate token"** (en bas de la page)
2. **Vous devrez peut-être entrer votre mot de passe GitHub** (si demandé)
3. **⚠️ ATTENTION** : Le token sera affiché **UNE SEULE FOIS** !

---

### ✅ Étape 5 : Copier le Token

**Le token ressemble à** :
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Actions** :
1. **Cliquez sur l'icône de copie** (à droite du token) pour copier automatiquement
2. **OU** sélectionnez tout le token et copiez-le (Ctrl+C)
3. **⚠️ SAUVEGARDEZ-LE** dans un endroit sûr temporairement

---

## 🚀 ÉTAPE 6 : Utiliser le Token

**Une fois le token copié**, revenez ici et dites-moi le token, ou exécutez :

```powershell
$env:GH_TOKEN="collez_votre_token_ici"
npm run issues:create:api
```

---

## 📸 RÉCAPITULATIF VISUEL

```
┌─────────────────────────────────────────┐
│ Note: Payhula Issues Creator            │ ← Étape 1
├─────────────────────────────────────────┤
│ Expiration: [30 days ▼]                 │ ← Étape 2
├─────────────────────────────────────────┤
│ Select scopes:                           │
│                                          │
│ ☑ repo (Full control of repositories)   │ ← Étape 3 (COCHER)
│   ☑ repo:status                          │
│   ☑ repo_deployment                      │
│   ☑ public_repo                          │
│   ☑ repo:invite                          │
│   ☑ security_events                      │
│                                          │
│ ☐ workflow                               │
│ ☐ admin:org                              │
│ ☐ ... (ne pas cocher)                    │
├─────────────────────────────────────────┤
│ [Generate token]  [Cancel]              │ ← Étape 4
└─────────────────────────────────────────┘
```

---

## ⚠️ SÉCURITÉ

1. **Ne partagez JAMAIS le token** publiquement
2. **Ne commitez JAMAIS le token** dans Git
3. **Le token est comme un mot de passe** - gardez-le secret
4. **Révocation** : Si compromis, révoquez-le sur https://github.com/settings/tokens

---

## ✅ CHECKLIST

Avant de générer, vérifiez :

- [ ] Note remplie : `Payhula Issues Creator`
- [ ] Expiration choisie : `30 days` (ou autre)
- [ ] **SEULEMENT** `repo` est coché (pas les autres)
- [ ] Vous êtes prêt à copier le token immédiatement

---

## 🆘 PROBLÈMES COURANTS

### "Je ne vois pas la section 'Select scopes'"
- Scroll vers le bas de la page
- Elle est après "Expiration"

### "Le token ne fonctionne pas"
- Vérifiez que vous avez bien coché `repo`
- Vérifiez que vous avez copié tout le token (commence par `ghp_`)
- Vérifiez que le token n'a pas expiré

### "Je ne vois pas le token après génération"
- Le token s'affiche une seule fois après "Generate token"
- Si vous avez fermé la page, vous devrez créer un nouveau token

---

**Une fois le token créé, dites-moi "token créé" et je créerai les issues pour vous ! 🚀**

