/**
 * Push Notifications System
 * Système de notifications push (Web Push et in-app)
 */

import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
  actions?: NotificationAction[];
}

export interface NotificationPermission {
  permission: NotificationPermissionState;
  canRequest: boolean;
}

/**
 * Classe principale pour les notifications push
 */
export class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  /**
   * Initialiser le service de notifications push
   */
  async initialize(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        logger.warn('Push notifications not supported in this browser');
        return false;
      }

      // Enregistrer le service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      logger.info('Service Worker registered', { registration: this.registration });

      // Demander la permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        logger.warn('Notification permission not granted', { permission });
        return false;
      }

      // S'abonner aux notifications push
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
        ),
      });

      // Enregistrer l'abonnement dans la base de données
      await this.saveSubscription(this.subscription);

      return true;
    } catch (error) {
      logger.error('PushNotificationService.initialize error', { error });
      return false;
    }
  }

  /**
   * Demander la permission de notification
   */
  async requestPermission(): Promise<NotificationPermissionState> {
    try {
      if (!('Notification' in window)) {
        return 'denied';
      }

      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      logger.error('PushNotificationService.requestPermission error', { error });
      return 'denied';
    }
  }

  /**
   * Obtenir l'état de la permission
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return { permission: 'denied', canRequest: false };
    }

    const permission = Notification.permission;
    const canRequest = permission === 'default';

    return { permission, canRequest };
  }

  /**
   * Envoyer une notification locale
   */
  async showLocalNotification(notification: PushNotification): Promise<void> {
    try {
      if (!this.registration) {
        await this.initialize();
      }

      if (!this.registration) {
        throw new Error('Service Worker not registered');
      }

      await this.registration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/icon-192x192.png',
        image: notification.image,
        badge: notification.badge || '/badge-72x72.png',
        tag: notification.tag,
        data: notification.data,
        requireInteraction: notification.requireInteraction || false,
        silent: notification.silent !== undefined ? notification.silent : false, // ✅ SON ACTIVÉ par défaut (silent: false)
        timestamp: notification.timestamp || Date.now(),
        actions: notification.actions,
        vibrate: [200, 100, 200], // ✅ Vibration pour mobile
      });

      // Logger la notification
      await this.logNotification(notification, 'local');
    } catch (error) {
      logger.error('PushNotificationService.showLocalNotification error', { error, notification });
    }
  }

  /**
   * Envoyer une notification in-app
   */
  async showInAppNotification(notification: PushNotification): Promise<void> {
    try {
      // Créer une notification in-app dans l'interface
      // Cette fonction sera appelée depuis les composants React
      const event = new CustomEvent('in-app-notification', {
        detail: notification,
      });
      window.dispatchEvent(event);

      // Logger la notification
      await this.logNotification(notification, 'in-app');
    } catch (error) {
      logger.error('PushNotificationService.showInAppNotification error', { error, notification });
    }
  }

  /**
   * Se désabonner des notifications push
   */
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.subscription) {
        return false;
      }

      const unsubscribed = await this.subscription.unsubscribe();
      if (unsubscribed) {
        await this.removeSubscription(this.subscription);
        this.subscription = null;
      }

      return unsubscribed;
    } catch (error) {
      logger.error('PushNotificationService.unsubscribe error', { error });
      return false;
    }
  }

  /**
   * Sauvegarder l'abonnement dans la base de données
   */
  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const keys = {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
      };

      // Obtenir les informations du navigateur
      const userAgent = navigator.userAgent;
      const deviceInfo = {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        language: navigator.language,
        onLine: navigator.onLine,
      };

      // Utiliser la fonction SQL pour sauvegarder
      const { error } = await supabase.rpc('save_push_subscription', {
        p_endpoint: subscription.endpoint,
        p_keys: keys,
        p_user_agent: userAgent,
        p_device_info: deviceInfo,
      });

      if (error) {
        throw error;
      }

      logger.info('Push subscription saved', { endpoint: subscription.endpoint });
    } catch (error) {
      logger.error('PushNotificationService.saveSubscription error', { error });
      throw error;
    }
  }

  /**
   * Supprimer l'abonnement de la base de données
   */
  private async removeSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      // Utiliser la fonction SQL pour supprimer
      const { error } = await supabase.rpc('delete_push_subscription', {
        p_endpoint: subscription.endpoint,
      });

      if (error) {
        throw error;
      }

      logger.info('Push subscription removed', { endpoint: subscription.endpoint });
    } catch (error) {
      logger.error('PushNotificationService.removeSubscription error', { error });
      throw error;
    }
  }

  /**
   * Logger une notification
   */
  private async logNotification(
    notification: PushNotification,
    type: 'local' | 'in-app' | 'push'
  ): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      // Utiliser la fonction SQL pour logger
      await supabase.rpc('log_notification', {
        p_user_id: user.id,
        p_type: type === 'push' ? 'push' : type === 'local' ? 'push' : 'in-app',
        p_title: notification.title,
        p_body: notification.body,
        p_data: notification.data || {},
        p_channel: 'web-push',
        p_provider: 'vapid',
        p_status: 'sent',
      });
    } catch (error) {
      logger.error('PushNotificationService.logNotification error', { error });
    }
  }

  /**
   * Convertir une clé VAPID en Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let  i= 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convertir un ArrayBuffer en Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let  binary= '';
    for (let  i= 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// Instance singleton
export const pushNotificationService = new PushNotificationService();






