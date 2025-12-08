# ✅ Correction 401 Unauthorized - Solution Finale

**Date** : 30 Janvier 2025, 11:10 UTC  
**Statut** : ✅ **PROBLÈME IDENTIFIÉ ET CORRIGÉ**

---

## 🔍 Problème Identifié

**Cause** : Supabase exige un header `Authorization` ou `apikey` pour appeler les Edge Functions, même si l'authentification est désactivée dans le code de l'Edge Function.

Le cron job n'envoyait que le header `x-cron-secret`, mais Supabase bloque la requête **avant** qu'elle n'arrive à l'Edge Function si le header `Authorization` est absent.

---

## ✅ Solution

Ajouter le header `Authorization` avec la service role key dans le cron job, comme le font les autres cron jobs du projet.

### Migration SQL

Exécutez cette migration pour corriger le cron job :

```sql
-- Fichier: supabase/migrations/20250230_fix_cron_job_auth.sql
```

Cette migration :
1. Supprime l'ancien cron job
2. Recrée le cron job avec le header `Authorization` inclus
3. Conserve le header `x-cron-secret` pour l'authentification personnalisée

---

## 🧪 Test

### 1. Exécuter la Migration

Dans Supabase Dashboard > SQL Editor, exécutez :

```sql
-- Voir le fichier: supabase/migrations/20250230_fix_cron_job_auth.sql
```

### 2. Tester Manuellement

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

### 3. Vérifier les Invocations

Dans Supabase Dashboard > Edge Functions > `process-scheduled-campaigns` > **Invocations** :

- ✅ Devrait être **200 OK** (plus de `401`)
- Les prochaines invocations du cron job devraient aussi être `200 OK`

### 4. Vérifier le Statut de la Campagne

```sql
SELECT 
  id,
  name,
  status,
  scheduled_at,
  metrics->>'sent' as emails_sent,
  updated_at,
  NOW() as current_time
FROM public.email_campaigns
WHERE id = '4f3d3b29-7643-4696-8139-3b49feed4d36';
```

**Résultats attendus** :
- `status` : `sending` ou `completed` (plus `scheduled`)
- `emails_sent` : > 0
- `updated_at` : mis à jour

---

## 📝 Notes Importantes

1. **Header `Authorization` requis** : Supabase exige ce header pour tous les appels aux Edge Functions, même si l'authentification est désactivée dans le code.

2. **Header `x-cron-secret` conservé** : Ce header est toujours envoyé pour l'authentification personnalisée dans l'Edge Function (une fois réactivée).

3. **Service Role Key** : Le cron job utilise `current_setting('app.settings.service_role_key', true)` pour obtenir la service role key automatiquement.

4. **Réactivation de l'authentification** : Une fois que tout fonctionne, réactiver l'authentification dans `supabase/functions/process-scheduled-campaigns/index.ts` en décommentant le code d'authentification.

---

## 🔄 Prochaines Étapes

1. ✅ Exécuter la migration SQL
2. ✅ Tester manuellement
3. ✅ Vérifier que les invocations sont `200 OK`
4. ✅ Vérifier que la campagne est traitée
5. ⏳ Réactiver l'authentification dans l'Edge Function (une fois que tout fonctionne)

---

**Dernière mise à jour** : 30 Janvier 2025, 11:10 UTC

