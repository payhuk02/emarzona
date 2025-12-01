/**
 * Hook pour la gestion des tests A/B email
 * Date: 1er Février 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  EmailABTestService,
  type EmailABTest,
  type CreateABTestPayload,
  type ABTestResults,
} from '@/lib/email/email-ab-test-service';

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook pour récupérer un test A/B
 */
export const useEmailABTest = (abTestId: string) => {
  return useQuery({
    queryKey: ['emailABTest', abTestId],
    queryFn: () => EmailABTestService.getABTest(abTestId),
    enabled: !!abTestId,
  });
};

/**
 * Hook pour récupérer les tests A/B d'une campagne
 */
export const useEmailABTestsByCampaign = (campaignId: string) => {
  return useQuery({
    queryKey: ['emailABTests', campaignId],
    queryFn: () => EmailABTestService.getABTestsByCampaign(campaignId),
    enabled: !!campaignId,
  });
};

/**
 * Hook pour créer un test A/B
 */
export const useCreateEmailABTest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateABTestPayload) => EmailABTestService.createABTest(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['emailABTests', data.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ['emailABTest', data.id] });
      toast({
        title: 'Test A/B créé',
        description: 'Le test A/B a été créé avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: `Échec de la création du test A/B: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour mettre à jour les résultats d'un test A/B
 */
export const useUpdateABTestResults = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      abTestId,
      variant,
      results,
    }: {
      abTestId: string;
      variant: 'variant_a' | 'variant_b';
      results: Partial<ABTestResults>;
    }) => EmailABTestService.updateABTestResults(abTestId, variant, results),
    onSuccess: (_, { abTestId }) => {
      queryClient.invalidateQueries({ queryKey: ['emailABTest', abTestId] });
      queryClient.invalidateQueries({ queryKey: ['emailABTests'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: `Échec de la mise à jour des résultats: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour calculer le gagnant d'un test A/B
 */
export const useCalculateABTestWinner = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (abTestId: string) => EmailABTestService.calculateWinner(abTestId),
    onSuccess: (winner, abTestId) => {
      queryClient.invalidateQueries({ queryKey: ['emailABTest', abTestId] });
      queryClient.invalidateQueries({ queryKey: ['emailABTests'] });
      if (winner) {
        toast({
          title: 'Gagnant déterminé',
          description: `La variante ${winner === 'variant_a' ? 'A' : 'B'} a remporté le test.`,
        });
      } else {
        toast({
          title: 'Test en cours',
          description: 'Pas encore de gagnant significatif. Le test continue.',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: `Échec du calcul du gagnant: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour supprimer un test A/B
 */
export const useDeleteEmailABTest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (abTestId: string) => EmailABTestService.deleteABTest(abTestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailABTests'] });
      toast({
        title: 'Test A/B supprimé',
        description: 'Le test A/B a été supprimé avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: `Échec de la suppression: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

