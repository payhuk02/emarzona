/**
 * Stripe Payment Integration
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

export class StripeProvider extends BasePaymentProvider {
  private stripeApiUrl = 'https://api.stripe.com/v1';

  getProviderInfo(): PaymentProvider {
    return {
      name: 'Stripe',
      code: 'stripe',
      supportedCurrencies: [
        'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK',
        'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RUB', 'TRY', 'BRL', 'MXN',
        'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'VES', 'ZAR', 'NGN', 'KES', 'EGP',
        'XOF', 'XAF', 'MAD', 'TND', 'DZD', 'XPF', 'SGD', 'HKD', 'TWD', 'KRW',
        'CNY', 'INR', 'IDR', 'THB', 'MYR', 'PHP', 'VND', 'PKR', 'BDT', 'LKR',
        'NZD', 'AED', 'SAR', 'ILS', 'JOD', 'KWD', 'BHD', 'OMR', 'QAR', 'LBP',
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
        PaymentFeature.INSTALLMENTS,
        PaymentFeature.REFUND,
        PaymentFeature.WEBHOOK,
      ],
    };
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (this.testMode) {
        // Mode test - retourner une réponse mockée
        return {
          success: true,
          paymentId: `stripe_test_${Date.now()}`,
          paymentUrl: `https://checkout.stripe.com/test/${Date.now()}`,
          checkoutSessionId: `cs_test_${Date.now()}`,
          status: PaymentStatus.PENDING,
          amount: request.amount,
          currency: request.currency,
          metadata: request.metadata,
        };
      }

      // Appel API Stripe réel
      const response = await fetch(`${this.stripeApiUrl}/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'payment_method_types[]': 'card',
          'mode': 'payment',
          'success_url': request.returnUrl || `${window.location.origin}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
          'cancel_url': request.cancelUrl || `${window.location.origin}/payments/cancel`,
          'line_items[0][price_data][currency]': request.currency.toLowerCase(),
          'line_items[0][price_data][product_data][name]': request.description || 'Order',
          'line_items[0][price_data][unit_amount]': Math.round(request.amount * 100).toString(), // Stripe utilise les centimes
          'line_items[0][quantity]': '1',
          'customer_email': request.customerEmail || '',
          'metadata[order_id]': request.orderId || '',
          'metadata[customer_id]': request.customerId || '',
        }).toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Stripe API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        paymentId: data.id,
        paymentUrl: data.url,
        checkoutSessionId: data.id,
        status: PaymentStatus.PENDING,
        amount: request.amount,
        currency: request.currency,
        metadata: {
          ...request.metadata,
          stripe_session_id: data.id,
        },
      };
    } catch (error) {
      logger.error('Stripe createPayment error', { error, request });
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

      const response = await fetch(`${this.stripeApiUrl}/checkout/sessions/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.statusText}`);
      }

      const session = await response.json();

      let status: PaymentStatus = PaymentStatus.PENDING;
      if (session.payment_status === 'paid') {
        status = PaymentStatus.COMPLETED;
      } else if (session.payment_status === 'unpaid') {
        status = PaymentStatus.PENDING;
      } else if (session.status === 'expired') {
        status = PaymentStatus.CANCELLED;
      }

      return {
        success: status === PaymentStatus.COMPLETED,
        paymentId: session.id,
        checkoutSessionId: session.id,
        status,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency?.toUpperCase() || 'USD',
        metadata: session.metadata,
      };
    } catch (error) {
      logger.error('Stripe verifyPayment error', { error, paymentId });
      throw error;
    }
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    try {
      if (this.testMode) {
        return {
          success: true,
          refundId: `re_test_${Date.now()}`,
          amount: request.amount || 0,
          currency: 'USD',
          status: RefundStatus.COMPLETED,
        };
      }

      // Récupérer d'abord le payment intent depuis la session
      const session = await this.verifyPayment(request.paymentId);
      
      // Créer le remboursement
      const response = await fetch(`${this.stripeApiUrl}/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'payment_intent': request.paymentId,
          'amount': request.amount ? Math.round(request.amount * 100).toString() : '',
          'reason': request.reason || 'requested_by_customer',
        }).toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Stripe API error: ${error.error?.message || response.statusText}`);
      }

      const refund = await response.json();

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency.toUpperCase(),
        status: refund.status === 'succeeded' ? RefundStatus.COMPLETED : RefundStatus.PENDING,
      };
    } catch (error) {
      logger.error('Stripe refund error', { error, request });
      throw error;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // TODO: Implémenter la vérification de signature Stripe
    // Utiliser crypto.createHmac avec le webhook secret
    return true; // Placeholder
  }

  parseWebhookEvent(payload: any): WebhookEvent {
    return {
      eventType: payload.type,
      paymentId: payload.data?.object?.id || '',
      data: payload.data?.object || {},
      timestamp: new Date(payload.created * 1000).toISOString(),
      signature: payload.signature,
    };
  }
}


