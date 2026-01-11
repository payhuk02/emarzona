import { useState, useEffect } from 'react';

interface PWACapabilities {
  isInstallable: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  supportsNotifications: boolean;
  supportsBackgroundSync: boolean;
  supportsWebShare: boolean;
  isOfflineReady: boolean;
}

interface PWAActions {
  install: () => Promise<void>;
  share: (data: ShareData) => Promise<void>;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  sendNotification: (title: string, options?: NotificationOptions) => void;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePWA = (): PWACapabilities & PWAActions => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  // Check PWA capabilities
  const capabilities: PWACapabilities = {
    isInstallable: !!deferredPrompt,
    isInstalled,
    canInstall: !!deferredPrompt && !isInstalled,
    supportsNotifications: 'Notification' in window,
    supportsBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    supportsWebShare: 'share' in navigator,
    isOfflineReady,
  };

  // Install PWA
  const install = async (): Promise<void> => {
    if (!deferredPrompt) {
      throw new Error('Installation prompt not available');
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setDeferredPrompt(null);
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Error during PWA installation:', error);
      throw error;
    }
  };

  // Share content
  const share = async (data: ShareData): Promise<void> => {
    if (!capabilities.supportsWebShare) {
      throw new Error('Web Share API not supported');
    }

    try {
      await navigator.share(data);
    } catch (error) {
      console.error('Error sharing content:', error);
      throw error;
    }
  };

  // Request notification permission
  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!capabilities.supportsNotifications) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
  };

  // Send notification
  const sendNotification = (title: string, options?: NotificationOptions): void => {
    if (!capabilities.supportsNotifications || Notification.permission !== 'granted') {
      console.warn('Notifications not permitted');
      return;
    }

    try {
      new Notification(title, options);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  useEffect(() => {
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check offline readiness
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsOfflineReady(true);
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return {
    ...capabilities,
    install,
    share,
    requestNotificationPermission,
    sendNotification,
  };
};