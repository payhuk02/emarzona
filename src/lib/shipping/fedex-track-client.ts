/**
 * Client pour l'Edge Function fedex-track (suivi sécurisé côté serveur).
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { assertFedexResponseNotMock } from '@/lib/shipping/fedex-policy';
import type { FedexTrackingResponse } from '@/services/fedex/mockFedexService';

export interface FedexTrackEdgeResponse extends FedexTrackingResponse {
  source?: 'fedex_api' | 'mock';
}

export async function fetchFedexTrackingViaEdge(
  trackingNumber: string
): Promise<FedexTrackingResponse> {
  const { data, error } = await supabase.functions.invoke<FedexTrackEdgeResponse>('fedex-track', {
    body: { tracking_number: trackingNumber },
  });

  if (error) {
    logger.warn('fedex-track edge function error', { error, trackingNumber });
    throw error;
  }

  if (!data?.success || !data.tracking_number) {
    throw new Error('Réponse FedEx track invalide');
  }

  assertFedexResponseNotMock(data.source);

  const { source: _source, ...tracking } = data;
  return tracking;
}
