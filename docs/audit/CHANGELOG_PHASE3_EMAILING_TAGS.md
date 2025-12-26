# 📝 CHANGELOG - Phase 3 Corrections Système Emailing & Tags

## Date: 2 Février 2025

---

## ✅ Améliorations Implémentées (Phase 3 - Optimisations)

### 1. Correction Erreur SQL `add_user_tag` ✅

**Fichier**: `supabase/migrations/20250202_add_tag_categories.sql`

**Problème**: Erreur "function name add_user_tag is not unique" car deux fonctions avec signatures différentes existaient.

**Solution**: Ajout de `DROP FUNCTION IF EXISTS` avant la création de la nouvelle fonction pour supprimer l'ancienne version.

```sql
-- Supprimer l'ancienne fonction si elle existe (sans le paramètre category)
DROP FUNCTION IF EXISTS public.add_user_tag(UUID, UUID, TEXT, JSONB);

-- Créer la nouvelle fonction avec le paramètre category
CREATE OR REPLACE FUNCTION public.add_user_tag(...)
```

### 2. Système d'Expiration de Tags ✅

**Fichier**: `supabase/migrations/20250202_add_tag_expiration_cleanup.sql`

**Fonctionnalités**:

- ✅ Colonne `expires_at` ajoutée à `email_user_tags`
- ✅ Index pour améliorer les performances
- ✅ Vue `active_email_user_tags` qui exclut automatiquement les tags expirés
- ✅ Support de l'expiration dans `add_user_tag` via paramètre `p_expires_in_days`

**Utilisation**:

```sql
-- Ajouter un tag qui expire dans 30 jours
SELECT add_user_tag(
  'user-id',
  'store-id',
  'trial_user',
  '{}'::jsonb,
  'behavior',
  30  -- expire dans 30 jours
);
```

**Fonction SQL**:

```sql
-- Récupérer les tags expirant bientôt
SELECT * FROM get_expiring_tags('store-id', 7); -- Tags expirant dans 7 jours
```

### 3. Nettoyage Automatique des Tags ✅

**Fichier**: `supabase/migrations/20250202_add_tag_expiration_cleanup.sql`

**Fonctions SQL créées**:

#### `cleanup_expired_tags()`

Supprime tous les tags expirés et retourne les statistiques.

```sql
SELECT * FROM cleanup_expired_tags();
-- Retourne: { deleted_count: 15, deleted_tags: [...] }
```

#### `cleanup_unused_tags(store_id?, unused_days)`

Supprime les tags non utilisés depuis X jours (par défaut 90).

```sql
-- Nettoyer les tags non utilisés depuis 90 jours pour un store
SELECT * FROM cleanup_unused_tags('store-id', 90);

-- Nettoyer tous les stores
SELECT * FROM cleanup_unused_tags(NULL, 90);
```

**Caractéristiques**:

- ✅ Ne supprime pas les tags système (`category = 'system'`)
- ✅ Configurable par store ou global
- ✅ Retourne les détails des tags supprimés
- ✅ Logging complet

### 4. Service TypeScript Mis à Jour ✅

**Fichier**: `src/lib/email/email-tag-service.ts`

**Nouvelles méthodes**:

- ✅ `addTag(..., expiresInDays?)` - Support de l'expiration
- ✅ `cleanupExpiredTags()` - Nettoyer les tags expirés
- ✅ `cleanupUnusedTags(storeId?, unusedDays)` - Nettoyer les tags non utilisés
- ✅ `getExpiringTags(storeId?, daysAhead)` - Récupérer les tags expirant bientôt

**Exemple d'utilisation**:

```typescript
import { emailTagService } from '@/lib/email/email-tag-service';

// Ajouter un tag avec expiration
await emailTagService.addTag(
  userId,
  storeId,
  'trial_user',
  { source: 'signup' },
  'behavior',
  30 // expire dans 30 jours
);

// Nettoyer les tags expirés
const cleanup = await emailTagService.cleanupExpiredTags();
console.log(`Deleted ${cleanup.deleted_count} expired tags`);

// Nettoyer les tags non utilisés depuis 90 jours
const unused = await emailTagService.cleanupUnusedTags(storeId, 90);

// Récupérer les tags expirant dans 7 jours
const expiring = await emailTagService.getExpiringTags(storeId, 7);
```

### 5. Service Analytics Avancées ✅

**Fichier**: `src/lib/email/email-analytics-service.ts`

**Fonctionnalités**:

- ✅ Analytics globales pour un store (taux de livraison, ouverture, clics, etc.)
- ✅ Analytics des tags (utilisation, popularité, catégories)
- ✅ Analytics des segments (membres, campagnes, performances)
- ✅ Performances des campagnes (métriques détaillées)
- ✅ Tags expirant bientôt

