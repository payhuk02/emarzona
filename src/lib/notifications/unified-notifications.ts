/**
 * Unified Notifications System for All Product Types
 * Date: 28 Janvier 2025
 *
 * Système de notifications unifié pour tous les types de produits
 * (Digital, Physical, Service, Course, Artist)
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { notificationRateLimiter } from './rate-limiter';
import { notificationRetryService } from './retry-service';
import { logNotification } from './notification-logger';
import { notificationTemplateService } from './template-service';

export type NotificationType =
  // Produits digitaux
  | 'digital_product_purchased'
  | 'digital_product_download_ready'
  | 'digital_product_version_update'
  | 'digital_product_license_expiring'
  | 'digital_product_license_expired'

  // Produits physiques
  | 'physical_product_order_placed'
  | 'physical_product_order_confirmed'
  | 'physical_product_order_shipped'
  | 'physical_product_order_delivered'
  | 'physical_product_order_cancelled'
  | 'physical_product_low_stock'
  | 'physical_product_out_of_stock'
  | 'physical_product_back_in_stock'

  // Services
  | 'service_booking_confirmed'
  | 'service_booking_reminder'
  | 'service_booking_cancelled'
  | 'service_booking_completed'
  | 'service_payment_required'

  // Cours
  | 'course_enrollment'
  | 'course_lesson_complete'
  | 'course_complete'
  | 'course_certificate_ready'
  | 'course_new_content'
  | 'course_quiz_passed'
  | 'course_quiz_failed'

  // Artistes
  | 'artist_product_purchased'
  | 'artist_product_certificate_ready'
  | 'artist_product_edition_sold_out'
  | 'artist_product_shipping_update'

  // Général
  | 'order_payment_received'
  | 'order_payment_failed'
  | 'order_refund_processed'
  | 'affiliate_commission_earned'
  | 'affiliate_commission_paid'
  | 'product_review_received'
  | 'system_announcement'

  // Messages Vendeur
  | 'vendor_message_received'
  | 'customer_message_received'
  | 'vendor_conversation_started'
  | 'vendor_conversation_closed'

  // Messages Commandes
  | 'order_message_received';

export interface UnifiedNotification {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  action_url?: string;
  action_label?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  channels?: ('in_app' | 'email' | 'sms' | 'push')[];
  product_type?: 'digital' | 'physical' | 'service' | 'course' | 'artist';
  product_id?: string;
  order_id?: string;
}

export interface NotificationPreferences {
  user_id: string;
  // Par type de notification
  preferences: Record<
    NotificationType,
    {
      in_app: boolean;
      email: boolean;
      sms: boolean;
      push: boolean;
    }
  >;
  // Par type de produit
  product_type_preferences?: Record<
    string,
    {
      in_app: boolean;
      email: boolean;
      sms: boolean;
      push: boolean;
    }
  >;
}

/**
 * Envoyer une notification unifiée avec rate limiting et retry
 */
