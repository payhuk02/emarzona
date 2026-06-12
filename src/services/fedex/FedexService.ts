import { logger } from '@/lib/logger';
import { createFedexShipmentViaEdge } from '@/lib/shipping/fedex-ship-client';
import { cancelFedexShipmentViaEdge } from '@/lib/shipping/fedex-cancel-client';
import { fetchFedexRatesViaEdge } from '@/lib/shipping/fedex-rates-client';
import { fetchFedexTrackingViaEdge } from '@/lib/shipping/fedex-track-client';
import { isFedexMockAllowed, FedexUnavailableError } from '@/lib/shipping/fedex-policy';
import {
  mockFedexService,
  type FedexRateRequest,
  type FedexRate,
  type FedexShipmentRequest,
  type FedexShipmentResponse,
  type FedexTrackingResponse,
} from './mockFedexService';

/**
 * Minimal real FedEx service wrapper (skeleton).
 * If VITE_FEDEX_API_KEY is not set, we transparently fallback to mock service.
 */
export class FedexService {
  private get useEdgeFedex(): boolean {
    return import.meta.env.VITE_FEDEX_USE_EDGE !== 'false';
  }

  async getRates(request: FedexRateRequest): Promise<FedexRate[]> {
    if (this.useEdgeFedex && request.ship_from?.zip && request.ship_to?.zip) {
      try {
        const { rates } = await fetchFedexRatesViaEdge({
          ship_from: {
            country: request.ship_from.country,
            postal_code: request.ship_from.zip,
            city: request.ship_from.city,
          },
          ship_to: {
            country: request.ship_to.country,
            postal_code: request.ship_to.zip,
            city: request.ship_to.city,
          },
          weight_kg: request.package.weight,
        });

        return rates.map(r => ({
          service_type: r.service_type,
          service_name: r.service_name,
          total_cost: r.total_cost,
          currency: r.currency,
          estimated_days: r.estimated_days,
          delivery_date: '',
        }));
      } catch (edgeError) {
        logger.warn('FedEx edge rates failed', { edgeError });
      }
    }

    if (!isFedexMockAllowed()) {
      throw new FedexUnavailableError();
    }
    return mockFedexService.getRates(request);
  }

  async createShipment(request: FedexShipmentRequest): Promise<FedexShipmentResponse> {
    if (
      this.useEdgeFedex &&
      request.ship_from?.zip &&
      request.ship_to?.zip &&
      request.ship_from?.address &&
      request.ship_to?.address
    ) {
      try {
        return await createFedexShipmentViaEdge(request);
      } catch (edgeError) {
        logger.warn('FedEx edge ship failed', { edgeError });
      }
    }

    if (!isFedexMockAllowed()) {
      throw new FedexUnavailableError('FedEx expédition indisponible en production');
    }
    return mockFedexService.createShipment(request);
  }

  async getTracking(trackingNumber: string): Promise<FedexTrackingResponse> {
    if (this.useEdgeFedex && trackingNumber?.trim()) {
      try {
        return await fetchFedexTrackingViaEdge(trackingNumber.trim());
      } catch (edgeError) {
        logger.warn('FedEx edge track failed', { edgeError, trackingNumber });
      }
    }

    if (!isFedexMockAllowed()) {
      throw new FedexUnavailableError('Suivi FedEx indisponible en production');
    }
    return mockFedexService.getTracking(trackingNumber);
  }

  async cancelShipment(trackingNumber: string): Promise<{ success: boolean }> {
    if (this.useEdgeFedex && trackingNumber?.trim()) {
      try {
        return await cancelFedexShipmentViaEdge(trackingNumber.trim());
      } catch (edgeError) {
        logger.warn('FedEx edge cancel failed', { edgeError, trackingNumber });
      }
    }

    if (!isFedexMockAllowed()) {
      throw new FedexUnavailableError('Annulation FedEx indisponible en production');
    }
    return mockFedexService.cancelShipment(trackingNumber);
  }
}

export const fedexService = new FedexService();
