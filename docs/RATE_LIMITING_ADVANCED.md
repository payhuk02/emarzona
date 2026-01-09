# 🛡️ RATE LIMITING AVANCÉ - GUIDE D'IMPLÉMENTATION

**Date** : 8 Janvier 2025  
**Statut** : ✅ Système de base implémenté, améliorations recommandées

---

## 📋 ÉTAT ACTUEL

### ✅ Système Implémenté

1. **Edge Function Supabase** (`supabase/functions/rate-limiter/index.ts`)
   - ✅ Rate limiting par IP et userId
   - ✅ Support de plusieurs endpoints
   - ✅ Headers HTTP standards (X-RateLimit-\*)
   - ✅ Logging dans table `rate_limit_log`

2. **Client-side Rate Limiter** (`src/lib/rate-limiter.ts`)
   - ✅ Cache local pour éviter appels répétés
   - ✅ Hook React `useRateLimit`
   - ✅ Middleware `withRateLimit` avec retry
   - ✅ Décorateur `rateLimited`

3. **Rate Limiters Spécialisés**
   - ✅ Moneroo (`src/lib/moneroo-rate-limiter.ts`)
   - ✅ Notifications (`src/lib/notifications/rate-limiter.ts`)
   - ✅ Emails (`src/lib/email/email-rate-limiter.ts`)

---

## 🎯 AMÉLIORATIONS RECOMMANDÉES

### 1. Redis Rate Limiting (Priorité Haute)

**Problème** : Le système actuel utilise Supabase PostgreSQL, ce qui peut être lent sous charge élevée.

**Solution** : Migrer vers Redis pour un rate limiting plus performant.

**Avantages** :

- ⚡ Performance : Redis est optimisé pour ce cas d'usage
- 📈 Scalabilité : Supporte des millions de requêtes/seconde
- 🔄 Atomicité : Opérations atomiques garanties
- 💾 Moins de charge sur PostgreSQL

**Implémentation** :

```typescript
// supabase/functions/rate-limiter-redis/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Utiliser Upstash Redis ou Redis Cloud
const redis = createRedisClient(Deno.env.get('REDIS_URL'));

async function checkRateLimitRedis(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  // Utiliser Redis Sorted Set pour fenêtre glissante
  const pipeline = redis.pipeline();

  // Supprimer les entrées expirées
  pipeline.zremrangebyscore(key, 0, windowStart);

  // Compter les requêtes dans la fenêtre
  pipeline.zcard(key);

  // Ajouter la requête actuelle
  pipeline.zadd(key, now, `${now}-${Math.random()}`);

  // Définir expiration
  pipeline.expire(key, windowSeconds);

  const results = await pipeline.exec();
  const count = results[1] as number;

  const allowed = count < limit;
  const remaining = Math.max(0, limit - count);
  const resetAt = new Date(now + windowSeconds * 1000);

  return { allowed, remaining, resetAt };
}
```

---

### 2. Rate Limiting par Store (Priorité Moyenne)

**Problème** : Le rate limiting actuel est global ou par utilisateur, mais pas par store.

**Solution** : Ajouter le support pour rate limiting par store.

**Utilisation** :

```typescript
// Rate limiting par store pour les API critiques
const result = await checkRateLimit('api', userId, false, storeId);

// Configuration dans Edge Function
const RATE_LIMITS = {
  'store-api': {
    maxRequests: 1000,
    windowSeconds: 60,
    perStore: true, // Nouveau flag
  },
};
```

---

### 3. Rate Limiting Adaptatif (Priorité Moyenne)

**Problème** : Les limites sont fixes, pas adaptatives selon la charge.

**Solution** : Implémenter un système de rate limiting adaptatif.

**Fonctionnalités** :

- Réduire automatiquement les limites en cas de charge élevée
- Augmenter les limites pour les utilisateurs premium
- Détection automatique d'attaques DDoS

---

### 4. Configuration Supabase Rate Limiting (Priorité Basse)

**Problème** : Supabase a son propre rate limiting, mais il n'est pas configuré.

**Solution** : Configurer le rate limiting Supabase au niveau du projet.

**Configuration** :

1. Aller dans Supabase Dashboard > Settings > API
2. Configurer les limites par défaut :
   - **Anonymous requests** : 100/minute
   - **Authenticated requests** : 1000/minute
   - **Service role requests** : 10000/minute

3. Configurer les limites par table (optionnel) :
   - Via RLS policies
   - Via Edge Functions

---

## 📊 CONFIGURATION ACTUELLE

### Limites par Endpoint

```typescript
const RATE_LIMITS = {
  default: { maxRequests: 100, windowSeconds: 60 },
  auth: { maxRequests: 5, windowSeconds: 60 }, // Login/Register
  api: { maxRequests: 1000, windowSeconds: 60 },
  webhook: { maxRequests: 60, windowSeconds: 60 },
  payment: { maxRequests: 10, windowSeconds: 60 },
  upload: { maxRequests: 20, windowSeconds: 60 },
  search: { maxRequests: 30, windowSeconds: 60 },
};
```

