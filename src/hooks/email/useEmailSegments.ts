/**
 * Hook pour la gestion des segments email
 * Date: 1er Février 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  EmailSegmentService,
  type EmailSegment,
  type CreateSegmentPayload,
  type SegmentType,
  type SegmentMember,
} from '@/lib/email/email-segment-service';

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook pour récupérer tous les segments d'un store
 */
export const useEmailSegments = (
  storeId: string | undefined,
  filters?: {
    type?: SegmentType;
    limit?: number;
    offset?: number;
  }
) => {
  return useQuery({
    queryKey: ['email-segments', storeId, filters],
    queryFn: async (): Promise<EmailSegment[]> => {
      if (!storeId) return [];
      return EmailSegmentService.getSegments(storeId, filters);
    },
    enabled: !!storeId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook pour récupérer un segment spécifique
 */
export const useEmailSegment = (segmentId: string | undefined) => {
  return useQuery({
    queryKey: ['email-segment', segmentId],
    queryFn: async (): Promise<EmailSegment | null> => {
      if (!segmentId) return null;
      return EmailSegmentService.getSegment(segmentId);
    },
    enabled: !!segmentId,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook pour créer un segment
 */
export const useCreateEmailSegment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: CreateSegmentPayload): Promise<EmailSegment> => {
      return EmailSegmentService.createSegment(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-segments', data.store_id] });
      queryClient.setQueryData(['email-segment', data.id], data);
      toast({
        title: 'Segment créé',
        description: 'Le segment a été créé avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error creating segment', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la création du segment.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour mettre à jour un segment
 */
export const useUpdateEmailSegment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      segmentId,
      payload,
    }: {
      segmentId: string;
      payload: Partial<CreateSegmentPayload>;
    }): Promise<EmailSegment> => {
      return EmailSegmentService.updateSegment(segmentId, payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-segments', data.store_id] });
      queryClient.setQueryData(['email-segment', data.id], data);
      toast({
        title: 'Segment mis à jour',
        description: 'Le segment a été mis à jour avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error updating segment', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la mise à jour du segment.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour supprimer un segment
 */
export const useDeleteEmailSegment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      segmentId,
      storeId,
    }: {
      segmentId: string;
      storeId: string;
    }): Promise<boolean> => {
      return EmailSegmentService.deleteSegment(segmentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['email-segments', variables.storeId] });
      queryClient.removeQueries({ queryKey: ['email-segment', variables.segmentId] });
      toast({
        title: 'Segment supprimé',
        description: 'Le segment a été supprimé avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error deleting segment', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la suppression du segment.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour calculer les membres d'un segment
 */
export const useCalculateSegmentMembers = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (segmentId: string): Promise<SegmentMember[]> => {
      return EmailSegmentService.calculateSegmentMembers(segmentId);
    },
    onSuccess: (data, segmentId) => {
      queryClient.invalidateQueries({ queryKey: ['email-segment', segmentId] });
      queryClient.invalidateQueries({ queryKey: ['email-segment-members', segmentId] });
      toast({
        title: 'Membres calculés',
        description: `${data.length} membre(s) trouvé(s).`,
      });
    },
    onError: (error: any) => {
      logger.error('Error calculating segment members', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du calcul des membres.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour récupérer les membres d'un segment
 */
export const useSegmentMembers = (segmentId: string | undefined, enabled: boolean = true) => {
  const calculateMembers = useCalculateSegmentMembers();

  return useQuery({
    queryKey: ['email-segment-members', segmentId],
    queryFn: async (): Promise<SegmentMember[]> => {
      if (!segmentId) return [];
      return EmailSegmentService.calculateSegmentMembers(segmentId);
    },
    enabled: !!segmentId && enabled,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook pour mettre à jour le nombre de membres
 */
export const useUpdateSegmentMemberCount = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (segmentId: string): Promise<number> => {
      return EmailSegmentService.updateMemberCount(segmentId);
    },
    onSuccess: (count, segmentId) => {
      queryClient.invalidateQueries({ queryKey: ['email-segment', segmentId] });
      queryClient.invalidateQueries({ queryKey: ['email-segments'] });
      toast({
        title: 'Nombre mis à jour',
        description: `Le segment contient maintenant ${count} membre(s).`,
      });
    },
    onError: (error: any) => {
      logger.error('Error updating member count', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la mise à jour du nombre.',
        variant: 'destructive',
      });
    },
  });
};







