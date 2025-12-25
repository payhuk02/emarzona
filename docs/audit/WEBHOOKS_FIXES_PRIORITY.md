# 🔧 CORRECTIONS PRIORITAIRES - SYSTÈME WEBHOOKS
## Guide Technique de Correction

---

## 🔴 PRIORITÉ 1: CORRECTION HMAC SÉCURISÉ

### Problème Actuel

**Fichier:** `src/lib/webhooks/webhook-system.ts:222-247`

```typescript
// ❌ CODE ACTUEL (INSÉCURISÉ)
function signPayload(payload: string, secret: string): string {
  if (typeof window !== 'undefined') {
    // Utilise btoa() - facilement falsifiable
    return btoa(payload + secret).substring(0, 64);
  }
  // ...
}
```

### Solution

**Remplacer par:**

```typescript
// ✅ CODE CORRIGÉ (SÉCURISÉ)
async function signPayload(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

**Mettre à jour `sendWebhook()` pour être async:**

```typescript
export async function sendWebhook(
  webhook: Webhook,
  eventType: WebhookEvent,
  payload: Record<string, any>
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    // ✅ Utiliser la nouvelle fonction async
    const signature = await signPayload(JSON.stringify(payload), webhook.secret);
    // ... reste du code
  }
}
```

**Référence:** Utiliser la même implémentation que `src/services/webhooks/digitalProductWebhooks.ts:31-47`

---

## 🔴 PRIORITÉ 2: CONFIGURER LE CRON JOB

### Problème Actuel

L'Edge Function `webhook-delivery` existe mais n'est jamais appelée automatiquement.

### Solution

**Créer un cron job Supabase:**

1. **Créer la migration:** `supabase/migrations/YYYYMMDD_webhook_delivery_cron.sql`

```sql
-- Créer un cron job pour traiter les webhooks toutes les minutes
SELECT cron.schedule(
  'process-webhook-deliveries',
  '* * * * *', -- Toutes les minutes
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.webhook_delivery_url'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object()
    ) AS request_id;
  $$
);
```

**OU utiliser pg_cron directement:**

```sql
-- Activer l'extension pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Créer une fonction pour appeler l'Edge Function
CREATE OR REPLACE FUNCTION call_webhook_delivery_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response http_response;
BEGIN
  -- Appeler l'Edge Function via HTTP
  SELECT * INTO response
  FROM http_post(
    url := current_setting('app.settings.webhook_delivery_url', true),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Programmer le cron job
SELECT cron.schedule(
  'process-webhook-deliveries',
  '* * * * *', -- Toutes les minutes
  'SELECT call_webhook_delivery_function();'
);
```

**Alternative (Plus simple):** Utiliser Supabase Dashboard → Database → Cron Jobs

---

## 🔴 PRIORITÉ 3: UNIFIER LES SYSTÈMES

### Architecture Cible

```
┌─────────────────────────────────────────┐
│     SYSTÈME UNIFIÉ DE WEBHOOKS         │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐                      │
│  │  Trigger      │                      │
│  │  (RPC)        │                      │
│  └──────┬────────┘                      │
│         │                               │
│         ▼                               │
│  ┌──────────────┐                      │
│  │  Deliveries   │                      │
│  │  (Table)      │                      │
│  └──────┬────────┘                      │
│         │                               │
│         ▼                               │
│  ┌──────────────┐                      │
│  │  Edge Function│                     │
│  │  (Delivery)   │                     │
│  └──────┬────────┘                      │
│         │                               │
│         ▼                               │
│  ┌──────────────┐                      │
│  │  Endpoint     │                      │
│  │  Client       │                      │
│  └──────────────┘                      │
│                                         │
└─────────────────────────────────────────┘
```

### Plan de Migration

1. **Créer le système unifié:**
   - Utiliser `webhooks` et `webhook_deliveries` comme tables principales
   - Supprimer `digital_product_webhooks` et `physical_product_webhooks`

2. **Migrer les données:**
   ```sql
   -- Migrer webhooks digitaux
   INSERT INTO webhooks (
     store_id, url, secret, events, status, ...
   )
   SELECT 
     store_id, url, secret_key, events, 
     CASE WHEN is_active THEN 'active' ELSE 'inactive' END,
     ...
   FROM digital_product_webhooks;
   
   -- Migrer webhooks physiques
   INSERT INTO webhooks (...)
   SELECT ... FROM physical_product_webhooks;
   ```

3. **Mettre à jour le code:**
   - Remplacer tous les appels à `digitalProductWebhooks.triggerWebhooks()` par `triggerWebhook()`
   - Remplacer tous les appels à `physicalProductWebhooks.triggerWebhooks()` par `triggerWebhook()`

4. **Supprimer les anciens systèmes:**
   - Supprimer les fichiers `digitalProductWebhooks.ts` et `physicalProductWebhooks.ts`
   - Supprimer les tables obsolètes après migration

---

## 🟠 PRIORITÉ 4: DÉPLACER L'ENVOI CÔTÉ SERVEUR

### Problème Actuel

Les webhooks sont envoyés depuis le client, exposant les secrets.

### Solution

**1. Supprimer `sendWebhook()` du client:**

```typescript
// ❌ SUPPRIMER de webhook-system.ts
export async function sendWebhook(...) { ... }
```

**2. Utiliser uniquement l'Edge Function:**

```typescript
// ✅ Dans webhook-system.ts
export async function triggerWebhook(
  storeId: string,
  eventType: WebhookEvent,
  payload: Record<string, any>
): Promise<void> {
  // Créer uniquement la delivery, l'Edge Function s'en charge
  const { error } = await supabase.rpc('trigger_webhook', {
    p_store_id: storeId,
    p_event_type: eventType,
    p_payload: payload,
  });
  
  // Optionnel: Appeler l'Edge Function immédiatement (non bloquant)
  if (!error) {
    fetch(`${SUPABASE_URL}/functions/v1/webhook-delivery`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ delivery_id: null }), // Traiter tous les pending
    }).catch(() => {}); // Ne pas bloquer en cas d'erreur
  }
}
```

**3. Protéger les secrets dans l'Edge Function:**

```typescript
// Dans supabase/functions/webhook-delivery/index.ts
// Les secrets ne sont jamais exposés au client
```

---

## 🟠 PRIORITÉ 5: STANDARDISER LES FORMATS

### Format de Payload Standard

```typescript
interface StandardWebhookPayload {
  // Identifiants
  id: string;                    // delivery_id (unique)
  event: WebhookEventType;      // Type d'événement
  event_id: string;             // ID de l'entité (order.id, etc.)
  
