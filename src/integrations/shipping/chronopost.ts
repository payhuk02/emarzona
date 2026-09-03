/**
 * Chronopost Shipping Integration
 * Service pour intégration API Chronopost
 * Date: 2025
 */

import { logger } from '@/lib/logger';

export interface ChronopostRateRequest {
  from: {
    country: string;
    postalCode: string;
  };
  to: {
    country: string;
    postalCode: string;
  };
  weight: number;
  weightUnit: 'kg' | 'lb';
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
}

export interface ChronopostRate {
  serviceType: string;
  serviceName: string;
  totalPrice: number;
  currency: string;
  estimatedDeliveryDays: number;
  estimatedDeliveryDate?: string;
}

export interface ChronopostLabelRequest {
  shipment: {
    shipper: {
      name: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      postalCode: string;
      countryCode: string;
      phone?: string;
      email?: string;
    };
    recipient: {
      name: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      postalCode: string;
      countryCode: string;
      phone?: string;
      email?: string;
    };
    packages: Array<{
      weight: number;
      dimensions: {
        length: number;
        width: number;
        height: number;
      };
    }>;
    serviceType: string;
  };
}

export interface ChronopostLabelResponse {
  labelNumber: string;
  trackingNumber: string;
  labelUrl: string;
  labelData?: string; // Base64
  shippingCost: number;
  currency: string;
}

export interface TrackingEvent {
  eventType: string;
  eventDescription: string;
  eventLocation: string;
  eventTimestamp: string;
}

class ChronopostService {
  private accountNumber: string;
  private password: string;
  private apiUrl: string;
  private testMode: boolean;

  constructor(config: {
    accountNumber: string;
    password: string;
    apiUrl?: string;
    testMode?: boolean;
  }) {
    this.accountNumber = config.accountNumber;
    this.password = config.password;
    this.apiUrl = config.apiUrl || 'https://ws.chronopost.fr';
    this.testMode = config.testMode ?? true;
  }

