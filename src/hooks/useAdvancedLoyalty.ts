/**
 * Advanced Loyalty Hook
 * Hook React pour le système de fidélisation avancé
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loyaltyEngine, type LoyaltyTransaction } from '@/lib/loyalty/advanced-loyalty-engine';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export function useLoyaltyProfile(userId?: string) {

  const {
    data: profile,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['loyalty-profile', userId],
    queryFn: () => userId ? loyaltyEngine.getUserProfile(userId) : null,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  return {
    profile,
    isLoading,
    error,
    refetch
  };
}

export function useAwardPoints() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      points,
      reason,
      referenceId,
      referenceType,
      metadata,
      storeId
    }: {
      userId: string;
      points: number;
      reason: string;
      referenceId?: string;
      referenceType?: string;
      metadata?: Record<string, unknown>;
      storeId?: string;
    }) => {
      return await loyaltyEngine.awardPoints(userId, points, reason, referenceId, referenceType, metadata, storeId);
    },
    onSuccess: (data, variables) => {
      // Invalider les queries liées
      queryClient.invalidateQueries({ queryKey: ['loyalty-profile', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-transactions', variables.userId] });

      toast({
        title: "Points crédités !",
        description: `${variables.points} points ajoutés à votre compte.`,
      });

      logger.info('Points awarded successfully', { userId: variables.userId, points: variables.points });
    },
    onError: (error, variables) => {
      toast({
        title: "Erreur",
        description: "Impossible de créditer les points.",
        variant: "destructive"
      });

      logger.error('Failed to award points', { userId: variables.userId, error });
    }
  });
}

export function useRedeemPoints() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      points,
      reason,
      metadata,
      storeId
    }: {
      userId: string;
      points: number;
      reason: string;
      metadata?: Record<string, unknown>;
      storeId?: string;
    }) => {
      return await loyaltyEngine.redeemPoints(userId, points, reason, metadata, storeId);
    },
    onSuccess: (data, variables) => {
      // Invalider les queries liées
      queryClient.invalidateQueries({ queryKey: ['loyalty-profile', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-transactions', variables.userId] });

      toast({
        title: "Points utilisés !",
        description: `${variables.points} points déduits de votre compte.`,
      });

      logger.info('Points redeemed successfully', { userId: variables.userId, points: variables.points });
    },
    onError: (error, variables) => {
      toast({
        title: "Erreur",
        description: "Impossible d'utiliser les points.",
        variant: "destructive"
      });

      logger.error('Failed to redeem points', { userId: variables.userId, error });
    }
  });
}

export function useLoyaltyTransactions(userId?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['loyalty-transactions', userId, page, limit],
    queryFn: async () => {
      if (!userId) return { transactions: [], total: 0, hasMore: false };

      // TODO: Implémenter la pagination des transactions
      // Pour l'instant, retourner un tableau vide
      return {
        transactions: [] as LoyaltyTransaction[],
        total: 0,
        hasMore: false
      };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });
}

export function useProcessLoyaltyEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      eventType,
      eventData,
      storeId
    }: {
      userId: string;
      eventType: Parameters<typeof loyaltyEngine.processLoyaltyEvent>[1];
      eventData: Record<string, any>;
      storeId?: string;
    }) => {
      return await loyaltyEngine.processLoyaltyEvent(userId, eventType, eventData, storeId);
    },
    onSuccess: (result, variables) => {
      if (result.pointsAwarded > 0) {
        // Invalider les queries liées
        queryClient.invalidateQueries({ queryKey: ['loyalty-profile', variables.userId] });

        toast({
          title: "Points gagnés !",
          description: `${result.pointsAwarded} points ajoutés à votre compte.`,
        });

        // Vérifier si nouveau niveau
        if (result.newTier) {
          toast({
            title: "Nouveau niveau atteint !",
            description: `Félicitations ! Vous êtes maintenant ${result.newTier.name}.`,
          });
        }
      }
    },
    onError: (error, variables) => {
      logger.error('Failed to process loyalty event', { userId: variables.userId, eventType: variables.eventType, error });
    }
  });
}

export function useLoyaltyStats(userId?: string) {
  return useQuery({
    queryKey: ['loyalty-stats', userId],
    queryFn: async () => {
      if (!userId) return null;

      const profile = await loyaltyEngine.getUserProfile(userId);

      // Calculer des statistiques supplémentaires
      return {
        totalPoints: profile.totalPoints,
        availablePoints: profile.availablePoints,
        spentPoints: profile.spentPoints,
        currentTier: profile.currentTier,
        pointsToNextTier: profile.pointsToNextTier,
        totalBadges: profile.badges.length,
        currentStreak: profile.streakData.currentStreak,
        totalReferrals: profile.referralStats.totalReferrals,
        successfulReferrals: profile.referralStats.successfulReferrals,
        pointsFromReferrals: profile.referralStats.earnedFromReferrals
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

/**
 * Hook pour intégrer automatiquement les événements de fidélisation
 * dans les composants existants
 */
export function useAutoLoyaltyTracking(userId?: string, storeId?: string) {
  const processEvent = useProcessLoyaltyEvent();

  const trackPurchase = useCallback(async (orderData: {
    orderId: string;
    totalAmount: number;
    items: any[];
  }) => {
    if (!userId) return;

    await processEvent.mutateAsync({
      userId,
      eventType: 'purchase',
      eventData: orderData,
      storeId
    });
  }, [userId, storeId, processEvent]);

  const trackReview = useCallback(async (reviewData: {
    productId: string;
    rating: number;
    reviewId: string;
  }) => {
    if (!userId) return;

    await processEvent.mutateAsync({
      userId,
      eventType: 'review',
      eventData: reviewData,
      storeId
    });
  }, [userId, storeId, processEvent]);

  const trackReferral = useCallback(async (referralData: {
    refereeId: string;
    refereeEmail: string;
  }) => {
    if (!userId) return;

    await processEvent.mutateAsync({
      userId,
      eventType: 'referral',
      eventData: referralData,
      storeId
    });
  }, [userId, storeId, processEvent]);

  const trackSocialShare = useCallback(async (shareData: {
    platform: string;
    contentType: string;
    contentId: string;
  }) => {
    if (!userId) return;

    await processEvent.mutateAsync({
      userId,
      eventType: 'social_share',
      eventData: shareData,
      storeId
    });
  }, [userId, storeId, processEvent]);

  const trackLoginStreak = useCallback(async () => {
    if (!userId) return;

    await processEvent.mutateAsync({
      userId,
      eventType: 'login_streak',
      eventData: { date: new Date().toISOString() },
      storeId
    });
  }, [userId, storeId, processEvent]);

  return {
    trackPurchase,
    trackReview,
    trackReferral,
    trackSocialShare,
    trackLoginStreak
  };
}

// Alias pour compatibilité
export const useAdvancedLoyalty = useAdvancedLoyaltyEvents;