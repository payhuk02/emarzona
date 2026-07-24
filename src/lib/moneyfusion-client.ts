/**
 * Client MoneyFusion — appelle l'Edge Function `moneyfusion`
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';
import { extractErrorDetails } from './geniuspay-error-extractor';

/** MoneyFusion API: « Montant doit etre supérieur a 200 F » */
export const MONEYFUSION_MIN_AMOUNT_XOF = 201;

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

function assertMoneyFusionMinAmount(amount: number, currency?: string): void {
  const code = (currency || 'XOF').toUpperCase();
  if ((code === 'XOF' || code === 'XAF') && amount < MONEYFUSION_MIN_AMOUNT_XOF) {
    throw new Error(
      `Montant trop bas pour MoneyFusion (minimum ${MONEYFUSION_MIN_AMOUNT_XOF} XOF). Total actuel : ${Math.round(amount)} XOF.`
    );
  }
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

      logger.error('[MoneyFusionClient] Edge function error', {
        action,
        message: detail,
      });

      // Éviter le message générique supabase-js
      if (detail.includes('Edge Function returned') || detail.includes('non-2xx')) {
        throw new Error(
          'Le paiement MoneyFusion a été refusé. Vérifiez que le montant est d’au moins 201 XOF.'
        );
      }
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
    assertMoneyFusionMinAmount(checkoutData.amount, checkoutData.currency);
    return (await this.callFunction('create_checkout', checkoutData)) as MoneyFusionCheckoutResult;
  }

  async verifyPayment(token: string, transactionId?: string): Promise<unknown> {
    return this.callFunction('verify_payment', {
      paymentId: token,
      token,
      ...(transactionId ? { transactionId } : {}),
    });
  }

  /** Guest return: transaction_id only (Edge résout payment_id en service role). */
  async verifyPaymentByTransaction(transactionId: string): Promise<unknown> {
    return this.callFunction('verify_payment', { transactionId });
  }
}

export const moneyfusionClient = new MoneyFusionClient();
