/**
 * Client pour l'Edge Function fedex-cancel (annulation sécurisée côté serveur).
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface FedexCancelResponse {
  success: boolean;
  tracking_number: string;
  message?: string;
  source?: 'fedex_api' | 'mock';
}

export async function cancelFedexShipmentViaEdge(
  trackingNumber: string
): Promise<{ success: boolean }> {
  const { data, error } = await supabase.functions.invoke<FedexCancelResponse>('fedex-cancel', {
    body: { tracking_number: trackingNumber },
  });

  if (error) {
    logger.warn('fedex-cancel edge function error', { error, trackingNumber });
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.message || 'Annulation FedEx échouée');
  }

  return { success: true };
}