  // Timestamps
  timestamp: string;             // ISO 8601
  triggered_at: string;          // ISO 8601
  
  // Données
  data: {
    // Données spécifiques à l'événement
    [key: string]: any;
  };
  
  // Métadonnées
  metadata?: {
    version: string;             // Version de l'API (ex: "1.0")
    store_id?: string;          // ID du store
    attempt?: number;           // Numéro de tentative
  };
}
```

### Exemple pour `order.created`:

```json
{
  "id": "delivery-uuid",
  "event": "order.created",
  "event_id": "order-uuid",
  "timestamp": "2025-01-28T10:30:00Z",
  "triggered_at": "2025-01-28T10:30:00Z",
  "data": {
    "order": {
      "id": "order-uuid",
      "store_id": "store-uuid",
      "customer_id": "customer-uuid",
      "order_number": "ORD-12345",
      "status": "pending",
      "total_amount": 100.00,
      "currency": "XOF",
      "payment_status": "pending",
      "created_at": "2025-01-28T10:30:00Z"
    },
    "order_items": [
      {
        "id": "item-uuid",
        "product_id": "product-uuid",
        "product_type": "physical",
        "quantity": 2,
        "unit_price": 50.00,
        "total_price": 100.00
      }
    ]
  },
  "metadata": {
    "version": "1.0",
    "store_id": "store-uuid"
  }
}
```

### Headers Standard

```typescript
{
  'Content-Type': 'application/json',
  'User-Agent': 'Emarzona-Webhooks/1.0',
  'X-Emarzona-Event': eventType,
  'X-Emarzona-Delivery-Id': deliveryId,
  'X-Emarzona-Signature': `sha256=${signature}`, // Si secret configuré
  'X-Emarzona-Timestamp': timestamp,
}
```

---

## 🟡 PRIORITÉ 6: IMPLÉMENTER RATE LIMITING

### Dans l'Edge Function

```typescript
// Dans supabase/functions/webhook-delivery/index.ts

interface RateLimitState {
  count: number;
  resetAt: number;
}

const rateLimitCache = new Map<string, RateLimitState>();

async function checkRateLimit(
  webhookId: string,
  rateLimitPerMinute: number
): Promise<boolean> {
  const key = `webhook:${webhookId}`;
  const now = Date.now();
  const state = rateLimitCache.get(key);
  
  if (!state || now > state.resetAt) {
    // Nouvelle fenêtre
    rateLimitCache.set(key, {
      count: 1,
      resetAt: now + 60000, // 1 minute
    });
    return true;
  }
  
  if (state.count >= rateLimitPerMinute) {
    return false; // Rate limit dépassé
  }
  
  state.count++;
  return true;
}

