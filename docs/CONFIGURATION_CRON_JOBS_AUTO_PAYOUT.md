# 📋 Configuration Cron Jobs - Auto-Payout

**Date** : 30 Janvier 2025  
**Statut** : ✅ Configuré

---

## 🎯 Objectif

Configurer les cron jobs pour exécuter automatiquement :
1. **Reversement automatique des fonds vendeurs** (3h du matin)
2. **Paiement automatique des commissions parrainage** (4h du matin)

---

## 📝 Migrations SQL

### 1. Configuration des Cron Jobs

**Fichier** : `supabase/migrations/20250230_setup_auto_payout_cron_jobs.sql`

Cette migration :
- ✅ Vérifie que `pg_cron` et `pg_net` sont activés
- ✅ Crée le cron job `auto-payout-vendors-daily` (3h du matin)
- ✅ Crée le cron job `auto-pay-referral-commissions-daily` (4h du matin)

### 2. Activation des Fonctionnalités

**Fichier** : `supabase/migrations/20250230_activate_auto_payout_features.sql`

Cette migration :
- ✅ Active `auto_payout_vendors.enabled = true`
- ✅ Active `auto_pay_referral_commissions.enabled = true`
- ✅ Configure les valeurs par défaut si elles n'existent pas

---

## 🚀 Application des Migrations

### Option 1 : Via Supabase CLI (Recommandé)

```bash
# Appliquer toutes les migrations
supabase db push

# Ou appliquer une migration spécifique
supabase db push --file supabase/migrations/20250230_setup_auto_payout_cron_jobs.sql
supabase db push --file supabase/migrations/20250230_activate_auto_payout_features.sql
```

### Option 2 : Via Supabase Dashboard

1. Allez dans **Supabase Dashboard** > **SQL Editor**
2. Copiez-collez le contenu de chaque migration
3. Exécutez les migrations dans l'ordre :
   - D'abord `20250230_setup_auto_payout_cron_jobs.sql`
   - Ensuite `20250230_activate_auto_payout_features.sql`

---

## ✅ Vérification

### Vérifier les Cron Jobs

```sql
-- Voir tous les cron jobs
SELECT jobid, jobname, schedule, command, active
FROM cron.job
WHERE jobname IN ('auto-payout-vendors-daily', 'auto-pay-referral-commissions-daily');
```

### Vérifier la Configuration

```sql
-- Vérifier que les fonctionnalités sont activées
SELECT 
  settings->'auto_payout_vendors'->>'enabled' as auto_payout_enabled,
  settings->'auto_payout_vendors'->>'delay_days' as delay_days,
  settings->'auto_payout_vendors'->>'min_amount' as min_amount,
  settings->'auto_pay_referral_commissions'->>'enabled' as auto_pay_referral_enabled,
  settings->'auto_pay_referral_commissions'->>'min_amount' as referral_min_amount
FROM platform_settings
WHERE key = 'admin';
```

**Résultat attendu** :
- `auto_payout_enabled`: `true`
- `delay_days`: `7`
- `min_amount`: `50000`
- `auto_pay_referral_enabled`: `true`
- `referral_min_amount`: `50000`

---

## 🧪 Test Manuel

### Tester Auto-Payout Vendors

```sql
-- Appeler manuellement l'Edge Function
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/auto-payout-vendors',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5ODIzMSwiZXhwIjoyMDczMTc0MjMxfQ.MT2e4tcw_5eK0fRQFN5tF1Cwu210MKFUAUGqmYm_1XE',
    'x-cron-secret', 'auto-payout-vendors-secret-2025'
  ),
  body := jsonb_build_object()
) AS request_id;
```

### Tester Auto-Pay Referral Commissions

```sql
-- Appeler manuellement l'Edge Function
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/auto-pay-referral-commissions',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5ODIzMSwiZXhwIjoyMDczMTc0MjMxfQ.MT2e4tcw_5eK0fRQFN5tF1Cwu210MKFUAUGqmYm_1XE',
    'x-cron-secret', 'auto-pay-referral-commissions-secret-2025'
  ),
  body := jsonb_build_object()
) AS request_id;
```

---

## 📊 Monitoring

### Voir l'historique d'exécution

```sql
-- Voir les dernières exécutions des cron jobs
SELECT 
  jobid,
  jobname,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobname IN ('auto-payout-vendors-daily', 'auto-pay-referral-commissions-daily')
ORDER BY start_time DESC
LIMIT 20;
```

---

## ⚙️ Configuration Avancée

### Modifier le Schedule

Pour modifier l'heure d'exécution, utilisez la syntaxe cron :

```sql
-- Exemple: Exécuter à 2h du matin au lieu de 3h
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'auto-payout-vendors-daily'),
  schedule := '0 2 * * *'
);
```

### Désactiver Temporairement

```sql
-- Désactiver un cron job
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'auto-payout-vendors-daily'),
  active := false
);

-- Réactiver
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'auto-payout-vendors-daily'),
  active := true
);
```

### Désactiver les Fonctionnalités

```sql
-- Désactiver auto-payout-vendors
UPDATE platform_settings
SET settings = jsonb_set(
  settings,
  '{auto_payout_vendors,enabled}',
  'false'::jsonb
)
WHERE key = 'admin';

-- Désactiver auto-pay-referral-commissions
UPDATE platform_settings
SET settings = jsonb_set(
  settings,
  '{auto_pay_referral_commissions,enabled}',
  'false'::jsonb
)
WHERE key = 'admin';
```

---

## 🔧 Dépannage

### Problème : Cron job ne s'exécute pas

1. Vérifier que `pg_cron` est activé :
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

2. Vérifier que le job est actif :
```sql
SELECT jobid, jobname, active FROM cron.job WHERE jobname LIKE 'auto-%';
```

3. Vérifier les logs d'erreur :
```sql
SELECT * FROM cron.job_run_details 
WHERE jobname LIKE 'auto-%' 
AND status = 'failed'
ORDER BY start_time DESC;
```

### Problème : Edge Function retourne 401

Vérifier que le `service_role_key` dans la migration correspond à votre clé actuelle.

---

## 📝 Notes

- Les cron jobs sont configurés pour s'exécuter **tous les jours**
- Les fonctionnalités sont **activées par défaut** après application de la migration
- Les retraits créés automatiquement nécessitent toujours l'**approbation d'un admin**
- Les commissions parrainage sont marquées comme payées mais ne créent pas de retrait automatique

---

**Dernière mise à jour** : 30 Janvier 2025