### Endpoints Protégés

- ✅ Moneroo API calls (10 req/min)
- ✅ Webhook calls (60 req/min)
- ⚠️ Auth endpoints (5 req/min) - À améliorer
- ⚠️ File uploads (20 req/min) - À améliorer
- ⚠️ Product creation - Non protégé
- ⚠️ Order processing - Non protégé

---

## 🔧 IMPLÉMENTATION RECOMMANDÉE

### Phase 1 : Améliorer Rate Limiting Auth (Priorité Critique)

**Fichier** : `src/lib/auth-rate-limiter.ts`

```typescript
import { checkRateLimit } from './rate-limiter';

export async function checkAuthRateLimit(
  action: 'login' | 'register' | 'reset-password' | 'verify-2fa',
  identifier: string // email ou userId
): Promise<boolean> {
  const result = await checkRateLimit('auth', identifier);

  if (!result.allowed) {
    // Logger la tentative de rate limit dépassé
    logger.warn('[AuthRateLimit] Rate limit exceeded', {
      action,
      identifier: identifier.substring(0, 3) + '***', // Masquer l'email
    });
  }

  return result.allowed;
}
```

**Utilisation** :

```typescript
// Dans les composants d'authentification
const canLogin = await checkAuthRateLimit('login', email);
if (!canLogin) {
  toast.error('Trop de tentatives. Veuillez réessayer dans quelques minutes.');
  return;
}
```

---

### Phase 2 : Rate Limiting Product Creation (Priorité Haute)

**Fichier** : `src/hooks/useProductManagement.ts`

```typescript
import { withRateLimit } from '@/lib/rate-limiter';

export const useProductManagement = () => {
  const createProduct = async (data: ProductData) => {
    return withRateLimit(
      'product-creation',
      async () => {
        // Logique de création de produit
        return await supabase.from('products').insert(data);
      },
      {
        userId: currentUser.id,
        retry: false, // Pas de retry pour création produit
      }
    );
  };
};
```

---

### Phase 3 : Configuration Supabase Dashboard (Priorité Basse)

1. **Configurer les limites API** :
   - Dashboard > Settings > API > Rate Limiting
   - Anonymous: 100/min
   - Authenticated: 1000/min

2. **Configurer les limites par table** (via RLS) :
   ```sql
   -- Exemple: Limiter les inserts sur products
   CREATE POLICY "rate_limit_products_insert"
   ON products FOR INSERT
   USING (
     (SELECT COUNT(*) FROM products
      WHERE store_id = NEW.store_id
      AND created_at > NOW() - INTERVAL '1 minute') < 10
   );
   ```

---

## 📈 MÉTRIQUES ET MONITORING

### Métriques à Surveiller

1. **Taux de rate limit dépassé** par endpoint
2. **Temps de réponse** du rate limiter
3. **Distribution des requêtes** par utilisateur/store
4. **Pic de trafic** détecté

### Dashboard Supabase

Créer un dashboard pour visualiser :

- Nombre de rate limits dépassés par jour
- Top utilisateurs/stores avec rate limits
- Endpoints les plus sollicités

---

## ✅ CHECKLIST IMPLÉMENTATION

### Phase 1 - Rate Limiting Auth (Priorité Critique)

- [ ] Créer `src/lib/auth-rate-limiter.ts`
- [ ] Intégrer dans composants login/register
- [ ] Intégrer dans password reset
- [ ] Intégrer dans 2FA verification
- [ ] Tests unitaires

### Phase 2 - Rate Limiting Product Creation (Priorité Haute)

- [ ] Intégrer `withRateLimit` dans `useProductManagement`
- [ ] Ajouter endpoint `product-creation` dans Edge Function
- [ ] Tests d'intégration

### Phase 3 - Redis Migration (Priorité Moyenne)

- [ ] Créer compte Redis (Upstash ou Redis Cloud)
- [ ] Créer Edge Function `rate-limiter-redis`
- [ ] Migrer progressivement les endpoints
- [ ] Comparer performances

### Phase 4 - Configuration Supabase (Priorité Basse)

- [ ] Configurer limites API dans Dashboard
- [ ] Ajouter RLS policies pour rate limiting par table
- [ ] Documenter les limites

---

## 📝 NOTES

- Le système actuel utilise PostgreSQL, ce qui est fonctionnel mais peut être amélioré
- Redis est recommandé pour une meilleure performance à grande échelle
- Les limites actuelles sont conservatrices et peuvent être ajustées selon les besoins
- Le rate limiting par store est important pour un système multi-tenant

---

**Prochaine étape** : Implémenter Phase 1 (Rate Limiting Auth) pour protéger les endpoints critiques
