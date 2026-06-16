/**
 * Push Notifications System
 * Web Push + notifications locales via Service Worker
 */

import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { registerServiceWorker } from '@/lib/pwa';
import {
  getVapidPublicKey,
  isVapidConfigured,
  urlBase64ToUint8Array,
  getVapidConfigErrorMessage,
} from '@/lib/notifications/vapid';

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

export type PushSubscribeErrorCode =
  | 'NOT_SUPPORTED'
  | 'VAPID_NOT_CONFIGURED'
  | 'PERMISSION_DENIED'
  | 'NOT_AUTHENTICATED'
  | 'SW_REGISTRATION_FAILED'
  | 'SUBSCRIBE_FAILED'
  | 'SAVE_FAILED';

export class PushSubscribeError extends Error {
  code: PushSubscribeErrorCode;

  constructor(code: PushSubscribeErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'PushSubscribeError';
    this.code = code;
    if (cause) this.cause = cause;
  }
}

export class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  async getRegistration(): Promise<ServiceWorkerRegistration> {
    if (this.registration) return this.registration;

    const registered = await registerServiceWorker();
    if (registered) {
      this.registration = registered;
      return registered;
    }

    if ('serviceWorker' in navigator) {
      this.registration = await navigator.serviceWorker.ready;
      return this.registration;
    }

    throw new PushSubscribeError(
      'SW_REGISTRATION_FAILED',
      "Impossible d'enregistrer le Service Worker."
    );
  }

  async requestPermission(): Promise<NotificationPermissionState> {
    if (!('Notification' in window)) return 'denied';
    try {
      return await Notification.requestPermission();
    } catch (error) {
      logger.error('PushNotificationService.requestPermission error', { error });
      return 'denied';
    }
  }

  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return { permission: 'denied', canRequest: false };
    }
    const permission = Notification.permission;
    return { permission, canRequest: permission === 'default' };
  }

  async getExistingSubscription(): Promise<PushSubscription | null> {
    const registration = await this.getRegistration();
    return registration.pushManager.getSubscription();
  }

  /**
   * S'abonne aux notifications push (permission doit être granted).
   */
  async subscribe(): Promise<PushSubscription> {
    if (!this.isSupported()) {
      throw new PushSubscribeError('NOT_SUPPORTED', 'Notifications push non supportées.');
    }

    if (!isVapidConfigured()) {
      throw new PushSubscribeError('VAPID_NOT_CONFIGURED', getVapidConfigErrorMessage());
    }

    if (Notification.permission !== 'granted') {
      throw new PushSubscribeError(
        'PERMISSION_DENIED',
        'Autorisez les notifications dans votre navigateur avant de vous abonner.'
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new PushSubscribeError(
        'NOT_AUTHENTICATED',
        'Connectez-vous pour activer les notifications push.'
      );
    }

    const registration = await this.getRegistration();
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      this.subscription = existing;
      await this.saveSubscription(existing);
      return existing;
    }

    const vapidKey = getVapidPublicKey()!;
    let applicationServerKey: Uint8Array;
    try {
      applicationServerKey = urlBase64ToUint8Array(vapidKey);
    } catch {
      throw new PushSubscribeError('VAPID_NOT_CONFIGURED', getVapidConfigErrorMessage());
    }

    try {
      this.subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    } catch (error) {
      logger.error('pushManager.subscribe failed', { error });
      throw new PushSubscribeError(
        'SUBSCRIBE_FAILED',
        "Le navigateur n'a pas pu créer l'abonnement push.",
        error
      );
    }

    try {
      await this.saveSubscription(this.subscription);
    } catch (error) {
      await this.subscription.unsubscribe().catch(() => undefined);
      this.subscription = null;
      throw new PushSubscribeError(
        'SAVE_FAILED',
        "Abonnement créé mais impossible de l'enregistrer. Réessayez.",
        error
      );
    }

    return this.subscription;
  }

  /** @deprecated Utiliser subscribe() */
  async initialize(): Promise<boolean> {
    try {
      if (Notification.permission === 'default') {
        const perm = await this.requestPermission();
        if (perm !== 'granted') return false;
      }
      await this.subscribe();
      return true;
    } catch (error) {
      logger.error('PushNotificationService.initialize error', { error });
      return false;
    }
  }

  async showLocalNotification(notification: PushNotification): Promise<void> {
    const registration = await this.getRegistration();
    await registration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      image: notification.image,
      badge: notification.badge || '/badge-72x72.png',
      tag: notification.tag,
      data: notification.data,
      requireInteraction: notification.requireInteraction || false,
      silent: notification.silent !== undefined ? notification.silent : false,
      timestamp: notification.timestamp || Date.now(),
      actions: notification.actions,
      vibrate: [200, 100, 200],
    });
    await this.logNotification(notification, 'local');
  }

  async showInAppNotification(notification: PushNotification): Promise<void> {
    window.dispatchEvent(new CustomEvent('in-app-notification', { detail: notification }));
    await this.logNotification(notification, 'in-app');
  }

  async unsubscribe(): Promise<boolean> {
    const subscription = this.subscription ?? (await this.getExistingSubscription());
    if (!subscription) return false;

    const unsubscribed = await subscription.unsubscribe();
    if (unsubscribed) {
      await this.removeSubscription(subscription);
      this.subscription = null;
    }
    return unsubscribed;
  }

  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    const p256dh = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');
    if (!p256dh || !auth) {
      throw new Error('Invalid push subscription keys');
    }

    const keys = {
      p256dh: this.arrayBufferToBase64(p256dh),
      auth: this.arrayBufferToBase64(auth),
    };

    const { error } = await supabase.rpc('save_push_subscription', {
      p_endpoint: subscription.endpoint,
      p_keys: keys,
      p_user_agent: navigator.userAgent,
      p_device_info: {
        platform: navigator.platform,
        language: navigator.language,
        onLine: navigator.onLine,
      },
    });

    if (error) {
      logger.error('save_push_subscription RPC error', { error });
      throw error;
    }

    logger.info('Push subscription saved', { endpoint: subscription.endpoint });
  }

  private async removeSubscription(subscription: PushSubscription): Promise<void> {
    const { error } = await supabase.rpc('delete_push_subscription', {
      p_endpoint: subscription.endpoint,
    });
    if (error) throw error;
  }

  private async logNotification(
    notification: PushNotification,
    type: 'local' | 'in-app' | 'push'
  ): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc('log_notification', {
        p_user_id: user.id,
        p_type: type === 'in-app' ? 'in-app' : 'push',
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

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

export const pushNotificationService = new PushNotificationService();
