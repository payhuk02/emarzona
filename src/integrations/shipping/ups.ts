/**
 * UPS Shipping Integration
 * Service pour intégration API UPS
 * Date: 2025
 */

import { logger } from '@/lib/logger';

export interface UPSRateRequest {
  from: {
    country: string;
    postalCode: string;
    state?: string;
  };
  to: {
    country: string;
    postalCode: string;
    state?: string;
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

export interface UPSRate {
  serviceType: string;
  serviceName: string;
  totalPrice: number;
  currency: string;
  estimatedDeliveryDays: number;
  estimatedDeliveryDate?: string;
}

export interface UPSLabelRequest {
  shipment: {
    shipper: {
      name: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state?: string;
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
      state?: string;
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

export interface UPSLabelResponse {
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

class UPSService {
  private apiKey: string;
  private apiSecret: string;
  private accountNumber: string;
  private apiUrl: string;
  private testMode: boolean;

  constructor(config: {
    apiKey: string;
    apiSecret: string;
    accountNumber: string;
    apiUrl?: string;
    testMode?: boolean;
  }) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.accountNumber = config.accountNumber;
    this.apiUrl = config.apiUrl || 'https://onlinetools.ups.com';
    this.testMode = config.testMode ?? true;
  }

  /**
   * Obtenir token d'accès OAuth
   */
  private async getAccessToken(): Promise<string> {
    try {
      const tokenUrl = this.testMode
        ? 'https://wwwcie.ups.com/security/v1/oauth/token'
        : 'https://onlinetools.ups.com/security/v1/oauth/token';

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`UPS OAuth error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      logger.error('UPS getAccessToken error', { error });
      // Fallback: utiliser Basic Auth
      return btoa(`${this.apiKey}:${this.apiSecret}`);
    }
  }

  /**
   * Calculer les tarifs de livraison
   */
  async getRates(request: UPSRateRequest): Promise<UPSRate[]> {
    try {
      // Mode test avec calcul réaliste
      if (this.testMode) {
        const basePrice = request.weight * 1200; // 1200 XOF par kg
        const distanceMultiplier = request.from.country === request.to.country ? 1 : 2.5;
        const isInternational = request.from.country !== request.to.country;

        return [
          {
            serviceType: 'ground',
            serviceName: 'UPS Ground',
            totalPrice: Math.round(basePrice * distanceMultiplier * 0.8),
            currency: 'XOF',
            estimatedDeliveryDays: isInternational ? 7 : 3,
            estimatedDeliveryDate: new Date(
              Date.now() + (isInternational ? 7 : 3) * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            serviceType: 'express',
            serviceName: 'UPS Express',
            totalPrice: Math.round(basePrice * distanceMultiplier * 1.5),
            currency: 'XOF',
            estimatedDeliveryDays: isInternational ? 3 : 1,
            estimatedDeliveryDate: new Date(
              Date.now() + (isInternational ? 3 : 1) * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            serviceType: 'express_plus',
            serviceName: 'UPS Express Plus',
            totalPrice: Math.round(basePrice * distanceMultiplier * 2),
            currency: 'XOF',
            estimatedDeliveryDays: isInternational ? 2 : 1,
            estimatedDeliveryDate: new Date(
              Date.now() + (isInternational ? 2 : 1) * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        ];
      }

      // Implémentation réelle API UPS Rating
      const accessToken = await this.getAccessToken();
      const rateUrl = `${this.apiUrl}/api/rating/v1/Rate`;

      const payload = {
        RateRequest: {
          Request: {
            RequestOption: 'Rate',
            TransactionReference: {
              CustomerContext: 'Rating Request',
            },
          },
          Shipment: {
            Shipper: {
              Name: 'Shipper',
              ShipperNumber: this.accountNumber,
              Address: {
                AddressLine: [request.from.postalCode],
                City: '',
                StateProvinceCode: request.from.state || '',
                PostalCode: request.from.postalCode,
                CountryCode: request.from.country,
              },
            },
            ShipTo: {
              Name: 'Recipient',
              Address: {
                AddressLine: [request.to.postalCode],
                City: '',
                StateProvinceCode: request.to.state || '',
                PostalCode: request.to.postalCode,
                CountryCode: request.to.country,
              },
            },
            ShipFrom: {
              Name: 'Shipper',
              Address: {
                AddressLine: [request.from.postalCode],
                City: '',
                StateProvinceCode: request.from.state || '',
                PostalCode: request.from.postalCode,
                CountryCode: request.from.country,
              },
            },
            Package: {
              PackagingType: {
                Code: '02', // Package
                Description: 'Package',
              },
              Dimensions: request.dimensions
                ? {
                    UnitOfMeasurement: {
                      Code: request.dimensions.unit === 'cm' ? 'CM' : 'IN',
                      Description: request.dimensions.unit === 'cm' ? 'Centimeters' : 'Inches',
                    },
                    Length: request.dimensions.length.toString(),
                    Width: request.dimensions.width.toString(),
                    Height: request.dimensions.height.toString(),
                  }
                : undefined,
              PackageWeight: {
                UnitOfMeasurement: {
                  Code: request.weightUnit === 'kg' ? 'KGS' : 'LBS',
                  Description: request.weightUnit === 'kg' ? 'Kilograms' : 'Pounds',
                },
                Weight: request.weight.toString(),
              },
            },
          },
        },
      };

      const response = await fetch(rateUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          transId: `UPS-${Date.now()}`,
          transactionSrc: 'Emarzona',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        logger.error('UPS getRates API error', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });

        // Fallback: retourner des tarifs estimés
        const basePrice = request.weight * 1200;
        return [
          {
            serviceType: 'express',
            serviceName: 'UPS Express (Estimation)',
            totalPrice: Math.round(basePrice * 1.5),
            currency: 'XOF',
            estimatedDeliveryDays: 3,
          },
        ];
      }

      const data = await response.json();

      // Parser la réponse UPS
      const  rates: UPSRate[] = [];
      const ratedShipment = data.RateResponse?.RatedShipment;

      interface UPSShipment {
        Service?: { Code?: string; Description?: string };
        TotalCharges?: { MonetaryValue?: string; CurrencyCode?: string };
      }
      if (Array.isArray(ratedShipment)) {
        ratedShipment.forEach((shipment: UPSShipment) => {
          const service = shipment.Service;
          const totalCharges = shipment.TotalCharges;

          rates.push({
            serviceType: service?.Code?.toLowerCase() || 'standard',
            serviceName: service?.Description || 'UPS Service',
            totalPrice: Math.round(parseFloat(totalCharges?.MonetaryValue || '0') * 100), // Convertir en centimes
            currency: totalCharges?.CurrencyCode || 'XOF',
            estimatedDeliveryDays: 3, // UPS ne retourne pas toujours cette info
          });
        });
      } else if (ratedShipment) {
        const service = ratedShipment.Service;
        const totalCharges = ratedShipment.TotalCharges;

        rates.push({
          serviceType: service?.Code?.toLowerCase() || 'standard',
          serviceName: service?.Description || 'UPS Service',
          totalPrice: Math.round(parseFloat(totalCharges?.MonetaryValue || '0') * 100),
          currency: totalCharges?.CurrencyCode || 'XOF',
          estimatedDeliveryDays: 3,
        });
      }

      // Si aucune donnée, retourner des tarifs par défaut
      if (rates.length === 0) {
        const basePrice = request.weight * 1200;
        rates.push({
          serviceType: 'express',
          serviceName: 'UPS Express',
          totalPrice: Math.round(basePrice * 1.5),
          currency: 'XOF',
          estimatedDeliveryDays: 3,
        });
      }

      return rates;
    } catch (error) {
      logger.error('UPS getRates error', { error, request });

      // En cas d'erreur, retourner des tarifs estimés
      const basePrice = request.weight * 1200;
      return [
        {
          serviceType: 'express',
          serviceName: 'UPS Express (Estimation)',
          totalPrice: Math.round(basePrice * 1.5),
          currency: 'XOF',
          estimatedDeliveryDays: 3,
        },
      ];
    }
  }

  /**
   * Générer une étiquette d'expédition
   */
  async createLabel(request: UPSLabelRequest): Promise<UPSLabelResponse> {
    try {
      if (this.testMode) {
        return {
          labelNumber: `UPS-${Date.now()}`,
          trackingNumber: `1Z${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
          labelUrl: 'https://example.com/label.pdf',
          shippingCost: 5000,
          currency: 'XOF',
        };
      }

      const accessToken = await this.getAccessToken();
      const labelUrl = `${this.apiUrl}/api/ship/v1/shipments`;

      const shipment = request.shipment;
      const packageData = shipment.packages[0];

      const payload = {
        ShipmentRequest: {
          Request: {
            RequestOption: 'nonvalidate',
            TransactionReference: {
              CustomerContext: 'Shipment Request',
            },
          },
          Shipment: {
            Description: 'Package',
            Shipper: {
              Name: shipment.shipper.name,
              AttentionName: shipment.shipper.name,
              TaxIdentificationNumber: '',
              Phone: {
                Number: shipment.shipper.phone || '',
              },
              ShipperNumber: this.accountNumber,
              FaxNumber: '',
              Address: {
                AddressLine: [shipment.shipper.addressLine1],
                City: shipment.shipper.city,
                StateProvinceCode: shipment.shipper.state || '',
                PostalCode: shipment.shipper.postalCode,
                CountryCode: shipment.shipper.countryCode,
              },
            },
            ShipTo: {
              Name: shipment.recipient.name,
              AttentionName: shipment.recipient.name,
              Phone: {
                Number: shipment.recipient.phone || '',
              },
              Address: {
                AddressLine: [shipment.recipient.addressLine1],
                City: shipment.recipient.city,
                StateProvinceCode: shipment.recipient.state || '',
                PostalCode: shipment.recipient.postalCode,
                CountryCode: shipment.recipient.countryCode,
              },
            },
            ShipFrom: {
              Name: shipment.shipper.name,
              AttentionName: shipment.shipper.name,
              Phone: {
                Number: shipment.shipper.phone || '',
              },
              Address: {
                AddressLine: [shipment.shipper.addressLine1],
                City: shipment.shipper.city,
                StateProvinceCode: shipment.shipper.state || '',
                PostalCode: shipment.shipper.postalCode,
                CountryCode: shipment.shipper.countryCode,
              },
            },
            PaymentInformation: {
              ShipmentCharge: {
                Type: '01', // Transportation
                BillShipper: {
                  AccountNumber: this.accountNumber,
                },
              },
            },
            Service: {
              Code: shipment.serviceType,
              Description: shipment.serviceType,
            },
            Package: {
              PackagingType: {
                Code: '02',
                Description: 'Package',
              },
              Dimensions: {
                UnitOfMeasurement: {
                  Code: 'CM',
                  Description: 'Centimeters',
                },
                Length: packageData.dimensions.length.toString(),
                Width: packageData.dimensions.width.toString(),
                Height: packageData.dimensions.height.toString(),
              },
              PackageWeight: {
                UnitOfMeasurement: {
                  Code: 'KGS',
                  Description: 'Kilograms',
                },
                Weight: packageData.weight.toString(),
              },
            },
            LabelSpecification: {
              LabelImageFormat: {
                Code: 'PDF',
                Description: 'PDF',
              },
              HTTPUserAgent: 'Mozilla/4.5',
            },
          },
        },
      };

      const response = await fetch(labelUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          transId: `UPS-${Date.now()}`,
          transactionSrc: 'Emarzona',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`UPS API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      const shipmentResponse = data.ShipmentResponse?.ShipmentResults;

      return {
        labelNumber: shipmentResponse?.ShipmentIdentificationNumber || `UPS-${Date.now()}`,
        trackingNumber: shipmentResponse?.PackageResults?.[0]?.TrackingNumber || '',
        labelUrl: shipmentResponse?.PackageResults?.[0]?.ShippingLabel?.GraphicImage || '',
        labelData: shipmentResponse?.PackageResults?.[0]?.ShippingLabel?.GraphicImage || '',
        shippingCost: Math.round(
          parseFloat(shipmentResponse?.ShipmentCharges?.TotalCharges?.MonetaryValue || '0') * 100
        ),
        currency: shipmentResponse?.ShipmentCharges?.TotalCharges?.CurrencyCode || 'XOF',
      };
    } catch (error) {
      logger.error('UPS createLabel error', { error, request });
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
      const trackUrl = `${this.apiUrl}/api/track/v1/details/${trackingNumber}`;

      const response = await fetch(trackUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          transId: `UPS-${Date.now()}`,
          transactionSrc: 'Emarzona',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`UPS API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      const trackingDetails = data.TrackResponse?.Shipment?.[0]?.Package?.[0]?.Activity;

      interface UPSActivity {
        Status?: { Code?: string; Description?: string };
        Location?: { Address?: { City?: string } };
        Date?: string;
      }
      const  events: TrackingEvent[] = [];
      if (Array.isArray(trackingDetails)) {
        trackingDetails.forEach((activity: UPSActivity) => {
          events.push({
            eventType: activity.Status?.Code || 'unknown',
            eventDescription: activity.Status?.Description || '',
            eventLocation: activity.Location?.Address?.City || '',
            eventTimestamp: activity.Date || new Date().toISOString(),
          });
        });
      }

      return events;
    } catch (error) {
      logger.error('UPS trackShipment error', { error, trackingNumber });
      throw error;
    }
  }
}

export default UPSService;






