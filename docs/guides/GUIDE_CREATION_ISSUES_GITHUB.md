# 📋 GUIDE - Création Automatique des Issues GitHub

**Date** : 27 Janvier 2025

---

## 🎯 Objectif

Créer automatiquement les 13 issues GitHub identifiées dans l'audit complet à partir des TODOs du code.

---

## 📦 Prérequis

### Option 1 : GitHub CLI (Recommandé - Automatique)

**Installation** :

1. **Windows** :
   ```powershell
   # Via winget
   winget install --id GitHub.cli
   
   # Ou télécharger depuis: https://cli.github.com/
   ```

2. **Linux/Mac** :
   ```bash
   # Ubuntu/Debian
   sudo apt install gh
   
   # macOS
   brew install gh
   ```

**Authentification** :
```bash
gh auth login
# Suivre les instructions pour se connecter
```

**Vérification** :
```bash
gh auth status
```

### Option 2 : Création Manuelle (Alternative)

Si GitHub CLI n'est pas disponible, créer les issues manuellement depuis `GITHUB_ISSUES_TODOS.md`.

---

## 🚀 Utilisation

### Méthode 1 : Script Automatique (Recommandé)

**Windows (PowerShell)** :
```powershell
npm run issues:create
```

**Linux/Mac (Bash)** :
```bash
npm run issues:create:bash
```

**Ou directement** :
```powershell
# Windows
.\scripts\create-github-issues.ps1

# Linux/Mac
bash scripts/create-github-issues.sh
```

### Méthode 2 : Création Manuelle

1. Aller sur https://github.com/payhuk02/payhula/issues/new
2. Utiliser le template dans `GITHUB_ISSUES_TODOS.md`
3. Copier-coller chaque issue une par une

---

## 📝 Issues à Créer

### 🔴 Priorité Critique (P0) - 2 issues

1. **API FedEx** - Implémenter les appels API réels
2. **API DHL** - Implémenter les appels API réels

### 🟡 Priorité Haute (P1) - 7 issues

3. **Dashboard Analytics Services** - Implémenter fetching réel
4. **Commandes Multi-Stores** - Gérer plusieurs stores
5. **Paiement et Inscription Cours** - Flux complet
6. **Upload Photos Retours** - Fonctionnalité d'upload
7. **Notifications Email Versions** - Notifier les utilisateurs
8. **Réservation ServiceDetail** - Logique de réservation
9. **Upload Supabase Storage Retours** - Stockage des images

### 🟢 Priorité Moyenne (P2) - 4 issues

10. **Navigation Cohorts** - Navigation vers pages cohort
11. **Mark Cart Recovered** - Marquer panier récupéré
12. **Vérification Disponibilité Staff** - Vérifier conflits
13. **Panier PhysicalProductDetail** - Ajout au panier

---

## 🏷️ Labels à Créer (si nécessaire)

Le script assigne automatiquement ces labels. Si certains n'existent pas, créez-les d'abord :

```bash
gh label create "high-priority" --description "Priorité haute" --color "d73a4a"
gh label create "medium-priority" --description "Priorité moyenne" --color "fbca04"
gh label create "low-priority" --description "Priorité basse" --color "0e8a16"
gh label create "shipping" --description "Fonctionnalités shipping" --color "0052cc"
gh label create "api" --description "Intégration API" --color "1d76db"
gh label create "analytics" --description "Analytics et reporting" --color "7057ff"
gh label create "enhancement" --description "Amélioration" --color "a2eeef"
gh label create "feature" --description "Nouvelle fonctionnalité" --color "0e8a16"
```

---

## 📊 Milestone (Optionnel)

Créer un milestone pour regrouper les issues :

```bash
gh milestone create "TODOs Q1 2025" \
  --description "Issues TODO identifiées dans l'audit complet du 27 Janvier 2025" \
  --due-date "2025-03-31"
```

Puis assigner les issues au milestone :

```bash
# Pour chaque issue créée
gh issue edit <NUMERO> --milestone "TODOs Q1 2025"
```

---

## ✅ Vérification

Après création, vérifier les issues :

```bash
# Lister toutes les issues
gh issue list

# Voir une issue spécifique
gh issue view <NUMERO>

# Voir les issues par label
gh issue list --label "high-priority"
```

---

## 🔧 Dépannage

### Erreur : "GitHub CLI n'est pas installé"

**Solution** : Installer GitHub CLI (voir prérequis ci-dessus)

### Erreur : "Vous n'êtes pas authentifié"

**Solution** :
```bash
gh auth login
# Suivre les instructions
```

### Erreur : "Label n'existe pas"

**Solution** : Créer les labels manquants (voir section Labels)

### Erreur : "Permission denied"

**Solution** : Vérifier que vous avez les droits d'écriture sur le repo

---

## 📚 Documentation

- **Scripts** : `scripts/create-github-issues.ps1` (Windows) ou `scripts/create-github-issues.sh` (Linux/Mac)
- **Issues formatées** : `GITHUB_ISSUES_TODOS.md`
- **GitHub CLI docs** : https://cli.github.com/manual/

---

## 🎉 Résultat Attendu

Après exécution du script, vous devriez avoir :

- ✅ **13 issues créées** sur GitHub
- ✅ **Labels assignés** automatiquement
- ✅ **Priorités définies** (P0/P1/P2)
- ✅ **Descriptions complètes** avec tâches et critères

---

**Bon courage pour l'implémentation ! 🚀**

