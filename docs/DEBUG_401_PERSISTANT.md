# 🐛 Debug 401 Unauthorized Persistant

**Date** : 30 Janvier 2025  
**Problème** : Toutes les invocations retournent encore `401` malgré le header `Authorization`

---

## ⚠️ Problème Identifié

Même avec le header `Authorization` dans le cron job, toutes les invocations retournent encore `401 Unauthorized`.

**Causes possibles** :
1. `current_setting('app.settings.service_role_key', true)` ne retourne pas la clé
2. Le format du header `Authorization` n'est pas correct
3. Supabase exige un format différent pour l'authentification

---

## 🔍 Diagnostic

### 1. Vérifier si `current_setting` fonctionne

Testez si `current_setting` retourne bien une valeur :

```sql
SELECT 
  current_setting('app.settings.service_role_key', true) as service_role_key,
  LENGTH(current_setting('app.settings.service_role_key', true)) as key_length;
```

**Résultat attendu** :
- `service_role_key` : Une longue chaîne (la service role key)
- `key_length` : > 0

**Si `service_role_key` est `NULL` ou vide** : C'est le problème ! `current_setting` ne fonctionne pas.

### 2. Vérifier les Logs de l'Edge Function

Dans Supabase Dashboard > Edge Functions > `process-scheduled-campaigns` > **Logs** :

1. Changez le filtre à **"Last 15 min"** ou **"Last hour"**
2. Recherchez les messages `=== REQUEST DEBUG ===`
3. Vérifiez ce qui est loggé pour `Authorization header` :
   - Si `null` : Le header n'est pas reçu
   - Si présent mais invalide : Le format est incorrect

---

## 🔧 Solutions

### Solution 1 : Utiliser la Service Role Key Directement

Si `current_setting` ne fonctionne pas, utilisez la service role key directement (temporairement pour tester) :

**⚠️ ATTENTION** : Ne faites cela que pour tester. En production, utilisez une variable d'environnement ou un secret.

1. **Obtenir la Service Role Key** :
   - Allez dans Supabase Dashboard > Settings > API
   - Copiez la **Service Role Key** (pas l'anon key)

2. **Mettre à jour le cron job** :

```sql
-- Supprimer l'ancien cron job
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'process-scheduled-email-campaigns'
  ) THEN
    PERFORM cron.unschedule('process-scheduled-email-campaigns');
  END IF;
END $$;

-- Recréer avec la clé directement (TEMPORAIRE - pour test uniquement)
SELECT cron.schedule(
  'process-scheduled-email-campaigns',
  '0,5,10,15,20,25,30,35,40,45,50,55 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-campaigns',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer VOTRE_SERVICE_ROLE_KEY_ICI',
      'x-cron-secret', 'process-scheduled-campaigns-secret-2025'
    ),
    body := jsonb_build_object('limit', 10)
  ) AS request_id;
  $$
);
```

**⚠️ REMPLACEZ** `VOTRE_SERVICE_ROLE_KEY_ICI` par votre vraie service role key.

### Solution 2 : Utiliser une Variable d'Environnement PostgreSQL

Si `current_setting` ne fonctionne pas, configurez une variable d'environnement PostgreSQL :

```sql
-- Configurer la variable (une seule fois)
ALTER DATABASE postgres SET app.settings.service_role_key = 'VOTRE_SERVICE_ROLE_KEY_ICI';

-- Puis utiliser dans le cron job
SELECT cron.schedule(
  'process-scheduled-email-campaigns',
  '0,5,10,15,20,25,30,35,40,45,50,55 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-campaigns',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'x-cron-secret', 'process-scheduled-campaigns-secret-2025'
    ),
    body := jsonb_build_object('limit', 10)
  ) AS request_id;
  $$
);
```

### Solution 3 : Utiliser l'Anon Key (Moins Sécurisé)

Si rien d'autre ne fonctionne, utilisez l'anon key temporairement :

```sql
-- Obtenir l'anon key depuis Supabase Dashboard > Settings > API
-- Puis utiliser dans le cron job
SELECT cron.schedule(
  'process-scheduled-email-campaigns',
  '0,5,10,15,20,25,30,35,40,45,50,55 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-campaigns',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer VOTRE_ANON_KEY_ICI',
      'x-cron-secret', 'process-scheduled-campaigns-secret-2025'
    ),
    body := jsonb_build_object('limit', 10)
  ) AS request_id;
  $$
);
```

---

## 🧪 Test avec Clé Directe

Pour tester rapidement, utilisez la solution 1 avec la service role key directement :

1. **Obtenir la Service Role Key** : Supabase Dashboard > Settings > API
2. **Mettre à jour le cron job** avec la clé directement
3. **Tester manuellement** :

```sql
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-campaigns',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer VOTRE_SERVICE_ROLE_KEY_ICI',
    'x-cron-secret', 'process-scheduled-campaigns-secret-2025'
  ),
  body := jsonb_build_object('limit', 10)
) AS request_id;
```

4. **Vérifier les invocations** : Devrait être **200 OK**

---

## 📝 Checklist

- [ ] Vérifier si `current_setting` retourne une valeur
- [ ] Vérifier les logs de l'Edge Function
- [ ] Tester avec la service role key directement
- [ ] Vérifier que les invocations sont `200 OK`
- [ ] Configurer une solution permanente (variable d'environnement ou secret)

---

**Dernière mise à jour** : 30 Janvier 2025


