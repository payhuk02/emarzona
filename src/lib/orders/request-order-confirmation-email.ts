import { supabase } from '@/integrations/supabase/client';
import { extractCheckoutToken } from '@/lib/checkout/checkout-access';
import { logger } from '@/lib/logger';

export type RequestOrderConfirmationEmailParams = {
  orderId: string;
  customerEmail: string;
  customerName?: string;
  checkoutToken?: string;
};

export async function requestOrderConfirmationEmail(
  params: RequestOrderConfirmationEmailParams
): Promise<{ ok: boolean; duplicate?: boolean; error?: string }> {
  const headers: Record<string, string> = {};
  if (params.checkoutToken) {
    headers['x-checkout-token'] = params.checkoutToken;
  }

  const { data, error } = await supabase.functions.invoke('send-order-confirmation-email', {
    body: {
      order_id: params.orderId,
      customer_email: params.customerEmail.trim(),
      customer_name: params.customerName?.trim() || params.customerEmail.split('@')[0],
    },
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  });

  if (error) {
    logger.warn('requestOrderConfirmationEmail failed', { error, orderId: params.orderId });
    return { ok: false, error: error.message };
  }

  const result = data as { success?: boolean; duplicate?: boolean; error?: string } | null;
  if (result?.error) {
    return { ok: false, error: result.error };
  }

  return { ok: true, duplicate: result?.duplicate === true };
}

export async function resolveCheckoutTokenForOrder(orderId: string): Promise<string | undefined> {
  const { data } = await supabase.from('orders').select('metadata').eq('id', orderId).maybeSingle();

  return extractCheckoutToken(data?.metadata);
}

/** Envoi client + vendeur après commande COD (ne pas compter sur useMutation.onSuccess — retiré en RQ v5). */
export async function triggerOrderConfirmationEmailAfterCod(
  params: RequestOrderConfirmationEmailParams
): Promise<{ ok: boolean; duplicate?: boolean; error?: string }> {
  try {
    const checkoutToken =
      params.checkoutToken ?? (await resolveCheckoutTokenForOrder(params.orderId));
    return await requestOrderConfirmationEmail({ ...params, checkoutToken });
  } catch (error) {
    logger.error('triggerOrderConfirmationEmailAfterCod failed', {
      error,
      orderId: params.orderId,
    });
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
