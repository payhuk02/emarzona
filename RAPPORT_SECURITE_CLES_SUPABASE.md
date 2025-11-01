# 🔴 RAPPORT DE SÉCURITÉ CRITIQUE - CLÉS SUPABASE

**Date de l'audit** : Janvier 2025  
**Statut** : 🔴 **ACTION URGENTE REQUISE**

---

## ⚠️ PROBLÈME DÉTECTÉ

Le fichier `.env` contenant les **clés Supabase** a été **commité dans l'historique Git** et est toujours accessible publiquement.

---

## 📊 ANALYSE DE L'HISTORIQUE GIT

### Commits trouvés :

1. **Commit initial** (`d96b5c5` - 18 octobre 2025)
   - ✅ Fichier `.env` **commité** avec clés exposées
   - ❌ Clés Supabase **visibles** dans l'historique

2. **Commit de retrait** (`e5be819` - 23 octobre 2025)
   - ✅ Fichier `.env` retiré du tracking
   - ✅ `.gitignore` mis à jour
   - ✅ `.env.example` créé
   - ⚠️ **MAIS** : Le contenu reste dans l'historique Git

### Clés exposées dans l'historique :

```env
VITE_SUPABASE_PROJECT_ID="hbdnzajbyjakdhuavrvb"
VITE_SUPABASE_URL="https://hbdnzajbyjakdhuavrvb.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM"
```

**⚠️ Ces clés sont toujours accessibles via :**
```bash
git show d96b5c5:.env
```

---

## 🔴 IMPACT DE SÉCURITÉ

### Risques critiques :

1. **🔴 Accès non autorisé à la base de données**
   - N'importe qui avec accès au repo peut voir les clés
   - Accès complet à toutes les données utilisateurs
   - Manipulation possible des données

2. **🔴 Vol de données**
   - Emails, mots de passe, informations personnelles
   - Commandes, paiements, transactions
   - Données de produits, stores, etc.

3. **💰 Coûts incontrôlés**
   - Utilisation abusive de l'API Supabase
   - Coûts potentiellement élevés

4. **🔴 Compliance**
   - Violation RGPD possible
   - Problèmes légaux si données volées

---

## ✅ ACTIONS URGENTES REQUISES

### 🔴 PRIORITÉ 1 : Régénérer les clés Supabase (IMMÉDIAT)

1. **Accéder au dashboard Supabase**
   - https://app.supabase.com/project/hbdnzajbyjakdhuavrvb/settings/api

2. **Régénérer la clé publique (anon key)**
   - Cliquer sur "Reset anon/public key"
   - Confirmer l'action
   - **Copier la nouvelle clé**

