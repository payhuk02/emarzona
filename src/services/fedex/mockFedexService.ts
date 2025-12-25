/**
 * Mock FedEx API Service
 * Date: 28 octobre 2025
 * 
 * Service simulant l'API FedEx pour développement
 * Architecture prête pour basculer vers la vraie API
 */

import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface FedexAddress {
  name: string;
  company?: string;
  address: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  phone: string;
}

export interface FedexPackage {
  weight: number; // kg
  length?: number; // cm
  width?: number; // cm
  height?: number; // cm
  insurance_value?: number;
}

export interface FedexShipmentRequest {
  ship_from: FedexAddress;
  ship_to: FedexAddress;
  package: FedexPackage;
  service_type?: string; // 'FEDEX_GROUND', 'FEDEX_2DAY', etc.
  reference?: string; // Order number
}

export interface FedexTrackingEvent {
  timestamp: string;
  status: string;
  status_code: string;
  location: {
    city: string;
    state?: string;
    country: string;
  };
  description: string;
}

export interface FedexShipmentResponse {
  success: boolean;
  tracking_number: string;
  tracking_url: string;
  label_url: string;
  label_base64?: string;
  estimated_delivery: string;
  shipping_cost: number;
  currency: string;
  service_type: string;
}

export interface FedexTrackingResponse {
  success: boolean;
  tracking_number: string;
  status: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  events: FedexTrackingEvent[];
  current_location?: {
    city: string;
    state?: string;
    country: string;
  };
}

export interface FedexRateRequest {
  ship_from: FedexAddress;
  ship_to: FedexAddress;
  package: FedexPackage;
}

export interface FedexRate {
  service_type: string;
  service_name: string;
  total_cost: number;
  currency: string;
  estimated_days: number;
  delivery_date: string;
}

// =====================================================
// MOCK DATA
// =====================================================

const MOCK_TRACKING_STATUSES = [
  'LABEL_CREATED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
] as const;

const MOCK_SERVICE_TYPES = {
  FEDEX_GROUND: {
    name: 'FedEx Ground',
    cost_per_kg: 2000, // XOF
    base_cost: 5000, // XOF
    days: 5,
  },
  FEDEX_2DAY: {
    name: 'FedEx 2Day',
    cost_per_kg: 5000,
    base_cost: 15000,
    days: 2,
  },
  FEDEX_OVERNIGHT: {
    name: 'FedEx Standard Overnight',
    cost_per_kg: 10000,
    base_cost: 30000,
    days: 1,
  },
  FEDEX_INTERNATIONAL: {
    name: 'FedEx International Priority',
    cost_per_kg: 8000,
    base_cost: 25000,
    days: 7,
  },
};

// =====================================================
// MOCK SERVICE
// =====================================================

class MockFedexService {
  private testMode = true;
  private mockDelay = 1000; // 1 second delay to simulate API call

  /**
   * Simulate API delay
   */
  private async simulateDelay() {
    await new Promise((resolve) => setTimeout(resolve, this.mockDelay));
  }