// Utiliser dans processDelivery()
async function processDelivery(...) {
  // Vérifier rate limit
  if (!await checkRateLimit(webhook.id, webhook.rate_limit_per_minute)) {
    // Mettre à jour le statut avec erreur rate limit
    await supabase.rpc('update_webhook_delivery_status', {
      p_delivery_id: delivery.id,
      p_status: 'failed',
      p_error_message: 'Rate limit exceeded',
      p_error_type: 'rate_limit_error',
    });
    return;
  }
  
  // Continuer avec l'envoi...
}
```

---

## 🟡 PRIORITÉ 7: AJOUTER IDEMPOTENCE

### Migration SQL

```sql
-- Ajouter contrainte unique pour éviter les doublons
ALTER TABLE webhook_deliveries
ADD CONSTRAINT unique_event_webhook 
UNIQUE (event_id, webhook_id, event_type);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event_webhook 
ON webhook_deliveries(event_id, webhook_id, event_type);
```

### Mettre à jour trigger_webhook()

```sql
CREATE OR REPLACE FUNCTION public.trigger_webhook(...)
RETURNS TABLE(webhook_id UUID, delivery_id UUID) AS $$
DECLARE
  v_webhook RECORD;
  v_delivery_id UUID;
BEGIN
  FOR v_webhook IN
    SELECT * FROM public.webhooks
    WHERE status = 'active'
      AND (v_store_id IS NULL OR store_id = v_store_id)
      AND p_event_type = ANY(events)
  LOOP
    -- Vérifier si delivery existe déjà (idempotence)
    SELECT id INTO v_delivery_id
    FROM public.webhook_deliveries
    WHERE event_id = p_event_id
      AND webhook_id = v_webhook.id
      AND event_type = p_event_type
    LIMIT 1;
    
    -- Si existe déjà, skip
    IF v_delivery_id IS NOT NULL THEN
      CONTINUE;
    END IF;
    
    -- Créer nouvelle delivery
    INSERT INTO public.webhook_deliveries (...)
    VALUES (...)
    RETURNING id INTO v_delivery_id;
    
    RETURN QUERY SELECT v_webhook.id, v_delivery_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📝 CHECKLIST DE MIGRATION

### Phase 1: Sécurité (Semaine 1)
- [ ] Corriger HMAC dans `webhook-system.ts`
- [ ] Tester les signatures
- [ ] Déployer en staging
- [ ] Valider en production

### Phase 2: Infrastructure (Semaine 2)
- [ ] Configurer cron job
- [ ] Tester traitement automatique
- [ ] Monitorer les deliveries
- [ ] Ajuster fréquence si nécessaire

### Phase 3: Unification (Semaine 3-4)
- [ ] Créer migration de données
- [ ] Migrer webhooks digitaux
- [ ] Migrer webhooks physiques
- [ ] Mettre à jour code client
- [ ] Tester intégrations
- [ ] Supprimer anciens systèmes

### Phase 4: Améliorations (Mois 2)
- [ ] Implémenter rate limiting
- [ ] Ajouter idempotence
- [ ] Standardiser formats
- [ ] Améliorer validation
- [ ] Documentation complète

---

## 🧪 TESTS À EFFECTUER

### Test HMAC
```typescript
// Tester que les signatures sont correctes
const payload = JSON.stringify({ test: true });
const secret = "test-secret";
const signature = await signPayload(payload, secret);
// Vérifier que la signature est un hash hex de 64 caractères
expect(signature).toMatch(/^[a-f0-9]{64}$/);
```

### Test Cron Job
```sql
-- Vérifier que le cron job est actif
SELECT * FROM cron.job WHERE jobname = 'process-webhook-deliveries';

-- Vérifier les exécutions récentes
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-webhook-deliveries')
ORDER BY start_time DESC
LIMIT 10;
```

### Test Idempotence
```typescript
// Déclencher le même événement deux fois
await triggerWebhook(storeId, 'order.created', payload);
await triggerWebhook(storeId, 'order.created', payload);

// Vérifier qu'une seule delivery a été créée
const deliveries = await getWebhookDeliveries(webhookId);
expect(deliveries.filter(d => d.event_id === orderId).length).toBe(1);
```

---

**Date:** 2025-01-28  
**Version:** 1.0