3. **Mettre à jour les variables d'environnement**
   - `.env` local
   - Vercel (variables d'environnement)
   - Tout autre service utilisant ces clés

4. **Redéployer l'application**
   ```bash
   vercel --prod
   ```

**⏱️ Temps estimé : 15 minutes**

---

### 🔴 PRIORITÉ 2 : Vérifier activité suspecte (IMMÉDIAT)

1. **Vérifier les logs Supabase**
   - https://app.supabase.com/project/hbdnzajbyjakdhuavrvb/logs/explorer
   - Filtrer : 7 derniers jours
   - Rechercher : IPs suspectes, tentatives de login en masse

2. **Vérifier les utilisateurs créés récemment**
   ```sql
   SELECT id, email, created_at 
   FROM auth.users 
   WHERE created_at > NOW() - INTERVAL '7 days'
   ORDER BY created_at DESC;
   ```

3. **Vérifier les requêtes inhabituelles**
   - Requêtes en masse
   - Requêtes depuis IPs étrangères
   - Patterns suspects

**⏱️ Temps estimé : 30 minutes**

---

### 🔴 PRIORITÉ 3 : Nettoyer l'historique Git (URGENT)

Le fichier `.env` doit être **complètement supprimé** de l'historique Git.

#### Option A : Utiliser le script PowerShell (Recommandé)

Un script de nettoyage existe déjà : `clean-git-history.ps1`

```powershell
.\clean-git-history.ps1
```

**Le script va :**
1. Créer un backup de sécurité
2. Installer `git-filter-repo` si nécessaire
3. Supprimer `.env` de tout l'historique
4. Restaurer le remote origin
5. Proposer de faire le force push

**⚠️ ATTENTION** : Cette opération réécrit l'historique Git et nécessite un **force push**.

#### Option B : Utiliser BFG Repo-Cleaner (Alternative)

```bash
# 1. Télécharger BFG depuis https://rtyley.github.io/bfg-repo-cleaner/
# 2. Cloner le repo en mirror
git clone --mirror https://github.com/payhuk02/payhula.git payhula.git

# 3. Supprimer .env de l'historique
java -jar bfg.jar --delete-files .env payhula.git

# 4. Nettoyer et reflog
cd payhula.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force push
git push --force
```

**⏱️ Temps estimé : 30 minutes**

---

### 🟡 PRIORITÉ 4 : Activer 2FA Supabase (Important)

1. Accéder à : https://app.supabase.com/account/security
2. Activer **Two-Factor Authentication**
3. Scanner le QR code avec Google Authenticator
4. Tester le code

**⏱️ Temps estimé : 5 minutes**

---

## 📋 CHECKLIST D'ACTIONS

### Immédiat (Aujourd'hui)

- [ ] 🔴 **1. Régénérer les clés Supabase**
- [ ] 🔴 **2. Mettre à jour `.env` local**
- [ ] 🔴 **3. Mettre à jour variables Vercel**
- [ ] 🔴 **4. Redéployer l'application**
- [ ] 🔴 **5. Vérifier logs Supabase**
- [ ] 🔴 **6. Vérifier utilisateurs suspects**

### Cette semaine

- [ ] 🔴 **7. Exécuter le script de nettoyage Git**
- [ ] 🔴 **8. Force push vers GitHub**
- [ ] 🟡 **9. Activer 2FA Supabase**
- [ ] 🟡 **10. Vérifier que le nettoyage a fonctionné**

### Suivi

- [ ] 🟡 **11. Surveiller les logs Supabase pendant 1 mois**
- [ ] 🟡 **12. Informer les collaborateurs du nettoyage Git**

---

## 🛡️ PRÉVENTION FUTURE

### Déjà en place ✅

1. ✅ `.env` dans `.gitignore`
2. ✅ `.env.example` créé
3. ✅ Script de nettoyage disponible

### À ajouter ⚠️

1. **GitHub Secret Scanning** (si disponible)
   - Détecte automatiquement les clés commitées
   - Alerte immédiate si détecté

2. **Pre-commit hooks**
   - Bloquer les commits avec `.env`
   - Scanner les fichiers avant commit

3. **CI/CD checks**
   - Vérifier l'absence de `.env` dans les commits
   - Bloquer les builds avec clés exposées

---

## 📊 STATUT ACTUEL

| Action | Statut | Priorité |
|--------|--------|----------|
| Clés exposées dans Git | 🔴 **OUI** | CRITIQUE |
| Clés retirées du tracking | ✅ **OUI** (23 oct) | - |
| Historique Git nettoyé | ❌ **NON** | CRITIQUE |
| Clés régénérées | ❌ **NON** | CRITIQUE |
| 2FA activé | ❌ **INCONNU** | IMPORTANT |

---

## 🚨 ORDRE D'EXÉCUTION RECOMMANDÉ

1. **MAINTENANT** : Régénérer les clés Supabase
2. **MAINTENANT** : Mettre à jour les variables d'environnement
3. **AUJOURD'HUI** : Vérifier les logs Supabase
4. **CETTE SEMAINE** : Nettoyer l'historique Git
5. **CETTE SEMAINE** : Activer 2FA Supabase

---

## 📞 SUPPORT

Si vous avez besoin d'aide pour :
- Exécuter le script de nettoyage
- Régénérer les clés
- Vérifier les logs
- Configurer la sécurité

**Documentation disponible :**
- Script de nettoyage : `clean-git-history.ps1`
- Template variables : `ENV_TEMPLATE.md`
- Guide sécurité : `SECURITY.md`

---

**⚠️ NE PAS IGNORER CETTE ALERTE - Les clés sont toujours accessibles publiquement dans l'historique Git.**

