# 🚨 ACTIONS DE SÉCURITÉ IMMÉDIATES

**Date** : Janvier 2025  
**Urgence** : 🔴 **CRITIQUE**

---

## ⚠️ RÉSUMÉ

Les **clés Supabase sont exposées** dans l'historique Git et sont **toujours accessibles publiquement** sur GitHub.

**Impact** : Accès non autorisé possible à toute la base de données.

---

## 🔴 ACTION 1 : RÉGÉNÉRER LES CLÉS (15 MIN)

### Étape 1 : Accéder à Supabase

1. Aller sur : https://app.supabase.com/project/hbdnzajbyjakdhuavrvb/settings/api
2. Noter l'ancienne clé (pour rollback si problème)

### Étape 2 : Régénérer la clé

1. Cliquer sur **"Reset anon/public key"**
2. Confirmer l'action
3. **Copier la nouvelle clé**

### Étape 3 : Mettre à jour `.env` local

```env
# Nouveau fichier .env (local uniquement)
VITE_SUPABASE_PROJECT_ID="hbdnzajbyjakdhuavrvb"
VITE_SUPABASE_URL="https://hbdnzajbyjakdhuavrvb.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="NOUVELLE_CLÉ_ICI"
```

### Étape 4 : Mettre à jour Vercel

1. Aller sur : https://vercel.com/[votre-projet]/settings/environment-variables
2. Éditer `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Coller la **nouvelle clé**
4. **Redéployer** : `vercel --prod`

---

## 🔴 ACTION 2 : VÉRIFIER ACTIVITÉ SUSPECTE (30 MIN)

### Vérifier les logs Supabase

1. Aller sur : https://app.supabase.com/project/hbdnzajbyjakdhuavrvb/logs/explorer
2. Filtrer :
   - Date : 7 derniers jours
   - Event : `auth.login`, `database.query`
3. **Rechercher** :
   - IPs suspectes (hors de votre pays)
   - Tentatives login en masse
   - Requêtes inhabituelles

### Si activité suspecte détectée :

```sql
-- Vérifier utilisateurs suspects
SELECT id, email, created_at 
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Supprimer si suspect
DELETE FROM auth.users WHERE id = 'SUSPECT_USER_ID';
```

---

## 🔴 ACTION 3 : NETTOYER HISTORIQUE GIT (30 MIN)

### Option recommandée : Script PowerShell

```powershell
# Exécuter le script de nettoyage
.\clean-git-history.ps1
```

**Le script va :**
- ✅ Créer un backup automatique
- ✅ Installer git-filter-repo si nécessaire
- ✅ Supprimer `.env` de tout l'historique
- ✅ Restaurer le remote
- ✅ Proposer force push

**⚠️ Après le nettoyage :**
```bash
# Vérifier que ça a fonctionné
git log --all --full-history -- .env
# Ne devrait rien retourner

# Force push (si sûr)
git push origin main --force
```

---

## ✅ VALIDATION

### Checklist finale :

- [ ] Clés Supabase régénérées
- [ ] `.env` local mis à jour
- [ ] Variables Vercel mises à jour
- [ ] Application redéployée
- [ ] Logs Supabase vérifiés (aucune activité suspecte)
- [ ] Historique Git nettoyé
- [ ] Force push effectué (si nettoyage fait)
- [ ] 2FA Supabase activé

---

**⏱️ Temps total estimé : 1h30**

**🔴 Ne pas reporter - Les clés sont actuellement exposées.**

