/**
 * Types communs pour toutes les intégrations de paiement
 */

export interface PaymentProvider {
  name: string;
  code: string;
  supportedCurrencies: string[];
  supportedCountries: string[];
  features: PaymentFeature[];
}

export enum PaymentFeature {
  ONE_TIME = 'one_time',
  RECURRING = 'recurring',
  INSTALLMENTS = 'installments',
  ESCROW = 'escrow',
  PARTIAL = 'partial',
  REFUND = 'refund',
  WEBHOOK = 'webhook',
  MOBILE_MONEY = 'mobile_money',
  CRYPTO = 'crypto',
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  orderId?: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  metadata?: Record<string, any>;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  paymentUrl?: string;
  checkoutSessionId?: string;
  transactionId?: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // Montant partiel, si non spécifié = remboursement total
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
  amount: number;
  currency: string;
  status: RefundStatus;
}

export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface WebhookEvent {
  eventType: string;
  paymentId: string;
  data: Record<string, any>;
  timestamp: string;
  signature?: string;
}


