import { useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface UserBehaviorEvent {
  user_id?: string;
  session_id: string;
  event_type: 'page_view' | 'product_view' | 'cart_add' | 'cart_remove' | 'purchase_start' | 'purchase_complete' | 'search' | 'filter' | 'share' | 'wishlist_add' | 'review_view' | 'contact_form' | 'newsletter_signup';
  event_data: Record<string, any>;
  page_url: string;
  referrer?: string;
  device_info: {
    user_agent: string;
    screen_width: number;
    screen_height: number;
    viewport_width: number;
    viewport_height: number;
    device_type: 'mobile' | 'tablet' | 'desktop';
    browser: string;
    os: string;
  };
  timestamp: string;
}

interface BehavioralAnalyticsConfig {
  trackPageViews?: boolean;
  trackProductViews?: boolean;
  trackCartActions?: boolean;
  trackSearchAndFilter?: boolean;
  trackSocialInteractions?: boolean;
  trackFormInteractions?: boolean;
  enableRealTimeTracking?: boolean;
  batchSize?: number;
  flushInterval?: number;
}

export const useBehavioralAnalytics = (
  userId?: string,
  config: BehavioralAnalyticsConfig = {}
) => {
  const {
    trackPageViews = true,
    trackProductViews = true,
    trackCartActions = true,
    trackSearchAndFilter = true,
    trackSocialInteractions = true,
    trackFormInteractions = true,
    enableRealTimeTracking = false,
    batchSize = 10,
    flushInterval = 30000, // 30 seconds
  } = config;

  // Generate or get session ID
  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }, []);

  // Get device information
  const getDeviceInfo = useCallback(() => {
    const ua = navigator.userAgent;
    const screen = window.screen;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Detect device type
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      deviceType = /iPad|Android(?=.*\bMobile\b)|Windows Phone/i.test(ua) ? 'tablet' : 'mobile';
    }

    // Detect browser
    let browser = 'Unknown';
    if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') > -1) browser = 'Safari';
    else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident/') > -1) browser = 'Internet Explorer';
    else if (ua.indexOf('Edge') > -1) browser = 'Edge';

    // Detect OS
    let os = 'Unknown';
    if (ua.indexOf('Windows NT') > -1) os = 'Windows';
    else if (ua.indexOf('Mac OS X') > -1) os = 'macOS';
    else if (ua.indexOf('Linux') > -1) os = 'Linux';
    else if (ua.indexOf('Android') > -1) os = 'Android';
    else if (ua.indexOf('iOS') > -1) os = 'iOS';

    return {
      user_agent: ua,
      screen_width: screen.width,
      screen_height: screen.height,
      viewport_width: viewport.width,
      viewport_height: viewport.height,
      device_type: deviceType,
      browser,
      os,
    };
  }, []);

  // Track behavior event
  const trackEvent = useMutation({
    mutationFn: async (event: Omit<UserBehaviorEvent, 'session_id' | 'device_info' | 'timestamp'>) => {
      const fullEvent: UserBehaviorEvent = {
        ...event,
        session_id: getSessionId(),
        device_info: getDeviceInfo(),
        timestamp: new Date().toISOString(),
      };

      if (enableRealTimeTracking) {
        // Send immediately
        const { error } = await supabase
          .from('user_behavior_events')
          .insert(fullEvent);

        if (error) {
          logger.error('Error tracking behavior event', { error, event: fullEvent });
          throw error;
        }
      } else {
        // Batch events in localStorage
        const existingEvents = JSON.parse(localStorage.getItem('behavior_events') || '[]');
        existingEvents.push(fullEvent);

        if (existingEvents.length >= batchSize) {
          await flushEvents(existingEvents);
          localStorage.removeItem('behavior_events');
        } else {
          localStorage.setItem('behavior_events', JSON.stringify(existingEvents));
        }
      }
    },
  });

  // Flush batched events
  const flushEvents = useCallback(async (events?: UserBehaviorEvent[]) => {
    const eventsToFlush = events || JSON.parse(localStorage.getItem('behavior_events') || '[]');

    if (eventsToFlush.length === 0) return;

    try {
      const { error } = await supabase
        .from('user_behavior_events')
        .insert(eventsToFlush);

      if (error) {
        logger.error('Error flushing behavior events', { error });
        throw error;
      }

      localStorage.removeItem('behavior_events');
      logger.info(`Flushed ${eventsToFlush.length} behavior events`);
    } catch (error) {
      logger.error('Failed to flush behavior events', { error });
    }
  }, []);

  // Auto-flush events periodically
  useEffect(() => {
    if (enableRealTimeTracking) return;

    const interval = setInterval(() => {
      flushEvents();
    }, flushInterval);

    // Flush on page unload
    const handleUnload = () => {
      flushEvents();
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [enableRealTimeTracking, flushInterval, flushEvents]);

  // Page view tracking
  const trackPageView = useCallback((pageUrl: string, referrer?: string) => {
    if (!trackPageViews) return;

    trackEvent.mutate({
      user_id: userId,
      event_type: 'page_view',
      event_data: {},
      page_url: pageUrl,
      referrer,
    });
  }, [trackPageViews, userId, trackEvent]);

  // Product view tracking
  const trackProductView = useCallback((productId: string, productName: string, category?: string) => {
    if (!trackProductViews) return;

    trackEvent.mutate({
      user_id: userId,
      event_type: 'product_view',
      event_data: { productId, productName, category },
      page_url: window.location.href,
    });
  }, [trackProductViews, userId, trackEvent]);

  // Cart actions tracking
  const trackCartAdd = useCallback((productId: string, quantity: number, price: number) => {
    if (!trackCartActions) return;

    trackEvent.mutate({
      user_id: userId,
      event_type: 'cart_add',
      event_data: { productId, quantity, price },
      page_url: window.location.href,
    });
  }, [trackCartActions, userId, trackEvent]);

  const trackCartRemove = useCallback((productId: string, quantity: number) => {
    if (!trackCartActions) return;

    trackEvent.mutate({
      user_id: userId,
      event_type: 'cart_remove',
      event_data: { productId, quantity },
      page_url: window.location.href,
    });
  }, [trackCartActions, userId, trackEvent]);

  // Search and filter tracking
  const trackSearch = useCallback((query: string, resultsCount: number, filters?: Record<string, any>) => {
    if (!trackSearchAndFilter) return;

    trackEvent.mutate({
      user_id: userId,
      event_type: 'search',
      event_data: { query, resultsCount, filters },
      page_url: window.location.href,
    });
  }, [trackSearchAndFilter, userId, trackEvent]);

  const trackFilter = useCallback((filterType: string, filterValue: any, resultsCount: number) => {
    if (!trackSearchAndFilter) return;

    trackEvent.mutate({
      user_id: userId,
      event_type: 'filter',
      event_data: { filterType, filterValue, resultsCount },
      page_url: window.location.href,
    });
  }, [trackSearchAndFilter, userId, trackEvent]);

  // Social interactions tracking
  const trackShare = useCallback((platform: string, contentType: string, contentId: string) => {
    if (!trackSocialInteractions) return;

    trackEvent.mutate({
      user_id: userId,
      event_type: 'share',
      event_data: { platform, contentType, contentId },
      page_url: window.location.href,
    });
  }, [trackSocialInteractions, userId, trackEvent]);

  // Form interactions tracking
  const trackFormInteraction = useCallback((formType: string, action: 'start' | 'submit' | 'abandon', formData?: Record<string, any>) => {
    if (!trackFormInteractions) return;

    trackEvent.mutate({
      user_id: userId,
      event_type: formType === 'newsletter' ? 'newsletter_signup' : 'contact_form',
      event_data: { formType, action, ...formData },
      page_url: window.location.href,
    });
  }, [trackFormInteractions, userId, trackEvent]);

  // Purchase tracking
  const trackPurchaseStart = useCallback((cartItems: any[], totalAmount: number) => {
    trackEvent.mutate({
      user_id: userId,
      event_type: 'purchase_start',
      event_data: { cartItems, totalAmount },
      page_url: window.location.href,
    });
  }, [userId, trackEvent]);

  const trackPurchaseComplete = useCallback((orderId: string, totalAmount: number, items: any[]) => {
    trackEvent.mutate({
      user_id: userId,
      event_type: 'purchase_complete',
      event_data: { orderId, totalAmount, items },
      page_url: window.location.href,
    });
  }, [userId, trackEvent]);

  // Auto-track page views
  useEffect(() => {
    if (trackPageViews) {
      trackPageView(window.location.href, document.referrer);
    }
  }, [trackPageViews, trackPageView]);

  return {
    trackPageView,
    trackProductView,
    trackCartAdd,
    trackCartRemove,
    trackSearch,
    trackFilter,
    trackShare,
    trackFormInteraction,
    trackPurchaseStart,
    trackPurchaseComplete,
    flushEvents,
    isTracking: trackEvent.isPending,
  };
};