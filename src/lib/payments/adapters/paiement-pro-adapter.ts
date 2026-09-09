/**
 * Adapter Paiement Pro (rail plateforme)
 */
import { initiatePaiementProPayment } from '@/lib/paiement-pro-payment';
import { isSupportedCurrency, type Currency } from '@/lib/currency-converter';
import type { OrchestratedPaymentRequest, OrchestratedPaymentResult } from '../types';
import { getDefaultPaiementProChannel, mergePaymentRailsConfig } from '../payment-rails-catalog';
import { supabase } from '@/integrations/supabase/client';

async function resolvePaiementProChannel(preferred?: string): Promise<string> {
  if (preferred && preferred.trim()) return preferred.trim().toUpperCase();
  try {
    const { data } = await (
      supabase as unknown as {
        rpc: (fn: string) => Promise<{ data: unknown }>;
      }
    ).rpc('get_payment_rails_config');
    const config = mergePaymentRailsConfig(data);
    return getDefaultPaiementProChannel(config);
  } catch {
    return 'OMCIV2';
  }
}

export async function createPaiementProPayment(
  request: OrchestratedPaymentRequest
): Promise<OrchestratedPaymentResult> {
  const currency: Currency =
    request.currency && isSupportedCurrency(request.currency) ? request.currency : 'XOF';

  const metaChannel =
    typeof request.metadata?.channel === 'string' ? request.metadata.channel : undefined;
  const channel = await resolvePaiementProChannel(metaChannel);

  const result = await initiatePaiementProPayment({
    storeId: request.storeId,
    productId: request.productId,
    orderId: request.orderId,
    customerId: request.customerId,
    amount: request.amount,
    currency,
    description: request.description,
    customerEmail: request.customerEmail,
    customerName: request.customerName,
    customerPhone: request.customerPhone,
    returnUrl: request.returnUrl,
    cancelUrl: request.cancelUrl,
    channel,
    metadata: {
      ...request.metadata,
      channel,
      payment_orchestration_provider: 'paiement_pro',
    },
  });

  return {
    success: result.success,
    transaction_id: result.transaction_id || '',
    checkout_url: result.checkout_url,
    provider: 'paiement_pro',
    provider_transaction_id: result.reference_number || undefined,
    connection_id: request.connections?.find(c => c.provider === 'paiement_pro')?.id ?? null,
  };
}
