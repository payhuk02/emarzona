# ✅ Correction Finale 401 Invalid JWT

**Date** : 30 Janvier 2025  
**Problème** : `send-email-campaign` retourne `401 Invalid JWT` même avec l'anon key

---

## 🔍 Problème Identifié

L'anon key (`SUPABASE_ANON_KEY`) était rejetée par Supabase avec `401 Invalid JWT` lors de l'appel à `send-email-campaign`.

**Solution** : Utiliser la service role key directement (comme dans le cron job qui fonctionne).

---

## ✅ Correction Appliquée

Le code de `process-scheduled-campaigns` utilise maintenant la **service role key** directement pour appeler `send-email-campaign`, au lieu de l'anon key.

**Avant** :
```typescript
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || supabaseServiceKey;
'Authorization': `Bearer ${anonKey}`
```

**Après** :
```typescript
const authKey = supabaseServiceKey;
'Authorization': `Bearer ${authKey}`
```

---

## 🧪 Test

Testez à nouveau :

```sql
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-campaigns',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5ODIzMSwiZXhwIjoyMDczMTc0MjMxfQ.MT2e4tcw_5eK0fRQFN5tF1Cwu210MKFUAUGqmYm_1XE',
    'x-cron-secret', 'process-scheduled-campaigns-secret-2025'
  ),
  body := jsonb_build_object('limit', 10)
) AS request_id;
```

**Vérifications** :
1. Plus d'erreur `401 Invalid JWT`
2. Plus de warning `SENDGRID_API_KEY is not set` (si configuré)
3. Campagne traitée avec succès

---

## ⚠️ Action Requise : Configurer `SENDGRID_API_KEY`

Même si l'erreur `401` est résolue, vous devez **toujours configurer `SENDGRID_API_KEY`** pour que les emails soient envoyés :

1. Allez dans : Supabase Dashboard > Edge Functions > Secrets
2. Ajoutez : `SENDGRID_API_KEY` avec votre clé API SendGrid

---

**Dernière mise à jour** : 30 Janvier 2025