export async function sendUnifiedNotification(
  notification: UnifiedNotification
): Promise<{ success: boolean; error?: string; notification_id?: string }> {
  const startTime = Date.now();
  let notificationId: string | undefined;
  const results: Array<{ channel: string; success: boolean; error?: string }> = [];

  try {
    // 1. Vérifier les préférences utilisateur
    const preferences = await getUserNotificationPreferences(notification.user_id);

    // 2. Déterminer les canaux à utiliser
    const channels = notification.channels || ['in_app', 'email', 'sms', 'push'];

    // 3. Traiter chaque canal avec rate limiting et retry
    for (const channel of channels) {
      const channelType = channel as 'in_app' | 'email' | 'sms' | 'push';
      if (!shouldSendNotification(notification, preferences, channelType)) {
        continue;
      }

      // Vérifier rate limit
      const rateLimitResult = await notificationRateLimiter.checkRateLimit(
        notification.user_id,
        channel as 'in_app' | 'email' | 'sms' | 'push',
        notification.type
      );

      if (!rateLimitResult.allowed) {
        logger.warn('Notification rate limit exceeded', {
          userId: notification.user_id,
          channel,
          type: notification.type,
          reason: rateLimitResult.reason,
        });
        results.push({ channel, success: false, error: rateLimitResult.reason });
        continue;
      }

      // Envoyer avec retry
      try {
        await notificationRetryService.executeWithRetry(async () => {
          switch (channel) {
            case 'in_app': {
              const id = await sendInAppNotification(notification);
              if (!notificationId) notificationId = id;
              return id;
            }
            case 'email':
              return await sendEmailNotification(notification);
            case 'sms':
              return await sendSMSNotification(notification);
            case 'push':
              return await sendPushNotification(notification);
            default:
              throw new Error(`Unknown channel: ${channel}`);
          }
        });

        // Enregistrer le succès
        await notificationRateLimiter.recordNotification(
          notification.user_id,
          channel as 'in_app' | 'email' | 'sms' | 'push',
          notification.type
        );

        // Logger le succès
        await logNotification({
          userId: notification.user_id,
          notificationId: notificationId || undefined,
          type: notification.type,
          channel: channel as 'in_app' | 'email' | 'sms' | 'push',
          status: 'sent',
          processingTimeMs: Date.now() - startTime,
        });

        results.push({ channel, success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Logger l'échec
        await logNotification({
          userId: notification.user_id,
          notificationId,
          type: notification.type,
          channel: channel as 'in_app' | 'email' | 'sms' | 'push',
          status: 'failed',
          error: errorMessage,
          processingTimeMs: Date.now() - startTime,
        });

        // Programmer un retry
        await notificationRetryService.scheduleRetry(
          notification,
          channel as 'in_app' | 'email' | 'sms' | 'push',
          error,
          0
        );

        results.push({ channel, success: false, error: errorMessage });
      }
    }

    // Déterminer le succès global
    const allFailed = results.every(r => !r.success);
    const hasSuccess = results.some(r => r.success);

    if (allFailed) {
      return {
        success: false,
        error:
          results
            .map(r => r.error)
            .filter(Boolean)
            .join('; ') || 'All channels failed',
        notification_id: notificationId,
      };
    }

    return {
      success: hasSuccess,
      notification_id: notificationId,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error sending unified notification', {
      error: errorMessage,
      notification,
      results,
    });
    return { success: false, error: errorMessage, notification_id: notificationId };
  }
}

/**
 * Envoyer une notification in-app (fonction séparée pour retry)
 */
async function sendInAppNotification(notification: UnifiedNotification): Promise<string> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata || {},
      action_url: notification.action_url,
      action_label: notification.action_label,
      priority: notification.priority || 'normal',
      is_read: false,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create in-app notification: ${error.message}`);
  }

  logger.info('In-app notification created', {
    notificationId: data.id,
    type: notification.type,
  });

  return data.id;
}

/**
 * Vérifier si une notification doit être envoyée sur un canal
 */
function shouldSendNotification(
  notification: UnifiedNotification,
  preferences: NotificationPreferences | null,
  channel: 'in_app' | 'email' | 'sms' | 'push'
): boolean {
  if (!preferences) {
    // Par défaut, activer in_app et email
    return channel === 'in_app' || channel === 'email';
  }

  const typePrefs = preferences.preferences[notification.type];
  if (!typePrefs) {
    return channel === 'in_app' || channel === 'email';
  }

  return typePrefs[channel] ?? (channel === 'in_app' || channel === 'email');
}

/**
 * Récupérer les préférences de notifications d'un utilisateur
 */
async function getUserNotificationPreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    // Convertir les préférences de la BDD en format unifié
    type ChannelPrefs = { in_app: boolean; email: boolean; sms: boolean; push: boolean };
    const preferences: Partial<Record<NotificationType, ChannelPrefs>> = {};

    // Mapper les préférences existantes
    const dataRecord = data as Record<string, unknown>;
    Object.keys(dataRecord).forEach(key => {
      if (key.startsWith('email_') || key.startsWith('app_')) {
        const type = mapPreferenceKeyToNotificationType(key);
        if (type) {
          if (!preferences[type]) {
            preferences[type] = { in_app: false, email: false, sms: false, push: false };
          }
          if (key.startsWith('email_')) {
            preferences[type]!.email = (dataRecord[key] as boolean) ?? true;
          } else if (key.startsWith('app_')) {
            preferences[type]!.in_app = (dataRecord[key] as boolean) ?? true;
          }
        }
      }
    });

    return {
      user_id: userId,
      preferences: preferences as Record<NotificationType, ChannelPrefs>,
    };
  } catch (error) {
    logger.error('Error fetching notification preferences', { error, userId });
    return null;
  }
}

/**
 * Mapper une clé de préférence vers un type de notification
 */
function mapPreferenceKeyToNotificationType(key: string): NotificationType | null {
  const mapping: Record<string, NotificationType> = {
    email_course_enrollment: 'course_enrollment',
    email_course_complete: 'course_complete',
    email_certificate_ready: 'course_certificate_ready',
    email_new_course: 'course_new_content',
    email_affiliate_sale: 'affiliate_commission_earned',
    // Ajouter plus de mappings selon les besoins
  };

  const baseKey = key.replace(/^(email_|app_)/, '');
  return mapping[baseKey] || null;
}

/**
 * Envoyer une notification email
 */
async function sendEmailNotification(notification: UnifiedNotification): Promise<void> {
  try {
    // Récupérer l'email de l'utilisateur
    const { data: user } = await supabase.auth.admin.getUserById(notification.user_id);
    if (!user?.user?.email) {
      logger.warn('User email not found for email notification', { userId: notification.user_id });
      return;
    }

    // Récupérer la langue de l'utilisateur (par défaut 'fr')
    const { notificationI18nService } = await import('./i18n-service');
    const language = (await notificationI18nService.getUserLanguage(notification.user_id)) || 'fr';

    // Essayer d'utiliser le template centralisé depuis notification_templates
    let subject = notification.title;
    let htmlContent = '';
    let templateSlug = notification.type;

    try {
      const rendered = await notificationTemplateService.renderTemplate(
        notification.type,
        'email',
        {
          title: notification.title,
          message: notification.message,
          action_url: notification.action_url || '',
          action_label: notification.action_label || '',
          user_name: user.user.email.split('@')[0], // Nom par défaut depuis email
          platform_name: 'Emarzona',
          ...notification.metadata,
        },
        {
          language: language as 'fr' | 'en',
          storeId: notification.metadata?.store_id as string | undefined,
        }
      );

      if (rendered) {
        subject = rendered.subject || notification.title;
        htmlContent = rendered.html || rendered.body;
      } else {
        // Fallback : utiliser le template basique de l'Edge Function
        const template = getEmailTemplate(notification.type);
        htmlContent = ''; // L'Edge Function générera le HTML
        templateSlug = template;
      }
    } catch (templateError) {
      logger.warn('Error rendering template, using fallback', {
        error: templateError,
        type: notification.type,
      });
      // Fallback : utiliser le template basique
      const template = getEmailTemplate(notification.type);
      templateSlug = template;
    }

    // Si on a un HTML rendu, l'envoyer directement via Resend
    // Sinon, utiliser l'Edge Function avec template basique
    if (htmlContent) {
      // Envoyer directement via Resend (via Edge Function avec HTML)
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: user.user.email,
          subject: subject,
          html: htmlContent, // HTML rendu depuis template
          template: 'custom', // Template custom
          data: {
            title: notification.title,
            message: notification.message,
            action_url: notification.action_url,
            action_label: notification.action_label,
            ...notification.metadata,
          },
        },
      });

      if (error) {
        throw error;
      }
    } else {
      // Utiliser l'Edge Function avec template basique
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: user.user.email,
          subject: notification.title,
          template: templateSlug,
          data: {
            title: notification.title,
            message: notification.message,
            action_url: notification.action_url,
            action_label: notification.action_label,
            ...notification.metadata,
          },
        },
      });

      if (error) {
        throw error;
      }
    }

    logger.info('Email notification sent', {
      userId: notification.user_id,
      type: notification.type,
      templateUsed: htmlContent ? 'centralized' : 'fallback',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error sending email notification', { error: errorMessage, notification });
    throw error;
  }
}

/**
 * Envoyer une notification SMS
 */
async function sendSMSNotification(notification: UnifiedNotification): Promise<void> {
  try {
    // Récupérer le numéro de téléphone de l'utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', notification.user_id)
      .single();

    if (!profile?.phone) {
      logger.warn('User phone not found for SMS notification', { userId: notification.user_id });
      return;
    }

    // Appeler la fonction Supabase Edge Function pour envoyer le SMS
    const { error } = await supabase.functions.invoke('send-sms', {
      body: {
        to: profile.phone,
        message: `${notification.title}: ${notification.message}`,
      },
    });

    if (error) {
      throw error;
    }

    logger.info('SMS notification sent', { userId: notification.user_id, type: notification.type });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error sending SMS notification', { error: errorMessage, notification });
    throw error;
  }
}

/**
 * Envoyer une notification push
 */
async function sendPushNotification(notification: UnifiedNotification): Promise<void> {
  try {
    // Récupérer les tokens push de l'utilisateur
    const { data: pushTokens } = await supabase
      .from('user_push_tokens')
      .select('token, platform')
      .eq('user_id', notification.user_id)
      .eq('is_active', true);

    if (!pushTokens || pushTokens.length === 0) {
      logger.warn('No push tokens found for user', { userId: notification.user_id });
      return;
    }

    // Envoyer à chaque token avec son et affichage
    for (const tokenData of pushTokens) {
      await supabase.functions.invoke('send-push', {
        body: {
          token: tokenData.token,
          platform: tokenData.platform,
          title: notification.title,
          body: notification.message,
          data: {
            ...notification.metadata,
            url: notification.action_url || '/',
            type: notification.type,
          },
          // Options pour son et affichage
          silent: false, // ✅ SON ACTIVÉ
          requireInteraction:
            notification.priority === 'urgent' || notification.priority === 'high',
          vibrate: [200, 100, 200], // ✅ Vibration pour mobile
        },
      });
    }

    logger.info('Push notification sent', {
      userId: notification.user_id,
      type: notification.type,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error sending push notification', { error: errorMessage, notification });
    throw error;
  }
}

/**
 * Obtenir le template email selon le type de notification
 */
function getEmailTemplate(type: NotificationType): string {
  const templates: Record<NotificationType, string> = {
    // Digital
    digital_product_purchased: 'digital-product-purchased',
    digital_product_download_ready: 'digital-download-ready',
    digital_product_version_update: 'digital-version-update',
    digital_product_license_expiring: 'license-expiring',
    digital_product_license_expired: 'license-expired',

    // Physical
    physical_product_order_placed: 'order-placed',
    physical_product_order_confirmed: 'order-confirmed',
    physical_product_order_shipped: 'order-shipped',
    physical_product_order_delivered: 'order-delivered',
    physical_product_order_cancelled: 'order-cancelled',
    physical_product_low_stock: 'low-stock',
    physical_product_out_of_stock: 'out-of-stock',
    physical_product_back_in_stock: 'back-in-stock',

    // Service
    service_booking_confirmed: 'booking-confirmed',
    service_booking_reminder: 'booking-reminder',
    service_booking_cancelled: 'booking-cancelled',
    service_booking_completed: 'booking-completed',
    service_payment_required: 'payment-required',

    // Course
    course_enrollment: 'course-enrollment',
    course_lesson_complete: 'lesson-complete',
    course_complete: 'course-complete',
    course_certificate_ready: 'certificate-ready',
    course_new_content: 'new-content',
    course_quiz_passed: 'quiz-passed',
    course_quiz_failed: 'quiz-failed',

    // Artist
    artist_product_purchased: 'artist-product-purchased',
    artist_product_certificate_ready: 'certificate-ready',
    artist_product_edition_sold_out: 'edition-sold-out',
    artist_product_shipping_update: 'shipping-update',

    // General
    order_payment_received: 'payment-received',
    order_payment_failed: 'payment-failed',
    order_refund_processed: 'refund-processed',
    affiliate_commission_earned: 'commission-earned',
    affiliate_commission_paid: 'commission-paid',
    product_review_received: 'review-received',
    system_announcement: 'system-announcement',
  };

  return templates[type] || 'default';
}

/**
 * Helpers spécifiques par type de produit
 */

// Produits digitaux
export async function notifyDigitalProductUpdate(
  userId: string,
  productId: string,
  productName: string,
  version: string,
  downloadUrl: string
): Promise<void> {
  await sendUnifiedNotification({
    user_id: userId,
    type: 'digital_product_version_update',
    title: '🔄 Nouvelle version disponible',
    message: `Une nouvelle version (${version}) de "${productName}" est disponible.`,
    metadata: {
      product_id: productId,
      product_name: productName,
      version,
      download_url: downloadUrl,
    },
    action_url: `/digital/${productId}`,
    action_label: 'Télécharger',
    product_type: 'digital',
    product_id: productId,
    priority: 'high',
  });
}

// Produits physiques
export async function notifyPhysicalProductOrderShipped(
  userId: string,
  orderId: string,
  orderNumber: string,
  trackingNumber: string,
  carrierName: string
): Promise<void> {
  await sendUnifiedNotification({
    user_id: userId,
    type: 'physical_product_order_shipped',
    title: '📦 Commande expédiée',
    message: `Votre commande #${orderNumber} a été expédiée. Numéro de suivi: ${trackingNumber}`,
    metadata: {
      order_id: orderId,
      order_number: orderNumber,
      tracking_number: trackingNumber,
      carrier_name: carrierName,
    },
    action_url: `/orders/${orderId}`,
    action_label: 'Suivre la commande',
    product_type: 'physical',
    order_id: orderId,
    priority: 'high',
  });
}

