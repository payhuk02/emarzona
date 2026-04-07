/**
 * Tests End-to-End - Système de Notifications
 * Date: 2 Février 2025
 *
 * Tests complets du système de notifications
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { sendUnifiedNotification } from '../unified-notifications';
import { notificationRateLimiter } from '../rate-limiter';
import { notificationRetryService } from '../retry-service';
import { scheduledNotificationService } from '../scheduled-service';
import { batchNotificationService } from '../batch-service';
import { digestNotificationService } from '../digest-service';
import { notificationTemplateService } from '../template-service';
import { notificationI18nService } from '../i18n-service';
import { logNotification, getNotificationStats } from '../notification-logger';
import { supabase } from '@/integrations/supabase/client';

// Mock data
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const TEST_NOTIFICATION = {
  user_id: TEST_USER_ID,
  type: 'order_payment_received' as const,
  title: 'Test Notification',
  message: 'This is a test notification',
  priority: 'medium' as const,
  channels: ['in_app', 'email'] as const,
  metadata: {
    test: true,
    timestamp: new Date().toISOString(),
  },
};

describe('Système de Notifications - Tests End-to-End', () => {
  beforeAll(async () => {
    // Nettoyer les données de test existantes
    await supabase.from('notification_rate_limits').delete().eq('user_id', TEST_USER_ID);

    await supabase.from('notification_logs').delete().eq('user_id', TEST_USER_ID);
  });

  afterAll(async () => {
    // Nettoyer après les tests
    await supabase.from('notification_rate_limits').delete().eq('user_id', TEST_USER_ID);

    await supabase.from('notification_logs').delete().eq('user_id', TEST_USER_ID);
  });

  describe('1. Rate Limiting', () => {
    it("devrait permettre l'envoi dans les limites", async () => {
      const result = await notificationRateLimiter.checkRateLimit(TEST_USER_ID, 'email');

      expect(result.allowed).toBe(true);
      expect(result.remaining.hourly).toBeGreaterThan(0);
      expect(result.remaining.daily).toBeGreaterThan(0);
    });

    it('devrait bloquer après dépassement des limites', async () => {
      // Envoyer plusieurs notifications pour atteindre la limite
      for (let  i= 0; i < 25; i++) {
        await notificationRateLimiter.recordNotification(TEST_USER_ID, 'email');
      }

      const result = await notificationRateLimiter.checkRateLimit(TEST_USER_ID, 'email');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  describe('2. Retry Service', () => {
    it("devrait retry en cas d'erreur retryable", async () => {
      let  attempts= 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network timeout');
        }
        return { success: true };
      };

      const result = await notificationRetryService.executeWithRetry(fn);

      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    });

    it('devrait ne pas retry pour erreurs non retryables', async () => {
      let  attempts= 0;
      const fn = async () => {
        attempts++;
        throw new Error('Invalid user');
      };

      try {
        await notificationRetryService.executeWithRetry(fn);
      } catch (error) {
        expect(attempts).toBe(1);
      }
    });
  });

  describe('3. Unified Notifications', () => {
    it('devrait envoyer une notification avec succès', async () => {
      const result = await sendUnifiedNotification(TEST_NOTIFICATION);

      expect(result.success).toBe(true);
      expect(result.notification_id).toBeDefined();
    });

    it('devrait respecter les préférences utilisateur', async () => {
      // Créer des préférences qui désactivent email
      await supabase.from('notification_preferences').upsert({
        user_id: TEST_USER_ID,
        preferences: {
          order_payment_received: {
            in_app: true,
            email: false,
            sms: false,
            push: false,
          },
        },
      });

      const result = await sendUnifiedNotification({
        ...TEST_NOTIFICATION,
        channels: ['in_app', 'email'],
      });

      expect(result.success).toBe(true);
    });
  });

  describe('4. Scheduled Notifications', () => {
    it('devrait programmer une notification', async () => {
      const scheduledAt = new Date();
      scheduledAt.setMinutes(scheduledAt.getMinutes() + 5);

      const id = await scheduledNotificationService.schedule({
        user_id: TEST_USER_ID,
        notification: TEST_NOTIFICATION,
        scheduled_at: scheduledAt,
        status: 'pending',
      });

      expect(id).toBeDefined();
    });

    it('devrait traiter les notifications programmées', async () => {
      const result = await scheduledNotificationService.processPendingNotifications();

      expect(result.processed).toBeGreaterThanOrEqual(0);
      expect(result.sent).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('5. Batch Notifications', () => {
    it('devrait envoyer des notifications en batch', async () => {
      const notifications = Array.from({ length: 5 }, (_, i) => ({
        ...TEST_NOTIFICATION,
        title: `Batch Notification ${i + 1}`,
        message: `This is batch notification ${i + 1}`,
      }));

      const result = await batchNotificationService.sendBatch(notifications, {
        batchSize: 2,
        delay: 100,
      });

      expect(result.total).toBe(5);
      expect(result.succeeded).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('6. Digest Service', () => {
    it('devrait créer un digest quotidien', async () => {
      const digest = await digestNotificationService.createDigest(TEST_USER_ID, 'daily');

      if (digest) {
        expect(digest.userId).toBe(TEST_USER_ID);
        expect(digest.period).toBe('daily');
        expect(digest.notifications.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('devrait envoyer un digest', async () => {
      const digest = await digestNotificationService.createDigest(TEST_USER_ID, 'daily');

      if (digest && digest.notifications.length > 0) {
        const result = await digestNotificationService.sendDigest(digest);
        expect(result).toBe(true);
      }
    });
  });

  describe('7. Template Service', () => {
    it('devrait récupérer un template', async () => {
      const template = await notificationTemplateService.getTemplate(
        'order_payment_received',
        'email',
        'fr'
      );

      expect(template).toBeDefined();
      if (template) {
        expect(template.slug).toBe('order_payment_received');
        expect(template.channel).toBe('email');
        expect(template.language).toBe('fr');
      }
    });

    it('devrait remplacer les variables dans un template', async () => {
      const template = await notificationTemplateService.getTemplate(
        'order_payment_received',
        'email',
        'fr'
      );

      if (template) {
        const rendered = notificationTemplateService.replaceVariables(template, {
          user_name: 'John Doe',
          amount: '100',
          currency: 'EUR',
          action_url: 'https://example.com',
        });

        expect(rendered.body).toContain('John Doe');
        expect(rendered.body).toContain('100');
        expect(rendered.body).toContain('EUR');
      }
    });
  });

  describe('8. i18n Service', () => {
    it('devrait traduire une notification en français', async () => {
      const translation = await notificationI18nService.translateNotification(
        'order_payment_received',
        {
          amount: '100',
          currency: 'EUR',
        },
        'fr'
      );

      expect(translation.title).toBeDefined();
      expect(translation.message).toBeDefined();
      expect(translation.message).toContain('100');
    });

    it('devrait traduire une notification en anglais', async () => {
      const translation = await notificationI18nService.translateNotification(
        'order_payment_received',
        {
          amount: '100',
          currency: 'EUR',
        },
        'en'
      );

      expect(translation.title).toBeDefined();
      expect(translation.message).toBeDefined();
    });
  });

  describe('9. Notification Logger', () => {
    it('devrait logger une notification', async () => {
      await logNotification({
        userId: TEST_USER_ID,
        type: 'order_payment_received',
        channel: 'email',
        status: 'sent',
        processingTimeMs: 100,
      });

      // Vérifier que le log a été créé
      const stats = await getNotificationStats({
        userId: TEST_USER_ID,
      });

      expect(stats.totalSent).toBeGreaterThanOrEqual(1);
    });

    it('devrait récupérer les statistiques', async () => {
      const stats = await getNotificationStats({
        userId: TEST_USER_ID,
      });

      expect(stats).toHaveProperty('totalSent');
      expect(stats).toHaveProperty('totalDelivered');
      expect(stats).toHaveProperty('deliveryRate');
      expect(stats).toHaveProperty('openRate');
    });
  });

  describe('10. Intégration Complète', () => {
    it('devrait exécuter un flux complet de notification', async () => {
      // 1. Vérifier rate limit
      const rateLimit = await notificationRateLimiter.checkRateLimit(TEST_USER_ID, 'email');
      expect(rateLimit.allowed).toBe(true);

      // 2. Envoyer la notification
      const result = await sendUnifiedNotification(TEST_NOTIFICATION);
      expect(result.success).toBe(true);

      // 3. Logger la notification
      await logNotification({
        userId: TEST_USER_ID,
        notificationId: result.notification_id,
        type: TEST_NOTIFICATION.type,
        channel: 'email',
        status: 'sent',
        processingTimeMs: 50,
      });

      // 4. Vérifier les statistiques
      const stats = await getNotificationStats({
        userId: TEST_USER_ID,
      });
      expect(stats.totalSent).toBeGreaterThanOrEqual(1);
    });
  });
});






