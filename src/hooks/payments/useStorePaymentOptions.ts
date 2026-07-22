/**
 * Options de paiement checkout via RPC get_store_payment_options
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PaymentProviderCode, StorePaymentOption } from '@/types/store-payment-connection';
import { logger } from '@/lib/logger';

/** Valeur utilisée par le checkout (legacy geniuspay + codes orchestrateur) */
export type CheckoutPaymentProvider =
  | 'geniuspay'
  | 'moneyfusion'
  | Exclude<PaymentProviderCode, 'geniuspay_platform' | 'moneyfusion'>;

export function rpcProviderToCheckout(provider: string): CheckoutPaymentProvider {
  if (provider === 'geniuspay_platform' || provider === 'geniuspay') return 'moneyfusion';
  if (provider === 'moneyfusion') return 'moneyfusion';
  if (
    provider === 'stripe_connect' ||
    provider === 'paypal_commerce' ||
    provider === 'flutterwave_connect'
  ) {
    return provider;
  }
  return 'moneyfusion';
}

export function checkoutProviderToRpc(provider: CheckoutPaymentProvider): PaymentProviderCode {
  if (provider === 'geniuspay') return 'moneyfusion';
  return provider;
}

function parsePaymentOptions(data: unknown): StorePaymentOption[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter(
      (row): row is StorePaymentOption =>
        row != null &&
        typeof row === 'object' &&
        'provider' in row &&
        typeof (row as StorePaymentOption).provider === 'string'
    )
    .map(row => ({
      provider: row.provider as PaymentProviderCode,
      connection_id: row.connection_id ?? null,
      label: row.label ?? row.provider,
    }));
}

export function useStorePaymentOptions(params: {
  storeId?: string | null;
  currency?: string;
  buyerCountry?: string | null;
  enabled?: boolean;
}) {
  const { storeId, currency = 'XOF', buyerCountry, enabled = true } = params;

  return useQuery({
    queryKey: ['store-payment-options', storeId, currency, buyerCountry],
    enabled: enabled && !!storeId,
    staleTime: 60_000,
    queryFn: async (): Promise<StorePaymentOption[]> => {
      if (!storeId) return [];

      const { data, error } = await (
        supabase as unknown as {
          rpc: (
            fn: string,
            args: { p_store_id: string; p_currency: string; p_buyer_country: string | null }
          ) => Promise<{ data: unknown; error: { message?: string } | null }>;
        }
      ).rpc('get_store_payment_options', {
        p_store_id: storeId,
        p_currency: currency,
        p_buyer_country: buyerCountry ?? null,
      });

      if (error) {
        logger.error('get_store_payment_options failed', { error, storeId });
        return [
          {
            provider: 'moneyfusion',
            connection_id: null,
            label: 'MoneyFusion',
          },
        ];
      }

      const options = parsePaymentOptions(data).filter(
        opt => opt.provider !== 'geniuspay_platform'
      );
      return options.length > 0
        ? options
        : [{ provider: 'moneyfusion', connection_id: null, label: 'MoneyFusion' }];
    },
  });
}
