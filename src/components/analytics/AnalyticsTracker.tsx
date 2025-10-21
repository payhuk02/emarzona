import { useEffect, useCallback, useRef } from 'react';
import { useAnalyticsTracking } from '@/hooks/useProductAnalytics';

interface AnalyticsTrackerProps {
  productId: string;
  enabled?: boolean;
  trackViews?: boolean;
  trackClicks?: boolean;
  trackTimeSpent?: boolean;
  trackErrors?: boolean;
  customEvents?: string[];
}

export const AnalyticsTracker: React.FC<AnalyticsTrackerProps> = ({
  productId,
  enabled = true,
  trackViews = true,
  trackClicks = true,
  trackTimeSpent = true,
  trackErrors = true,
  customEvents = []
}) => {
  const { trackView, trackClick, trackCustomEvent } = useAnalyticsTracking();
  const sessionStartTime = useRef<number>(Date.now());
  const lastActivityTime = useRef<number>(Date.now());
  const activityTimeout = useRef<NodeJS.Timeout | null>(null);

  // Tracker les vues de page
  useEffect(() => {
    if (!enabled || !trackViews || !productId) return;

    const trackPageView = () => {
      trackView(productId, {
        page_url: window.location.href,
        referrer: document.referrer,
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
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
  }, [enabled, trackViews, productId, trackView]);

  // Tracker les clics
  useEffect(() => {
    if (!enabled || !trackClicks || !productId) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Ignorer les clics sur des éléments non interactifs
      if (!target || target.tagName === 'SCRIPT' || target.tagName === 'STYLE') {
        return;
      }

      // Identifier l'élément cliqué
      const elementId = target.id || target.className || target.tagName;
      const elementText = target.textContent?.slice(0, 100) || '';
      const elementType = target.tagName.toLowerCase();
      
      // Déterminer si c'est un élément important
      const isImportantElement = 
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.classList.contains('btn') ||
        target.classList.contains('button') ||
        target.getAttribute('role') === 'button' ||
        target.onclick !== null;

      if (isImportantElement) {
        trackClick(productId, elementId, {
          element_type: elementType,
          element_text: elementText,
          element_href: target.getAttribute('href'),
          click_position: {
            x: event.clientX,
            y: event.clientY
          },
          timestamp: Date.now()
        });
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [enabled, trackClicks, productId, trackClick]);

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
        
        if (timeSpent > 5) { // Only track if user spent more than 5 seconds
          trackCustomEvent(productId, 'time_spent', {
            duration: timeSpent,
            page_url: window.location.href,
            timestamp: Date.now()
          });
        }
      }, 30000); // 30 seconds of inactivity
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
          trackCustomEvent(productId, 'session_pause', {
            duration: timeSpent,
            page_url: window.location.href,
            timestamp: Date.now()
          });
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
  }, [enabled, trackTimeSpent, productId, trackCustomEvent]);

  // Tracker les erreurs JavaScript
  useEffect(() => {
    if (!enabled || !trackErrors || !productId) return;

    const handleError = (event: ErrorEvent) => {
      trackCustomEvent(productId, 'javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        page_url: window.location.href,
        timestamp: Date.now()
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackCustomEvent(productId, 'unhandled_promise_rejection', {
        reason: event.reason?.toString(),
        page_url: window.location.href,
        timestamp: Date.now()
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [enabled, trackErrors, productId, trackCustomEvent]);

  // Tracker les événements personnalisés
  useEffect(() => {
    if (!enabled || !customEvents.length || !productId) return;

    const handleCustomEvent = (event: CustomEvent) => {
      const eventName = event.detail?.name || event.type;
      
      if (customEvents.includes(eventName)) {
        trackCustomEvent(productId, eventName, {
          ...event.detail,
          page_url: window.location.href,
          timestamp: Date.now()
        });
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
  }, [enabled, customEvents, productId, trackCustomEvent]);

  // Tracker les conversions (achats)
  const trackPurchase = useCallback((revenue: number, orderId?: string, additionalData?: Record<string, any>) => {
    if (!enabled || !productId) return;

    trackCustomEvent(productId, 'purchase', {
      revenue,
      order_id: orderId,
      currency: 'XOF',
      page_url: window.location.href,
      timestamp: Date.now(),
      ...additionalData
    });
  }, [enabled, productId, trackCustomEvent]);

  // Exposer la fonction de tracking des achats globalement
  useEffect(() => {
    if (!enabled || !productId) return;

    // Exposer la fonction globalement pour qu'elle puisse être appelée depuis d'autres composants
    (window as any).trackPurchase = trackPurchase;

    return () => {
      delete (window as any).trackPurchase;
    };
  }, [enabled, productId, trackPurchase]);

  return null; // Ce composant ne rend rien visuellement
};

// Hook pour utiliser le tracking depuis d'autres composants
export const useAnalyticsTracker = () => {
  const trackCustomEvent = useCallback((productId: string, eventName: string, eventData?: Record<string, any>) => {
    // Dispatcher un événement personnalisé
    const event = new CustomEvent(`analytics_${eventName}`, {
      detail: {
        name: eventName,
        ...eventData
      }
    });
    
    document.dispatchEvent(event);
  }, []);

  const trackPurchase = useCallback((productId: string, revenue: number, orderId?: string, additionalData?: Record<string, any>) => {
    trackCustomEvent(productId, 'purchase', {
      revenue,
      order_id: orderId,
      ...additionalData
    });
  }, [trackCustomEvent]);

  const trackConversion = useCallback((productId: string, conversionType: string, additionalData?: Record<string, any>) => {
    trackCustomEvent(productId, 'conversion', {
      conversion_type: conversionType,
      ...additionalData
    });
  }, [trackCustomEvent]);

  return {
    trackCustomEvent,
    trackPurchase,
    trackConversion
  };
};
