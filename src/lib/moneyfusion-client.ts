/**
 * Client MoneyFusion — appelle l'Edge Function `moneyfusion`
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

export interface MoneyFusionCheckoutData {
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
}

export interface MoneyFusionCheckoutResult {
  id?: string;
  token?: string;
  checkout_url: string;
  payment_url?: string;
  url?: string;
  status?: string;
  _local_transaction_id?: string;
}

class MoneyFusionClient {
  private async callFunction(action: string, data: object): Promise<unknown> {
    const payload = data as Record<string, unknown>;
    const metadata =
      payload.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
        ? (payload.metadata as Record<string, unknown>)
        : undefined;
    const checkoutToken =
      typeof metadata?.checkout_token === 'string' ? metadata.checkout_token : undefined;

    const { data: response, error } = await supabase.functions.invoke(
      `moneyfusion?t=${Date.now()}`,
      {
        body: { action, data: payload },
        headers: checkoutToken ? { 'x-checkout-token': checkoutToken } : undefined,
      }
    );

    if (error) {
      logger.error('[MoneyFusionClient] Edge function error', {
        action,
        message: error.message,
      });
      const detail =
        response && typeof response === 'object' && 'message' in response
          ? String((response as { message?: unknown }).message)
          : error.message;
      throw new Error(detail || 'Erreur MoneyFusion');
    }

    const typed = response as {
      success?: boolean;
      data?: unknown;
      message?: string;
      error?: string;
    };
    if (!typed?.success) {
      throw new Error(typed?.message || typed?.error || 'Erreur MoneyFusion');
    }

    return typed.data;
  }

  async createCheckout(checkoutData: MoneyFusionCheckoutData): Promise<MoneyFusionCheckoutResult> {
    return (await this.callFunction('create_checkout', checkoutData)) as MoneyFusionCheckoutResult;
  }

  async verifyPayment(token: string): Promise<unknown> {
    return this.callFunction('verify_payment', { paymentId: token });
  }
}

export const moneyfusionClient = new MoneyFusionClient();
