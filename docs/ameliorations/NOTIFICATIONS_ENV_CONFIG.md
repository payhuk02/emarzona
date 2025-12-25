# ⚙️ CONFIGURATION DES VARIABLES D'ENVIRONNEMENT

**Date :** 2 Février 2025  
**Système :** Notifications

---

## 📋 VUE D'ENSEMBLE

Ce guide explique comment configurer les variables d'environnement pour le système de notifications, notamment pour la version HTTP des jobs cron.

---

## 🔧 CONFIGURATION POUR JOBS CRON HTTP

Si vous utilisez la version HTTP des jobs cron (`20250202_notification_cron_jobs_http.sql`), vous devez configurer les variables suivantes dans Supabase.

### Méthode 1 : Via SQL (Recommandé)

```sql
-- Configurer les variables d'environnement pour les jobs cron HTTP
ALTER DATABASE postgres SET app.supabase_url = 'https://YOUR_PROJECT_ID.supabase.co';
ALTER DATABASE postgres SET app.supabase_anon_key = 'YOUR_ANON_KEY';
```

**Remplacez :**

- `YOUR_PROJECT_ID` : L'ID de votre projet Supabase
- `YOUR_ANON_KEY` : Votre clé anonyme Supabase (trouvable dans Settings > API)

### Méthode 2 : Via Dashboard Supabase

1. Allez dans **Settings** > **Database**
2. Trouvez la section **Connection Pooling**
3. Configurez les variables d'environnement personnalisées

### Méthode 3 : Directement dans la Migration

Modifiez la migration `20250202_notification_cron_jobs_http.sql` pour remplacer :

```sql
-- Remplacer ces lignes :
current_setting('app.supabase_url')
current_setting('app.supabase_anon_key')

-- Par vos valeurs directes :
'https://YOUR_PROJECT_ID.supabase.co'
'YOUR_ANON_KEY'
```

---

## 🔑 OÙ TROUVER LES CLÉS

### Supabase URL

- Format : `https://YOUR_PROJECT_ID.supabase.co`
- Trouvable dans : Dashboard > Settings > API > Project URL

### Supabase Anon Key

- Format : Longue chaîne de caractères commençant par `eyJ...`
- Trouvable dans : Dashboard > Settings > API > Project API keys > `anon` `public`

### Supabase Service Role Key (pour Edge Functions)

- Format : Longue chaîne de caractères commençant par `eyJ...`
- Trouvable dans : Dashboard > Settings > API > Project API keys > `service_role` `secret`
- ⚠️ **NE JAMAIS EXPOSER CETTE CLÉ** - Utilisée uniquement côté serveur

---

## ✅ VÉRIFICATION

### Vérifier les Variables Configurées

```sql
-- Vérifier les variables d'environnement
SELECT
  name,
  setting
FROM pg_settings
WHERE name LIKE 'app.%';
```

### Tester les Jobs Cron

```sql
-- Lister les jobs cron configurés
SELECT * FROM cron.job WHERE jobname LIKE '%notification%';

-- Vérifier l'historique d'exécution
SELECT * FROM cron.job_run_details
WHERE jobid IN (
  SELECT jobid FROM cron.job WHERE jobname LIKE '%notification%'
)
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🔒 SÉCURITÉ

### Bonnes Pratiques

1. **Ne jamais exposer les clés dans le code client**
   - Utilisez uniquement la clé `anon` pour les requêtes publiques
   - Utilisez la clé `service_role` uniquement dans les Edge Functions

2. **Utiliser RLS (Row Level Security)**
   - Toutes les tables de notifications ont RLS activé
   - Les utilisateurs ne peuvent accéder qu'à leurs propres notifications

3. **Limiter les permissions**
   - Les jobs cron utilisent `SECURITY DEFINER` pour les fonctions
   - Les Edge Functions utilisent la clé `service_role` avec permissions limitées

---

## 🚨 DÉPANNAGE

### Problème : Les jobs cron ne s'exécutent pas

**Solution 1 :** Vérifier que `pg_cron` est activé

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

**Solution 2 :** Vérifier les logs

```sql
SELECT * FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC
LIMIT 10;
```

**Solution 3 :** Vérifier les variables d'environnement

```sql
SELECT current_setting('app.supabase_url', true);
SELECT current_setting('app.supabase_anon_key', true);
```

### Problème : Erreur 401 (Unauthorized)

**Cause :** Clé API incorrecte ou expirée

**Solution :**

1. Vérifier que la clé `anon` est correcte
2. Régénérer la clé si nécessaire dans Settings > API

### Problème : Erreur de connexion HTTP

**Cause :** URL Supabase incorrecte

**Solution :**

1. Vérifier l'URL dans Settings > API
2. S'assurer que l'URL se termine par `.supabase.co`
3. Vérifier qu'il n'y a pas de slash final

---

## 📝 EXEMPLE DE CONFIGURATION COMPLÈTE

```sql
-- 1. Activer pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Configurer les variables d'environnement
ALTER DATABASE postgres SET app.supabase_url = 'https://hbdnzajbyjakdhuavrvb.supabase.co';
ALTER DATABASE postgres SET app.supabase_anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

-- 3. Vérifier la configuration
SELECT
  current_setting('app.supabase_url', true) as supabase_url,
  current_setting('app.supabase_anon_key', true) as anon_key;

-- 4. Appliquer la migration HTTP (si nécessaire)
-- Exécuter: 20250202_notification_cron_jobs_http.sql
```

---

## 🔗 RESSOURCES

- **Documentation Supabase :** https://supabase.com/docs
- **Documentation pg_cron :** https://github.com/citusdata/pg_cron
- **Guide Edge Functions :** https://supabase.com/docs/guides/functions

---

**Document généré le :** 2 Février 2025  
**Version :** 1.0
