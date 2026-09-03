/**
 * DHL Shipping Integration
 * Service pour intégration API DHL
 */

import { logger } from '@/lib/logger';

export interface DHLRateRequest {
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

export interface DHLRate {
  serviceType: string;
  serviceName: string;
  totalPrice: number;
  currency: string;
  estimatedDeliveryDays: number;
  estimatedDeliveryDate?: string;
}

export interface DHLLabelRequest {
  shipment: {
    shipper: {
      name: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      postalCode: string;
      countryCode: string;
      contact?: {
        phone: string;
        email?: string;
      };
    };
    recipient: {
      name: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      postalCode: string;
      countryCode: string;
      contact?: {
        phone: string;
        email?: string;
      };
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

export interface DHLLabelResponse {
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

class DHLService {
  private apiKey: string;
  private apiSecret: string;
  private apiUrl: string;
  private testMode: boolean;

  constructor(config: { apiKey: string; apiSecret: string; apiUrl?: string; testMode?: boolean }) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.apiUrl = config.apiUrl || 'https://api.dhl.com';
    this.testMode = config.testMode ?? true;
  }

  /**
   * Calculer les tarifs de livraison en temps réel
   */
  async getRates(request: DHLRateRequest): Promise<DHLRate[]> {
    try {
      // Mode test avec données réalistes
      if (this.testMode) {
        // Calcul basé sur poids et distance (simulation)
        const basePrice = request.weight * 1000; // 1000 XOF par kg
        const distanceMultiplier = request.from.country === request.to.country ? 1 : 2;

        return [
          {
            serviceType: 'standard',
            serviceName: 'DHL Express Standard',
            totalPrice: Math.round(basePrice * distanceMultiplier),
            currency: 'XOF',
            estimatedDeliveryDays: request.from.country === request.to.country ? 2 : 5,
            estimatedDeliveryDate: new Date(
              Date.now() +
                (request.from.country === request.to.country ? 2 : 5) * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            serviceType: 'express',
            serviceName: 'DHL Express 24h',
            totalPrice: Math.round(basePrice * distanceMultiplier * 1.8),
            currency: 'XOF',
            estimatedDeliveryDays: 1,
            estimatedDeliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            serviceType: 'economy',
            serviceName: 'DHL Economy',
            totalPrice: Math.round(basePrice * distanceMultiplier * 0.7),
            currency: 'XOF',
            estimatedDeliveryDays: request.from.country === request.to.country ? 4 : 8,
            estimatedDeliveryDate: new Date(
              Date.now() +
                (request.from.country === request.to.country ? 4 : 8) * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        ];
      }

      // Implémentation réelle API DHL Express Rate Quote
      const accessToken = await this.getAccessToken();

      const rateUrl = `${this.apiUrl}/rest/rating/v1/rates`;

      // Préparer le payload selon la documentation DHL Express API
      const payload = {
        accountNumber: this.apiKey,
        originLocationCode: request.from.postalCode.substring(0, 3), // Code postal tronqué
        destinationLocationCode: request.to.postalCode.substring(0, 3),
        originCountryCode: request.from.country,
        destinationCountryCode: request.to.country,
        weight: {
          netValue: request.weight,
          grossValue: request.weight,
        },
        weightUnit: request.weightUnit === 'kg' ? 'metric' : 'imperial',
        dimensions: request.dimensions
          ? {
              length: request.dimensions.length,
              width: request.dimensions.width,
              height: request.dimensions.height,
            }
          : undefined,
        dimensionUnit: request.dimensions?.unit === 'cm' ? 'metric' : 'imperial',
        plannedShippingDateAndTime: new Date().toISOString(),
        isCustomsDeclarable: false,
        unitOfMeasurement: 'metric',
      };

      const response = await fetch(rateUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        logger.error('DHL getRates API error', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });

        // Fallback: retourner des tarifs estimés basés sur le poids
        const basePrice = request.weight * 1000;
        return [
          {
            serviceType: 'standard',
            serviceName: 'DHL Express (Estimation)',
            totalPrice: Math.round(basePrice * 1.5),
            currency: 'XOF',
            estimatedDeliveryDays: 3,
          },
        ];
      }

      const data = await response.json();

      // Parser la réponse DHL selon le format de leur API
      const rates: DHLRate[] = [];

      if (data.products && Array.isArray(data.products)) {
        interface DHLProduct {
          productCode?: string;
          productName?: string;
          totalPrice?: Array<{ price: string; currencyCode: string }>;
          deliveryCapabilities?: { deliveryDate?: string };
        }
        data.products.forEach((product: DHLProduct) => {
          const totalPrice = product.totalPrice?.[0]?.price || 0;
          const currency = product.totalPrice?.[0]?.currencyCode || 'XOF';
          const deliveryDate = product.deliveryCapabilities?.deliveryDate;

          rates.push({
            serviceType: product.productCode?.toLowerCase() || 'standard',
            serviceName: product.productName || 'DHL Express',
            totalPrice: Math.round(parseFloat(totalPrice) * 100), // Convertir en centimes
            currency: currency,
            estimatedDeliveryDays: deliveryDate
              ? Math.ceil((new Date(deliveryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : 3,
            estimatedDeliveryDate: deliveryDate,
          });
        });
      }

      // Si aucune donnée, retourner des tarifs par défaut
      if (rates.length === 0) {
        const basePrice = request.weight * 1000;
        rates.push({
          serviceType: 'standard',
          serviceName: 'DHL Express',
          totalPrice: Math.round(basePrice * 1.5),
          currency: 'XOF',
          estimatedDeliveryDays: 3,
        });
      }

      return rates;
    } catch (error) {
      logger.error('DHL getRates error', { error, request });

      // En cas d'erreur, retourner des tarifs estimés
      const basePrice = request.weight * 1000;
      return [
        {
          serviceType: 'standard',
          serviceName: 'DHL Express (Estimation)',
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
  async createLabel(request: DHLLabelRequest): Promise<DHLLabelResponse> {
    try {
      if (this.testMode) {
        return {
          labelNumber: `DHL-${Date.now()}`,
          trackingNumber: `DHL${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
          labelUrl: 'https://example.com/label.pdf',
          shippingCost: 5000,
          currency: 'XOF',
        };
      }

      const accessToken = await this.getAccessToken();

      // Préparer les données pour l'API DHL Shipment
      const shipment = request.shipment;
      const packageData = shipment.packages[0];

      const response = await fetch(`${this.apiUrl}/ship/v1/shipments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plannedShippingDateAndTime: new Date().toISOString(),
          pickup: {
            isRequested: false,
          },
          productCode: shipment.serviceType,
          accounts: [
            {
              typeCode: 'shipper',
              number: this.apiKey,
            },
          ],
          valueAddedServices: [],
          outputImageProperties: {
            printerDPI: 300,
            encodingFormat: 'pdf',
            imageOptions: [
              {
                typeCode: 'label',
                templateName: 'ECOM26_84_001',
                isRequested: true,
                hideAccountNumber: false,
                numberOfCopies: 1,
              },
            ],
          },
          customerDetails: {
            shipperDetails: {
              postalAddress: {
                postalCode: shipment.shipper.postalCode,
                cityName: shipment.shipper.city,
                countryCode: shipment.shipper.countryCode,
                addressLine1: shipment.shipper.addressLine1,
                addressLine2: shipment.shipper.addressLine2 || '',
              },
              contactInformation: {
                phone: shipment.shipper.contact?.phone || '',
                email: shipment.shipper.contact?.email || '',
                fullName: shipment.shipper.name,
              },
            },
            receiverDetails: {
              postalAddress: {
                postalCode: shipment.recipient.postalCode,
                cityName: shipment.recipient.city || '',
                countryCode: shipment.recipient.countryCode,
                addressLine1: shipment.recipient.addressLine1,
                addressLine2: shipment.recipient.addressLine2 || '',
              },
              contactInformation: {
                phone: shipment.recipient.contact?.phone || '',
                email: shipment.recipient.contact?.email || '',
                fullName: shipment.recipient.name,
              },
            },
          },
          content: {
            packages: [
              {
                weight: packageData.weight,
                dimensions: {
                  length: packageData.dimensions.length,
                  width: packageData.dimensions.width,
                  height: packageData.dimensions.height,
                },
              },
            ],
            unitOfMeasurement: 'metric',
            isCustomsDeclarable: false,
            declaredValue: 0,
            declaredValueCurrency: 'XOF',
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`DHL API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();

      // Extraire les informations de l'étiquette
      const shipmentDetails = data.shipmentDetails?.[0];
      const documents = data.documents?.[0];

      return {
        labelNumber: shipmentDetails?.shipmentTrackingNumber || `DHL-${Date.now()}`,
        trackingNumber: shipmentDetails?.shipmentTrackingNumber || '',
        labelUrl: documents?.label?.href || '',
        labelData: documents?.label?.content || '',
        shippingCost: parseFloat(shipmentDetails?.totalPrice?.[0]?.price || '0') * 100,
        currency: shipmentDetails?.totalPrice?.[0]?.currencyCode || 'XOF',
      };
    } catch (error) {
      logger.error('DHL createLabel error', { error, request });
      throw error;
    }
  }

  /**
   * Obtenir token d'accès (OAuth 2.0)
   */
  private async getAccessToken(): Promise<string> {
    try {
      const tokenUrl = this.testMode
        ? 'https://api-sandbox.dhl.com/rest/authenticate'
        : 'https://api.dhl.com/rest/authenticate';

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.apiKey,
          password: this.apiSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DHL OAuth error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.access_token || data.token;
    } catch (error) {
      logger.error('DHL getAccessToken error', { error });
      // Fallback: utiliser Basic Auth si OAuth échoue
      return btoa(`${this.apiKey}:${this.apiSecret}`);
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

      // Appel API DHL Tracking
      const response = await fetch(
        `${this.apiUrl}/tracking/v1/shipments?trackingNumber=${trackingNumber}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`DHL API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();

      // Parser les événements de suivi
      interface DHLShipment {
        events?: Array<{
          eventCode?: string;
          description?: string;
          location?: { address?: { addressLocality?: string } };
          timestamp?: string;
        }>;
      }
      const events: TrackingEvent[] = [];
      const shipments = (data.shipments || []) as DHLShipment[];

      shipments.forEach((shipment: DHLShipment) => {
        const eventsData = shipment.events || [];
        eventsData.forEach(event => {
          events.push({
            eventType: event.eventCode || 'unknown',
            eventDescription: event.description || '',
            eventLocation: event.location?.address?.addressLocality || '',
            eventTimestamp: event.timestamp || new Date().toISOString(),
          });
        });
      });

      return events;
    } catch (error) {
      logger.error('DHL trackShipment error', { error, trackingNumber });
      throw error;
    }
  }
}

export default DHLService;
