# 🔒 VÉRIFICATION DE SÉCURITÉ - CLÉS SUPABASE

**Date de vérification** : 27 Janvier 2025  
**Statut** : ⚠️ **ACTION REQUISE**

---

## 📋 RÉSUMÉ

Selon les documents d'audit précédents, il y a eu un incident où des clés Supabase ont été exposées dans l'historique Git. Ce document vérifie l'état actuel de la sécurité.

---

## ✅ VÉRIFICATIONS EFFECTUÉES

### 1. Fichier .env dans .gitignore ✅

**Statut** : ✅ **CONFORME**

Le fichier `.gitignore` contient bien :
```
.env
.env.local
.env.*.local
```

**Vérification** :
```bash
# Le fichier .env n'est pas tracké par Git
git check-ignore .env
```

---

### 2. Fichier .env.example présent ✅

**Statut** : ✅ **CONFORME**

Le fichier `ENV_TEMPLATE.md` existe et contient un template des variables d'environnement sans valeurs sensibles.

---

### 3. Historique Git - Clés Exposées ⚠️

**Statut** : ⚠️ **À VÉRIFIER**

**Problème identifié dans l'audit** :
- Les clés Supabase ont été commitées dans l'historique Git (commits passés)
- Même si retirées du tracking, elles restent dans l'historique

**Commits concernés** (selon l'audit) :
- `d96b5c5` - 18 octobre 2025 (fichier `.env` commité)
- `e5be819` - 23 octobre 2025 (fichier `.env` retiré)

**Action requise** :
1. Vérifier si les clés ont été régénérées dans Supabase
2. Nettoyer l'historique Git si nécessaire
3. Vérifier les logs d'accès Supabase pour activité suspecte

---

## 🔴 ACTIONS URGENTES REQUISES

### Action 1 : Vérifier le statut des clés Supabase

**À faire maintenant** :

1. **Se connecter à Supabase** :
   - Aller sur https://app.supabase.com/project/[YOUR_PROJECT_ID]/settings/api

2. **Vérifier les clés** :
   - Vérifier si `VITE_SUPABASE_ANON_KEY` actuelle correspond à celle exposée
   - Si oui, **RÉGÉNÉRER IMMÉDIATEMENT**

3. **Régénérer les clés** :
   - Cliquer sur "Reset anon/public key"
   - Copier la nouvelle clé
   - Mettre à jour `.env` local
   - Mettre à jour les variables d'environnement sur Vercel

---

### Action 2 : Vérifier les logs d'accès Supabase

**À faire maintenant** :

1. **Accéder aux logs** :
   - Aller sur https://app.supabase.com/project/[YOUR_PROJECT_ID]/logs/explorer

2. **Filtrer** :
   - Date : 7 derniers jours
   - Event : `auth.login`, `database.query`, `storage.download`

3. **Rechercher** :
   - IPs suspectes (hors de votre pays/région)
   - Tentatives de login en masse
   - Requêtes inhabituelles
   - Accès à des tables sensibles

4. **Si activité suspecte détectée** :
   ```sql
   -- Vérifier utilisateurs créés récemment
   SELECT id, email, created_at 
   FROM auth.users 
   WHERE created_at > NOW() - INTERVAL '7 days'
   ORDER BY created_at DESC;
   
   -- Supprimer utilisateurs suspects si nécessaire
   DELETE FROM auth.users WHERE id = 'SUSPECT_USER_ID';
   ```

---

### Action 3 : Nettoyer l'historique Git (Optionnel)

**⚠️ ATTENTION** : Cette action réécrit l'historique Git et nécessite un `git push --force`.

**Option recommandée** : Utiliser `git-filter-repo` (plus moderne que BFG)

```bash
# Installer git-filter-repo
pip install git-filter-repo

# Nettoyer l'historique
git filter-repo --path .env --invert-paths --force

# Pousser (ATTENTION: force push)
git push origin main --force
```

**Alternative** : Utiliser BFG Repo-Cleaner

```bash
# Installer BFG
# Télécharger depuis https://rtyley.github.io/bfg-repo-cleaner/

# Cloner une copie du repo
git clone --mirror https://github.com/payhuk02/payhula.git payhula.git

# Supprimer .env de tout l'historique
bfg --delete-files .env payhula.git

# Nettoyer et repousser
cd payhula.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

---

### Action 4 : Activer 2FA sur Supabase

**À faire maintenant** :

1. Aller sur https://app.supabase.com/account/security
2. Activer **Two-Factor Authentication**
3. Scanner le QR code avec Google Authenticator
4. Tester le code

---

## 📊 CHECKLIST DE SÉCURITÉ

- [ ] Vérifier que `.env` est dans `.gitignore`
- [ ] Vérifier que `.env.example` existe (template sans secrets)
- [ ] Vérifier les clés Supabase actuelles
- [ ] Régénérer les clés si elles correspondent à celles exposées
- [ ] Mettre à jour `.env` local avec nouvelles clés
- [ ] Mettre à jour variables d'environnement Vercel
- [ ] Vérifier les logs d'accès Supabase (7 derniers jours)
- [ ] Activer 2FA sur le compte Supabase
- [ ] Nettoyer l'historique Git (optionnel mais recommandé)
- [ ] Documenter les nouvelles clés (sans les exposer)

---

## 🔐 BONNES PRATIQUES À APPLIQUER

### 1. Variables d'environnement

✅ **À faire** :
- Utiliser `import.meta.env` pour les variables Vite
- Ne jamais hardcoder les secrets
- Utiliser des secrets managers en production (Vercel Secrets)

❌ **À éviter** :
- Commiter `.env` dans Git
- Partager les clés par email/Slack
- Exposer les clés dans les logs

### 2. Rotation des clés

✅ **Recommandation** :
- Régénérer les clés tous les 6 mois
- Régénérer immédiatement si exposition suspectée
- Documenter la date de dernière rotation

### 3. Monitoring

✅ **À mettre en place** :
- Alertes sur tentatives de login suspectes
- Alertes sur requêtes inhabituelles
- Monitoring des coûts Supabase (détection d'abus)

---

## 📝 NOTES IMPORTANTES

1. **Si les clés ont été régénérées** : L'historique Git peut être nettoyé pour éviter toute confusion future, mais ce n'est pas critique si les nouvelles clés sont utilisées.

2. **Si les clés n'ont PAS été régénérées** : **ACTION IMMÉDIATE REQUISE** - Régénérer les clés maintenant.

3. **Nettoyage de l'historique** : Peut être fait plus tard si nécessaire, mais les clés doivent être régénérées en priorité.

---

## ✅ VALIDATION

Une fois toutes les actions effectuées, cocher :

- [ ] Clés Supabase régénérées
- [ ] Variables d'environnement mises à jour (local + Vercel)
- [ ] Logs vérifiés (aucune activité suspecte)
- [ ] 2FA activé sur Supabase
- [ ] Documentation mise à jour

**Date de validation** : ______________  
**Validé par** : ______________

---

**⚠️ IMPORTANT** : Si vous n'êtes pas sûr de l'état des clés, **RÉGÉNÉREZ-LES IMMÉDIATEMENT**. C'est préférable de régénérer même si elles n'ont pas été exposées que de risquer un accès non autorisé.

