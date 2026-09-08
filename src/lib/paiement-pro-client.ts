/**
 * Client Paiement Pro — appelle l'Edge Function `paiement-pro`
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';
import { extractErrorDetails } from './geniuspay-error-extractor';

export interface PaiementProCheckoutData {
  amount: number;
  currency?: string;
  description?: string;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  return_url: string;
  cancel_url?: string;
  metadata?: Record<string, unknown>;
  productId?: string;
  storeId?: string;
  orderId?: string;
  channel?: string;
}

export interface PaiementProCheckoutResult {
  checkout_url: string;
  url?: string;
  referenceNumber?: string;
  _local_transaction_id?: string;
}

class PaiementProClient {
  private async callFunction(action: string, data: object): Promise<unknown> {
    const payload = data as Record<string, unknown>;
    const metadata =
      payload.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
        ? (payload.metadata as Record<string, unknown>)
        : undefined;
    const checkoutToken =
      typeof metadata?.checkout_token === 'string' ? metadata.checkout_token : undefined;

    const { data: response, error } = await supabase.functions.invoke(
      `paiement-pro?t=${Date.now()}`,
      {
        body: { action, data: payload },
        headers: checkoutToken ? { 'x-checkout-token': checkoutToken } : undefined,
      }
    );

    if (error) {
      const details = await extractErrorDetails(error, error.message);
      const detail =
        (typeof details.message === 'string' && details.message) ||
        (response &&
        typeof response === 'object' &&
        'message' in response &&
        typeof (response as { message?: unknown }).message === 'string'
          ? String((response as { message: string }).message)
          : null) ||
        error.message;

      logger.error('[PaiementProClient] Edge function error', { action, message: detail });
      throw new Error(detail || 'Erreur Paiement Pro');
    }

    const typed = response as {
      success?: boolean;
      data?: unknown;
      message?: string;
      error?: string;
    };
    if (!typed?.success) {
      throw new Error(typed?.message || typed?.error || 'Erreur Paiement Pro');
    }

    return typed.data;
  }

  async createCheckout(checkoutData: PaiementProCheckoutData): Promise<PaiementProCheckoutResult> {
    return (await this.callFunction('create_checkout', checkoutData)) as PaiementProCheckoutResult;
  }
}

export const paiementProClient = new PaiementProClient();
