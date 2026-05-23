import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/hooks/useStore';
import type { StorePaymentConnection } from '@/types/store-payment-connection';
import {
  startStripeConnectOnboarding,
  type StripeOnboardParams,
} from '@/lib/payments/stripe-connect-client';
import {
  startPayPalPartnerOnboarding,
  type PayPalOnboardParams,
} from '@/lib/payments/paypal-commerce-client';
import { logger } from '@/lib/logger';

const CONNECTION_FIELDS =
  'id, store_id, provider, connection_mode, external_account_id, external_account_status, capabilities, default_currency, livemode, onboarding_completed_at, last_synced_at, metadata';

export function useStorePaymentConnections() {
  const { store } = useStore();
  const queryClient = useQueryClient();
  const storeId = store?.id;

  const connectionsQuery = useQuery({
    queryKey: ['store-payment-connections', storeId],
    enabled: !!storeId,
    queryFn: async (): Promise<StorePaymentConnection[]> => {
      const { data, error } = await supabase
        .from('store_payment_connections' as never)
        .select(CONNECTION_FIELDS)
        .eq('store_id', storeId!)
        .order('provider');

      if (error) {
        logger.error('Failed to load payment connections', { error });
        throw error;
      }
      return (data ?? []) as unknown as StorePaymentConnection[];
    },
  });

  const stripeConnection = connectionsQuery.data?.find(c => c.provider === 'stripe_connect');
  const paypalConnection = connectionsQuery.data?.find(c => c.provider === 'paypal_commerce');

  const connectStripe = useMutation({
    mutationFn: async (params: Omit<StripeOnboardParams, 'storeId'>) => {
      if (!storeId) throw new Error('No store');
      const result = await startStripeConnectOnboarding({ storeId, ...params });
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-payment-connections', storeId] });
    },
  });

  const syncStripe = useMutation({
    mutationFn: async () => {
      if (!storeId) throw new Error('No store');
      const origin = window.location.origin;
      const result = await startStripeConnectOnboarding({
        storeId,
        returnUrl: `${origin}/dashboard/payment-connections?stripe=return`,
        refreshUrl: `${origin}/dashboard/payment-connections?stripe=refresh`,
        syncOnly: true,
      });
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-payment-connections', storeId] });
    },
  });

  const connectPayPal = useMutation({
    mutationFn: async (params: Omit<PayPalOnboardParams, 'storeId'>) => {
      if (!storeId) throw new Error('No store');
      const result = await startPayPalPartnerOnboarding({ storeId, ...params });
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-payment-connections', storeId] });
    },
  });

  const syncPayPal = useMutation({
    mutationFn: async () => {
      if (!storeId) throw new Error('No store');
      const origin = window.location.origin;
      const result = await startPayPalPartnerOnboarding({
        storeId,
        returnUrl: `${origin}/dashboard/payment-connections?paypal=return`,
        syncOnly: true,
      });
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-payment-connections', storeId] });
    },
  });

  return {
    connections: connectionsQuery.data ?? [],
    stripeConnection,
    paypalConnection,
    isLoading: connectionsQuery.isLoading,
    error: connectionsQuery.error,
    connectStripe,
    syncStripe,
    connectPayPal,
    syncPayPal,
    refetch: connectionsQuery.refetch,
  };
}
