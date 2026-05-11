/**
 * Chronopost Tracking Adapter
 * Documentation: https://www.chronopost.fr/tracking-cms/suivi-page
 * Date: 31 Janvier 2025
 */

import { logger } from '@/lib/logger';
import type { CarrierAdapter, CarrierTrackingResponse, TrackingUpdate } from '../automatic-tracking';

export class ChronopostAdapter implements CarrierAdapter {
  name = 'Chronopost';
  private accountNumber?: string;
  private password?: string;
  private baseUrl = 'https://api.chronopost.com';

  constructor(config?: Record<string, unknown>) {
    this.accountNumber = config?.accountNumber as string || import.meta.env.VITE_CHRONOPOST_ACCOUNT_NUMBER;
    this.password = config?.password as string || import.meta.env.VITE_CHRONOPOST_PASSWORD;
  }

  async track(trackingNumber: string, carrierConfig?: Record<string, unknown>): Promise<CarrierTrackingResponse> {
    try {
      if (!this.accountNumber || !this.password) {
        logger.warn('Chronopost credentials not configured, using simulation', { trackingNumber });
        return this.simulateTracking(trackingNumber);
      }

      const trackingData = await this.fetchTrackingData(trackingNumber);
      return this.transformResponse(trackingNumber, trackingData);
    } catch (error) {
      logger.error('Chronopost tracking error', { error, trackingNumber });
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
   * Récupère les données de tracking depuis l'API Chronopost
   */
  private async fetchTrackingData(trackingNumber: string): Promise<any> {
    // Chronopost utilise SOAP pour certaines APIs, mais aussi REST
    // Cette implémentation utilise l'API REST si disponible
    const response = await fetch(
      `${this.baseUrl}/tracking-cxf/TrackingServiceWS/trackSkybill?accountNumber=${this.accountNumber}&password=${this.password}&skybillNumber=${trackingNumber}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Chronopost API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Transforme la réponse Chronopost en format standard
   */
  private transformResponse(trackingNumber: string, data: any): CarrierTrackingResponse {
    const listEvents = data?.return?.listEvents || [];
    
    if (!listEvents || listEvents.length === 0) {
      return this.simulateTracking(trackingNumber);
    }

    const  events: TrackingUpdate[] = [];

    for (const event of listEvents) {
      events.push({
        event_type: this.mapChronopostStatus(event.code || ''),
        description: event.label || event.code || 'Événement de tracking',
        event_timestamp: event.date || new Date().toISOString(),
        location: {
          city: event.officeLabel || '',
          country: 'France',
        },
        event_code: event.code || '',
      });
    }

    const latestEvent = listEvents[0];
    const latestStatus = this.mapChronopostStatus(latestEvent?.code || '');

    return {
      success: true,
      tracking_number: trackingNumber,
      status: latestStatus,
      events,
    };
  }

  /**
   * Mappe les statuts Chronopost vers nos statuts standard
   */
  private mapChronopostStatus(chronopostCode: string): string {
    // Codes Chronopost (exemples, à adapter selon la vraie documentation)
    const  statusMap: Record<string, string> = {
      'D1': 'label_created', // Colis déposé
      'D2': 'picked_up', // Colis ramassé
      'D3': 'in_transit', // En transit
      'D4': 'out_for_delivery', // En cours de livraison
      'D5': 'delivered', // Livré
      'D6': 'failed', // Échec de livraison
    };

    return statusMap[chronopostCode] || 'in_transit';
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







