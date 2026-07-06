/**
 * Accès espace client invité après paiement — magic link sécurisé via Edge Function.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type GuestCustomerAccessResult = {
  success: boolean;
  actionLink?: string;
  redirectPath?: string;
  error?: string;
  code?: string;
};

export async function requestGuestCustomerAccess(
  orderId: string,
  email: string
): Promise<GuestCustomerAccessResult> {
  const trimmedEmail = email.trim();
  if (!orderId || !trimmedEmail) {
    return { success: false, error: 'Paramètres manquants' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('guest-customer-access', {
      body: { orderId, email: trimmedEmail },
    });

    if (error) {
      logger.warn('guest-customer-access invoke error', { error, orderId });
      return { success: false, error: error.message || 'Accès temporairement indisponible' };
    }

    const payload = data as GuestCustomerAccessResult | null;
    if (!payload?.success || !payload.actionLink) {
      return {
        success: false,
        error: payload?.error || 'Impossible de générer votre accès',
        code: payload?.code,
      };
    }

    return payload;
  } catch (err) {
    logger.error('guest-customer-access failed', { err, orderId });
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur réseau',
    };
  }
}
