# ✅ Vérification et Correction Finale du Cron Job

**Date** : 30 Janvier 2025  
**Statut** : ⚠️ Vérification nécessaire

---

## ✅ Ce qui a été fait

1. ✅ Ancien cron job supprimé avec succès
2. ✅ Nouveau cron job créé (jobid: 10)

---

## ⚠️ Vérification Requise

Le header `Authorization` doit être présent dans la commande du cron job. Vérifiez avec cette requête :

```sql
SELECT 
  jobid,
  jobname,
  command
FROM cron.job
WHERE jobname = 'process-scheduled-email-campaigns';
```

**Vérification** : Le champ `command` doit contenir :
```sql
'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
```

---

## 🔧 Si le header `Authorization` est absent

Si la vérification montre que le header `Authorization` n'est **PAS** présent, exécutez cette commande complète :

```sql
-- Supprimer le cron job actuel
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'process-scheduled-email-campaigns'
  ) THEN
    PERFORM cron.unschedule('process-scheduled-email-campaigns');
  END IF;
END $$;

-- Recréer avec le header Authorization (VERSION COMPLÈTE)
SELECT cron.schedule(
  'process-scheduled-email-campaigns',
  '0,5,10,15,20,25,30,35,40,45,50,55 * * * *',
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

**⚠️ IMPORTANT** : Assurez-vous que la ligne avec `'Authorization'` est bien présente dans `jsonb_build_object`.

---

## 🧪 Test Final

Après avoir vérifié/corrigé, testez manuellement :

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

Puis vérifiez les invocations dans Supabase Dashboard > Edge Functions > `process-scheduled-campaigns` > **Invocations**.

---

**Dernière mise à jour** : 30 Janvier 2025


