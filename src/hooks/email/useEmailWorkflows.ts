/**
 * Hook pour la gestion des workflows email
 * Date: 1er Février 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import {
  EmailWorkflowService,
  type EmailWorkflow,
  type CreateWorkflowPayload,
  type WorkflowStatus,
} from '@/lib/email/email-workflow-service';

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook pour récupérer tous les workflows d'un store
 */
export const useEmailWorkflows = (
  storeId: string,
  filters?: { status?: WorkflowStatus }
) => {
  return useQuery({
    queryKey: ['emailWorkflows', storeId, filters],
    queryFn: () => EmailWorkflowService.getWorkflows(storeId, filters),
    enabled: !!storeId,
  });
};

/**
 * Hook pour récupérer un workflow spécifique
 */
export const useEmailWorkflow = (workflowId: string) => {
  return useQuery({
    queryKey: ['emailWorkflow', workflowId],
    queryFn: () => EmailWorkflowService.getWorkflow(workflowId),
    enabled: !!workflowId,
  });
};

/**
 * Hook pour créer un workflow
 */
export const useCreateEmailWorkflow = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { store } = useStore();

  return useMutation({
    mutationFn: (payload: CreateWorkflowPayload) => EmailWorkflowService.createWorkflow(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailWorkflows', store?.id] });
      toast({
        title: 'Workflow créé',
        description: 'Le workflow a été créé avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: `Échec de la création du workflow: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour mettre à jour un workflow
 */
export const useUpdateEmailWorkflow = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { store } = useStore();

  return useMutation({
    mutationFn: ({
      workflowId,
      payload,
    }: {
      workflowId: string;
      payload: Partial<CreateWorkflowPayload>;
    }) => EmailWorkflowService.updateWorkflow(workflowId, payload),
    onSuccess: (_, { workflowId }) => {
      queryClient.invalidateQueries({ queryKey: ['emailWorkflows', store?.id] });
      queryClient.invalidateQueries({ queryKey: ['emailWorkflow', workflowId] });
      toast({
        title: 'Workflow mis à jour',
        description: 'Le workflow a été mis à jour avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: `Échec de la mise à jour du workflow: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour supprimer un workflow
 */
export const useDeleteEmailWorkflow = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { store } = useStore();

  return useMutation({
    mutationFn: ({ workflowId }: { workflowId: string; storeId: string }) =>
      EmailWorkflowService.deleteWorkflow(workflowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailWorkflows', store?.id] });
      toast({
        title: 'Workflow supprimé',
        description: 'Le workflow a été supprimé avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: `Échec de la suppression du workflow: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour exécuter un workflow
 */
export const useExecuteEmailWorkflow = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      workflowId,
      context,
    }: {
      workflowId: string;
      context?: Record<string, any>;
    }) => EmailWorkflowService.executeWorkflow(workflowId, context),
    onSuccess: (_, { workflowId }) => {
      queryClient.invalidateQueries({ queryKey: ['emailWorkflow', workflowId] });
      queryClient.invalidateQueries({ queryKey: ['emailWorkflows'] });
      toast({
        title: 'Workflow exécuté',
        description: 'Le workflow a été exécuté avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: `Échec de l'exécution du workflow: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};







