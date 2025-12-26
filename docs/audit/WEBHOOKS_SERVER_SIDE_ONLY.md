# ✅ Webhooks - Architecture Côté Serveur Uniquement

**Date**: 2025-01-28  
**Statut**: ✅ **IMPLÉMENTÉ**

---

## 📋 Résumé

L'envoi des webhooks a été déplacé côté serveur uniquement (Edge Function) pour garantir la sécurité des secrets et éviter leur exposition côté client.

---

## 🏗️ Architecture

### Flux de Traitement

```
┌─────────────────┐
│  Client (App)   │
│                 │
│ triggerWebhook() │
└────────┬────────┘
         │
         │ 1. Appel RPC
         ▼
┌─────────────────┐
│  PostgreSQL     │
│                 │
│ trigger_webhook()│
│  (RPC Function) │
└────────┬────────┘
         │
         │ 2. Crée delivery
         ▼
┌─────────────────┐
│ webhook_        │
│ deliveries      │
│ (status:        │
│  pending)       │
└────────┬────────┘
         │
         │ 3. Cron job (toutes les minutes)
         ▼
┌─────────────────┐
│  pg_cron        │
│                 │
│ process_pending │
│ _webhook_       │
│ _deliveries()   │
└────────┬────────┘
         │
         │ 4. Appel HTTP via pg_net
         ▼
┌─────────────────┐
│ Edge Function   │
│                 │
│ webhook-delivery│
│                 │
│ - Récupère      │
│   deliveries    │
│ - Envoie        │
│   webhooks      │
│ - Met à jour    │
│   statuts       │
└─────────────────┘
```

---

## 🔒 Sécurité

### Secrets Protégés

1. **Secrets webhooks** : Stockés uniquement dans la base de données, jamais exposés au client
2. **Service Role Key** : Utilisée uniquement dans l'Edge Function (variables d'environnement)
3. **Signatures HMAC** : Générées uniquement côté serveur (Edge Function)

### Vérifications

- ✅ Aucun secret n'est exposé dans le code client
- ✅ `sendWebhook()` dans `webhook-system.ts` contient un avertissement si appelé côté client
- ✅ Tous les appels utilisent `triggerUnifiedWebhook()` qui appelle uniquement la fonction RPC
- ✅ L'Edge Function utilise `SUPABASE_SERVICE_ROLE_KEY` pour accéder aux secrets

---

## 📁 Fichiers Clés

### 1. Service Unifié (Client)

**Fichier**: `src/lib/webhooks/unified-webhook-service.ts`

- ✅ Utilise uniquement `supabase.rpc('trigger_webhook', ...)`
- ✅ Ne contient aucun secret
- ✅ Crée uniquement des deliveries, n'envoie pas de webhooks

### 2. Fonction RPC (PostgreSQL)

**Fichier**: `supabase/migrations/20250128_webhooks_system_consolidated.sql`

- ✅ Fonction `trigger_webhook()` qui crée des deliveries
- ✅ Vérifie les webhooks actifs
- ✅ Ne contient pas de logique d'envoi

### 3. Edge Function (Serveur)

**Fichier**: `supabase/functions/webhook-delivery/index.ts`

- ✅ Récupère les deliveries en attente
- ✅ Accède aux secrets webhooks via Service Role Key
- ✅ Génère les signatures HMAC
- ✅ Envoie les webhooks
- ✅ Met à jour les statuts

### 4. Cron Job (PostgreSQL)

**Fichier**: `supabase/migrations/20250128_webhook_delivery_cron.sql`

- ✅ Appelle l'Edge Function toutes les minutes
- ✅ Utilise `pg_net` pour les appels HTTP
- ✅ Configuration automatique si `pg_cron` est disponible

---

## ⚙️ Configuration

### Variables d'Environnement Requises

Dans Supabase Dashboard → Settings → Database → Custom Config :

1. **`app.settings.supabase_url`**
   - Valeur : `https://YOUR_PROJECT_REF.supabase.co`
   - Utilisé pour construire l'URL de l'Edge Function

