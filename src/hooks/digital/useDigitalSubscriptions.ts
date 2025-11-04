/**
 * Digital Product Subscriptions Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les abonnements de produits digitaux
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface DigitalProductSubscription {
  id: string;
  digital_product_id: string;
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
  license_id?: string;
  total_payments: number;
  total_amount_paid: number;
  failed_payment_attempts: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Relations
  digital_product?: {
    id: string;
    name: string;
    image_url?: string;
  };
  customer?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SubscriptionPayment {
  id: string;
  subscription_id: string;
  order_id?: string;
  payment_id?: string;
  amount: number;
  currency: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  payment_provider?: string;
  billing_period_start: string;
  billing_period_end: string;
  paid_at?: string;
  failed_at?: string;
  failure_reason?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useCustomerSubscriptions - Liste les abonnements d'un client
 */
export const useCustomerSubscriptions = (customerId?: string) => {
  return useQuery({
    queryKey: ['customerSubscriptions', customerId],
    queryFn: async () => {
      if (!customerId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Non authentifié');
        
        // Récupérer le customer_id depuis l'email
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', user.email)
          .limit(1);
        
        if (!customer || customer.length === 0) {
          return [];
        }
        
        customerId = customer[0].id;
      }

      const { data, error } = await supabase
        .from('digital_product_subscriptions')
        .select(`
          *,
          digital_product:digital_products!inner (
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
        logger.error('Error fetching customer subscriptions', { error, customerId });
        throw error;
      }

      return (data || []) as DigitalProductSubscription[];
    },
    enabled: true,
  });
};

/**
 * useStoreSubscriptions - Liste les abonnements d'un store
 */
export const useStoreSubscriptions = (storeId?: string) => {
  return useQuery({
    queryKey: ['storeSubscriptions', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      const { data, error } = await supabase
        .from('digital_product_subscriptions')
        .select(`
          *,
          customer:customers!inner (
            id,
            name,
            email
          ),
          digital_product:digital_products!inner (
            id,
            product:products!inner (
              id,
              name,
              image_url
            )
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching store subscriptions', { error, storeId });
        throw error;
      }

      return (data || []) as DigitalProductSubscription[];
    },
    enabled: !!storeId,
  });
};

/**
 * useSubscription - Récupère un abonnement par ID
 */
export const useSubscription = (subscriptionId: string | undefined) => {
  return useQuery({
    queryKey: ['subscription', subscriptionId],
    queryFn: async () => {
      if (!subscriptionId) throw new Error('Subscription ID manquant');

      const { data, error } = await supabase
        .from('digital_product_subscriptions')
        .select(`
          *,
          customer:customers!inner (
            id,
            name,
            email
          ),
          digital_product:digital_products!inner (
            id,
            product:products!inner (
              id,
              name,
              image_url
            )
          )
        `)
        .eq('id', subscriptionId)
        .single();

      if (error) {
        logger.error('Error fetching subscription', { error, subscriptionId });
        throw error;
      }

      return data as DigitalProductSubscription;
    },
    enabled: !!subscriptionId,
  });
};

/**
 * useSubscriptionPayments - Historique des paiements d'un abonnement
 */
export const useSubscriptionPayments = (subscriptionId: string | undefined) => {
  return useQuery({
    queryKey: ['subscriptionPayments', subscriptionId],
    queryFn: async () => {
      if (!subscriptionId) throw new Error('Subscription ID manquant');

      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching subscription payments', { error, subscriptionId });
        throw error;
      }

      return (data || []) as SubscriptionPayment[];
    },
    enabled: !!subscriptionId,
  });
};

/**
 * useSubscriptionStats - Statistiques des abonnements
 */
