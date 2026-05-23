/**
 * Envoi d'emails via l'Edge Function send-email (Resend côté serveur)
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { ProductType, SendEmailPayload } from '@/types/email';

export interface InvokeSendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Délègue l'envoi à send-email (templates DB ou paiement intégrés).
 */
export async function invokeSendEmail(payload: SendEmailPayload): Promise<InvokeSendEmailResult> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: payload.to,
        toName: payload.toName,
        templateSlug: payload.templateSlug,
        variables: payload.variables,
        productType: payload.productType as ProductType | undefined,
        productId: payload.productId,
        productName: payload.productName,
        orderId: payload.orderId,
        storeId: payload.storeId,
        userId: payload.userId,
        language: payload.language,
      },
    });

    if (error) {
      logger.error('invokeSendEmail: edge function error', {
        error: error.message,
        templateSlug: payload.templateSlug,
        to: payload.to,
      });
      return { success: false, error: error.message };
    }

    const result = data as {
      success?: boolean;
      messageId?: string;
      error?: string;
      skipped?: boolean;
      reason?: string;
    } | null;
    if (result?.success === false || result?.error) {
      return { success: false, error: result.error || 'Email send failed' };
    }

    return { success: true, messageId: result?.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('invokeSendEmail: unexpected error', { error: message, to: payload.to });
    return { success: false, error: message };
  }
}