2. **`app.settings.service_role_key`**
   - Valeur : Votre Service Role Key (trouvable dans Settings → API)
   - Utilisé pour authentifier les appels à l'Edge Function

### Extensions Requises

1. **`pg_net`** : Pour les appels HTTP depuis PostgreSQL
   - Activer dans Supabase Dashboard → Database → Extensions

2. **`pg_cron`** : Pour les tâches planifiées (optionnel)
   - Activer dans Supabase Dashboard → Database → Extensions
   - Si non disponible, configurer le cron job manuellement

---

## 🚀 Déploiement

### 1. Déployer l'Edge Function

```bash
supabase functions deploy webhook-delivery
```

### 2. Exécuter les Migrations

```bash
# Migration principale (système unifié)
supabase migration up 20250128_webhooks_system_consolidated

# Migration du cron job
supabase migration up 20250128_webhook_delivery_cron

# Migration des données (si nécessaire)
supabase migration up 20250128_migrate_webhooks_to_unified
```

### 3. Configurer les Variables d'Environnement

Dans Supabase Dashboard → Settings → Database → Custom Config :

```sql
-- Définir l'URL Supabase
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOUR_PROJECT_REF.supabase.co';

-- Définir la Service Role Key
ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
```

**Note**: Pour des raisons de sécurité, la Service Role Key devrait être stockée dans une table sécurisée plutôt que dans les settings. Cette approche est un compromis pour la simplicité.

### 4. Vérifier le Cron Job

```sql
-- Vérifier que le cron job est configuré
SELECT
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobname = 'process-webhook-deliveries';
```

Si le cron job n'existe pas, configurez-le manuellement via Supabase Dashboard → Database → Cron Jobs.

---

## 🧪 Tests

### Test Manuel de l'Edge Function

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/webhook-delivery \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Test via SQL

```sql
-- Appeler l'Edge Function manuellement
SELECT public.call_webhook_delivery_edge_function();
```

### Vérifier les Deliveries

```sql
-- Voir les deliveries en attente
SELECT
  id,
  webhook_id,
  event_type,
  status,
  attempt_number,
  next_retry_at,
  triggered_at
FROM public.webhook_deliveries
WHERE status IN ('pending', 'retrying')
ORDER BY triggered_at ASC
LIMIT 10;
```

---

## 📊 Monitoring

### Logs Edge Function

Consulter les logs dans Supabase Dashboard → Edge Functions → webhook-delivery → Logs

### Métriques Webhooks

```sql
-- Statistiques des webhooks
SELECT
  w.id,
  w.name,
  w.url,
  w.status,
  COUNT(d.id) as total_deliveries,
  COUNT(CASE WHEN d.status = 'delivered' THEN 1 END) as successful,
  COUNT(CASE WHEN d.status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN d.status IN ('pending', 'retrying') THEN 1 END) as pending
FROM public.webhooks w
LEFT JOIN public.webhook_deliveries d ON d.webhook_id = w.id
GROUP BY w.id, w.name, w.url, w.status;
```

---

## ⚠️ Notes Importantes

1. **Service Role Key** : Ne jamais exposer cette clé côté client. Elle doit être utilisée uniquement dans :
   - Edge Functions
   - Cron jobs (via pg_net)
   - Migrations SQL (avec précaution)

2. **Rate Limiting** : L'Edge Function traite jusqu'à 50 deliveries par appel pour éviter la surcharge.

3. **Retry Logic** : Les webhooks échoués sont automatiquement retentés avec un exponential backoff (max 60 minutes entre tentatives).

4. **Timeout** : Chaque webhook a un timeout configurable (par défaut 30 secondes).

---

## ✅ Checklist de Vérification

- [x] Edge Function déployée
- [x] Migrations exécutées
- [x] Variables d'environnement configurées
- [x] Extensions activées (pg_net, pg_cron)
- [x] Cron job configuré
- [x] Aucun secret exposé côté client
- [x] Tous les appels utilisent le système unifié
- [x] Tests manuels réussis

---

## 🔗 Références

- [Documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentation pg_cron](https://github.com/citusdata/pg_cron)
- [Documentation pg_net](https://github.com/supabase/pg_net)