  /**
   * Calculer les tarifs de livraison
   */
  async getRates(request: ChronopostRateRequest): Promise<ChronopostRate[]> {
    try {
      // Mode test avec calcul réaliste
      if (this.testMode) {
        const basePrice = request.weight * 800; // 800 XOF par kg
        const distanceMultiplier = request.from.country === request.to.country ? 1 : 2;
        const isInternational = request.from.country !== request.to.country;

        return [
          {
            serviceType: 'chrono13',
            serviceName: 'Chronopost 13h',
            totalPrice: Math.round(basePrice * distanceMultiplier * 1.8),
            currency: 'XOF',
            estimatedDeliveryDays: 1,
            estimatedDeliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            serviceType: 'chrono18',
            serviceName: 'Chronopost 18h',
            totalPrice: Math.round(basePrice * distanceMultiplier * 1.4),
            currency: 'XOF',
            estimatedDeliveryDays: 1,
            estimatedDeliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            serviceType: 'chrono10',
            serviceName: 'Chronopost 10h',
            totalPrice: Math.round(basePrice * distanceMultiplier * 2.2),
            currency: 'XOF',
            estimatedDeliveryDays: 1,
            estimatedDeliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            serviceType: 'chrono_classic',
            serviceName: 'Chronopost Classic',
            totalPrice: Math.round(basePrice * distanceMultiplier * 1.0),
            currency: 'XOF',
            estimatedDeliveryDays: isInternational ? 5 : 2,
            estimatedDeliveryDate: new Date(
              Date.now() + (isInternational ? 5 : 2) * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        ];
      }

      // Implémentation réelle API Chronopost
      const rateUrl = `${this.apiUrl}/shipping-calculator-ws-cxf/ShippingServiceWS/calculateShipping`;

      const payload = {
        accountNumber: this.accountNumber,
        password: this.password,
        depCountryCode: request.from.country,
        depZipCode: request.from.postalCode,
        arrCountryCode: request.to.country,
        arrZipCode: request.to.postalCode,
        weight: request.weight,
        shippingDate: new Date().toISOString().split('T')[0],
        productCode: '01', // Chrono 13
      };

      const response = await fetch(rateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        logger.error('Chronopost getRates API error', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });

        // Fallback: retourner des tarifs estimés
        const basePrice = request.weight * 800;
        return [
          {
            serviceType: 'chrono13',
            serviceName: 'Chronopost 13h (Estimation)',
            totalPrice: Math.round(basePrice * 1.8),
            currency: 'XOF',
            estimatedDeliveryDays: 1,
          },
        ];
      }

      const data = await response.json();

      // Parser la réponse Chronopost
      const rates: ChronopostRate[] = [];

      // Chronopost retourne différents services
      const services = [
        { code: '01', name: 'Chronopost 13h', multiplier: 1.8 },
        { code: '02', name: 'Chronopost 18h', multiplier: 1.4 },
        { code: '16', name: 'Chronopost 10h', multiplier: 2.2 },
        { code: '44', name: 'Chronopost Classic', multiplier: 1.0 },
      ];

      services.forEach(service => {
        const rateData = data[`rate${service.code}`] || data.rate;
        if (rateData) {
          rates.push({
            serviceType: `chrono${service.code}`,
            serviceName: service.name,
            totalPrice: Math.round(parseFloat(rateData.amount || '0') * 100), // Convertir en centimes
            currency: rateData.currency || 'XOF',
            estimatedDeliveryDays: parseInt(rateData.deliveryTime || '1'),
            estimatedDeliveryDate: rateData.deliveryDate,
          });
        }
      });

      // Si aucune donnée, retourner des tarifs par défaut
      if (rates.length === 0) {
        const basePrice = request.weight * 800;
        rates.push({
          serviceType: 'chrono13',
          serviceName: 'Chronopost 13h',
          totalPrice: Math.round(basePrice * 1.8),
          currency: 'XOF',
          estimatedDeliveryDays: 1,
        });
      }

      return rates;
    } catch (error) {
      logger.error('Chronopost getRates error', { error, request });

      // En cas d'erreur, retourner des tarifs estimés
      const basePrice = request.weight * 800;
      return [
        {
          serviceType: 'chrono13',
          serviceName: 'Chronopost 13h (Estimation)',
          totalPrice: Math.round(basePrice * 1.8),
          currency: 'XOF',
          estimatedDeliveryDays: 1,
        },
      ];
    }
  }

  /**
   * Générer une étiquette d'expédition
   */
  async createLabel(request: ChronopostLabelRequest): Promise<ChronopostLabelResponse> {
    try {
      if (this.testMode) {
        return {
          labelNumber: `CHRONO-${Date.now()}`,
          trackingNumber: `CH${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
          labelUrl: 'https://example.com/label.pdf',
          shippingCost: 5000,
          currency: 'XOF',
        };
      }

      const labelUrl = `${this.apiUrl}/shipping-calculator-ws-cxf/ShippingServiceWS/shippingV3`;

      const shipment = request.shipment;
      const packageData = shipment.packages[0];

      const payload = {
        headerValue: {
          accountNumber: this.accountNumber,
          idEmit: 'CHR',
          subAccount: '0',
        },
        shipperValue: {
          shipperAdress1: shipment.shipper.addressLine1,
          shipperAdress2: shipment.shipper.addressLine2 || '',
          shipperCity: shipment.shipper.city,
          shipperZipCode: shipment.shipper.postalCode,
          shipperCountry: shipment.shipper.countryCode,
          shipperContactName: shipment.shipper.name,
          shipperEmail: shipment.shipper.email || '',
          shipperPhone: shipment.shipper.phone || '',
        },
        customerValue: {
          customerAdress1: shipment.recipient.addressLine1,
          customerAdress2: shipment.recipient.addressLine2 || '',
          customerCity: shipment.recipient.city,
          customerZipCode: shipment.recipient.postalCode,
          customerCountry: shipment.recipient.countryCode,
          customerContactName: shipment.recipient.name,
          customerEmail: shipment.recipient.email || '',
          customerPhone: shipment.recipient.phone || '',
        },
        recipientValue: {
          recipientAdress1: shipment.recipient.addressLine1,
          recipientAdress2: shipment.recipient.addressLine2 || '',
          recipientCity: shipment.recipient.city,
          recipientZipCode: shipment.recipient.postalCode,
          recipientCountry: shipment.recipient.countryCode,
          recipientContactName: shipment.recipient.name,
          recipientEmail: shipment.recipient.email || '',
          recipientPhone: shipment.recipient.phone || '',
        },
        refValue: {
          shipperRef: `REF-${Date.now()}`,
          recipientRef: shipment.recipient.name,
        },
        skybillValue: {
          weight: packageData.weight,
          height: packageData.dimensions.height,
          length: packageData.dimensions.length,
          width: packageData.dimensions.width,
          productCode: shipment.serviceType || '01',
        },
        password: this.password,
      };

      const response = await fetch(labelUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Chronopost API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      const result = data.returnValue || data;

      return {
        labelNumber: result.skybillNumber || `CHRONO-${Date.now()}`,
        trackingNumber: result.parcelNumber || result.skybillNumber || '',
        labelUrl: result.pdfEtiquette || '',
        labelData: result.pdfEtiquette || '',
        shippingCost: Math.round(parseFloat(result.amount || '0') * 100),
        currency: result.currency || 'XOF',
      };
    } catch (error) {
      logger.error('Chronopost createLabel error', { error, request });
      throw error;
    }
  }

  /**
   * Suivre un colis
   */
  async trackShipment(trackingNumber: string): Promise<TrackingEvent[]> {
    try {
      if (this.testMode) {
        return [
          {
            eventType: 'pickup',
            eventDescription: 'Colis pris en charge',
            eventLocation: 'Paris, France',
            eventTimestamp: new Date().toISOString(),
          },
          {
            eventType: 'in_transit',
            eventDescription: 'Colis en transit',
            eventLocation: 'Dakar, Sénégal',
            eventTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
        ];
      }

      const trackUrl = `${this.apiUrl}/tracking-cxf/TrackingServiceWS/trackSkybillV2`;

      const response = await fetch(trackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber: this.accountNumber,
          password: this.password,
          skybillNumber: trackingNumber,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Chronopost API error: ${error.message || response.statusText}`);
      }

      interface ChronopostEvent {
        code?: string;
        label?: string;
        officeLabel?: string;
        date?: string;
      }
      interface ChronopostTrackingData {
        listEvents?: ChronopostEvent[];
      }
      const data = (await response.json()) as ChronopostTrackingData;
      const events: TrackingEvent[] = [];

      if (data.listEvents) {
        data.listEvents.forEach((event: ChronopostEvent) => {
          events.push({
            eventType: event.code || 'unknown',
            eventDescription: event.label || '',
            eventLocation: event.officeLabel || '',
            eventTimestamp: event.date || new Date().toISOString(),
          });
        });
      }

      return events;
    } catch (error) {
      logger.error('Chronopost trackShipment error', { error, trackingNumber });
      throw error;
    }
  }
}

export default ChronopostService;
