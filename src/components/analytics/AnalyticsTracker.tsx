import { useEffect, useCallback, useRef } from 'react';
import { useAnalyticsTracking } from '@/hooks/useProductAnalytics';

interface AnalyticsTrackerProps {
  productId: string;
  /** Pass store_id when known to avoid a products SELECT on each event (Disk I/O LOT 1). */
  storeId?: string;
  enabled?: boolean;
  trackViews?: boolean;
  trackClicks?: boolean;
  trackTimeSpent?: boolean;
  /**
   * @deprecated JS errors go to Sentry — never PostHog/Postgres analytics.
   * Kept for API compat; ignored.
   */
  trackErrors?: boolean;
  customEvents?: string[];
}

export const AnalyticsTracker: React.FC<AnalyticsTrackerProps> = ({
  productId,
  storeId,
  enabled = true,
  trackViews = true,
  trackClicks = true,
  trackTimeSpent = true,
  trackErrors: _trackErrors = false,
  customEvents = [],
}) => {
  void _trackErrors;
  const { trackView, trackClick, trackCustomEvent } = useAnalyticsTracking();
  const sessionStartTime = useRef<number>(Date.now());
  const lastActivityTime = useRef<number>(Date.now());
  const activityTimeout = useRef<NodeJS.Timeout | null>(null);

  const withStore = useCallback(
    (data: Record<string, unknown> = {}) => (storeId ? { ...data, store_id: storeId } : data),
    [storeId]
  );

  // Tracker les vues de page
  useEffect(() => {
    if (!enabled || !trackViews || !productId) return;

    const trackPageView = () => {
      trackView(
        productId,
        withStore({
          page_url: window.location.href,
          referrer: document.referrer,
          timestamp: Date.now(),
          user_agent: navigator.userAgent,
          screen_resolution: `${screen.width}x${screen.height}`,
          viewport_size: `${window.innerWidth}x${window.innerHeight}`,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
      );
    };

    // Tracker la vue initiale
    trackPageView();

    // Tracker les changements de page (pour les SPA)
    const handlePopState = () => {
      trackPageView();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enabled, trackViews, productId, trackView, withStore]);

  // Tracker les clics interactifs utiles uniquement (pas tout le DOM)
  useEffect(() => {
    if (!enabled || !trackClicks || !productId) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest('button, a, [role="button"]') as HTMLElement | null;
      if (!interactive) return;

      const elementId =
        interactive.id ||
        interactive.getAttribute('data-analytics-id') ||
        interactive.getAttribute('aria-label') ||
        interactive.tagName.toLowerCase();

      trackClick(
        productId,
        elementId.slice(0, 120),
        withStore({
          element_type: interactive.tagName.toLowerCase(),
          element_href: interactive.getAttribute('href')?.slice(0, 200) ?? null,
          timestamp: Date.now(),
        })
      );
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [enabled, trackClicks, productId, trackClick, withStore]);

  // Tracker le temps passé sur la page
  useEffect(() => {
    if (!enabled || !trackTimeSpent || !productId) return;

    const updateActivity = () => {
      lastActivityTime.current = Date.now();

      // Clear existing timeout
      if (activityTimeout.current) {
        clearTimeout(activityTimeout.current);
      }

      // Set new timeout for inactivity
      activityTimeout.current = setTimeout(() => {
        const timeSpent = Math.floor((lastActivityTime.current - sessionStartTime.current) / 1000);

        if (timeSpent > 5) {
          // Only track if user spent more than 5 seconds
          trackCustomEvent(
            productId,
            'time_spent',
            withStore({
              duration: timeSpent,
              page_url: window.location.href,
              timestamp: Date.now(),
            })
          );
        }
      }, 30_000); // 30 seconds of inactivity
    };

    const handleActivity = () => {
      updateActivity();
    };

    // Track various user activities
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const timeSpent = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        if (timeSpent > 5) {
          trackCustomEvent(
            productId,
            'session_pause',
            withStore({
              duration: timeSpent,
              page_url: window.location.href,
              timestamp: Date.now(),
            })
          );
        }
      } else {
        sessionStartTime.current = Date.now();
        lastActivityTime.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (activityTimeout.current) {
        clearTimeout(activityTimeout.current);
      }
    };
  }, [enabled, trackTimeSpent, productId, trackCustomEvent, withStore]);

  // JS errors → Sentry (APM), jamais analytics PostHog/Postgres

  // Tracker les événements personnalisés
  useEffect(() => {
    if (!enabled || !customEvents.length || !productId) return;

    const handleCustomEvent = (event: CustomEvent) => {
      const eventName = event.detail?.name || event.type;

      if (customEvents.includes(eventName)) {
        trackCustomEvent(
          productId,
          eventName,
          withStore({
            ...event.detail,
            page_url: window.location.href,
            timestamp: Date.now(),
          })
        );
      }
    };

    // Écouter les événements personnalisés
    customEvents.forEach(eventName => {
      document.addEventListener(eventName, handleCustomEvent as EventListener);
    });

    return () => {
      customEvents.forEach(eventName => {
        document.removeEventListener(eventName, handleCustomEvent as EventListener);
      });
    };
  }, [enabled, customEvents, productId, trackCustomEvent, withStore]);

  // Tracker les conversions (achats)
  const trackPurchase = useCallback(
    (revenue: number, orderId?: string, additionalData?: Record<string, unknown>) => {
      if (!enabled || !productId) return;

      trackCustomEvent(
        productId,
        'purchase',
        withStore({
          revenue,
          order_id: orderId,
          currency: 'XOF',
          page_url: window.location.href,
          timestamp: Date.now(),
          ...additionalData,
        })
      );
    },
    [enabled, productId, trackCustomEvent, withStore]
  );

  // Exposer la fonction de tracking des achats globalement
  useEffect(() => {
    if (!enabled || !productId) return;

    // Exposer la fonction globalement pour qu'elle puisse être appelée depuis d'autres composants
    interface WindowWithTrackPurchase extends Window {
      trackPurchase?: (
        revenue: number,
        orderId?: string,
        additionalData?: Record<string, unknown>
      ) => void;
    }
    (window as WindowWithTrackPurchase).trackPurchase = trackPurchase;

    return () => {
      delete (window as WindowWithTrackPurchase).trackPurchase;
    };
  }, [enabled, productId, trackPurchase]);

  return null; // Ce composant ne rend rien visuellement
};

// Hook pour utiliser le tracking depuis d'autres composants
export const useAnalyticsTracker = () => {
  const trackCustomEvent = useCallback(
    (_productId: string, eventName: string, eventData?: Record<string, unknown>) => {
      // Dispatcher un événement personnalisé
      const event = new CustomEvent(`analytics_${eventName}`, {
        detail: {
          name: eventName,
          ...eventData,
        },
      });

      document.dispatchEvent(event);
    },
    []
  );

  const trackPurchase = useCallback(
    (
      productId: string,
      revenue: number,
      orderId?: string,
      additionalData?: Record<string, unknown>
    ) => {
      trackCustomEvent(productId, 'purchase', {
        revenue,
        order_id: orderId,
        ...additionalData,
      });
    },
    [trackCustomEvent]
  );

  const trackConversion = useCallback(
    (productId: string, conversionType: string, additionalData?: Record<string, unknown>) => {
      trackCustomEvent(productId, 'conversion', {
        conversion_type: conversionType,
        ...additionalData,
      });
    },
    [trackCustomEvent]
  );

  return {
    trackCustomEvent,
    trackPurchase,
    trackConversion,
  };
};
