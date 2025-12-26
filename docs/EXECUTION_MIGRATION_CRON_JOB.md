# 🔧 Exécution de la Migration - Correction Cron Job

**Date** : 30 Janvier 2025  
**Statut** : ⚠️ Migration à exécuter

---

## ⚠️ Problème Identifié

Le cron job `process-scheduled-email-campaigns` n'a **PAS** le header `Authorization` dans sa commande. La commande actuelle ne contient que :

- `'Content-Type'`
- `'x-cron-secret'`

**Il manque** : `'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)`

---

## ✅ Solution : Exécuter la Migration

### Étape 1 : Supprimer l'Ancien Cron Job

Exécutez cette requête dans Supabase Dashboard > SQL Editor :

```sql
-- Supprimer l'ancien cron job
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'process-scheduled-email-campaigns'
  ) THEN
    PERFORM cron.unschedule('process-scheduled-email-campaigns');
    RAISE NOTICE 'Cron job supprimé';
  END IF;
END $$;
```

### Étape 2 : Créer le Nouveau Cron Job avec Authorization

Exécutez cette requête :

```sql
-- Créer le nouveau cron job avec le header Authorization
SELECT cron.schedule(
  'process-scheduled-email-campaigns',
  '0,5,10,15,20,25,30,35,40,45,50,55 * * * *',  -- Toutes les 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-campaigns',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'x-cron-secret', 'process-scheduled-campaigns-secret-2025'
    ),
    body := jsonb_build_object('limit', 10)
  ) AS request_id;
  $$
);
```

### Étape 3 : Vérifier

Vérifiez que le cron job contient bien le header `Authorization` :

```sql
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'process-scheduled-email-campaigns';
```

**Vérification** : Le champ `command` devrait contenir :

```sql
'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
```

---

## 🧪 Test Immédiat

Après avoir exécuté la migration, testez manuellement :

```sql
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-campaigns',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
    'x-cron-secret', 'process-scheduled-campaigns-secret-2025'
  ),
  body := jsonb_build_object('limit', 10)
) AS request_id;
```

**Résultat attendu** :

- `request_id` : Un nombre (ex: `184`, `185`, etc.)
- **Puis vérifier les invocations** : Devrait être **200 OK** (plus de `401`)

---

## 📊 Vérification des Invocations

Dans Supabase Dashboard > Edge Functions > `process-scheduled-campaigns` > **Invocations** :

1. **Vérifier la dernière invocation** (celle avec le `request_id` du test)
2. **Statut attendu** : ✅ **200 OK** (plus de `401`)

---

## ✅ Checklist

- [ ] Étape 1 : Ancien cron job supprimé
- [ ] Étape 2 : Nouveau cron job créé avec `Authorization`
- [ ] Étape 3 : Vérification - le `command` contient `Authorization`
- [ ] Test manuel exécuté
- [ ] Invocations vérifiées - statut `200 OK`
- [ ] Campagne vérifiée - statut `sending` ou `completed`

---

**Dernière mise à jour** : 30 Janvier 2025
