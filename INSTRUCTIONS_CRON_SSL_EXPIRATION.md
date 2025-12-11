# ✅ Instructions : Création du Cron Job SSL Expiration

## 🎯 Méthode Simple - SQL Editor

### Étape 1 : Ouvrir SQL Editor

1. Allez dans votre **Supabase Dashboard**
2. Cliquez sur **SQL Editor** dans le menu latéral gauche
3. Cliquez sur **"New query"** ou utilisez un onglet existant

### Étape 2 : Copier-Coller le Script

**Copiez TOUT le contenu** du fichier suivant :
- 📄 `supabase/migrations/20250202_create_ssl_expiration_cron_job_FINAL.sql`

Ou copiez directement ce script :

```sql
-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Supprimer le cron job existant s'il existe (éviter les doublons)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'check-ssl-expiration-daily'
  ) THEN
    PERFORM cron.unschedule('check-ssl-expiration-daily');
    RAISE NOTICE 'Cron job existant supprimé';
  END IF;
END $$;

-- Créer le nouveau cron job
SELECT cron.schedule(
  'check-ssl-expiration-daily',  -- Nom du job
  '0 9 * * *',  -- Schedule: Tous les jours à 9h00 UTC
  $$
  SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/check-ssl-expiration',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5ODIzMSwiZXhwIjoyMDczMTc0MjMxfQ.MT2e4tcw_5eK0fRQFN5tF1Cwu210MKFUAUGqmYm_1XE"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Vérifier que le cron job a été créé avec succès
SELECT 
  jobid,
  schedule,
  active,
  jobname
FROM cron.job 
WHERE jobname = 'check-ssl-expiration-daily';
```

### Étape 3 : Exécuter

1. **Collez** le script dans l'éditeur SQL
2. Cliquez sur **"Run"** (ou `CTRL+Enter`)
3. Attendez le résultat

### Étape 4 : Vérifier le Résultat

Vous devriez voir :

✅ **Résultat attendu :**
- Une ligne avec `jobid`, `schedule: 0 9 * * *`, `active: true`, `jobname: check-ssl-expiration-daily`
- Pas d'erreur

❌ **Si vous voyez une erreur :**
- Copiez le message d'erreur
- Vérifiez que les extensions `pg_net` et `pg_cron` sont activées dans **Database → Extensions**

---

## 🔍 Vérification Alternative

Après avoir créé le cron job, vous pouvez vérifier qu'il est actif :

```sql
SELECT 
  jobid,
  schedule,
  active,
  jobname,
  description
FROM cron.job 
WHERE jobname = 'check-ssl-expiration-daily';
```

---

## 📅 Schedule Configuré

- **Fréquence :** Tous les jours
- **Heure :** 9h00 UTC
- **Format :** `0 9 * * *`

### Autres Options (si vous voulez changer) :

- **Toutes les 6 heures :** `0 */6 * * *`
- **Toutes les 12 heures :** `0 */12 * * *`
- **Deux fois par jour (9h et 21h) :** `0 9,21 * * *`
- **Toutes les heures (pour tests) :** `0 * * * *`
- **Toutes les 5 minutes (pour tests) :** `*/5 * * * *`

---

## ✅ Statut Final

Une fois le script exécuté avec succès :

- ✅ Cron job créé
- ✅ Edge Function `check-ssl-expiration` sera appelée quotidiennement
- ✅ Vérification automatique des certificats SSL expirés
- ✅ Alertes email envoyées si expiration < 30 jours

---

**Date :** 2025-02-02  
**Méthode :** SQL Editor (Dashboard Supabase)

