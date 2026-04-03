/**
 * UPS Tracking Adapter
 * Documentation: https://developer.ups.com/api/reference
 * Date: 31 Janvier 2025
 */

import { logger } from '@/lib/logger';
import type { CarrierAdapter, CarrierTrackingResponse, TrackingUpdate } from '../automatic-tracking';

export class UPSAdapter implements CarrierAdapter {
  name = 'UPS';
  private clientId?: string;
  private clientSecret?: string;
  private baseUrl = 'https://onlinetools.ups.com';

  constructor(config?: Record<string, unknown>) {
    this.clientId = config?.clientId as string || import.meta.env.VITE_UPS_CLIENT_ID;
    this.clientSecret = config?.clientSecret as string || import.meta.env.VITE_UPS_CLIENT_SECRET;
  }

  async track(trackingNumber: string, carrierConfig?: Record<string, unknown>): Promise<CarrierTrackingResponse> {
    try {
      if (!this.clientId || !this.clientSecret) {
        logger.warn('UPS API credentials not configured, using simulation', { trackingNumber });
        return this.simulateTracking(trackingNumber);
      }

      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to obtain UPS access token');
      }

      const trackingData = await this.fetchTrackingData(trackingNumber, accessToken);
      return this.transformResponse(trackingNumber, trackingData);
    } catch (error) {
      logger.error('UPS tracking error', { error, trackingNumber });
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
   * Obtient un token OAuth pour l'API UPS
   */
  private async getAccessToken(): Promise<string | null> {
    try {
      const credentials = btoa(`${this.clientId}:${this.clientSecret}`);
      const response = await fetch(`${this.baseUrl}/security/v1/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error(`UPS OAuth error: ${response.status}`);
      }

      const data = await response.json();
      return data.access_token || null;
    } catch (error) {
      logger.error('UPS OAuth error', { error });
      return null;
    }
  }

  /**
   * Récupère les données de tracking depuis l'API UPS
   */
  private async fetchTrackingData(trackingNumber: string, accessToken: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/track/v1/details/${trackingNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'transId': `track-${Date.now()}`,
        'transactionSrc': 'emarzona',
      },
    });

    if (!response.ok) {
      throw new Error(`UPS API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Transforme la réponse UPS en format standard
   */
  private transformResponse(trackingNumber: string, data: any): CarrierTrackingResponse {
    const trackResponse = data?.TrackResponse?.Shipment?.[0];
    
    if (!trackResponse) {
      return this.simulateTracking(trackingNumber);
    }

    const  events: TrackingUpdate[] = [];
    const activities = trackResponse.Package?.[0]?.Activity || [];

    for (const activity of activities) {
      events.push({
        event_type: this.mapUPSStatus(activity.Status?.StatusType?.Code || ''),
        description: activity.Status?.StatusType?.Description || activity.Status?.Description || 'Événement de tracking',
        event_timestamp: activity.Date || new Date().toISOString(),
        location: {
          city: activity.ActivityLocation?.Address?.City || '',
          state: activity.ActivityLocation?.Address?.StateProvinceCode || '',
          country: activity.ActivityLocation?.Address?.CountryCode || '',
          postal_code: activity.ActivityLocation?.Address?.PostalCode || '',
        },
        event_code: activity.Status?.StatusType?.Code || '',
      });
    }

    const latestStatus = this.mapUPSStatus(trackResponse.Package?.[0]?.Activity?.[0]?.Status?.StatusType?.Code || '');
    const estimatedDelivery = trackResponse.ScheduledDelivery?.Date;

    return {
      success: true,
      tracking_number: trackingNumber,
      status: latestStatus,
      events,
      estimated_delivery: estimatedDelivery ? new Date(estimatedDelivery).toISOString() : undefined,
    };
  }

  /**
   * Mappe les statuts UPS vers nos statuts standard
   */
  private mapUPSStatus(upsStatus: string): string {
    const  statusMap: Record<string, string> = {
      'I': 'in_transit', // In Transit
      'D': 'delivered', // Delivered
      'X': 'cancelled', // Cancelled
      'P': 'picked_up', // Picked Up
      'M': 'label_created', // Manifested
      'O': 'out_for_delivery', // Out for Delivery
    };

    return statusMap[upsStatus] || 'in_transit';
  }

  /**
   * Simulation pour développement/test
   */
  private simulateTracking(trackingNumber: string): CarrierTrackingResponse {
    return {
      success: true,
      tracking_number: trackingNumber,
      status: 'in_transit',
      events: [],
    };
  }
}







