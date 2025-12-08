# 🔍 Script de Vérification des Secrets Email

**Date** : 30 Janvier 2025  
**Usage** : Guide pour vérifier manuellement les secrets dans Supabase Dashboard

---

## 📋 Checklist de Vérification

### 1. Accéder aux Secrets

**URL directe** :
```
https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions/secrets
```

### 2. Vérifier `SENDGRID_API_KEY`

- [ ] `SENDGRID_API_KEY` est présent dans la liste
- [ ] La valeur commence par `SG.`
- [ ] La valeur n'est pas vide
- [ ] Pas d'espaces avant/après la valeur

**Si absent** :
1. Cliquez sur "Add new secret"
2. Name : `SENDGRID_API_KEY`
3. Value : Votre clé API SendGrid
4. Cliquez sur "Save"

### 3. Vérifier les Autres Secrets (Optionnels)

- [ ] `SENDGRID_WEBHOOK_SECRET` (optionnel)
- [ ] `CRON_SECRET` (optionnel)

**Note** : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, et `SUPABASE_ANON_KEY` n'apparaîtront PAS dans cette liste car ils sont injectés automatiquement.

---

## 🧪 Test de Vérification

Après avoir vérifié/configuré les secrets, testez :

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

**Vérifiez les logs** :
- Plus de warning `SENDGRID_API_KEY is not set`
- Plus d'erreur `401 Invalid JWT` dans `send-email-campaign`

---

**Dernière mise à jour** : 30 Janvier 2025