**Méthodes disponibles**:

#### `getStoreAnalytics(storeId, startDate?, endDate?)`

Retourne les statistiques globales d'emailing pour un store.

```typescript
const analytics = await emailAnalyticsService.getStoreAnalytics(
  storeId,
  '2025-01-01',
  '2025-02-01'
);

// Retourne:
// {
//   total_sent: 1000,
//   total_delivered: 980,
//   total_opened: 450,
//   total_clicked: 120,
//   delivery_rate: 98.0,
//   open_rate: 45.9,
//   click_rate: 12.2,
//   ...
// }
```

#### `getTagAnalytics(storeId)`

Retourne les statistiques d'utilisation des tags.

```typescript
const tagStats = await emailAnalyticsService.getTagAnalytics(storeId);
// Retourne: [{ tag: 'vip', category: 'segment', user_count: 150, ... }]
```

#### `getSegmentAnalytics(storeId)`

Retourne les performances des segments.

```typescript
const segmentStats = await emailAnalyticsService.getSegmentAnalytics(storeId);
// Retourne: [{ segment_id: '...', member_count: 500, avg_open_rate: 45.2, ... }]
```

#### `getCampaignPerformance(storeId, startDate?, endDate?)`

Retourne les performances détaillées des campagnes.

```typescript
const campaigns = await emailAnalyticsService.getCampaignPerformance(storeId);
// Retourne: [{ campaign_id: '...', sent: 1000, open_rate: 45.2, revenue: 5000, ... }]
```

#### `getExpiringTags(storeId, daysAhead)`

Retourne les tags qui vont expirer bientôt.

```typescript
const expiring = await emailAnalyticsService.getExpiringTags(storeId, 7);
// Retourne: [{ tag: 'trial_user', expires_at: '2025-02-09', days_until_expiry: 5, ... }]
```

---

## 📊 Résumé des Améliorations

| Amélioration                       | Statut | Fichier                                    |
| ---------------------------------- | ------ | ------------------------------------------ |
| Correction erreur SQL add_user_tag | ✅     | `20250202_add_tag_categories.sql`          |
| Système d'expiration de tags       | ✅     | `20250202_add_tag_expiration_cleanup.sql`  |
| Nettoyage automatique des tags     | ✅     | `20250202_add_tag_expiration_cleanup.sql`  |
| Service analytics avancées         | ✅     | `src/lib/email/email-analytics-service.ts` |
| Service TypeScript mis à jour      | ✅     | `src/lib/email/email-tag-service.ts`       |

---

## 🚀 Bénéfices

### Maintenance

- ✅ **Nettoyage automatique** des tags expirés et non utilisés
- ✅ **Prévention de l'accumulation** de tags obsolètes
- ✅ **Gestion de la base de données** optimisée

### Analytics

- ✅ **Visibilité complète** sur les performances emailing
- ✅ **Statistiques détaillées** par tag, segment, campagne
- ✅ **Métriques en temps réel** pour prise de décision

### Organisation

- ✅ **Tags temporaires** avec expiration automatique
- ✅ **Nettoyage programmé** possible via cron jobs
- ✅ **Vue active** qui exclut automatiquement les tags expirés

---

## 📝 Notes Techniques

### Migrations SQL

Les migrations doivent être exécutées dans cet ordre:

1. `20250201_emailing_advanced_foundations.sql`
2. `20250201_emailing_functions_base.sql`
3. `20250202_fix_emailing_tags_workflows_critical.sql`
4. `20250202_add_tag_categories.sql` (corrigée)
5. `20250202_add_tag_expiration_cleanup.sql` (nouvelle)

### Cron Jobs Recommandés

Pour automatiser le nettoyage, créer des cron jobs Supabase:

```sql
-- Nettoyer les tags expirés quotidiennement à 2h du matin
SELECT cron.schedule(
  'cleanup-expired-tags',
  '0 2 * * *',
  $$SELECT cleanup_expired_tags()$$
);

-- Nettoyer les tags non utilisés hebdomadairement
SELECT cron.schedule(
  'cleanup-unused-tags',
  '0 3 * * 0',
  $$SELECT cleanup_unused_tags(NULL, 90)$$
);
```

### Vue Active

La vue `active_email_user_tags` peut être utilisée à la place de la table pour exclure automatiquement les tags expirés:

```sql
-- Utiliser la vue au lieu de la table
SELECT * FROM active_email_user_tags WHERE store_id = 'store-id';
```

---

## 🔄 Prochaines Étapes (Optionnel)

1. ⏳ Dashboard de monitoring UI
2. ⏳ Tests unitaires complets
3. ⏳ Documentation API
4. ⏳ Alertes automatiques pour tags expirant

---

**Date de mise à jour**: 2 Février 2025  
**Version**: 1.3.0
