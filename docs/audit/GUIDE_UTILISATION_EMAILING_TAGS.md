# 📖 GUIDE D'UTILISATION - Système Emailing & Tags
## Date: 2 Février 2025

---

## 🚀 DÉMARRAGE RAPIDE

### 1. Exécuter les Migrations SQL

Exécutez les migrations dans cet ordre dans Supabase SQL Editor:

```sql
-- 1. Corrections critiques
\i supabase/migrations/20250202_fix_emailing_tags_workflows_critical.sql

-- 2. Catégories de tags
\i supabase/migrations/20250202_add_tag_categories.sql

-- 3. Expiration et nettoyage
\i supabase/migrations/20250202_add_tag_expiration_cleanup.sql

-- 4. Cron jobs
\i supabase/migrations/20250202_setup_email_tags_cron_jobs.sql
```

### 2. Activer l'Extension pg_cron

Dans Supabase Dashboard:
1. Aller dans **Database** > **Extensions**
2. Rechercher `pg_cron`
3. Cliquer sur **Enable**

### 3. Accéder aux Dashboards

- **Tags**: `/dashboard/emails/tags`
- **Analytics**: `/dashboard/emails/analytics`

---

## 📧 UTILISATION DU SYSTÈME D'EMAILING

### Envoyer un Email

```typescript
import { sendEmail } from '@/lib/sendgrid';

const result = await sendEmail({
  templateSlug: 'welcome-user',
  to: 'user@example.com',
  toName: 'John Doe',
  userId: 'user-id',
  variables: {
    user_name: 'John Doe',
  },
});

// Le rate limiting et retry sont automatiques !
```

### Créer une Campagne

```typescript
import { EmailCampaignService } from '@/lib/email/email-campaign-service';

const campaign = await EmailCampaignService.createCampaign({
  store_id: 'store-id',
  name: 'Promotion Noël',
  type: 'promotional',
  template_id: 'template-id',
  audience_type: 'segment',
  segment_id: 'segment-id',
});
```

---

## 🏷️ UTILISATION DU SYSTÈME DE TAGS

### Ajouter un Tag

```typescript
import { emailTagService } from '@/lib/email/email-tag-service';

// Tag simple
await emailTagService.addTag(userId, storeId, 'vip');

// Tag avec catégorie
await emailTagService.addTag(
  userId,
  storeId,
  'premium',
  { source: 'manual' },
  'segment'
);

// Tag avec expiration (30 jours)
await emailTagService.addTag(
  userId,
  storeId,
  'trial_user',
  { source: 'signup' },
  'behavior',
  30  // expire dans 30 jours
);
```

### Supprimer un Tag

```typescript
await emailTagService.removeTag(userId, storeId, 'vip');
```

### Récupérer les Tags

```typescript
// Tous les tags d'un utilisateur
const tags = await emailTagService.getUserTags(userId, storeId);

// Tags par catégorie
const behaviorTags = await emailTagService.getUserTags(userId, storeId, 'behavior');

// Utilisateurs avec un tag spécifique
const vipUsers = await emailTagService.getUsersByTag(storeId, 'vip');
```

### Nettoyer les Tags

```typescript
// Nettoyer les tags expirés
const result = await emailTagService.cleanupExpiredTags();
console.log(`${result.deleted_count} tags supprimés`);

// Nettoyer les tags non utilisés depuis 90 jours
const unused = await emailTagService.cleanupUnusedTags(storeId, 90);
```

---

## 📊 UTILISATION DES ANALYTICS

### Analytics Globales

```typescript
import { emailAnalyticsService } from '@/lib/email/email-analytics-service';

const analytics = await emailAnalyticsService.getStoreAnalytics(
  storeId,
  '2025-01-01',
  '2025-02-01'
);

console.log(`Taux d'ouverture: ${analytics.open_rate}%`);
console.log(`Taux de clic: ${analytics.click_rate}%`);
```

### Analytics des Tags

```typescript
const tagStats = await emailAnalyticsService.getTagAnalytics(storeId);
// Retourne: [{ tag: 'vip', category: 'segment', user_count: 150, ... }]
```

### Performances des Campagnes

```typescript
const campaigns = await emailAnalyticsService.getCampaignPerformance(storeId);
campaigns.forEach(campaign => {
  console.log(`${campaign.campaign_name}: ${campaign.open_rate}% ouverture`);
});
```

---

## 🔄 UTILISATION DES WORKFLOWS

### Créer un Workflow avec Tags

```typescript
import { EmailWorkflowService } from '@/lib/email/email-workflow-service';

const workflow = await EmailWorkflowService.createWorkflow({
  store_id: storeId,
  name: 'Bienvenue Nouveau Client',
  trigger_type: 'event',
  trigger_config: {
    event: 'user_registered',
  },
  actions: [
    {
      type: 'add_tag',
      config: {
        tag: 'new_customer',
        context: { source: 'workflow' },
      },
      order: 1,
    },
    {
      type: 'send_email',
      config: {
        template_slug: 'welcome-user',
      },
      order: 2,
      critical: true,
    },
  ],
});
```

### Exécuter un Workflow

```typescript
await EmailWorkflowService.executeWorkflow(workflowId, {
  user_id: userId,
  email: 'user@example.com',
  store_id: storeId,
});
```

---

## 📈 SEGMENTS DYNAMIQUES AVEC TAGS

### Créer un Segment avec Critères de Tags

```typescript
import { EmailSegmentService } from '@/lib/email/email-segment-service';

