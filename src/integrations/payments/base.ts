/**
 * Classe de base abstraite pour tous les providers de paiement
 */

import type {
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  WebhookEvent,
  PaymentProvider,
} from './types';

export abstract class BasePaymentProvider {
  protected apiKey: string;
  protected apiSecret?: string;
  protected testMode: boolean;
  protected config: Record<string, unknown>;

  constructor(config: {
    apiKey: string;
    apiSecret?: string;
    testMode?: boolean;
    [key: string]: unknown;
  }) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.testMode = config.testMode ?? false;
    this.config = config;
  }

  /**
   * Informations sur le provider
   */
  abstract getProviderInfo(): PaymentProvider;

  /**
   * Créer un paiement
   */
  abstract createPayment(request: PaymentRequest): Promise<PaymentResponse>;

  /**
   * Vérifier le statut d'un paiement
   */
  abstract verifyPayment(paymentId: string): Promise<PaymentResponse>;

  /**
   * Effectuer un remboursement
   */
  abstract refund(request: RefundRequest): Promise<RefundResponse>;

  /**
   * Vérifier la signature d'un webhook
   */
  abstract verifyWebhookSignature(
    payload: string,
    signature: string
  ): boolean;

  /**
   * Parser un événement webhook
   */
  abstract parseWebhookEvent(payload: unknown): WebhookEvent;

  /**
   * Vérifier si le provider supporte une devise
   */
  supportsCurrency(currency: string): boolean {
    return this.getProviderInfo().supportedCurrencies.includes(currency);
  }

  /**
   * Vérifier si le provider supporte un pays
   */
  supportsCountry(country: string): boolean {
    return this.getProviderInfo().supportedCountries.includes(country);
  }

  /**
   * Vérifier si le provider supporte une fonctionnalité
   */
  supportsFeature(feature: string): boolean {
    return this.getProviderInfo().features.includes(feature);
  }
}


