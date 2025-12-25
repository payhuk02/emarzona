/**
 * Hook pour la gestion des campagnes email
 * Date: 1er Février 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  EmailCampaignService,
  type EmailCampaign,
  type CreateCampaignPayload,
  type UpdateCampaignPayload,
  type CampaignStatus,
  type CampaignType,
} from '@/lib/email/email-campaign-service';

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook pour récupérer toutes les campagnes d'un store
 */
export const useEmailCampaigns = (
  storeId: string | undefined,
  filters?: {
    status?: CampaignStatus;
    type?: CampaignType;
    limit?: number;
    offset?: number;
  }
) => {
  return useQuery({
    queryKey: ['email-campaigns', storeId, filters],
    queryFn: async (): Promise<EmailCampaign[]> => {
      if (!storeId) return [];
      return EmailCampaignService.getCampaigns(storeId, filters);
    },
    enabled: !!storeId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook pour récupérer une campagne spécifique
 */
export const useEmailCampaign = (campaignId: string | undefined) => {
  return useQuery({
    queryKey: ['email-campaign', campaignId],
    queryFn: async (): Promise<EmailCampaign | null> => {
      if (!campaignId) return null;
      return EmailCampaignService.getCampaign(campaignId);
    },
    enabled: !!campaignId,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook pour créer une campagne
 */
export const useCreateEmailCampaign = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: CreateCampaignPayload): Promise<EmailCampaign> => {
      return EmailCampaignService.createCampaign(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns', data.store_id] });
      queryClient.setQueryData(['email-campaign', data.id], data);
      toast({
        title: 'Campagne créée',
        description: 'La campagne a été créée avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error creating campaign', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la création de la campagne.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour mettre à jour une campagne
 */
export const useUpdateEmailCampaign = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      campaignId,
      payload,
    }: {
      campaignId: string;
      payload: UpdateCampaignPayload;
    }): Promise<EmailCampaign> => {
      return EmailCampaignService.updateCampaign(campaignId, payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns', data.store_id] });
      queryClient.setQueryData(['email-campaign', data.id], data);
      toast({
        title: 'Campagne mise à jour',
        description: 'La campagne a été mise à jour avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error updating campaign', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la mise à jour de la campagne.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour supprimer une campagne
 */
export const useDeleteEmailCampaign = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      campaignId,
      storeId,
    }: {
      campaignId: string;
      storeId: string;
    }): Promise<boolean> => {
      return EmailCampaignService.deleteCampaign(campaignId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns', variables.storeId] });
      queryClient.removeQueries({ queryKey: ['email-campaign', variables.campaignId] });
      toast({
        title: 'Campagne supprimée',
        description: 'La campagne a été supprimée avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error deleting campaign', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la suppression de la campagne.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour programmer une campagne
 */
export const useScheduleEmailCampaign = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      campaignId,
      scheduledAt,
    }: {
      campaignId: string;
      scheduledAt: string;
    }): Promise<EmailCampaign> => {
      return EmailCampaignService.scheduleCampaign(campaignId, scheduledAt);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns', data.store_id] });
      queryClient.setQueryData(['email-campaign', data.id], data);
      toast({
        title: 'Campagne programmée',
        description: 'La campagne a été programmée avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error scheduling campaign', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la programmation de la campagne.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour mettre en pause une campagne
 */
export const usePauseEmailCampaign = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campaignId: string): Promise<EmailCampaign> => {
      return EmailCampaignService.pauseCampaign(campaignId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns', data.store_id] });
      queryClient.setQueryData(['email-campaign', data.id], data);
      toast({
        title: 'Campagne en pause',
        description: 'La campagne a été mise en pause.',
      });
    },
    onError: (error: any) => {
      logger.error('Error pausing campaign', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la mise en pause de la campagne.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour reprendre une campagne
 */
export const useResumeEmailCampaign = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campaignId: string): Promise<EmailCampaign> => {
      return EmailCampaignService.resumeCampaign(campaignId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns', data.store_id] });
      queryClient.setQueryData(['email-campaign', data.id], data);
      toast({
        title: 'Campagne reprise',
        description: 'La campagne a été reprise avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error resuming campaign', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la reprise de la campagne.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour annuler une campagne
 */
export const useCancelEmailCampaign = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campaignId: string): Promise<EmailCampaign> => {
      return EmailCampaignService.cancelCampaign(campaignId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns', data.store_id] });
      queryClient.setQueryData(['email-campaign', data.id], data);
      toast({
        title: 'Campagne annulée',
        description: 'La campagne a été annulée avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error cancelling campaign', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'annulation de la campagne.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour dupliquer une campagne
 */
export const useDuplicateEmailCampaign = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campaignId: string): Promise<EmailCampaign> => {
      return EmailCampaignService.duplicateCampaign(campaignId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns', data.store_id] });
      queryClient.setQueryData(['email-campaign', data.id], data);
      toast({
        title: 'Campagne dupliquée',
        description: 'La campagne a été dupliquée avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error duplicating campaign', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la duplication de la campagne.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour envoyer une campagne manuellement
 */
export const useSendEmailCampaign = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campaignId: string): Promise<boolean> => {
      return EmailCampaignService.sendCampaign(campaignId);
    },
    onSuccess: async (_, campaignId) => {
      // Récupérer la campagne pour obtenir le store_id
      const campaign = await EmailCampaignService.getCampaign(campaignId);
      if (campaign) {
        queryClient.invalidateQueries({ queryKey: ['email-campaigns', campaign.store_id] });
        queryClient.invalidateQueries({ queryKey: ['email-campaign', campaignId] });
      }
      toast({
        title: 'Campagne envoyée',
        description: 'La campagne est en cours d\'envoi.',
      });
    },
    onError: (error: any) => {
      logger.error('Error sending campaign', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'envoi de la campagne.',
        variant: 'destructive',
      });
    },
  });
};

