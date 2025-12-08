# ✅ Requêtes Corrigées pour `email_logs`

**Date** : 30 Janvier 2025  
**Problème** : Les colonnes de `email_logs` ont des noms différents de ceux attendus

---

## 📊 Structure Réelle de `email_logs`

D'après les captures d'écran, la table `email_logs` a :
- ✅ `to_email` (au lieu de `recipient_email`)
- ✅ `campaign_id` 
- ✅ `sequence_id`
- ✅ `metadata` (jsonb)
- ❌ Pas de `sent_at` (utiliser `created_at` à la place)
- ❌ Pas de `recipient_email`

---

## 🔍 Requêtes Corrigées

### 1. Voir Toutes les Colonnes de `email_logs`

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

### 2. Vérifier les Logs d'Emails pour la Campagne (Version Simple)

**Option A : Voir toutes les colonnes disponibles**
```sql
SELECT *
FROM public.email_logs
WHERE campaign_id = '4f3d3b29-7643-4696-8139-3b49feed4d36'
ORDER BY created_at DESC
LIMIT 10;
```

**Option B : Colonnes connues (sans celles qui n'existent pas)**
```sql
SELECT 
  id,
  to_email,
  subject,
  created_at,
  campaign_id,
  sequence_id,
  template_id,
  user_id,
  metadata
FROM public.email_logs
WHERE campaign_id = '4f3d3b29-7643-4696-8139-3b49feed4d36'
ORDER BY created_at DESC
LIMIT 10;
```

### 3. Vérifier le Statut de la Campagne

```sql
SELECT 
  id,
  name,
  status,
  scheduled_at,
  template_id,
  metrics->>'sent' as emails_sent,
  metrics->>'delivered' as emails_delivered,
  metrics->>'opened' as emails_opened,
  updated_at,
  NOW() as current_time,
  scheduled_at <= NOW() as should_be_processed
FROM public.email_campaigns
WHERE id = '4f3d3b29-7643-4696-8139-3b49feed4d36';
```

### 4. Vérifier si des Emails ont été Créés

```sql
SELECT 
  COUNT(*) as total_logs,
  COUNT(CASE WHEN sendgrid_status IS NOT NULL THEN 1 END) as with_status,
  MIN(created_at) as first_log,
  MAX(created_at) as last_log
FROM public.email_logs
WHERE campaign_id = '4f3d3b29-7643-4696-8139-3b49feed4d36';
```

### 5. Voir Tous les Logs d'Emails (Structure Complète)

```sql
SELECT *
FROM public.email_logs
WHERE campaign_id = '4f3d3b29-7643-4696-8139-3b49feed4d36'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🔍 Diagnostic : Pourquoi la Campagne N'a Pas Été Traitée

### Vérifier les Logs de l'Edge Function

1. **Allez dans** : Supabase Dashboard > Edge Functions > `process-scheduled-campaigns`
2. **Cliquez sur** : Logs
3. **Vérifiez** les logs autour de `09:55:00` pour voir :
   - Si la campagne a été trouvée
   - Si l'appel à `send-email-campaign` a réussi
   - S'il y a des erreurs

### Vérifier les Logs de `send-email-campaign`

1. **Allez dans** : Supabase Dashboard > Edge Functions > `send-email-campaign`
2. **Cliquez sur** : Logs
3. **Vérifiez** s'il y a eu des appels récents

### Tester Manuellement

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

Attendez 5-10 secondes, puis vérifiez à nouveau le statut de la campagne.

---

## 📝 Notes Importantes

1. **Structure différente** : La table `email_logs` a une structure différente de celle documentée dans les migrations. Cela peut indiquer que :
   - Les migrations n'ont pas toutes été exécutées
   - La table a été modifiée manuellement
   - Il y a plusieurs versions de la table

2. **Campagne non traitée** : Même si le cron job s'est exécuté avec succès, la campagne reste en `scheduled`. Causes possibles :
   - L'Edge Function `send-email-campaign` a échoué
   - Problème de permissions RLS
   - La campagne n'a pas été trouvée par la requête (timezone, etc.)
   - Erreur silencieuse dans le traitement

3. **Prochaines étapes** :
   - Vérifier les logs des Edge Functions
   - Tester manuellement l'envoi
   - Vérifier les permissions RLS

---

**Dernière mise à jour** : 30 Janvier 2025

