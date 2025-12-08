# 🔧 Debug 401 Unauthorized - Mode Temporaire

**Date** : 30 Janvier 2025, 11:05 UTC  
**Statut** : Authentification temporairement désactivée pour déboguer

---

## ⚠️ MODE DÉBOGAGE ACTIVÉ

L'authentification a été **temporairement désactivée** pour identifier le problème exact. **L'Edge Function accepte maintenant tous les appels sans authentification.**

**⚠️ IMPORTANT** : Réactiver l'authentification une fois le problème identifié et résolu.

---

## ✅ Modifications Apportées

1. **Authentification désactivée temporairement** : `isAuthenticated = true`
2. **Logs détaillés ajoutés** : L'Edge Function log maintenant :
   - Tous les headers reçus
   - La méthode HTTP
   - L'URL complète
   - Les valeurs spécifiques de `Authorization` et `x-cron-secret`

---

## 🧪 Test Immédiat

### 1. Tester Manuellement

Exécutez cette requête :

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

**Résultat attendu** : ✅ **200 OK** (plus de `401`)

### 2. Vérifier les Logs

Dans Supabase Dashboard > Edge Functions > `process-scheduled-campaigns` > **Logs** :

1. Changez le filtre de temps à **"Last 15 min"** ou **"Last hour"**
2. Recherchez les messages commençant par `=== REQUEST DEBUG ===`

Vous devriez voir :
```
=== REQUEST DEBUG ===
Method: POST
URL: https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-campaigns
All headers: {
  "content-type": "application/json",
  "x-cron-secret": "process-scheduled-campaigns-secret-2025",
  ...
}
Authorization header: null
x-cron-secret header: process-scheduled-campaigns-secret-2025
===================
```

**Ces logs nous diront** :
- Si le header `x-cron-secret` est bien reçu
- Si la casse des headers est correcte (parfois les headers sont en minuscules)
- Si d'autres headers sont présents

### 3. Vérifier les Invocations

Dans Supabase Dashboard > Edge Functions > `process-scheduled-campaigns` > **Invocations** :

- ✅ Devrait être **200 OK** (plus de `401`)
- ⚠️ Si toujours `401`, il y a un problème plus profond (peut-être un cache)

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

## 🔍 Diagnostic

### Si l'invocation retourne maintenant `200 OK` :

✅ **Le problème était l'authentification**. Les logs nous diront pourquoi :
- Si `x-cron-secret` n'est pas reçu → Problème avec `pg_net` ou le cron job
- Si `x-cron-secret` est reçu mais avec une casse différente → Problème de casse des headers
- Si d'autres headers sont présents → Problème de configuration

### Si l'invocation retourne toujours `401` :

⚠️ **Il y a un problème plus profond** :
- Cache de l'Edge Function (attendre quelques minutes)
- Problème avec Supabase lui-même
- Problème avec le déploiement

---

## 🔄 Prochaines Étapes

### 1. Analyser les Logs

Une fois que vous avez les logs, identifiez :
- Si `x-cron-secret` est bien reçu
- Quelle est la casse exacte des headers
- S'il y a d'autres headers inattendus

### 2. Corriger le Problème

Selon ce que les logs révèlent :
- **Si `x-cron-secret` n'est pas reçu** : Vérifier la configuration du cron job
- **Si la casse est différente** : Utiliser `req.headers.get('x-cron-secret')` avec la bonne casse
- **Si d'autres headers sont présents** : Ajuster la logique d'authentification

### 3. Réactiver l'Authentification

Une fois le problème identifié et corrigé, réactiver l'authentification dans `supabase/functions/process-scheduled-campaigns/index.ts` :

```typescript
// Réactiver cette partie :
const expectedCronSecret = Deno.env.get('CRON_SECRET') || 'process-scheduled-campaigns-secret-2025';
const isAuthenticated = 
  (authHeader && (authHeader.startsWith('Bearer ') || authHeader.startsWith('apikey '))) ||
  (cronSecret && cronSecret.trim() === expectedCronSecret.trim()) ||
  (!authHeader && !cronSecret);
```

---

## 📝 Checklist

- [ ] Test manuel exécuté
- [ ] Logs de l'Edge Function vérifiés (avec tous les headers)
- [ ] Invocation retourne `200 OK` (plus de `401`)
- [ ] Campagne passe à `sending` ou `completed`
- [ ] Logs d'emails créés dans `email_logs`
- [ ] Problème identifié dans les logs
- [ ] Authentification réactivée après correction

---

**⚠️ RAPPEL** : L'authentification est temporairement désactivée. **Réactiver l'authentification une fois le problème résolu.**

---

**Dernière mise à jour** : 30 Janvier 2025, 11:05 UTC