const segment = await EmailSegmentService.createSegment({
  store_id: storeId,
  name: 'Clients VIP',
  type: 'dynamic',
  criteria: {
    tags: ['vip', 'premium'],  // Utilisateurs avec ces tags
    excluded_tags: ['churned'], // Exclure ces tags
    min_orders: 3,
    min_total_spent: 1000,
  },
});

// Calculer les membres
const members = await EmailSegmentService.calculateSegmentMembers(segment.id);
```

---

## ⚙️ GESTION DES CRON JOBS

### Vérifier l'État des Cron Jobs

```sql
SELECT * FROM get_email_tags_cron_jobs_status();
```

### Activer/Désactiver un Cron Job

```sql
-- Désactiver
SELECT toggle_email_tags_cron_job('cleanup-expired-email-tags', false);

-- Activer
SELECT toggle_email_tags_cron_job('cleanup-expired-email-tags', true);
```

### Via TypeScript

```typescript
// Dans le dashboard, utilisez les fonctions RPC
const { data, error } = await supabase.rpc('get_email_tags_cron_jobs_status');
const { data: toggled } = await supabase.rpc('toggle_email_tags_cron_job', {
  p_job_name: 'cleanup-expired-email-tags',
  p_active: true,
});
```

---

## 🎯 EXEMPLES D'UTILISATION

### Scénario 1: Taguer un Nouveau Client

```typescript
// Lors de l'inscription
await emailTagService.addTag(
  userId,
  storeId,
  'new_customer',
  { source: 'signup', date: new Date().toISOString() },
  'behavior',
  30  // Tag expire après 30 jours
);

// Envoyer email de bienvenue
await sendEmail({
  templateSlug: 'welcome-user',
  to: userEmail,
  toName: userName,
  userId,
  variables: { user_name: userName },
});
```

### Scénario 2: Segmenter par Tags

```typescript
// Créer un segment pour les clients VIP
const vipSegment = await EmailSegmentService.createSegment({
  store_id: storeId,
  name: 'Clients VIP',
  type: 'dynamic',
  criteria: {
    tags: ['vip'],
    min_total_spent: 500,
  },
});

// Créer une campagne pour ce segment
const campaign = await EmailCampaignService.createCampaign({
  store_id: storeId,
  name: 'Offre Exclusive VIP',
  type: 'promotional',
  audience_type: 'segment',
  segment_id: vipSegment.id,
  template_id: 'vip-offer-template-id',
});
```

### Scénario 3: Workflow Automatique

```typescript
// Créer un workflow qui:
// 1. Ajoute le tag "abandoned_cart" après 24h
// 2. Envoie un email de récupération après 48h
// 3. Supprime le tag si l'utilisateur complète la commande

const workflow = await EmailWorkflowService.createWorkflow({
  store_id: storeId,
  name: 'Récupération Panier Abandonné',
  trigger_type: 'event',
  trigger_config: {
    event: 'cart_abandoned',
  },
  actions: [
    {
      type: 'add_tag',
      config: { tag: 'abandoned_cart' },
      order: 1,
    },
    {
      type: 'wait',
      config: { duration: 172800 }, // 48h en secondes
      order: 2,
    },
    {
      type: 'send_email',
      config: { template_slug: 'abandoned-cart-recovery' },
      order: 3,
    },
  ],
});
```

---

## 🔍 DÉBOGAGE

### Vérifier les Tags d'un Utilisateur

```typescript
const tags = await emailTagService.getUserTags(userId, storeId);
console.log('Tags:', tags);
```

### Vérifier les Tags Expirant

```typescript
const expiring = await emailTagService.getExpiringTags(storeId, 7);
console.log('Tags expirant dans 7 jours:', expiring);
```

### Vérifier les Statistiques du Rate Limiter

```typescript
import { emailRateLimiter } from '@/lib/email/email-rate-limiter';

const stats = emailRateLimiter.getStats();
console.log('Queue:', stats.queueLength);
console.log('Emails cette seconde:', stats.currentSecondCount);
```

---

## 📝 NOTES IMPORTANTES

### Validation des Tags
- Les tags sont automatiquement normalisés (lowercase, trim)
- Longueur maximale: 50 caractères
- Caractères autorisés: lettres minuscules, chiffres, underscore, tiret
- Format: `^[a-z0-9_-]+$`

### Catégories de Tags
- `behavior`: Tags basés sur le comportement
- `segment`: Tags pour segmentation
- `custom`: Tags personnalisés
- `system`: Tags générés automatiquement

### Rate Limiting
- Limite par défaut: 10 emails/seconde
- Ajustable selon votre plan SendGrid
- Queue automatique pour gérer les pics

### Retry Automatique
- 3 tentatives par défaut
- Backoff exponentiel: 1s → 2s → 4s
- Jitter pour éviter les thundering herds

---

**Version**: 1.4.0  
**Dernière mise à jour**: 2 Février 2025

