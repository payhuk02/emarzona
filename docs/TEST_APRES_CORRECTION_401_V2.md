# 🔧 Test Après Correction 401 Unauthorized (Version 2)

**Date** : 30 Janvier 2025, 11:00 UTC  
**Statut** : Edge Function redéployée avec logs de débogage

---

## ✅ Corrections Apportées

1. **Logs de débogage ajoutés** : L'Edge Function log maintenant :
   - Présence des headers `Authorization` et `x-cron-secret`
   - Valeurs reçues vs valeurs attendues
   - Résultat de la comparaison

2. **Comparaison améliorée** : Utilisation de `.trim()` pour éviter les problèmes d'espaces

3. **Condition simplifiée** : Logique d'authentification plus claire

---

## 🧪 Test Manuel

Exécutez cette requête pour tester :

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

**Attendez 5-10 secondes**, puis :

### 1. Vérifier les Logs de l'Edge Function

Dans Supabase Dashboard > Edge Functions > `process-scheduled-campaigns` > **Logs** :

Recherchez les messages comme :
```
Auth check: {
  hasAuthHeader: false,
  hasCronSecret: true,
  cronSecretValue: "process-scheduled-campaigns-secret-2025",
  expectedSecret: "process-scheduled-campaigns-secret-2025",
  match: true
}
```

**Si `match: false`** : Le secret ne correspond pas (vérifiez les espaces, la casse, etc.)

**Si `hasCronSecret: false`** : Le header n'est pas reçu (problème avec le cron job)

### 2. Vérifier les Invocations

Dans Supabase Dashboard > Edge Functions > `process-scheduled-campaigns` > **Invocations** :

- ✅ Devrait être **200 OK** (plus de `401 Unauthorized`)
- ⚠️ Si toujours `401`, vérifiez les logs pour voir pourquoi

### 3. Vérifier le Statut de la Campagne

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

### 4. Vérifier les Logs d'Emails

```sql
SELECT 
  COUNT(*) as total_logs,
  status,
  campaign_id
FROM public.email_logs
WHERE campaign_id = '4f3d3b29-7643-4696-8139-3b49feed4d36'
GROUP BY status, campaign_id;
```

**Résultat attendu** : `total_logs` > 0

---

## 🐛 Diagnostic des Problèmes

### Problème 1 : `match: false` dans les logs

**Cause** : Le secret ne correspond pas exactement

**Solution** :
- Vérifiez qu'il n'y a pas d'espaces avant/après dans le cron job
- Vérifiez la casse (minuscules/majuscules)
- Vérifiez que le secret dans le cron job correspond exactement à celui dans l'Edge Function

### Problème 2 : `hasCronSecret: false` dans les logs

**Cause** : Le header `x-cron-secret` n'est pas reçu

**Solution** :
- Vérifiez la configuration du cron job
- Vérifiez que `pg_net` peut envoyer des headers personnalisés
- Essayez d'utiliser `Authorization` header à la place

### Problème 3 : Toujours `401` malgré `match: true`

**Cause** : Problème dans la logique d'authentification

**Solution** :
- Vérifiez les logs complets de l'Edge Function
- Vérifiez qu'il n'y a pas d'autres conditions qui bloquent

---

## 📝 Checklist de Vérification

- [ ] Test manuel exécuté
- [ ] Logs de l'Edge Function vérifiés
- [ ] Invocation retourne `200 OK` (plus de `401`)
- [ ] Campagne passe à `sending` ou `completed`
- [ ] Logs d'emails créés dans `email_logs`

---

**Dernière mise à jour** : 30 Janvier 2025, 11:00 UTC


