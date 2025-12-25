# 🔧 Correction 401 Unauthorized - Cron Job Campagnes Email

**Date** : 30 Janvier 2025  
**Problème** : Toutes les invocations de l'Edge Function retournent `401 Unauthorized`

---

## 🐛 Problème Identifié

Toutes les invocations de l'Edge Function `process-scheduled-campaigns` depuis le cron job retournent **401 Unauthorized**.

**Cause** : Le cron job utilise `current_setting('app.settings.service_role_key', true)` qui retourne `NULL`, donc le header `Authorization` est mal formé : `Authorization: Bearer ` (sans clé).

---

## ✅ Solution Appliquée

### 1. Modification de l'Edge Function

L'Edge Function `process-scheduled-campaigns` a été modifiée pour accepter :
- ✅ Header `Authorization` avec Bearer token (pour appels externes)
- ✅ Header `x-cron-secret` avec un secret partagé (pour appels depuis cron job)
- ✅ Appels sans authentification (pour compatibilité avec appels internes Supabase)

### 2. Modification du Cron Job

Le cron job utilise maintenant le header `x-cron-secret` au lieu de `Authorization` :

```sql
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-campaigns',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', 'process-scheduled-campaigns-secret-2025'
  ),
  body := jsonb_build_object('limit', 10)
) AS request_id;
```

---

## 🔐 Configuration du Secret (Optionnel)

Pour plus de sécurité, vous pouvez configurer un secret personnalisé :

1. **Dans Supabase Dashboard** :
   - Allez dans Edge Functions > Secrets
   - Ajoutez : `CRON_SECRET` = `votre-secret-personnalise`

2. **Dans le Cron Job** :
   - Remplacez `'process-scheduled-campaigns-secret-2025'` par votre secret personnalisé

---

## 🧪 Test

Après la correction, testez manuellement :

```sql
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-campaigns',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', 'process-scheduled-campaigns-secret-2025'
  ),
  body := jsonb_build_object('limit', 10)
) AS request_id;
```

**Résultat attendu** : `200 OK` au lieu de `401 Unauthorized`

---

## 📝 Mise à Jour du Cron Job

Pour mettre à jour le cron job existant, exécutez cette requête :

```sql
-- Supprimer l'ancien cron job
SELECT cron.unschedule('process-scheduled-email-campaigns') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-scheduled-email-campaigns'
);

-- Créer le nouveau cron job avec la correction
SELECT cron.schedule(
  'process-scheduled-email-campaigns',
  '0,5,10,15,20,25,30,35,40,45,50,55 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-campaigns',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'process-scheduled-campaigns-secret-2025'
    ),
    body := jsonb_build_object('limit', 10)
  ) AS request_id;
  $$
);
```

---

## ✅ Vérification

1. **Tester manuellement** avec la requête ci-dessus
2. **Vérifier les logs** de l'Edge Function (devrait être `200 OK`)
3. **Vérifier le statut de la campagne** (devrait passer à `sending`)
4. **Vérifier les logs d'emails** (devrait créer des entrées dans `email_logs`)

---

**Dernière mise à jour** : 30 Janvier 2025

