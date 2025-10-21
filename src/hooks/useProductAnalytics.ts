import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Types pour les analytics
export interface ProductAnalytics {
  id: string;
  product_id: string;
  store_id: string;
  total_views: number;
  total_clicks: number;
  total_conversions: number;
  total_revenue: number;
  conversion_rate: number;
  bounce_rate: number;
  avg_session_duration: number;
  returning_visitors: number;
  views_today: number;
  clicks_today: number;
  conversions_today: number;
  revenue_today: number;
  views_yesterday: number;
  clicks_yesterday: number;
  conversions_yesterday: number;
  revenue_yesterday: number;
  tracking_enabled: boolean;
  track_views: boolean;
  track_clicks: boolean;
  track_conversions: boolean;
  track_time_spent: boolean;
  track_errors: boolean;
  advanced_tracking: boolean;
  custom_events: string[];
  google_analytics_id?: string;
  facebook_pixel_id?: string;
  google_tag_manager_id?: string;
  tiktok_pixel_id?: string;
  pinterest_pixel_id?: string;
  linkedin_insight_tag?: string;
  goal_views?: number;
  goal_revenue?: number;
  goal_conversions?: number;
  goal_conversion_rate?: number;
  email_alerts: boolean;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  product_id: string;
  store_id: string;
  user_id?: string;
  event_type: 'view' | 'click' | 'conversion' | 'purchase' | 'session_start' | 'session_end' | 'error' | 'custom';
  event_data: Record<string, any>;
  session_id?: string;
  page_url?: string;
  referrer?: string;
  user_agent?: string;
  ip_address?: string;
  country?: string;
  city?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  duration?: number;
  revenue?: number;
  created_at: string;
}

export interface UserSession {
  id: string;
  session_id: string;
  product_id: string;
  store_id: string;
  user_id?: string;
  start_time: string;
  end_time?: string;
  duration: number;
  page_views: number;
  clicks: number;
  conversions: number;
  country?: string;
  city?: string;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsReport {
  id: string;
  product_id: string;
  store_id: string;
  user_id: string;
  report_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  report_format: 'pdf' | 'csv' | 'xlsx' | 'json';
  start_date: string;
  end_date: string;
  include_charts: boolean;
  report_data: Record<string, any>;
  file_url?: string;
  file_size?: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

// Hook principal pour les analytics d'un produit
export const useProductAnalytics = (productId: string) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<ProductAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);

