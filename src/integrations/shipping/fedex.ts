/**
 * FedEx Shipping Integration
 * Service pour intégration API FedEx
 */

import { logger } from '@/lib/logger';

export interface FedExRateRequest {
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

export interface FedExRate {
  serviceType: string;
  serviceName: string;
  totalPrice: number;
  currency: string;
  estimatedDeliveryDays: number;
}

export interface FedExLabelRequest {
  shipment: {
    shipper: {
      name: string;
      addressLine1: string;
      city: string;
      postalCode: string;
      countryCode: string;
    };
    recipient: {
      name: string;
      addressLine1: string;
      city: string;
      postalCode: string;
      countryCode: string;
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

export interface FedExLabelResponse {
  labelNumber: string;
  trackingNumber: string;
  labelUrl: string;
  shippingCost: number;
  currency: string;
}

class FedExService {
  private apiKey: string;
  private apiSecret: string;
  private accountNumber: string;
  private meterNumber?: string;
  private apiUrl: string;
  private testMode: boolean;

  constructor(config: {
    apiKey: string;
    apiSecret: string;
    accountNumber: string;
    meterNumber?: string;
    apiUrl?: string;
    testMode?: boolean;
  }) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.accountNumber = config.accountNumber;
    this.meterNumber = config.meterNumber;
    this.apiUrl = config.apiUrl || 'https://apis.fedex.com';
    this.testMode = config.testMode ?? true;
  }

  /**
   * Calculer les tarifs
   */
  async getRates(request: FedExRateRequest): Promise<FedExRate[]> {
    try {
      if (this.testMode) {
        return [
          {
            serviceType: 'standard',
            serviceName: 'FedEx Ground',
            totalPrice: 4500,
            currency: 'XOF',
            estimatedDeliveryDays: 4,
          },
          {
            serviceType: 'express',
            serviceName: 'FedEx Express',
            totalPrice: 12000,
            currency: 'XOF',
            estimatedDeliveryDays: 2,
          },
        ];
      }

      const accessToken = await this.getAccessToken();
      const rateUrl = `${this.apiUrl}/rate/v1/rates/quotes`;

      const response = await fetch(rateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-locale': 'fr_FR',
        },
        body: JSON.stringify({
          accountNumber: {
            value: this.accountNumber,
          },
          requestedShipment: {
            shipper: {
              address: {
                postalCode: request.from.postalCode,
                countryCode: request.from.country,
              },
            },
            recipients: [
              {
                address: {
                  postalCode: request.to.postalCode,
                  countryCode: request.to.country,
                },
              },
            ],
            rateRequestType: ['ACCOUNT', 'LIST'],
            requestedPackageLineItems: [
              {
                weight: {
                  value: request.weight,
                  units: request.weightUnit === 'kg' ? 'KG' : 'LB',
                },
                dimensions: request.dimensions
                  ? {
                      length: request.dimensions.length,
                      width: request.dimensions.width,
                      height: request.dimensions.height,
                      units: request.dimensions.unit === 'cm' ? 'CM' : 'IN',
                    }
                  : undefined,
              },
            ],
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`FedEx API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      const output = data.output || {};
      const rateReplyDetails = output.rateReplyDetails || [];

      return rateReplyDetails.map((rate: any) => ({
        serviceType: rate.serviceType || 'standard',
        serviceName: rate.serviceName || 'FedEx Service',
        totalPrice: (parseFloat(rate.totalNetCharge?.amount || '0') * 100) || 0,
        currency: rate.totalNetCharge?.currency || 'XOF',
        estimatedDeliveryDays: rate.commit?.daysInTransit || 5,
      }));
    } catch (error) {
      logger.error('FedEx getRates error', { error, request });
      throw error;
    }
  }

  /**
   * Générer une étiquette
   */
  async createLabel(request: FedExLabelRequest): Promise<FedExLabelResponse> {
    try {
      if (this.testMode) {
        return {
          labelNumber: `FEDEX-${Date.now()}`,
          trackingNumber: `FEDEX${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
          labelUrl: 'https://example.com/label.pdf',
          shippingCost: 4500,
          currency: 'XOF',
        };
      }

      const accessToken = await this.getAccessToken();
      const shipUrl = `${this.apiUrl}/ship/v1/shipments`;

      const packageData = request.shipment.packages[0];

      const response = await fetch(shipUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-locale': 'fr_FR',
        },
        body: JSON.stringify({
          labelResponseOptions: 'URL_ONLY',
          accountNumber: {
            value: this.accountNumber,
          },
          requestedShipment: {
            shipper: {
              contact: {
                personName: request.shipment.shipper.name,
              },
              address: {
                streetLines: [request.shipment.shipper.addressLine1],
                city: request.shipment.shipper.city,
                postalCode: request.shipment.shipper.postalCode,
                countryCode: request.shipment.shipper.countryCode,
              },
            },
            recipients: [
              {
                contact: {
                  personName: request.shipment.recipient.name,
                },
                address: {
                  streetLines: [request.shipment.recipient.addressLine1],
                  city: request.shipment.recipient.city,
                  postalCode: request.shipment.recipient.postalCode,
                  countryCode: request.shipment.recipient.countryCode,
                },
              },
            ],
            shipDatestamp: new Date().toISOString().split('T')[0],
            serviceType: request.shipment.serviceType,
            packagingType: 'YOUR_PACKAGING',
            pickupType: 'USE_SCHEDULED_PICKUP',
            blockInsightVisibility: false,
            shippingChargesPayment: {
              paymentType: 'SENDER',
            },
            labelSpecification: {
              imageType: 'PDF',
              labelStockType: 'PAPER_4X6',
            },
            requestedPackageLineItems: [
              {
                weight: {
                  value: packageData.weight,
                  units: 'KG',
                },
                dimensions: {
                  length: packageData.dimensions.length,
                  width: packageData.dimensions.width,
                  height: packageData.dimensions.height,
                  units: 'CM',
                },
              },
            ],
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`FedEx API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      const output = data.output || {};
      const transactionShipments = output.transactionShipments || [];
      const shipment = transactionShipments[0] || {};
      const masterTrackingNumber = shipment.masterTrackingNumber || {};
      const labelResults = shipment.labelResults || [];
      const labelResult = labelResults[0] || {};

      return {
        labelNumber: masterTrackingNumber.trackingNumber || `FEDEX-${Date.now()}`,
        trackingNumber: masterTrackingNumber.trackingNumber || '',
        labelUrl: labelResult.customerReference || '',
        shippingCost: (parseFloat(output.totalNetCharge?.amount || '0') * 100) || 0,
        currency: output.totalNetCharge?.currency || 'XOF',
      };
    } catch (error) {
      logger.error('FedEx createLabel error', { error, request });
      throw error;
    }
  }

  /**
   * Obtenir token d'accès (OAuth 2.0)
   */
  private async getAccessToken(): Promise<string> {
    try {
      const tokenUrl = this.testMode
        ? 'https://apis-sandbox.fedex.com/oauth/token'
        : 'https://apis.fedex.com/oauth/token';

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.apiKey,
          client_secret: this.apiSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`FedEx OAuth error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      logger.error('FedEx getAccessToken error', { error });
      throw error;
    }
  }

  /**
   * Suivre un colis
   */
  async trackShipment(trackingNumber: string): Promise<any[]> {
    try {
      if (this.testMode) {
        return [
          {
            eventType: 'pickup',
            eventDescription: 'Colis pris en charge',
            eventLocation: 'Dakar, Sénégal',
            eventTimestamp: new Date().toISOString(),
          },
          {
            eventType: 'in_transit',
            eventDescription: 'Colis en transit',
            eventLocation: 'Paris, France',
            eventTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
        ];
      }

      const accessToken = await this.getAccessToken();
      const trackingUrl = `${this.apiUrl}/track/v1/trackingnumbers`;

      // Appel API FedEx Tracking
      const response = await fetch(trackingUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-locale': 'fr_FR',
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
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`FedEx API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();

      // Parser les événements de suivi
      const events: any[] = [];
      const output = data.output || {};
      const completeTrackResults = output.completeTrackResults || [];

      completeTrackResults.forEach((result: any) => {
        const trackResults = result.trackResults || [];
        trackResults.forEach((trackResult: any) => {
          const scanEvents = trackResult.scanEvents || [];
          scanEvents.forEach((event: any) => {
            events.push({
              eventType: event.eventType || 'unknown',
              eventDescription: event.eventDescription || '',
              eventLocation: event.scanLocation?.city || '',
              eventTimestamp: event.date || new Date().toISOString(),
            });
          });
        });
      });

      return events.sort((a, b) => 
        new Date(b.eventTimestamp).getTime() - new Date(a.eventTimestamp).getTime()
      );
    } catch (error) {
      logger.error('FedEx trackShipment error', { error, trackingNumber });
      throw error;
    }
  }
}

export default FedExService;

