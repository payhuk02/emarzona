# 🚀 Création des Issues GitHub - Guide Étape par Étape

**Dépôt** : https://github.com/payhuk02/payhula.git

---

## 📋 OPTION 1 : Via Token GitHub (Plus Simple)

### Étape 1 : Obtenir un Token

1. **Un navigateur devrait s'ouvrir automatiquement** vers https://github.com/settings/tokens/new
2. Si non, allez-y manuellement

### Étape 2 : Créer le Token

1. **Note** : `Payhula Issues Creator`
2. **Expiration** : 30 jours (ou selon votre préférence)
3. **Permissions** : Cochez uniquement **`repo`** (toutes les cases sous repo)
4. Cliquez sur **"Generate token"** en bas
5. **⚠️ COPIEZ LE TOKEN** (il commence par `ghp_...`)

### Étape 3 : Créer les Issues

Dans votre terminal PowerShell, exécutez :

```powershell
$env:GH_TOKEN="collez_votre_token_ici"
npm run issues:create:api
```

**Ou directement** :
```powershell
$env:GH_TOKEN="votre_token"; .\scripts\create-github-issues-api.ps1
```

---

## 📋 OPTION 2 : Via GitHub CLI (Alternative)

### Étape 1 : Authentification Interactive

```powershell
gh auth login
```

**Suivez les instructions** :
1. Choisir "GitHub.com"
2. Choisir "HTTPS"
3. Choisir "Login with a web browser"
4. Autoriser dans le navigateur

### Étape 2 : Créer les Issues

```powershell
npm run issues:create
```

---

## ✅ Vérification

Après création, vérifiez sur :
https://github.com/payhuk02/payhula/issues

Vous devriez voir **13 issues** créées avec :
- ✅ Titres descriptifs
- ✅ Descriptions complètes
- ✅ Tâches checklist
- ✅ Critères d'acceptation
- ✅ Labels assignés

---

## 🎯 Issues qui seront créées

### 🔴 P0 - Critique (2 issues)
1. API FedEx - Implémenter appels réels
2. API DHL - Implémenter appels réels

### 🟡 P1 - Haute (7 issues)
3. Dashboard Analytics Services
4. Commandes Multi-Stores
5. Paiement et Inscription Cours
6. Upload Photos Retours
7. Notifications Email Versions
8. Réservation ServiceDetail
9. Upload Supabase Storage Retours

### 🟢 P2 - Moyenne (4 issues)
10. Navigation Cohorts
11. Mark Cart Recovered
12. Vérification Disponibilité Staff
13. Panier PhysicalProductDetail

---

**Bon courage ! 🚀**

