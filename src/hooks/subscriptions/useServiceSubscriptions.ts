/**
 * Service Subscriptions Hook
 * Date: 30 Janvier 2025
 * 
 * Hook pour gérer les abonnements de services
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface ServiceSubscription {
  id: string;
  service_product_id: string;
  product_id: string;
  customer_id: string;
  store_id: string;
  subscription_interval: 'monthly' | 'yearly' | 'quarterly' | 'weekly' | 'daily';
  subscription_price: number;
  currency: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'trialing' | 'paused' | 'suspended';
  current_period_start: string;
  current_period_end: string;
  trial_start?: string;
  trial_end?: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  cancellation_reason?: string;
  next_billing_date?: string;
  last_payment_date?: string;
  last_payment_amount?: number;
  payment_method_id?: string;
  payment_provider?: string;
  sessions_per_period: number;
  sessions_used: number;
  auto_book: boolean;
  total_payments: number;
  total_amount_paid: number;
  failed_payment_attempts: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useCustomerServiceSubscriptions - Liste les abonnements services d'un client
 */
export const useCustomerServiceSubscriptions = (customerId?: string) => {
  return useQuery({
    queryKey: ['customer-service-subscriptions', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID manquant');

      const { data, error } = await supabase
        .from('service_subscriptions')
        .select(`
          *,
          service_product:service_products!inner (
            id,
            product:products!inner (
              id,
              name,
              image_url
            )
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching customer service subscriptions', { error, customerId });
        throw error;
      }

      return (data || []) as ServiceSubscription[];
    },
    enabled: !!customerId,
  });
};

/**
 * useStoreServiceSubscriptions - Liste les abonnements services d'un store
 */
export const useStoreServiceSubscriptions = (storeId?: string) => {
  return useQuery({
    queryKey: ['store-service-subscriptions', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      const { data, error } = await supabase
        .from('service_subscriptions')
        .select(`
          *,
          customer:customers!inner (
            id,
            name,
            email
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching store service subscriptions', { error, storeId });
        throw error;
      }

      return (data || []) as ServiceSubscription[];
    },
    enabled: !!storeId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useCreateServiceSubscription - Créer un abonnement service
 */
export const useCreateServiceSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (subscription: Partial<ServiceSubscription>) => {
      const { data, error } = await supabase
        .from('service_subscriptions')
        .insert([subscription])
        .select()
        .single();

      if (error) {
        logger.error('Error creating service subscription', { error, subscription });
        throw error;
      }

      return data as ServiceSubscription;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customer-service-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['store-service-subscriptions'] });
      toast({
        title: '✅ Abonnement créé',
        description: 'L\'abonnement a été créé avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useCreateServiceSubscription', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer l\'abonnement',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useCancelServiceSubscription - Annuler un abonnement service
 */
export const useCancelServiceSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      cancelAtPeriodEnd,
      reason,
    }: {
      subscriptionId: string;
      cancelAtPeriodEnd?: boolean;
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from('service_subscriptions')
        .update({
          cancel_at_period_end: cancelAtPeriodEnd ?? true,
          cancelled_at: cancelAtPeriodEnd ? null : new Date().toISOString(),
          cancellation_reason: reason,
          status: cancelAtPeriodEnd ? 'active' : 'cancelled',
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        logger.error('Error cancelling service subscription', { error, subscriptionId });
        throw error;
      }

      return data as ServiceSubscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-service-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['store-service-subscriptions'] });
      toast({
        title: '✅ Abonnement annulé',
        description: 'L\'abonnement a été annulé avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useCancelServiceSubscription', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'annuler l\'abonnement',
        variant: 'destructive',
      });
    },
  });
};

