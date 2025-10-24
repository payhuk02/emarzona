/**
 * Hook pour le tracking analytics des boutiques
 * Track les événements utilisateur : vues, clics, conversions, etc.
 */

import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AnalyticsEventType =
  | 'page_view'
  | 'store_view'
  | 'product_view'
  | 'product_click'
  | 'add_to_cart'
  | 'checkout_initiated'
  | 'purchase'
  | 'share'
  | 'search';

interface TrackEventParams {
  storeId: string;
  eventType: AnalyticsEventType;
  eventData?: Record<string, any>;
}

interface AnalyticsSession {
  sessionId: string;
  startTime: number;
}

// Durée de session : 30 minutes d'inactivité
const SESSION_TIMEOUT = 30 * 60 * 1000;

/**
 * Génère un ID de session unique
 */
const generateSessionId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Récupère ou crée une session analytics
 */
const getOrCreateSession = (): AnalyticsSession => {
  const stored = sessionStorage.getItem('payhuk_analytics_session');
  
  if (stored) {
    try {
      const session: AnalyticsSession = JSON.parse(stored);
      const now = Date.now();
      
      // Si la session n'a pas expiré, la retourner
      if (now - session.startTime < SESSION_TIMEOUT) {
        return session;
      }
    } catch {
      // Session invalide, on en crée une nouvelle
    }
  }
  
  // Créer une nouvelle session
  const newSession: AnalyticsSession = {
    sessionId: generateSessionId(),
    startTime: Date.now()
  };
  
  sessionStorage.setItem('payhuk_analytics_session', JSON.stringify(newSession));
  return newSession;
};

/**
 * Détecte le type d'appareil
 */
const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

/**
 * Détecte la source du trafic
 */
const getTrafficSource = (): string => {
  const referrer = document.referrer;
  
  if (!referrer) return 'direct';
  
  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();
    
    // Réseaux sociaux
    if (hostname.includes('facebook')) return 'facebook';
    if (hostname.includes('instagram')) return 'instagram';
    if (hostname.includes('twitter') || hostname.includes('x.com')) return 'twitter';
    if (hostname.includes('linkedin')) return 'linkedin';
    if (hostname.includes('tiktok')) return 'tiktok';
    if (hostname.includes('youtube')) return 'youtube';
    
    // Moteurs de recherche
    if (hostname.includes('google')) return 'google';
    if (hostname.includes('bing')) return 'bing';
    if (hostname.includes('yahoo')) return 'yahoo';
    if (hostname.includes('duckduckgo')) return 'duckduckgo';
    
    // Autres sites
    return 'referral';
  } catch {
    return 'unknown';
  }
};

/**
 * Hook principal pour le tracking analytics
 */
export const useAnalytics = (storeId?: string) => {
  /**
   * Tracker un événement
   */
  const trackEvent = useCallback(async ({
    storeId: eventStoreId,
    eventType,
    eventData = {}
  }: TrackEventParams) => {
    try {
      // Récupérer ou créer la session
      const session = getOrCreateSession();
      
      // Récupérer l'utilisateur actuel (peut être null si non connecté)
      const { data: { user } } = await supabase.auth.getUser();
      
      // Préparer les données de l'événement
      const eventPayload = {
        store_id: eventStoreId,
        event_type: eventType,
        event_data: eventData,
        session_id: session.sessionId,
        user_id: user?.id || null,
        user_agent: navigator.userAgent,
        referrer: getTrafficSource(),
        device_type: getDeviceType(),
        created_at: new Date().toISOString()
      };
      
      // Envoyer l'événement à Supabase
      const { error } = await supabase
        .from('store_analytics_events')
        .insert(eventPayload);
      
      if (error) {
        console.error('Error tracking event:', error);
      }
    } catch (error) {
      // Ne pas bloquer l'application si le tracking échoue
      console.error('Error in trackEvent:', error);
    }
  }, []);

  /**
   * Tracker une vue de page/boutique
   */
  const trackPageView = useCallback((pageStoreId?: string, additionalData?: Record<string, any>) => {
    const targetStoreId = pageStoreId || storeId;
    if (!targetStoreId) return;

    trackEvent({
      storeId: targetStoreId,
      eventType: 'store_view',
      eventData: {
        path: window.location.pathname,
        title: document.title,
        ...additionalData
      }
    });
  }, [storeId, trackEvent]);

  /**
   * Tracker une vue de produit
   */
  const trackProductView = useCallback((productId: string, productData?: Record<string, any>) => {
    if (!storeId) return;

    trackEvent({
      storeId,
      eventType: 'product_view',
      eventData: {
        product_id: productId,
        ...productData
      }
    });
  }, [storeId, trackEvent]);

  /**
   * Tracker un clic sur un produit
   */
  const trackProductClick = useCallback((productId: string, productData?: Record<string, any>) => {
    if (!storeId) return;

    trackEvent({
      storeId,
      eventType: 'product_click',
      eventData: {
        product_id: productId,
        ...productData
      }
    });
  }, [storeId, trackEvent]);

  /**
   * Tracker un ajout au panier
   */
  const trackAddToCart = useCallback((productId: string, quantity: number = 1, productData?: Record<string, any>) => {
    if (!storeId) return;

    trackEvent({
      storeId,
      eventType: 'add_to_cart',
      eventData: {
        product_id: productId,
        quantity,
        ...productData
      }
    });
  }, [storeId, trackEvent]);

  /**
   * Tracker le démarrage du checkout
   */
  const trackCheckoutInitiated = useCallback((cartData?: Record<string, any>) => {
    if (!storeId) return;

    trackEvent({
      storeId,
      eventType: 'checkout_initiated',
      eventData: cartData || {}
    });
  }, [storeId, trackEvent]);

  /**
   * Tracker un achat complété
   */
  const trackPurchase = useCallback((orderData: {
    orderId: string;
    amount: number;
    currency?: string;
    items?: any[];
  }) => {
    if (!storeId) return;

    trackEvent({
      storeId,
      eventType: 'purchase',
      eventData: {
        order_id: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency || 'XOF',
        items: orderData.items || [],
        timestamp: new Date().toISOString()
      }
    });
  }, [storeId, trackEvent]);

  /**
   * Tracker un partage
   */
  const trackShare = useCallback((platform: string, contentData?: Record<string, any>) => {
    if (!storeId) return;

    trackEvent({
      storeId,
      eventType: 'share',
      eventData: {
        platform,
        ...contentData
      }
    });
  }, [storeId, trackEvent]);

  /**
   * Tracker une recherche
   */
  const trackSearch = useCallback((searchQuery: string, resultsCount?: number) => {
    if (!storeId) return;

    trackEvent({
      storeId,
      eventType: 'search',
      eventData: {
        query: searchQuery,
        results_count: resultsCount
      }
    });
  }, [storeId, trackEvent]);

  /**
   * Tracker automatiquement la vue de page au montage du composant
   */
  useEffect(() => {
    if (storeId) {
      trackPageView();
    }
  }, [storeId, trackPageView]);

  return {
    trackEvent,
    trackPageView,
    trackProductView,
    trackProductClick,
    trackAddToCart,
    trackCheckoutInitiated,
    trackPurchase,
    trackShare,
    trackSearch
  };
};

/**
 * Hook simplifié pour tracker une vue de page unique
 */
export const usePageView = (storeId?: string) => {
  const { trackPageView } = useAnalytics(storeId);
  
  useEffect(() => {
    if (storeId) {
      trackPageView();
    }
  }, [storeId, trackPageView]);
};