export const useSubscriptionStats = (storeId?: string) => {
  return useQuery({
    queryKey: ['subscriptionStats', storeId],
    queryFn: async () => {
      let query = supabase
        .from('digital_product_subscriptions')
        .select('status, subscription_price, total_amount_paid');

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching subscription stats', { error, storeId });
        throw error;
      }

      const subscriptions = data || [];
      
      return {
        total: subscriptions.length,
        active: subscriptions.filter((s) => s.status === 'active').length,
        cancelled: subscriptions.filter((s) => s.status === 'cancelled').length,
        expired: subscriptions.filter((s) => s.status === 'expired').length,
        trialing: subscriptions.filter((s) => s.status === 'trialing').length,
        pastDue: subscriptions.filter((s) => s.status === 'past_due').length,
        totalRevenue: subscriptions.reduce((sum, s) => sum + (s.total_amount_paid || 0), 0),
        mrr: subscriptions
          .filter((s) => s.status === 'active')
          .reduce((sum, s) => {
            const monthly = s.subscription_interval === 'monthly' 
              ? s.subscription_price 
              : s.subscription_interval === 'yearly' 
                ? s.subscription_price / 12 
                : s.subscription_interval === 'quarterly'
                  ? s.subscription_price / 3
                  : 0;
            return sum + monthly;
          }, 0),
      };
    },
    enabled: true,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useCreateSubscription - Créer un nouvel abonnement
 */
export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      digitalProductId,
      customerId,
      storeId,
      trialDays,
    }: {
      digitalProductId: string;
      customerId: string;
      storeId: string;
      trialDays?: number;
    }) => {
      const { data, error } = await supabase.rpc('create_digital_subscription', {
        p_digital_product_id: digitalProductId,
        p_customer_id: customerId,
        p_store_id: storeId,
        p_trial_days: trialDays || 0,
      });

      if (error) {
        logger.error('Error creating subscription', { error, digitalProductId });
        throw new Error(error.message || 'Erreur lors de la création de l\'abonnement');
      }

      if (!data || !data.success) {
        throw new Error(data?.message || 'Erreur lors de la création de l\'abonnement');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['storeSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionStats'] });
      toast({
        title: '✅ Abonnement créé',
        description: 'L\'abonnement a été créé avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useCreateSubscription', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer l\'abonnement',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useCancelSubscription - Annuler un abonnement
 */
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      cancelAtPeriodEnd = true,
      reason,
    }: {
      subscriptionId: string;
      cancelAtPeriodEnd?: boolean;
      reason?: string;
    }) => {
      const updateData: any = {
        cancel_at_period_end: cancelAtPeriodEnd,
        cancelled_at: cancelAtPeriodEnd ? null : new Date().toISOString(),
        cancellation_reason: reason || null,
      };

      if (!cancelAtPeriodEnd) {
        updateData.status = 'cancelled';
      }

      const { data, error } = await supabase
        .from('digital_product_subscriptions')
        .update(updateData)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        logger.error('Error cancelling subscription', { error, subscriptionId });
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ['customerSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['storeSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionStats'] });
      toast({
        title: '✅ Abonnement annulé',
        description: variables.cancelAtPeriodEnd 
          ? 'L\'abonnement sera annulé à la fin de la période'
          : 'L\'abonnement a été annulé',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useCancelSubscription', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'annuler l\'abonnement',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useRenewSubscription - Renouveler un abonnement
 */
export const useRenewSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data, error } = await supabase.rpc('renew_digital_subscription', {
        p_subscription_id: subscriptionId,
      });

      if (error) {
        logger.error('Error renewing subscription', { error, subscriptionId });
        throw new Error(error.message || 'Erreur lors du renouvellement');
      }

      if (!data || !data.success) {
        throw new Error(data?.message || 'Erreur lors du renouvellement');
      }

      return data;
    },
    onSuccess: (_, subscriptionId) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ['customerSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['storeSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionStats'] });
      toast({
        title: '✅ Abonnement renouvelé',
        description: 'L\'abonnement a été renouvelé avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useRenewSubscription', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de renouveler l\'abonnement',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useReactivateSubscription - Réactiver un abonnement annulé
 */
export const useReactivateSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data, error } = await supabase
        .from('digital_product_subscriptions')
        .update({
          cancel_at_period_end: false,
          cancelled_at: null,
          cancellation_reason: null,
          status: 'active',
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        logger.error('Error reactivating subscription', { error, subscriptionId });
        throw error;
      }

      return data;
    },
    onSuccess: (_, subscriptionId) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ['customerSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionStats'] });
      toast({
        title: '✅ Abonnement réactivé',
        description: 'L\'abonnement a été réactivé avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useReactivateSubscription', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de réactiver l\'abonnement',
        variant: 'destructive',
      });
    },
  });
};

