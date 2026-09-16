import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { isPostHogConfigured } from '@/lib/analytics/posthog-config';

interface UserBehaviorEvent {
  user_id?: string;
  session_id: string;
  event_type:
    | 'page_view'
    | 'product_view'
    | 'cart_add'
    | 'cart_remove'
    | 'purchase_start'
    | 'purchase_complete'
    | 'search'
    | 'filter'
    | 'share'
    | 'wishlist_add'
    | 'review_view'
    | 'contact_form'
    | 'newsletter_signup';
  event_data: Record<string, unknown>;
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
  /** @deprecated LOT C — PostHog only; ignored */
  enableRealTimeTracking?: boolean;
  /** @deprecated LOT C — PostHog only; ignored */
  batchSize?: number;
  /** @deprecated LOT C — PostHog only; ignored */
  flushInterval?: number;
}

export const useBehavioralAnalytics = (userId?: string, config: BehavioralAnalyticsConfig = {}) => {
  const {
    trackPageViews = false,
    trackProductViews = false,
    trackCartActions = false,
    trackSearchAndFilter = false,
    trackSocialInteractions = false,
    trackFormInteractions = false,
  } = config;

  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }, []);

  const getDeviceInfo = useCallback(() => {
    const ua = navigator.userAgent;
    const screen = window.screen;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      deviceType = /iPad|Android(?=.*\bMobile\b)|Windows Phone/i.test(ua) ? 'tablet' : 'mobile';
    }

    let browser = 'Unknown';
    if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') > -1) browser = 'Safari';
    else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident/') > -1) browser = 'Internet Explorer';
    else if (ua.indexOf('Edge') > -1) browser = 'Edge';

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

  // LOT C: PostHog only — user_behavior_events dropped
  const trackEvent = useMutation({
    mutationFn: async (
      event: Omit<UserBehaviorEvent, 'session_id' | 'device_info' | 'timestamp'>
    ) => {
      if (!isPostHogConfigured()) return;

      const fullEvent: UserBehaviorEvent = {
        ...event,
        session_id: getSessionId(),
        device_info: getDeviceInfo(),
        timestamp: new Date().toISOString(),
      };

      const { capturePostHogEvent } = await import('@/lib/analytics/posthog');
      capturePostHogEvent(`behavior_${fullEvent.event_type}`, {
        page_url: fullEvent.page_url,
        referrer: fullEvent.referrer ?? null,
        device_type: fullEvent.device_info.device_type,
        session_id: fullEvent.session_id,
        user_id: fullEvent.user_id ?? null,
        source: 'useBehavioralAnalytics',
      });
    },
  });

  const trackPageView = useCallback(
    (pageUrl: string, referrer?: string) => {
      if (!trackPageViews) return;
      trackEvent.mutate({
        user_id: userId,
        event_type: 'page_view',
        event_data: {},
        page_url: pageUrl,
        referrer,
      });
    },
    [trackPageViews, userId, trackEvent]
  );

  const trackProductView = useCallback(
    (productId: string, productName: string, category?: string) => {
      if (!trackProductViews) return;
      trackEvent.mutate({
        user_id: userId,
        event_type: 'product_view',
        event_data: { productId, productName, category },
        page_url: window.location.href,
      });
    },
    [trackProductViews, userId, trackEvent]
  );

  const trackCartAdd = useCallback(
    (productId: string, quantity: number, price: number) => {
      if (!trackCartActions) return;
      trackEvent.mutate({
        user_id: userId,
        event_type: 'cart_add',
        event_data: { productId, quantity, price },
        page_url: window.location.href,
      });
    },
    [trackCartActions, userId, trackEvent]
  );

  const trackCartRemove = useCallback(
    (productId: string) => {
      if (!trackCartActions) return;
      trackEvent.mutate({
        user_id: userId,
        event_type: 'cart_remove',
        event_data: { productId },
        page_url: window.location.href,
      });
    },
    [trackCartActions, userId, trackEvent]
  );

  const trackSearch = useCallback(
    (query: string, filters?: Record<string, unknown>) => {
      if (!trackSearchAndFilter) return;
      trackEvent.mutate({
        user_id: userId,
        event_type: 'search',
        event_data: { query, filters },
        page_url: window.location.href,
      });
    },
    [trackSearchAndFilter, userId, trackEvent]
  );

  const trackFilter = useCallback(
    (filters: Record<string, unknown>) => {
      if (!trackSearchAndFilter) return;
      trackEvent.mutate({
        user_id: userId,
        event_type: 'filter',
        event_data: { filters },
        page_url: window.location.href,
      });
    },
    [trackSearchAndFilter, userId, trackEvent]
  );

  const trackShare = useCallback(
    (contentType: string, contentId: string) => {
      if (!trackSocialInteractions) return;
      trackEvent.mutate({
        user_id: userId,
        event_type: 'share',
        event_data: { contentType, contentId },
        page_url: window.location.href,
      });
    },
    [trackSocialInteractions, userId, trackEvent]
  );

  const trackFormInteraction = useCallback(
    (formType: 'contact_form' | 'newsletter_signup', formData?: Record<string, unknown>) => {
      if (!trackFormInteractions) return;
      trackEvent.mutate({
        user_id: userId,
        event_type: formType,
        event_data: formData ?? {},
        page_url: window.location.href,
      });
    },
    [trackFormInteractions, userId, trackEvent]
  );

  return {
    trackPageView,
    trackProductView,
    trackCartAdd,
    trackCartRemove,
    trackSearch,
    trackFilter,
    trackShare,
    trackFormInteraction,
    trackEvent: trackEvent.mutate,
    isTracking: trackEvent.isPending,
  };
};
