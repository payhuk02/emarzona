/**
 * Colissimo Shipping Integration
 * Service pour intégration API Colissimo (La Poste - France)
 */

import { logger } from '@/lib/logger';

export interface ColissimoRateRequest {
  from: {
    country: string;
    postalCode: string;
    city?: string;
  };
  to: {
    country: string;
    postalCode: string;
    city?: string;
  };
  weight: number;
  weightUnit: 'kg' | 'g';
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'mm';
  };
  serviceType?: string;
}

export interface ColissimoRate {
  serviceType: string;
  serviceName: string;
  shippingCost: number;
  currency: string;
  estimatedDelivery: string;
  transitTime?: number; // en jours
}

export interface ColissimoLabelRequest {
  from: {
    name: string;
    company?: string;
    address: string;
    addressLine2?: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
  };
  to: {
    name: string;
    company?: string;
    address: string;
    addressLine2?: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
  };
  package: {
    weight: number;
    weightUnit: 'kg' | 'g';
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: 'cm' | 'mm';
    };
    description?: string;
    value?: number;
  };
  serviceType: string;
  reference?: string;
}

export interface ColissimoLabelResponse {
  labelNumber: string;
  trackingNumber: string;
  labelUrl: string;
  shippingCost: number;
  currency: string;
  estimatedDelivery: string;
}

class ColissimoService {
  private contractNumber: string;
  private password: string;
  private testMode: boolean;
  private apiUrl: string;

  constructor(config: {
    contractNumber: string;
    password: string;
    testMode?: boolean;
  }) {
    this.contractNumber = config.contractNumber;
    this.password = config.password;
    this.testMode = config.testMode ?? false;
    this.apiUrl = this.testMode
      ? 'https://ws.colissimo.fr'
      : 'https://ws.colissimo.fr';
  }

  /**
   * Obtenir les tarifs de livraison
   */
  async getRates(request: ColissimoRateRequest): Promise<ColissimoRate[]> {
    try {
      if (this.testMode) {
        // Mode test - retourner des données mockées
        return [
          {
            serviceType: 'DOM',
            serviceName: 'Colissimo Domicile',
            shippingCost: 500,
            currency: 'EUR',
            estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            transitTime: 2,
          },
          {
            serviceType: 'BPR',
            serviceName: 'Colissimo Bureau de Poste',
            shippingCost: 400,
            currency: 'EUR',
            estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            transitTime: 2,
          },
          {
            serviceType: 'A2P',
            serviceName: 'Colissimo Access',
            shippingCost: 350,
            currency: 'EUR',
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            transitTime: 3,
          },
        ];
      }

      // Appel API Colissimo Rate
      const response = await fetch(`${this.apiUrl}/sls-ws/SlsServiceWSRest/2.0/calculateProducts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractNumber: this.contractNumber,
          password: this.password,
          productCode: 'DOM',
          depositDate: new Date().toISOString().split('T')[0],
          weight: request.weight,
          from: {
            zipCode: request.from.postalCode,
            country: request.from.country,
          },
          to: {
            zipCode: request.to.postalCode,
            country: request.to.country,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Colissimo API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Parser la réponse Colissimo
      const rates: ColissimoRate[] = data.products?.map((product: any) => ({
        serviceType: product.productCode || '',
        serviceName: product.productName || '',
        shippingCost: parseFloat(product.price || '0') * 100, // Convertir en centimes
        currency: 'EUR',
        estimatedDelivery: product.deliveryDate || '',
        transitTime: product.deliveryTime || 0,
      })) || [];

      return rates;
    } catch (error) {
      logger.error('Colissimo getRates error', { error, request });
      throw error;
    }
  }

  /**
   * Générer une étiquette
   */
  async createLabel(request: ColissimoLabelRequest): Promise<ColissimoLabelResponse> {
    try {
      if (this.testMode) {
        return {
          labelNumber: `COLI-${Date.now()}`,
          trackingNumber: `8${Math.random().toString().substring(2, 15)}`,
          labelUrl: 'https://example.com/label.pdf',
          shippingCost: 500,
          currency: 'EUR',
          estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }

      // Appel API Colissimo Label
      const response = await fetch(`${this.apiUrl}/sls-ws/SlsServiceWSRest/2.0/generateLabel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractNumber: this.contractNumber,
          password: this.password,
          outputFormat: {
            x: 0,
            y: 0,
          },
          letter: {
            service: {
              productCode: request.serviceType,
              depositDate: new Date().toISOString().split('T')[0],
            },
            parcel: {
              weight: request.package.weight,
            },
            sender: {
              address: {
                companyName: request.from.company || request.from.name,
                line1: request.from.address,
                line2: request.from.addressLine2 || '',
                city: request.from.city,
                zipCode: request.from.postalCode,
                countryCode: request.from.country,
              },
              addressee: {
                addresseeParcelRef: request.reference || '',
                address: {
                  companyName: request.to.company || request.to.name,
                  line1: request.to.address,
                  line2: request.to.addressLine2 || '',
                  city: request.to.city,
                  zipCode: request.to.postalCode,
                  countryCode: request.to.country,
                },
              },
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Colissimo API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        labelNumber: data.parcelNumber || `COLI-${Date.now()}`,
        trackingNumber: data.parcelNumber || `8${Math.random().toString().substring(2, 15)}`,
        labelUrl: data.parcelNumberLabel || 'https://example.com/label.pdf',
        shippingCost: parseFloat(data.parcel?.price || '0') * 100,
        currency: 'EUR',
        estimatedDelivery: data.parcel?.deliveryDate || '',
      };
    } catch (error) {
      logger.error('Colissimo createLabel error', { error, request });
      throw error;
    }
  }

  /**
   * Obtenir le suivi d'un colis
   */
  async trackShipment(trackingNumber: string): Promise<any> {
    try {
      if (this.testMode) {
        return {
          trackingNumber,
          status: 'in_transit',
          currentLocation: 'Paris, France',
          estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          events: [
            {
              date: new Date().toISOString(),
              location: 'Paris, France',
              description: 'Colis en transit',
            },
          ],
        };
      }

      const response = await fetch(`${this.apiUrl}/sls-ws/SlsServiceWSRest/2.0/getLetterParcelStatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractNumber: this.contractNumber,
          password: this.password,
          parcelNumber: trackingNumber,
        }),
      });

      if (!response.ok) {
        throw new Error(`Colissimo API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        trackingNumber: data.parcelNumber || trackingNumber,
        status: data.status || 'unknown',
        currentLocation: data.location || '',
        estimatedDelivery: data.deliveryDate || '',
        events: data.events?.map((event: any) => ({
          date: event.date || '',
          location: event.location || '',
          description: event.description || '',
        })) || [],
      };
    } catch (error) {
      logger.error('Colissimo trackShipment error', { error, trackingNumber });
      throw error;
    }
  }
}

export default ColissimoService;


