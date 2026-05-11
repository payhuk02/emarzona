/**
 * Hook pour le tracking des interactions avec les recommandations IA
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

interface RecommendationClickData {
  productId?: string;
  recommendedProductId: string;
  reason: string;
  score: number;
  confidence: number;
  position: number;
  source?: string;
}

interface ProductViewData {
  productId: string;
  source?: string;
  sessionId?: string;
}

export const useRecommendationTracking = () => {
  const { user } = useAuth();

  /**
   * Enregistre un clic sur une recommandation
   */
  const trackRecommendationClick = useCallback(async (data: RecommendationClickData) => {
    if (!user?.id) {
      logger.debug('Cannot track recommendation click: user not authenticated');
      return;
    }

    try {
      const { error } = await supabase.rpc('record_recommendation_click', {
        p_user_id: user.id,
        p_product_id: data.productId || null,
        p_recommended_product_id: data.recommendedProductId,
        p_reason: data.reason,
        p_score: data.score,
        p_confidence: data.confidence,
        p_position: data.position
      });

      if (error) {
        logger.error('Failed to track recommendation click', { error, data });
      } else {
        logger.info('Recommendation click tracked', { data });
      }
    } catch (error) {
      logger.error('Exception tracking recommendation click', { error, data });
    }
  }, [user?.id]);

  /**
   * Enregistre une vue de produit
   */
  const trackProductView = useCallback(async (data: ProductViewData) => {
    if (!user?.id) {
      logger.debug('Cannot track product view: user not authenticated');
      return;
    }

    try {
      const { error } = await supabase.rpc('record_product_view', {
        p_user_id: user.id,
        p_product_id: data.productId,
        p_source: data.source || 'direct',
        p_session_id: data.sessionId || null
      });

      if (error) {
        logger.error('Failed to track product view', { error, data });
      } else {
        logger.debug('Product view tracked', { data });
      }
    } catch (error) {
      logger.error('Exception tracking product view', { error, data });
    }
  }, [user?.id]);

  /**
   * Enregistre un achat depuis une recommandation
   */
  const trackRecommendationPurchase = useCallback(async (
    recommendedProductId: string,
    reason: string
  ) => {
    if (!user?.id) {
      logger.debug('Cannot track recommendation purchase: user not authenticated');
      return;
    }

    try {
      // Mettre à jour la table recommendation_analytics pour marquer comme acheté
      const { error } = await supabase
        .from('recommendation_analytics')
        .update({ purchased: true })
        .eq('user_id', user.id)
        .eq('recommended_product_id', recommendedProductId)
        .eq('reason', reason)
        .eq('clicked', true)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // 30 jours

      if (error) {
        logger.error('Failed to track recommendation purchase', { error, recommendedProductId, reason });
      } else {
        logger.info('Recommendation purchase tracked', { recommendedProductId, reason });
      }
    } catch (error) {
      logger.error('Exception tracking recommendation purchase', { error, recommendedProductId, reason });
    }
  }, [user?.id]);

  return {
    trackRecommendationClick,
    trackProductView,
    trackRecommendationPurchase
  };
};