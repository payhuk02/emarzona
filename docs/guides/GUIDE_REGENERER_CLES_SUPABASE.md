# 🔐 Guide de Régénération des Clés Supabase

## ⚠️ IMPORTANT - Action Critique de Sécurité

Ce guide doit être suivi **IMMÉDIATEMENT** si vous suspectez que vos clés Supabase ont été exposées ou commitées dans l'historique Git.

---

## 📋 Étape 1 : Vérifier l'Exposition

### 1.1 Vérifier l'historique Git

```bash
# Vérifier si .env a été commité
git log --all --full-history -- .env

# Vérifier si des clés Supabase sont dans l'historique
git log -p --all -S "VITE_SUPABASE_URL" | head -50
git log -p --all -S "VITE_SUPABASE_ANON_KEY" | head -50
```

### 1.2 Vérifier les logs Supabase

1. Aller sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionner votre projet
3. Aller dans **Settings** → **API**
4. Vérifier les **logs d'accès** pour activité suspecte
5. Vérifier les **rate limits** pour usage anormal

---

## 📋 Étape 2 : Régénérer les Clés Supabase

### 2.1 Régénérer l'Anon Key (Public Key)

1. Aller sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionner votre projet
3. Aller dans **Settings** → **API**
4. Cliquer sur **Reset** à côté de **anon/public key**
5. **⚠️ Copier la nouvelle clé** (elle ne sera plus affichée)

### 2.2 Régénérer la Service Role Key (si exposée)

1. Aller dans **Settings** → **API**
2. Cliquer sur **Reset** à côté de **service_role key**
3. **⚠️ Copier la nouvelle clé** (elle ne sera plus affichée)
4. **⚠️ NE JAMAIS exposer cette clé publiquement**

### 2.3 Mettre à jour les Variables d'Environnement

1. **Local** :
   ```bash
   # Éditer .env
   VITE_SUPABASE_URL=votre_nouvelle_url
   VITE_SUPABASE_ANON_KEY=votre_nouvelle_anon_key
   ```

2. **Vercel** :
   - Aller sur [Vercel Dashboard](https://vercel.com)
   - Sélectionner votre projet
   - Aller dans **Settings** → **Environment Variables**
   - Mettre à jour `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
   - Redéployer l'application

3. **Supabase Edge Functions** :
   - Aller sur [Supabase Dashboard](https://app.supabase.com)
   - Aller dans **Settings** → **Edge Functions** → **Secrets**
   - Mettre à jour les secrets si nécessaire

---

## 📋 Étape 3 : Nettoyer l'Historique Git (si nécessaire)

### 3.1 Utiliser BFG Repo Cleaner (Recommandé)

```bash
# Installer BFG Repo Cleaner
# Télécharger depuis: https://rtyley.github.io/bfg-repo-cleaner/

# Créer un fichier de remplacement
echo "VITE_SUPABASE_URL=***REMOVED***" > replacements.txt
echo "VITE_SUPABASE_ANON_KEY=***REMOVED***" >> replacements.txt

# Nettoyer l'historique
java -jar bfg.jar --replace-text replacements.txt

# Nettoyer les références
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Forcer le push (⚠️ DANGEREUX - coordonner avec l'équipe)
git push --force --all
```

### 3.2 Alternative : Utiliser git-filter-repo

```bash
# Installer git-filter-repo
pip install git-filter-repo

# Nettoyer l'historique
git filter-repo --invert-paths --path .env
git filter-repo --replace-text <(echo "VITE_SUPABASE_URL==>***REMOVED***")
git filter-repo --replace-text <(echo "VITE_SUPABASE_ANON_KEY==>***REMOVED***")

# Forcer le push
git push --force --all
```

---

## 📋 Étape 4 : Activer la 2FA sur Supabase

1. Aller sur [Supabase Dashboard](https://app.supabase.com)
2. Aller dans **Account Settings** → **Security**
3. Activer **Two-Factor Authentication (2FA)**
4. Scanner le QR code avec votre app d'authentification
5. Sauvegarder les codes de récupération

---

## 📋 Étape 5 : Vérifier la Sécurité

### 5.1 Vérifier les RLS Policies

```sql
-- Vérifier que RLS est activé sur toutes les tables sensibles
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;
```

### 5.2 Vérifier les Accès Suspects

1. Aller dans **Settings** → **Logs** → **API Logs**
2. Filtrer par **status code** : 401, 403
3. Vérifier les **IP addresses** suspectes
4. Vérifier les **timestamps** pour accès non autorisés

### 5.3 Vérifier les Utilisateurs

```sql
-- Vérifier les utilisateurs récemment créés
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Vérifier les rôles admin
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'admin';
```

---

## 📋 Étape 6 : Mettre à Jour les Applications

### 6.1 Applications Déployées

1. **Vercel** :
   - Mettre à jour les variables d'environnement
   - Redéployer toutes les branches (production, staging, etc.)

2. **Autres plateformes** :
   - Mettre à jour les variables d'environnement
   - Redéployer les applications

### 6.2 Applications Locales

1. Mettre à jour le fichier `.env`
2. Redémarrer le serveur de développement
3. Vider le cache du navigateur

---

## 📋 Étape 7 : Monitoring Post-Régénération

### 7.1 Surveiller les Logs

1. Surveiller les **API logs** pendant 24-48h
2. Vérifier les **erreurs d'authentification**
3. Vérifier les **rate limits**

### 7.2 Tester les Fonctionnalités

1. Tester l'**authentification** (login, signup)
2. Tester les **requêtes API**
3. Tester les **Edge Functions**
4. Tester les **webhooks**

---

## 🔒 Bonnes Pratiques pour l'Avenir

### ✅ À FAIRE

1. **Toujours** mettre `.env` dans `.gitignore`
2. **Toujours** utiliser des variables d'environnement pour les secrets
3. **Toujours** utiliser `.env.example` pour documenter les variables nécessaires
4. **Toujours** activer 2FA sur les comptes sensibles
5. **Toujours** utiliser RLS sur les tables sensibles
6. **Toujours** auditer les logs régulièrement

### ❌ À NE JAMAIS FAIRE

1. **NE JAMAIS** commiter `.env` dans Git
2. **NE JAMAIS** exposer les clés dans le code source
3. **NE JAMAIS** partager les clés dans les messages/emails
4. **NE JAMAIS** utiliser la service_role key côté client
5. **NE JAMAIS** désactiver RLS sans raison valable

---

## 📞 Support

Si vous avez des questions ou des problèmes :

1. **Documentation Supabase** : https://supabase.com/docs/guides/platform/security
2. **Support Supabase** : support@supabase.com
3. **Community** : https://github.com/supabase/supabase/discussions

---

## ✅ Checklist de Vérification

- [ ] Clés Supabase régénérées
- [ ] Variables d'environnement mises à jour (local + production)
- [ ] Applications redéployées
- [ ] 2FA activée sur compte Supabase
- [ ] Historique Git nettoyé (si nécessaire)
- [ ] Logs Supabase vérifiés
- [ ] RLS vérifié sur toutes les tables sensibles
- [ ] Applications testées après régénération
- [ ] Monitoring activé pour 24-48h

---

**Date de création** : 31 Janvier 2025  
**Dernière mise à jour** : 31 Janvier 2025