  // Charger les analytics du produit
  const loadAnalytics = useCallback(async () => {
    if (!productId || !user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('product_analytics')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!data) {
        // Initialiser les analytics pour ce produit
        const { error: initError } = await supabase.rpc('initialize_product_analytics', {
          p_product_id: productId
        });

        if (initError) {
          throw initError;
        }

        // Recharger après initialisation
        const { data: newData, error: reloadError } = await supabase
          .from('product_analytics')
          .select('*')
          .eq('product_id', productId)
          .single();

        if (reloadError) {
          throw reloadError;
        }

        setAnalytics(newData);
      } else {
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des analytics:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [productId, user]);

  // Mettre à jour les analytics
  const updateAnalytics = useCallback(async (updates: Partial<ProductAnalytics>) => {
    if (!analytics || !user) return;

    try {
      const { data, error } = await supabase
        .from('product_analytics')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', analytics.id)
        .select()
        .single();

      if (error) throw error;

      setAnalytics(data);
    } catch (err) {
      console.error('Erreur lors de la mise à jour des analytics:', err);
      throw err;
    }
  }, [analytics, user]);

  // Charger les analytics au montage
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Abonnement en temps réel
  useEffect(() => {
    if (!productId || !isRealTimeActive) return;

    const subscription = supabase
      .channel(`product_analytics_${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_analytics',
          filter: `product_id=eq.${productId}`
        },
        (payload) => {
          if (payload.new) {
            setAnalytics(payload.new as ProductAnalytics);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [productId, isRealTimeActive]);

  // Calculer les pourcentages de changement
  const changePercentages = useMemo(() => {
    if (!analytics) return null;

    const calculateChange = (today: number, yesterday: number) => {
      if (yesterday === 0) return today > 0 ? 100 : 0;
      return ((today - yesterday) / yesterday) * 100;
    };

    return {
      views: calculateChange(analytics.views_today, analytics.views_yesterday),
      clicks: calculateChange(analytics.clicks_today, analytics.clicks_yesterday),
      conversions: calculateChange(analytics.conversions_today, analytics.conversions_yesterday),
      revenue: calculateChange(analytics.revenue_today, analytics.revenue_yesterday)
    };
  }, [analytics]);

  return {
    analytics,
    loading,
    error,
    isRealTimeActive,
    setIsRealTimeActive,
    loadAnalytics,
    updateAnalytics,
    changePercentages
  };
};

// Hook pour tracker les événements
export const useAnalyticsTracking = () => {
  const { user } = useAuth();

  const trackEvent = useCallback(async (
    productId: string,
    eventType: AnalyticsEvent['event_type'],
    eventData: Record<string, any> = {},
    revenue?: number
  ) => {
    try {
      // Générer un session_id unique si pas déjà présent
      let sessionId = eventData.session_id;
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Détecter les informations du navigateur
      const userAgent = navigator.userAgent;
      const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 
                        /Tablet|iPad/.test(userAgent) ? 'tablet' : 'desktop';

      const eventPayload = {
        product_id: productId,
        user_id: user?.id || null,
        event_type: eventType,
        event_data: eventData,
        session_id: sessionId,
        page_url: window.location.href,
        referrer: document.referrer || null,
        user_agent: userAgent,
        device_type: deviceType,
        revenue: revenue || null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('analytics_events')
        .insert(eventPayload);

      if (error) throw error;

      return sessionId;
    } catch (err) {
      console.error('Erreur lors du tracking:', err);
      throw err;
    }
  }, [user]);

  const trackView = useCallback((productId: string, additionalData: Record<string, any> = {}) => {
    return trackEvent(productId, 'view', {
      ...additionalData,
      timestamp: Date.now()
    });
  }, [trackEvent]);

  const trackClick = useCallback((productId: string, elementId: string, additionalData: Record<string, any> = {}) => {
    return trackEvent(productId, 'click', {
      element_id: elementId,
      ...additionalData,
      timestamp: Date.now()
    });
  }, [trackEvent]);

  const trackConversion = useCallback((productId: string, revenue: number, additionalData: Record<string, any> = {}) => {
    return trackEvent(productId, 'conversion', {
      ...additionalData,
      timestamp: Date.now()
    }, revenue);
  }, [trackEvent]);

  const trackCustomEvent = useCallback((productId: string, eventName: string, eventData: Record<string, any> = {}) => {
    return trackEvent(productId, 'custom', {
      custom_event_name: eventName,
      ...eventData,
      timestamp: Date.now()
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackView,
    trackClick,
    trackConversion,
    trackCustomEvent
  };
};

// Hook pour les sessions utilisateur
export const useUserSessions = (productId: string) => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async (limit = 50) => {
    if (!productId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('product_id', productId)
        .order('start_time', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      setSessions(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des sessions:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const startSession = useCallback(async (productId: string, additionalData: Record<string, any> = {}) => {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const sessionData = {
        session_id: sessionId,
        product_id: productId,
        start_time: new Date().toISOString(),
        duration: 0,
        page_views: 1,
        clicks: 0,
        conversions: 0,
        ...additionalData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Erreur lors du démarrage de session:', err);
      throw err;
    }
  }, []);

  const endSession = useCallback(async (sessionId: string, additionalData: Record<string, any> = {}) => {
    try {
      const endTime = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('user_sessions')
        .update({
          end_time: endTime,
          updated_at: endTime,
          ...additionalData
        })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Erreur lors de la fin de session:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    loading,
    error,
    loadSessions,
    startSession,
    endSession
  };
};

// Hook pour les rapports
export const useAnalyticsReports = (productId: string) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<AnalyticsReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    if (!productId || !user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('analytics_reports')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setReports(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des rapports:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [productId, user]);

  const generateReport = useCallback(async (
    reportType: AnalyticsReport['report_type'],
    reportFormat: AnalyticsReport['report_format'],
    startDate: string,
    endDate: string,
    includeCharts: boolean = true
  ) => {
    if (!productId || !user) return;

    try {
      const reportData = {
        product_id: productId,
        user_id: user.id,
        report_type: reportType,
        report_format: reportFormat,
        start_date: startDate,
        end_date: endDate,
        include_charts: includeCharts,
        status: 'pending' as const,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('analytics_reports')
        .insert(reportData)
        .select()
        .single();

      if (error) throw error;

      // Recharger la liste des rapports
      await loadReports();

      return data;
    } catch (err) {
      console.error('Erreur lors de la génération du rapport:', err);
      throw err;
    }
  }, [productId, user, loadReports]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return {
    reports,
    loading,
    error,
    loadReports,
    generateReport
  };
};

// Hook pour les données historiques
export const useAnalyticsHistory = (productId: string, days: number = 30) => {
  const [history, setHistory] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!productId) return;

    try {
      setLoading(true);
      setError(null);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error: fetchError } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('product_id', productId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setHistory(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement de l\'historique:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [productId, days]);

  // Grouper les données par jour pour les graphiques
  const dailyData = useMemo(() => {
    const grouped: Record<string, {
      date: string;
      views: number;
      clicks: number;
      conversions: number;
      revenue: number;
    }> = {};

    history.forEach(event => {
      const date = event.created_at.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = {
          date,
          views: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0
        };
      }

      switch (event.event_type) {
        case 'view':
          grouped[date].views++;
          break;
        case 'click':
          grouped[date].clicks++;
          break;
        case 'conversion':
          grouped[date].conversions++;
          grouped[date].revenue += event.revenue || 0;
          break;
      }
    });

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [history]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    dailyData,
    loading,
    error,
    loadHistory
  };
};
