# 📚 GUIDE UTILISATEUR - SYSTÈME DE NOTIFICATIONS

**Date :** 2 Février 2025  
**Version :** 1.0

---

## 📋 TABLE DES MATIÈRES

1. [Introduction](#introduction)
2. [Types de Notifications](#types-de-notifications)
3. [Utilisation de Base](#utilisation-de-base)
4. [Fonctionnalités Avancées](#fonctionnalités-avancées)
5. [Exemples de Code](#exemples-de-code)
6. [FAQ](#faq)

---

## 🎯 INTRODUCTION

Le système de notifications unifié permet d'envoyer des notifications à travers différents canaux (in-app, email, SMS, push) pour tous les types de produits de la plateforme.

### Caractéristiques Principales

- ✅ **Multi-canaux** : In-app, Email, SMS, Push
- ✅ **30+ types de notifications** : Couvre tous les événements
- ✅ **Templates centralisés** : Personnalisables par store
- ✅ **i18n** : Support multilingue (FR/EN)
- ✅ **Rate Limiting** : Contrôle du spam
- ✅ **Retry automatique** : Fiabilité garantie
- ✅ **Logging complet** : Analytics et debugging

---

## 📬 TYPES DE NOTIFICATIONS

### Produits Digitaux

```typescript
'digital_product_purchased'; // Produit acheté
'digital_product_download_ready'; // Téléchargement prêt
'digital_product_version_update'; // Nouvelle version
'digital_product_license_expiring'; // Licence expire bientôt
'digital_product_license_expired'; // Licence expirée
```

### Produits Physiques

```typescript
'physical_product_order_placed'; // Commande passée
'physical_product_order_confirmed'; // Commande confirmée
'physical_product_order_shipped'; // Commande expédiée
'physical_product_order_delivered'; // Commande livrée
'physical_product_order_cancelled'; // Commande annulée
'physical_product_low_stock'; // Stock faible
'physical_product_out_of_stock'; // Rupture de stock
'physical_product_back_in_stock'; // Retour en stock
```

### Services

```typescript
'service_booking_confirmed'; // Réservation confirmée
'service_booking_reminder'; // Rappel réservation
'service_booking_cancelled'; // Réservation annulée
'service_booking_completed'; // Réservation terminée
'service_payment_required'; // Paiement requis
```

### Cours

```typescript
'course_enrollment'; // Inscription au cours
'course_lesson_complete'; // Leçon terminée
'course_complete'; // Cours terminé
'course_certificate_ready'; // Certificat prêt
'course_new_content'; // Nouveau contenu
'course_quiz_passed'; // Quiz réussi
'course_quiz_failed'; // Quiz échoué
```

### Artistes

```typescript
'artist_product_purchased'; // Produit acheté
'artist_product_certificate_ready'; // Certificat d'authenticité prêt
'artist_product_edition_sold_out'; // Édition épuisée
'artist_product_shipping_update'; // Mise à jour expédition
```

### Général

```typescript
'order_payment_received'; // Paiement reçu
'order_payment_failed'; // Paiement échoué
'order_refund_processed'; // Remboursement traité
'affiliate_commission_earned'; // Commission gagnée
'affiliate_commission_paid'; // Commission payée
'product_review_received'; // Avis reçu
'system_announcement'; // Annonce système
```

---

## 🚀 UTILISATION DE BASE

### Envoyer une Notification Simple

```typescript
import { sendUnifiedNotification } from '@/lib/notifications/unified-notifications';

const result = await sendUnifiedNotification({
  user_id: 'user-id-here',
  type: 'order_payment_received',
  title: 'Paiement reçu',
  message: 'Votre paiement de 100 EUR a été confirmé.',
  priority: 'high',
  channels: ['in_app', 'email'],
  metadata: {
    order_id: 'order-123',
    amount: 100,
    currency: 'EUR',
  },
  action_url: '/orders/order-123',
  action_label: 'Voir la commande',
});

if (result.success) {
  console.log('Notification envoyée:', result.notification_id);
} else {
  console.error('Erreur:', result.error);
}
```

### Envoyer une Notification avec Template

```typescript
import { notificationTemplateService } from '@/lib/notifications/template-service';

// Récupérer et rendre un template
const rendered = await notificationTemplateService.renderTemplate(
  'order_payment_received',
  'email',
  {
    user_name: 'John Doe',
    amount: '100',
    currency: 'EUR',
    action_url: 'https://example.com/orders/123',
  },
  { language: 'fr' }
);

if (rendered) {
  // Utiliser rendered.subject, rendered.body, rendered.html
  console.log('Sujet:', rendered.subject);
  console.log('Corps:', rendered.body);
}
```

### Envoyer une Notification avec i18n

```typescript
import { notificationI18nService } from '@/lib/notifications/i18n-service';

// Obtenir la langue de l'utilisateur
const language = await notificationI18nService.getUserLanguage(userId);

// Traduire la notification
const translation = await notificationI18nService.translateNotification(
  'order_payment_received',
  {
    amount: '100',
    currency: 'EUR',
  },
  language
);

// Envoyer avec la traduction
await sendUnifiedNotification({
  user_id: userId,
  type: 'order_payment_received',
  title: translation.title,
  message: translation.message,
  action_label: translation.actionLabel,
  channels: ['in_app', 'email'],
});
```

---

## 🎯 FONCTIONNALITÉS AVANCÉES

### Notifications Programmées

```typescript
import { scheduledNotificationService } from '@/lib/notifications/scheduled-service';

// Programmer une notification pour plus tard
const scheduledId = await scheduledNotificationService.schedule({
  user_id: userId,
  notification: {
    user_id: userId,
    type: 'service_booking_reminder',
    title: 'Rappel de réservation',
    message: 'Votre réservation est prévue demain à 14h.',
    channels: ['email', 'push'],
  },
  scheduled_at: new Date('2025-02-03T14:00:00Z'),
  status: 'pending',
});

console.log('Notification programmée:', scheduledId);
```

### Envoi en Batch

```typescript
import { batchNotificationService } from '@/lib/notifications/batch-service';

const notifications = [
  { user_id: 'user1', type: 'order_payment_received', ... },
  { user_id: 'user2', type: 'order_payment_received', ... },
  { user_id: 'user3', type: 'order_payment_received', ... },
];

const result = await batchNotificationService.sendBatch(notifications, {
  batchSize: 10,
  delay: 100, // ms entre les batches
  priority: 'normal',
  continueOnError: true,
  onProgress: (processed, total, succeeded, failed) => {
    console.log(`Progression: ${processed}/${total} (${succeeded} réussies, ${failed} échouées)`);
  },
});

console.log(`Total: ${result.total}, Réussies: ${result.succeeded}, Échouées: ${result.failed}`);
```

### Digests Quotidiens/Hebdomadaires

```typescript
import { digestNotificationService } from '@/lib/notifications/digest-service';

// Créer un digest quotidien
const digest = await digestNotificationService.createDigest(userId, 'daily');

if (digest && digest.notifications.length > 0) {
  // Envoyer le digest
  await digestNotificationService.sendDigest(digest);
}
```

### Notifications Intelligentes

```typescript
import { intelligentNotificationService } from '@/lib/notifications/intelligent-service';

// Obtenir le contexte utilisateur
const context = await intelligentNotificationService.getUserContext(userId);

// Déterminer si on doit envoyer
const result = await intelligentNotificationService.shouldSendNotification(notification, context);

if (result.shouldSend) {
  await sendUnifiedNotification(notification);
} else {
  // Programmer pour plus tard
  const bestTime = await intelligentNotificationService.findBestTime(notification, context);
  await scheduledNotificationService.schedule({
    user_id: userId,
    notification,
    scheduled_at: bestTime,
    status: 'pending',
  });
}
```

### Groupement de Notifications

```typescript
import { notificationGroupingService } from '@/lib/notifications/grouping-service';

// Grouper les notifications d'un utilisateur
const grouped = await notificationGroupingService.groupUserNotifications(userId, {
  unreadOnly: true,
  limit: 50,
  groupByType: true,
  groupByTimeWindow: 60, // minutes
});

// Afficher les groupes
grouped.forEach(group => {
  console.log(`${group.title}: ${group.count} notifications`);
  console.log('Dernière:', group.latest.title);
});
```

---

## 📊 STATISTIQUES ET LOGGING

### Obtenir les Statistiques

```typescript
import { getNotificationStats } from '@/lib/notifications/notification-logger';

const stats = await getNotificationStats({
  userId: userId,
  startDate: new Date('2025-01-01'),
  endDate: new Date(),
});

console.log('Total envoyées:', stats.totalSent);
console.log('Taux de livraison:', stats.deliveryRate, '%');
console.log("Taux d'ouverture:", stats.openRate, '%');
console.log('Taux de clic:', stats.clickRate, '%');
```

### Logger une Notification

```typescript
import { logNotification } from '@/lib/notifications/notification-logger';

const startTime = Date.now();

// ... envoyer la notification ...

await logNotification({
  userId: userId,
  notificationId: result.notification_id,
  type: 'order_payment_received',
  channel: 'email',
  status: 'sent',
  processingTimeMs: Date.now() - startTime,
});
```

---

## ❓ FAQ

### Comment désactiver les notifications pour un utilisateur ?

```typescript
// Mettre à jour les préférences
await supabase.from('notification_preferences').upsert({
  user_id: userId,
  preferences: {
    order_payment_received: {
      in_app: false,
      email: false,
      sms: false,
      push: false,
    },
  },
});
```

### Comment gérer les erreurs de rate limiting ?

```typescript
import { notificationRateLimiter } from '@/lib/notifications/rate-limiter';

const rateLimit = await notificationRateLimiter.checkRateLimit(userId, 'email');

if (!rateLimit.allowed) {
  console.warn('Rate limit atteint:', rateLimit.reason);
  console.log('Reset dans:', rateLimit.resetAt.hourly);
  // Programmer pour plus tard ou utiliser un autre canal
}
```

### Comment personnaliser les templates ?

```typescript
import { notificationTemplateService } from '@/lib/notifications/template-service';

// Créer ou mettre à jour un template
await notificationTemplateService.upsertTemplate({
  slug: 'order_payment_received',
  name: 'Paiement Reçu',
  channel: 'email',
  language: 'fr',
  subject: '✅ Paiement reçu - {{platform_name}}',
  body: 'Bonjour {{user_name}}, votre paiement de {{amount}} {{currency}} a été confirmé.',
  html: '<h2>✅ Paiement reçu</h2><p>Bonjour {{user_name}}, votre paiement de {{amount}} {{currency}} a été confirmé.</p>',
  variables: ['user_name', 'amount', 'currency'],
  store_id: 'store-id-here', // Optionnel : template spécifique au store
  is_active: true,
});
```

### Comment tester les notifications en développement ?

```typescript
// Utiliser un canal de test
const result = await sendUnifiedNotification({
  ...notification,
  channels: ['in_app'], // Seulement in-app en dev
  metadata: {
    ...notification.metadata,
    test: true,
  },
});
```

---

## 🔗 RESSOURCES

- **Documentation API :** Voir les fichiers TypeScript dans `src/lib/notifications/`
- **Templates :** Voir `supabase/migrations/20250202_notification_default_templates*.sql`
- **Traductions :** Voir `supabase/migrations/20250202_notification_translations.sql`

---

**Document généré le :** 2 Février 2025  
**Version :** 1.0
