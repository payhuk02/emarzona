# 🔍 Vérification de l'Invocation 189

**Date** : 30 Janvier 2025  
**Test manuel** : `request_id: 189`  
**Statut** : ⚠️ Campagne toujours en `scheduled`

---

## ✅ Ce qui a été fait

1. ✅ Test manuel exécuté avec succès (`request_id: 189`)
2. ✅ Header `Authorization` présent dans la requête
3. ⚠️ Campagne toujours en `scheduled` avec `emails_sent: 0`

---

## 🔍 Vérifications Requises

### 1. Vérifier le Statut de l'Invocation 189

Dans Supabase Dashboard > Edge Functions > `process-scheduled-campaigns` > **Invocations** :

1. Recherchez l'invocation avec l'ID correspondant à `request_id: 189`
2. Vérifiez le **statut** :
   - ✅ **200 OK** = L'invocation a réussi
   - ❌ **401 Unauthorized** = Problème d'authentification
   - ❌ **500 Internal Server Error** = Erreur dans l'Edge Function

### 2. Vérifier les Logs de l'Edge Function

Dans Supabase Dashboard > Edge Functions > `process-scheduled-campaigns` > **Logs** :

1. Changez le filtre de temps à **"Last 15 min"** ou **"Last hour"**
2. Recherchez les messages pour l'invocation 189 :
   - `=== REQUEST DEBUG ===` (logs de débogage)
   - `Processing scheduled campaign: ...` (si une campagne a été trouvée)
   - `No scheduled campaigns to process` (si aucune campagne n'a été trouvée)
   - Erreurs éventuelles

### 3. Vérifier Pourquoi la Campagne n'a pas été Traitée

Si l'invocation est `200 OK` mais la campagne n'a pas été traitée, vérifiez :

#### A. La requête SQL dans l'Edge Function

L'Edge Function utilise cette requête pour trouver les campagnes :

```sql
SELECT * FROM email_campaigns
WHERE status = 'scheduled'
  AND scheduled_at <= NOW()
  AND template_id IS NOT NULL
LIMIT 10;
```

#### B. Vérifier les Critères de la Campagne

Exécutez cette requête pour vérifier si la campagne répond aux critères :

```sql
SELECT
  id,
  name,
  status,
  scheduled_at,
  template_id,
  NOW() as current_time,
  scheduled_at <= NOW() as is_due,
  template_id IS NOT NULL as has_template
FROM public.email_campaigns
WHERE id = '4f3d3b29-7643-4696-8139-3b49feed4d36';
```

**Vérifications** :

- `status` doit être `'scheduled'` ✅
- `is_due` doit être `true` (scheduled_at <= NOW()) ⚠️
- `has_template` doit être `true` (template_id IS NOT NULL) ⚠️

#### C. Problème Possible : `scheduled_at` dans le Futur

Si `scheduled_at` est dans le futur, la campagne ne sera pas traitée. Vérifiez :

```sql
SELECT
  scheduled_at,
  NOW() as current_time,
  scheduled_at <= NOW() as is_due,
  scheduled_at - NOW() as time_until_due
FROM public.email_campaigns
WHERE id = '4f3d3b29-7643-4696-8139-3b49feed4d36';
```

Si `is_due` est `false`, la campagne est programmée pour le futur et ne sera pas traitée maintenant.

---

## 🐛 Diagnostic des Problèmes

### Problème 1 : Invocation 200 OK mais Campagne Non Traitée

**Causes possibles** :

1. **`scheduled_at` dans le futur** : La campagne est programmée pour plus tard
2. **`template_id` manquant** : La campagne n'a pas de template
3. **Aucune campagne trouvée** : L'Edge Function n'a trouvé aucune campagne à traiter

**Solution** :

- Vérifier les critères de la campagne (voir section 3.B)
- Si `scheduled_at` est dans le futur, attendre ou modifier `scheduled_at` pour le passé

### Problème 2 : Invocation Toujours 401

**Cause** : Le header `Authorization` n'est pas correctement envoyé ou reçu

**Solution** :

- Vérifier que le cron job contient bien le header `Authorization`
- Vérifier les logs de l'Edge Function pour voir les headers reçus

### Problème 3 : Erreur 500 dans l'Edge Function

**Cause** : Erreur dans le code de l'Edge Function

**Solution** :

- Vérifier les logs de l'Edge Function pour voir l'erreur exacte
- Vérifier que `send-email-campaign` est bien déployée

---

## 📝 Checklist de Vérification

- [ ] Statut de l'invocation 189 vérifié (200 OK ou autre?)
- [ ] Logs de l'Edge Function vérifiés
- [ ] Critères de la campagne vérifiés (status, scheduled_at, template_id)
- [ ] `scheduled_at` vérifié (dans le passé ou le futur?)
- [ ] `template_id` vérifié (présent ou manquant?)
- [ ] Problème identifié et solution appliquée

---

**Dernière mise à jour** : 30 Janvier 2025
