/**
 * Hook pour le tracking automatique des événements vidéo
 * Suivi des milestones : 25%, 50%, 75%, 100%
 * Play, pause, complete
 * Date : 27 octobre 2025
 */

import { useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface VideoTrackingOptions {
  productId: string;
  lessonId?: string;
  userId?: string;
  sessionId: string;
  enabled?: boolean;
}

interface VideoEventData {
  event_type: 'video_play' | 'video_pause' | 'video_progress' | 'video_complete';
  progress_percent?: number;
  current_time?: number;
  total_duration?: number;
  lesson_id?: string;
}

/**
 * Hook pour tracker les événements vidéo
 */
export const useVideoTracking = (options: VideoTrackingOptions) => {
  const { productId, lessonId, userId, sessionId, enabled = true } = options;

  // Tracker les milestones déjà atteints
  const milestonesReached = useRef<Set<number>>(new Set());
  const hasStarted = useRef(false);

  /**
   * Enregistrer un événement vidéo
   */
  const trackVideoEvent = useCallback(
    async (eventData: VideoEventData) => {
      if (!enabled) return;

      try {
        // Incrémenter le compteur dans product_analytics si c'est un 'play'
        if (eventData.event_type === 'video_play') {
          await supabase.rpc('increment_product_click', {
            p_product_id: productId,
          });
        }

        // Enregistrer l'événement détaillé
        await supabase.from('product_clicks').insert({
          product_id: productId,
          user_id: userId,
          session_id: sessionId,
          click_type: eventData.event_type,
          metadata: {
            ...eventData,
            timestamp: new Date().toISOString(),
          },
        });

        logger.debug('Video event tracked', { eventType: eventData.event_type, productId, lessonId, sessionId });
      } catch (error) {
        logger.error('Error tracking video event', { error, eventData, productId, lessonId });
      }
    },
    [productId, userId, sessionId, enabled]
  );

  /**
   * Tracker le démarrage de la vidéo
   */
  const handlePlay = useCallback(
    (currentTime: number, duration: number) => {
      if (!hasStarted.current) {
        trackVideoEvent({
          event_type: 'video_play',
          current_time: currentTime,
          total_duration: duration,
          lesson_id: lessonId,
        });
        hasStarted.current = true;
      }
    },
    [trackVideoEvent, lessonId]
  );

  /**
   * Tracker la pause
   */
  const handlePause = useCallback(
    (currentTime: number, duration: number) => {
      trackVideoEvent({
        event_type: 'video_pause',
        current_time: currentTime,
        total_duration: duration,
        progress_percent: duration > 0 ? (currentTime / duration) * 100 : 0,
        lesson_id: lessonId,
      });
    },
    [trackVideoEvent, lessonId]
  );

  /**
   * Tracker la progression (25%, 50%, 75%, 100%)
   */
  const handleProgress = useCallback(
    (currentTime: number, duration: number) => {
      if (duration === 0) return;

      const progressPercent = (currentTime / duration) * 100;
      const milestones = [25, 50, 75, 100];

      for (const milestone of milestones) {
        if (
          progressPercent >= milestone &&
          !milestonesReached.current.has(milestone)
        ) {
          milestonesReached.current.add(milestone);

          trackVideoEvent({
            event_type: milestone === 100 ? 'video_complete' : 'video_progress',
            progress_percent: milestone,
            current_time: currentTime,
            total_duration: duration,
            lesson_id: lessonId,
          });

          logger.debug('Video milestone reached', { milestone, productId, lessonId, progressPercent });
        }
      }
    },
    [trackVideoEvent, lessonId]
  );

  /**
   * Réinitialiser le tracking (pour une nouvelle vidéo)
   */
  const resetTracking = useCallback(() => {
    milestonesReached.current.clear();
    hasStarted.current = false;
  }, []);

  return {
    handlePlay,
    handlePause,
    handleProgress,
    resetTracking,
  };
};

/**
 * Hook pour tracker la position de visionnage (pour reprise)
 */
export const useVideoPosition = (enrollmentId?: string, lessonId?: string) => {
  const lastSaveTime = useRef(0);
  const SAVE_INTERVAL = 5000; // Sauvegarder toutes les 5 secondes

  /**
   * Sauvegarder la position actuelle
   */
  const savePosition = useCallback(
    async (currentTime: number) => {
      if (!enrollmentId || !lessonId) return;

      const now = Date.now();
      // Throttle les sauvegardes
      if (now - lastSaveTime.current < SAVE_INTERVAL) return;

      lastSaveTime.current = now;

      try {
        await supabase
          .from('course_lesson_progress')
          .upsert(
            {
              enrollment_id: enrollmentId,
              lesson_id: lessonId,
              last_watched_position_seconds: Math.floor(currentTime),
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'enrollment_id,lesson_id',
            }
          );

        logger.debug('Video position saved', { currentTime: Math.floor(currentTime), enrollmentId, lessonId });
      } catch (error) {
        logger.error('Error saving video position', { error, enrollmentId, lessonId, currentTime });
      }
    },
    [enrollmentId, lessonId]
  );

  return { savePosition };
};

/**
 * Hook pour tracker le temps total de visionnage
 */
export const useWatchTime = (enrollmentId?: string, lessonId?: string) => {
  const watchStartTime = useRef<number | null>(null);
  const totalWatchTime = useRef(0);

  /**
   * Démarrer le chrono
   */
  const startWatching = useCallback(() => {
    watchStartTime.current = Date.now();
  }, []);

  /**
   * Arrêter le chrono et sauvegarder
   */
  const stopWatching = useCallback(async () => {
    if (!watchStartTime.current || !enrollmentId || !lessonId) return;

    const watchDuration = Math.floor((Date.now() - watchStartTime.current) / 1000);
    totalWatchTime.current += watchDuration;
    watchStartTime.current = null;

    try {
      // Incrémenter le temps total de visionnage
      await supabase.rpc('increment_lesson_watch_time', {
        p_enrollment_id: enrollmentId,
        p_lesson_id: lessonId,
        p_seconds: watchDuration,
      });

      logger.debug('Watch time saved', { watchDuration, totalWatchTime: totalWatchTime.current, enrollmentId, lessonId });
    } catch (error) {
      logger.error('Error saving watch time', { error, enrollmentId, lessonId, watchDuration });
    }
  }, [enrollmentId, lessonId]);

  /**
   * Cleanup lors du démontage
   */
  useEffect(() => {
    return () => {
      if (watchStartTime.current) {
        stopWatching();
      }
    };
  }, [stopWatching]);

  return {
    startWatching,
    stopWatching,
    totalWatchTime: totalWatchTime.current,
  };
};

