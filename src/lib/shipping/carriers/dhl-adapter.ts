/**
 * DHL Tracking Adapter
 * Documentation: https://developer.dhl.com/api-reference/shipment-tracking
 * Date: 31 Janvier 2025
 */

import { logger } from '@/lib/logger';
import type { CarrierAdapter, CarrierTrackingResponse, TrackingUpdate } from '../automatic-tracking';

export class DHLAdapter implements CarrierAdapter {
  name = 'DHL';
  private apiKey?: string;
  private baseUrl = 'https://api-eu.dhl.com';

  constructor(config?: Record<string, unknown>) {
    this.apiKey = config?.apiKey as string || import.meta.env.VITE_DHL_API_KEY;
  }

  async track(trackingNumber: string, carrierConfig?: Record<string, unknown>): Promise<CarrierTrackingResponse> {
    try {
      if (!this.apiKey) {
        logger.warn('DHL API key not configured, using simulation', { trackingNumber });
        return this.simulateTracking(trackingNumber);
      }

      const trackingData = await this.fetchTrackingData(trackingNumber);
      return this.transformResponse(trackingNumber, trackingData);
    } catch (error) {
      logger.error('DHL tracking error', { error, trackingNumber });
      return {
        success: false,
        tracking_number: trackingNumber,
        status: 'unknown',
        events: [],
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Récupère les données de tracking depuis l'API DHL
   */
  private async fetchTrackingData(trackingNumber: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/track/shipments?trackingNumber=${trackingNumber}`,
      {
        method: 'GET',
        headers: {
          'DHL-API-Key': this.apiKey!,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`DHL API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Transforme la réponse DHL en format standard
   */
  private transformResponse(trackingNumber: string, data: any): CarrierTrackingResponse {
    const shipment = data?.shipments?.[0];
    
    if (!shipment) {
      return this.simulateTracking(trackingNumber);
    }

    const  events: TrackingUpdate[] = [];
    const eventsData = shipment.events || [];

    for (const event of eventsData) {
      events.push({
        event_type: this.mapDHLStatus(event.statusCode || ''),
        description: event.description || event.status || 'Événement de tracking',
        event_timestamp: event.timestamp || new Date().toISOString(),
        location: {
          city: event.location?.address?.cityName || '',
          state: event.location?.address?.stateOrProvince || '',
          country: event.location?.address?.countryCode || '',
          postal_code: event.location?.address?.postalCode || '',
        },
        event_code: event.statusCode || '',
      });
    }

    const latestStatus = this.mapDHLStatus(shipment.status?.statusCode || '');
    const estimatedDelivery = shipment.estimatedTimeOfDelivery;

    return {
      success: true,
      tracking_number: trackingNumber,
      status: latestStatus,
      events,
      estimated_delivery: estimatedDelivery ? new Date(estimatedDelivery).toISOString() : undefined,
    };
  }

  /**
   * Mappe les statuts DHL vers nos statuts standard
   */
  private mapDHLStatus(dhlStatus: string): string {
    const  statusMap: Record<string, string> = {
      'pre-transit': 'label_created',
      'transit': 'in_transit',
      'delivered': 'delivered',
      'exception': 'failed',
      'unknown': 'unknown',
    };

    return statusMap[dhlStatus.toLowerCase()] || 'in_transit';
  }

  /**
   * Simulation pour développement/test
   */
  private simulateTracking(trackingNumber: string): CarrierTrackingResponse {
    return {
      success: true,
      tracking_number: trackingNumber,
      status: 'in_transit',
      events: [
        {
          event_type: 'IN_TRANSIT',
          description: 'Colis en transit',
          event_timestamp: new Date().toISOString(),
          location: {
            city: 'Frankfurt',
            country: 'Germany',
          },
        },
      ],
    };
  }
}