// Services
export async function notifyServiceBookingReminder(
  userId: string,
  bookingId: string,
  serviceName: string,
  bookingDate: string,
  bookingTime: string
): Promise<void> {
  await sendUnifiedNotification({
    user_id: userId,
    type: 'service_booking_reminder',
    title: '⏰ Rappel de réservation',
    message: `Votre réservation pour "${serviceName}" est prévue le ${bookingDate} à ${bookingTime}.`,
    metadata: {
      booking_id: bookingId,
      service_name: serviceName,
      booking_date: bookingDate,
      booking_time: bookingTime,
    },
    action_url: `/bookings/${bookingId}`,
    action_label: 'Voir la réservation',
    product_type: 'service',
    priority: 'medium',
  });
}

// Cours
export async function notifyCourseNewContent(
  userId: string,
  courseId: string,
  courseName: string,
  lessonTitle: string
): Promise<void> {
  await sendUnifiedNotification({
    user_id: userId,
    type: 'course_new_content',
    title: '📚 Nouveau contenu disponible',
    message: `Une nouvelle leçon "${lessonTitle}" a été ajoutée au cours "${courseName}".`,
    metadata: {
      course_id: courseId,
      course_name: courseName,
      lesson_title: lessonTitle,
    },
    action_url: `/courses/${courseId}`,
    action_label: 'Voir le cours',
    product_type: 'course',
    product_id: courseId,
    priority: 'medium',
  });
}

// Artistes
export async function notifyArtistProductEditionSoldOut(
  userId: string,
  productId: string,
  artworkTitle: string,
  editionNumber: number,
  totalEditions: number
): Promise<void> {
  await sendUnifiedNotification({
    user_id: userId,
    type: 'artist_product_edition_sold_out',
    title: '🎨 Édition complète',
    message: `L'édition ${editionNumber}/${totalEditions} de "${artworkTitle}" est maintenant complète.`,
    metadata: {
      product_id: productId,
      artwork_title: artworkTitle,
      edition_number: editionNumber,
      total_editions: totalEditions,
    },
    action_url: `/artist/${productId}`,
    action_label: "Voir l'œuvre",
    product_type: 'artist',
    product_id: productId,
    priority: 'low',
  });
}
