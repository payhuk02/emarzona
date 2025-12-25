/**
 * Subscription Enhancements Hooks
 * Date: 2025-01-27
 * 
 * Hooks pour les améliorations des subscriptions : essais gratuits, pauses, upgrades/downgrades
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// HOOKS
// =====================================================

/**
 * Hook pour démarrer un essai gratuit
 */
export const useStartTrial = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      trialDays,
    }: {
      subscriptionId: string;
      trialDays: number;
    }) => {
      const { data, error } = await supabase.rpc('start_subscription_trial', {
        p_subscription_id: subscriptionId,
        p_trial_days: trialDays,
      });

      if (error) {
        logger.error('Error starting trial', { error, subscriptionId });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['storeSubscriptions'] });
      toast({
        title: 'Essai gratuit démarré',
        description: 'L\'essai gratuit a été activé avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useStartTrial', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de démarrer l\'essai gratuit',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour mettre en pause une subscription
 */
export const usePauseSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      pausedUntil,
      reason,
    }: {
      subscriptionId: string;
      pausedUntil: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase.rpc('pause_subscription', {
        p_subscription_id: subscriptionId,
        p_paused_until: pausedUntil,
        p_reason: reason || null,
      });

      if (error) {
        logger.error('Error pausing subscription', { error, subscriptionId });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['storeSubscriptions'] });
      toast({
        title: 'Abonnement mis en pause',
        description: 'L\'abonnement a été mis en pause avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in usePauseSubscription', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre en pause l\'abonnement',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour reprendre une subscription en pause
 */
export const useResumeSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data, error } = await supabase.rpc('resume_subscription', {
        p_subscription_id: subscriptionId,
      });

      if (error) {
        logger.error('Error resuming subscription', { error, subscriptionId });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['storeSubscriptions'] });
      toast({
        title: 'Abonnement repris',
        description: 'L\'abonnement a été repris avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useResumeSubscription', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de reprendre l\'abonnement',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour planifier un upgrade/downgrade
 */
export const useSchedulePlanChange = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      newSubscriptionId,
      changeType,
      scheduledAt,
      proratedAmount,
    }: {
      subscriptionId: string;
      newSubscriptionId: string;
      changeType: 'upgrade' | 'downgrade' | 'switch';
      scheduledAt?: string;
      proratedAmount?: number;
    }) => {
      const { data, error } = await supabase.rpc('schedule_plan_change', {
        p_subscription_id: subscriptionId,
        p_new_subscription_id: newSubscriptionId,
        p_change_type: changeType,
        p_scheduled_at: scheduledAt || null,
        p_prorated_amount: proratedAmount || 0,
      });

      if (error) {
        logger.error('Error scheduling plan change', { error, subscriptionId });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['storeSubscriptions'] });
      toast({
        title: 'Changement de plan planifié',
        description: 'Le changement de plan a été planifié avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useSchedulePlanChange', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de planifier le changement de plan',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour appliquer un changement de plan
 */
export const useApplyPlanChange = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data, error } = await supabase.rpc('apply_plan_change', {
        p_subscription_id: subscriptionId,
      });

      if (error) {
        logger.error('Error applying plan change', { error, subscriptionId });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['storeSubscriptions'] });
      toast({
        title: 'Changement de plan appliqué',
        description: 'Le changement de plan a été appliqué avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useApplyPlanChange', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'appliquer le changement de plan',
        variant: 'destructive',
      });
    },
  });
};

