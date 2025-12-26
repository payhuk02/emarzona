# 🔍 Requêtes SQL pour Déboguer la Campagne

**Date** : 30 Janvier 2025  
**Campagne ID** : `4f3d3b29-7643-4696-8139-3b49feed4d36`

---

## 1. Vérifier la Structure de `email_logs`

```sql
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'email_logs'
ORDER BY ordinal_position;
```

---

## 2. Vérifier le Statut Actuel de la Campagne

```sql
SELECT
  id,
  name,
  status,
  scheduled_at,
  template_id,
  metrics->>'sent' as emails_sent,
  metrics->>'delivered' as emails_delivered,
  updated_at,
  NOW() as current_time,
  scheduled_at <= NOW() as should_be_processed
FROM public.email_campaigns
WHERE id = '4f3d3b29-7643-4696-8139-3b49feed4d36';
```

---

## 3. Vérifier les Logs d'Emails (Structure Corrigée)

```sql
SELECT
  id,
  recipient_email,
  subject,
  sendgrid_status,
  sent_at,
  delivered_at,
  opened_at,
  campaign_id
FROM public.email_logs
WHERE campaign_id = '4f3d3b29-7643-4696-8139-3b49feed4d36'
ORDER BY sent_at DESC;
```

**Note** : Si `recipient_email` n'existe pas, utilisez cette requête pour voir toutes les colonnes disponibles :

```sql
SELECT *
FROM public.email_logs
WHERE campaign_id = '4f3d3b29-7643-4696-8139-3b49feed4d36'
LIMIT 1;
```

---

## 4. Vérifier les Dernières Exécutions du Cron Job

```sql
SELECT
  jobid,
  runid,
  status,
  return_message,
  start_time,
  end_time,
  end_time - start_time as duration
FROM cron.job_run_details
WHERE jobid = 4
  AND start_time >= '2025-12-08 09:55:00'
ORDER BY start_time DESC
LIMIT 10;
```

---

## 5. Vérifier les Campagnes qui Devraient Être Traitées

```sql
SELECT
  id,
  name,
  status,
  scheduled_at,
  template_id,
  NOW() as current_time,
  scheduled_at <= NOW() as should_process,
  template_id IS NOT NULL as has_template
FROM public.email_campaigns
WHERE status = 'scheduled'
  AND scheduled_at <= NOW()
  AND template_id IS NOT NULL
ORDER BY scheduled_at ASC
LIMIT 10;
```

---

## 6. Vérifier le Template

```sql
SELECT
  id,
  slug,
  name,
  is_active,
  category,
  subject,
  html_content
FROM public.email_templates
WHERE id = '34abbdcb-fff1-4be9-93af-84aab0b3bd87';
```

---

## 7. Tester Manuellement l'Edge Function

```sql
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-campaigns',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
  ),
  body := jsonb_build_object('limit', 10)
) AS request_id;
```

---

## 8. Vérifier les Permissions RLS

```sql
-- Vérifier les politiques RLS sur email_campaigns
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'email_campaigns';
```

---

## 📝 Notes

- Si `recipient_email` n'existe pas, la migration `20251027_email_system.sql` n'a peut-être pas été exécutée
- Si la campagne n'est pas traitée, vérifiez les logs de l'Edge Function dans Supabase Dashboard
- Le cron job retourne `1 row` mais cela peut signifier qu'il a trouvé 1 campagne mais n'a pas réussi à la traiter
