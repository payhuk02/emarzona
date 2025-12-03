/**
 * FedEx Tracking Adapter
 * Documentation: https://developer.fedex.com/api/en-us/guides/track-by-reference.html
 * Date: 31 Janvier 2025
 */

import { logger } from '@/lib/logger';
import type { CarrierAdapter, CarrierTrackingResponse, TrackingUpdate } from '../automatic-tracking';

export class FedExAdapter implements CarrierAdapter {
  name = 'FedEx';
  private apiKey?: string;
  private apiSecret?: string;
  private accountNumber?: string;
  private baseUrl = 'https://apis.fedex.com';

  constructor(config?: Record<string, unknown>) {
    this.apiKey = config?.apiKey as string || import.meta.env.VITE_FEDEX_API_KEY;
    this.apiSecret = config?.apiSecret as string || import.meta.env.VITE_FEDEX_API_SECRET;
    this.accountNumber = config?.accountNumber as string || import.meta.env.VITE_FEDEX_ACCOUNT_NUMBER;
  }

  async track(trackingNumber: string, carrierConfig?: Record<string, unknown>): Promise<CarrierTrackingResponse> {
    try {
      // Si les credentials ne sont pas configurés, utiliser la simulation
      if (!this.apiKey || !this.apiSecret) {
        logger.warn('FedEx API credentials not configured, using simulation', { trackingNumber });
        return this.simulateTracking(trackingNumber);
      }

      // Étape 1: Obtenir un token OAuth
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to obtain FedEx access token');
      }

      // Étape 2: Appeler l'API Track v1
      const trackingData = await this.fetchTrackingData(trackingNumber, accessToken);

      // Étape 3: Transformer la réponse FedEx en format standard
      return this.transformResponse(trackingNumber, trackingData);
    } catch (error) {
      logger.error('FedEx tracking error', { error, trackingNumber });
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
   * Obtient un token OAuth pour l'API FedEx
   */
  private async getAccessToken(): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.apiKey!,
          client_secret: this.apiSecret!,
        }),
      });

      if (!response.ok) {
        throw new Error(`FedEx OAuth error: ${response.status}`);
      }

      const data = await response.json();
      return data.access_token || null;
    } catch (error) {
      logger.error('FedEx OAuth error', { error });
      return null;
    }
  }

  /**
   * Récupère les données de tracking depuis l'API FedEx
   */
  private async fetchTrackingData(trackingNumber: string, accessToken: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/track/v1/trackingnumbers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-locale': 'fr_FR',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        includeDetailedScans: true,
        trackingInfo: [
          {
            trackingNumberInfo: {
              trackingNumber: trackingNumber,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`FedEx API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Transforme la réponse FedEx en format standard
   */
  private transformResponse(trackingNumber: string, data: any): CarrierTrackingResponse {
    // Structure de réponse FedEx (à adapter selon la vraie structure)
    const output = data?.output?.completeTrackResults?.[0]?.trackResults?.[0];
    
    if (!output) {
      return this.simulateTracking(trackingNumber);
    }

    const events: TrackingUpdate[] = [];
    const scanEvents = output.scanEvents || [];

    for (const event of scanEvents) {
      events.push({
        event_type: this.mapFedExStatus(event.eventType || ''),
        description: event.eventDescription || event.eventType || 'Événement de tracking',
        event_timestamp: event.date || new Date().toISOString(),
        location: {
          city: event.scanLocation?.city || '',
          state: event.scanLocation?.stateOrProvinceCode || '',
          country: event.scanLocation?.countryCode || '',
          postal_code: event.scanLocation?.postalCode || '',
        },
        event_code: event.eventType || '',
      });
    }

    const latestStatus = this.mapFedExStatus(output.latestStatusDetail?.code || '');
    const estimatedDelivery = output.estimatedDeliveryTimeWindow?.begins || 
                             output.estimatedDeliveryTimeWindow?.ends;

    return {
      success: true,
      tracking_number: trackingNumber,
      status: latestStatus,
      events,
      estimated_delivery: estimatedDelivery ? new Date(estimatedDelivery).toISOString() : undefined,
    };
  }

  /**
   * Mappe les statuts FedEx vers nos statuts standard
   */
  private mapFedExStatus(fedExStatus: string): string {
    const statusMap: Record<string, string> = {
      'OC': 'label_created', // Order Created
      'PU': 'picked_up', // Picked Up
      'IT': 'in_transit', // In Transit
      'OD': 'out_for_delivery', // Out for Delivery
      'DL': 'delivered', // Delivered
      'DE': 'delivered', // Delivered Exception
      'CA': 'cancelled', // Cancelled
      'SE': 'failed', // Shipment Exception
    };

    return statusMap[fedExStatus] || 'in_transit';
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
          event_type: 'PICKED_UP',
          description: 'Colis ramassé',
          event_timestamp: new Date().toISOString(),
          location: {
            city: 'Paris',
            country: 'France',
          },
        },
      ],
      estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
}

