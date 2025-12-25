/**
 * PayPal Payment Integration
 * Provider de paiement international
 */

import { BasePaymentProvider } from './base';
import type {
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  WebhookEvent,
  PaymentProvider,
  PaymentFeature,
  PaymentStatus,
  RefundStatus,
} from './types';
import { logger } from '@/lib/logger';

export class PayPalProvider extends BasePaymentProvider {
  private paypalApiUrl: string;

  constructor(config: {
    apiKey: string;
    apiSecret?: string;
    testMode?: boolean;
    [key: string]: any;
  }) {
    super(config);
    this.paypalApiUrl = this.testMode
      ? 'https://api.sandbox.paypal.com'
      : 'https://api.paypal.com';
  }

  getProviderInfo(): PaymentProvider {
    return {
      name: 'PayPal',
      code: 'paypal',
      supportedCurrencies: [
        'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK',
        'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'BRL', 'MXN', 'ARS', 'CLP',
        'COP', 'PEN', 'UYU', 'VES', 'ZAR', 'NGN', 'KES', 'EGP', 'XOF', 'XAF',
        'MAD', 'TND', 'DZD', 'SGD', 'HKD', 'TWD', 'KRW', 'CNY', 'INR', 'IDR',
        'THB', 'MYR', 'PHP', 'VND', 'PKR', 'BDT', 'LKR', 'NZD', 'AED', 'SAR',
        'ILS', 'JOD', 'KWD', 'BHD', 'OMR', 'QAR', 'LBP',
      ],
      supportedCountries: [
        'US', 'CA', 'GB', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'CH',
        'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'GR', 'PT',
        'AU', 'NZ', 'JP', 'SG', 'HK', 'TW', 'KR', 'CN', 'IN', 'ID', 'TH', 'MY',
        'PH', 'VN', 'PK', 'BD', 'LK', 'BR', 'MX', 'AR', 'CL', 'CO', 'PE', 'UY',
        'ZA', 'NG', 'KE', 'EG', 'SN', 'CI', 'CM', 'MA', 'TN', 'DZ', 'AE', 'SA',
        'IL', 'JO', 'KW', 'BH', 'OM', 'QA', 'LB',
      ],
      features: [
        PaymentFeature.ONE_TIME,
        PaymentFeature.RECURRING,
        PaymentFeature.REFUND,
        PaymentFeature.WEBHOOK,
      ],
    };
  }

  private async getAccessToken(): Promise<string> {
    if (this.testMode) {
      return 'mock_paypal_token';
    }

    const response = await fetch(`${this.paypalApiUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${btoa(`${this.apiKey}:${this.apiSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`PayPal OAuth error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (this.testMode) {
        return {
          success: true,
          paymentId: `paypal_test_${Date.now()}`,
          paymentUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${Date.now()}`,
          checkoutSessionId: `EC-${Date.now()}`,
          status: PaymentStatus.PENDING,
          amount: request.amount,
          currency: request.currency,
          metadata: request.metadata,
        };
      }

      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.paypalApiUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': `order_${Date.now()}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: request.currency,
                value: request.amount.toFixed(2),
              },
              description: request.description || 'Order',
              custom_id: request.orderId || '',
            },
          ],
          application_context: {
            brand_name: 'Emarzona',
            landing_page: 'BILLING',
            user_action: 'PAY_NOW',
            return_url: request.returnUrl || `${window.location.origin}/payments/success`,
            cancel_url: request.cancelUrl || `${window.location.origin}/payments/cancel`,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`PayPal API error: ${error.message || response.statusText}`);
      }

      const order = await response.json();

      // Trouver le lien d'approbation
      const approveLink = order.links?.find((link: any) => link.rel === 'approve');

      return {
        success: true,
        paymentId: order.id,
        paymentUrl: approveLink?.href || '',
        checkoutSessionId: order.id,
        status: PaymentStatus.PENDING,
        amount: request.amount,
        currency: request.currency,
        metadata: {
          ...request.metadata,
          paypal_order_id: order.id,
        },
      };
    } catch (error) {
      logger.error('PayPal createPayment error', { error, request });
      throw error;
    }
  }

  async verifyPayment(paymentId: string): Promise<PaymentResponse> {
    try {
      if (this.testMode) {
        return {
          success: true,
          paymentId,
          status: PaymentStatus.COMPLETED,
          amount: 0,
          currency: 'USD',
        };
      }

      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.paypalApiUrl}/v2/checkout/orders/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`PayPal API error: ${response.statusText}`);
      }

      const order = await response.json();

      let status: PaymentStatus = PaymentStatus.PENDING;
      if (order.status === 'COMPLETED') {
        status = PaymentStatus.COMPLETED;
      } else if (order.status === 'APPROVED') {
        status = PaymentStatus.PROCESSING;
      } else if (order.status === 'CANCELLED') {
        status = PaymentStatus.CANCELLED;
      }

      const amount = parseFloat(order.purchase_units?.[0]?.amount?.value || '0');
      const currency = order.purchase_units?.[0]?.amount?.currency_code || 'USD';

      return {
        success: status === PaymentStatus.COMPLETED,
        paymentId: order.id,
        checkoutSessionId: order.id,
        status,
        amount,
        currency,
        metadata: {
          paypal_order_id: order.id,
          paypal_status: order.status,
        },
      };
    } catch (error) {
      logger.error('PayPal verifyPayment error', { error, paymentId });
      throw error;
    }
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    try {
      if (this.testMode) {
        return {
          success: true,
          refundId: `refund_test_${Date.now()}`,
          amount: request.amount || 0,
          currency: 'USD',
          status: RefundStatus.COMPLETED,
        };
      }

      const accessToken = await this.getAccessToken();

      // Récupérer d'abord les détails de la commande pour obtenir le capture_id
      const order = await this.verifyPayment(request.paymentId);
      
      // Pour PayPal, on doit capturer d'abord puis rembourser
      // TODO: Implémenter la logique complète de capture puis refund

      const response = await fetch(`${this.paypalApiUrl}/v2/payments/captures/${request.paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: request.amount
            ? {
                value: request.amount.toFixed(2),
                currency_code: order.currency,
              }
            : undefined,
          note_to_payer: request.reason || 'Refund requested',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`PayPal API error: ${error.message || response.statusText}`);
      }

      const refund = await response.json();

      return {
        success: true,
        refundId: refund.id,
        amount: parseFloat(refund.amount?.value || '0'),
        currency: refund.amount?.currency_code || 'USD',
        status: refund.status === 'COMPLETED' ? RefundStatus.COMPLETED : RefundStatus.PENDING,
      };
    } catch (error) {
      logger.error('PayPal refund error', { error, request });
      throw error;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // TODO: Implémenter la vérification de signature PayPal
    return true; // Placeholder
  }

  parseWebhookEvent(payload: any): WebhookEvent {
    return {
      eventType: payload.event_type,
      paymentId: payload.resource?.id || payload.resource?.order_id || '',
      data: payload.resource || {},
      timestamp: payload.create_time || new Date().toISOString(),
      signature: payload.signature,
    };
  }
}


