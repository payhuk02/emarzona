/**
 * Hooks pour les analytics de cours
 * Tracking des vues, clics, inscriptions, et métriques avancées
 * Date : 27 octobre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types
interface CourseAnalytics {
  total_views: number;
  total_clicks: number;
  total_enrollments: number;
  conversion_rate: number;
  views_today: number;
  enrollments_today: number;
  views_trend: number; // Pourcentage de changement vs hier
  enrollments_trend: number;
}

interface AnalyticsEvent {
  product_id: string;
  event_type: 'view' | 'click' | 'enrollment' | 'lesson_view' | 'lesson_complete' | 'quiz_attempt';
  user_id?: string;
  session_id?: string;
  metadata?: any;
}

/**
 * Hook pour récupérer les analytics d'un cours
 */
export const useCourseAnalytics = (productId: string) => {
  return useQuery({
    queryKey: ['course-analytics', productId],
    queryFn: async (): Promise<CourseAnalytics> => {
      // Récupérer les analytics du produit
      const { data: analytics, error } = await supabase
        .from('product_analytics')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }

      // Si pas d'analytics existants, créer une entrée
      if (!analytics) {
        const { data: product } = await supabase
          .from('products')
          .select('store_id')
          .eq('id', productId)
          .single();

        if (!product) {
          throw new Error('Produit non trouvé');
        }

        const { data: newAnalytics, error: createError } = await supabase
          .from('product_analytics')
          .insert({
            product_id: productId,
            store_id: product.store_id,
          })
          .select()
          .single();

        if (createError) {
          throw new Error(createError.message);
        }

        return {
          total_views: 0,
          total_clicks: 0,
          total_enrollments: 0,
          conversion_rate: 0,
          views_today: 0,
          enrollments_today: 0,
          views_trend: 0,
          enrollments_trend: 0,
        };
      }

      // Calculer les métriques
      const conversion_rate =
        analytics.total_views > 0
          ? (analytics.total_conversions / analytics.total_views) * 100
          : 0;

      const views_trend =
        analytics.views_yesterday > 0
          ? ((analytics.views_today - analytics.views_yesterday) / analytics.views_yesterday) * 100
          : 0;

      const enrollments_trend =
        analytics.conversions_yesterday > 0
          ? ((analytics.conversions_today - analytics.conversions_yesterday) /
              analytics.conversions_yesterday) *
            100
          : 0;

      return {
        total_views: analytics.total_views || 0,
        total_clicks: analytics.total_clicks || 0,
        total_enrollments: analytics.total_conversions || 0,
        conversion_rate: parseFloat(conversion_rate.toFixed(2)),
        views_today: analytics.views_today || 0,
        enrollments_today: analytics.conversions_today || 0,
        views_trend: parseFloat(views_trend.toFixed(2)),
        enrollments_trend: parseFloat(enrollments_trend.toFixed(2)),
      };
    },
    enabled: !!productId,
  });
};

/**
 * Hook pour tracker un événement analytics
 */
export const useTrackAnalyticsEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: AnalyticsEvent) => {
      const { product_id, event_type, user_id, session_id, metadata } = event;

      // 1. Incrémenter le compteur dans product_analytics
      if (event_type === 'view') {
        await supabase.rpc('increment_product_view', {
          p_product_id: product_id,
        });
      } else if (event_type === 'click') {
        await supabase.rpc('increment_product_click', {
          p_product_id: product_id,
        });
      } else if (event_type === 'enrollment') {
        await supabase.rpc('increment_product_conversion', {
          p_product_id: product_id,
        });
      }

      // 2. Enregistrer l'événement détaillé dans product_views (si vue)
      if (event_type === 'view') {
        await supabase.from('product_views').insert({
          product_id,
          user_id,
          session_id,
          metadata,
        });
      }

      // 3. Enregistrer dans product_clicks (si clic)
      if (event_type === 'click') {
        await supabase.from('product_clicks').insert({
          product_id,
          user_id,
          session_id,
          click_type: 'enroll_button',
          metadata,
        });
      }

      return { success: true };
    },
    onSuccess: (_data, variables) => {
      // Invalider les analytics pour forcer un refresh
      queryClient.invalidateQueries({ queryKey: ['course-analytics', variables.product_id] });
    },
  });
};

/**
 * Hook pour récupérer les vues par jour (graphique)
 */
export const useCourseViewsTimeline = (productId: string, days: number = 7) => {
  return useQuery({
    queryKey: ['course-views-timeline', productId, days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('product_views')
        .select('created_at')
        .eq('product_id', productId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      // Grouper par jour
      const viewsByDay: Record<string, number> = {};
      data.forEach((view) => {
        const date = new Date(view.created_at).toISOString().split('T')[0];
        viewsByDay[date] = (viewsByDay[date] || 0) + 1;
      });

      // Créer un tableau avec tous les jours (même ceux à 0)
      const timeline = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        timeline.push({
          date: dateStr,
          views: viewsByDay[dateStr] || 0,
        });
      }

      return timeline;
    },
    enabled: !!productId,
  });
};

/**
 * Hook pour récupérer les top leçons les plus vues
 */
export const useTopLessons = (courseId: string) => {
  return useQuery({
    queryKey: ['top-lessons', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_lesson_progress')
        .select(
          `
          lesson_id,
          course_lessons!inner(title)
        `
        )
        .eq('course_lessons.course_id', courseId)
        .order('total_watch_time_seconds', { ascending: false })
        .limit(5);

      if (error) {
        throw new Error(error.message);
      }

      // Grouper par leçon
      const lessonViews: Record<
        string,
        { title: string; views: number; watch_time: number }
      > = {};

      data.forEach((progress: any) => {
        const lessonId = progress.lesson_id;
        const title = progress.course_lessons.title;

        if (!lessonViews[lessonId]) {
          lessonViews[lessonId] = { title, views: 0, watch_time: 0 };
        }
        lessonViews[lessonId].views += 1;
        lessonViews[lessonId].watch_time += progress.total_watch_time_seconds || 0;
      });

      return Object.entries(lessonViews)
        .map(([id, data]) => ({
          lesson_id: id,
          ...data,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
    },
    enabled: !!courseId,
  });
};

/**
 * Helper pour générer un session_id unique
 */
export const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('payhuk_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem('payhuk_session_id', sessionId);
  }
  return sessionId;
};

