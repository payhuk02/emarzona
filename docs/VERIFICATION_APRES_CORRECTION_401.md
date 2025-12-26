# ✅ Vérification Après Correction 401 Unauthorized

**Date** : 30 Janvier 2025  
**Statut** : Edge Function déployée, Cron Job mis à jour

---

## 📊 État Actuel

- ✅ Edge Function `process-scheduled-campaigns` déployée avec les corrections
- ✅ Cron Job mis à jour avec header `x-cron-secret`
- ⚠️ Campagne toujours en `scheduled` avec `emails_sent: 0`
- ⚠️ Aucun log d'email créé

---

## 🔍 Vérifications à Faire

### 1. Vérifier les Invocations de l'Edge Function

**Dans Supabase Dashboard :**

1. Allez dans **Edge Functions** > **process-scheduled-campaigns** > **Invocations**
2. Vérifiez les **dernières invocations** :
   - Devrait être **200 OK** au lieu de **401 Unauthorized**
   - Vérifiez autour de `10:37:00` (moment du test)

**Si toujours 401 :**

- Vérifiez que l'Edge Function a bien été redéployée
- Vérifiez que le header `x-cron-secret` est bien envoyé

### 2. Vérifier les Logs de l'Edge Function

**Dans Supabase Dashboard :**

1. Allez dans **Edge Functions** > **process-scheduled-campaigns** > **Logs**
2. Changez le filtre de temps à **"Last 15 min"** ou **"Last hour"**
3. Vérifiez les logs pour voir :
   - Si la fonction a été appelée
   - Si des campagnes ont été trouvées
   - S'il y a des erreurs

### 3. Tester Manuellement avec le Nouveau Header

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

**Attendez 5-10 secondes**, puis vérifiez :

- Le statut de la campagne
- Les logs d'emails
- Les invocations de l'Edge Function

### 4. Vérifier le Statut de la Campagne Après Test

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

---

## 🐛 Problèmes Possibles

### Problème 1 : Edge Function Non Redéployée

**Solution :**

- Vérifiez dans **Edge Functions** > **process-scheduled-campaigns** > **Code**
- Vérifiez que le code contient la vérification `x-cron-secret`
- Si non, redéployez : `supabase functions deploy process-scheduled-campaigns`

### Problème 2 : Cron Job Non Mis à Jour

**Solution :**

- Vérifiez le cron job avec :
  ```sql
  SELECT command FROM cron.job WHERE jobname = 'process-scheduled-email-campaigns';
  ```
- Vérifiez que `x-cron-secret` est présent dans la commande
- Si non, exécutez la migration de mise à jour

### Problème 3 : Erreur dans l'Edge Function

**Solution :**

- Vérifiez les logs de l'Edge Function pour des erreurs
- Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est configuré
- Vérifiez que `SENDGRID_API_KEY` est configuré (optionnel mais recommandé)

---

## 📝 Checklist de Vérification

- [ ] Edge Function redéployée avec succès
- [ ] Cron Job mis à jour avec `x-cron-secret`
- [ ] Test manuel retourne `200 OK` (pas `401`)
- [ ] Logs de l'Edge Function montrent l'exécution
- [ ] Campagne passe à `sending` ou `completed`
- [ ] Logs d'emails créés dans `email_logs`

---

**Dernière mise à jour** : 30 Janvier 2025
