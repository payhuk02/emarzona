# 🔄 GUIDE D'UNIFICATION DES SYSTÈMES DE WEBHOOKS

## Date: 2025-01-28

---

## 📋 OBJECTIF

Unifier les 3 systèmes de webhooks fragmentés en un seul système centralisé utilisant la table `webhooks` et la fonction RPC `trigger_webhook`.

---

## 🎯 SYSTÈMES À UNIFIER

### 1. Système Général

- **Fichier:** `src/lib/webhooks/webhook-system.ts`
- **Table:** `webhooks` / `webhook_deliveries`
- **Status:** ✅ Déjà unifié

### 2. Système Produits Digitaux

- **Fichier:** `src/services/webhooks/digitalProductWebhooks.ts`
- **Table:** `digital_product_webhooks` / `digital_product_webhook_logs`
- **Status:** ⏳ À migrer

### 3. Système Produits Physiques

- **Fichier:** `src/services/webhooks/physicalProductWebhooks.ts`
- **Table:** `physical_product_webhooks` / `physical_product_webhook_logs`
- **Status:** ⏳ À migrer

---

## ✅ DÉJÀ FAIT

1. ✅ **Service unifié créé:** `src/lib/webhooks/unified-webhook-service.ts`
2. ✅ **Migration consolidée:** `supabase/migrations/20250128_webhooks_system_consolidated.sql`
3. ✅ **useCreatePhysicalOrder mis à jour:** Utilise maintenant le système unifié

---

## 📝 ÉTAPES DE MIGRATION

### Étape 1: Migration des Données

Créer une migration SQL pour migrer les webhooks existants:

```sql
-- Migration des webhooks produits digitaux
INSERT INTO public.webhooks (
  store_id,
  name,
  url,
  secret,
  events,
  status,
  retry_count,
  timeout_seconds,
  created_at,
  updated_at
)
SELECT
  store_id,
  COALESCE(name, 'Digital Product Webhook'),
  url,
  secret_key,
  events::TEXT[],
  CASE WHEN is_active THEN 'active'::webhook_status ELSE 'inactive'::webhook_status END,
  retry_count,
  timeout_seconds,
  created_at,
  updated_at
FROM digital_product_webhooks
ON CONFLICT DO NOTHING;

-- Migration des webhooks produits physiques
INSERT INTO public.webhooks (
  store_id,
  name,
  url,
  secret,
  events,
  status,
  retry_count,
  timeout_seconds,
  created_at,
  updated_at
)
SELECT
  store_id,
  COALESCE(name, 'Physical Product Webhook'),
  target_url,
  secret_key,
  ARRAY[event_type]::TEXT[],
  CASE WHEN is_active THEN 'active'::webhook_status ELSE 'inactive'::webhook_status END,
  COALESCE(max_attempts, 3),
  30, -- timeout par défaut
  created_at,
  updated_at
FROM physical_product_webhooks
ON CONFLICT DO NOTHING;
```

### Étape 2: Mettre à jour le Code

#### Fichiers à modifier:

1. **`src/hooks/orders/useCreateDigitalOrder.ts`**
   - Remplacer `digitalProductWebhooks.triggerWebhooks()` par `triggerUnifiedWebhook()`

2. **`src/hooks/digital/useDownloads.ts`**
   - Remplacer les appels aux webhooks digitaux par le système unifié

3. **Tous les autres fichiers utilisant:**
   - `@/services/webhooks/digitalProductWebhooks`
   - `@/services/webhooks/physicalProductWebhooks`

#### Exemple de remplacement:

**Avant:**

```typescript
import { triggerWebhooks } from '@/services/webhooks/digitalProductWebhooks';

await triggerWebhooks(storeId, 'purchase', eventData, eventId);
```

**Après:**

```typescript
import { triggerUnifiedWebhook } from '@/lib/webhooks/unified-webhook-service';

await triggerUnifiedWebhook(storeId, 'order.created', eventData, eventId);
```

### Étape 3: Supprimer les Anciens Systèmes

Une fois la migration complète et testée:

