# 📋 Résumé des Problèmes - Système Emailing

**Date** : 30 Janvier 2025  
**Statut** : ⚠️ 2 problèmes critiques à résoudre

---

## ⚠️ Problèmes Identifiés dans les Logs

### 1. ❌ `401 Invalid JWT` dans `send-email-campaign`

**Erreur** :
```
Error invoking send-email-campaign: {
  status: 401,
  statusText: "Unauthorized",
  error: {"code":401,"message":"Invalid JWT"}
}
```

**Cause** : `process-scheduled-campaigns` appelle `send-email-campaign` avec l'anon key, mais Supabase rejette le JWT.

**Solution** : Vérifier que `SUPABASE_ANON_KEY` est bien injecté automatiquement et utilisé correctement.

### 2. ⚠️ `SENDGRID_API_KEY is not set`

**Warning** :
```
SENDGRID_API_KEY is not set. Campaigns will not be sent.
```

**Cause** : Le secret `SENDGRID_API_KEY` n'est pas configuré dans Supabase Dashboard > Edge Functions > Secrets.

**Solution** : Ajouter `SENDGRID_API_KEY` dans Supabase Dashboard > Edge Functions > Secrets.

---

## ✅ Actions à Effectuer

### Action 1 : Configurer `SENDGRID_API_KEY` ⚠️ **CRITIQUE**

**Où** : Supabase Dashboard > Edge Functions > Secrets

**Comment** :
1. Allez dans : `https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions/secrets`
2. Cliquez sur **"Add new secret"**
3. **Name** : `SENDGRID_API_KEY`
4. **Value** : Votre clé API SendGrid (commence par `SG.`)
5. Cliquez sur **"Save"**

**Comment obtenir la clé SendGrid** :
1. Allez sur [SendGrid](https://sendgrid.com)
2. Settings > API Keys
3. "Create API Key"
4. Donnez un nom (ex: "Emarzona Production")
5. Sélectionnez "Full Access" ou "Restricted Access" avec "Mail Send"
6. "Create & View"
7. **Copiez la clé** (commence par `SG.`)

### Action 2 : Vérifier l'Utilisation de l'Anon Key

Le code utilise maintenant `SUPABASE_ANON_KEY` pour appeler `send-email-campaign`. Si l'erreur `401` persiste, cela signifie que :

1. **Soit** `SUPABASE_ANON_KEY` n'est pas injecté automatiquement (peu probable)
2. **Soit** `send-email-campaign` rejette l'anon key pour une autre raison

**Solution de contournement** : Si l'anon key ne fonctionne pas, on peut essayer d'utiliser la service role key directement (comme dans le cron job).

---

## 🧪 Test Après Configuration

Après avoir configuré `SENDGRID_API_KEY`, testez à nouveau :

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
1. Plus de warning `SENDGRID_API_KEY is not set`
2. Plus d'erreur `401 Invalid JWT` (ou vérifier pourquoi elle persiste)
3. Campagne traitée avec succès

---

## 📝 Checklist

- [ ] `SENDGRID_API_KEY` configuré dans Supabase Dashboard > Edge Functions > Secrets
- [ ] Test effectué après configuration
- [ ] Plus de warning `SENDGRID_API_KEY is not set`
- [ ] Erreur `401 Invalid JWT` résolue (ou cause identifiée)
- [ ] Campagne traitée avec succès

---

**Dernière mise à jour** : 30 Janvier 2025


