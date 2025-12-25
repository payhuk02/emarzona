/**
 * Flutterwave Payment Integration
 * Provider de paiement pour l'Afrique
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

export class FlutterwaveProvider extends BasePaymentProvider {
  private flutterwaveApiUrl = 'https://api.flutterwave.com/v3';

  getProviderInfo(): PaymentProvider {
    return {
      name: 'Flutterwave',
      code: 'flutterwave',
      supportedCurrencies: [
        'NGN', 'KES', 'UGX', 'TZS', 'ZAR', 'GHS', 'RWF', 'XOF', 'XAF', 'EGP',
        'ZMW', 'USD', 'EUR', 'GBP',
      ],
      supportedCountries: [
        'NG', 'KE', 'UG', 'TZ', 'ZA', 'GH', 'RW', 'SN', 'CI', 'CM', 'EG', 'ZM',
        'US', 'GB', 'FR', 'DE',
      ],
      features: [
        PaymentFeature.ONE_TIME,
        PaymentFeature.RECURRING,
        PaymentFeature.MOBILE_MONEY,
        PaymentFeature.REFUND,
        PaymentFeature.WEBHOOK,
      ],
    };
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (this.testMode) {
        return {
          success: true,
          paymentId: `flutterwave_test_${Date.now()}`,
          paymentUrl: `https://checkout.flutterwave.com/v3/hosted/pay/${Date.now()}`,
          checkoutSessionId: `flw_${Date.now()}`,
          status: PaymentStatus.PENDING,
          amount: request.amount,
          currency: request.currency,
          metadata: request.metadata,
        };
      }

      const response = await fetch(`${this.flutterwaveApiUrl}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: `emarzona_${Date.now()}_${request.orderId || ''}`,
          amount: request.amount,
          currency: request.currency,
          redirect_url: request.returnUrl || `${window.location.origin}/payments/success`,
          payment_options: 'card,account,ussd,banktransfer,mobilemoney',
          customer: {
            email: request.customerEmail || '',
            name: request.customerName || '',
          },
          customizations: {
            title: 'Emarzona',
            description: request.description || 'Order Payment',
          },
          meta: request.metadata || {},
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Flutterwave API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== 'success') {
        throw new Error(`Flutterwave error: ${data.message || 'Payment creation failed'}`);
      }

      return {
        success: true,
        paymentId: data.data.tx_ref,
        paymentUrl: data.data.link,
        checkoutSessionId: data.data.tx_ref,
        transactionId: data.data.id?.toString(),
        status: PaymentStatus.PENDING,
        amount: request.amount,
        currency: request.currency,
        metadata: {
          ...request.metadata,
          flutterwave_tx_ref: data.data.tx_ref,
          flutterwave_id: data.data.id,
        },
      };
    } catch (error) {
      logger.error('Flutterwave createPayment error', { error, request });
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
          currency: 'NGN',
        };
      }

      // Flutterwave utilise tx_ref pour vérifier
      const response = await fetch(
        `${this.flutterwaveApiUrl}/transactions/verify_by_reference?tx_ref=${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Flutterwave API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== 'success') {
        throw new Error(`Flutterwave error: ${data.message || 'Verification failed'}`);
      }

      const transaction = data.data;

      let status: PaymentStatus = PaymentStatus.PENDING;
      if (transaction.status === 'successful') {
        status = PaymentStatus.COMPLETED;
      } else if (transaction.status === 'failed') {
        status = PaymentStatus.FAILED;
      } else if (transaction.status === 'cancelled') {
        status = PaymentStatus.CANCELLED;
      }

      return {
        success: status === PaymentStatus.COMPLETED,
        paymentId: transaction.tx_ref,
        transactionId: transaction.id?.toString(),
        status,
        amount: parseFloat(transaction.amount?.toString() || '0'),
        currency: transaction.currency || 'NGN',
        metadata: {
          flutterwave_tx_ref: transaction.tx_ref,
          flutterwave_id: transaction.id,
          flutterwave_status: transaction.status,
        },
      };
    } catch (error) {
      logger.error('Flutterwave verifyPayment error', { error, paymentId });
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
          currency: 'NGN',
          status: RefundStatus.COMPLETED,
        };
      }

      // Récupérer d'abord les détails de la transaction
      const transaction = await this.verifyPayment(request.paymentId);

      const response = await fetch(`${this.flutterwaveApiUrl}/transactions/${transaction.transactionId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: request.amount || transaction.amount,
          comments: request.reason || 'Refund requested',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Flutterwave API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== 'success') {
        throw new Error(`Flutterwave error: ${data.message || 'Refund failed'}`);
      }

      return {
        success: true,
        refundId: data.data.id?.toString() || `refund_${Date.now()}`,
        amount: request.amount || transaction.amount,
        currency: transaction.currency,
        status: RefundStatus.COMPLETED,
      };
    } catch (error) {
      logger.error('Flutterwave refund error', { error, request });
      throw error;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // TODO: Implémenter la vérification de signature Flutterwave
    // Utiliser crypto.createHmac avec le secret hash
    return true; // Placeholder
  }

  parseWebhookEvent(payload: any): WebhookEvent {
    return {
      eventType: payload.event,
      paymentId: payload.data.tx_ref || payload.data.id?.toString() || '',
      data: payload.data || {},
      timestamp: new Date().toISOString(),
      signature: payload.signature,
    };
  }
}