1. **Supprimer les fichiers:**
   - `src/services/webhooks/digitalProductWebhooks.ts`
   - `src/services/webhooks/physicalProductWebhooks.ts`

2. **Supprimer les tables (après vérification):**
   ```sql
   -- ATTENTION: Ne faire que si toutes les données sont migrées
   DROP TABLE IF EXISTS digital_product_webhook_logs CASCADE;
   DROP TABLE IF EXISTS digital_product_webhooks CASCADE;
   DROP TABLE IF EXISTS physical_product_webhook_logs CASCADE;
   DROP TABLE IF EXISTS physical_product_webhooks CASCADE;
   ```

---

## 🔍 MAPPING DES ÉVÉNEMENTS

| Ancien Type         | Nouveau Type                        | Description                    |
| ------------------- | ----------------------------------- | ------------------------------ |
| `purchase`          | `order.created`                     | Achat de produit               |
| `download`          | `digital_product.downloaded`        | Téléchargement produit digital |
| `license_activated` | `digital_product.license_activated` | Activation de licence          |
| `license_revoked`   | `digital_product.license_revoked`   | Révocation de licence          |
| `product_created`   | `product.created`                   | Produit créé                   |
| `product_updated`   | `product.updated`                   | Produit mis à jour             |

Le service unifié gère automatiquement ce mapping via `normalizeEventType()`.

---

## 🧪 TESTS À EFFECTUER

### Test 1: Migration des Données

```sql
-- Vérifier que tous les webhooks ont été migrés
SELECT
  'digital' as source,
  COUNT(*) as count
FROM digital_product_webhooks
UNION ALL
SELECT
  'physical' as source,
  COUNT(*) as count
FROM physical_product_webhooks
UNION ALL
SELECT
  'unified' as source,
  COUNT(*) as count
FROM webhooks;
```

### Test 2: Déclenchement de Webhook

```typescript
// Tester le déclenchement d'un webhook
import { triggerUnifiedWebhook } from '@/lib/webhooks/unified-webhook-service';

await triggerUnifiedWebhook('store-id', 'order.created', { test: true }, 'test-event-id');

// Vérifier dans la base de données
// SELECT * FROM webhook_deliveries WHERE event_id = 'test-event-id';
```

### Test 3: Compatibilité Rétroactive

```typescript
// Tester que les anciens types d'événements fonctionnent
await triggerUnifiedWebhook(storeId, 'purchase', eventData, eventId);
// Devrait être mappé vers 'order.created'
```

---

## ⚠️ POINTS D'ATTENTION

1. **Ne pas supprimer les anciennes tables immédiatement**
   - Garder les données pendant au moins 1 mois
   - Vérifier que tous les webhooks fonctionnent correctement

2. **Vérifier les logs**
   - Surveiller les erreurs de webhooks après migration
   - Vérifier que les deliveries sont créées correctement

3. **Tester en staging d'abord**
   - Ne pas migrer directement en production
   - Tester tous les scénarios possibles

4. **Documenter les changements**
   - Informer les utilisateurs si nécessaire
   - Mettre à jour la documentation API

---

## 📊 CHECKLIST DE MIGRATION

- [ ] Migration SQL créée et testée
- [ ] Données migrées vers `webhooks`
- [ ] `useCreatePhysicalOrder` mis à jour ✅
- [ ] `useCreateDigitalOrder` mis à jour
- [ ] `useDownloads` mis à jour
- [ ] Tous les autres fichiers mis à jour
- [ ] Tests effectués
- [ ] Logs vérifiés
- [ ] Anciens fichiers supprimés
- [ ] Anciennes tables supprimées (après période de grâce)

---

## 🔗 RESSOURCES

- [Service unifié](../src/lib/webhooks/unified-webhook-service.ts)
- [Migration consolidée](../supabase/migrations/20250128_webhooks_system_consolidated.sql)
- [Document d'audit](./AUDIT_WEBHOOKS_SYSTEM.md)

---

**Date:** 2025-01-28  
**Version:** 1.0  
**Statut:** En cours