  /**
   * Generate mock tracking number
   */
  private generateTrackingNumber(): string {
    const prefix = 'MOCK';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Generate mock label (base64 PDF)
   */
  private generateMockLabel(trackingNumber: string): string {
    // In production, this would be a real PDF
    const labelContent = `
      ╔═══════════════════════════════════╗
      ║        FEDEX SHIPPING LABEL       ║
      ╠═══════════════════════════════════╣
      ║                                   ║
      ║   Tracking: ${trackingNumber}     ║
      ║                                   ║
      ║   [BARCODE PLACEHOLDER]           ║
      ║                                   ║
      ╚═══════════════════════════════════╝
    `;

    // Convert to base64 (simplified for mock)
    return btoa(labelContent);
  }

  /**
   * Calculate shipping cost
   */
  private calculateCost(
    serviceType: keyof typeof MOCK_SERVICE_TYPES,
    weight: number
  ): number {
    const service = MOCK_SERVICE_TYPES[serviceType];
    return service.base_cost + service.cost_per_kg * weight;
  }

  /**
   * Calculate delivery date
   */
  private calculateDeliveryDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  // =====================================================
  // PUBLIC API
  // =====================================================

  /**
   * Create shipment and generate label
   */
  async createShipment(
    request: FedexShipmentRequest
  ): Promise<FedexShipmentResponse> {
    await this.simulateDelay();

    const serviceType = (request.service_type ||
      'FEDEX_GROUND') as keyof typeof MOCK_SERVICE_TYPES;
    const service = MOCK_SERVICE_TYPES[serviceType];
    const trackingNumber = this.generateTrackingNumber();
    const cost = this.calculateCost(serviceType, request.package.weight);
    const deliveryDate = this.calculateDeliveryDate(service.days);

    return {
      success: true,
      tracking_number: trackingNumber,
      tracking_url: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      label_url: `/api/labels/${trackingNumber}.pdf`,
      label_base64: this.generateMockLabel(trackingNumber),
      estimated_delivery: deliveryDate,
      shipping_cost: cost,
      currency: 'XOF',
      service_type: serviceType,
    };
  }

  /**
   * Get tracking information
   */
  async getTracking(trackingNumber: string): Promise<FedexTrackingResponse> {
    await this.simulateDelay();

    // Generate mock tracking events
    const now = new Date();
    const events: FedexTrackingEvent[] = [];

    // Simulate progression through statuses
    const statusIndex = Math.floor(Math.random() * MOCK_TRACKING_STATUSES.length);

    for (let i = 0; i <= statusIndex; i++) {
      const status = MOCK_TRACKING_STATUSES[i];
      const eventDate = new Date(now);
      eventDate.setHours(eventDate.getHours() - (statusIndex - i) * 12);

      events.push({
        timestamp: eventDate.toISOString(),
        status: status,
        status_code: `FX_${status}`,
        location: {
          city: this.getMockCity(i),
          state: 'State',
          country: 'Country',
        },
        description: this.getStatusDescription(status),
      });
    }

    const currentStatus = MOCK_TRACKING_STATUSES[statusIndex];
    const isDelivered = currentStatus === 'DELIVERED';

    return {
      success: true,
      tracking_number: trackingNumber,
      status: currentStatus,
      estimated_delivery: !isDelivered
        ? this.calculateDeliveryDate(3)
        : undefined,
      actual_delivery: isDelivered ? events[events.length - 1].timestamp : undefined,
      events: events.reverse(), // Most recent first
      current_location: events[0]?.location,
    };
  }

  /**
   * Get shipping rates for different services
   */
  async getRates(request: FedexRateRequest): Promise<FedexRate[]> {
    await this.simulateDelay();

    const rates: FedexRate[] = Object.entries(MOCK_SERVICE_TYPES).map(
      ([code, service]) => ({
        service_type: code,
        service_name: service.name,
        total_cost: this.calculateCost(
          code as keyof typeof MOCK_SERVICE_TYPES,
          request.package.weight
        ),
        currency: 'XOF',
        estimated_days: service.days,
        delivery_date: this.calculateDeliveryDate(service.days),
      })
    );

    // Sort by cost
    return rates.sort((a, b) => a.total_cost - b.total_cost);
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(trackingNumber: string): Promise<{ success: boolean }> {
    await this.simulateDelay();

    logger.info('Mock FedEx: Cancelled shipment', { trackingNumber });

    return { success: true };
  }

  /**
   * Request pickup
   */
  async requestPickup(data: {
    address: FedexAddress;
    pickupDate: string;
    packageCount: number;
    totalWeight: number;
  }): Promise<{ success: boolean; confirmation_number: string }> {
    await this.simulateDelay();

    const confirmationNumber = `PU${Date.now().toString().slice(-8)}`;

    return {
      success: true,
      confirmation_number: confirmationNumber,
    };
  }

  // =====================================================
  // HELPERS
  // =====================================================

  private getMockCity(index: number): string {
    const cities = [
      'Ouagadougou',
      'Abidjan',
      'Dakar',
      'Bamako',
      'Niamey',
      'Cotonou',
    ];
    return cities[index % cities.length];
  }

  private getStatusDescription(status: string): string {
    const descriptions: Record<string, string> = {
      LABEL_CREATED: 'Étiquette d\'expédition créée',
      PICKED_UP: 'Colis ramassé par FedEx',
      IN_TRANSIT: 'En transit vers la destination',
      OUT_FOR_DELIVERY: 'En cours de livraison',
      DELIVERED: 'Livré avec succès',
    };

    return descriptions[status] || 'Statut inconnu';
  }
}

// =====================================================
// EXPORT SINGLETON
// =====================================================

export const mockFedexService = new MockFedexService();
export default mockFedexService;

