/**
 * Hook pour la gestion des analytics email
 * Date: 1er Février 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  EmailAnalyticsService,
  type EmailAnalyticsDaily,
  type EmailAnalyticsSummary,
  type EmailAnalyticsFilters,
} from '@/lib/email/email-analytics-service';

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook pour récupérer les analytics quotidiennes
 */
export const useEmailAnalyticsDaily = (filters: EmailAnalyticsFilters) => {
  return useQuery({
    queryKey: ['email-analytics-daily', filters],
    queryFn: async (): Promise<EmailAnalyticsDaily[]> => {
      return EmailAnalyticsService.getDailyAnalytics(filters);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!filters.storeId,
  });
};

/**
 * Hook pour récupérer un résumé des analytics
 */
export const useEmailAnalyticsSummary = (filters: EmailAnalyticsFilters) => {
  return useQuery({
    queryKey: ['email-analytics-summary', filters],
    queryFn: async (): Promise<EmailAnalyticsSummary> => {
      return EmailAnalyticsService.getAnalyticsSummary(filters);
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!filters.storeId,
  });
};

/**
 * Hook pour calculer les analytics quotidiennes
 */
export const useCalculateDailyAnalytics = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      date,
      storeId,
    }: {
      date?: string;
      storeId?: string;
    }): Promise<boolean> => {
      return EmailAnalyticsService.calculateDailyAnalytics(date, storeId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['email-analytics-daily'] });
      queryClient.invalidateQueries({ queryKey: ['email-analytics-summary'] });
      toast({
        title: 'Analytics calculées',
        description: 'Les analytics ont été recalculées avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error calculating daily analytics', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du calcul des analytics.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour récupérer les analytics d'une campagne
 */
export const useCampaignAnalytics = (campaignId: string | undefined) => {
  return useQuery({
    queryKey: ['campaign-analytics', campaignId],
    queryFn: async (): Promise<EmailAnalyticsSummary> => {
      if (!campaignId) throw new Error('Campaign ID is required');
      return EmailAnalyticsService.getCampaignAnalytics(campaignId);
    },
    enabled: !!campaignId,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook pour récupérer les analytics d'une séquence
 */
export const useSequenceAnalytics = (sequenceId: string | undefined) => {
  return useQuery({
    queryKey: ['sequence-analytics', sequenceId],
    queryFn: async (): Promise<EmailAnalyticsSummary> => {
      if (!sequenceId) throw new Error('Sequence ID is required');
      return EmailAnalyticsService.getSequenceAnalytics(sequenceId);
    },
    enabled: !!sequenceId,
    staleTime: 1000 * 60 * 5,
  });
};







