# 🔧 Instructions : Correction du Cron Job

**Date** : 30 Janvier 2025  
**Problème** : Erreur de syntaxe SQL dans la migration

---

## ✅ Migration Corrigée

La migration a été corrigée. Voici la version corrigée à exécuter :

```sql
-- =========================================================
-- Migration : Correction Authentification Cron Job Campagnes Email
-- Date : 30 Janvier 2025
-- Description : Ajoute le header Authorization au cron job pour résoudre les erreurs 401
-- =========================================================

-- Supprimer l'ancien cron job s'il existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'process-scheduled-email-campaigns'
  ) THEN
    PERFORM cron.unschedule('process-scheduled-email-campaigns');
  END IF;
END $$;

-- Recréer le cron job avec le header Authorization
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

-- Vérification
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'process-scheduled-email-campaigns';
```

---

## 📝 Étapes d'Exécution

1. **Ouvrir Supabase Dashboard** > **SQL Editor**

2. **Copier-coller la migration corrigée** ci-dessus

3. **Exécuter la requête** (Ctrl + Enter ou bouton "Run")

4. **Vérifier le résultat** :
   - Le premier bloc `DO $$` devrait s'exécuter sans erreur
   - Le `SELECT cron.schedule(...)` devrait retourner un `jobid`
   - La vérification finale devrait afficher le cron job avec le header `Authorization` dans la commande

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

**Résultat attendu** : ✅ **200 OK** (plus de `401`)

---

## ✅ Vérifications

1. **Cron Job** : Vérifiez que le cron job contient bien le header `Authorization` :

   ```sql
   SELECT command FROM cron.job WHERE jobname = 'process-scheduled-email-campaigns';
   ```

   Le `command` devrait contenir `'Authorization', 'Bearer ' || current_setting(...)`

2. **Invocations** : Dans Supabase Dashboard > Edge Functions > `process-scheduled-campaigns` > **Invocations**, devrait être **200 OK**

3. **Campagne** : La campagne devrait être traitée :
   ```sql
   SELECT status, metrics->>'sent' as emails_sent
   FROM public.email_campaigns
   WHERE id = '4f3d3b29-7643-4696-8139-3b49feed4d36';
   ```

---

**Dernière mise à jour** : 30 Janvier 2025
