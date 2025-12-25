/**
 * Hook pour la gestion des séquences email
 * Date: 1er Février 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  EmailSequenceService,
  type EmailSequence,
  type EmailSequenceStep,
  type EmailSequenceEnrollment,
  type CreateSequencePayload,
  type CreateSequenceStepPayload,
  type EnrollUserPayload,
  type SequenceStatus,
  type EnrollmentStatus,
} from '@/lib/email/email-sequence-service';

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook pour récupérer toutes les séquences d'un store
 */
export const useEmailSequences = (
  storeId: string | undefined,
  filters?: {
    status?: SequenceStatus;
    limit?: number;
    offset?: number;
  }
) => {
  return useQuery({
    queryKey: ['email-sequences', storeId, filters],
    queryFn: async (): Promise<EmailSequence[]> => {
      if (!storeId) return [];
      return EmailSequenceService.getSequences(storeId, filters);
    },
    enabled: !!storeId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook pour récupérer une séquence spécifique
 */
export const useEmailSequence = (sequenceId: string | undefined) => {
  return useQuery({
    queryKey: ['email-sequence', sequenceId],
    queryFn: async (): Promise<EmailSequence | null> => {
      if (!sequenceId) return null;
      return EmailSequenceService.getSequence(sequenceId);
    },
    enabled: !!sequenceId,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook pour récupérer les étapes d'une séquence
 */
export const useEmailSequenceSteps = (sequenceId: string | undefined) => {
  return useQuery({
    queryKey: ['email-sequence-steps', sequenceId],
    queryFn: async (): Promise<EmailSequenceStep[]> => {
      if (!sequenceId) return [];
      return EmailSequenceService.getSteps(sequenceId);
    },
    enabled: !!sequenceId,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook pour créer une séquence
 */
export const useCreateEmailSequence = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: CreateSequencePayload): Promise<EmailSequence> => {
      return EmailSequenceService.createSequence(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-sequences', data.store_id] });
      queryClient.setQueryData(['email-sequence', data.id], data);
      toast({
        title: 'Séquence créée',
        description: 'La séquence a été créée avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error creating sequence', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la création de la séquence.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour mettre à jour une séquence
 */
export const useUpdateEmailSequence = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      sequenceId,
      payload,
    }: {
      sequenceId: string;
      payload: Partial<CreateSequencePayload>;
    }): Promise<EmailSequence> => {
      return EmailSequenceService.updateSequence(sequenceId, payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-sequences', data.store_id] });
      queryClient.setQueryData(['email-sequence', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['email-sequence-steps', data.id] });
      toast({
        title: 'Séquence mise à jour',
        description: 'La séquence a été mise à jour avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error updating sequence', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la mise à jour de la séquence.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour supprimer une séquence
 */
export const useDeleteEmailSequence = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      sequenceId,
      storeId,
    }: {
      sequenceId: string;
      storeId: string;
    }): Promise<boolean> => {
      return EmailSequenceService.deleteSequence(sequenceId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['email-sequences', variables.storeId] });
      queryClient.removeQueries({ queryKey: ['email-sequence', variables.sequenceId] });
      queryClient.removeQueries({ queryKey: ['email-sequence-steps', variables.sequenceId] });
      toast({
        title: 'Séquence supprimée',
        description: 'La séquence a été supprimée avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error deleting sequence', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la suppression de la séquence.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour ajouter une étape à une séquence
 */
export const useAddSequenceStep = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: CreateSequenceStepPayload): Promise<EmailSequenceStep> => {
      return EmailSequenceService.addStep(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-sequence-steps', data.sequence_id] });
      queryClient.invalidateQueries({ queryKey: ['email-sequence', data.sequence_id] });
      toast({
        title: 'Étape ajoutée',
        description: 'L\'étape a été ajoutée avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error adding step', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'ajout de l\'étape.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour mettre à jour une étape
 */
export const useUpdateSequenceStep = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      stepId,
      payload,
      sequenceId,
    }: {
      stepId: string;
      payload: Partial<CreateSequenceStepPayload>;
      sequenceId: string;
    }): Promise<EmailSequenceStep> => {
      return EmailSequenceService.updateStep(stepId, payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-sequence-steps', data.sequence_id] });
      toast({
        title: 'Étape mise à jour',
        description: 'L\'étape a été mise à jour avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error updating step', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la mise à jour de l\'étape.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour supprimer une étape
 */
export const useDeleteSequenceStep = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      stepId,
      sequenceId,
    }: {
      stepId: string;
      sequenceId: string;
    }): Promise<boolean> => {
      return EmailSequenceService.deleteStep(stepId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['email-sequence-steps', variables.sequenceId] });
      queryClient.invalidateQueries({ queryKey: ['email-sequence', variables.sequenceId] });
      toast({
        title: 'Étape supprimée',
        description: 'L\'étape a été supprimée avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error deleting step', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la suppression de l\'étape.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour récupérer les enrollments d'une séquence
 */
export const useEmailSequenceEnrollments = (
  sequenceId: string | undefined,
  filters?: {
    status?: EnrollmentStatus;
    limit?: number;
    offset?: number;
  }
) => {
  return useQuery({
    queryKey: ['email-sequence-enrollments', sequenceId, filters],
    queryFn: async (): Promise<EmailSequenceEnrollment[]> => {
      if (!sequenceId) return [];
      return EmailSequenceService.getEnrollments(sequenceId, filters);
    },
    enabled: !!sequenceId,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook pour inscrire un utilisateur dans une séquence
 */
export const useEnrollUserInSequence = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: EnrollUserPayload): Promise<EmailSequenceEnrollment> => {
      return EmailSequenceService.enrollUser(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-sequence-enrollments', data.sequence_id] });
      queryClient.invalidateQueries({ queryKey: ['email-sequence', data.sequence_id] });
      toast({
        title: 'Utilisateur inscrit',
        description: 'L\'utilisateur a été inscrit dans la séquence avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error enrolling user', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'inscription de l\'utilisateur.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour mettre en pause un enrollment
 */
export const usePauseSequenceEnrollment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      sequenceId,
      userId,
    }: {
      sequenceId: string;
      userId: string;
    }): Promise<EmailSequenceEnrollment> => {
      return EmailSequenceService.pauseEnrollment(sequenceId, userId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-sequence-enrollments', data.sequence_id] });
      toast({
        title: 'Inscription mise en pause',
        description: 'L\'inscription a été mise en pause.',
      });
    },
    onError: (error: any) => {
      logger.error('Error pausing enrollment', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la mise en pause.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour annuler un enrollment
 */
export const useCancelSequenceEnrollment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      sequenceId,
      userId,
    }: {
      sequenceId: string;
      userId: string;
    }): Promise<EmailSequenceEnrollment> => {
      return EmailSequenceService.cancelEnrollment(sequenceId, userId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-sequence-enrollments', data.sequence_id] });
      queryClient.invalidateQueries({ queryKey: ['email-sequence', data.sequence_id] });
      toast({
        title: 'Inscription annulée',
        description: 'L\'inscription a été annulée avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error cancelling enrollment', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'annulation.',
        variant: 'destructive',
      });
    },
  });
};

