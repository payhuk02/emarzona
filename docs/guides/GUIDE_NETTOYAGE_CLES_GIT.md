# 🧹 GUIDE NETTOYAGE CLÉS SUPABASE - HISTORIQUE GIT

**Objectif** : Retirer les fichiers `.env` de tout l'historique Git **sans changer les clés**

**Durée** : 10-15 minutes

---

## ⚠️ AVERTISSEMENTS IMPORTANTS

### 🔴 Ce Que Ce Script Fait

```
✅ Supprime .env de TOUT l'historique Git
✅ Crée un backup automatique avant
✅ Nettoie GitHub après force push
✅ Préserve tout le reste du code
```

### 🟡 Ce Que Vous Devez Savoir

```
⚠️  Réécrit l'historique Git (tous les commits modifiés)
⚠️  Nécessite un force push
⚠️  Tous les collaborateurs devront re-cloner le repo
⚠️  Les clés peuvent avoir été copiées avant (risque résiduel)
```

### ✅ Sécurité

```
✅ Backup automatique créé
✅ Possibilité d'annuler à tout moment
✅ Confirmation requise avant exécution
✅ Restauration facile si problème
```

---

## 🚀 MÉTHODE AUTOMATIQUE (RECOMMANDÉE)

### Étape 1 : Exécuter le Script

```powershell
# Dans PowerShell (en tant qu'administrateur)
cd C:\Users\SAWADOGO\Desktop\payhula

# Exécuter le script
.\clean-git-history.ps1
```

### Étape 2 : Suivre les Instructions

Le script va :
1. ✅ Vérifier que le repo est propre
2. ✅ Créer un backup automatique
3. ✅ Installer git-filter-repo (si besoin)
4. ✅ Chercher tous les fichiers .env
5. ⚠️  Demander confirmation
6. 🧹 Nettoyer l'historique
7. 🔧 Restaurer le remote
8. 📊 Afficher le résumé

### Étape 3 : Force Push

Le script propose de faire le push automatiquement, ou vous pouvez le faire manuellement :

```bash
git push origin main --force
```

---

## 🔧 MÉTHODE MANUELLE (SI SCRIPT ÉCHOUE)

### Option A : Avec git-filter-repo

```bash
# 1. Installer git-filter-repo
pip install git-filter-repo

# 2. Créer un backup
cp -r . ../payhula_backup

# 3. Nettoyer l'historique
git filter-repo --invert-paths --path .env --force

# 4. Restaurer le remote
git remote add origin https://github.com/payhuk02/payhula.git

# 5. Force push
git push origin main --force
```

### Option B : Avec BFG Repo-Cleaner

```bash
# 1. Télécharger BFG
# https://rtyley.github.io/bfg-repo-cleaner/

# 2. Créer un backup
cp -r . ../payhula_backup

# 3. Cloner en miroir
cd ..
git clone --mirror https://github.com/payhuk02/payhula.git payhula-mirror
cd payhula-mirror

# 4. Nettoyer avec BFG
java -jar bfg.jar --delete-files .env

# 5. Nettoyer les refs
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 6. Force push
git push --force

# 7. Retourner au repo normal
cd ../payhula
git pull --force
```

---

## ✅ VÉRIFICATIONS POST-NETTOYAGE

### 1. Vérifier que .env n'est plus dans l'historique

```bash
# Cette commande ne doit RIEN retourner
git log --all --full-history -- .env
```

**Résultat attendu** : Aucune sortie (vide)

### 2. Vérifier l'historique

```bash
# Voir l'historique des commits
git log --all --oneline --graph
```

**Résultat attendu** : Tous vos commits, mais modifiés (nouveaux hashes)

### 3. Chercher "SUPABASE" dans l'historique

```bash
# Chercher si les clés apparaissent encore
git log --all -S "VITE_SUPABASE" --oneline
```

**Résultat attendu** : Aucune occurrence

### 4. Vérifier GitHub

1. Allez sur https://github.com/payhuk02/payhula
2. Cliquez sur **"X commits"**
3. Cherchez un ancien commit
4. Vérifiez qu'il n'y a plus de fichier `.env`

---

## 👥 AVERTIR LES COLLABORATEURS

Après le force push, **TOUS les collaborateurs** doivent :

### 1. Sauvegarder leurs changements

```bash
# Sauvegarder les changements locaux
git stash

# Ou commit
git add .
git commit -m "WIP: sauvegarde avant re-clone"
```

### 2. Supprimer le dossier local

```bash
cd ..
rm -rf payhula  # OU supprimer manuellement
```

### 3. Re-cloner le repo

```bash
git clone https://github.com/payhuk02/payhula.git
cd payhula
```

### 4. Restaurer leurs changements

```bash
# Si stash
git stash pop

# Si commit, cherry-pick les commits
```

---

## 🆘 EN CAS DE PROBLÈME

### Restaurer depuis le Backup

Le script crée automatiquement un backup dans `../payhula_backup_TIMESTAMP/`

