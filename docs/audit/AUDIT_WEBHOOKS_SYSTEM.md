# 🔍 AUDIT COMPLET DU SYSTÈME DE WEBHOOKS
## Plateforme Emarzona - Date: 2025-01-28

---

## 📋 TABLE DES MATIÈRES

1. [Résumé Exécutif](#résumé-exécutif)
2. [Architecture Actuelle](#architecture-actuelle)
3. [Problèmes Critiques Identifiés](#problèmes-critiques-identifiés)
4. [Problèmes de Sécurité](#problèmes-de-sécurité)
5. [Problèmes de Performance](#problèmes-de-performance)
6. [Problèmes de Cohérence](#problèmes-de-cohérence)
7. [Recommandations Prioritaires](#recommandations-prioritaires)
8. [Plan d'Action](#plan-daction)

---

## 📊 RÉSUMÉ EXÉCUTIF

### État Actuel
Le système de webhooks de la plateforme Emarzona présente **plusieurs systèmes fragmentés** qui se chevauchent, créant de la confusion, des risques de sécurité, et des problèmes de maintenance.

### Score Global: **⚠️ 4.5/10**

**Points Positifs:**
- ✅ Architecture de base solide avec tables de logs
- ✅ Support des retries avec exponential backoff
- ✅ Interface UI complète pour la gestion
- ✅ Edge Function pour traitement asynchrone

**Points Critiques:**
- ❌ **3 systèmes de webhooks différents** qui se chevauchent
- ❌ **Sécurité HMAC compromise** côté client
- ❌ **Migrations conflictuelles** créant des tables dupliquées
- ❌ **Pas de cron job** pour traitement automatique
- ❌ **Incohérence** dans les formats de payload

---

## 🏗️ ARCHITECTURE ACTUELLE

### 1. Systèmes de Webhooks Identifiés

#### A. Système Général (`webhook-system.ts` + `webhooks.ts`)
**Fichiers:**
- `src/lib/webhooks/webhook-system.ts`
- `src/lib/webhooks.ts`
- `supabase/migrations/20250127_webhooks_system.sql`
- `supabase/migrations/20250228_webhooks_system_fixed.sql`

**Tables:**
- `webhooks` (avec colonnes: `status`, `events`, `retry_count`, etc.)
- `webhook_deliveries` (historique des livraisons)
- `webhook_logs` (dans migration 20250228)

**Fonction RPC:**
- `trigger_webhook(p_event_type, p_event_id, p_event_data, p_store_id)`
- `update_webhook_delivery_status()`

**Problème:** Deux migrations créent des structures différentes pour la même table.

#### B. Webhooks Produits Digitaux (`digitalProductWebhooks.ts`)
**Fichiers:**
- `src/services/webhooks/digitalProductWebhooks.ts`
- `supabase/migrations/20250127_digital_product_webhooks.sql`

**Tables:**
- `digital_product_webhooks`
- `digital_product_webhook_logs`

**Caractéristiques:**
- Signature HMAC correcte (Web Crypto API)
- Retry avec exponential backoff
- Logs détaillés

#### C. Webhooks Produits Physiques (`physicalProductWebhooks.ts`)
**Fichiers:**
- `src/services/webhooks/physicalProductWebhooks.ts`
- `supabase/migrations/20250127_physical_products_webhooks.sql`

**Tables:**
- `physical_product_webhooks`
- `physical_product_webhook_logs`

**Caractéristiques:**
- Structure similaire aux webhooks digitaux
- Retry avec exponential backoff
- Logs détaillés

#### D. Webhook Moneroo (Réception)
**Fichiers:**
- `src/lib/moneroo-webhook-validator.ts`
- `supabase/functions/moneroo-webhook/index.ts`

**Fonction:** Valide et traite les webhooks entrants de Moneroo.

---

## 🚨 PROBLÈMES CRITIQUES IDENTIFIÉS

### 1. **FRAGMENTATION DES SYSTÈMES** ⚠️ CRITIQUE

**Problème:**
Trois systèmes de webhooks distincts pour différents types de produits, créant:
- Duplication de code
- Incohérence dans les formats
- Difficulté de maintenance
- Risque de bugs

**Impact:**
- 🔴 **Élevé** - Maintenance complexe, bugs potentiels

**Exemple:**
```typescript
// Système général
triggerWebhook(storeId, 'order.created', payload)

// Système produits digitaux
triggerWebhooks(storeId, 'purchase', eventData, eventId)

// Système produits physiques
triggerWebhooks(storeId, 'purchase', eventData, eventId)
```

**Recommandation:**
Unifier tous les systèmes en un seul système centralisé.

---

### 2. **MIGRATIONS CONFLICTUELLES** ⚠️ CRITIQUE

**Problème:**
Plusieurs migrations créent des tables avec des structures différentes:

1. `20250127_webhooks_system.sql` - Crée `webhooks` avec `status` (ENUM)
2. `20250228_webhooks_system.sql` - Crée `webhooks` avec `is_active` (BOOLEAN)
3. `20250228_webhooks_system_fixed.sql` - Tente de corriger mais crée encore des conflits

**Impact:**
- 🔴 **Élevé** - Erreurs de migration, données incohérentes

**Recommandation:**
Consolider toutes les migrations en une seule migration propre.

---

### 3. **SÉCURITÉ HMAC COMPROMISE** ⚠️ CRITIQUE

**Fichier:** `src/lib/webhooks/webhook-system.ts:222-247`

**Problème:**
La fonction `signPayload()` utilise `btoa()` au lieu de HMAC-SHA256 côté navigateur:

```typescript
function signPayload(payload: string, secret: string): string {
  if (typeof window !== 'undefined') {
    // ❌ INSÉCURISÉ - Utilise btoa au lieu de HMAC
    return btoa(payload + secret).substring(0, 64);
  }
  // ...
}
```

**Impact:**
- 🔴 **CRITIQUE** - Les signatures peuvent être facilement forgées
- Les webhooks ne sont pas authentifiés correctement

**Comparaison:**
- ✅ `digitalProductWebhooks.ts` - Utilise correctement Web Crypto API
- ❌ `webhook-system.ts` - Utilise btoa (insécurisé)

**Recommandation:**
Utiliser Web Crypto API comme dans `digitalProductWebhooks.ts`.

---

### 4. **TRAITEMENT ASYNCHRONE INCOMPLET** ⚠️ ÉLEVÉ

**Problème:**
L'Edge Function `webhook-delivery` existe mais:
- ❌ Pas de cron job configuré pour l'appeler automatiquement
- ❌ Les deliveries restent en `pending` indéfiniment
- ❌ Les retries ne sont pas traités automatiquement

**Fichier:** `supabase/functions/webhook-delivery/index.ts:296-303`

```typescript
// Récupère les deliveries en attente
.eq('status', 'pending')
.lte('next_retry_at', new Date().toISOString())
```

**Impact:**
- 🟠 **Élevé** - Webhooks non livrés, retries non exécutés

**Recommandation:**
Configurer un cron job Supabase pour appeler l'Edge Function toutes les minutes.

---

### 5. **INCOHÉRENCE DES FORMATS DE PAYLOAD** ⚠️ MOYEN

**Problème:**
Différents formats de payload selon le système:

**Système général:**
```json
{
  "event": "order.created",
  "timestamp": 1234567890,
  "data": { ... }
}
```

**Système produits digitaux:**
```json
{
  "event": "purchase",
  "event_id": "xxx",
  "timestamp": "2025-01-28T...",
  "data": { ... }
}
```

**Impact:**
- 🟠 **Moyen** - Confusion pour les intégrateurs

**Recommandation:**
Standardiser le format de payload.

---

### 6. **EXPOSITION DES SECRETS CÔTÉ CLIENT** ⚠️ ÉLEVÉ

**Problème:**
Les secrets de webhooks sont stockés et utilisés côté client:

```typescript
// src/lib/webhooks/webhook-system.ts
export async function sendWebhook(
  webhook: Webhook,
  eventType: WebhookEvent,
  payload: Record<string, any>
)
```

**Impact:**
- 🟠 **Élevé** - Secrets potentiellement exposés dans le code client

**Recommandation:**
Déplacer l'envoi des webhooks côté serveur (Edge Function uniquement).

---

### 7. **GESTION DES ERREURS INCOMPLÈTE** ⚠️ MOYEN

**Problème:**
Plusieurs endroits où les erreurs sont silencieusement ignorées:

```typescript
// src/lib/webhooks.ts:35-38
if (error) {
  logger.error('Webhook trigger error', { error, eventType, eventId, storeId });
  // Ne pas throw pour éviter de bloquer le flux principal
  return; // ❌ Erreur silencieuse
}
```

**Impact:**
- 🟠 **Moyen** - Erreurs non remontées, debugging difficile

**Recommandation:**
Implémenter un système de notification pour les erreurs critiques.

---

### 8. **RATE LIMITING NON IMPLÉMENTÉ** ⚠️ MOYEN

**Problème:**
Le champ `rate_limit_per_minute` existe dans la table mais n'est pas utilisé:

```typescript
// Table webhooks a rate_limit_per_minute
rate_limit_per_minute INTEGER DEFAULT 60

// Mais aucun code ne l'utilise
```

**Impact:**
- 🟠 **Moyen** - Risque de surcharge des endpoints clients

**Recommandation:**
Implémenter le rate limiting dans l'Edge Function.

---

### 9. **VALIDATION DES URLS INSUFFISANTE** ⚠️ MOYEN

**Problème:**
Validation basique des URLs:

```sql
-- Migration 20250127_digital_product_webhooks.sql
CONSTRAINT valid_url CHECK (url ~* '^https?://')
```

**Impact:**
- 🟠 **Moyen** - URLs invalides acceptées (ex: `http://localhost`)

**Recommandation:**
Valider que les URLs sont publiquement accessibles et utilisent HTTPS en production.

---

### 10. **IDEMPOTENCE NON GARANTIE** ⚠️ MOYEN

**Problème:**
Aucun mécanisme pour éviter les doublons:

- Un même événement peut déclencher plusieurs webhooks
- Pas de vérification `event_id` + `webhook_id` unique

**Impact:**
- 🟠 **Moyen** - Webhooks dupliqués possibles

**Recommandation:**
Ajouter une contrainte unique `(event_id, webhook_id)` dans `webhook_deliveries`.

---

## 🔒 PROBLÈMES DE SÉCURITÉ

### 1. Signature HMAC Insécurisée
- **Fichier:** `src/lib/webhooks/webhook-system.ts:222-247`
- **Sévérité:** 🔴 CRITIQUE
- **Description:** Utilise `btoa()` au lieu de HMAC-SHA256
- **Solution:** Utiliser Web Crypto API

### 2. Secrets Exposés Côté Client
- **Sévérité:** 🟠 ÉLEVÉ
- **Description:** Secrets stockés et utilisés dans le code client
- **Solution:** Déplacer vers Edge Function uniquement

### 3. Validation SSL Désactivable
- **Fichier:** `supabase/functions/webhook-delivery/index.ts:117-121`
- **Sévérité:** 🟡 MOYEN
- **Description:** Option pour désactiver la vérification SSL
- **Solution:** Forcer SSL en production

### 4. Pas de Rate Limiting par IP
- **Sévérité:** 🟡 MOYEN
- **Description:** Pas de protection contre les attaques DDoS
- **Solution:** Implémenter rate limiting par IP

---

## ⚡ PROBLÈMES DE PERFORMANCE

### 1. Traitement Synchrone dans Certains Cas
**Fichier:** `src/hooks/orders/useCreateOrder.ts:314-328`

```typescript
// ❌ Import dynamique mais toujours synchrone
import('@/lib/webhooks/webhook-system').then(({ triggerWebhook }) => {
  triggerWebhook(...).catch((err) => {
    logger.error('Error triggering webhook', { error: err });
  });
});
```

**Impact:** Peut ralentir la création de commandes.

### 2. Pas de Batching
**Problème:** Chaque webhook est envoyé individuellement, pas de batching.

**Impact:** Surcharge réseau inutile.

### 3. Pas de Compression
**Problème:** Payloads envoyés sans compression.

**Impact:** Bande passante gaspillée.

---

## 🔄 PROBLÈMES DE COHÉRENCE

### 1. Différentes Structures de Tables

| Système | Table Webhooks | Table Logs |
|---------|---------------|------------|
| Général | `webhooks` | `webhook_deliveries` / `webhook_logs` |
| Digitaux | `digital_product_webhooks` | `digital_product_webhook_logs` |
| Physiques | `physical_product_webhooks` | `physical_product_webhook_logs` |

### 2. Différents Formats de Payload

| Système | Format |
|---------|--------|
| Général | `{ event, timestamp, data }` |
| Digitaux | `{ event, event_id, timestamp, data }` |
| Physiques | `{ event, event_id, timestamp, data }` |

### 3. Différentes Logiques de Retry

| Système | Retry Logic |
|---------|-------------|
| Général | Via Edge Function (non configuré) |
| Digitaux | Exponential backoff inline |
| Physiques | Exponential backoff inline |

---

## ✅ RECOMMANDATIONS PRIORITAIRES

### 🔴 PRIORITÉ 1 - CRITIQUE (À faire immédiatement)

1. **Corriger la Sécurité HMAC**
   - Remplacer `btoa()` par Web Crypto API dans `webhook-system.ts`
   - Utiliser la même implémentation que `digitalProductWebhooks.ts`

2. **Unifier les Systèmes de Webhooks**
   - Créer un système centralisé unique
   - Migrer tous les webhooks vers ce système
   - Supprimer les systèmes fragmentés

3. **Consolider les Migrations**
   - Créer une migration unique et propre
   - Supprimer les migrations conflictuelles
   - Migrer les données existantes

### 🟠 PRIORITÉ 2 - ÉLEVÉE (À faire cette semaine)

4. **Configurer le Cron Job**
   - Créer un cron job Supabase pour appeler `webhook-delivery`
   - Fréquence: Toutes les minutes
   - Gérer les retries automatiquement

5. **Déplacer l'Envoi Côté Serveur**
   - Ne plus envoyer les webhooks depuis le client
   - Utiliser uniquement l'Edge Function
   - Protéger les secrets

6. **Standardiser les Formats**
   - Créer un format de payload unique
   - Documenter le format
   - Migrer tous les systèmes

### 🟡 PRIORITÉ 3 - MOYENNE (À faire ce mois)

7. **Implémenter le Rate Limiting**
   - Utiliser le champ `rate_limit_per_minute`
   - Limiter par webhook et par IP

8. **Améliorer la Validation**
   - Valider les URLs (HTTPS requis en production)
   - Valider les formats de payload

9. **Ajouter l'Idempotence**
   - Contrainte unique `(event_id, webhook_id)`
   - Vérifier avant d'insérer

10. **Améliorer la Gestion des Erreurs**
    - Système de notification pour erreurs critiques
    - Dashboard d'alertes
    - Logs structurés

---

## 📋 PLAN D'ACTION

### Phase 1: Sécurité (Semaine 1)
- [ ] Corriger HMAC dans `webhook-system.ts`
- [ ] Déplacer secrets côté serveur
- [ ] Forcer HTTPS en production

### Phase 2: Unification (Semaine 2-3)
- [ ] Créer système centralisé
- [ ] Migrer webhooks digitaux
- [ ] Migrer webhooks physiques
- [ ] Supprimer anciens systèmes

### Phase 3: Infrastructure (Semaine 4)
- [ ] Configurer cron job
- [ ] Implémenter rate limiting
- [ ] Ajouter idempotence

### Phase 4: Amélioration (Mois 2)
- [ ] Standardiser formats
- [ ] Améliorer validation
- [ ] Dashboard d'alertes
- [ ] Documentation complète

---

## 📊 MÉTRIQUES DE SUCCÈS

### Avant (État Actuel)
- ❌ 3 systèmes fragmentés
- ❌ HMAC insécurisé
- ❌ Pas de cron job
- ❌ Formats incohérents

### Après (Objectif)
- ✅ 1 système unifié
- ✅ HMAC sécurisé (Web Crypto API)
- ✅ Cron job configuré
- ✅ Formats standardisés
- ✅ Rate limiting actif
- ✅ Idempotence garantie

---

## 🔗 RESSOURCES

### Fichiers Clés à Examiner
- `src/lib/webhooks/webhook-system.ts` - Système général (HMAC insécurisé)
- `src/services/webhooks/digitalProductWebhooks.ts` - Système digitaux (✅ Correct)
- `src/services/webhooks/physicalProductWebhooks.ts` - Système physiques
- `supabase/functions/webhook-delivery/index.ts` - Edge Function
- `supabase/migrations/20250127_webhooks_system.sql` - Migration principale

### Documentation à Créer
- Guide d'intégration webhooks
- Format de payload standardisé
- Guide de migration
- Guide de troubleshooting

---

## 📝 NOTES FINALES

Ce système de webhooks nécessite une **refonte majeure** pour être production-ready. Les problèmes de sécurité sont critiques et doivent être corrigés immédiatement.

**Estimation de temps:** 3-4 semaines pour les priorités 1 et 2.

**Risque si non corrigé:** 
- 🔴 Sécurité compromise (signatures falsifiables)
- 🟠 Webhooks non livrés (pas de cron)
- 🟡 Maintenance complexe (systèmes fragmentés)

---

**Date de l'audit:** 2025-01-28  
**Auditeur:** AI Assistant  
**Version:** 1.0

