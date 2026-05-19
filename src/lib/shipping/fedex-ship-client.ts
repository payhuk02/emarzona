/**
 * Client pour l'Edge Function fedex-ship (création d'étiquettes sécurisée côté serveur).
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type {
  FedexShipmentRequest,
  FedexShipmentResponse,
} from '@/services/fedex/mockFedexService';

export interface FedexShipEdgeResponse extends FedexShipmentResponse {
  source?: 'fedex_api' | 'mock';
}

function toEdgeAddress(addr: FedexShipmentRequest['ship_from']) {
  return {
    name: addr.name,
    company: addr.company,
    address: addr.address,
    city: addr.city,
    state: addr.state,
    postal_code: addr.zip,
    country: addr.country,
    phone: addr.phone,
  };
}

export async function createFedexShipmentViaEdge(
  request: FedexShipmentRequest
): Promise<FedexShipmentResponse> {
  const { data, error } = await supabase.functions.invoke<FedexShipEdgeResponse>('fedex-ship', {
    body: {
      ship_from: toEdgeAddress(request.ship_from),
      ship_to: toEdgeAddress(request.ship_to),
      package: {
        weight_kg: request.package.weight,
        length: request.package.length,
        width: request.package.width,
        height: request.package.height,
      },
      service_type: request.service_type,
      reference: request.reference,
    },
  });

  if (error) {
    logger.warn('fedex-ship edge function error', { error });
    throw error;
  }

  if (!data?.success || !data.tracking_number) {
    throw new Error('Réponse FedEx ship invalide');
  }

  const { source: _source, ...shipment } = data;
  return shipment;
}