```bash
# 1. Supprimer le repo actuel
cd ..
rm -rf payhula

# 2. Copier le backup
cp -r payhula_backup_TIMESTAMP payhula
cd payhula

# 3. Vérifier
git status
git log
```

### Erreur "git-filter-repo not found"

**Solution 1 : Installer Python**
1. Télécharger Python : https://www.python.org/downloads/
2. Cocher "Add Python to PATH" lors de l'installation
3. Redémarrer PowerShell
4. `pip install git-filter-repo`

**Solution 2 : Utiliser BFG** (voir Méthode Manuelle Option B)

### Erreur "force push rejected"

```bash
# Vérifier que vous êtes bien sur main
git branch

# Vérifier le remote
git remote -v

# Re-essayer avec --force
git push origin main --force
```

---

## 📊 COMPARAISON : AVANT vs APRÈS

### AVANT (Clés dans l'historique)

```
❌ .env visible dans l'historique Git
❌ Clés Supabase accessibles publiquement
❌ Risque de sécurité élevé
⚠️  GitHub peut détecter et bloquer le repo
```

### APRÈS (Historique nettoyé)

```
✅ .env supprimé de tout l'historique
✅ Aucune trace des clés dans Git
✅ Repo propre et sécurisé
✅ GitHub ne détecte plus de secrets
```

### MAIS (Risque résiduel)

```
⚠️  Quelqu'un peut avoir copié les clés avant
⚠️  Les clés sont toujours fonctionnelles
⚠️  Recommandation : Surveiller les logs Supabase
```

---

## 🔒 SURVEILLANCE POST-NETTOYAGE

### 1. Vérifier les Logs Supabase (Quotidien - 7 jours)

```
https://app.supabase.com/project/YOUR_PROJECT/logs/explorer
```

**Chercher** :
- Connexions depuis IPs inconnues
- Requêtes inhabituelles
- Pics d'activité suspects

### 2. Activer les Alertes Supabase

```
Settings → API → Enable Alerts
- Requêtes anormales
- Erreurs d'authentification
- Utilisation excessive
```

### 3. Limiter l'Accès (Optionnel)

Si vous détectez une activité suspecte :

```sql
-- Créer une whitelist d'IPs (optionnel)
-- Nécessite Supabase Pro
```

---

## 📝 CHECKLIST COMPLÈTE

### Avant le Nettoyage

- [ ] Sauvegarder le repo (le script le fait automatiquement)
- [ ] Commit tous les changements en cours
- [ ] Vérifier qu'aucun collaborateur ne travaille actuellement
- [ ] Préparer un message pour avertir l'équipe

### Pendant le Nettoyage

- [ ] Exécuter le script `clean-git-history.ps1`
- [ ] Confirmer l'opération
- [ ] Vérifier que le nettoyage réussit
- [ ] Restaurer le remote origin

### Après le Nettoyage

- [ ] Vérifier que .env n'est plus dans l'historique
- [ ] Force push vers GitHub
- [ ] Vérifier sur GitHub que .env a disparu
- [ ] Avertir tous les collaborateurs
- [ ] Surveiller les logs Supabase pendant 7 jours
- [ ] Supprimer le backup après confirmation (optionnel)

---

## 🎯 RECOMMANDATIONS FINALES

### Pour la Sécurité

```
1. Surveiller logs Supabase pendant 7 jours
2. Si activité suspecte → Régénérer les clés
3. Activer 2FA sur compte Supabase
4. Configurer Row Level Security (RLS)
```

### Pour l'Équipe

```
1. Documenter .env.example
2. Ne JAMAIS commit .env
3. Vérifier .gitignore
4. Former l'équipe aux bonnes pratiques
```

### Pour le Futur

```
1. Utiliser des secrets managers (GitHub Secrets, Vercel Env)
2. Audit régulier du repo (git log --all -S "SECRET")
3. Pre-commit hooks pour détecter secrets
4. Code review systématique
```

---

## 📞 BESOIN D'AIDE ?

### Si le Script Échoue

1. Lire les messages d'erreur
2. Vérifier les prérequis (Python, Git)
3. Essayer la méthode manuelle
4. Restaurer depuis le backup si nécessaire

### Si Force Push Échoué

1. Vérifier les permissions GitHub
2. Vérifier que vous êtes sur la bonne branche
3. Re-essayer avec `--force-with-lease`

### Si Problème Après Nettoyage

1. Vérifier l'intégrité du repo : `git fsck`
2. Vérifier les remotes : `git remote -v`
3. Restaurer depuis le backup si critique

---

## ✅ RÉSUMÉ : 3 ÉTAPES SIMPLES

```
1️⃣  EXÉCUTER
   .\clean-git-history.ps1

2️⃣  CONFIRMER
   Taper "OUI" quand demandé

3️⃣  PUSH
   git push origin main --force
```

**Durée totale** : 10 minutes  
**Difficulté** : Facile (script automatisé)  
**Risque** : Faible (backup automatique)

---

**Prêt ? Lancez le script !** 🚀

```powershell
.\clean-git-history.ps1
```

---

*Guide créé le 30 Octobre 2025 - Nettoyage Sécurisé Historique Git*

